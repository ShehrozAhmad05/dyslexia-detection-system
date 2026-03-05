import React from 'react';
import './IntermediateResults.css';

const IntermediateResults = ({ testType, results, onNext, isLastTest }) => {
  const { accuracy, maxSequenceLength, avgResponseTime, consistencyScore } = results.metrics || {};
  const riskScore = results.riskScore || 0;
  const riskLevel = results.riskLevel || 'UNKNOWN';

  const getRiskColor = (level) => {
    switch (level) {
      case 'LOW': return '#4caf50';
      case 'MODERATE': return '#ff9800';
      case 'HIGH': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getEncouragingMessage = () => {
    if (accuracy >= 80) return "🌟 Excellent work! You're doing great!";
    if (accuracy >= 60) return "👍 Good job! Keep going!";
    return "💪 Nice try! Let's continue!";
  };

  return (
    <div className="intermediate-results-container">
      <div className="intermediate-results-card">
        <div className="test-complete-header">
          <div className="success-icon">✓</div>
          <h2>{testType === 'sequence' ? 'Sequence Test' : 'Word Test'} Complete!</h2>
          <p className="encouraging-message">{getEncouragingMessage()}</p>
        </div>

        <div className="quick-stats">
          <div className="stat-row">
            <div className="stat-item">
              <span className="stat-label">Accuracy</span>
              <span className="stat-value">{accuracy ? `${accuracy.toFixed(1)}%` : 'N/A'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Memory Span</span>
              <span className="stat-value">{maxSequenceLength || 'N/A'}</span>
            </div>
          </div>
          
          <div className="stat-row">
            <div className="stat-item">
              <span className="stat-label">Avg Response Time</span>
              <span className="stat-value">{avgResponseTime ? `${(avgResponseTime / 1000).toFixed(1)}s` : 'N/A'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Consistency</span>
              <span className="stat-value">{consistencyScore ? `${consistencyScore.toFixed(1)}%` : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="risk-preview">
          <div className="risk-label">Current Risk Score</div>
          <div className="risk-score-display" style={{ borderColor: getRiskColor(riskLevel) }}>
            <span className="score-number" style={{ color: getRiskColor(riskLevel) }}>
              {riskScore.toFixed(0)}
            </span>
            <span className="score-total">/100</span>
          </div>
          <div className="risk-level-badge" style={{ backgroundColor: getRiskColor(riskLevel) }}>
            {riskLevel} RISK
          </div>
        </div>

        {!isLastTest && (
          <div className="next-test-info">
            <div className="info-icon">ℹ️</div>
            <p>Ready for the next challenge? Click below to continue!</p>
          </div>
        )}

        <div className="action-button-container">
          <button className="next-button" onClick={onNext}>
            {isLastTest ? (
              <>
                <span>View Detailed Results</span>
                <span className="button-icon">📊</span>
              </>
            ) : (
              <>
                <span>Next Test</span>
                <span className="button-icon">→</span>
              </>
            )}
          </button>
        </div>

        {isLastTest && (
          <p className="final-note">See your combined memory assessment results</p>
        )}
      </div>
    </div>
  );
};

export default IntermediateResults;
