const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const KeystrokeResult = require('../models/KeystrokeResult');
const {
  TEST_PROMPTS,
  NORMAL_RANGES,
  DYSLEXIC_RANGES,
  METADATA
} = require('../../config/keystrokeConfig');

// @route   POST /api/keystroke/start
// @desc    Get a random typing prompt
// @access  Private
router.post('/start', protect, async (req, res) => {
  try {
    const prompt = TEST_PROMPTS[Math.floor(Math.random() * TEST_PROMPTS.length)];
    return res.status(200).json({ success: true, prompt });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get prompt', error: error.message });
  }
});

// @route   POST /api/keystroke/submit
// @desc    Submit keystroke test and get risk assessment
// @access  Private
router.post('/submit', protect, async (req, res) => {
  try {
    const { prompt, typedText, startTime, endTime, keystrokes = [], testType } = req.body || {};

    if (!prompt || !typedText || !startTime || !endTime || !Array.isArray(keystrokes) || keystrokes.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const duration = new Date(endTime) - new Date(startTime);

    const result = new KeystrokeResult({
      user: req.user.id,
      testType: testType || 'typing',
      prompt,
      typedText,
      startTime,
      endTime,
      duration,
      keystrokes,
      metadata: METADATA
    });

    result.calculateMetrics();
    const { predictAnomaly } = require('../ml/keystroke/predict');
    const ml = await predictAnomaly({
      avgHoldTime: result.avgHoldTime,
      stdHoldTime: result.stdHoldTime,
      cvHoldTime: result.cvHoldTime,
      avgFlightTime: result.avgFlightTime,
      stdFlightTime: result.stdFlightTime,
      cvFlightTime: result.cvFlightTime
    });

    result.anomalyScore = ml.anomalyScore;
    result.isAnomalous = ml.isAnomalous;
    result.calculateRiskScore(result.anomalyScore || 0);

    await result.save();

    return res.status(201).json({
      success: true,
      resultId: result._id,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      anomalyScore: result.anomalyScore,
      isAnomalous: result.isAnomalous,
      riskBreakdown: result.riskBreakdown,
      thresholds: {
        normal: NORMAL_RANGES,
        atypical: DYSLEXIC_RANGES
      },
      metadata: METADATA
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to submit test', error: error.message });
  }
});

// @route   GET /api/keystroke/results/:id
// @desc    Get detailed result
// @access  Private
router.get('/results/:id', protect, async (req, res) => {
  try {
    const result = await KeystrokeResult.findById(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }
    if (result.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this result' });
    }
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get result', error: error.message });
  }
});

// @route   GET /api/keystroke/history
// @desc    Get user keystroke history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const page = parseInt(req.query.page, 10) || 1;
    const skip = (page - 1) * limit;

    const results = await KeystrokeResult.find({ user: req.user.id })
      .select('riskScore riskLevel wpm accuracy duration createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await KeystrokeResult.countDocuments({ user: req.user.id });

    return res.status(200).json({
      success: true,
      results,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get history', error: error.message });
  }
});

module.exports = router;
