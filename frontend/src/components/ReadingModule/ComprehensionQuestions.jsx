import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Button,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Alert,
} from '@mui/material';
import { CheckCircle, ArrowBack } from '@mui/icons-material';
// import bgImage from '../assets/rbg4.png'; // change path if needed

const ComprehensionQuestions = ({ 
  questions, 
  onAnswerSubmit, 
  onComplete, 
  onReviewText,
  submitting 
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answers, setAnswers] = useState({});
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [allAnswered, setAllAnswered] = useState(false);
  
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  /**
   * Check if all questions are answered
   */
  useEffect(() => {
    // Only count questions that have been saved, not the current selection
    const answeredCount = Object.keys(answers).length;
    setAllAnswered(answeredCount === questions.length);
  }, [answers, questions.length]);
  
  /**
   * Reset question timer when question changes
   */
  useEffect(() => {
    setQuestionStartTime(Date.now());
    // Load previously selected answer if exists
    setSelectedAnswer(answers[currentQuestion.questionId] || '');
  }, [currentQuestionIndex, currentQuestion.questionId]);
  
  /**
   * Handle answer selection
   */
  const handleAnswerChange = (event) => {
    setSelectedAnswer(event.target.value);
  };
  
  /**
   * Save answer and move to next question
   */
  const handleNextQuestion = () => {
    if (!selectedAnswer) return;
    
    const timeSpent = Date.now() - questionStartTime;
    
    // Save answer
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.questionId]: selectedAnswer
    }));
    
    // Notify parent
    onAnswerSubmit(currentQuestion.questionId, selectedAnswer, timeSpent);
    
    // Move to next question or finish
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer('');
    }
  };
  
  /**
   * Navigate to previous question
   */
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  /**
   * Submit all answers
   */
  const handleSubmit = () => {
    // Build complete answers array to pass to parent
    const completeAnswers = [];
    
    // Add all previously saved answers
    Object.keys(answers).forEach(questionId => {
      const answer = answers[questionId];
      completeAnswers.push({
        questionId: parseInt(questionId),
        answer: answer,
        timeSpent: 0 // Already tracked when saved
      });
    });
    
    // If current question is answered but not saved yet, include it
    if (selectedAnswer && !answers[currentQuestion.questionId]) {
      const timeSpent = Date.now() - questionStartTime;
      completeAnswers.push({
        questionId: currentQuestion.questionId,
        answer: selectedAnswer,
        timeSpent
      });
      
      // Also notify parent for state consistency
      onAnswerSubmit(currentQuestion.questionId, selectedAnswer, timeSpent);
    }
    
    // Pass complete answers array to parent
    onComplete(completeAnswers);
  };
  
  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Progress */}
      <Box sx={{ mb: 0.8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}>
          <Typography variant="body2" sx={{ color: '#6b6b6b', fontSize: '0.62rem' }}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b6b6b', fontSize: '0.55rem' }}>
            {Object.keys(answers).length} answered
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 4, borderRadius: 999, backgroundColor: '#E6E6D8', '& .MuiLinearProgress-bar': { backgroundColor: '#4CAF50' } }}
        />
      </Box>
      
      {/* Question Card */}
      <Card
        variant="outlined"
        sx={{
          mb: 1.5,
          borderRadius: '16px',
          boxShadow: '0 6px 18px rgba(0, 0, 0, 0.06)',
          borderColor: '#E1E8D0'
        }}
      >
        <CardContent sx={{ p: { xs: 1.7, md: 2 } }}>
          <Typography variant="h6" sx={{ gutterBottom: undefined, fontSize: '0.72rem', fontWeight: 800, color: '#2F5E1A', lineHeight: 1.35 }}>
            {currentQuestion.question}
          </Typography>
          
          <Divider sx={{ my: 1.1 }} />
          
          <FormControl component="fieldset" fullWidth>
            <RadioGroup value={selectedAnswer} onChange={handleAnswerChange}>
              {currentQuestion.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio sx={{ p: 0.3 }} />}
                  label={option}
                  sx={{ 
                    mb: 0.55,
                    p: 0.45,
                    border: '1px solid',
                    borderColor: selectedAnswer === option ? '#5FAF3A' : '#D6DBC6',
                    borderRadius: 1.5,
                    bgcolor: selectedAnswer === option ? 'rgba(95, 175, 58, 0.12)' : 'transparent',
                    transition: 'all 0.2s',
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.68rem',
                      color: '#3f3f3f'
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(95, 175, 58, 0.06)',
                    }
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>
      
      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.2, alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            sx={{ borderColor: '#BFD0AA', color: '#2F5E1A', borderRadius: '12px', px: 1.8, py: 0.6, fontSize: '0.68rem' }}
          >
            Previous
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={onReviewText}
            sx={{ borderColor: '#BFD0AA', color: '#2F5E1A', borderRadius: '12px', px: 1.8, py: 0.6, fontSize: '0.68rem' }}
          >
            Review Text
          </Button>
        </Box>
        
        <Box>
          {currentQuestionIndex < questions.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNextQuestion}
              disabled={!selectedAnswer}
              sx={{ backgroundColor: '#4CAF50', borderRadius: '12px', px: 2, py: 0.65, fontSize: '0.68rem', '&:hover': { backgroundColor: '#3F9B45' } }}
            >
              Next Question
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={handleSubmit}
              disabled={(!allAnswered && !selectedAnswer) || submitting}
              sx={{ borderRadius: '12px', px: 2, py: 0.65, fontSize: '0.68rem' }}
            >
              {submitting ? 'Submitting...' : 'Submit Test'}
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Answer Summary */}
      {questions.length > 1 && (
        <Box sx={{ mt: 1.2, p: 1, bgcolor: 'rgba(95, 175, 58, 0.05)', borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: '#6b6b6b', display: 'block', mb: 0.8, fontSize: '0.66rem' }}>
            Answer Progress:
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {questions.map((q, index) => (
              <Box
                key={q.questionId}
                onClick={() => setCurrentQuestionIndex(index)}
                sx={{
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  border: '2px solid',
                  borderColor: answers[q.questionId] ? '#4CAF50' : '#D6DBC6',
                  bgcolor: currentQuestionIndex === index ? '#4CAF50' : 'white',
                  color: currentQuestionIndex === index ? 'white' : '#2F5E1A',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.65rem',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  }
                }}
              >
                {index + 1}
              </Box>
            ))}
          </Box>
        </Box>
      )}
      
      {!allAnswered && currentQuestionIndex === questions.length - 1 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Please answer all questions before submitting.
        </Alert>
      )}
    </Box>
  );
};

export default ComprehensionQuestions;
