import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SequenceMemoryTest from './SequenceMemoryTest';
import WordMemoryTest from './WordMemoryTest';
import IntermediateResults from './IntermediateResults';

const MemoryTestFlow = () => {
  const navigate = useNavigate();
  const [currentStage, setCurrentStage] = useState('sequence-test'); // sequence-test, sequence-results, word-test, word-results
  const [sequenceResults, setSequenceResults] = useState(null);
  const [wordResults, setWordResults] = useState(null);

  const handleSequenceComplete = (results) => {
    setSequenceResults(results);
    setCurrentStage('sequence-results');
  };

  const handleSequenceSkipToNext = (results) => {
    setSequenceResults(results);
    setCurrentStage('word-test');
  };

  const handleSequenceNext = () => {
    setCurrentStage('word-test');
  };

  const handleWordComplete = (results) => {
    setWordResults(results);
    setCurrentStage('word-results');
  };

  const handleWordSkipToDetailed = (results) => {
    setWordResults(results);
    // Navigate directly to detailed results
    navigate('/memory-results', {
      state: {
        sequenceResultId: sequenceResults?.resultId,
        wordResultId: results?.resultId,
        sequenceResults,
        wordResults: results,
        isCombined: true
      }
    });
  };

  const handleViewDetailedResults = () => {
    // Navigate to the detailed results page with both test results
    navigate('/memory-results', {
      state: {
        sequenceResultId: sequenceResults?.resultId,
        wordResultId: wordResults?.resultId,
        sequenceResults,
        wordResults,
        isCombined: true
      }
    });
  };

  return (
    <>
      {currentStage === 'sequence-test' && (
        <SequenceMemoryTest 
          onComplete={handleSequenceComplete}
          onSkipToNext={handleSequenceSkipToNext}
        />
      )}

      {currentStage === 'sequence-results' && sequenceResults && (
        <IntermediateResults
          testType="sequence"
          results={sequenceResults}
          onNext={handleSequenceNext}
          isLastTest={false}
        />
      )}

      {currentStage === 'word-test' && (
        <WordMemoryTest 
          onComplete={handleWordComplete}
          onSkipToDetailed={handleWordSkipToDetailed}
        />
      )}

      {currentStage === 'word-results' && wordResults && (
        <IntermediateResults
          testType="word"
          results={wordResults}
          onNext={handleViewDetailedResults}
          isLastTest={true}
        />
      )}
    </>
  );
};

export default MemoryTestFlow;
