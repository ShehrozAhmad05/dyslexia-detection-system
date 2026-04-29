import { useNavigate } from 'react-router-dom';
import { Keyboard } from '@mui/icons-material';
import InstructionPage from '@components/common/InstructionPage';

function KeystrokeInstructions() {
  const navigate = useNavigate();

  return (
    <InstructionPage
      title="Keystroke Analysis"
      subtitle="Type a sentence to analyze your typing patterns"
      icon={<Keyboard sx={{ fontSize: 40 }} />}
      headerColor="warning.main"
      estimatedTime="5 minutes"
      stepNumber={3}
      totalSteps={4}
      testName="Keystroke Test"
      instructions={[
        'You will be shown a sentence to type.',
        'Type the sentence as accurately as possible.',
        'Type at your normal pace — do not rush.',
        'Use backspace to correct mistakes if needed.',
        'The test captures your typing rhythm and patterns.',
        'Submit when you have finished typing the sentence.'
      ]}
      importantNotes={[
        'Type naturally — do not try to slow down or speed up artificially.',
        'Every key press including backspace is recorded.',
        'Typing rhythm and timing patterns are analyzed, not just accuracy.'
      ]}
      onStart={() => navigate('/assessment/keystroke')}
      onBack={() => navigate('/assessment/instructions/reading')}
    />
  );
}

export default KeystrokeInstructions;
