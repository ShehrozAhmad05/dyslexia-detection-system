// =====================================================
// SEQUENCE MEMORY TEST COMPONENT
// Fun, child-friendly memory game for dyslexia assessment
// =====================================================

import { useState, useEffect } from 'react';
import './SequenceMemoryTest.css';
import { memoryService } from '@services';
import introVideo from '../../assets/vdo.mp4';
import sequenceBg from '../../assets/bkg.png';
import sequenceCartoon from '../../assets/cartoon.png';

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
  const [feedback, setFeedback] = useState({ correct: false, message: '' });
  const [sequenceLength, setSequenceLength] = useState(3);  // Start with 3 items
  const [score, setScore] = useState(0);
  const [resultsSubmitted, setResultsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [inputStartTime, setInputStartTime] = useState(null);
  const [showStartButton, setShowStartButton] = useState(false);
  const [timerValue, setTimerValue] = useState(0);
  const [timerProgress, setTimerProgress] = useState(100);


  useEffect(() => {
    // Lock scrolling when the intro, showing, input, feedback, or complete screen is active
    if (['intro', 'showing', 'input', 'feedback', 'complete'].includes(gameState)) {
      document.body.classList.add('memory-intro-lock');
    } else {
      document.body.classList.remove('memory-intro-lock');
    }

    // Cleanup function to remove the class when the component unmounts
    return () => {
      document.body.classList.remove('memory-intro-lock');
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'showing') {
      const sequenceShowTime = 1500 + currentSequence.length * 500;
      setTimerValue(Math.ceil(sequenceShowTime / 1000));
      setTimerProgress(100); // Reset to full

      // Countdown for the number
      const numberInterval = setInterval(() => {
        setTimerValue(prev => (prev > 1 ? prev - 1 : 0));
      }, 1000);

      // Smooth animation for the circle
      const startTime = Date.now();
      const progressInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.max(0, 100 - (elapsedTime / sequenceShowTime) * 100);
        setTimerProgress(progress);

        if (progress === 0) {
          clearInterval(progressInterval);
        }
      }, 30); // Update smoothly

      return () => {
        clearInterval(numberInterval);
        clearInterval(progressInterval);
      };
    }
  }, [gameState, currentSequence]);

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
      const payload = {
        testType: 'sequence',
        taskData: {
          sequences: results
        }
      };
      const assessmentId = localStorage.getItem('currentAssessmentId');
      const submitPayload = {
        ...payload,
        ...(assessmentId && { assessmentId })
      };
      const response = await memoryService.submitTest(submitPayload);

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
      <div className="sequence-test-container intro-screen">
        <video className="intro-video" autoPlay muted loop playsInline>
          <source src={introVideo} type="video/mp4" />
        </video>

        <div className="intro-content">
          <div className="intro-left">
            <h1 className="intro-title">Sequence Memory Test</h1>

            <div className="intro-steps">
              <h3>How to play</h3>
              <ul>
                <li>Watch the sequence carefully for a few seconds.</li>
                <li>When it disappears, type the sequence in the same order.</li>
                <li>Complete 6 rounds to finish the game.</li>
              </ul>
            </div>

            <button className="start-button video-button" onClick={startGame}>
              Start Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: SHOWING SEQUENCE
  // =====================================================
  if (gameState === 'showing') {
    return (
      <div
        className="sequence-test-container sequence-showing"
        style={{ backgroundImage: `url(${sequenceBg})` }}
      >
        <div className="sequence-top">
          <div className="circular-timer">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <circle
                className="timer-bg"
                cx="30" cy="30" r="25"
              />
              <circle
                className="timer-progress"
                cx="30" cy="30" r="25"
                strokeDasharray="157"
                strokeDashoffset={157 - (157 * timerProgress) / 100}
              />
            </svg>
            <span className="timer-text">{timerValue}s</span>
          </div>
          <div className="round-dots">
            {Array.from({ length: maxRounds }).map((_, i) => (
              <span
                key={i}
                className={`round-dot ${i < currentRound - 1 ? 'completed' : ''} ${i === currentRound - 1 ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>

        <div className="sequence-stage">
          <div className="sequence-dialog">
            <div className="dialog-bubble float-bubble">
              <h3>Watch the sequence carefully</h3>
              <p>Remember the letters in the same order!</p>
            </div>
          </div>

          <div className="sequence-character">
            <img src={sequenceCartoon} alt="Cartoon guide" />
          </div>
        </div>

        <div className="sequence-display">
          {currentSequence.split('-').map((item, index) => (
            <div
              key={index}
              className={`sequence-item animate-pop color-${index % 5}`}
            >
              {item}
            </div>
          ))}
        </div>

        <div className="boy-side-bubble float-bubble">I believe in you! </div>

      </div>
    );
  }

  // =====================================================
  // RENDER: INPUT SCREEN
  // =====================================================
  if (gameState === 'input') {
    return (
      <div className="sequence-input-screen">
        <div className="game-header">
          <div className="progress-bar">
            {Array.from({ length: maxRounds }).map((_, index) => (
              <span
                key={index}
                className={`progress-dot ${index < currentRound - 1 ? 'completed' : ''}`}
              ></span>
            ))}
          </div>
          <div className="score-display">
            <p>Score: {score}</p>
          </div>
        </div>
        <div className="input-content">
          <div className="input-card cute-card">
            <h2 className="instruction-text">What was the sequence? 🤔</h2>
            <form onSubmit={handleSubmit} className="input-form">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="sequence-input"
                placeholder="Type the sequence here"
                autoFocus
                disabled={gameState !== 'input'}
              />
              <button type="submit" className="submit-button cute-button">
                ✅ Submit Answer
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'feedback') {
    return (
      <div className="sequence-feedback-screen">
        <div className="feedback-content">
          <div className="feedback-card cute-card">
            <h2 className={`feedback-message ${feedback.correct ? 'correct' : 'incorrect'}`}>
              {feedback.message}
            </h2>
            
            <div className="feedback-details">
              <p className="detail-row">
                <strong>Original Sequence:</strong> 
                <span className="sequence-highlight original">{currentSequence}</span>
              </p>
              <p className="detail-row">
                <strong>Your Answer:</strong> 
                <span className={`sequence-highlight ${feedback.correct ? 'user-correct' : 'user-incorrect'}`}>{userInput}</span>
              </p>
            </div>
            
            <p className="next-round-text">Moving to the next round...</p>
          </div>
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
      <div className="sequence-complete-screen">
        <div className="complete-content">
          <div className="complete-card cute-card">
            <h1 className="complete-title">Test Complete!</h1>
            
            <div className="final-score-box">
              <h2>Your Final Score</h2>
              <div className="score-big">{score} / {maxRounds}</div>
              <div className="accuracy-text">{accuracy}% Correct</div>
            </div>
            
            <div className="button-group">
              <button className="submit-button cute-button" onClick={submitAndShowResults}>
                View My Results
              </button>
              <button className="secondary-button cute-button" onClick={submitAndSkipToNext}>
                Next Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SequenceMemoryTest;
