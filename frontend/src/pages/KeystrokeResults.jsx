import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  GlobalStyles,
  LinearProgress,
  Paper,
  Typography,
} from '@mui/material';
import {
  Assessment,
  ArrowForward,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { keystrokeService } from '../services';
import keybg from '../assets/keybg.png';
import technologyIcon from '../assets/technology.png';
import starRatingIcon from '../assets/star-rating.png';
import focusIcon from '../assets/accuracy.png';
import daysIcon from '../assets/error.png';
import clockIcon from '../assets/error.png';
import ideaIcon from '../assets/idea.png';
import accuracyIcon from '../assets/accuracy.png';
import errorIcon from '../assets/error.png';
import wpmIcon from '../assets/WPM.png';
import anomalyIcon from '../assets/anomaly.png';

function getRiskColor(level) {
  const levelStr = typeof level === 'string' ? level.toLowerCase() : '';
  if (levelStr === 'low') return 'success';
  if (levelStr === 'moderate') return 'warning';
  if (levelStr === 'high') return 'error';
  return 'default';
}

function getRecommendationIcon(severity) {
  if (severity === 'high') return <Warning color="error" sx={{ fontSize: 16 }} />;
  if (severity === 'moderate') return <Warning color="warning" sx={{ fontSize: 16 }} />;
  return <CheckCircle color="success" sx={{ fontSize: 16 }} />;
}

function formatPercent(value, decimals = 2) {
  return Number.isFinite(value) ? `${Number(value).toFixed(decimals)}%` : 'N/A';
}

function formatBreakdownLabel(key = '') {
  return key
    .replace(/Risk$/, ' Risk')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

function buildRecommendations(result) {
  const breakdown = result?.riskBreakdown || {};
  const recommendations = [];

  if (result?.riskLevel === 'HIGH') {
    recommendations.push({
      severity: 'high',
      message: 'High overall risk detected. Repeat the assessment at a similar time of day and review consistency across multiple attempts.',
    });
  } else if (result?.riskLevel === 'MODERATE') {
    recommendations.push({
      severity: 'moderate',
      message: 'Moderate risk detected. Track trends over multiple sessions rather than relying on a single attempt.',
    });
  } else {
    recommendations.push({
      severity: 'low',
      message: 'Low risk detected in this session. Continue periodic monitoring to maintain a stable baseline.',
    });
  }

  if ((breakdown.speedRisk || 0) >= 60) {
    recommendations.push({
      severity: 'moderate',
      message: 'Typing speed is a major contributor. Practice short timed passages and focus on smooth rhythm before increasing pace.',
    });
  }

  if ((breakdown.pauseRisk || 0) >= 60) {
    recommendations.push({
      severity: 'moderate',
      message: 'Frequent long pauses were detected. Read the full prompt once before typing and type in phrase-level chunks.',
    });
  }

  if ((breakdown.backspaceRisk || 0) >= 60 || Number(result?.backspaceRate) >= 0.1) {
    recommendations.push({
      severity: 'moderate',
      message: 'Correction behavior is elevated. Slow down slightly and prioritize first-pass accuracy to reduce editing overhead.',
    });
  }

  if ((breakdown.errorRateRisk || 0) >= 30 || Number(result?.errorRate) >= 10) {
    recommendations.push({
      severity: 'moderate',
      message: 'Text error rate is meaningful. Add focused spelling and word-pattern drills to improve orthographic accuracy.',
    });
  }

  if (recommendations.length < 3) {
    recommendations.push({
      severity: 'low',
      message: 'Run at least three sessions and compare breakdown stability before drawing final conclusions.',
    });
  }

  return recommendations;
}

const KeystrokeResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const assessmentId = localStorage.getItem('currentAssessmentId');
  const isInAssessment = Boolean(assessmentId);

  useEffect(() => {
    const loadResult = async () => {
      try {
        setLoading(true);
        const response = await keystrokeService.getResults(id);
        if (response?.data?.success && response?.data?.result) {
          setResult(response.data.result);
          setError('');
        } else {
          setError('Failed to load keystroke result.');
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load keystroke result.');
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [id]);

  const recommendations = useMemo(() => buildRecommendations(result), [result]);

  if (loading) {
    return (
      <Box
        sx={{
          height: '100vh',
          backgroundImage: `url(${keybg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading keystroke results...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          height: '100vh',
          backgroundImage: `url(${keybg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.92)' }}>
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          <Button variant="contained" onClick={() => navigate('/dashboard')} sx={{ bgcolor: '#6C4DE6' }}>
            Back to Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  if (!result) return null;

  const riskScore = Number(result.riskScore) || 0;
  const riskLevel = result.riskLevel || 'N/A';
  const riskBreakdown = result.riskBreakdown || {};
  const recommendationItems = recommendations || [];
  const arrangedRecommendations = recommendationItems.length > 3
    ? [recommendationItems[0], recommendationItems[3], recommendationItems[1], recommendationItems[2]].filter(Boolean)
    : recommendationItems.slice(0, 3);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: `url(${keybg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        pt: '6vh',
        pb: '6vh'
      }}
    >
      <GlobalStyles styles={{ '.MuiAppBar-root': { position: 'static' } }} />
      <Container maxWidth="lg" sx={{ width: '100%' }}>
        <Paper
          sx={{
            p: 4,
            mt: 10,
            borderRadius: 4,
            bgcolor: 'rgba(255,255,255,0.92)',
            width: '100%'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box component="img" src={technologyIcon} alt="technology" sx={{ width: 38, height: 38 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#6C4DE6' }}>
                Keystroke Result
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Test completed on {new Date(result.createdAt || Date.now()).toLocaleString()}
              </Typography>
            </Box>
            <Chip
              icon={<Assessment />}
              label={`Risk Level: ${riskLevel}`}
              color={getRiskColor(riskLevel)}
              size="small"
              sx={{ ml: 'auto' }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Box component="img" src={starRatingIcon} alt="score" sx={{ width: 18, height: 18 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#6C4DE6' }}>
              Overall Risk Score
            </Typography>
            <Typography variant="h6" sx={{ ml: 'auto', fontWeight: 700 }}>
              {riskScore}/100
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.max(0, Math.min(100, riskScore))}
            sx={{
              height: 14,
              borderRadius: 2,
              mb: 2,
              backgroundColor: '#E9E2FF',
              '& .MuiLinearProgress-bar': { backgroundColor: '#6C4DE6' }
            }}
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            {[
              {
                label: 'Accuracy',
                value: formatPercent(result.accuracy),
                icon: accuracyIcon,
              },
              {
                label: 'Error Rate',
                value: formatPercent(result.errorRate),
                icon: errorIcon,
              },
              {
                label: 'WPM',
                value: Number.isFinite(result.wpm) ? Number(result.wpm).toFixed(2) : 'N/A',
                icon: wpmIcon,
              },
              {
                label: 'Anomaly',
                value: Number.isFinite(result.anomalyScore) ? Number(result.anomalyScore).toFixed(3) : 'N/A',
                icon: anomalyIcon,
              },
            ].map((item) => (
              <Paper
                key={item.label}
                sx={{
                  p: 2,
                  minWidth: 220,
                  flex: '1 1 220px',
                  borderRadius: 3,
                  bgcolor: '#FFFFFF',
                  boxShadow: '0 8px 18px rgba(108,77,230,0.18)',
                  border: '1px solid rgba(108,77,230,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <Box
                  component="img"
                  src={item.icon}
                  alt={item.label}
                  sx={{ width: 42, height: 42 }}
                />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#6C4DE6' }}>
                    {item.label}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#2B2B2B' }}>
                    {item.value}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Paper sx={{ p: 2, borderRadius: 3, bgcolor: '#F4F0FD', flex: 1, minWidth: 260 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#6C4DE6', mb: 1 }}>
                Timing Metrics
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Average Hold Time</Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {Number.isFinite(result.avgHoldTime) ? `${result.avgHoldTime.toFixed(2)} ms` : 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Hold Time Variability (CV)</Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {Number.isFinite(result.cvHoldTime) ? `${Number(result.cvHoldTime).toFixed(2)}%` : 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Average Flight Time</Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {Number.isFinite(result.avgFlightTime) ? `${result.avgFlightTime.toFixed(2)} ms` : 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Flight Time Variability (CV)</Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {Number.isFinite(result.cvFlightTime) ? `${Number(result.cvFlightTime).toFixed(2)}%` : 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Pause Frequency</Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {Number.isFinite(result.pauseFrequency) ? Number(result.pauseFrequency).toFixed(4) : 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Pause Duration</Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {Number.isFinite(result.pauseDuration) ? `${Number(result.pauseDuration).toFixed(2)} ms` : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Paper sx={{ p: 2, borderRadius: 3, bgcolor: '#F4F0FD', flex: 1, minWidth: 260 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#6C4DE6', mb: 1 }}>
                Risk Breakdown
              </Typography>
              {Object.entries(riskBreakdown).map(([key, value]) => {
                const numericValue = Math.min(100, Math.max(0, Number(value) || 0));
                return (
                  <Box key={key} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatBreakdownLabel(key)}
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {numericValue}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={numericValue}
                      sx={{
                        height: 8,
                        borderRadius: 2,
                        backgroundColor: '#E9E2FF',
                        '& .MuiLinearProgress-bar': { backgroundColor: '#6C4DE6' }
                      }}
                    />
                  </Box>
                );
              })}
            </Paper>
          </Box>

          <Paper sx={{ p: 2, borderRadius: 3, bgcolor: '#F4F0FD', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box component="img" src={ideaIcon} alt="recommendation" sx={{ width: 22, height: 22 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#6C4DE6' }}>
                Recommendations
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: recommendationItems.length > 3 ? '1fr 1fr' : '1fr',
                columnGap: 2,
                rowGap: 1
              }}
            >
              {arrangedRecommendations.map((rec, index) => (
                <Box key={`${rec.message}-${index}`} sx={{ display: 'flex', gap: 1 }}>
                  {getRecommendationIcon(rec.severity)}
                  <Typography variant="caption" color="text.secondary">
                    {rec.message}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 'auto' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/assessment/keystroke')}
              sx={{ bgcolor: '#6C4DE6', '&:hover': { bgcolor: '#5B3FE0' } }}
            >
              Try Again
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
              sx={{ borderColor: '#6C4DE6', color: '#6C4DE6',borderRadius: '5px', px: 5, py: 1, '&:hover': { borderColor: '#5B3FE0', backgroundColor: 'rgba(91,63,224,0.04)' } }}
            >
              Back to Dashboard
            </Button>
            {isInAssessment && (
              <Button
                variant="contained"
                onClick={() => navigate('/assessment/instructions/memory')}
                endIcon={<ArrowForward />}
                sx={{ bgcolor: '#6C4DE6', '&:hover': { bgcolor: '#5B3FE0' } }}
              >
                Continue
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default KeystrokeResults;
