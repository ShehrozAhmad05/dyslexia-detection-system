const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');
const { protect } = require('../middleware/auth');

// @route   POST /api/assessment/start
// @desc    Start a new comprehensive assessment
// @access  Private
router.post('/start', protect, async (req, res) => {
  try {
    // Check if user already has an in-progress assessment
    const existing = await Assessment.findOne({
      user: req.user.id,
      status: 'in_progress'
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Resuming existing assessment',
        assessment: {
          id: existing._id,
          currentStep: existing.currentStep,
          completedModules: existing.getCompletedModules(),
          status: existing.status
        }
      });
    }

    // Create new assessment
    try {
      const assessment = await Assessment.create({
        user: req.user.id,
        assessmentType: 'comprehensive',
        status: 'in_progress',
        currentStep: 'handwriting'
      });

      res.status(201).json({
        success: true,
        message: 'Assessment started',
        assessment: {
          id: assessment._id,
          currentStep: assessment.currentStep,
          completedModules: [],
          status: assessment.status
        }
      });
    } catch (createErr) {
      if (createErr.code === 11000) {
        // Duplicate in_progress — fetch and return existing
        const existing = await Assessment.findOne({
          user: req.user.id,
          status: 'in_progress'
        });
        if (existing) {
          return res.status(200).json({
            success: true,
            message: 'Resuming existing assessment',
            assessment: {
              id: existing._id,
              currentStep: existing.currentStep,
              completedModules: existing.getCompletedModules(),
              status: existing.status
            }
          });
        }
      }
      throw createErr;
    }
  } catch (error) {
    console.error('Start assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start assessment',
      error: error.message
    });
  }
});

