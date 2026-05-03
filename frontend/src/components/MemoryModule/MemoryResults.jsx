// =====================================================
// MEMORY RESULTS COMPONENT
// Displays detailed results for both Sequence and Word memory tests
// =====================================================

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Button } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import './MemoryResults.css';
import { memoryService } from '@services';

const MemoryResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCombined, setIsCombined] = useState(false);
  const [sequenceData, setSequenceData] = useState(null);
  const [wordData, setWordData] = useState(null);
  const assessmentId = localStorage.getItem('currentAssessmentId');
  const isInAssessment = Boolean(assessmentId);

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
      const response = await memoryService.getResults(resultId);
      const data = response.data;
      
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
      <div className="results-container combined-results">
        <div className="combined-page-header">
          <h1 className="combined-page-title">Memory Assessment Complete!</h1>
          <p className="combined-page-subtitle">Here's how your brain performed today</p>
        </div>
        <div className="combined-hero">
          <div className="combined-card">
            <div className="combined-score">
              <div className="combined-score-ring" style={{ '--progress': `${combinedRiskScore}` }}>
                <div className="combined-score-main">{combinedRiskScore}</div>
                <div className="combined-score-sub">/100</div>
              </div>
              <div className="combined-score-label">Combined Memory Score</div>
            </div>

            <div className="combined-details">
              <div className="combined-risk-pill" style={{ backgroundColor: getRiskColor(combinedRiskLevel) }}>
                {combinedRiskLevel} Risk
              </div>
              <p className="combined-risk-text">
                Your memory performance is in the {combinedRiskLevel.toLowerCase()} range.
                Keep practicing to improve your results.
              </p>
              <div className="combined-scale">
                <div className="combined-scale-bar">
                  <span
                    className="combined-scale-indicator"
                    style={{ left: `${combinedRiskScore}%`, backgroundColor: getRiskColor(combinedRiskLevel) }}
                  />
                </div>
                <div className="combined-scale-labels">
                  <span>Low 0</span>
                  <span>Moderate 40</span>
                  <span>High 100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="combined-section">
          <h3 className="section-title">Overall Performance</h3>
          <div className="performance-grid">
            <div className="performance-card">
              <div className="performance-title">Sequence Memory Test</div>
              <div className="performance-score">{sequenceData.riskScore}/100</div>
              <div className="performance-metrics">
                <span>Accuracy {sequenceData.metrics.accuracy.toFixed(1)}%</span>
                <span>Span {sequenceData.metrics.maxSequenceLength}</span>
                <span>Time {(sequenceData.metrics.avgResponseTime / 1000).toFixed(1)}s</span>
                <span>Consistency {sequenceData.metrics.consistencyScore.toFixed(1)}%</span>
              </div>
            </div>
            <div className="performance-card">
              <div className="performance-title">Word Recall Test</div>
              <div className="performance-score">{wordData.riskScore}/100</div>
              <div className="performance-metrics">
                <span>Accuracy {wordData.metrics.accuracy.toFixed(1)}%</span>
                <span>Span {wordData.metrics.maxSequenceLength}</span>
                <span>Time {(wordData.metrics.avgResponseTime / 1000).toFixed(1)}s</span>
                <span>Consistency {wordData.metrics.consistencyScore.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="combined-section">
          <h3 className="section-title">Personalized Recommendations</h3>
          <div className="recommendations-scroll">
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
        </div>

        <div className="combined-actions">
          <button
            className="combined-button secondary"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
          <button
            className="combined-button ghost"
            onClick={() => navigate('/memory-test')}
          >
            Take Test Again
          </button>
          {isInAssessment && (
            <button
              className="combined-button primary"
              onClick={() => {
                const id = localStorage.getItem('currentAssessmentId');
                navigate(`/assessment/overall/${id}`);
              }}
            >
              View Overall Result
            </button>
          )}
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

      {isInAssessment && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            color="success"
            onClick={() => {
              const id = localStorage.getItem('currentAssessmentId');
              navigate(`/assessment/overall/${id}`);
            }}
            endIcon={<ArrowForward />}
          >
            View Overall Results
          </Button>
        </Box>
      )}
    </div>
  );
};

export default MemoryResults;
