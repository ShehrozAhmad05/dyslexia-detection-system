import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { WarningAmber } from '@mui/icons-material';
import { assessmentService } from '@services';
import mainVideo from '../assets/waving.mp4';
import ideaIcon from '../assets/idea.png';
import signatureIcon from '../assets/signature.png';
import booksIcon from '../assets/books.png';
import typingIcon from '../assets/typing.png';
import alzheimerIcon from '../assets/alzheimer.png';

const getNextStepRoute = (currentStep) => {
  const routes = {
    handwriting: '/assessment/instructions/handwriting',
    reading: '/assessment/instructions/reading',
    keystroke: '/assessment/instructions/keystroke',
    memory: '/assessment/instructions/memory',
    completed: '/assessment/overall'
  };
  return routes[currentStep] || '/assessment/instructions/handwriting';
};

const testCards = [
  {
    key: 'handwriting',
    icon: signatureIcon,
    title: 'Handwriting Analysis',
    description: 'Write a sentence in print style. We detect letter reversal patterns.',
    time: '~5 minutes'
  },
  {
    key: 'reading',
    icon: booksIcon,
    title: 'Reading Assessment',
    description: 'Read a passage and answer comprehension questions. We track reading patterns.',
    time: '~5 minutes'
  },
  {
    key: 'keystroke',
    icon: typingIcon,
    title: 'Keystroke Analysis',
    description: 'Type a prompted sentence. We analyze typing rhythm and patterns.',
    time: '~5 minutes'
  },
  {
    key: 'memory',
    icon: alzheimerIcon,
    title: 'Memory Assessment',
    description: 'Two tasks: sequence memory and word recall.',
    time: '~5 minutes'
  }
];

function AssessmentStart() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assessment, setAssessment] = useState(null);
  const [isResuming, setIsResuming] = useState(false);
  const initiated = useRef(false);

  useEffect(() => {
    if (initiated.current) return;
    initiated.current = true;
    initAssessment();
  }, []);

  const initAssessment = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await assessmentService.start();
      const data = response.data.assessment;
      setAssessment(data);
      setIsResuming((response.data.message || '').includes('Resuming'));
      localStorage.setItem('currentAssessmentId', data.id);
    } catch (err) {
      setError('Failed to initialize assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const completedModules = assessment?.completedModules || [];

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        px: { xs: 2, md: 4 },
        py: { xs: 4, md: 6 }
      }}
    >
      <Box
        component="video"
        autoPlay
        muted
        loop
        playsInline
        src={mainVideo}
        sx={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: -1
         
        }}
      />
      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1100 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#2B2B2B' }}>
            Comprehensive Dyslexia Screening
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            A multi-module assessment to identify dyslexia risk indicators
          </Typography>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={(
              <Button color="inherit" size="small" onClick={initAssessment}>
                Retry
              </Button>
            )}
          >
            {error}
          </Alert>
        )}

        {!loading && !error && assessment && (
          <>
            <Grid container spacing={4} justifyContent="center" sx={{ mb: 3 }}>
              {testCards.map((test) => {
                const isCompleted = completedModules.includes(test.key);

                return (
                  <Grid
                    item
                    key={test.key}
                    sx={{
                      width: {
                        xs: '100%',
                        sm: '340px',
                        md: '250px'
                      },
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    <Card
                      sx={{
                        width: '250px',
                        height: '350px',
                        borderRadius: '28px',
                        background: 'rgba(255,255,255,0.82)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.5)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                        overflow: 'hidden',
                        transition: '0.3s ease',

                        '&:hover': {
                          transform: 'translateY(-6px)'
                        }
                      }}
                    >
                      <CardContent
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          p: 3
                        }}
                      >
                        <Box
                          component="img"
                          src={test.icon}
                          alt={test.title}
                          sx={{
                            width: 70,
                            height: 60,
                            objectFit: 'contain',
                            mb: 2
                          }}
                        />

                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            mb: 1,
                            height: '56px'
                          }}
                        >
                          {test.title}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            fontSize: '14px',
                            lineHeight: 1.6,
                            height: '90px',
                            overflow: 'hidden'
                          }}
                        >
                          {test.description}
                        </Typography>

                        <Typography
                          sx={{
                            mt: 2,
                            mb: 2,
                            fontWeight: 700,
                            color: '#7B61FF'
                          }}
                        >
                          {test.time}
                        </Typography>

                        <Box sx={{ mt: 'auto' }}>
                          <Chip
                            label={isCompleted ? 'Completed' : 'Pending'}
                            color={isCompleted ? 'success' : 'default'}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            <Paper
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.22)',
                border: '1px solid rgba(255,255,255,0.35)',
                backdropFilter: 'blur(6px)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <WarningAmber sx={{ color: 'warning.main' }} />
                <Typography variant="body2" color="warning.dark">
                  Please complete all 4 tests in one session for the most accurate results.
                  Each test must be completed before moving to the next.
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {isResuming
                  ? `You have an assessment in progress. Completed: ${completedModules.length
                    ? completedModules.join(', ')
                    : 'none'} . You can continue from where you left off.`
                  : 'Your new assessment is ready. Click "Begin Assessment" to start from handwriting.'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Estimated total time: ~20 minutes
              </Typography>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'center'}}>
              {isResuming ? (
                <Button sx={{bgcolor: "#8B85EF"}}
                  variant="contained"
                  size="large"


                  onClick={() => navigate(getNextStepRoute(assessment.currentStep))}
                >
                  Continue Assessment
                </Button>
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/assessment/instructions/handwriting')}
                >
                  Begin Assessment
                </Button>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}

export default AssessmentStart;
