import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Paper, Button,
  CircularProgress, Alert, Grid, Card, CardContent,
  Chip, Divider, LinearProgress
} from '@mui/material';
import {
  Download, Refresh, CheckCircle,
  Edit, MenuBook, Keyboard, Psychology
} from '@mui/icons-material';
import { assessmentService } from '@services';

const modules = ['handwriting', 'reading', 'keystroke', 'memory'];
const moduleLabels = {
  handwriting: 'Handwriting',
  reading: 'Reading',
  keystroke: 'Keystroke',
  memory: 'Memory'
};

const buildKeystrokeRecommendations = (keystroke) => {
  if (!keystroke) return [];
  const breakdown = keystroke.riskBreakdown || {};
  const recommendations = [];

  if ((keystroke.riskLevel || '').toUpperCase() === 'HIGH') {
    recommendations.push(
      'High overall risk detected. Repeat the assessment ' +
      'at a similar time of day and review consistency ' +
      'across multiple attempts.'
    );
  } else if ((keystroke.riskLevel || '').toUpperCase() === 'MODERATE') {
    recommendations.push(
      'Moderate risk detected. Track trends over multiple ' +
      'sessions rather than relying on a single attempt.'
    );
  } else {
    recommendations.push(
      'Low risk detected in this session. Continue periodic ' +
      'monitoring to maintain a stable baseline.'
    );
  }

  if ((breakdown.speedRisk || 0) >= 60) {
    recommendations.push(
      'Typing speed is a major contributor. Practice short ' +
      'timed passages and focus on smooth rhythm before ' +
      'increasing pace.'
    );
  }

  if ((breakdown.pauseRisk || 0) >= 60) {
    recommendations.push(
      'Frequent long pauses were detected. Read the full ' +
      'prompt once before typing and type in phrase-level chunks.'
    );
  }

  if ((breakdown.backspaceRisk || 0) >= 60 ||
      Number(keystroke.backspaceRate) >= 0.1) {
    recommendations.push(
      'Correction behavior is elevated. Slow down slightly ' +
      'and prioritize first-pass accuracy to reduce editing overhead.'
    );
  }

  if ((breakdown.errorRateRisk || 0) >= 30 ||
      Number(keystroke.errorRate) >= 10) {
    recommendations.push(
      'Text error rate is meaningful. Add focused spelling ' +
      'and word-pattern drills to improve orthographic accuracy.'
    );
  }

  if (recommendations.length < 3) {
    recommendations.push(
      'Run at least three sessions and compare breakdown stability ' +
      'before drawing final conclusions.'
    );
  }

  return recommendations;
};

function OverallResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fusion, setFusion] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadFusionResults();
  }, [id]);

  const loadFusionResults = async () => {
    try {
      setLoading(true);
      setError('');
      const assessmentId = id ||
        localStorage.getItem('currentAssessmentId');
      if (!assessmentId) {
        setError('No assessment found. Please complete all tests first.');
        return;
      }
      const response = await assessmentService.getFusion(assessmentId);
      setFusion(response.data.assessment);
      const currentId = localStorage.getItem('currentAssessmentId');
      if (currentId && currentId === assessmentId) {
        localStorage.removeItem('currentAssessmentId');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to load results. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const assessmentId = id ||
        fusion?.id;
      const response = await assessmentService.downloadPDF(assessmentId);

      // Create download link from blob
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dyslexia-screening-report-${assessmentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const getRiskColor = (level) => {
    switch ((level || '').toLowerCase()) {
      case 'high': return 'error';
      case 'moderate': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getModuleIcon = (module) => {
    const icons = {
      handwriting: Edit,
      reading: MenuBook,
      keystroke: Keyboard,
      memory: Psychology
    };
    const Icon = icons[module] || CheckCircle;
    return <Icon />;
  };

  const getModuleRiskLevel = (module) => {
    return fusion?.moduleResults?.[module]?.riskLevel || null;
  };

  const getModuleScore = (module) => {
    const score = fusion?.fusionAnalysis?.moduleScores?.[module];
    return score == null ? null : Number(score);
  };

  const getHandwritingSentence = (kind) => {
    const hw = fusion?.moduleResults?.handwriting;
    if (!hw) return null;
    if (kind === 'expected') {
      return hw.expectedSentence || hw.expected_sentence || null;
    }
    return hw.detectedSentence || hw.detected_sentence || null;
  };

  const formatScore = (score) => {
    return score != null ? Math.round(score) : 'N/A';
  };

  const formatRiskLevel = (level) => {
    return (level || 'unknown').toUpperCase();
  };

  const renderRecommendations = (recs) => {
    if (!recs) return null;

    let normalized = [];
    if (Array.isArray(recs)) {
      normalized = recs;
    } else if (typeof recs === 'object') {
      if ('message' in recs || 'metric' in recs) {
        normalized = [recs];
      } else {
        normalized = Object.entries(recs).map(([metric, value]) => ({
          metric,
          message: `${String(metric)
            .replace(/Risk$/, ' Risk')
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (s) => s.toUpperCase())
            .replace(/\s+/g, ' ')
            .trim()}: ${
            Number.isFinite(Number(value)) ? Math.round(Number(value)) : 'N/A'
          }/100`
        }));
      }
    } else {
      normalized = [recs];
    }

    if (!normalized.length) return null;
    return normalized.map((r, i) => (
      <Typography component="li" variant="body2" key={i} sx={{ mb: 0.5 }}>
        {typeof r === 'string' ? r : r?.message || r?.metric || String(r)}
      </Typography>
    ));
  };

  const completedModules = fusion?.completedModules || [];
  const confidenceScore = fusion?.fusionAnalysis?.confidenceScore;

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h4" gutterBottom>
            Assessment Complete
          </Typography>
          <Typography variant="body1">
            Here are your comprehensive screening results
          </Typography>
          {fusion?.completedAt && (
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
              Completed on: {new Date(fusion.completedAt).toLocaleString()}
            </Typography>
          )}
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
              <Button
                color="inherit"
                size="small"
                startIcon={<Refresh />}
                onClick={loadFusionResults}
              >
                Retry
              </Button>
            )}
          >
            {error}
          </Alert>
        )}

        {!loading && !error && fusion && (
          <>
            <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
              <Typography variant="h2" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                {formatScore(fusion?.overallRiskScore)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                out of 100
              </Typography>
              <Chip
                label={`${formatRiskLevel(fusion?.riskLevel)} RISK`}
                color={getRiskColor(fusion.riskLevel)}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Confidence: {confidenceScore != null ? Math.round(confidenceScore) : 'N/A'}% ({completedModules.length}/4 modules completed)
              </Typography>
            </Paper>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {modules.map((module) => {
                const score = getModuleScore(module);
                const riskLevel = getModuleRiskLevel(module);
                const completed = completedModules.includes(module);
                return (
                  <Grid item xs={12} sm={6} key={module}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                            {getModuleIcon(module)}
                          </Box>
                          <Typography variant="h6">{moduleLabels[module]}</Typography>
                        </Box>
                        <Typography variant="h5" sx={{ mb: 1 }}>
                          {formatScore(score)}
                        </Typography>
                        {completed ? (
                          <Chip
                            size="small"
                            color={getRiskColor(riskLevel)}
                            label={formatRiskLevel(riskLevel)}
                            sx={{ mb: 1.5 }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            Not completed
                          </Typography>
                        )}
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(Math.max(score || 0, 0), 100)}
                          color={getRiskColor(riskLevel)}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recommendations
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box component="ol" sx={{ pl: 3, m: 0 }}>
                {renderRecommendations(fusion?.fusionAnalysis?.combinedRecommendations)}
              </Box>
            </Paper>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {fusion.moduleResults?.handwriting && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Handwriting Details</Typography>
                    <Typography variant="body2">Risk score: {formatScore(fusion.moduleResults.handwriting.overallScore)}</Typography>
                    <Typography variant="body2">Expected: {getHandwritingSentence('expected') || 'N/A'}</Typography>
                    <Typography variant="body2">Detected: {getHandwritingSentence('detected') || 'N/A'}</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>Reversal count: {formatScore(fusion.moduleResults.handwriting.reversalCount)}</Typography>
                    <Box component="ul" sx={{ pl: 3, m: 0, color: 'text.secondary' }}>
                      {renderRecommendations(fusion.moduleResults.handwriting.recommendations)}
                    </Box>
                  </Paper>
                </Grid>
              )}

              {fusion.moduleResults?.reading && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Reading Details</Typography>
                    <Typography variant="body2">Risk score: {formatScore(fusion.moduleResults.reading.riskScore)}</Typography>
                    <Box component="ul" sx={{ pl: 3, m: 0, color: 'text.secondary' }}>
                      {renderRecommendations(fusion.moduleResults.reading.recommendations)}
                    </Box>
                  </Paper>
                </Grid>
              )}

              {fusion.moduleResults?.keystroke && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Keystroke Details</Typography>
                    <Typography variant="body2">Risk score: {formatScore(fusion.moduleResults.keystroke.riskScore)}</Typography>
                    <Typography variant="body2">Anomaly score: {formatScore(fusion.moduleResults.keystroke.anomalyScore)}</Typography>
                    <Box component="ul" sx={{ pl: 3, m: 0, color: 'text.secondary' }}>
                      {renderRecommendations(buildKeystrokeRecommendations(fusion.moduleResults.keystroke))}
                    </Box>
                  </Paper>
                </Grid>
              )}

              {fusion.moduleResults?.memory && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Memory Details</Typography>
                    <Typography variant="body2">Risk score: {formatScore(fusion.moduleResults.memory.riskScore)}</Typography>
                    <Box component="ul" sx={{ pl: 3, m: 0, color: 'text.secondary' }}>
                      {renderRecommendations(fusion.moduleResults.memory.recommendations)}
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <Download />}
                onClick={handleDownloadPDF}
                disabled={downloading}
              >
                Download PDF Report
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  localStorage.removeItem('currentAssessmentId');
                  navigate('/assessment/start');
                }}
              >
                Retake Assessment
              </Button>
              <Button variant="text" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </Box>
          </>
        )}

        <Typography variant="caption" color="text.secondary">
          This screening does not constitute a clinical diagnosis. Results should be interpreted by a qualified professional.
        </Typography>
      </Box>
    </Container>
  );
}

export default OverallResults;
