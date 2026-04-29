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
      <div className="word-test-container">
        <div className="intro-card cute-card">
          <div className="game-icon">📚</div>
          <h1 className="game-title">Word Memory Game</h1>
          <p className="game-description">
            Let's test your word memory! 🎮
          </p>
          
          <div className="instructions-box">
            <h3>How to Play:</h3>
            <ol className="instructions-list">
              <li>
                <span className="step-icon">👀</span>
                Watch words appear on screen
              </li>
              <li>
                <span className="step-icon">⏱️</span>
                Study them carefully (you have time!)
              </li>
              <li>
                <span className="step-icon">🖱️</span>
                After they disappear, click the words you remember
              </li>
              <li>
                <span className="step-icon">🎯</span>
                Complete 3 levels (⭐ → ⭐⭐ → ⭐⭐⭐)
              </li>
            </ol>
          </div>
          
          <div className="levels-info">
            <h4>📊 3 Levels:</h4>
            <div className="level-boxes">
              <div className="level-box">
                <div className="level-star">⭐</div>
                <p>Level 1</p>
                <p className="level-detail">4 words - 20 seconds</p>
              </div>
              <div className="level-box">
                <div className="level-star">⭐⭐</div>
                <p>Level 2</p>
                <p className="level-detail">5 words - 25 seconds</p>
              </div>
              <div className="level-box">
                <div className="level-star">⭐⭐⭐</div>
                <p>Level 3</p>
                <p className="level-detail">6 words - 30 seconds</p>
              </div>
            </div>
          </div>
          
          <button className="start-button cute-button" onClick={startGame}>
            🚀 Start Game!
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
      <div className="word-test-container">
        <div className="loading-card cute-card">
          <div className="loading-spinner">🔄</div>
          <h2>Loading Level {currentLevel}...</h2>
          <p>{getLevelStars(currentLevel)}</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: SHOWING WORDS
  // =====================================================
  if (gameState === 'showing') {
    return (
      <div className="word-test-container">
        <div className="game-header">
          <div className="level-indicator">
            <span className="level-number">Level {currentLevel}</span>
            <span className="level-stars">{getLevelStars(currentLevel)}</span>
          </div>
          <div className="score-display">Score: {score}</div>
        </div>
        
        <div className="words-display-card cute-card">
          <h2 className="instruction-text">Study these words carefully! 👀</h2>
          
          <div className="words-grid">
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
          
          <div className="timer-display">
            <div className="timer-circle">
              {timer}
            </div>
            <p>seconds remaining</p>
          </div>
          
          <p className="hint-text">💡 Try to remember all of them!</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: SELECTING WORDS
  // =====================================================
  if (gameState === 'selecting') {
    return (
      <div className="word-test-container">
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
    
    return (
      <div className="word-test-container">
        <div className="feedback-card cute-card">
          <div className={`feedback-icon ${isAllCorrect ? 'correct' : 'partial'}`}>
            {isAllCorrect ? '🎉' : '👍'}
          </div>
          <h2 className="feedback-message">
            {feedback.message}
          </h2>
          
          <div className="feedback-stats">
            <div className="stat-box correct-stat">
              <div className="stat-icon">✅</div>
              <div className="stat-value">{feedback.correct}</div>
              <div className="stat-label">Correct</div>
            </div>
            
            {feedback.incorrect > 0 && (
              <div className="stat-box incorrect-stat">
                <div className="stat-icon">❌</div>
                <div className="stat-value">{feedback.incorrect}</div>
                <div className="stat-label">Wrong</div>
              </div>
            )}
            
            {feedback.missed > 0 && (
              <div className="stat-box missed-stat">
                <div className="stat-icon">⚠️</div>
                <div className="stat-value">{feedback.missed}</div>
                <div className="stat-label">Missed</div>
              </div>
            )}
          </div>
          
          <p className="next-level-text">
            {currentLevel < maxLevels 
              ? `Moving to Level ${currentLevel + 1}... 🎯` 
              : 'Calculating final results... 📊'}
          </p>
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
      <div className="word-test-container">
        <div className="complete-card cute-card">
          <div className="celebration-icon">🎊</div>
          <h1 className="complete-title">All Levels Complete!</h1>
          
          <div className="final-score-box">
            <h2>Your Total Score</h2>
            <div className="score-big">{totalCorrect} / {totalWords}</div>
            <div className="accuracy-text">{accuracy}% Correct</div>
            
            <div className="stars-earned">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < Math.floor(accuracy / 20) ? 'star-big' : 'star-gray'}>
                  {i < Math.floor(accuracy / 20) ? '⭐' : '☆'}
                </span>
              ))}
            </div>
          </div>
          
          <div className="level-breakdown">
            <h3>📊 Level Breakdown:</h3>
            {results.map((result, index) => (
              <div key={index} className="level-result">
                <span className="level-name">
                  Level {result.level} {getLevelStars(result.level)}
                </span>
                <span className="level-score">
                  {result.correct.length}/{result.wordsShown.length}
                </span>
                <span className="level-accuracy">
                  ({Math.round(result.accuracy)}%)
                </span>
              </div>
            ))}
          </div>
          
          <div className="button-group">
            <button className="submit-button cute-button" onClick={submitAndShowResults}>
              📊 View My Results
            </button>
            <button className="secondary-button cute-button" onClick={submitAndSkipToDetailed}>
              📋 View Detailed Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default WordMemoryTest;
