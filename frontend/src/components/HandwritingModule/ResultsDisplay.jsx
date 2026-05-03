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
import cupi from '../../assets/purplecrop.png';
import cloudy from '../../assets/cloudy copy.png';
import favorite from '../../assets/favorite.png';
import stickyNote from '../../assets/sticky-note.png';
import searchIcon from '../../assets/search.png';
import analysisIcon from '../../assets/analysis.png';
import ideaIcon from '../../assets/idea.png';

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

function getRiskColor(riskLevel) {
  switch (riskLevel) {
    case 'high':
      return '#E53935';
    case 'moderate':
      return '#FB8C00';
    case 'low':
      return '#2E7D32';
    default:
      return '#6C4DE6';
  }
}

function toPercent(value) {
  if (value === null || value === undefined) return null;
  return Math.max(0, Math.min(100, Number(value)));
}

function ResultsDisplay({ result, onTakeAnotherTest, onContinue }) {
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
  const riskColor = getRiskColor(riskLevel);

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
      <Paper
        sx={{
          p: { xs: 3, md: 4 ,marginBottom: 30},
          mb: 4,
          backgroundImage: `url(${cupi})`,
          backgroundSize: 'cover',
          marginTop: 8,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          color: 'common.white',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden'
          
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 220, textShadow: '0 2px 8px rgba(0,0,0,0.45)' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Handwriting Analysis Results
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
              Analyzedd on {formatDate(result?.analyzedAt)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* SECTION 2 — Risk Score Card */}
      <Paper sx={{ px: 3, py: 3, mb: 3, borderRadius: 3,position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'space-between', px: { xs: 0, sm: 25 }, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 220 }}>
            <Typography variant="h6" gutterBottom>
              Risk Score
            </Typography>
            {overallScore === null || Number.isNaN(overallScore) ? (
              <Typography variant="h6" color="text.secondary">
                Analysis pending or unavailable
              </Typography>
            ) : (
              <Typography variant="h2" sx={{ fontWeight: 800, color: riskColor, mb: 1 }}>
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
          </Box>
          <Box component="img" src={cloudy} alt="cloudy" sx={{
      position: 'absolute',
      right: 200,
      marginTop: 6,
      width: { xs: 220, sm: 320, md: 450 }, // 🔥 increase freely
      height: 'auto'
    }} />
        </Box>
      </Paper>

      {/* SECTION 3 — Sentence Comparison */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="img" src={favorite} alt="favorite" sx={{ width: 22, height: 22 }} />
            <Typography variant="h6">Sentence Analysis</Typography>
          </Box>
          <Box component="img" src={stickyNote} alt="sticky-note" sx={{ width: 44, height: 'auto' }} />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Input Sentence
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 700 }}>
            {result?.expectedSentence || 'Not available'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Detected
          </Typography>
          {result?.detectedSentence ? (
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
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
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="img" src={favorite} alt="favorite" sx={{ width: 22, height: 22 }} />
            <Typography variant="h6">Word Analysis</Typography>
          </Box>
          <Box component="img" src={searchIcon} alt="search" sx={{ width: 40, height: 'auto' }} />
        </Box>

        {wordResults.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Word-by-word breakdown not available.
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gap: 1.5, maxHeight: 280, overflowY: 'auto', pr: 1 }}>
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

      {/* SECTION 5 — Risk + Recommendations */}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, mb: 3 }}>
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box component="img" src={analysisIcon} alt="analysis" sx={{ width: 28, height: 28 }} />
            <Typography variant="h6">Risk Indicator</Typography>
          </Box>
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

        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box component="img" src={ideaIcon} alt="idea" sx={{ width: 28, height: 28 }} />
            <Typography variant="h6">Recommendation</Typography>
          </Box>
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
      </Box>

      {/* SECTION 7 — Disclaimer */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" color="text.secondary">
          {result?.disclaimer || 'This is a screening tool only. Results do not constitute a clinical diagnosis.'}
        </Typography>
      </Box>

      {/* SECTION 8 — Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={onTakeAnotherTest}
          sx={{
            borderRadius: '9px',
            px: 3,
            
          }}
        >
          Take Another Test
        </Button>
        <Button variant="outlined" onClick={() => navigate('/dashboard')} sx={{ borderRadius: '9px', px: 3 }}>
          Back to Dashboard
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={onContinue || (() => navigate('/dashboard'))}
          sx={{ borderRadius: '9px', px: 3 ,bgcolor: '#48A14F',}}
        >
          {onContinue ? 'Continue to Reading Test' : 'Download Report'}
        </Button>
      </Box>
    </Box>
  );
}

export default ResultsDisplay;
