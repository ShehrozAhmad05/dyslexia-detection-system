// =====================================================
// MEMORY MODULE API ROUTES
// Handles all memory test endpoints
// =====================================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const MemoryResult = require('../models/MemoryResult');
const memoryThresholds = require('../../config/memoryThresholds');
const {
  generateSequence,
  generateWordList,
  generateMixedWordList,
  validateSequence,
  analyzeWordRecall
} = require('../utils/memoryHelpers');


// =====================================================
// @route   POST /api/memory/start
// @desc    Get task configuration to start a memory test
// @access  Private (requires authentication)
// =====================================================
router.post('/start', protect, async (req, res) => {
  try {
    const { taskType } = req.body;
    
    // Validate task type
    if (!['sequence', 'word'].includes(taskType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task type. Must be "sequence" or "word"'
      });
    }
    
    let config = {};
    
    // SEQUENCE TASK CONFIGURATION
    if (taskType === 'sequence') {
      config = {
        taskType: 'sequence',
        startLength: memoryThresholds.sequenceTask.startLength,
        maxLength: memoryThresholds.sequenceTask.maxLength,
        displayDuration: memoryThresholds.sequenceTask.displayDuration,
        itemPool: [
          ...memoryThresholds.sequenceTask.itemTypes.letters,
          ...memoryThresholds.sequenceTask.itemTypes.numbers
        ],
        instructions: 'Memorize the sequence shown. After it disappears, type it back exactly as you saw it (use hyphens or spaces to separate items).'
      };
    } 
    
    // WORD TASK CONFIGURATION
    else if (taskType === 'word') {
      // Get level from request body (default to level 1)
      const level = req.body.level || 1;
      const levelConfig = memoryThresholds.wordTask.levels.find(l => l.level === level) 
                          || memoryThresholds.wordTask.levels[0];
      
      // Generate random word list for this level
      const targetWords = generateWordList(levelConfig.wordCount);
      
      // Generate mixed list (target + distractors, shuffled)
      const mixedWords = generateMixedWordList(
        targetWords, 
        levelConfig.distractorCount
      );
      
        config = {
          taskType: 'word',
          level: level,
          wordsToShow: targetWords,              // 3-5 words to memorize
          mixedWords: mixedWords,                // 10-12 words for selection (shuffled)
          wordCount: levelConfig.wordCount,
          displayDuration: levelConfig.displayDuration,
        recallTimeLimit: memoryThresholds.wordTask.recallTimeLimit,
        instructions: `Level ${level}: Study the ${levelConfig.wordCount} words carefully.\nAfter they disappear, ${mixedWords.length} mixed words will appear.\nClick on the words you remember!`
      };
    }
    
    res.status(200).json({
      success: true,
      config
    });
    
  } catch (error) {
    console.error('❌ Error in POST /api/memory/start:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start memory test',
      error: error.message
    });
  }
});


