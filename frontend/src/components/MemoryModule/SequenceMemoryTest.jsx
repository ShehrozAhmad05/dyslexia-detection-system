// =====================================================
// SEQUENCE MEMORY TEST COMPONENT
// Fun, child-friendly memory game for dyslexia assessment
// =====================================================

import { useState, useEffect } from 'react';
import './SequenceMemoryTest.css';
import { memoryService } from '@services';

const SequenceMemoryTest = ({ onComplete, onSkipToNext }) => {
  
  // =====================================================
  // STATE MANAGEMENT
  // =====================================================
  const [gameState, setGameState] = useState('intro');  // intro, showing, input, feedback, complete
  const [currentRound, setCurrentRound] = useState(1);
  const [maxRounds] = useState(6);  // Test 6 sequences (3,3,4,4,5,5 items)
  const [currentSequence, setCurrentSequence] = useState('');
  const [userInput, setUserInput] = useState('');
  const [timer, setTimer] = useState(3);
  const [results, setResults] = useState([]);  // Store all attempts
  const [feedback, setFeedback] = useState({ show: false, correct: false, message: '' });
  const [sequenceLength, setSequenceLength] = useState(3);  // Start with 3 items
  const [score, setScore] = useState(0);
  const [resultsSubmitted, setResultsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [inputStartTime, setInputStartTime] = useState(null);

  // =====================================================
  // START THE GAME
  // =====================================================
  const startGame = () => {
    setGameState('showing');
    generateNewSequence(3);  // Start with 3-item sequence
  };

  // =====================================================
  // GENERATE NEW SEQUENCE
  // OPTIMIZED: No repeats, balanced mix, no easy patterns
  // =====================================================
  const generateNewSequence = (length) => {
    // Exclude confusing letters (I, O, Q, S, Z look like numbers)
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'T', 'U', 'V', 'W', 'X', 'Y'];
    const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    const items = [];
    let lastItem = null;
    let lastType = null; // 'letter' or 'number'
    let consecutiveSameType = 0;
    
    for (let i = 0; i < length; i++) {
      let item;
      let currentType;
      let attempts = 0;
      const maxAttempts = 50;
      
      do {
        // Alternate between letters and numbers for variety
        // But allow some randomness (70% chance to switch type)
        const shouldSwitchType = consecutiveSameType >= 2 || Math.random() > 0.3;
        
        if (lastType === null || shouldSwitchType) {
          // Randomly pick letter or number
          currentType = Math.random() > 0.5 ? 'letter' : 'number';
        } else {
          currentType = lastType;
        }
        
        const pool = currentType === 'letter' ? letters : numbers;
        item = pool[Math.floor(Math.random() * pool.length)];
        
        attempts++;
        if (attempts > maxAttempts) break; // Prevent infinite loop
        
        // Avoid consecutive repeats (A-A) and sequential patterns (1-2-3)
      } while (
        (item === lastItem) || // No repeats
        (isSequentialPattern(items, item, lastItem)) // No patterns like 1-2-3 or A-B-C
      );
      
      items.push(item);
      
      // Track consecutive same type
      if (currentType === lastType) {
        consecutiveSameType++;
      } else {
        consecutiveSameType = 1;
      }
      
      lastItem = item;
      lastType = currentType;
    }
    
    const sequence = items.join('-');
    setCurrentSequence(sequence);
    setSequenceLength(length);
    setTimer(5);  // 5 seconds to view
    startCountdown();
  };
  
  // Helper: Detect sequential patterns (1-2-3, A-B-C, etc.)
  const isSequentialPattern = (items, newItem, lastItem) => {
    if (items.length < 2 || !lastItem) return false;
    
    const secondLast = items[items.length - 1];
    
    // Check if three consecutive items form a sequence
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    // Check letter sequence
    const idx1 = letters.indexOf(secondLast);
    const idx2 = letters.indexOf(lastItem);
    const idx3 = letters.indexOf(newItem);
    
    if (idx1 !== -1 && idx2 !== -1 && idx3 !== -1) {
      if (idx2 === idx1 + 1 && idx3 === idx2 + 1) return true; // Ascending
      if (idx2 === idx1 - 1 && idx3 === idx2 - 1) return true; // Descending
    }
    
    // Check number sequence
    const num1 = numbers.indexOf(secondLast);
    const num2 = numbers.indexOf(lastItem);
    const num3 = numbers.indexOf(newItem);
    
    if (num1 !== -1 && num2 !== -1 && num3 !== -1) {
      if (num2 === num1 + 1 && num3 === num2 + 1) return true; // Ascending
      if (num2 === num1 - 1 && num3 === num2 - 1) return true; // Descending
    }
    
    return false;
  };

  // =====================================================
  // COUNTDOWN TIMER
  // =====================================================
  const startCountdown = () => {
    let timeLeft = 5;
    setTimer(timeLeft);
    
    const countdown = setInterval(() => {
      timeLeft -= 1;
      setTimer(timeLeft);
      
      if (timeLeft <= 0) {
        clearInterval(countdown);
        setGameState('input');  // Switch to input mode
        setInputStartTime(Date.now());  // Start timing response
      }
    }, 1000);
  };

  // =====================================================
  // HANDLE USER SUBMISSION
  // =====================================================
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calculate actual response time
    const responseTime = inputStartTime ? Date.now() - inputStartTime : 2500;
    
    // Normalize both for comparison
    const normalizedSequence = currentSequence.replace(/[-\s]/g, '').toUpperCase();
    const normalizedInput = userInput.replace(/[-\s]/g, '').toUpperCase();
    
    const isCorrect = normalizedSequence === normalizedInput;
    
    // Store result
    const result = {
      sequence: currentSequence,
      userInput: userInput,
      correct: isCorrect,
      length: sequenceLength,
      timeShown: 5000,
      responseTime: responseTime  // Actual tracked time
    };
    
    setResults([...results, result]);
    
    // Update score
    if (isCorrect) {
      setScore(score + 1);
    }
    
    // Show feedback
    setFeedback({
      show: true,
      correct: isCorrect,
      message: isCorrect 
        ? getCuteSuccessMessage() 
        : getCuteEncouragementMessage()
    });
    
    setGameState('feedback');
    
    // Auto proceed to next round after 2 seconds
    setTimeout(() => {
      proceedToNextRound();
    }, 2000);
  };

  // =====================================================
  // PROCEED TO NEXT ROUND
  // =====================================================
  const proceedToNextRound = () => {
    setFeedback({ show: false, correct: false, message: '' });
    setUserInput('');
    
    if (currentRound >= maxRounds) {
      // Test complete!
      setGameState('complete');
      return;
    }
    
    // Increase difficulty every 2 rounds
    let newLength = sequenceLength;
    if (currentRound % 2 === 0 && sequenceLength < 9) {
      newLength += 1;
      setSequenceLength(newLength);
    }
    
    setCurrentRound(currentRound + 1);
    setGameState('showing');
    generateNewSequence(newLength);
  };

  // =====================================================
  // SUBMIT RESULTS TO BACKEND
  // =====================================================
  const submitToBackend = async () => {
    try {
      const response = await memoryService.submitTest({
        testType: 'sequence',
        taskData: {
          sequences: results
        }
      });

      const data = response.data;
      
      if (data.success) {
        const resultsData = {
          resultId: data.resultId,
          metrics: data.metrics,
          riskScore: data.riskScore,
          riskLevel: data.riskLevel,
          riskBreakdown: data.riskBreakdown,
          recommendations: data.recommendations,
          testType: 'sequence'
        };
        setSubmittedData(resultsData);
        setResultsSubmitted(true);
        return resultsData;
      }
    } catch (error) {
      alert('Failed to submit results. Please check your connection and try again.');
      return null;
    }
  };

  const submitAndShowResults = async () => {
    const resultsData = await submitToBackend();
    if (resultsData && onComplete) {
      onComplete(resultsData);
    }
  };

  const submitAndSkipToNext = async () => {
    const resultsData = await submitToBackend();
    if (resultsData && onSkipToNext) {
      onSkipToNext(resultsData);
    }
  };

  // =====================================================
  // CUTE MESSAGES FOR CHILDREN
  // =====================================================
  const getCuteSuccessMessage = () => {
    const messages = [
      "Amazing! You're a memory superstar! ⭐",
      "Wow! Perfect match! 🌟",
      "Incredible! Your brain is super strong! 💪",
      "Fantastic! Keep it up! 🎉",
      "You did it! Great job! 🏆",
      "Brilliant! You're doing awesome! 🌈"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getCuteEncouragementMessage = () => {
    const messages = [
      "Good try! You're getting better! 💙",
      "Almost there! Keep going! 🌟",
      "Don't worry, practice makes perfect! 💪",
      "Nice effort! Try the next one! 😊",
      "You're doing great! Keep trying! 🎈",
      "That's okay! Let's do the next one! 🌈"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // =====================================================
  // RENDER: INTRO SCREEN
  // =====================================================
  if (gameState === 'intro') {
    return (
      <div className="sequence-test-container">
        <div className="intro-card cute-card">
          <div className="game-icon">🧠</div>
          <h1 className="game-title">Memory Sequence Game</h1>
          <p className="game-description">
            Let's play a fun memory game! 🎮
          </p>
          
          <div className="instructions-box">
            <h3>How to Play:</h3>
            <ol className="instructions-list">
              <li>
                <span className="step-icon">👀</span>
                Watch the sequence carefully (like: <strong>A - 5 - D</strong>)
              </li>
              <li>
                <span className="step-icon">⏱️</span>
                You'll have 5 seconds to remember it
              </li>
              <li>
                <span className="step-icon">✍️</span>
                Type what you remember (use spaces or hyphens)
              </li>
              <li>
                <span className="step-icon">🎯</span>
                Complete 6 rounds and see your score!
              </li>
            </ol>
          </div>
          
          <button className="start-button cute-button" onClick={startGame}>
            🚀 Start Game!
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: SHOWING SEQUENCE
  // =====================================================
  if (gameState === 'showing') {
    return (
      <div className="sequence-test-container">
        <div className="game-header">
          <div className="progress-bar">
            <span>Round {currentRound} of {maxRounds}</span>
            <div className="stars">
              {Array.from({ length: maxRounds }).map((_, i) => (
                <span key={i} className={i < currentRound - 1 ? 'star-filled' : 'star-empty'}>
                  {i < currentRound - 1 ? '⭐' : '☆'}
                </span>
              ))}
            </div>
          </div>
          <div className="score-display">Score: {score}/{currentRound - 1}</div>
        </div>
        
        <div className="sequence-display-card cute-card">
          <h2 className="instruction-text">Remember this sequence! 👀</h2>
          
          <div className="sequence-display">
            {currentSequence.split('-').map((item, index) => (
              <div key={index} className="sequence-item animate-pop">
                {item}
              </div>
            ))}
          </div>
          
          <div className="timer-display">
            <div className="timer-circle">{timer}</div>
            <p>seconds remaining</p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: INPUT SCREEN
  // =====================================================
  if (gameState === 'input') {
    return (
      <div className="sequence-test-container">
        <div className="game-header">
          <div className="progress-bar">
            <span>Round {currentRound} of {maxRounds}</span>
            <div className="stars">
              {Array.from({ length: maxRounds }).map((_, i) => (
                <span key={i} className={i < currentRound - 1 ? 'star-filled' : 'star-empty'}>
                  {i < currentRound - 1 ? '⭐' : '☆'}
                </span>
              ))}
            </div>
          </div>
          <div className="score-display">Score: {score}/{currentRound - 1}</div>
        </div>
        
        <div className="input-card cute-card">
          <h2 className="instruction-text">What was the sequence? 🤔</h2>
          
          <form onSubmit={handleSubmit} className="input-form">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type here (e.g., A-5-D or A 5 D)"
              className="sequence-input cute-input"
              autoFocus
            />
            
            <div className="button-group">
              <button type="submit" className="submit-button cute-button">
                ✅ Submit Answer
              </button>
            </div>
          </form>
          
          <p className="hint-text">
            💡 Tip: You can use spaces or hyphens between items
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: FEEDBACK SCREEN
  // =====================================================
  if (gameState === 'feedback') {
    return (
      <div className="sequence-test-container">
        <div className="feedback-card cute-card">
          <div className={`feedback-icon ${feedback.correct ? 'correct' : 'incorrect'}`}>
            {feedback.correct ? '✅' : '❌'}
          </div>
          <h2 className={`feedback-message ${feedback.correct ? 'correct' : 'incorrect'}`}>
            {feedback.message}
          </h2>
          
          <div className="feedback-details">
            <p className="detail-row">
              <strong>Original:</strong> 
              <span className="sequence-highlight">{currentSequence}</span>
            </p>
            <p className="detail-row">
              <strong>Your answer:</strong> 
              <span className="sequence-highlight">{userInput}</span>
            </p>
          </div>
          
          <p className="next-round-text">Moving to next round... 🎯</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: COMPLETE SCREEN
  // =====================================================
  if (gameState === 'complete') {
    const accuracy = Math.round((score / maxRounds) * 100);
    
    return (
      <div className="sequence-test-container">
        <div className="complete-card cute-card">
          <div className="celebration-icon">🎉</div>
          <h1 className="complete-title">Test Complete!</h1>
          
          <div className="final-score-box">
            <h2>Your Score</h2>
            <div className="score-big">{score} / {maxRounds}</div>
            <div className="accuracy-text">{accuracy}% Correct</div>
            
            <div className="stars-earned">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < Math.floor(accuracy / 20) ? 'star-big' : 'star-gray'}>
                  {i < Math.floor(accuracy / 20) ? '⭐' : '☆'}
                </span>
              ))}
            </div>
          </div>
          
          <div className="button-group">
            <button className="submit-button cute-button" onClick={submitAndShowResults}>
              📊 View My Results
            </button>
            <button className="secondary-button cute-button" onClick={submitAndSkipToNext}>
              ➡️ Next Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SequenceMemoryTest;
