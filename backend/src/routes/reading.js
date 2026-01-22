const express = require('express');
const router = express.Router();
const ReadingResult = require('../models/ReadingResult');
const ReadingPassage = require('../models/ReadingPassage');
const { protect } = require('../middleware/auth');

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
