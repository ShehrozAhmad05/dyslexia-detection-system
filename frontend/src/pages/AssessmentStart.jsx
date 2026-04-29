import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
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
import {
  Edit,
  MenuBook,
  Keyboard,
  Psychology
} from '@mui/icons-material';
import { assessmentService } from '@services';

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
    icon: Edit,
    title: 'Handwriting Analysis',
    description: 'Write a sentence in print style. We detect letter reversal patterns.',
    time: '~5 minutes'
  },
  {
    key: 'reading',
    icon: MenuBook,
    title: 'Reading Assessment',
    description: 'Read a passage and answer comprehension questions. We track reading patterns.',
    time: '~5 minutes'
  },
  {
    key: 'keystroke',
    icon: Keyboard,
    title: 'Keystroke Analysis',
    description: 'Type a prompted sentence. We analyze typing rhythm and patterns.',
    time: '~5 minutes'
  },
  {
    key: 'memory',
    icon: Psychology,
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
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h4" gutterBottom>
            Comprehensive Dyslexia Screening
          </Typography>
          <Typography variant="body1">
            A multi-module assessment to identify dyslexia risk indicators
          </Typography>
        </Paper>

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
            {isResuming && (
              <Alert severity="info" sx={{ mb: 3 }}>
                You have an assessment in progress. Completed: {completedModules.length
                  ? completedModules.join(', ')
                  : 'none'
                }. You can continue from where you left off.
              </Alert>
            )}
            {!isResuming && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Your new assessment is ready. Click "Begin Assessment" to start from handwriting.
              </Alert>
            )}

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                What to expect
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Estimated total time: ~20 minutes
              </Typography>

              <Grid container spacing={2}>
                {testCards.map((test) => {
                  const Icon = test.icon;
                  const isCompleted = completedModules.includes(test.key);

                  return (
                    <Grid item xs={12} sm={6} key={test.key}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                            <Icon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h6">{test.title}</Typography>
                          </Box>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {test.description}
                          </Typography>

                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Time: {test.time}
                          </Typography>

                          <Chip
                            label={isCompleted ? 'Completed' : 'Pending'}
                            color={isCompleted ? 'success' : 'default'}
                            size="small"
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 3, bgcolor: 'warning.light' }}>
              <Typography variant="body2" color="warning.dark">
                Please complete all 4 tests in one session for the most accurate results.
                Each test must be completed before moving to the next.
              </Typography>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              {isResuming ? (
                <Button
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
    </Container>
  );
}

export default AssessmentStart;
