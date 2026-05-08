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
import readingBgImage from '../assets/rbg1.png';
import questionsBgImage from '../assets/rbg6.png';

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
   * @param {Array} finalAnswers - Complete array of answers (optional, uses state if not provided)
   */
  const handleSubmitTest = async (finalAnswers = null) => {
    try {
      setSubmitting(true);
      
      const trackingData = tracker.getTrackingData();
      const timeToAnswerQuestions = Date.now() - questionStartTime;
      
      // Use provided answers or fall back to state
      const answersToSubmit = finalAnswers || answers;
      
      const testData = {
        passageId: passage.passageId,
        passageTotalWords: passage.totalWords,
        passageTotalSegments: passage.segments.length,
        ...trackingData,
        timeToAnswerQuestions,
        answers: answersToSubmit,
      };

      const assessmentId = localStorage.getItem('currentAssessmentId');
      const submitPayload = {
        ...testData,
        ...(assessmentId && { assessmentId })
      };

      const response = await readingService.submitTest(submitPayload);
      
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
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          backgroundImage: `url(${questionsBgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          pr: { xs: 1, md: 28 },
          pt: { xs: 10, md: 10 },
          
          overflow: 'hidden'
        }}
      >
        <Paper
          elevation={4}
          sx={{
            width: '100%',
            maxWidth: 660,
            maxHeight: 'calc(100vh - 120px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            p: { xs: 2, md: 2.4 },
            borderRadius: '24px',
            
            bgcolor: 'rgba(255, 255, 255, 0.98)'
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#2F5E1A', mb: 0.35, fontSize: '1.25rem' }}>
            Comprehension Questions
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b6b6b', mb: 1.5, fontSize: '0.76rem' }}>
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
      </Box>
    );
  }
  
  /**
   * Render reading phase
   */
  const currentSegmentData = passage?.segments[tracker.currentSegment];
  const progress = ((tracker.currentSegment + 1) / tracker.totalSegments) * 100;
  
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        backgroundImage: `url(${readingBgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        pt: 10,
        pb: 4,
        pl: 4,
        overflow: 'hidden',
        zIndex: 0
      }}
    >
      {/* Main reading card */}
      <Card
        elevation={4}
        sx={{
          width: '55%',
          maxWidth: 650,
          maxHeight: 'calc(100vh - 280px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '24px'
        }}
      >
        <CardContent sx={{ p: 3, flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Title and Stats */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#2F5E1A' }}>
                {passage?.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                  <Pause sx={{ fontSize: 15, color: '#5FAF3A' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#4b4b4b', fontSize: '0.75rem' }}>
                    {tracker.pauseCount}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                  <Refresh sx={{ fontSize: 15, color: '#5FAF3A' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#4b4b4b', fontSize: '0.75rem' }}>
                    {tracker.totalRevisits}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Progress bar */}
            <Box sx={{ mb: 0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#4b4b4b', fontSize: '0.75rem' }}>
                  Section {tracker.currentSegment + 1} of {tracker.totalSegments}
                </Typography>
                <Typography variant="caption" sx={{ color: '#4b4b4b', fontSize: '0.75rem' }}>
                  {Math.round(progress)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#E0E0E0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#5FAF3A'
                  }
                }}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* Paragraph content */}
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#4b4b4b',
              fontSize: '0.95rem',
              lineHeight: 1.8,
              textAlign: 'justify',
              whiteSpace: 'pre-wrap',
              flex: 1
            }}
          >
            {currentSegmentData?.content}
          </Typography>
        </CardContent>
      </Card>

      {/* Read carefully text and Navigation buttons */}
      <Box sx={{ display: 'flex', gap: 3, mt: 2.5, justifyContent: 'space-between', alignItems: 'center', width: '55%', maxWidth: 650 }}>
        <Button
          onClick={handlePrevious}
          disabled={tracker.isFirstSegment}
          startIcon={<NavigateBefore />}
          variant="outlined"
          sx={{
            borderColor: '#5FAF3A',
            color: '#2F5E1A',
            fontWeight: 700,
            borderRadius: '12px',
            px: 2.5,
            py: 0.8,
            fontSize: '0.85rem',
            '&:hover': {
              borderColor: '#4CAF50',
              backgroundColor: 'rgba(95, 175, 58, 0.05)'
            }
          }}
        >
          Previous
        </Button>
        
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#2F5E1A',
            fontWeight: 700,
            fontSize: '0.85rem',
            fontStyle: 'italic',
            flex: 1,
            textAlign: 'center'
          }}
        >
          Read carefully at your own pace
        </Typography>
        
        {tracker.isLastSegment ? (
          <Button
            endIcon={<CheckCircle />}
            onClick={handleFinishReading}
            variant="contained"
            sx={{
              backgroundColor: '#4CAF50',
              fontWeight: 700,
              borderRadius: '12px',
              px: 2.5,
              py: 0.8,
              fontSize: '0.85rem',
              '&:hover': { backgroundColor: '#3F9B45' }
            }}
          >
            Continue to Questions
          </Button>
        ) : (
          <Button
            endIcon={<NavigateNext />}
            onClick={handleNext}
            variant="contained"
            sx={{
              backgroundColor: '#4CAF50',
              fontWeight: 700,
              borderRadius: '12px',
              px: 2.5,
              py: 0.8,
              fontSize: '0.85rem',
              '&:hover': { backgroundColor: '#3F9B45' }
            }}
          >
            Next
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default ReadingTest;
