import { useNavigate } from 'react-router-dom';
import { Psychology } from '@mui/icons-material';
import InstructionPage from '@components/common/InstructionPage';

function MemoryInstructions() {
  const navigate = useNavigate();

  return (
    <InstructionPage
      title="Memory Assessment"
      subtitle="Two tasks: sequence memory and word recall"
      icon={<Psychology sx={{ fontSize: 40 }} />}
      headerColor="secondary.main"
      estimatedTime="5 minutes"
      stepNumber={4}
      totalSteps={4}
      testName="Memory Test"
      instructions={[
        'This assessment has two parts.',
        'Part 1 — Sequence Memory: You will see a sequence of items.',
        'Memorize the sequence, then reproduce it in the correct order.',
        'Part 2 — Word Recall: You will be shown a list of words.',
        'After a short delay, recall as many words as you can.',
        'Complete both parts to finish the memory assessment.'
      ]}
      importantNotes={[
        'Complete both parts — sequence memory AND word recall.',
        'Do not write anything down during the memorization phase.',
        'Take your time — there is no strict time pressure.'
      ]}
      onStart={() => navigate('/memory-test')}
      onBack={() => navigate('/assessment/instructions/keystroke')}
    />
  );
}

export default MemoryInstructions;
