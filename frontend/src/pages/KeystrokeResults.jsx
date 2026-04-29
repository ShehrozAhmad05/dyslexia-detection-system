import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import {
  Assessment,
  ArrowForward,
  Home,
  Keyboard,
  Lightbulb,
  Schedule,
  Speed,
  Timer,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { keystrokeService } from '../services';

function getRiskColor(level) {
  const levelStr = typeof level === 'string' ? level.toLowerCase() : '';
  if (levelStr === 'low') return 'success';
  if (levelStr === 'moderate') return 'warning';
  if (levelStr === 'high') return 'error';
  return 'default';
}

function getRecommendationIcon(severity) {
  if (severity === 'high') return <Warning color="error" />;
  if (severity === 'moderate') return <Warning color="warning" />;
  return <CheckCircle color="success" />;
}

function formatPercent(value, decimals = 2) {
  return Number.isFinite(value) ? `${Number(value).toFixed(decimals)}%` : 'N/A';
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
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading keystroke results...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </Container>
    );
  }

  if (!result) return null;

  const riskScore = Number(result.riskScore) || 0;
  const riskLevel = result.riskLevel || 'N/A';
  const riskBreakdown = result.riskBreakdown || {};

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Keystroke Assessment Results
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Test completed on {new Date(result.createdAt || Date.now()).toLocaleString()}
            </Typography>
          </Box>
          <Chip
            icon={<Assessment />}
            label={`Risk Level: ${riskLevel}`}
            color={getRiskColor(riskLevel)}
            size="medium"
          />
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Overall Risk Score</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={Math.max(0, Math.min(100, riskScore))}
              color={getRiskColor(riskLevel)}
              sx={{ height: 18, borderRadius: 1 }}
            />
          </Box>
          <Typography variant="h5" fontWeight="bold">{riskScore}/100</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Score is a fusion of rule-based behavior metrics and ML anomaly contribution.
        </Typography>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Accuracy</Typography>
              <Typography variant="h5" fontWeight="bold">{formatPercent(result.accuracy)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Error Rate</Typography>
              <Typography variant="h5" fontWeight="bold">{formatPercent(result.errorRate)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Speed color="primary" fontSize="small" />
                <Typography variant="subtitle2" color="text.secondary">WPM</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">{Number.isFinite(result.wpm) ? Number(result.wpm).toFixed(2) : 'N/A'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Keyboard color="primary" fontSize="small" />
                <Typography variant="subtitle2" color="text.secondary">Anomaly</Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold">
                {Number.isFinite(result.anomalyScore) ? Number(result.anomalyScore).toFixed(3) : 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Is Anomalous: {result.isAnomalous ? 'Yes' : 'No'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Timer sx={{ verticalAlign: 'middle', mr: 1 }} />
              Timing Metrics
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Average Hold Time</Typography>
                <Typography variant="body2" fontWeight="bold">{Number.isFinite(result.avgHoldTime) ? `${result.avgHoldTime.toFixed(2)} ms` : 'N/A'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Hold Time Variability (CV)</Typography>
                <Typography variant="body2" fontWeight="bold">{Number.isFinite(result.cvHoldTime) ? `${Number(result.cvHoldTime).toFixed(2)}%` : 'N/A'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Average Flight Time</Typography>
                <Typography variant="body2" fontWeight="bold">{Number.isFinite(result.avgFlightTime) ? `${result.avgFlightTime.toFixed(2)} ms` : 'N/A'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Flight Time Variability (CV)</Typography>
                <Typography variant="body2" fontWeight="bold">{Number.isFinite(result.cvFlightTime) ? `${Number(result.cvFlightTime).toFixed(2)}%` : 'N/A'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Pause Frequency</Typography>
                <Typography variant="body2" fontWeight="bold">{Number.isFinite(result.pauseFrequency) ? Number(result.pauseFrequency).toFixed(4) : 'N/A'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Pause Duration</Typography>
                <Typography variant="body2" fontWeight="bold">{Number.isFinite(result.pauseDuration) ? `${Number(result.pauseDuration).toFixed(2)} ms` : 'N/A'}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Assessment sx={{ verticalAlign: 'middle', mr: 1 }} />
              Risk Breakdown
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {Object.entries(riskBreakdown).map(([key, value]) => {
              const numericValue = Math.max(0, Math.min(100, Number(value) || 0));
              const label = key
                .replace(/Risk$/, ' Risk')
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (s) => s.toUpperCase())
                .replace(/\s+/g, ' ')
                .trim();
              return (
                <Box key={key} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight="bold">{numericValue}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={numericValue}
                    color={numericValue >= 70 ? 'error' : numericValue >= 40 ? 'warning' : 'success'}
                    sx={{ height: 10, borderRadius: 1 }}
                  />
                </Box>
              );
            })}
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <Lightbulb sx={{ verticalAlign: 'middle', mr: 1, color: 'warning.main' }} />
          Personalized Recommendations
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <List>
          {recommendations.map((item, index) => (
            <ListItem key={`${item.message}-${index}`} sx={{ py: 1.2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                {getRecommendationIcon(item.severity)}
              </ListItemIcon>
              <ListItemText
                primary={item.message}
                secondary={
                  <Chip
                    label={`Priority: ${item.severity.toUpperCase()}`}
                    size="small"
                    color={item.severity === 'high' ? 'error' : item.severity === 'moderate' ? 'warning' : 'success'}
                    sx={{ mt: 0.8, height: 20 }}
                  />
                }
                secondaryTypographyProps={{ component: 'div' }}
              />
            </ListItem>
          ))}
        </List>
        <Alert severity="info" icon={<Schedule fontSize="inherit" />} sx={{ mt: 1.5 }}>
          Recommendations are supportive guidance for screening context and should be interpreted alongside repeated assessments.
        </Alert>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button variant="outlined" startIcon={<Home />} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
        <Button variant="contained" onClick={() => navigate('/assessment/keystroke')}>
          Take Another Keystroke Test
        </Button>
      </Box>

      {isInAssessment && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            color="success"
            onClick={() => navigate('/assessment/instructions/memory')}
            endIcon={<ArrowForward />}
          >
            Continue to Memory Test
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default KeystrokeResults;
