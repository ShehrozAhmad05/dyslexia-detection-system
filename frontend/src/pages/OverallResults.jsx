import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Paper, Button,
  CircularProgress, Alert, Grid, Card, CardContent,
  Chip, Divider, LinearProgress
} from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import {
  Download, Refresh, CheckCircle,
  ExpandMore, Edit, MenuBook, Keyboard, Psychology
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
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
  const [explainability, setExplainability] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadFusionResults();
  }, [id]);

  const loadFusionResults = async () => {
    try {
      setLoading(true);
      setError('');
      setExplainability(null);
      const assessmentId = id ||
        localStorage.getItem('currentAssessmentId');
      if (!assessmentId) {
        setError('No assessment found. Please complete all tests first.');
        return;
      }
      const response = await assessmentService.getFusion(assessmentId);
      setFusion(response.data.assessment);
      setExplainability(response.data.assessment.explainability || null);
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

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('high') || s.includes('risk') ||
        s.includes('elevated') || s.includes('errors found')) {
      return 'error.main';
    }
    if (s.includes('moderate')) return 'warning.main';
    return 'success.main';
  };

  const getImpactColor = (impact) => {
    switch ((impact || '').toUpperCase()) {
      case 'HIGH': return '#c62828';
      case 'MEDIUM': return '#e65100';
      default: return '#2e7d32';
    }
  };

  const getDirectionColor = (direction) => {
    return direction === 'increases_anomaly' ? '#c62828' : '#2e7d32';
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

            {explainability && (
              <Box sx={{ mt: 4 }}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Why You Got This Score
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {explainability.fusion?.naturalLanguage}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {explainability.fusion?.confidenceStatement}
                  </Typography>
                  <Alert
                    severity={
                      fusion.riskLevel === 'high' ? 'error' :
                      fusion.riskLevel === 'moderate' ? 'warning' : 'success'
                    }
                    sx={{ mt: 2 }}
                  >
                    {explainability.fusion?.overallInterpretation}
                  </Alert>
                </Paper>

                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Module Risk Contributions
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    How much each module contributed to your overall score
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={explainability.fusion?.weightedContributions?.map(m => ({
                        name: m.module.charAt(0).toUpperCase() + m.module.slice(1),
                        score: m.score,
                        contribution: Number(Number(m.contribution || 0).toFixed(1))
                      })) || []}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        formatter={(value, name) =>
                          name === 'score'
                            ? [`${value}/100`, 'Module Score']
                            : [value, 'Weighted Contribution']
                        }
                      />
                      <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {(explainability.fusion?.weightedContributions || []).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.score >= 67 ? '#c62828' :
                              entry.score >= 34 ? '#e65100' : '#2e7d32'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Top Risk Factors:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {(explainability.fusion?.topRiskFactors || []).map((factor) => (
                      <Box key={factor.module} sx={{
                        display: 'flex', alignItems: 'center',
                        gap: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 20 }}>
                          #{factor.rank}
                        </Typography>
                        <Chip
                          label={factor.impact}
                          size="small"
                          sx={{ bgcolor: getImpactColor(factor.impact), color: '#fff' }}
                        />
                        <Typography variant="body2">
                          <strong>
                            {factor.module.charAt(0).toUpperCase() + factor.module.slice(1)}:
                          </strong> {factor.factor} — Score: {factor.score}/100
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>

                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Detailed Module Explanations
                  </Typography>

                  {explainability.handwriting && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Edit fontSize="small" color="primary" />
                          <Typography fontWeight={600}>Handwriting Analysis</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {explainability.handwriting.naturalLanguage}
                        </Typography>
                        {(explainability.handwriting.featureBreakdown || []).map((item) => (
                          <Box key={item.feature} sx={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', py: 0.75,
                            borderBottom: '1px solid', borderColor: 'divider'
                          }}>
                            <Typography variant="body2">{item.feature}</Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight={600}>
                                {item.value}
                              </Typography>
                              <Chip
                                label={item.status}
                                size="small"
                                color={item.status === 'At Risk' || item.status === 'Elevated' ||
                                       item.status === 'Errors Found' ? 'error' :
                                       item.status === 'Normal' || item.status === 'All Correct'
                                       ? 'success' : 'warning'}
                              />
                            </Box>
                          </Box>
                        ))}
                        {(explainability.handwriting.keyFindings || []).length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Key Findings:
                            </Typography>
                            {explainability.handwriting.keyFindings.map((f, i) => (
                              <Typography key={i} variant="body2" sx={{ pl: 1, mb: 0.5 }}>
                                • {f}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {explainability.reading && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MenuBook fontSize="small" color="success" />
                          <Typography fontWeight={600}>Reading Assessment</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {explainability.reading.naturalLanguage}
                        </Typography>
                        {(explainability.reading.featureComparison || []).map((item) => (
                          <Box key={item.feature} sx={{
                            py: 0.75, borderBottom: '1px solid', borderColor: 'divider'
                          }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2">{item.feature}</Typography>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Typography variant="body2" fontWeight={600}>
                                  {item.rawValue}
                                </Typography>
                                <Chip
                                  label={item.status}
                                  size="small"
                                  color={item.status === 'High Risk' ? 'error' :
                                         item.status === 'Moderate' ? 'warning' : 'success'}
                                />
                              </Box>
                            </Box>
                            <Typography variant="caption" color={getStatusColor(item.status)}>
                              {item.interpretation}
                              {item.confidence && ` (Confidence: ${item.confidence})`}
                            </Typography>
                          </Box>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {explainability.keystroke && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Keyboard fontSize="small" color="warning" />
                          <Typography fontWeight={600}>Keystroke Analysis</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {explainability.keystroke.naturalLanguage}
                        </Typography>

                        {(explainability.keystroke.shapExplanation || []).length > 0 ? (
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Feature Impact (SHAP Values)
                              </Typography>
                              <Typography variant="caption" color="text.secondary"
                                          sx={{ display: 'block', mb: 1 }}>
                                Shows how each feature influenced the AI model&apos;s decision,
                                compared against anomalous typing patterns in training data.
                                {'\u{1F534}'} Red = nudges toward anomaly detection &nbsp;|&nbsp;
                                {'\u{1F7E2}'} Green = nudges toward normal classification &nbsp;|&nbsp;
                                Overall result depends on combined score
                              </Typography>
                            </Box>
                            <ResponsiveContainer width="100%" height={220}>
                              <BarChart
                                layout="vertical"
                                data={explainability.keystroke.shapExplanation.map(s => ({
                                  name: s.displayName,
                                  value: Number(Number(s.shapValue).toFixed(4)),
                                  direction: s.direction,
                                  impact: s.impact
                                }))}
                                margin={{ top: 0, right: 20, left: 120, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name"
                                       tick={{ fontSize: 11 }} width={115} />
                                <Tooltip
                                  formatter={(value, name, props) => [
                                    Number(value).toFixed(4),
                                    `SHAP (${props.payload.direction})`
                                  ]}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                  {explainability.keystroke.shapExplanation.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={getDirectionColor(entry.direction)}
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                          ) : (
                            <Alert severity="info" sx={{ mb: 2 }}>
                              SHAP explainability is not available for this session. This typically
                              means the keystroke model did not return SHAP values.
                            </Alert>
                          )}

                        {(explainability.keystroke.keyFindings || []).map((f, i) => (
                          <Typography key={i} variant="body2" sx={{ pl: 1, mb: 0.5 }}>
                            • {f}
                          </Typography>
                        ))}
                        {(explainability.keystroke.riskBreakdownExplanation || []).length > 0 && (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                              Risk Breakdown (Threshold Analysis)
                            </Typography>
                            <Typography variant="caption" color="text.secondary"
                                        sx={{ display: 'block', mb: 1 }}>
                              Compares each typing metric against validated normal ranges
                              from the Aalto keystroke dataset.
                            </Typography>
                            {(explainability.keystroke.riskBreakdownExplanation || []).map((item) => (
                              <Box key={item.component} sx={{
                                display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', py: 0.75,
                                borderBottom: '1px solid', borderColor: 'divider'
                              }}>
                                <Typography variant="body2">{item.component}</Typography>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {Math.round(item.score)}/100
                                  </Typography>
                                  <Chip
                                    label={item.status}
                                    size="small"
                                    color={item.status === 'High' ? 'error' :
                                           item.status === 'Moderate' ? 'warning' : 'success'}
                                  />
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        )}
                        <Alert severity="info" sx={{ mt: 2 }} icon={false}>
                          <Typography variant="caption">
                            <strong>Note:</strong> SHAP values and threshold analysis
                            may occasionally show different signals for the same feature.
                            SHAP reflects multivariate AI model patterns across all
                            features together, while threshold analysis evaluates each
                            feature individually against population norms.
                            Both perspectives are valid and complementary.
                          </Typography>
                        </Alert>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {explainability.memory && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Psychology fontSize="small" color="secondary" />
                          <Typography fontWeight={600}>Memory Assessment</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {explainability.memory.naturalLanguage}
                        </Typography>
                        {(explainability.memory.componentBreakdown || []).map((item) => (
                          <Box key={item.component} sx={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', py: 0.75,
                            borderBottom: '1px solid', borderColor: 'divider'
                          }}>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {item.component}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Weight: {item.weight} — {item.interpretation}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight={600}>
                                {Math.round(item.score)}/100
                              </Typography>
                              <Chip
                                label={item.status}
                                size="small"
                                color={item.status === 'High Risk' ? 'error' :
                                       item.status === 'Moderate' ? 'warning' : 'success'}
                              />
                            </Box>
                          </Box>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Paper>
              </Box>
            )}

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