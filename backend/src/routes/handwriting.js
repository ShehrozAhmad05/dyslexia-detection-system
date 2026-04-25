const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const HandwritingResult = require('../models/HandwritingResult');
const Assessment = require('../models/Assessment');
const { protect } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/handwriting');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId_timestamp_originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `${req.user.id}_${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|bmp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, bmp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// @route   GET /api/handwriting/sentence
// @desc    Get random screening sentence for handwriting test
// @access  Private
router.get('/sentence', protect, async (req, res) => {
  try {
    const mlClient = require('../utils/mlClient');
    const sentence = await mlClient.getScreeningSentence();
    res.status(200).json({
      success: true,
      sentence,
      instruction: 'Please write this sentence in print style'
    });
  } catch (error) {
    console.error('Get sentence error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get screening sentence',
      error: error.message
    });
  }
});

// @route   POST /api/handwriting/upload
// @desc    Upload handwriting image
// @access  Private
router.post('/upload', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    // Create handwriting result record
    const handwritingResult = await HandwritingResult.create({
      user: req.user.id,
      imagePath: `/uploads/handwriting/${req.file.filename}`,
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      status: 'pending',
      expectedSentence: req.body.expectedSentence || null
    });

    // Create or update assessment record
    let assessment = await Assessment.findOne({
      user: req.user.id,
      status: 'in_progress'
    });

    if (!assessment) {
      assessment = await Assessment.create({
        user: req.user.id,
        handwritingResult: handwritingResult._id
      });
    } else {
      assessment.handwritingResult = handwritingResult._id;
      await assessment.save();
    }

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      result: {
        id: handwritingResult._id,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        status: handwritingResult.status,
        imagePath: handwritingResult.imagePath,
        expectedSentence: handwritingResult.expectedSentence
      }
    });
  } catch (error) {
    // Clean up uploaded file if database save fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during upload',
      error: error.message
    });
  }
});

// @route   POST /api/handwriting/analyze/:id
// @desc    Analyze handwriting using Google Vision ML pipeline
// @access  Private
router.post('/analyze/:id', protect, async (req, res) => {
  const path = require('path');
  const mlClient = require('../utils/mlClient');

  try {
    // Step 1: Find handwriting result
    const handwritingResult = await HandwritingResult.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!handwritingResult) {
      return res.status(404).json({
        success: false,
        message: 'Handwriting result not found'
      });
    }

    if (handwritingResult.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This image has already been analyzed'
      });
    }

    // Step 2: Check expected sentence exists
    if (!handwritingResult.expectedSentence) {
      return res.status(400).json({
        success: false,
        message: 'No expected sentence found for this result. Please restart the test.'
      });
    }

    // Step 3: Update status to analyzing
    handwritingResult.status = 'analyzing';
    await handwritingResult.save();

    // Step 4: Build absolute image path
    const imagePath = path.join(
      __dirname,
      '../../',
      handwritingResult.imagePath
    );

    // Step 5: Check ML service is available
    const mlAvailable = await mlClient.isAvailable();
    if (!mlAvailable) {
      handwritingResult.status = 'failed';
      await handwritingResult.save();
      return res.status(503).json({
        success: false,
        message: 'ML service is unavailable. Please ensure the ML server is running.'
      });
    }

    // Step 6: Call ML service
    const mlResult = await mlClient.analyzeHandwriting(
      imagePath,
      handwritingResult.expectedSentence
    );

    if (!mlResult.success) {
      handwritingResult.status = 'failed';
      await handwritingResult.save();
      return res.status(500).json({
        success: false,
        message: 'ML analysis failed',
        error: mlResult.error
      });
    }

    const mlData = mlResult.data;

    // Step 7: Map ML response to database fields
    const analysisResults = {
      // New ML fields
      overallScore: mlData.overall_score,
      reversalCount: mlData.reversal_count,
      substitutionCount: mlData.substitution_count,
      multiErrorCount: mlData.multi_error_count,
      correctCount: mlData.correct_count,
      reversalRate: mlData.reversal_rate,
      errorRate: mlData.error_rate,
      wordResults: mlData.word_results.map(wr => ({
        position: wr.position,
        expectedWord: wr.expected_word,
        writtenWord: wr.written_word,
        errorType: wr.error_type,
        detail: wr.detail || null
      })),
      overrideApplied: mlData.override_applied,
      unableToAssess: mlData.unable_to_assess,
      featureScores: {
        reversalScore: mlData.feature_scores?.reversal_score,
        errorScore: mlData.feature_scores?.error_score
      },
      // Map to existing fields for backward compatibility
      riskScore: mlData.overall_score / 100,
      recommendations: buildRecommendations(mlData),
      confidence: 0.90,
      processingTime: mlResult.processingTime
    };

    // Step 8: Save results
    handwritingResult.status = 'completed';
    handwritingResult.analysisResults = analysisResults;
    handwritingResult.detectedSentence = mlData.detected_sentence;
    handwritingResult.mlModelVersion = 'google-vision-v1.0';
    handwritingResult.analyzedAt = new Date();
    await handwritingResult.save();

    // Step 9: Return response
    res.status(200).json({
      success: true,
      message: 'Analysis completed successfully',
      result: {
        id: handwritingResult._id,
        status: handwritingResult.status,
        expectedSentence: handwritingResult.expectedSentence,
        detectedSentence: handwritingResult.detectedSentence,
        overallScore: mlData.overall_score,
        riskLevel: handwritingResult.riskLevel,
        reversalCount: mlData.reversal_count,
        substitutionCount: mlData.substitution_count,
        multiErrorCount: mlData.multi_error_count,
        correctCount: mlData.correct_count,
        reversalRate: mlData.reversal_rate,
        errorRate: mlData.error_rate,
        wordResults: analysisResults.wordResults,
        featureScores: analysisResults.featureScores,
        overrideApplied: mlData.override_applied,
        unableToAssess: mlData.unable_to_assess,
        recommendations: analysisResults.recommendations,
        disclaimer: mlData.disclaimer,
        analyzedAt: handwritingResult.analyzedAt,
        processingTime: mlResult.processingTime
      }
    });
  } catch (error) {
    // If error occurs after status set to analyzing, reset to failed
    try {
      await HandwritingResult.findByIdAndUpdate(
        req.params.id,
        { status: 'failed' }
      );
    } catch {}
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during analysis',
      error: error.message
    });
  }
});

