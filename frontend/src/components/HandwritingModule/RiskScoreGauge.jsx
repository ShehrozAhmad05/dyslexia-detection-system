import { Box, Typography, LinearProgress } from '@mui/material';
import { CheckCircle, Warning, Error as ErrorIcon } from '@mui/icons-material';

function RiskScoreGauge({ score, label = 'Risk Score' }) {
  // Handle invalid score
  if (score === null || score === undefined || isNaN(score)) {
    return null;
  }
  
  // Convert score (0-1) to percentage (0-100)
  const percentage = Math.round(score * 100);

  // Determine risk level and color
  const getRiskLevel = () => {
    if (score >= 0.7) return { level: 'High Risk', color: 'error', icon: ErrorIcon };
    if (score >= 0.4) return { level: 'Moderate Risk', color: 'warning', icon: Warning };
    return { level: 'Low Risk', color: 'success', icon: CheckCircle };
  };

  const { level, color, icon: Icon } = getRiskLevel();

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {label}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Icon sx={{ fontSize: 20, color: `${color}.main` }} />
          <Typography variant="h6" color={`${color}.main`} fontWeight="bold">
            {percentage}%
          </Typography>
        </Box>
      </Box>

      <LinearProgress
        variant="determinate"
        value={percentage}
        color={color}
        sx={{
          height: 12,
          borderRadius: 1,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            borderRadius: 1
          }
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {level}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Confidence: {Math.round(score * 100)}%
        </Typography>
      </Box>
    </Box>
  );
}

export default RiskScoreGauge;
