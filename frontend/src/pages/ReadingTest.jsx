import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  NavigateBefore,
  NavigateNext,
  CheckCircle,
  Pause,
  Refresh,
} from '@mui/icons-material';
import { readingService } from '../services';
import { useReadingTracker } from '../hooks/useReadingTracker';
import ComprehensionQuestions from '../components/ReadingModule/ComprehensionQuestions';

const ReadingTest = () => {
  const navigate = useNavigate();
  
  // Test states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [passage, setPassage] = useState(null);
  const [phase, setPhase] = useState('reading'); // 'reading' or 'questions'
  const [submitting, setSubmitting] = useState(false);
  
  // Question tracking
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [answers, setAnswers] = useState([]);
  
  // Initialize reading tracker
  const tracker = useReadingTracker(passage);
  
  /**
   * Load passage on component mount
   */
  useEffect(() => {
    const loadPassage = async () => {
      try {
        setLoading(true);
        const response = await readingService.startTest({
          difficulty: 'medium',
          ageGroup: '10-12'
        });
        
        if (response.data.success) {
          setPassage(response.data.passage);
          setError('');
        } else {
          setError('Failed to load reading passage');
        }
      } catch (err) {
        console.error('Error loading passage:', err);
        setError(err.response?.data?.message || 'Failed to load reading test');
      } finally {
        setLoading(false);
      }
    };
    
    loadPassage();
  }, []);
  
  /**
   * Start tracking when passage is loaded
   */
  useEffect(() => {
    if (passage && !loading) {
      tracker.startTracking();
    }
  }, [passage, loading]);
  
  /**
   * Handle navigation to next segment
   */
  const handleNext = () => {
    const moved = tracker.goToNextSegment();
    if (!moved && tracker.isLastSegment) {
      // Finished reading all segments
      handleFinishReading();
    }
  };
  
  /**
   * Handle navigation to previous segment
   */
  const handlePrevious = () => {
    tracker.goToPreviousSegment();
  };
  
  /**
   * Finish reading phase and move to questions
   */
  const handleFinishReading = () => {
    tracker.finishReading();
    setPhase('questions');
    setQuestionStartTime(Date.now());
  };
  
  /**
   * Handle answer submission
   */
  const handleAnswerSubmit = (questionId, answer, timeSpent) => {
    setAnswers(prev => [...prev, {
      questionId,
      answer,
      timeSpent
    }]);
  };
  
  /**
   * Submit entire test
   */
  const handleSubmitTest = async () => {
    try {
      setSubmitting(true);
      
      const trackingData = tracker.getTrackingData();
      const timeToAnswerQuestions = Date.now() - questionStartTime;
      
      const testData = {
        passageId: passage.passageId,
        passageTotalWords: passage.totalWords,
        passageTotalSegments: passage.segments.length,
        ...trackingData,
        timeToAnswerQuestions,
        answers,
      };
      
      const response = await readingService.submitTest(testData);
      
      if (response.data.success) {
        // Navigate to results page
        navigate(`/reading-results/${response.data.resultId}`);
      } else {
        setError('Failed to submit test');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Error submitting test:', err);
      setError(err.response?.data?.message || 'Failed to submit test');
      setSubmitting(false);
    }
  };
  
  /**
   * Render loading state
   */
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading reading test...</Typography>
      </Container>
    );
  }
  
  /**
   * Render error state
   */
  if (error && !passage) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }
  
  /**
   * Render questions phase
   */
  if (phase === 'questions') {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Comprehension Questions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Answer the following questions based on what you read.
          </Typography>
          
          <ComprehensionQuestions
            questions={passage.questions}
            onAnswerSubmit={handleAnswerSubmit}
            onComplete={handleSubmitTest}
            onReviewText={() => setPhase('reading')}
            submitting={submitting}
          />
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Paper>
      </Container>
    );
  }
  
  /**
   * Render reading phase
   */
  const currentSegmentData = passage?.segments[tracker.currentSegment];
  const progress = ((tracker.currentSegment + 1) / tracker.totalSegments) * 100;
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            {passage?.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              icon={<Pause />} 
              label={`${tracker.pauseCount} pauses`} 
              size="small" 
              variant="outlined"
            />
            <Chip 
              icon={<Refresh />} 
              label={`${tracker.totalRevisits} revisits`} 
              size="small" 
              variant="outlined"
            />
          </Box>
        </Box>
        
        {/* Progress bar */}
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Section {tracker.currentSegment + 1} of {tracker.totalSegments}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      </Paper>
      
      {/* Reading content */}
      <Card elevation={3} sx={{ mb: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography 
            variant="body1" 
            sx={{ 
              fontSize: '1.1rem',
              lineHeight: 1.8,
              textAlign: 'justify',
              whiteSpace: 'pre-wrap'
            }}
          >
            {currentSegmentData?.content}
          </Typography>
        </CardContent>
      </Card>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          startIcon={<NavigateBefore />}
          onClick={handlePrevious}
          disabled={tracker.isFirstSegment}
          variant="outlined"
        >
          Previous
        </Button>
        
        <Typography variant="caption" color="text.secondary">
          Read carefully at your own pace
        </Typography>
        
        {tracker.isLastSegment ? (
          <Button
            endIcon={<CheckCircle />}
            onClick={handleFinishReading}
            variant="contained"
            color="success"
          >
            Continue to Questions
          </Button>
        ) : (
          <Button
            endIcon={<NavigateNext />}
            onClick={handleNext}
            variant="contained"
          >
            Next
          </Button>
        )}
      </Box>
      
      {/* Instructions */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Instructions:</strong> Read each section carefully. You can navigate back to previous sections if needed.
          When you're ready, click "Continue to Questions" to answer comprehension questions.
        </Typography>
      </Alert>
    </Container>
  );
};

export default ReadingTest;
