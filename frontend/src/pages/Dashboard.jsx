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
  Divider,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  TrendingUp,
  AutoGraph,
  AssignmentTurnedIn,
  Psychology
} from '@mui/icons-material';
import { useAuth } from '@contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { assessmentService } from '@services';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import handwritingImage from '../assets/writing.png';
import keystrokeImage from '../assets/key.png';
import readingImage from '../assets/reading.png';
import memoryImage from '../assets/memory.png';
import dashboardBackground from '../assets/dashboardbg.avif';

const kidsFont = '"Comic Sans MS", "Chalkboard SE", "Marker Felt", "Baloo 2", cursive';
const contentFont = '"Comic Sans MS", "Chalkboard SE", "Nunito", sans-serif';
const WHITE_PANEL = {
  borderRadius: 4,
  px: { xs: 2.5, sm: 4 },
  py: { xs: 2.5, sm: 3.5 },
  background: 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(247,251,255,0.82))',
  backdropFilter: 'blur(5px)',
  boxShadow: '0 16px 36px rgba(15, 32, 61, 0.22)'
};

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

  function getRiskColor(level) {
    switch ((level || '').toLowerCase()) {
      case 'high': return '#ef5350';
      case 'moderate': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short'
    });
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function buildProgressData(assessments) {
    const sorted = [...assessments]
      .filter(a => a.overallRiskScore != null)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(-6);

    return sorted.map((a, index) => ({
      date: `Test ${index + 1}`,
      fullDate: formatDateShort(a.completedAt || a.createdAt),
      overall: a.overallRiskScore,
      handwriting: a.fusionAnalysis?.moduleScores?.handwriting ?? null,
      reading: a.fusionAnalysis?.moduleScores?.reading ?? null,
      keystroke: a.fusionAnalysis?.moduleScores?.keystroke ?? null,
      memory: a.fusionAnalysis?.moduleScores?.memory ?? null
    }));
  }

  function buildRadarData(assessment) {
    if (!assessment?.fusionAnalysis?.moduleScores) return [];
    const s = assessment.fusionAnalysis.moduleScores;
    return [
      { module: 'Handwriting', score: s.handwriting ?? 0 },
      { module: 'Reading', score: s.reading ?? 0 },
      { module: 'Keystroke', score: s.keystroke ?? 0 },
      { module: 'Memory', score: s.memory ?? 0 }
    ];
  }

  function generateInsights(assessments) {
    const insights = [];
    const completed = assessments.filter(
      a => a.status === 'completed' && a.overallRiskScore != null
    );
    if (completed.length < 1) return insights;

    const latest = completed[0];
    const scores = latest.fusionAnalysis?.moduleScores || {};
    const moduleNames = ['handwriting', 'reading', 'keystroke', 'memory'];

    const highModules = moduleNames.filter(
      m => scores[m] != null && scores[m] >= 67
    );
    const lowModules = moduleNames.filter(
      m => scores[m] != null && scores[m] < 34
    );

    if (completed.length >= 2) {
      const previous = completed[1];
      const diff = (latest.overallRiskScore || 0) -
                   (previous.overallRiskScore || 0);
      if (diff <= -5) {
        insights.push({
          type: 'success',
          text: `Overall risk improved by ${Math.abs(diff)} points since last assessment — great progress!`
        });
      } else if (diff >= 5) {
        insights.push({
          type: 'warning',
          text: `Overall risk increased by ${diff} points since last assessment.`
        });
      }
    }

    if (highModules.length > 0) {
      insights.push({
        type: 'error',
        text: `High risk detected in: ${highModules
          .map(m => m.charAt(0).toUpperCase() + m.slice(1))
          .join(', ')}`
      });
    }

    if (lowModules.length > 0) {
      insights.push({
        type: 'success',
        text: `Low risk in: ${lowModules
          .map(m => m.charAt(0).toUpperCase() + m.slice(1))
          .join(', ')}`
      });
    }

    if (completed.length >= 3) {
      const last3 = completed.slice(0, 3).map(a => a.overallRiskScore || 0);
      if (last3.every(s => s >= 67)) {
        insights.push({
          type: 'warning',
          text: 'Risk has been consistently high across last 3 assessments — consider professional consultation.'
        });
      } else if (last3.every(s => s < 34)) {
        insights.push({
          type: 'success',
          text: 'Consistently low risk across last 3 assessments!'
        });
      }
    }

    return insights.slice(0, 4);
  }

  const completedAssessments = history.filter(
    a => a.status === 'completed'
  );
  const latestAssessment = completedAssessments[0] || null;
  const progressData = buildProgressData(completedAssessments);
  const radarData = buildRadarData(latestAssessment);
  const insights = generateInsights(history);
  const averageOverall = completedAssessments.length > 0
    ? Math.round(
      completedAssessments.reduce((sum, a) => sum + (a.overallRiskScore || 0), 0) / completedAssessments.length
    )
    : null;
  const latestVsPrevious = completedAssessments.length >= 2
    ? (completedAssessments[0].overallRiskScore || 0) -
      (completedAssessments[1].overallRiskScore || 0)
    : null;
  const trendLabel = latestVsPrevious == null
    ? 'No trend yet'
    : latestVsPrevious < 0
      ? `${Math.abs(Math.round(latestVsPrevious))} points better than last test`
      : latestVsPrevious > 0
        ? `${Math.round(latestVsPrevious)} points higher than last test`
        : 'No change from last test';

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
            ...WHITE_PANEL
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
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))'
            },
            mb: 3
          }}
        >
          {[
            {
              label: 'Assessments Completed',
              value: completedAssessments.length,
              hint: completedAssessments.length ? 'Your tracked sessions' : 'No sessions yet',
              icon: <AssignmentTurnedIn fontSize="small" />
            },
            {
              label: 'Average Overall Score',
              value: averageOverall != null ? `${averageOverall}/100` : 'N/A',
              hint: completedAssessments.length ? 'Across completed assessments' : 'Start first assessment',
              icon: <AutoGraph fontSize="small" />
            },
            {
              label: 'Latest Risk Trend',
              value: latestVsPrevious == null ? '—' : latestVsPrevious <= 0 ? 'Improving' : 'Needs Attention',
              hint: trendLabel,
              icon: <TrendingUp fontSize="small" />
            },
            {
              label: 'Modules Completed (Latest)',
              value: latestAssessment?.completedModules?.length != null
                ? `${latestAssessment.completedModules.length}/4`
                : '0/4',
              hint: latestAssessment ? 'In your most recent run' : 'No completed assessment yet',
              icon: <Psychology fontSize="small" />
            }
          ].map((stat) => (
            <Card
              key={stat.label}
              sx={{
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.28)',
                background: 'linear-gradient(140deg, rgba(255,255,255,0.94), rgba(246,250,255,0.82))',
                boxShadow: '0 12px 26px rgba(11, 30, 64, 0.2)'
              }}
            >
              <CardContent sx={{ py: 2.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{
                    color: '#496489',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    fontFamily: contentFont
                  }}>
                    {stat.label}
                  </Typography>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: '50%',
                    display: 'grid', placeItems: 'center',
                    color: '#5B8CFF', bgcolor: 'rgba(91,140,255,0.14)'
                  }}>
                    {stat.icon}
                  </Box>
                </Box>
                <Typography sx={{
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  color: '#1F3E66',
                  fontFamily: kidsFont,
                  lineHeight: 1.1
                }}>
                  {stat.value}
                </Typography>
                <Typography sx={{
                  mt: 0.8,
                  color: '#7A8FA6',
                  fontSize: '0.78rem',
                  fontFamily: contentFont
                }}>
                  {stat.hint}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))'
            }
          }}
        >
          {TEST_CARDS.map((card) => (
            <Card
              key={card.title}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.25)',
                background: 'linear-gradient(160deg, rgba(10,26,52,0.78), rgba(27,55,99,0.72))',
                boxShadow: '0 16px 32px rgba(10, 23, 49, 0.28)',
                transition: 'transform 260ms ease, box-shadow 260ms ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 22px 40px rgba(10, 23, 49, 0.36)'
                }
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `linear-gradient(130deg, rgba(11,24,48,0.78), rgba(11,24,48,0.36)), url(${card.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.55
                }}
              />
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Typography sx={{
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontFamily: kidsFont,
                  fontSize: '1.15rem'
                }}>
                  {card.title}
                </Typography>
                <Typography sx={{
                  mt: 0.6,
                  color: 'rgba(255,255,255,0.92)',
                  fontSize: '0.83rem',
                  fontFamily: contentFont,
                  minHeight: 38
                }}>
                  {card.description}
                </Typography>
                <Chip
                  label="Completed in guided sequence"
                  size="small"
                  sx={{
                    mt: 1.4,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.35)',
                    fontWeight: 700,
                    fontFamily: contentFont
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </Box>

        {historyLoading && (
          <Box sx={{
            mt: 4,
            ...WHITE_PANEL,
            display: 'flex',
            justifyContent: 'center',
            py: 4
          }}>
            <CircularProgress sx={{ color: '#5B8CFF' }} />
          </Box>
        )}

        {!historyLoading && latestAssessment && (
          <Box sx={{ mt: 4, ...WHITE_PANEL }}>
            <Typography variant="h5" sx={{
              fontFamily: kidsFont, color: '#5B8CFF',
              fontWeight: 800, mb: 3,
              fontSize: { xs: '1.3rem', sm: '1.6rem' }
            }}>
              Your Latest Assessment
            </Typography>

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '60% 40%' },
              gap: 3, alignItems: 'center'
            }}>
              <Box>
                <Typography variant="caption"
                  sx={{ color: '#7a8fa6', fontFamily: contentFont }}>
                  {latestAssessment.completedAt
                    ? new Date(latestAssessment.completedAt)
                        .toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })
                    : new Date(latestAssessment.createdAt)
                        .toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })
                  }
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, mb: 2 }}>
                  <Typography sx={{
                    fontSize: { xs: '3rem', sm: '4rem' },
                    fontWeight: 800,
                    color: getRiskColor(latestAssessment.riskLevel),
                    lineHeight: 1,
                    fontFamily: kidsFont
                  }}>
                    {latestAssessment.overallRiskScore ?? 'N/A'}
                  </Typography>
                  <Box>
                    <Typography sx={{
                      fontSize: '0.8rem', color: '#7a8fa6',
                      fontFamily: contentFont
                    }}>
                      out of 100
                    </Typography>
                    <Chip
                      label={latestAssessment.riskLevel
                        ? latestAssessment.riskLevel.toUpperCase()
                        : 'UNKNOWN'}
                      size="small"
                      sx={{
                        mt: 0.5,
                        bgcolor: getRiskColor(latestAssessment.riskLevel),
                        color: 'white', fontWeight: 700,
                        fontFamily: contentFont
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 1.5
                }}>
                  {[
                    { key: 'handwriting', emoji: '✍️', label: 'Handwriting' },
                    { key: 'reading', emoji: '📖', label: 'Reading' },
                    { key: 'keystroke', emoji: '⌨️', label: 'Keystroke' },
                    { key: 'memory', emoji: '🧠', label: 'Memory' }
                  ].map(({ key, emoji, label }) => {
                    const score = latestAssessment.fusionAnalysis?.moduleScores?.[key];
                    const level = score == null ? 'unknown'
                      : score >= 67 ? 'high'
                      : score >= 34 ? 'moderate'
                      : 'low';
                    return (
                      <Box key={key} sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: 'rgba(255,255,255,0.7)',
                        border: '1px solid rgba(91,140,255,0.15)',
                        boxShadow: '0 2px 8px rgba(15,32,61,0.08)'
                      }}>
                        <Typography sx={{ fontSize: '1.3rem', lineHeight: 1 }}>
                          {emoji}
                        </Typography>
                        <Typography sx={{
                          fontSize: '0.75rem', fontWeight: 700,
                          color: '#2F466A', fontFamily: contentFont, mt: 0.5
                        }}>
                          {label}
                        </Typography>
                        <Typography sx={{
                          fontSize: '1.1rem', fontWeight: 800,
                          color: getRiskColor(level), fontFamily: kidsFont
                        }}>
                          {score != null ? `${Math.round(score)}/100` : 'N/A'}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={score ?? 0}
                          sx={{
                            mt: 0.5, height: 5, borderRadius: 3,
                            bgcolor: 'rgba(0,0,0,0.08)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: getRiskColor(level),
                              borderRadius: 3
                            }
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>

                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    mt: 2.5, borderRadius: '999px',
                    bgcolor: '#5B8CFF', fontFamily: contentFont,
                    fontWeight: 700,
                    '&:hover': { bgcolor: '#4B7CFA' }
                  }}
                  onClick={() => navigate(
                    `/assessment/overall/${latestAssessment.id}`
                  )}
                >
                  View Full Results
                </Button>
              </Box>

              <Box>
                <Typography sx={{
                  fontFamily: contentFont, color: '#2F466A',
                  fontWeight: 700, fontSize: '0.9rem', mb: 1,
                  textAlign: 'center'
                }}>
                  Module Comparison
                </Typography>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(91,140,255,0.2)" />
                    <PolarAngleAxis
                      dataKey="module"
                      tick={{
                        fontSize: 12,
                        fontFamily: contentFont,
                        fill: '#2F466A'
                      }}
                    />
                    <PolarRadiusAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#5B8CFF"
                      fill="#5B8CFF"
                      fillOpacity={0.35}
                      strokeWidth={2}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}/100`, 'Score']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Box>
        )}

        {!historyLoading && progressData.length >= 2 && (
          <Box sx={{ mt: 4, ...WHITE_PANEL }}>
            <Typography variant="h5" sx={{
              fontFamily: kidsFont, color: '#5B8CFF',
              fontWeight: 800, mb: 0.5,
              fontSize: { xs: '1.3rem', sm: '1.6rem' }
            }}>
              Progress Over Time
            </Typography>
            <Typography variant="body2" sx={{
              color: '#7a8fa6', fontFamily: contentFont, mb: 3
            }}>
              Your risk scores across all assessments
            </Typography>

            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={progressData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3"
                  stroke="rgba(91,140,255,0.15)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fontFamily: contentFont, fill: '#2F466A' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fontFamily: contentFont, fill: '#2F466A' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12, fontFamily: contentFont, fontSize: 12
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return `${label} — ${payload[0]?.payload?.fullDate || ''}`;
                    }
                    return label;
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontFamily: contentFont, fontSize: 12
                  }}
                />
                <Line type="monotone" dataKey="overall"
                  stroke="#5B8CFF" strokeWidth={3}
                  dot={{ r: 5 }} name="Overall"
                  connectNulls={true} />
                <Line type="monotone" dataKey="handwriting"
                  stroke="#ef5350" strokeWidth={1.5}
                  strokeDasharray="5 5" dot={{ r: 3 }}
                  name="Handwriting" connectNulls={true} />
                <Line type="monotone" dataKey="reading"
                  stroke="#4caf50" strokeWidth={1.5}
                  strokeDasharray="5 5" dot={{ r: 3 }}
                  name="Reading" connectNulls={true} />
                <Line type="monotone" dataKey="keystroke"
                  stroke="#ff9800" strokeWidth={1.5}
                  strokeDasharray="5 5" dot={{ r: 3 }}
                  name="Keystroke" connectNulls={true} />
                <Line type="monotone" dataKey="memory"
                  stroke="#9c27b0" strokeWidth={1.5}
                  strokeDasharray="5 5" dot={{ r: 3 }}
                  name="Memory" connectNulls={true} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}

        {!historyLoading && insights.length > 0 && (
          <Box sx={{ mt: 4, ...WHITE_PANEL }}>
            <Typography variant="h5" sx={{
              fontFamily: kidsFont, color: '#5B8CFF',
              fontWeight: 800, mb: 2.5,
              fontSize: { xs: '1.3rem', sm: '1.6rem' }
            }}>
              📊 Your Insights
            </Typography>
            {insights.map((insight, i) => (
              <Alert
                key={i}
                severity={insight.type === 'error' ? 'error'
                  : insight.type === 'warning' ? 'warning'
                  : 'success'}
                sx={{
                  mb: 1.5, borderRadius: 3,
                  fontFamily: contentFont,
                  '& .MuiAlert-message': { fontFamily: contentFont }
                }}
              >
                {insight.text}
              </Alert>
            ))}
          </Box>
        )}

        {showHistory && (
          <Box
            sx={{
              mt: 5,
              ...WHITE_PANEL
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
