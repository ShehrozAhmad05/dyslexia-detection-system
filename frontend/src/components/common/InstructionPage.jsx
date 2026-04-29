import {
  Container,
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Button
} from '@mui/material';

function InstructionPage({
  title,
  subtitle,
  icon,
  headerColor,
  estimatedTime,
  instructions,
  importantNotes,
  onStart,
  onBack,
  stepNumber,
  totalSteps,
  testName
}) {
  const steps = ['Handwriting', 'Reading', 'Keystroke', 'Memory'];

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 3, mb: 3, bgcolor: headerColor, color: 'white' }}>
          <Typography variant="overline" sx={{ opacity: 0.95 }}>
            Step {stepNumber} of {totalSteps}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>
              {icon}
            </Box>
            <Box>
              <Typography variant="h4" gutterBottom>
                {title}
              </Typography>
              <Typography variant="body1">
                {subtitle}
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Stepper activeStep={stepNumber - 1}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Instructions
          </Typography>
          <Box component="ol" sx={{ pl: 3, m: 0 }}>
            {instructions.map((instruction, index) => (
              <Typography
                key={`${instruction}-${index}`}
                component="li"
                variant="body1"
                sx={{ mb: 1 }}
              >
                {instruction}
              </Typography>
            ))}
          </Box>
        </Paper>

        {!!importantNotes.length && (
          <Paper
            sx={{
              p: 3,
              mb: 3,
              bgcolor: (theme) => theme.palette.warning.lighter || theme.palette.warning.light
            }}
          >
            <Typography variant="h6" gutterBottom>
              Important Notes
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              {importantNotes.map((note, index) => (
                <Typography
                  key={`${note}-${index}`}
                  component="li"
                  variant="body1"
                  sx={{ mb: 1 }}
                >
                  {note}
                </Typography>
              ))}
            </Box>
          </Paper>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Chip
            label={`Estimated time: ${estimatedTime}`}
            color="info"
            variant="outlined"
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button variant="outlined" onClick={onBack}>
            Back
          </Button>
          <Button variant="contained" color="primary" onClick={onStart}>
            Start {testName}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default InstructionPage;
