import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { useAuth } from '@contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { assessmentService } from '@services';
import handwritingImage from '../assets/writing.png';
import keystrokeImage from '../assets/key.png';
import readingImage from '../assets/reading.png';
import memoryImage from '../assets/memory.png';
import dashboardBackground from '../assets/dashboardbg.avif';

const CARD_HEIGHT = 340;
const kidsFont = '"Comic Sans MS", "Chalkboard SE", "Marker Felt", "Baloo 2", cursive';
const contentFont = '"Comic Sans MS", "Chalkboard SE", "Nunito", sans-serif';

const TEST_CARDS = [
  {
    title: 'Handwriting Test',
    description: 'Upload handwriting samples for analysis',
    image: handwritingImage,
    imageScale: 1.08,
    route: '/assessment/handwriting'
  },
  {
    title: 'Keystroke Test',
    description: 'Analyze your typing patterns',
    image: keystrokeImage,
    imageScale: 1.28,
    route: '/assessment/keystroke'
  },
  {
    title: 'Reading Test',
    description: 'Assess reading speed and comprehension',
    image: readingImage,
    imageScale: 1.1,
    route: '/reading-test'
  },
  {
    title: 'Memory Test',
    description: 'Complete sequence and word recall assessment',
    image: memoryImage,
    imageScale: 1.1,
    route: '/memory-test'
  }
];

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const assessmentId = localStorage.getItem('currentAssessmentId');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await assessmentService.getHistory();
      setHistory(response.data.assessments || []);
    } catch (err) {
      console.error('Failed to load assessment history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: `linear-gradient(180deg, rgba(7, 20, 43, 0.52), rgba(7, 20, 43, 0.52)), url(${dashboardBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: { xs: 'scroll', md: 'fixed' },
        pt: { xs: 15, sm: 16, md: 17 },
        pb: { xs: 3, md: 4 }
      }}
    >
      <Container maxWidth="xl" sx={{ width: '100%' }}>
        <Box
          sx={{
            mb: 4,
            borderRadius: 4,
            px: { xs: 2.5, sm: 4 },
            py: { xs: 2.5, sm: 3.5 },
            background: 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(247,251,255,0.82))',
            backdropFilter: 'blur(5px)',
            boxShadow: '0 16px 36px rgba(15, 32, 61, 0.22)'
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontFamily: kidsFont,
              color: '#5B8CFF',
              fontWeight: 800,
              fontSize: { xs: '1.7rem', sm: '2.1rem', md: '2.4rem' }
            }}
          >
            Welcome back, {user?.name}! Ready for today&apos;s challenge?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mt: 1,
              color: '#2F466A',
              fontFamily: contentFont,
              fontSize: { xs: '0.98rem', sm: '1.05rem' }
            }}
          >
            Pick a smart mini-assessment below and let’s turn progress into confidence — one fun step at a time.
          </Typography>
        </Box>

        {assessmentId && (
          <Alert
            severity="info"
            sx={{ mb: 3 }}
            action={(
              <Button color="inherit" size="small" onClick={() => navigate('/assessment/start')}>
                Continue
              </Button>
            )}
          >
            You have an assessment in progress.
          </Alert>
        )}

        <Box
          sx={{
            mb: 4,
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/assessment/start')}
            sx={{
              borderRadius: '999px',
              px: { xs: 3, md: 4 },
              py: 1.1,
              fontWeight: 800,
              fontFamily: contentFont,
              bgcolor: '#5B8CFF',
              boxShadow: '0 12px 28px rgba(91, 140, 255, 0.35)',
              '&:hover': { bgcolor: '#4B7CFA' }
            }}
          >
            Start Full Assessment
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => setShowHistory((prev) => !prev)}
            sx={{
              borderRadius: '999px',
              px: { xs: 3, md: 4 },
              py: 1.1,
              fontWeight: 800,
              fontFamily: contentFont,
              color: '#FFFFFF',
              borderColor: 'rgba(255,255,255,0.7)',
              backgroundColor: 'rgba(13, 27, 58, 0.25)',
              '&:hover': {
                borderColor: '#FFFFFF',
                backgroundColor: 'rgba(13, 27, 58, 0.35)'
              }
            }}
          >
            {showHistory ? 'Hide Assessment History' : 'Assessment History'}
          </Button>
        </Box>

        <Box
          sx={{
            width: '100%',
            display: 'grid',
            gap: 3,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))'
            },
            alignItems: 'stretch'
          }}
        >
          {TEST_CARDS.map((card) => (
            <Box key={card.title} sx={{ minWidth: 0, display: 'flex' }}>
              <Card
                sx={{
                  width: '100%',
                  height: CARD_HEIGHT,
                  overflow: 'hidden',
                  position: 'relative',
                  borderRadius: 4,
                  border: '1px solid rgba(255,255,255,0.24)',
                  transition: 'transform 320ms ease, box-shadow 320ms ease',
                  boxShadow: '0 12px 30px rgba(10, 23, 49, 0.24)',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: '0 22px 48px rgba(10, 23, 49, 0.38)'
                  },
                  '&:hover .dashboard-card-image': {
                    transform: 'scale(1.06)'
                  }
                }}
              >
                <Box
                  className="dashboard-card-image"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    transition: 'transform 420ms ease',
                    transform: `scale(${card.imageScale || 1})`,
                    backgroundImage: `linear-gradient(180deg, rgba(10,26,52,0.08) 0%, rgba(10,26,52,0.65) 100%), url(${card.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />

                <CardContent
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 2.5,
                    px: 2,
                    textAlign: 'center'
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#fff',
                        fontWeight: 800,
                        fontFamily: kidsFont,
                        textShadow: '0 2px 10px rgba(0,0,0,0.35)'
                      }}
                    >
                      {card.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1,
                        color: 'rgba(255,255,255,0.96)',
                        fontFamily: contentFont,
                        textShadow: '0 1px 8px rgba(0,0,0,0.35)'
                      }}
                    >
                      {card.description}
                    </Typography>
                  </Box>

                  <Chip
                    label="Included in assessment"
                    size="small"
                    variant="outlined"
                    sx={{
                      mt: 'auto',
                      color: '#FFFFFF',
                      borderColor: 'rgba(255,255,255,0.65)',
                      fontFamily: contentFont
                    }}
                  />
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>

        {showHistory && (
          <Box
            sx={{
              mt: 5,
              borderRadius: 4,
              px: { xs: 2.5, sm: 4 },
              py: { xs: 2.5, sm: 3.5 },
              background: 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(247,251,255,0.82))',
              backdropFilter: 'blur(5px)',
              boxShadow: '0 16px 36px rgba(15, 32, 61, 0.22)'
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontFamily: kidsFont,
                color: '#5B8CFF',
                fontWeight: 800,
                fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' }
              }}
            >
              Assessment History
            </Typography>
            <Divider sx={{ my: 2.5 }} />

            {historyLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {!historyLoading && history.length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center', py: 4, fontFamily: contentFont }}
              >
                No assessments yet. Start your first assessment above.
              </Typography>
            )}

            {!historyLoading && history.length > 0 && (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
                  gap: 2
                }}
              >
                {history.map((assessment) => (
                  <Card key={assessment.id} variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {assessment.completedAt
                          ? new Date(assessment.completedAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })
                          : new Date(assessment.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Typography variant="h4" fontWeight="bold">
                          {assessment.overallRiskScore ?? 'N/A'}
                        </Typography>
                        <Chip
                          label={assessment.riskLevel ? assessment.riskLevel.toUpperCase() : 'UNKNOWN'}
                          color={
                            assessment.riskLevel === 'high'
                              ? 'error'
                              : assessment.riskLevel === 'moderate'
                                ? 'warning'
                                : assessment.riskLevel === 'low'
                                  ? 'success'
                                  : 'default'
                          }
                          size="small"
                        />
                      </Box>

                      <Chip
                        label={assessment.status === 'completed' ? 'Completed' : 'Incomplete'}
                        color={assessment.status === 'completed' ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                        sx={{ mb: 1.5 }}
                      />

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {['handwriting', 'reading', 'keystroke', 'memory'].map((module) => {
                          const done = (assessment.completedModules || []).includes(module);
                          return (
                            <Chip
                              key={module}
                              label={module.charAt(0).toUpperCase() + module.slice(1)}
                              size="small"
                              icon={
                                done ? (
                                  <CheckCircle fontSize="small" />
                                ) : (
                                  <RadioButtonUnchecked fontSize="small" />
                                )
                              }
                              color={done ? 'success' : 'default'}
                              variant={done ? 'filled' : 'outlined'}
                              sx={{ fontSize: '11px' }}
                            />
                          );
                        })}
                      </Box>

                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        onClick={() => navigate(`/assessment/overall/${assessment.id}`)}
                      >
                        View Results
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default Dashboard;
