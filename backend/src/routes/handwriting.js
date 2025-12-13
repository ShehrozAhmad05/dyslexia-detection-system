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
      status: 'pending'
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
        imagePath: handwritingResult.imagePath
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
// @desc    Analyze handwriting (MOCK - returns fake data)
// @access  Private
router.post('/analyze/:id', protect, async (req, res) => {
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

    if (handwritingResult.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This image has already been analyzed'
      });
    }

    // Update status to analyzing
    handwritingResult.status = 'analyzing';
    await handwritingResult.save();

    // Simulate analysis delay (500ms)
    await new Promise(resolve => setTimeout(resolve, 500));

    // MOCK ANALYSIS RESULTS (Replace this with real ML API call later)
    const mockResults = {
      riskScore: Math.random() * 0.4 + 0.3, // Random score between 0.3 and 0.7
      detectedIssues: [
        {
          type: 'letter_reversal',
          count: Math.floor(Math.random() * 5) + 1,
          severity: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)],
          examples: ['b/d confusion', 'p/q reversal']
        },
        {
          type: 'irregular_spacing',
          count: Math.floor(Math.random() * 8) + 2,
          severity: ['moderate', 'high'][Math.floor(Math.random() * 2)],
          examples: ['uneven word spacing', 'crowded letters']
        },
        {
          type: 'inconsistent_size',
          count: Math.floor(Math.random() * 4) + 1,
          severity: 'low',
          examples: ['varying letter heights']
        }
      ],
      recommendations: [
        'Practice letter formation with guided worksheets',
        'Use lined paper with spacing guides',
        'Perform daily handwriting exercises for 10-15 minutes',
        'Work on letter recognition activities'
      ],
      confidence: 0.85,
      processingTime: 487
    };

    // Update handwriting result with mock analysis
    handwritingResult.status = 'completed';
    handwritingResult.analysisResults = mockResults;
    handwritingResult.analyzedAt = new Date();
    await handwritingResult.save();

    res.status(200).json({
      success: true,
      message: 'Analysis completed successfully',
      result: {
        id: handwritingResult._id,
        status: handwritingResult.status,
        riskScore: mockResults.riskScore,
        riskLevel: handwritingResult.riskLevel,
        detectedIssues: mockResults.detectedIssues,
        recommendations: mockResults.recommendations,
        confidence: mockResults.confidence,
        analyzedAt: handwritingResult.analyzedAt
      }
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during analysis',
      error: error.message
    });
  }
});

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
        riskScore: handwritingResult.analysisResults?.riskScore || null,
        riskLevel: handwritingResult.riskLevel,
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