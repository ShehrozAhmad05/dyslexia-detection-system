const mongoose = require('mongoose');
const { mean, standardDeviation, coefficientOfVariation, calculateAccuracy } = require('../utils/statistics');
const { calculateKeystrokeRisk } = require('../utils/keystrokeScoring');

const keystrokeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testType: { type: String, enum: ['typing', 'password'], default: 'typing' },
  prompt: { type: String, required: true },
  typedText: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number, description: 'Total test duration in milliseconds' },

  keystrokes: [{
    key: String,
    keyDownTime: Number,
    keyUpTime: Number,
    holdTime: Number,
    previousKey: String,
    flightTime: Number
  }],

  avgHoldTime: Number,
  stdHoldTime: Number,
  cvHoldTime: Number,
  avgFlightTime: Number,
  stdFlightTime: Number,
  cvFlightTime: Number,
  wpm: Number,
  accuracy: Number,
  errorRate: Number,
  backspaceCount: Number,
  backspaceRate: Number,
  pauseCount: Number,
  pauseFrequency: Number,

  riskScore: { type: Number, min: 0, max: 100 },
  riskLevel: { type: String, enum: ['LOW', 'MODERATE', 'HIGH'] },
  riskBreakdown: {
    holdTimeRisk: Number,
    flightTimeRisk: Number,
    backspaceRisk: Number,
    pauseRisk: Number,
    speedRisk: Number
  },

  anomalyScore: Number,
  isAnomalous: Boolean,

  features: {
    holdTimeStats: Object,
    flightTimeStats: Object,
    digraphAnalysis: Object,
    errorPatterns: Object,
    keySpecificTiming: Object
  },

  metadata: {
    type: Object,
    default: null
  }
}, { timestamps: true });

keystrokeSchema.methods.calculateMetrics = function calculateMetrics() {
  const holdTimes = (this.keystrokes || []).map(k => k.holdTime || 0).filter(v => v > 0);
  const flightTimes = (this.keystrokes || []).map(k => k.flightTime || 0).filter(v => v > 0);

  this.avgHoldTime = mean(holdTimes);
  this.stdHoldTime = standardDeviation(holdTimes);
  this.cvHoldTime = coefficientOfVariation(holdTimes);

  this.avgFlightTime = mean(flightTimes);
  this.stdFlightTime = standardDeviation(flightTimes);
  this.cvFlightTime = coefficientOfVariation(flightTimes);

  const durationMs = this.endTime && this.startTime ? (new Date(this.endTime) - new Date(this.startTime)) : this.duration;
  const minutes = durationMs > 0 ? durationMs / 60000 : 0;
  const wordCount = this.typedText ? this.typedText.trim().split(/\s+/).filter(Boolean).length : 0;
  this.wpm = minutes > 0 ? wordCount / minutes : 0;

  this.accuracy = calculateAccuracy(this.prompt, this.typedText);
  this.errorRate = 100 - this.accuracy;

  this.backspaceCount = (this.keystrokes || []).filter(k => k.key === 'Backspace').length;
  this.backspaceRate = this.typedText && this.typedText.length > 0
    ? (this.backspaceCount / this.typedText.length) * 100
    : 0;

  this.pauseCount = flightTimes.filter(ft => ft > 1000).length;
  this.pauseFrequency = this.typedText && this.typedText.length > 0
    ? (this.pauseCount / this.typedText.length) * 100
    : 0;

  this.duration = durationMs;
};

keystrokeSchema.methods.calculateRiskScore = function calculateRiskScore(mlAnomalyScore = 0) {
  const { riskScore, riskLevel, breakdown } = calculateKeystrokeRisk({
    cvHoldTime: this.cvHoldTime,
    cvFlightTime: this.cvFlightTime,
    backspaceRate: this.backspaceRate,
    pauseFrequency: this.pauseFrequency,
    wpm: this.wpm
  }, mlAnomalyScore);

  this.riskScore = riskScore;
  this.riskLevel = riskLevel;
  this.riskBreakdown = breakdown;
};

module.exports = mongoose.model('KeystrokeResult', keystrokeSchema);