// Helper function to build recommendations from ML results
function buildRecommendations(mlData) {
  const recommendations = [];

  if (mlData.unable_to_assess) {
    recommendations.push(
      'Image could not be read clearly. Please retake with better lighting.'
    );
    return recommendations;
  }

  if (mlData.reversal_count > 0) {
    recommendations.push(
      `${mlData.reversal_count} letter reversal(s) detected. ` +
      'Practice writing b/d, p/q pairs with guided worksheets.'
    );
  }

  if (mlData.substitution_count > 0) {
    recommendations.push(
      'Some letters were written incorrectly. ' +
      'Review letter formation with a teacher or therapist.'
    );
  }

  if (mlData.multi_error_count > 0) {
    recommendations.push(
      'Some words contained multiple errors or were skipped. ' +
      'Practice copying short sentences daily.'
    );
  }

  if (mlData.overall_score >= 67) {
    recommendations.push(
      'High risk indicators detected. ' +
      'A formal dyslexia assessment by a qualified professional is recommended.'
    );
  } else if (mlData.overall_score >= 34) {
    recommendations.push(
      'Moderate risk indicators detected. ' +
      'Monitor handwriting progress and consider further screening.'
    );
  } else {
    recommendations.push(
      'Low risk indicators. Continue regular handwriting practice.'
    );
  }

  recommendations.push(
    'This is a screening tool only. ' +
    'Results do not constitute a clinical diagnosis.'
  );

  return recommendations;
}

// @route   GET /api/handwriting/results/:id
// @desc    Get handwriting analysis results
// @access  Private
router.get('/results/:id', protect, async (req, res) => {
  try {
    const handwritingResult = await HandwritingResult.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!handwritingResult) {
      return res.status(404).json({
        success: false,
        message: 'Handwriting result not found'
      });
    }

    res.status(200).json({
      success: true,
      result: {
        id: handwritingResult._id,
        status: handwritingResult.status,
        imagePath: handwritingResult.imagePath,
        originalFileName: handwritingResult.originalFileName,
        expectedSentence: handwritingResult.expectedSentence || null,
        detectedSentence: handwritingResult.detectedSentence || null,
        // New ML fields
        overallScore: handwritingResult.analysisResults?.overallScore || null,
        riskLevel: handwritingResult.riskLevel,
        reversalCount: handwritingResult.analysisResults?.reversalCount || null,
        substitutionCount: handwritingResult.analysisResults?.substitutionCount || null,
        multiErrorCount: handwritingResult.analysisResults?.multiErrorCount || null,
        correctCount: handwritingResult.analysisResults?.correctCount || null,
        reversalRate: handwritingResult.analysisResults?.reversalRate || null,
        errorRate: handwritingResult.analysisResults?.errorRate || null,
        wordResults: handwritingResult.analysisResults?.wordResults || [],
        featureScores: handwritingResult.analysisResults?.featureScores || null,
        overrideApplied: handwritingResult.analysisResults?.overrideApplied || false,
        unableToAssess: handwritingResult.analysisResults?.unableToAssess || false,
        // Existing fields kept for backward compatibility
        riskScore: handwritingResult.analysisResults?.riskScore || null,
        detectedIssues: handwritingResult.analysisResults?.detectedIssues || [],
        recommendations: handwritingResult.analysisResults?.recommendations || [],
        confidence: handwritingResult.analysisResults?.confidence || null,
        analyzedAt: handwritingResult.analyzedAt,
        createdAt: handwritingResult.createdAt
      }
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/handwriting/history
// @desc    Get user's handwriting test history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const results = await HandwritingResult.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-__v');

    res.status(200).json({
      success: true,
      count: results.length,
      results: results.map(r => ({
        id: r._id,
        status: r.status,
        originalFileName: r.originalFileName,
        riskScore: r.analysisResults?.riskScore || null,
        riskLevel: r.riskLevel,
        analyzedAt: r.analyzedAt,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/handwriting/:id
// @desc    Delete handwriting result
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const handwritingResult = await HandwritingResult.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!handwritingResult) {
      return res.status(404).json({
        success: false,
        message: 'Handwriting result not found'
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../../', handwritingResult.imagePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await handwritingResult.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Handwriting result deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
