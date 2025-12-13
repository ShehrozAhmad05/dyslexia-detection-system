import { Box, Paper, Typography, Grid, Chip, Button, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { CheckCircle, ArrowForward, Lightbulb } from '@mui/icons-material';
import RiskScoreGauge from './RiskScoreGauge';

function ResultsDisplay({ result, onTakeAnotherTest }) {
  const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  // imagePath already starts with /uploads/handwriting/filename
  const imageUrl = `${BASE_URL}${result.imagePath}`;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'error';
      case 'moderate': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatIssueType = (type) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h5" gutterBottom>
          Handwriting Analysis Results
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Analyzed on {new Date(result.analyzedAt).toLocaleString()}
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column - Image */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Uploaded Image
            </Typography>
            <Box
              component="img"
              src={imageUrl}
              alt="Handwriting sample"
              onError={(e) => {
                console.error('Image failed to load:', imageUrl);
                console.error('Error:', e);
              }}
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: 400,
                objectFit: 'contain',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {result.originalFileName}
            </Typography>
          </Paper>
        </Grid>

        {/* Right Column - Risk Score */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Risk Assessment
            </Typography>
            {result.riskScore !== null && result.riskScore !== undefined ? (
              <Box sx={{ mt: 3 }}>
                <RiskScoreGauge score={result.riskScore} label="Dyslexia Indicators" />
              </Box>
            ) : (
              <Box sx={{ mt: 3, textAlign: 'center', py: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Analysis not yet completed
                </Typography>
              </Box>
            )}
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              This score indicates the likelihood of dyslexia-related handwriting patterns based on AI analysis.
            </Typography>
          </Paper>

          {result.confidence && (
            <Paper sx={{ p: 2, bgcolor: 'info.lighter' }}>
              <Typography variant="body2" color="info.dark">
                <strong>Analysis Confidence:</strong> {Math.round(result.confidence * 100)}%
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Detected Issues */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Detected Issues
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              The following patterns were identified in your handwriting sample:
            </Typography>
            
            <Grid container spacing={2}>
              {result.detectedIssues && result.detectedIssues.length > 0 ? (
                result.detectedIssues.map((issue, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Box
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        height: '100%'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2">
                          {formatIssueType(issue.type)}
                        </Typography>
                        <Chip
                          label={issue.severity}
                          size="small"
                          color={getSeverityColor(issue.severity)}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Count: {issue.count}
                      </Typography>
                      {issue.examples && issue.examples.length > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          e.g., {issue.examples.join(', ')}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    No issues detected
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Lightbulb sx={{ color: 'warning.main' }} />
              <Typography variant="h6">
                Recommendations
              </Typography>
            </Box>
            
            {result.recommendations && result.recommendations.length > 0 ? (
              <List>
                {result.recommendations.map((recommendation, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={recommendation}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No recommendations available
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Actions */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={onTakeAnotherTest}
            >
              Take Another Test
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="/dashboard"
            >
              Back to Dashboard
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ResultsDisplay;
