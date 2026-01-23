const express = require('express');
const router = express.Router();
const ReadingResult = require('../models/ReadingResult');
const ReadingPassage = require('../models/ReadingPassage');
const { protect } = require('../middleware/auth');
const {
  FEATURE_WEIGHTS,
  READING_TIME,
  COMPREHENSION,
  REVISIT_COUNT,
  PAUSE_COUNT,
  AVG_PAUSE_DURATION,
  WPM_REFERENCE,
  RISK_SCORE_RANGES,
  RISK_LEVELS,
  CONFIDENCE_DESCRIPTIONS,
  VALIDATION_SUMMARY
} = require('../../config/readingThresholds');

// @route   POST /api/reading/start
// @desc    Get a reading passage to start the test
// @access  Private
router.post('/start', protect, async (req, res) => {
  try {
    const { difficulty, ageGroup } = req.body;
    
    // Find a suitable passage
    const query = { isActive: true };
    if (difficulty) query.difficulty = difficulty;
    if (ageGroup) query.ageGroup = ageGroup;
    
    // Get a random passage matching criteria
    const count = await ReadingPassage.countDocuments(query);
    if (count === 0) {
      return res.status(404).json({ 
        message: 'No reading passages available. Please contact administrator.' 
      });
    }
    
    const random = Math.floor(Math.random() * count);
    const passage = await ReadingPassage.findOne(query).skip(random);
    
    // Don't send correct answers to frontend
    const passageData = passage.toObject();
    passageData.questions = passageData.questions.map(q => ({
      questionId: q.questionId,
      question: q.question,
      options: q.options,
      type: q.type
    }));
    
    res.json({
      success: true,
      passage: passageData
    });
  } catch (error) {
    console.error('Error starting reading test:', error);
    res.status(500).json({ message: 'Server error starting reading test' });
  }
});

// @route   POST /api/reading/submit
// @desc    Submit reading test data and get analysis
// @access  Private
router.post('/submit', protect, async (req, res) => {
  try {
    const {
      passageId,
      passageTotalWords,
      passageTotalSegments,
      totalReadingTime,
      segmentTimes,
      timeToAnswerQuestions,
      totalRevisits,
      revisitDetails,
      reviewedTextAfterQuestions,
      pauseCount,
      pauseDurations,
      answers
    } = req.body;
    
    // Validate required fields
    if (!passageId || !totalReadingTime || !answers || answers.length === 0) {
      return res.status(400).json({ 
        message: 'Missing required fields' 
      });
    }
    
    // Fetch the passage to get correct answers
    const passage = await ReadingPassage.findOne({ passageId });
    if (!passage) {
      return res.status(404).json({ message: 'Passage not found' });
    }
    
    // Calculate comprehension score
    let correctCount = 0;
    const processedAnswers = answers.map(ans => {
      const question = passage.questions.find(q => q.questionId === ans.questionId);
      const isCorrect = question && ans.answer === question.correctAnswer;
      if (isCorrect) correctCount++;
      
      return {
        questionId: ans.questionId,
        answer: ans.answer,
        correct: isCorrect,
        timeSpent: ans.timeSpent || 0
      };
    });
    
    const comprehensionScore = Math.round((correctCount / answers.length) * 100);
    const incorrectQuestions = processedAnswers
      .filter(a => !a.correct)
      .map(a => a.questionId);
    
    // Create reading result
    const readingResult = new ReadingResult({
      user: req.user.id,
      passageId,
      passageTotalWords: passageTotalWords || passage.totalWords,
      passageTotalSegments: passageTotalSegments || passage.segments.length,
      totalReadingTime,
      segmentTimes: segmentTimes || [],
      timeToAnswerQuestions: timeToAnswerQuestions || 0,
      totalRevisits: totalRevisits || 0,
      revisitDetails: revisitDetails || [],
      reviewedTextAfterQuestions: reviewedTextAfterQuestions || false,
      pauseCount: pauseCount || 0,
      pauseDurations: pauseDurations || [],
      totalQuestions: answers.length,
      correctAnswers: correctCount,
      comprehensionScore,
      incorrectQuestions,
      answers: processedAnswers
    });
    
    // Save first to trigger pre-save hook (calculates derived metrics)
    await readingResult.save();
    
    // Now calculate risk score and generate recommendations (needs derived metrics)
    readingResult.calculateRiskScore();
    readingResult.generateRecommendations();
    
    // Save again with risk scores
    await readingResult.save();
    
    res.json({
      success: true,
      message: 'Reading test submitted successfully',
      resultId: readingResult._id,
      riskScore: readingResult.riskScore,
      riskLevel: readingResult.riskLevel
    });
  } catch (error) {
    console.error('Error submitting reading test:', error);
    res.status(500).json({ message: 'Server error submitting reading test' });
  }
});

