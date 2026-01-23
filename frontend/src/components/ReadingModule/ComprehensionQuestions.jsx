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
    <Box>
      {/* Progress */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Question {currentQuestionIndex + 1} of {questions.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {Object.keys(answers).length} answered
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress} />
      </Box>
      
      {/* Question Card */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {currentQuestion.question}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <FormControl component="fieldset" fullWidth>
            <RadioGroup value={selectedAnswer} onChange={handleAnswerChange}>
              {currentQuestion.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio />}
                  label={option}
                  sx={{ 
                    mb: 1,
                    p: 1,
                    border: '1px solid',
                    borderColor: selectedAnswer === option ? 'primary.main' : 'grey.300',
                    borderRadius: 1,
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>
      
      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={onReviewText}
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
            >
              {submitting ? 'Submitting...' : 'Submit Test'}
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Answer Summary */}
      {questions.length > 1 && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Answer Progress:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {questions.map((q, index) => (
              <Box
                key={q.questionId}
                onClick={() => setCurrentQuestionIndex(index)}
                sx={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  border: '2px solid',
                  borderColor: answers[q.questionId] ? 'success.main' : 'grey.300',
                  bgcolor: currentQuestionIndex === index ? 'primary.light' : 'white',
                  color: currentQuestionIndex === index ? 'white' : 'text.primary',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
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
