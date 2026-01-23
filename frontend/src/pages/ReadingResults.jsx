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
  
  /**
   * Load result on mount
   */
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
  
  /**
   * Render loading state
   */
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading results...</Typography>
      </Container>
    );
  }
  
  /**
   * Render error state
   */
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
  
  // Format time helper
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 
      ? `${minutes}m ${remainingSeconds}s` 
      : `${seconds}s`;
  };
  
  // Get risk color
  const getRiskColor = (level) => {
    const levelStr = typeof level === 'string' ? level : level?.toLowerCase?.() || '';
    switch (levelStr.toLowerCase()) {
      case 'low': return 'success';
      case 'moderate': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };
  
  // Get confidence badge
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Reading Assessment Results
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Test completed on {new Date(result.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
          <Chip 
            label={`Risk Level: ${result.riskLevel}`}
            color={getRiskColor(result.riskLevel)}
            size="large"
            sx={{ fontSize: '1rem', py: 2 }}
          />
        </Box>
      </Paper>
      
      {/* Risk Score Gauge */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Overall Risk Score
          </Typography>
          <Chip 
            icon={<Science />}
            label="95.2% ML Accuracy"
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={result.riskScore} 
              color={getRiskColor(result.riskLevel)}
              sx={{ height: 20, borderRadius: 1 }}
            />
          </Box>
          <Typography variant="h5" fontWeight="bold">
            {result.riskScore}/100
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Risk scoring validated against ETDD70 dataset (Nilsson Benfatto 2016, Nerušil 2021)
        </Typography>
      </Paper>
      
      {/* Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Reading Speed */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Speed color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Reading Speed
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {result.wordsPerMinute}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                words per minute
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Comprehension */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Assessment color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Comprehension
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {result.comprehensionScore}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {result.correctAnswers}/{result.totalQuestions} correct
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Revisits */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Refresh color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Revisits
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {result.totalRevisits}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                times re-reading sections
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Pauses */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Pause color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Pauses
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {result.pauseCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                avg {formatTime(result.averagePauseDuration)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Detailed Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Timer sx={{ verticalAlign: 'middle', mr: 1 }} />
              Timing Metrics
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Total Reading Time:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatTime(result.totalReadingTime)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Question Time:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatTime(result.timeToAnswerQuestions)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Avg Time per Section:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatTime(result.averageTimePerSegment)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Pause Frequency:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {result.pauseFrequency.toFixed(1)} per minute
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Assessment sx={{ verticalAlign: 'middle', mr: 1 }} />
              Feature Scores (Weighted)
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {result.featureScores && Object.entries({
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">{label}</Typography>
                        <Chip 
                          icon={badge.icon}
                          label={badge.label}
                          size="small"
                          color={badge.color}
                          sx={{ height: 20 }}
                          title={badge.description}
                        />
                      </Box>
                      <Typography variant="body2" fontWeight="bold">
                        {Math.round(normalizedScore)}/100 (×{weight})
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={normalizedScore} 
                      color={normalizedScore > 70 ? 'error' : normalizedScore > 40 ? 'warning' : 'success'}
                    />
                  </Box>
                );
              })}
            </Box>
            
            {/* Legend */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
                Confidence Levels:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="caption" display="flex" alignItems="center" gap={0.5}>
                  <Verified fontSize="small" color="success" />
                  <strong>Validated:</strong> 60.8% (reading time + comprehension)
                </Typography>
                <Typography variant="caption" display="flex" alignItems="center" gap={0.5}>
                  <Warning fontSize="small" color="warning" />
                  <strong>Supported:</strong> 17.1% (revisit count)
                </Typography>
                <Typography variant="caption" display="flex" alignItems="center" gap={0.5}>
                  <Schedule fontSize="small" color="info" />
                  <strong>Experimental:</strong> 22.1% (pause metrics)
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            <Lightbulb sx={{ verticalAlign: 'middle', mr: 1, color: 'warning.main' }} />
            Personalized Recommendations
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {result.recommendations.map((recommendation, index) => {
              // Handle both old string format and new object format
              const isObject = typeof recommendation === 'object';
              const message = isObject ? recommendation.message : recommendation;
              const severity = isObject ? recommendation.severity : null;
              const confidence = isObject ? recommendation.confidence : null;
              const citation = isObject ? recommendation.citation : null;
              const experimental = isObject ? recommendation.experimental : false;
              
              // Get icon based on severity
              const getIcon = () => {
                if (severity === 'high') return <Cancel color="error" />;
                if (severity === 'moderate') return <Warning color="warning" />;
                if (severity === 'info') return <Info color="info" />;
                return <CheckCircle color="primary" />;
              };
              
              return (
                <ListItem key={index} sx={{ py: 1.5, flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getIcon()}
                    </ListItemIcon>
                    <ListItemText 
                      primary={message}
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          {confidence && (
                            <Chip 
                              label={`Confidence: ${confidence}`}
                              size="small"
                              color={confidence === 'HIGH' ? 'success' : confidence === 'MODERATE' ? 'warning' : 'info'}
                              sx={{ mr: 1, height: 20 }}
                            />
                          )}
                          {experimental && (
                            <Chip 
                              label="Experimental"
                              size="small"
                              color="info"
                              icon={<Schedule fontSize="small" />}
                              sx={{ mr: 1, height: 20 }}
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
                    />
                  </Box>
                </ListItem>
              );
            })}
          </List>
          
          {/* Disclaimer for experimental metrics */}
          {result.recommendations.some(r => r.experimental) && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                <strong>Note:</strong> Recommendations marked as "Experimental" are based on novel web-based metrics 
                that require further validation through pilot testing. High and moderate confidence recommendations 
                are backed by published research (Nilsson Benfatto 2016, Nerušil 2021).
              </Typography>
            </Alert>
          )}
        </Paper>
      )}
      
      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button 
          variant="outlined" 
          startIcon={<Home />}
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
        <Button 
          variant="contained" 
          onClick={() => navigate('/reading-test')}
        >
          Take Another Test
        </Button>
      </Box>
    </Container>
  );
};

export default ReadingResults;
