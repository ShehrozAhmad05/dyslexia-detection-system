const mongoose = require('mongoose');
const { mean, standardDeviation, coefficientOfVariation, calculateAccuracy } = require('../utils/statistics');
const { calculateKeystrokeRisk } = require('../utils/keystrokeScoring');

const PAUSE_THRESHOLD_MS = 2000;

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
  pauseDuration: Number,

  riskScore: { type: Number, min: 0, max: 100 },
  riskLevel: { type: String, enum: ['LOW', 'MODERATE', 'HIGH'] },
  riskBreakdown: {
    holdTimeRisk: Number,
    flightTimeRisk: Number,
    backspaceRisk: Number,
    pauseRisk: Number,
    speedRisk: Number,
    errorRateRisk: Number
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
  const rows = this.keystrokes || [];

  // Keep hold-time bounds aligned with training extraction logic.
  const holdTimes = rows
    .map(k => Number(k.holdTime))
    .filter(v => Number.isFinite(v) && v > 0 && v < 5000);

  const allFlightTimes = rows
    .map(k => Number(k.flightTime))
    .filter(v => Number.isFinite(v));

  // Motor rhythm only for avg/cv flight metrics: exclude rollover negatives and long pauses.
  const motorFlightTimes = allFlightTimes
    .filter(v => v >= 0 && v <= PAUSE_THRESHOLD_MS);

  this.avgHoldTime = mean(holdTimes);
  this.stdHoldTime = standardDeviation(holdTimes);
  this.cvHoldTime = coefficientOfVariation(holdTimes);

  this.avgFlightTime = mean(motorFlightTimes);
  this.stdFlightTime = standardDeviation(motorFlightTimes);
  this.cvFlightTime = coefficientOfVariation(motorFlightTimes);

  const durationMs = this.endTime && this.startTime ? (new Date(this.endTime) - new Date(this.startTime)) : this.duration;
  const minutes = durationMs > 0 ? durationMs / 60000 : 0;
  // Use prompt word count to match training definition based on target sentence length.
  const wordCount = this.prompt
    ? this.prompt.trim().split(/\s+/).filter(Boolean).length
    : (this.typedText ? this.typedText.trim().split(/\s+/).filter(Boolean).length : 0);
  this.wpm = minutes > 0 ? wordCount / minutes : 0;

  this.accuracy = calculateAccuracy(this.prompt, this.typedText);
  this.errorRate = 100 - this.accuracy;

  this.backspaceCount = rows.filter(k => ['Backspace', 'BKSP', 'Delete', 'DEL'].includes(k.key)).length;
  this.backspaceRate = rows.length > 0 ? this.backspaceCount / rows.length : 0;

  const pauseDurations = allFlightTimes.filter(ft => ft > PAUSE_THRESHOLD_MS);
  this.pauseCount = pauseDurations.length;
  this.pauseFrequency = wordCount > 0 ? this.pauseCount / wordCount : 0;
  this.pauseDuration = pauseDurations.length > 0 ? mean(pauseDurations) : 0;

  this.duration = durationMs;
};

keystrokeSchema.methods.calculateRiskScore = function calculateRiskScore(mlAnomalyScore = 0) {
  const { riskScore, riskLevel, breakdown } = calculateKeystrokeRisk({
    avgFlightTime: this.avgFlightTime,
    cvHoldTime: this.cvHoldTime,
    cvFlightTime: this.cvFlightTime,
    backspaceRate: this.backspaceRate,
    pauseFrequency: this.pauseFrequency,
    wpm: this.wpm,
    errorRate: this.errorRate
  }, mlAnomalyScore);

  this.riskScore = riskScore;
  this.riskLevel = riskLevel;
  this.riskBreakdown = breakdown;
};

module.exports = mongoose.model('KeystrokeResult', keystrokeSchema);
