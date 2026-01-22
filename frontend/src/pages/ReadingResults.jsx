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
    switch (level?.toLowerCase()) {
      case 'low': return 'success';
      case 'moderate': return 'warning';
      case 'high': return 'error';
      default: return 'default';
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
        <Typography variant="h6" gutterBottom>
          Overall Risk Score
        </Typography>
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
          Higher scores indicate greater reading difficulty indicators
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
              Feature Scores
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {result.featureScores && Object.entries({
                'Reading Speed': result.featureScores.wpmScore,
                'Revisit Pattern': result.featureScores.revisitScore,
                'Comprehension': result.featureScores.comprehensionScore,
                'Pause Behavior': result.featureScores.pauseScore,
                'Time Management': result.featureScores.timeScore,
              }).map(([label, score]) => (
                <Box key={label}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{label}</Typography>
                    <Typography variant="body2" fontWeight="bold">{score}/100</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={score} 
                    color={score > 70 ? 'error' : score > 40 ? 'warning' : 'success'}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            <Lightbulb sx={{ verticalAlign: 'middle', mr: 1, color: 'warning.main' }} />
            Recommendations
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {result.recommendations.map((recommendation, index) => (
              <ListItem key={index} sx={{ py: 1 }}>
                <ListItemIcon>
                  <CheckCircle color="primary" />
                </ListItemIcon>
                <ListItemText primary={recommendation} />
              </ListItem>
            ))}
          </List>
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