// =====================================================
// @route   POST /api/memory/submit
// @desc    Submit completed memory test and get results
// @access  Private (requires authentication)
// =====================================================
router.post('/submit', protect, async (req, res) => {
  try {
    const { testType, taskData } = req.body;
    
    // Validation: Check test type
    if (!['sequence', 'word'].includes(testType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid test type. Must be "sequence" or "word"'
      });
    }
    
    // Validation: Check task data exists
    if (!taskData) {
      return res.status(400).json({
        success: false,
        message: 'Task data is required'
      });
    }
    
    // Validation: Check required fields based on test type
    if (testType === 'sequence') {
      if (!taskData.sequences || !Array.isArray(taskData.sequences) || taskData.sequences.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Sequence data is required and must be a non-empty array'
        });
      }
    } else if (testType === 'word') {
      if (!taskData.words || !taskData.words.shown || !taskData.words.recalled) {
        return res.status(400).json({
          success: false,
          message: 'Word task data must include shown and recalled words'
        });
      }
    }
    
    // Create new memory result document
    const result = new MemoryResult({
      user: req.user.id,
      testType,
      taskData
    });
    
    // Calculate all metrics automatically
    result.calculateMetrics();
    
    // Calculate risk score and level
    result.calculateRiskScore();
    
    // Generate personalized recommendations
    result.generateRecommendations();
    
    // Save to database
    await result.save();

    // Wire to Assessment
    try {
      const Assessment = require('../models/Assessment');
      const assessmentId = req.body.assessmentId || req.headers['x-assessment-id'];
      let assessment = null;
      if (assessmentId) {
        assessment = await Assessment.findOne({
          _id: assessmentId,
          user: req.user.id,
          status: 'in_progress'
        });
        if (!assessment) {
          console.warn('[Memory] assessmentId provided but not found:', assessmentId);
        }
      } else {
        // Fallback: find any in_progress (legacy support)
        assessment = await Assessment.findOne({
          user: req.user.id,
          status: 'in_progress'
        });
      }
      if (assessment) {
        assessment.memoryResult = result._id;
        assessment.currentStep = assessment.getNextStep();
        await assessment.save();
      }
    } catch (assessmentErr) {
      console.error('Memory Assessment wiring error:', assessmentErr.message);
    }
    
    // Return result summary (don't send raw taskData to save bandwidth)
    res.status(201).json({
      success: true,
      message: 'Memory test submitted successfully',
      resultId: result._id,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      metrics: result.metrics,
      riskBreakdown: result.riskBreakdown,
      recommendations: result.recommendations,
      createdAt: result.createdAt
    });
    
  } catch (error) {
    console.error('❌ Error in POST /api/memory/submit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit memory test',
      error: error.message
    });
  }
});


// =====================================================
// @route   GET /api/memory/results/:id
// @desc    Get specific memory test result by ID
// @access  Private (user must own the result)
// =====================================================
router.get('/results/:id', protect, async (req, res) => {
  try {
    const resultId = req.params.id;
    
    // Find result by ID
    const result = await MemoryResult.findById(resultId);
    
    // Check if result exists
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Memory test result not found'
      });
    }
    
    // Authorization: Check if user owns this result
    if (result.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this result'
      });
    }
    
    // Return full result
    res.status(200).json({
      success: true,
      result
    });
    
  } catch (error) {
    console.error('❌ Error in GET /api/memory/results/:id:', error);
    
    // Handle invalid ObjectId format
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid result ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch memory test result',
      error: error.message
    });
  }
});


// =====================================================
// @route   GET /api/memory/history
// @desc    Get user's memory test history
// @access  Private
// =====================================================
router.get('/history', protect, async (req, res) => {
  try {
    // Query parameters for filtering
    const { limit = 10, taskType, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    // Build query
    const query = { user: req.user.id };
    
    // Optional: Filter by task type
    if (taskType && ['sequence', 'word'].includes(taskType)) {
      query.testType = taskType;
    }
    
    // Build sort object
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;
    
    // Fetch results with pagination
    const results = await MemoryResult.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .select('-taskData'); // Exclude raw task data to reduce response size
    
    // Get total count for pagination info
    const totalCount = await MemoryResult.countDocuments(query);
    
    // Calculate statistics across all tests
    let stats = null;
    if (results.length > 0) {
      const avgRiskScore = results.reduce((sum, r) => sum + r.riskScore, 0) / results.length;
      const avgAccuracy = results.reduce((sum, r) => sum + r.metrics.accuracy, 0) / results.length;
      const maxSequenceAchieved = Math.max(...results.map(r => r.metrics.maxSequenceLength || 0));
      
      stats = {
        totalTests: totalCount,
        averageRiskScore: Math.round(avgRiskScore * 10) / 10,
        averageAccuracy: Math.round(avgAccuracy * 10) / 10,
        maxSequenceAchieved,
        lastTestDate: results[0].createdAt
      };
    }
    
    res.status(200).json({
      success: true,
      count: results.length,
      totalCount,
      results,
      stats
    });
    
  } catch (error) {
    console.error('❌ Error in GET /api/memory/history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch memory test history',
      error: error.message
    });
  }
});


// =====================================================
// NOTE: DELETE endpoint intentionally not implemented
// Test results are preserved for therapy system tracking
// =====================================================


// Export the router
module.exports = router;
