import { useNavigate } from 'react-router-dom';
import { Edit } from '@mui/icons-material';
import InstructionPage from '@components/common/InstructionPage';

function HandwritingInstructions() {
  const navigate = useNavigate();

  return (
    <InstructionPage
      title="Handwriting Analysis"
      subtitle="Write a sentence in print style for analysis"
      icon={<Edit sx={{ fontSize: 40 }} />}
      headerColor="primary.main"
      estimatedTime="5 minutes"
      stepNumber={1}
      totalSteps={4}
      testName="Handwriting Test"
      instructions={[
        'You will be shown a sentence to copy.',
        'Write the sentence on plain white paper using a pen or pencil.',
        'Use PRINT style writing — do not use cursive or joined-up writing.',
        'Write clearly with consistent pressure.',
        'Take a clear photo of your handwriting in good lighting.',
        'Make sure the full sentence is visible in the photo.',
        'Upload the photo when prompted.'
      ]}
      importantNotes={[
        'Print style only — cursive writing cannot be analyzed.',
        'Ensure good lighting and a clear, unblurred photo.',
        'Write at your normal pace — do not rush.'
      ]}
      onStart={() => navigate('/assessment/handwriting')}
      onBack={() => navigate('/assessment/start')}
    />
  );
}

export default HandwritingInstructions;