// @route   GET /api/reading/results/:id
// @desc    Get specific reading test result
// @access  Private
router.get('/results/:id', protect, async (req, res) => {
  try {
    const result = await ReadingResult.findById(req.params.id);
    
    if (!result) {
      return res.status(404).json({ message: 'Reading result not found' });
    }
    
    // Ensure user can only access their own results
    if (result.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error fetching reading result:', error);
    res.status(500).json({ message: 'Server error fetching result' });
  }
});

// @route   GET /api/reading/thresholds
// @desc    Get validated reading assessment thresholds and configuration
// @access  Public (educational resource)
router.get('/thresholds', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Reading assessment thresholds based on ETDD70 dataset and validated against published literature',
      data: {
        // Feature weights used in risk calculation
        weights: FEATURE_WEIGHTS,
        
        // Individual metric thresholds with validation status
        metrics: {
          readingTime: {
            name: 'Reading Time',
            weight: READING_TIME.weight,
            confidence: READING_TIME.confidence,
            unit: 'seconds',
            thresholds: READING_TIME.riskLevels,
            reference: READING_TIME.reference,
            citation: READING_TIME.citation,
            description: 'Total time to read passage - strongest single predictor'
          },
          comprehension: {
            name: 'Comprehension Score',
            weight: COMPREHENSION.weight,
            confidence: COMPREHENSION.confidence,
            unit: 'percentage',
            thresholds: COMPREHENSION.riskLevels,
            inverseScore: COMPREHENSION.inverseScore,
            citation: COMPREHENSION.citation,
            description: 'Percentage of comprehension questions answered correctly'
          },
          revisitCount: {
            name: 'Revisit Count',
            weight: REVISIT_COUNT.weight,
            confidence: REVISIT_COUNT.confidence,
            unit: 'count',
            thresholds: REVISIT_COUNT.riskLevels,
            reference: REVISIT_COUNT.reference,
            citation: REVISIT_COUNT.citation,
            description: 'Number of scroll-back events (proxy for eye-tracking regressions)'
          },
          pauseCount: {
            name: 'Pause Count',
            weight: PAUSE_COUNT.weight,
            confidence: PAUSE_COUNT.confidence,
            experimental: PAUSE_COUNT.experimental,
            unit: 'count',
            thresholds: PAUSE_COUNT.riskLevels,
            pauseDefinition: PAUSE_COUNT.pauseDefinition,
            citation: PAUSE_COUNT.citation,
            requiresValidation: PAUSE_COUNT.requiresValidation,
            description: 'Number of inactivity periods >3 seconds - experimental metric'
          },
          avgPauseDuration: {
            name: 'Average Pause Duration',
            weight: AVG_PAUSE_DURATION.weight,
            confidence: AVG_PAUSE_DURATION.confidence,
            experimental: AVG_PAUSE_DURATION.experimental,
            unit: 'milliseconds',
            thresholds: AVG_PAUSE_DURATION.riskLevels,
            citation: AVG_PAUSE_DURATION.citation,
            requiresValidation: AVG_PAUSE_DURATION.requiresValidation,
            description: 'Average length of pauses - experimental metric'
          }
        },
        
        // Risk score ranges
        riskScoreRanges: RISK_SCORE_RANGES,
        riskLevels: RISK_LEVELS,
        
        // Confidence level descriptions
        confidenceLevels: CONFIDENCE_DESCRIPTIONS,
        
        // Validation summary statistics
        validation: {
          ...VALIDATION_SUMMARY,
          literatureSources: [
            {
              study: 'Nilsson Benfatto et al. (2016)',
              journal: 'PLoS ONE',
              sample: 'N=185 (97 HR, 88 LR)',
              accuracy: '95.6%',
              keyFinding: '50% of discriminative features relate to regressive movements',
              url: 'https://doi.org/10.1371/journal.pone.0165508'
            },
            {
              study: 'Nerušil et al. (2021)',
              journal: 'Scientific Reports',
              sample: 'N=185 (same dataset)',
              accuracy: '96.6%',
              keyFinding: 'Reading time alone provides 95.67% accuracy',
              url: 'https://doi.org/10.1038/s41598-021-95275-1'
            },
            {
              study: 'Vajs et al. (2023)',
              journal: 'Brain Sciences',
              sample: 'N=30 (15 dyslexic, 15 control)',
              accuracy: '87.8% at 30Hz',
              keyFinding: 'Web-based eye tracking feasible with low sampling rates',
              url: 'https://doi.org/10.3390/brainsci13101409'
            },
            {
              study: 'Hasbrouck & Tindal (2017)',
              journal: 'Behavioral Research and Teaching',
              type: 'Oral Reading Fluency norms',
              keyFinding: 'Validates WPM thresholds at grade-level percentiles',
              url: 'University of Oregon Technical Report'
            }
          ],
          confidenceSummary: {
            highConfidence: '60.8% of risk score (reading time + comprehension)',
            moderateConfidence: '17.1% of risk score (revisit count)',
            lowConfidence: '22.1% of risk score (pause metrics - requires pilot validation)'
          }
        },
        
        // Reference data (WPM thresholds from ETDD70)
        reference: {
          wpm: WPM_REFERENCE
        }
      }
    });
  } catch (error) {
    console.error('Error fetching thresholds:', error);
    res.status(500).json({ message: 'Server error fetching thresholds' });
  }
});

// @route   GET /api/reading/history
// @desc    Get user's reading test history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const results = await ReadingResult.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-answers -revisitDetails -pauseDurations -segmentTimes')
      .limit(20);
    
    res.json({
      success: true,
      count: results.length,
      results
    });
  } catch (error) {
    console.error('Error fetching reading history:', error);
    res.status(500).json({ message: 'Server error fetching history' });
  }
});

module.exports = router;