// @route   GET /api/assessment/current
// @desc    Get user's current in-progress assessment
// @access  Private
router.get('/current', protect, async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      user: req.user.id,
      status: 'in_progress'
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'No assessment in progress'
      });
    }

    res.status(200).json({
      success: true,
      assessment: {
        id: assessment._id,
        currentStep: assessment.currentStep,
        completedModules: assessment.getCompletedModules(),
        status: assessment.status,
        createdAt: assessment.createdAt
      }
    });
  } catch (error) {
    console.error('Get current assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/assessment/:id/fusion
// @desc    Get full fusion result for completed assessment
// @access  Private
router.get('/:id/fusion', protect, async (req, res) => {
  try {
    const assessment = await Assessment
      .findOne({ _id: req.params.id, user: req.user.id })
      .populate('handwritingResult')
      .populate('readingResult')
      .populate('keystrokeResult')
      .populate('memoryResult');

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Calculate overall risk with populated data
    assessment.calculateOverallRisk();

    // Build combined recommendations
    const combinedRecommendations = buildCombinedRecommendations(assessment);
    assessment.fusionAnalysis.combinedRecommendations = combinedRecommendations;
    const handwritingExpectedSentence = getHandwritingSentence(assessment.handwritingResult, 'expected');
    const handwritingDetectedSentence = getHandwritingSentence(assessment.handwritingResult, 'detected');

    // Save updated scores
    await assessment.save();
    const { generateFullExplainability } =
      require('../utils/explainabilityEngine');
    const explainability = await generateFullExplainability(assessment);

    res.status(200).json({
      success: true,
      assessment: {
        id: assessment._id,
        status: assessment.status,
        overallRiskScore: assessment.overallRiskScore,
        riskLevel: assessment.riskLevel,
        completedModules: assessment.getCompletedModules(),
        fusionAnalysis: {
          moduleScores: assessment.fusionAnalysis.moduleScores,
          moduleWeights: assessment.fusionAnalysis.moduleWeights,
          confidenceScore: assessment.fusionAnalysis.confidenceScore,
          combinedRecommendations
        },
        moduleResults: {
          handwriting: assessment.handwritingResult ? {
            overallScore: assessment.handwritingResult.analysisResults?.overallScore,
            riskLevel: assessment.handwritingResult.riskLevel,
            reversalCount: assessment.handwritingResult.analysisResults?.reversalCount,
            expectedSentence: handwritingExpectedSentence,
            detectedSentence: handwritingDetectedSentence,
            wordResults: assessment.handwritingResult.analysisResults?.wordResults || [],
            recommendations: assessment.handwritingResult.analysisResults?.recommendations || []
          } : null,
          reading: assessment.readingResult ? {
            riskScore: assessment.readingResult.riskScore,
            riskLevel: assessment.readingResult.riskLevel,
            recommendations: assessment.readingResult.recommendations || []
          } : null,
          keystroke: assessment.keystrokeResult ? {
            riskScore: assessment.keystrokeResult.riskScore,
            riskLevel: assessment.keystrokeResult.riskLevel,
            anomalyScore: assessment.keystrokeResult.anomalyScore,
            riskBreakdown: assessment.keystrokeResult.riskBreakdown || {},
            backspaceRate: assessment.keystrokeResult.backspaceRate,
            errorRate: assessment.keystrokeResult.errorRate,
            recommendations: []
          } : null,
          memory: assessment.memoryResult ? {
            riskScore: assessment.memoryResult.riskScore,
            riskLevel: assessment.memoryResult.riskLevel,
            recommendations: assessment.memoryResult.recommendations || []
          } : null
        },
        explainability,
        completedAt: assessment.completedAt,
        createdAt: assessment.createdAt
      }
    });
  } catch (error) {
    console.error('Fusion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate fusion result',
      error: error.message
    });
  }
});

// @route   GET /api/assessment/history
// @desc    Get user's assessment history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const assessments = await Assessment
      .find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-therapyRecommendations -fusionAnalysis.combinedRecommendations');

    res.status(200).json({
      success: true,
      count: assessments.length,
      assessments: assessments.map(a => ({
        id: a._id,
        status: a.status,
        overallRiskScore: a.overallRiskScore,
        riskLevel: a.riskLevel,
        completedModules: a.getCompletedModules(),
        currentStep: a.currentStep,
        completedAt: a.completedAt,
        createdAt: a.createdAt
      }))
    });
  } catch (error) {
    console.error('Assessment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Helper: build combined recommendations from all modules
function buildCombinedRecommendations(assessment) {
  const recs = [];
  const hw = assessment.handwritingResult;
  const rd = assessment.readingResult;
  const ks = assessment.keystrokeResult;
  const mem = assessment.memoryResult;

  // Handwriting recommendations
  if (hw?.analysisResults?.overallScore >= 34) {
    recs.push('Handwriting: Practice letter formation with guided print worksheets focusing on commonly reversed letters (b/d, p/q).');
  }

  // Reading recommendations
  if (rd?.riskScore >= 34) {
    recs.push('Reading: Use a finger or cursor to track text while reading to reduce regression and improve focus.');
  }

  // Keystroke recommendations
  if (ks?.riskScore >= 34) {
    recs.push('Typing: Practice structured typing exercises to improve rhythm and reduce keystroke variability.');
  }

  // Memory recommendations
  if (mem?.riskScore >= 34) {
    recs.push('Memory: Use chunking strategies and spaced repetition to improve working memory and recall.');
  }

  // Overall high risk
  const overallScore = assessment.overallRiskScore;
  if (overallScore >= 67) {
    recs.push('Overall: High risk indicators detected across multiple modules. A formal dyslexia assessment by a qualified professional is strongly recommended.');
  } else if (overallScore >= 34) {
    recs.push('Overall: Moderate risk indicators detected. Consider consulting an educational specialist for further evaluation.');
  } else {
    recs.push('Overall: Low risk indicators. Continue with regular practice and monitor progress.');
  }

  recs.push('Disclaimer: This screening tool does not constitute a clinical diagnosis. Results should be interpreted by a qualified professional.');

  return recs;
}

function getHandwritingSentence(handwritingResult, kind) {
  if (!handwritingResult) return null;
  if (kind === 'expected') {
    return (
      handwritingResult.expectedSentence ||
      handwritingResult.expected_sentence ||
      handwritingResult.analysisResults?.expectedSentence ||
      handwritingResult.analysisResults?.expected_sentence ||
      null
    );
  }
  return (
    handwritingResult.detectedSentence ||
    handwritingResult.detected_sentence ||
    handwritingResult.analysisResults?.detectedSentence ||
    handwritingResult.analysisResults?.detected_sentence ||
    null
  );
}

function formatMetricLabel(metric) {
  return String(metric || '')
    .replace(/Risk$/, ' Risk')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeRecommendation(item) {
  if (typeof item === 'string') return item;
  if (item && typeof item === 'object') {
    return item.message || item.metric || null;
  }
  return null;
}

function buildKeystrokeRecommendations(keystrokeResult) {
  if (!keystrokeResult) return [];

  if (Array.isArray(keystrokeResult.recommendations)) {
    const fromRecommendations = keystrokeResult.recommendations
      .map(normalizeRecommendation)
      .filter(Boolean);
    if (fromRecommendations.length) return fromRecommendations;
  }

  const breakdown = keystrokeResult.riskBreakdown;
  if (Array.isArray(breakdown)) {
    const fromArrayBreakdown = breakdown
      .map(normalizeRecommendation)
      .filter(Boolean);
    if (fromArrayBreakdown.length) return fromArrayBreakdown;
  }

  if (breakdown && typeof breakdown === 'object') {
    const entries = Object.entries(breakdown)
      .filter(([, value]) => Number.isFinite(Number(value)))
      .map(([metric, value]) => ({
        metric,
        value: Number(value)
      }))
      .sort((a, b) => b.value - a.value);

    const significant = entries.filter((entry) => entry.value >= 40);
    if (significant.length) {
      return significant.map((entry) =>
        `${formatMetricLabel(entry.metric)}: ${Math.round(entry.value)}/100`
      );
    }
  }

  const score = Number(keystrokeResult.riskScore);
  if (Number.isFinite(score)) {
    if (score >= 67) {
      return ['High keystroke risk detected. Structured typing practice is recommended.'];
    }
    if (score >= 34) {
      return ['Moderate keystroke risk detected. Continue practice and monitor consistency.'];
    }
  }

  return [];
}

// @route   GET /api/assessment/:id/pdf
// @desc    Download PDF report for assessment
// @access  Private
router.get('/:id/pdf', protect, async (req, res) => {
  try {
    const { generateAssessmentPDF } = require('../utils/pdfGenerator');

    // Get user info for report
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('name email');

    const assessment = await Assessment
      .findOne({ _id: req.params.id, user: req.user.id })
      .populate('handwritingResult')
      .populate('readingResult')
      .populate('keystrokeResult')
      .populate('memoryResult');

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Calculate fresh fusion scores
    assessment.calculateOverallRisk();
    const combinedRecommendations =
      buildCombinedRecommendations(assessment);
    assessment.fusionAnalysis.combinedRecommendations =
      combinedRecommendations;
      await assessment.save();
    const { generateFullExplainability } =
      require('../utils/explainabilityEngine');
    const explainability = await generateFullExplainability(assessment);
    const handwritingExpectedSentence =
      getHandwritingSentence(assessment.handwritingResult, 'expected');
    const handwritingDetectedSentence =
      getHandwritingSentence(assessment.handwritingResult, 'detected');

    // Build data object for PDF
    const moduleResults = {
      handwriting: assessment.handwritingResult ? {
        overallScore: assessment.handwritingResult
          .analysisResults?.overallScore,
        riskLevel: assessment.handwritingResult.riskLevel,
        reversalCount: assessment.handwritingResult
          .analysisResults?.reversalCount,
        expectedSentence: handwritingExpectedSentence,
        detectedSentence: handwritingDetectedSentence,
        wordResults: assessment.handwritingResult
          .analysisResults?.wordResults || [],
        recommendations: assessment.handwritingResult
          .analysisResults?.recommendations || []
      } : null,
      reading: assessment.readingResult ? {
        riskScore: assessment.readingResult.riskScore,
        riskLevel: assessment.readingResult.riskLevel,
        recommendations: assessment.readingResult.recommendations || []
      } : null,
      keystroke: assessment.keystrokeResult ? {
        riskScore: assessment.keystrokeResult.riskScore,
        riskLevel: assessment.keystrokeResult.riskLevel,
        anomalyScore: assessment.keystrokeResult.anomalyScore,
        backspaceRate: assessment.keystrokeResult.backspaceRate,
        errorRate: assessment.keystrokeResult.errorRate,
        riskBreakdown: {
          holdTimeRisk: assessment.keystrokeResult.riskBreakdown?.holdTimeRisk ?? null,
          flightTimeRisk: assessment.keystrokeResult.riskBreakdown?.flightTimeRisk ?? null,
          backspaceRisk: assessment.keystrokeResult.riskBreakdown?.backspaceRisk ?? null,
          pauseRisk: assessment.keystrokeResult.riskBreakdown?.pauseRisk ?? null,
          speedRisk: assessment.keystrokeResult.riskBreakdown?.speedRisk ?? null,
          errorRateRisk: assessment.keystrokeResult.riskBreakdown?.errorRateRisk ?? null,
        },
        recommendations: []
      } : null,
      memory: assessment.memoryResult ? {
        riskScore: assessment.memoryResult.riskScore,
        riskLevel: assessment.memoryResult.riskLevel,
        recommendations: assessment.memoryResult.recommendations || []
      } : null
    };

    const pdfData = {
      userName: user?.name || user?.email || 'User',
      generatedAt: new Date().toISOString(),
      assessment: {
        ...assessment.toObject(),
        moduleResults,
        completedModules: assessment.getCompletedModules(),
        explainability
      }
    };

    // Generate PDF
    const pdfBuffer = await generateAssessmentPDF(pdfData);

    // Send as downloadable file
    const filename = `dyslexia-screening-report-${
      assessment._id
    }.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF report',
      error: error.message
    });
  }
});

module.exports = router;
