import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Alert,
  Button,
  Divider
} from '@mui/material';

function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleString();
}

function getRiskChipConfig(riskLevel, unableToAssess) {
  if (unableToAssess) {
    return {
      label: 'Unable to Assess',
      sx: { bgcolor: 'grey.500', color: 'common.white' }
    };
  }

  switch (riskLevel) {
    case 'high':
      return { label: 'High Risk', sx: { bgcolor: 'error.main', color: 'common.white' } };
    case 'moderate':
      return { label: 'Moderate Risk', sx: { bgcolor: 'warning.main', color: 'common.white' } };
    case 'low':
      return { label: 'Low Risk', sx: { bgcolor: 'success.main', color: 'common.white' } };
    default:
      return { label: 'Unable to Assess', sx: { bgcolor: 'grey.500', color: 'common.white' } };
  }
}

function getWordChipStyle(errorType) {
  switch (errorType) {
    case 'correct':
      return { bgcolor: 'success.main', color: 'common.white' };
    case 'reversal':
      return { bgcolor: 'error.main', color: 'common.white' };
    case 'substitution':
      return { bgcolor: 'warning.main', color: 'common.white' };
    case 'multi_error':
    case 'deleted':
      return { bgcolor: 'secondary.main', color: 'common.white' };
    default:
      return { bgcolor: 'grey.500', color: 'common.white' };
  }
}

function getScoreColor(value) {
  if (value > 50) return 'error';
  if (value > 25) return 'warning';
  return 'success';
}

function toPercent(value) {
  if (value === null || value === undefined) return null;
  return Math.max(0, Math.min(100, Number(value)));
}

function ResultsDisplay({ result, onTakeAnotherTest }) {
  const navigate = useNavigate();

  const overallScore =
    result?.overallScore !== null && result?.overallScore !== undefined
      ? Number(result.overallScore)
      : result?.riskScore !== null && result?.riskScore !== undefined
        ? Number(result.riskScore) * 100
        : null;

  const riskLevel = result?.riskLevel || 'unknown';
  const unableToAssess = Boolean(result?.unableToAssess);
  const overrideApplied = Boolean(result?.overrideApplied);
  const riskChip = getRiskChipConfig(riskLevel, unableToAssess);

  const wordResults = useMemo(
    () => (Array.isArray(result?.wordResults) ? result.wordResults : []),
    [result]
  );

  const recommendations = Array.isArray(result?.recommendations)
    ? result.recommendations
    : [];

  const reversalScore = toPercent(result?.featureScores?.reversalScore);
  const errorScore = toPercent(result?.featureScores?.errorScore);

  return (
    <Box>
      {/* SECTION 1 — Header */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'common.white' }}>
        <Typography variant="h4" gutterBottom>
          Handwriting Analysis Results
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Analyzed on {formatDate(result?.analyzedAt)}
        </Typography>
      </Paper>

      {/* SECTION 2 — Risk Score Card */}
      <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Risk Score
        </Typography>
        {overallScore === null || Number.isNaN(overallScore) ? (
          <Typography variant="h6" color="text.secondary">
            Analysis pending or unavailable
          </Typography>
        ) : (
          <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {Math.round(overallScore)}
          </Typography>
        )}
        <Chip label={riskChip.label} sx={{ ...riskChip.sx, mb: 2 }} />

        {unableToAssess && (
          <Alert severity="warning" sx={{ textAlign: 'left' }}>
            The handwriting image could not be read clearly.
            Please retake the photo with better lighting
            and resubmit.
          </Alert>
        )}

        {overrideApplied && (
          <Typography variant="body2" color="info.main" sx={{ mt: 2 }}>
            Risk elevated due to significant reversal pattern detected
          </Typography>
        )}
      </Paper>

      {/* SECTION 3 — Sentence Comparison */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sentence Analysis
        </Typography>
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Expected:
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {result?.expectedSentence || 'Not available'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Detected:
          </Typography>
          {result?.detectedSentence ? (
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {result.detectedSentence}
            </Typography>
          ) : (
            <Typography variant="body1" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
              Could not detect text
            </Typography>
          )}
        </Box>
      </Paper>

      {/* SECTION 4 — Word-by-Word Breakdown */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Word Analysis
        </Typography>

        {wordResults.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Word-by-word breakdown not available.
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            {wordResults.map((word, index) => {
              const label = word?.errorType || 'unknown';
              return (
                <Box
                  key={`${word?.position || index}-${word?.expectedWord || ''}`}
                  sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                >
                  <Chip label={label} size="small" sx={getWordChipStyle(label)} />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    [{word?.expectedWord || '-'}] → [{word?.writtenWord || '-'}]
                    {word?.detail ? ` (${word.detail} ${label})` : ''}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>

      {/* SECTION 5 — Feature Scores */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Risk Indicators
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            Reversal Score {reversalScore !== null ? `(${Math.round(reversalScore)}/100)` : '(N/A)'}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={reversalScore ?? 0}
            color={getScoreColor(reversalScore ?? 0)}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            Error Score {errorScore !== null ? `(${Math.round(errorScore)}/100)` : '(N/A)'}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={errorScore ?? 0}
            color={getScoreColor(errorScore ?? 0)}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2">Reversals detected: {result?.reversalCount ?? '-'}</Typography>
        <Typography variant="body2">Substitutions: {result?.substitutionCount ?? '-'}</Typography>
        <Typography variant="body2">Multi-character errors: {result?.multiErrorCount ?? '-'}</Typography>
        <Typography variant="body2">Correct words: {result?.correctCount ?? '-'}</Typography>
      </Paper>

      {/* SECTION 6 — Recommendations */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recommendations
        </Typography>

        {recommendations.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No recommendations available.
          </Typography>
        ) : (
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            {recommendations.map((item, index) => (
              <Typography component="li" key={`${item}-${index}`} variant="body2" sx={{ mb: 0.75 }}>
                {item}
              </Typography>
            ))}
          </Box>
        )}
      </Paper>

      {/* SECTION 7 — Disclaimer */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" color="text.secondary">
          {result?.disclaimer || 'This is a screening tool only. Results do not constitute a clinical diagnosis.'}
        </Typography>
      </Box>

      {/* SECTION 8 — Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" onClick={onTakeAnotherTest}>
          Take Another Test
        </Button>
        <Button variant="outlined" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Box>
    </Box>
  );
}

export default ResultsDisplay;
