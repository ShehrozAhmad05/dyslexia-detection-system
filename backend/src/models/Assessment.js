const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  assessmentType: {
    type: String,
    enum: ['comprehensive'],
    default: 'comprehensive'
  },

  status: {
    type: String,
    enum: ['in_progress', 'completed', 'incomplete'],
    default: 'in_progress'
  },

  // Track which step user is currently on
  currentStep: {
    type: String,
    enum: ['handwriting', 'reading', 'keystroke', 'memory', 'completed'],
    default: 'handwriting'
  },

  // Module Results — all 4 modules
  handwritingResult: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HandwritingResult',
    default: null
  },
  readingResult: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReadingResult',
    default: null
  },
  keystrokeResult: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KeystrokeResult',
    default: null
  },
  memoryResult: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MemoryResult',
    default: null
  },

  // Overall score on 0-100 scale
  overallRiskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },

  riskLevel: {
    type: String,
    enum: ['low', 'moderate', 'high', 'unknown'],
    default: 'unknown'
  },

  // Fusion Results
  fusionAnalysis: {
    confidenceScore: {
      type: Number,
      default: null
    },
    moduleWeights: {
      handwriting: { type: Number, default: 0.25 },
      reading: { type: Number, default: 0.25 },
      keystroke: { type: Number, default: 0.25 },
      memory: { type: Number, default: 0.25 }
    },
    moduleScores: {
      handwriting: { type: Number, default: null },
      reading: { type: Number, default: null },
      keystroke: { type: Number, default: null },
      memory: { type: Number, default: null }
    },
    combinedRecommendations: [String],
    analysisNotes: String
  },

  // Therapy recommendations
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
  completedAt: Date,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

assessmentSchema.methods.calculateOverallRisk = function() {
  const weights = this.fusionAnalysis?.moduleWeights || {
    handwriting: 0.25,
    reading: 0.25,
    keystroke: 0.25,
    memory: 0.25
  };

  let weightedSum = 0;
  let totalWeight = 0;
  const moduleScores = {};

  // Handwriting — use overallScore (0-100)
  const hwScore = this.handwritingResult?.analysisResults?.overallScore;
  if (hwScore != null) {
    moduleScores.handwriting = hwScore;
    weightedSum += hwScore * weights.handwriting;
    totalWeight += weights.handwriting;
  }

  // Reading — riskScore is 0-100
  const rdScore = this.readingResult?.riskScore;
  if (rdScore != null) {
    moduleScores.reading = rdScore;
    weightedSum += rdScore * weights.reading;
    totalWeight += weights.reading;
  }

  // Keystroke — riskScore is 0-100
  const ksScore = this.keystrokeResult?.riskScore;
  if (ksScore != null) {
    moduleScores.keystroke = ksScore;
    weightedSum += ksScore * weights.keystroke;
    totalWeight += weights.keystroke;
  }

  // Memory — riskScore is 0-100
  const memScore = this.memoryResult?.riskScore;
  if (memScore != null) {
    moduleScores.memory = memScore;
    weightedSum += memScore * weights.memory;
    totalWeight += weights.memory;
  }

  if (totalWeight === 0) return null;

  const finalScore = Math.round(weightedSum / totalWeight);
  this.overallRiskScore = finalScore;

  if (!this.fusionAnalysis) this.fusionAnalysis = {};
  this.fusionAnalysis.moduleScores = moduleScores;

  if (finalScore >= 67) this.riskLevel = 'high';
  else if (finalScore >= 34) this.riskLevel = 'moderate';
  else this.riskLevel = 'low';

  const completedModules = Object.keys(moduleScores).length;
  this.fusionAnalysis.confidenceScore =
    Math.round((completedModules / 4) * 100);

  return finalScore;
};

assessmentSchema.methods.isComplete = function() {
  return !!(
    this.handwritingResult &&
    this.readingResult &&
    this.keystrokeResult &&
    this.memoryResult
  );
};

assessmentSchema.methods.getCompletedModules = function() {
  const completed = [];
  if (this.handwritingResult) completed.push('handwriting');
  if (this.readingResult) completed.push('reading');
  if (this.keystrokeResult) completed.push('keystroke');
  if (this.memoryResult) completed.push('memory');
  return completed;
};

assessmentSchema.methods.getNextStep = function() {
  const order = ['handwriting', 'reading', 'keystroke', 'memory'];
  for (const step of order) {
    if (!this[`${step}Result`]) return step;
  }
  return 'completed';
};

assessmentSchema.pre('save', function(next) {
  this.lastUpdated = new Date();

  if (this.isComplete() && this.status === 'in_progress') {
    this.status = 'completed';
    this.currentStep = 'completed';
    this.completedAt = new Date();
  }

  next();
});

assessmentSchema.index({ user: 1, createdAt: -1 });
assessmentSchema.index({ status: 1 });
assessmentSchema.index(
  { user: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'in_progress' },
    name: 'unique_user_in_progress'
  }
);

module.exports = mongoose.model('Assessment', assessmentSchema);
