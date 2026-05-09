import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Button,
  CircularProgress,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Speed,
  Refresh,
  ArrowForward,
  Pause,
  Timer,
  Lightbulb,
  Assessment,
  Home,
  Verified,
  Warning,
  Schedule,
  Info,
  Science,
} from '@mui/icons-material';
import { readingService } from '../services';

const ReadingResults = () => {
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
        const response = await readingService.getResults(id);
        
        if (response.data.success) {
          setResult(response.data.result);
          setError('');
        } else {
          setError('Failed to load results');
        }
      } catch (err) {
        console.error('Error loading results:', err);
        setError(err.response?.data?.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    
    loadResult();
  }, [id]);
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading results...</Typography>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }
  
  if (!result) {
    return null;
  }
  
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 
      ? `${minutes}m ${remainingSeconds}s` 
      : `${seconds}s`;
  };
  
  const getRiskColor = (level) => {
    const levelStr = typeof level === 'string' ? level : level?.toLowerCase?.() || '';
    switch (levelStr.toLowerCase()) {
      case 'low': return 'success';
      case 'moderate': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };
  
  const getConfidenceBadge = (confidence) => {
    switch (confidence) {
      case 'HIGH':
        return { 
          label: 'Validated', 
          color: 'success', 
          icon: <Verified fontSize="small" />,
          description: 'Directly validated by peer-reviewed studies'
        };
      case 'MODERATE':
        return { 
          label: 'Supported', 
          color: 'warning', 
          icon: <Warning fontSize="small" />,
          description: 'Supported by literature, web-specific validation needed'
        };
      case 'LOW':
        return { 
          label: 'Experimental', 
          color: 'info', 
          icon: <Schedule fontSize="small" />,
          description: 'Novel approach requiring pilot validation'
        };
      default:
        return { 
          label: 'Unknown', 
          color: 'default', 
          icon: <Info fontSize="small" />,
          description: 'No validation information available'
        };
    }
  };
  
  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `url('/src/assets/rbgr.png')`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          zIndex: 0
        }}
      />
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          pt: 12,
          pb: 4,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start'
        }}
      >
        {/* Main Result Card */}
      <Paper
        elevation={4}
        sx={{
          width: '90%',
          maxWidth: 1100,
          bgcolor: 'rgba(255, 255, 255, 0.98)',
          borderRadius: 2,
          p: 4,
        }}
      >
        {/* Header with Icon and Title */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              component="img"
              src="/src/assets/person.png"
              sx={{ width: 40, height: 40 }}
            />
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 'bold',
                  color: '#2F5E1A',
                  mb: 0.5,
                }}
              >
                Reading Result
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Test completed on {new Date(result.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={`Risk Level: ${result.riskLevel}`}
            color={getRiskColor(result.riskLevel)}
            size="large"
            sx={{ fontSize: '0.95rem', py: 2 }}
          />
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Risk Score Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                color: '#2F5E1A',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Timer sx={{ color: '#2F5E1A' }} />
              Overall Risk Score
            </Typography>
            <Chip
              icon={<Science sx={{ color: '#2F5E1A' }} />}
              label="95.2% ML Accuracy"
              size="small"
              variant="outlined"
              sx={{ borderColor: '#2F5E1A' }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={result.riskScore}
                color={getRiskColor(result.riskLevel)}
                sx={{ height: 20, borderRadius: 1 }}
              />
            </Box>
            <Typography variant="h5" fontWeight="bold" sx={{ minWidth: 80 }}>
              {result.riskScore}/100
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Risk scoring validated against ETDD70 dataset (Nilsson Benfatto 2016, Nerušil 2021)
          </Typography>
        </Box>

        {/* 4 Metric Cards Grid */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {/* Reading Speed */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'rgba(47, 94, 26, 0.05)', height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Speed sx={{ color: '#2F5E1A', mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Reading Speed
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold">
                  {result.wordsPerMinute}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  words/minute
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Comprehension */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'rgba(47, 94, 26, 0.05)', height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Assessment sx={{ color: '#2F5E1A', mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Comprehension
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold">
                  {result.comprehensionScore}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {result.correctAnswers}/{result.totalQuestions} correct
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Revisits */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'rgba(47, 94, 26, 0.05)', height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Refresh sx={{ color: '#2F5E1A', mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Revisits
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold">
                  {result.totalRevisits}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  re-reading sections
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Pauses */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'rgba(47, 94, 26, 0.05)', height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Pause sx={{ color: '#2F5E1A', mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Pauses
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold">
                  {result.pauseCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  avg {formatTime(result.averagePauseDuration)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Timing Metrics, Feature Scores, and Confidence Level columns */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 2.5,
                bgcolor: 'rgba(47, 94, 26, 0.05)',
                borderRadius: 1,
                height: '100%',
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  color: '#2F5E1A',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2,
                }}
              >
                <Timer sx={{ color: '#2F5E1A' }} />
                Timing Metrics
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Reading Time:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatTime(result.totalReadingTime)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Question Time:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatTime(result.timeToAnswerQuestions)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Avg Time per Section:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatTime(result.averageTimePerSegment)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Pause Frequency:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {result.pauseFrequency.toFixed(1)}/min
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 2.5,
                bgcolor: 'rgba(47, 94, 26, 0.05)',
                borderRadius: 1,
                height: '100%',
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  color: '#2F5E1A',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2,
                }}
              >
                <Assessment sx={{ color: '#2F5E1A' }} />
                Feature Scores (Weighted)
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {result.featureScores &&
                  Object.entries({
                    readingTime: { label: 'Reading Time', weight: '30.8%' },
                    comprehension: { label: 'Comprehension', weight: '30.0%' },
                    revisitCount: { label: 'Revisit Pattern', weight: '17.1%' },
                    pauseCount: { label: 'Pause Count', weight: '16.9%' },
                    avgPauseDuration: { label: 'Pause Duration', weight: '5.2%' },
                  }).map(([key, { label, weight }]) => {
                    const featureData = result.featureScores[key];
                    if (!featureData) return null;

                    const badge = getConfidenceBadge(featureData.confidence);
                    const normalizedScore = featureData.normalized || 0;

                    return (
                      <Box key={key}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 0.5,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" fontWeight="bold">
                              {label}
                            </Typography>
                            <Chip
                              icon={badge.icon}
                              label={badge.label}
                              size="small"
                              color={badge.color}
                              sx={{ height: 18 }}
                              title={badge.description}
                            />
                          </Box>
                          <Typography variant="caption" fontWeight="bold">
                            {Math.round(normalizedScore)}/100
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={normalizedScore}
                          color={
                            normalizedScore > 70
                              ? 'error'
                              : normalizedScore > 40
                                ? 'warning'
                                : 'success'
                          }
                          sx={{ height: 6 }}
                        />
                      </Box>
                    );
                  })}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 2.5,
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 1,
                height: '100%',
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#2F5E1A' }}>
                Confidence Levels
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Verified fontSize="small" color="success" />
                  <Typography variant="body2"><strong>Validated:</strong> 60.8% (reading time + comprehension)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning fontSize="small" sx={{ color: '#FF9800' }} />
                  <Typography variant="body2"><strong>Supported:</strong> 17.1% (revisit count)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Schedule fontSize="small" color="info" />
                  <Typography variant="body2"><strong>Experimental:</strong> 22.1% (pause metrics)</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
        {/* Personalized Recommendations */}
        {result.recommendations && result.recommendations.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                color: '#2F5E1A',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
              }}
            >
              <Lightbulb sx={{ color: '#2F5E1A' }} />
              Personalized Recommendations
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List sx={{ p: 0 }}>
              {result.recommendations.map((recommendation, index) => {
                const isObject = recommendation && typeof recommendation === 'object' && !Array.isArray(recommendation);
                const message = isObject
                  ? (recommendation.message || recommendation.metric || JSON.stringify(recommendation))
                  : recommendation;
                const severity = isObject ? recommendation.severity : null;
                const confidence = isObject ? recommendation.confidence : null;
                const citation = isObject ? recommendation.citation : null;
                const experimental = isObject ? recommendation.experimental : false;

                const getIcon = () => {
                  if (severity === 'high') return <Cancel color="error" />;
                  if (severity === 'moderate') return <Warning sx={{ color: '#FF9800' }} />;
                  if (severity === 'info') return <Info color="info" />;
                  return <CheckCircle sx={{ color: '#2F5E1A' }} />;
                };

                return (
                  <ListItem key={index} sx={{ py: 1, px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 35 }}>
                      {getIcon()}
                    </ListItemIcon>
                    <ListItemText
                      primary={String(message || '')}
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          {confidence && (
                            <Chip
                              label={`Confidence: ${confidence}`}
                              size="small"
                              color={confidence === 'HIGH' ? 'success' : confidence === 'MODERATE' ? 'warning' : 'info'}
                              sx={{ mr: 1, height: 18 }}
                            />
                          )}
                          {experimental && (
                            <Chip
                              label="Experimental"
                              size="small"
                              color="info"
                              icon={<Schedule fontSize="small" />}
                              sx={{ mr: 1, height: 18 }}
                            />
                          )}
                          {citation && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                              <Science fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                              {citation}
                            </Typography>
                          )}
                        </Box>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                  </ListItem>
                );
              })}
            </List>

            {result.recommendations.some((r) => r && typeof r === 'object' && r.experimental) && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  <strong>Note:</strong> Recommendations marked as "Experimental" are based on novel web-based metrics that require further validation through pilot testing. High and moderate confidence recommendations are backed by published research (Nilsson Benfatto 2016, Nerušil 2021).
                </Typography>
              </Alert>
            )}
          </Box>
        )}

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
            pt: 3,
            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <Button
            variant="outlined"
            startIcon={<Home />}
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' } }}
            onClick={() => navigate('/reading-test')}
          >
            Take Another Test
          </Button>
        </Box>

        {isInAssessment && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#2F5E1A',
                '&:hover': { backgroundColor: '#1F3E0A' },
                fontSize: '1rem',
                px: 4,
                py: 1,
              }}
              onClick={() => navigate('/assessment/instructions/keystroke')}
              endIcon={<ArrowForward />}
            >
              Continue to Keystroke Test
            </Button>
          </Box>
        )}
      </Paper>
      </Box>
    </Box>
  );
};

export default ReadingResults;
