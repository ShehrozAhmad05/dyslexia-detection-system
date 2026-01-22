const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assessmentType: {
    type: String,
    enum: ['individual', 'comprehensive'],
    default: 'individual'
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'incomplete'],
    default: 'in_progress'
  },
  // Module Results
  handwritingResult: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HandwritingResult',
    default: null
  },
  keystrokeResult: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KeystrokeResult',
    default: null
  },
  readingResult: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReadingResult',
    default: null
  },
  // Overall Analysis
  overallRiskScore: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  riskLevel: {
    type: String,
    enum: ['low', 'moderate', 'high', 'unknown'],
    default: 'unknown'
  },
  // Fusion Results
  fusionAnalysis: {
    confidenceScore: Number,
    moduleWeights: {
      handwriting: { type: Number, default: 0.33 },
      keystroke: { type: Number, default: 0.33 },
      reading: { type: Number, default: 0.34 }
    },
    combinedRecommendations: [String],
    analysisNotes: String
  },
  // Therapy & Follow-up
  therapyRecommendations: [{
    category: String,
    title: String,
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    resources: [String]
  }],
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  // Completion tracking
  completedAt: Date,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for queries
assessmentSchema.index({ user: 1, createdAt: -1 });
assessmentSchema.index({ status: 1 });

// Method to calculate overall risk score
assessmentSchema.methods.calculateOverallRisk = function() {
  const scores = [];
  const weights = this.fusionAnalysis.moduleWeights;

  if (this.handwritingResult?.analysisResults?.riskScore) {
    scores.push(this.handwritingResult.analysisResults.riskScore * weights.handwriting);
  }
  if (this.keystrokeResult?.analysisResults?.riskScore) {
    scores.push(this.keystrokeResult.analysisResults.riskScore * weights.keystroke);
  }
  // ReadingResult stores riskScore directly (0-100), convert to 0-1 scale
  if (this.readingResult?.riskScore) {
    scores.push((this.readingResult.riskScore / 100) * weights.reading);
  }

  if (scores.length === 0) return null;

  const totalScore = scores.reduce((a, b) => a + b, 0);
  this.overallRiskScore = totalScore;

  // Update risk level
  if (totalScore >= 0.7) this.riskLevel = 'high';
  else if (totalScore >= 0.4) this.riskLevel = 'moderate';
  else this.riskLevel = 'low';

  return totalScore;
};

// Method to check if assessment is complete
assessmentSchema.methods.isComplete = function() {
  if (this.assessmentType === 'comprehensive') {
    return !!(this.handwritingResult && this.keystrokeResult && this.readingResult);
  }
  // For individual, at least one module completed
  return !!(this.handwritingResult || this.keystrokeResult || this.readingResult);
};

// Update lastUpdated on save
assessmentSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  
  // Update status based on completion
  if (this.isComplete() && this.status === 'in_progress') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  next();
});

module.exports = mongoose.model('Assessment', assessmentSchema);
