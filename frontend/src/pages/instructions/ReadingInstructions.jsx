import { useNavigate } from 'react-router-dom';
import { MenuBook } from '@mui/icons-material';
import InstructionPage from '@components/common/InstructionPage';

function ReadingInstructions() {
  const navigate = useNavigate();

  return (
    <InstructionPage
      title="Reading Assessment"
      subtitle="Read a passage and answer comprehension questions"
      icon={<MenuBook sx={{ fontSize: 40 }} />}
      headerColor="success.main"
      estimatedTime="5 minutes"
      stepNumber={2}
      totalSteps={4}
      testName="Reading Test"
      instructions={[
        'You will be shown a reading passage divided into sections.',
        'Move your cursor along the text as you read each line.',
        'Read at your normal pace — do not rush or skim.',
        'After reading, you will answer 8 comprehension questions.',
        'You can scroll back to re-read sections if needed.',
        'Answer all questions before submitting.'
      ]}
      importantNotes={[
        'Move your cursor along the text as you read — this tracks your reading patterns.',
        'Pausing for 2 or more seconds in one place is recorded as a pause.',
        'Going back to a previous section is recorded as a revisit.',
        'Read naturally — do not try to game the tracking.'
      ]}
      onStart={() => navigate('/reading-test')}
      onBack={() => navigate('/assessment/instructions/handwriting')}
    />
  );
}

export default ReadingInstructions;
