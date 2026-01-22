
// Feature weights derived from ETDD70 Random Forest model
// Generated: 2026-01-04 21:42:06.031932
// Model Accuracy: 0.952

const featureWeights = {
  // Weights sum to 1.0 (100%)
  revisitCount: 0.171,
  totalReadingTime: 0.308,
  pauseCount: 0.169,
  avgPauseDuration: 0.052,
  comprehensionScore: 0.300,
  
  metadata: {
    source: 'ETDD70 Random Forest Feature Importance',
    model_accuracy: 0.952,
    note: 'Weights adjusted for web feasibility and include comprehension'
  }
};

module.exports = featureWeights;
