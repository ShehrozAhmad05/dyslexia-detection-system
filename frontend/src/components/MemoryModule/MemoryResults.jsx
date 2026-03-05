// =====================================================
// MEMORY RESULTS COMPONENT
// Displays detailed results for both Sequence and Word memory tests
// =====================================================

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './MemoryResults.css';

const MemoryResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCombined, setIsCombined] = useState(false);
  const [sequenceData, setSequenceData] = useState(null);
  const [wordData, setWordData] = useState(null);

  // =====================================================
  // FETCH RESULTS ON MOUNT
  // =====================================================
  useEffect(() => {
    // Check if combined results (from flow)
    if (location.state?.isCombined) {
      setIsCombined(true);
      setSequenceData(location.state.sequenceResults);
      setWordData(location.state.wordResults);
      setLoading(false);
    } else if (location.state?.results) {
      // Single test results
      setResults(location.state.results);
      setLoading(false);
    } else if (location.state?.resultId) {
      // If only ID is passed, fetch from backend
      fetchResultsById(location.state.resultId);
    } else {
      // No data available
      setLoading(false);
    }
  }, [location]);

  // =====================================================
  // FETCH RESULTS BY ID
  // =====================================================
  const fetchResultsById = async (resultId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/memory/results/${resultId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResults(data);
      } else {
        setError('Unable to load results. Please try again.');
      }
    } catch (error) {
      setError('Connection error. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // GET RISK LEVEL COLOR
  // =====================================================
  const getRiskColor = (level) => {
    switch (level) {
      case 'LOW':
        return '#43e97b';
      case 'MODERATE':
        return '#ffa502';
      case 'HIGH':
        return '#ff6b6b';
      default:
        return '#999';
    }
  };

  // =====================================================
  // GET RISK ICON
  // =====================================================
  const getRiskIcon = (level) => {
    switch (level) {
      case 'LOW':
        return '✅';
      case 'MODERATE':
        return '⚠️';
      case 'HIGH':
        return '🔴';
      default:
        return '❓';
    }
  };

  // =====================================================
  // RENDER: LOADING
  // =====================================================
  if (loading) {
    return (
      <div className="results-container">
        <div className="loading-card">
          <div className="loading-spinner">🔄</div>
          <h2>Loading Results...</h2>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: NO DATA
  // =====================================================
  if (!results && !isCombined) {
    return (
      <div className="results-container">
        <div className="error-card">
          <div className="error-icon">😕</div>
          <h2>No Results Found</h2>
          <p>We couldn't find your test results.</p>
          <button className="action-button" onClick={() => navigate('/dashboard')}>
            🏠 Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: COMBINED RESULTS (BOTH TESTS)
  // =====================================================
  if (isCombined && sequenceData && wordData) {
    // Calculate combined metrics
    const combinedRiskScore = ((sequenceData.riskScore + wordData.riskScore) / 2).toFixed(0);
    const combinedRiskLevel = combinedRiskScore < 40 ? 'LOW' : combinedRiskScore < 70 ? 'MODERATE' : 'HIGH';
    
    return (
      <div className="results-container">
        {/* HEADER SECTION */}
        <div className="results-header">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1 className="results-title">🧠 Complete Memory Assessment Results</h1>
          <p className="test-date">Sequence Test + Word Recall Test</p>
        </div>

        {/* COMBINED RISK SCORE CARD */}
        <div className="risk-score-card">
          <div className="risk-score-header">
            <h2>Overall Memory Risk Assessment</h2>
          </div>
          
          <div className="risk-score-display">
            <div className="risk-icon-large" style={{ color: getRiskColor(combinedRiskLevel) }}>
              {getRiskIcon(combinedRiskLevel)}
            </div>
            <div className="risk-score-value">{combinedRiskScore}</div>
            <div className="risk-score-label">Combined Risk Score (0-100)</div>
            <div 
              className="risk-level-badge" 
              style={{ 
                backgroundColor: getRiskColor(combinedRiskLevel),
                color: 'white'
              }}
            >
              {combinedRiskLevel} RISK
            </div>
          </div>

          <div className="risk-scale">
            <div className="risk-scale-bar">
              <div 
                className="risk-scale-indicator" 
                style={{ 
                  left: `${combinedRiskScore}%`,
                  backgroundColor: getRiskColor(combinedRiskLevel)
                }}
              />
            </div>
            <div className="risk-scale-labels">
              <span>0 (Low)</span>
              <span>40</span>
              <span>70</span>
              <span>100 (High)</span>
            </div>
          </div>
        </div>

        {/* INDIVIDUAL TEST COMPARISON */}
        <div className="comparison-section">
          <h3>📊 Test Comparison</h3>
          <div className="comparison-grid">
            {/* Sequence Test Card */}
            <div className="test-comparison-card">
              <div className="test-header">
                <h4>🧠 Sequence Memory Test</h4>
                <div 
                  className="test-risk-badge"
                  style={{ backgroundColor: getRiskColor(sequenceData.riskLevel) }}
                >
                  {sequenceData.riskScore}/100
                </div>
              </div>
              <div className="test-metrics">
                <div className="mini-metric">
                  <span className="mini-label">Accuracy</span>
                  <span className="mini-value">{sequenceData.metrics.accuracy.toFixed(1)}%</span>
                </div>
                <div className="mini-metric">
                  <span className="mini-label">Memory Span</span>
                  <span className="mini-value">{sequenceData.metrics.maxSequenceLength}</span>
                </div>
                <div className="mini-metric">
                  <span className="mini-label">Response Time</span>
                  <span className="mini-value">{(sequenceData.metrics.avgResponseTime / 1000).toFixed(1)}s</span>
                </div>
                <div className="mini-metric">
                  <span className="mini-label">Consistency</span>
                  <span className="mini-value">{sequenceData.metrics.consistencyScore.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Word Test Card */}
            <div className="test-comparison-card">
              <div className="test-header">
                <h4>📚 Word Recall Test</h4>
                <div 
                  className="test-risk-badge"
                  style={{ backgroundColor: getRiskColor(wordData.riskLevel) }}
                >
                  {wordData.riskScore}/100
                </div>
              </div>
              <div className="test-metrics">
                <div className="mini-metric">
                  <span className="mini-label">Accuracy</span>
                  <span className="mini-value">{wordData.metrics.accuracy.toFixed(1)}%</span>
                </div>
                <div className="mini-metric">
                  <span className="mini-label">Memory Span</span>
                  <span className="mini-value">{wordData.metrics.maxSequenceLength}</span>
                </div>
                <div className="mini-metric">
                  <span className="mini-label">Response Time</span>
                  <span className="mini-value">{(wordData.metrics.avgResponseTime / 1000).toFixed(1)}s</span>
                </div>
                <div className="mini-metric">
                  <span className="mini-label">Consistency</span>
                  <span className="mini-value">{wordData.metrics.consistencyScore.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COMBINED RECOMMENDATIONS */}
        <div className="recommendations-card">
          <h3>💡 Combined Recommendations</h3>
          <ul className="recommendations-list">
            {sequenceData.recommendations && sequenceData.recommendations.map((rec, index) => (
              <li key={`seq-${index}`} className="recommendation-item">
                <span className="rec-icon">✓</span>
                {rec}
              </li>
            ))}
            {wordData.recommendations && wordData.recommendations.map((rec, index) => (
              <li key={`word-${index}`} className="recommendation-item">
                <span className="rec-icon">✓</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>

        {/* ACTION BUTTONS */}
        <div className="action-buttons">
          <button 
            className="action-button secondary"
            onClick={() => navigate('/dashboard')}
          >
            🏠 Back to Dashboard
          </button>
          <button 
            className="action-button primary"
            onClick={() => navigate('/memory-test')}
          >
            🔄 Take Test Again
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: SINGLE TEST RESULTS
  // =====================================================
  const { riskScore, riskLevel, metrics, riskBreakdown, recommendations, createdAt } = results;
  const testType = results.result?.testType || 'memory';

  return (
    <div className="results-container">
      {/* HEADER SECTION */}
      <div className="results-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1 className="results-title">
          {testType === 'sequence' ? '🧠 Sequence Memory Test Results' : '📚 Word Memory Test Results'}
        </h1>
        <p className="test-date">
          Completed: {new Date(createdAt).toLocaleDateString()} at {new Date(createdAt).toLocaleTimeString()}
        </p>
      </div>

      {/* RISK SCORE CARD */}
      <div className="risk-score-card">
        <div className="risk-score-header">
          <h2>Overall Risk Assessment</h2>
        </div>
        
        <div className="risk-score-display">
          <div className="risk-icon-large" style={{ color: getRiskColor(riskLevel) }}>
            {getRiskIcon(riskLevel)}
          </div>
          <div className="risk-score-value">{riskScore}</div>
          <div className="risk-score-label">Risk Score (0-100)</div>
          <div 
            className="risk-level-badge" 
            style={{ 
              backgroundColor: getRiskColor(riskLevel),
              color: 'white'
            }}
          >
            {riskLevel} RISK
          </div>
        </div>

        <div className="risk-scale">
          <div className="risk-scale-bar">
            <div 
              className="risk-scale-indicator" 
              style={{ 
                left: `${riskScore}%`,
                backgroundColor: getRiskColor(riskLevel)
              }}
            />
          </div>
          <div className="risk-scale-labels">
            <span>0 (Low)</span>
            <span>40</span>
            <span>70</span>
            <span>100 (High)</span>
          </div>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-value">{metrics.accuracy.toFixed(1)}%</div>
          <div className="metric-label">Accuracy</div>
          <div className="metric-detail">{metrics.correctCount}/{metrics.totalAttempts} correct</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🧠</div>
          <div className="metric-value">{metrics.maxSequenceLength}</div>
          <div className="metric-label">Memory Span</div>
          <div className="metric-detail">Maximum items recalled</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⚡</div>
          <div className="metric-value">{(metrics.avgResponseTime / 1000).toFixed(1)}s</div>
          <div className="metric-label">Avg Response Time</div>
          <div className="metric-detail">Speed of recall</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-value">{metrics.consistencyScore.toFixed(1)}%</div>
          <div className="metric-label">Consistency</div>
          <div className="metric-detail">Performance stability</div>
        </div>
      </div>

      {/* RISK BREAKDOWN */}
      <div className="breakdown-card">
        <h3>📋 Risk Factor Breakdown</h3>
        <div className="breakdown-grid">
          <div className="breakdown-item">
            <div className="breakdown-header">
              <span className="breakdown-name">Accuracy Risk</span>
              <span className="breakdown-value">{riskBreakdown.accuracyRisk.toFixed(1)}</span>
            </div>
            <div className="breakdown-bar">
              <div 
                className="breakdown-fill accuracy"
                style={{ width: `${riskBreakdown.accuracyRisk}%` }}
              />
            </div>
            <div className="breakdown-weight">Weight: 40%</div>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-header">
              <span className="breakdown-name">Capacity Risk</span>
              <span className="breakdown-value">{riskBreakdown.capacityRisk.toFixed(1)}</span>
            </div>
            <div className="breakdown-bar">
              <div 
                className="breakdown-fill capacity"
                style={{ width: `${riskBreakdown.capacityRisk}%` }}
              />
            </div>
            <div className="breakdown-weight">Weight: 30%</div>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-header">
              <span className="breakdown-name">Speed Risk</span>
              <span className="breakdown-value">{riskBreakdown.speedRisk.toFixed(1)}</span>
            </div>
            <div className="breakdown-bar">
              <div 
                className="breakdown-fill speed"
                style={{ width: `${riskBreakdown.speedRisk}%` }}
              />
            </div>
            <div className="breakdown-weight">Weight: 20%</div>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-header">
              <span className="breakdown-name">Consistency Risk</span>
              <span className="breakdown-value">{riskBreakdown.consistencyRisk.toFixed(1)}</span>
            </div>
            <div className="breakdown-bar">
              <div 
                className="breakdown-fill consistency"
                style={{ width: `${riskBreakdown.consistencyRisk}%` }}
              />
            </div>
            <div className="breakdown-weight">Weight: 10%</div>
          </div>
        </div>
      </div>

      {/* RECOMMENDATIONS */}
      <div className="recommendations-card">
        <h3>💡 Recommendations</h3>
        <ul className="recommendations-list">
          {recommendations.map((rec, index) => (
            <li key={index} className="recommendation-item">
              <span className="rec-icon">✓</span>
              {rec}
            </li>
          ))}
        </ul>
      </div>

      {/* ACTION BUTTONS */}
      <div className="action-buttons">
        <button 
          className="action-button secondary"
          onClick={() => navigate('/dashboard')}
        >
          🏠 Back to Dashboard
        </button>
        <button 
          className="action-button primary"
          onClick={() => navigate('/memory/sequence')}
        >
          🔄 Take Another Test
        </button>
      </div>
    </div>
  );
};

export default MemoryResults;
