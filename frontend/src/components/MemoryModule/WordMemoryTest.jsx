// =====================================================
// WORD MEMORY TEST COMPONENT
// Click-based word selection game with 3 levels (12-15 years)
// =====================================================

import { useState, useEffect } from 'react';
import './WordMemoryTest.css';
import { memoryService } from '@services';

const WordMemoryTest = ({ onComplete, onSkipToDetailed }) => {
  
  // =====================================================
  // STATE MANAGEMENT
  // =====================================================
  const [gameState, setGameState] = useState('intro');  // intro, showing, selecting, feedback, complete
  const [currentLevel, setCurrentLevel] = useState(1);
  const [maxLevels] = useState(3);  // 3 levels total
  const [wordsToShow, setWordsToShow] = useState([]);
  const [mixedWords, setMixedWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [timer, setTimer] = useState(20);
  const [results, setResults] = useState([]);  // Store all level results
  const [feedback, setFeedback] = useState({ show: false, correct: 0, incorrect: 0, missed: 0 });
  const [score, setScore] = useState(0);
  const [displayDuration, setDisplayDuration] = useState(20);
  const [resultsSubmitted, setResultsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [recallStartTime, setRecallStartTime] = useState(null);

  // =====================================================
  // START THE GAME
  // =====================================================
  const startGame = () => {
    setGameState('loading');
    loadLevel(1);
  };

  // =====================================================
  // LOAD LEVEL FROM BACKEND
  // =====================================================
  const loadLevel = async (level) => {
    try {
      const response = await memoryService.startTest({
        taskType: 'word',
        level: level
      });

      const data = response.data;
      
      if (data.success) {
        setWordsToShow(data.config.wordsToShow);
        setMixedWords(data.config.mixedWords);
        setDisplayDuration(data.config.displayDuration / 1000);  // Convert to seconds
        setTimer(data.config.displayDuration / 1000);
        setGameState('showing');
        startCountdown(data.config.displayDuration / 1000);
      }
    } catch (error) {
      alert('Failed to load level. Please check your connection and try again.');
    }
  };

  // =====================================================
  // COUNTDOWN TIMER
  // =====================================================
  const startCountdown = (duration) => {
    let timeLeft = duration;
    setTimer(timeLeft);
    
    const countdown = setInterval(() => {
      timeLeft -= 1;
      setTimer(timeLeft);
      
      if (timeLeft <= 0) {
        clearInterval(countdown);
        setGameState('selecting');  // Switch to selection mode
        setRecallStartTime(Date.now());  // Start timing recall
      }
    }, 1000);
  };

  // =====================================================
  // TOGGLE WORD SELECTION
  // =====================================================
  const toggleWordSelection = (word) => {
    if (selectedWords.includes(word)) {
      // Deselect
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else {
      // Check if we've reached the limit for this level
      if (selectedWords.length < wordsToShow.length) {
        // Select (only if under the limit)
        setSelectedWords([...selectedWords, word]);
      }
      // If at limit, do nothing (prevents selecting more than needed)
    }
  };

  // =====================================================
  // SUBMIT LEVEL RESULTS
  // =====================================================
  const handleSubmit = () => {
    // Calculate correct, incorrect, missed
    const correct = selectedWords.filter(word => wordsToShow.includes(word));
    const incorrect = selectedWords.filter(word => !wordsToShow.includes(word));
    const missed = wordsToShow.filter(word => !selectedWords.includes(word));
    
    // Store result
    const result = {
      level: currentLevel,
      wordsShown: wordsToShow,
      wordsRecalled: selectedWords,
      correct: correct,
      incorrect: incorrect,
      missed: missed,
      accuracy: (correct.length / wordsToShow.length) * 100
    };
    
    setResults([...results, result]);
    
    // Update score
    setScore(score + correct.length);
    
    // Show feedback
    setFeedback({
      show: true,
      correct: correct.length,
      incorrect: incorrect.length,
      missed: missed.length,
      message: correct.length === wordsToShow.length 
        ? getCuteSuccessMessage() 
        : getCuteEncouragementMessage()
    });
    
    setGameState('feedback');
    
    // Auto proceed after 3 seconds
    setTimeout(() => {
      proceedToNextLevel();
    }, 3000);
  };

  // =====================================================
  // PROCEED TO NEXT LEVEL
  // =====================================================
  const proceedToNextLevel = () => {
    setFeedback({ show: false, correct: 0, incorrect: 0, missed: 0 });
    setSelectedWords([]);
    
    if (currentLevel >= maxLevels) {
      // Test complete!
      setGameState('complete');
      return;
    }
    
    setCurrentLevel(currentLevel + 1);
    setGameState('loading');
    loadLevel(currentLevel + 1);
  };

  // =====================================================
  // SUBMIT ALL RESULTS TO BACKEND
  // =====================================================
  const submitToBackend = async () => {
    try {
      // Combine all levels into submission format
      const allWordsShown = results.flatMap(r => r.wordsShown);
      const allWordsRecalled = results.flatMap(r => r.wordsRecalled);
      const allCorrect = results.flatMap(r => r.correct);
      const allIncorrect = results.flatMap(r => r.incorrect);
      
      // Calculate actual recall time across all levels (in ms)
      const totalRecallTime = recallStartTime ? Date.now() - recallStartTime : 60000;
      
      const payload = {
        testType: 'word',
        taskData: {
          words: {
            shown: allWordsShown,
            recalled: allWordsRecalled,
            correct: allCorrect,
            incorrect: allIncorrect,
            displayDuration: displayDuration * 1000,
            recallTime: totalRecallTime  // Actual tracked time
          }
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
          testType: 'word'
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

  const submitAndSkipToDetailed = async () => {
    const resultsData = await submitToBackend();
    if (resultsData && onSkipToDetailed) {
      onSkipToDetailed(resultsData);
    }
  };

  // =====================================================
  // CUTE MESSAGES FOR CHILDREN
  // =====================================================
  const getCuteSuccessMessage = () => {
    const messages = [
      "Perfect! You remembered them all! 🌟",
      "Wow! Amazing memory! 🎉",
      "Incredible! You're a word master! 🏆",
      "Fantastic! All correct! ⭐",
      "Brilliant! Keep it up! 💫"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getCuteEncouragementMessage = () => {
    const messages = [
      "Good job! You're doing great! 💙",
      "Nice try! Keep going! 🌈",
      "Well done! Almost there! 💪",
      "Great effort! You got some! 😊",
      "Good work! Try the next level! 🎈"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // =====================================================
  // GET LEVEL STARS
  // =====================================================
  const getLevelStars = (level) => {
    return '⭐'.repeat(level);
  };

  // =====================================================
  // RENDER: INTRO SCREEN
  // =====================================================
  if (gameState === 'intro') {
    return (
      <div className="word-test-container intro-screen">
        <div className="intro-layout">
          <h1 className="game-title intro-title">Word Game</h1>

          <div className="instructions-box intro-instructions">
            <div className="instructions-heading">Instructions</div>
            <ul className="instructions-list">
              <li>Watch the words appear on screen.</li>
              <li>Study them carefully until they disappear.</li>
              <li>Click the words you remember.</li>
              <li>Complete three levels.</li>
            </ul>
          </div>

          <button className="start-button cute-button intro-start" onClick={startGame}>
            Start Game
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: LOADING
  // =====================================================
  if (gameState === 'loading') {
    return (
      <div className="word-test-container word-loading">
        <div className="word-loading-card">
          <div className="word-loading-title">Preparing Level {currentLevel}</div>
          <div className="word-loading-bar">
            <span className="word-loading-progress" />
          </div>
          <p className="word-loading-text">Get ready to memorize the words</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: SHOWING WORDS
  // =====================================================
  if (gameState === 'showing') {
    const timerProgress = displayDuration
      ? Math.max(0, Math.min(100, (timer / displayDuration) * 100))
      : 0;

    return (
      <div className="word-test-container word-showing">
        <div className="word-top-bar">
          <div className="circular-timer word-timer">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <circle className="timer-bg" cx="30" cy="30" r="25" />
              <circle
                className="timer-progress"
                cx="30" cy="30" r="25"
                strokeDasharray="157"
                strokeDashoffset={157 - (157 * timerProgress) / 100}
              />
            </svg>
            <span className="timer-text">{timer}s</span>
          </div>

          <div className="level-pill">Level {currentLevel}</div>
          <div className="score-pill">Score {score}</div>
        </div>

        <div className="word-showing-body">
          <h2 className="word-showing-title">Watch the words Carefully!</h2>

          <div className="words-grid word-showing-grid">
            {wordsToShow.map((word, index) => (
              <div
                key={index}
                className="word-card animate-pop"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {word}
              </div>
            ))}
          </div>
        </div>

        <div className="word-dialog-bubble float-bubble">
          <p>Memorize these words. They will hide soon!</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: SELECTING WORDS
  // =====================================================
  if (gameState === 'selecting') {
    return (
      <div className="word-test-container word-selecting">
        <div className="game-header">
          <div className="level-indicator">
            <span className="level-number">Level {currentLevel}</span>
            <span className="level-stars">{getLevelStars(currentLevel)}</span>
          </div>
          <div className="score-display">Score: {score}</div>
        </div>
        
        <div className="selection-card cute-card">
          <h2 className="instruction-text">Click the words you remember! 🖱️</h2>
          
          <div className="selected-count">
            Selected: {selectedWords.length} / {wordsToShow.length}
          </div>
          
          <div className="mixed-words-grid">
            {mixedWords.map((word, index) => (
              <div 
                key={index} 
                className={`word-choice ${selectedWords.includes(word) ? 'selected' : ''}`}
                onClick={() => toggleWordSelection(word)}
              >
                {word}
                {selectedWords.includes(word) && <span className="check-mark">✓</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="selection-actions">
          <div className="button-group">
            <button 
              className="submit-button cute-button" 
              onClick={handleSubmit}
              disabled={selectedWords.length === 0}
            >
              ✅ Submit ({selectedWords.length} selected)
            </button>
          </div>
          
          <p className="hint-text">💡 Click again to deselect</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: FEEDBACK SCREEN
  // =====================================================
  if (gameState === 'feedback') {
    const isAllCorrect = feedback.correct === wordsToShow.length && feedback.incorrect === 0;
    const totalWords = wordsToShow.length || 0;
    const accuracy = totalWords ? Math.round((feedback.correct / totalWords) * 100) : 0;
    
    return (
      <div className="word-test-container word-feedback">
        <div className="word-feedback-card">
          <div className="feedback-header">
            <div className="feedback-badge">★</div>
            <div>
              <h2 className="feedback-title">Great Job!</h2>
              <p className="feedback-subtitle">You did amazing!</p>
            </div>
            <div className="feedback-trophy">🏆</div>
          </div>

          <div className="feedback-body">
            <div className="feedback-score">
              <div className="score-ring" style={{ '--progress': `${accuracy}` }}>
                <div className="score-main">{feedback.correct}/{totalWords}</div>
                <div className="score-percent">{accuracy}%</div>
              </div>
              <div className="score-label">Your Score</div>
            </div>

            <div className="feedback-stats-grid">
              <div className="feedback-stat correct">
                <div className="stat-name">Correct</div>
                <div className="stat-count">{feedback.correct}</div>
              </div>
              <div className="feedback-stat incorrect">
                <div className="stat-name">Incorrect</div>
                <div className="stat-count">{feedback.incorrect}</div>
              </div>
              <div className="feedback-stat missed">
                <div className="stat-name">Missed</div>
                <div className="stat-count">{feedback.missed}</div>
              </div>
            </div>
          </div>

          <div className="feedback-summary">
            <span className="summary-icon">🏅</span>
            <div>
              <h3>Excellent Memory!</h3>
              <p>{feedback.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: COMPLETE SCREEN
  // =====================================================
  if (gameState === 'complete') {
    const totalWords = results.reduce((sum, r) => sum + r.wordsShown.length, 0);
    const totalCorrect = results.reduce((sum, r) => sum + r.correct.length, 0);
    const accuracy = Math.round((totalCorrect / totalWords) * 100);
    
    return (
      <div className="word-test-container word-complete">
        <div className="word-complete-card">
          <div className="complete-header">
            <div className="complete-badge">★</div>
            <div>
              <h1 className="complete-title">Great Job!</h1>
              <p className="complete-subtitle">You did amazing!</p>
            </div>
            <div className="complete-trophy">🏆</div>
          </div>

          <div className="complete-layout">
            <div className="complete-left">
              <div className="complete-score-ring" style={{ '--progress': `${accuracy}` }}>
                <div className="complete-score-main">{totalCorrect}/{totalWords}</div>
                <div className="complete-score-percent">{accuracy}%</div>
              </div>
              <div className="complete-score-label">Total Score</div>
            </div>

            <div className="complete-right">
              <div className="level-cards">
                {results.map((result, index) => (
                  <div key={index} className="level-card">
                    <div className="level-card-title">Level {result.level}</div>
                    <div className="level-card-score">
                      {result.correct.length}/{result.wordsShown.length}
                    </div>
                    <div className="level-card-accuracy">
                      {Math.round(result.accuracy)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="complete-actions">
            <button className="complete-button secondary" onClick={submitAndSkipToDetailed}>
              View Detailed Results
            </button>
            <button className="complete-button primary" onClick={submitAndShowResults}>
              View My Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default WordMemoryTest;
