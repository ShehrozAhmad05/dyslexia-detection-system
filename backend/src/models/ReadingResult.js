const mongoose = require('mongoose');

const readingResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  passageId: {
    type: String,
    required: true
  },
  passageTotalWords: {
    type: Number,
    required: true
  },
  passageTotalSegments: {
    type: Number,
    required: true
  },
  
  // Timing metrics
  totalReadingTime: {
    type: Number,
    required: true,
    description: 'Total reading time in milliseconds'
  },
  segmentTimes: [{
    type: Number,
    description: 'Time spent on each segment in milliseconds'
  }],
  averageTimePerSegment: {
    type: Number
  },
  timeToAnswerQuestions: {
    type: Number,
    description: 'Time spent answering comprehension questions in milliseconds'
  },
  
  // Navigation/Revisit metrics
  totalRevisits: {
    type: Number,
    default: 0
  },
  revisitDetails: [{
    segmentIndex: Number,
    timestamp: Number,
    duration: Number
  }],
  reviewedTextAfterQuestions: {
    type: Boolean,
    default: false
  },
  
  // Pause/Hesitation metrics
  pauseCount: {
    type: Number,
    default: 0
  },
  pauseDurations: [{
    type: Number,
    description: 'Individual pause durations in milliseconds'
  }],
  averagePauseDuration: {
    type: Number
  },
  longestPause: {
    type: Number
  },
  
  // Comprehension metrics
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true
  },
  comprehensionScore: {
    type: Number,
    required: true,
    description: 'Percentage score (0-100)'
  },
  incorrectQuestions: [{
    type: Number
  }],
  answers: [{
    questionId: Number,
    answer: String,
    correct: Boolean,
    timeSpent: Number
  }],
  
  // Derived metrics (calculated)
  wordsPerMinute: {
    type: Number
  },
  revisitRate: {
    type: Number,
    description: 'Percentage of segments revisited'
  },
  pauseFrequency: {
    type: Number,
    description: 'Pauses per minute of reading'
  },
  comprehensionEfficiency: {
    type: Number,
    description: 'Score adjusted for time spent'
  },
  
  // Risk assessment
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    description: 'Overall reading difficulty risk score (0-100)'
  },
  featureScores: {
    wpmScore: Number,
    revisitScore: Number,
    comprehensionScore: Number,
    pauseScore: Number,
    timeScore: Number
  },
  recommendations: [{
    type: String
  }],
  
  status: {
    type: String,
    enum: ['completed', 'incomplete'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Virtual for risk level
readingResultSchema.virtual('riskLevel').get(function() {
  if (!this.riskScore) return 'Unknown';
  if (this.riskScore < 30) return 'Low';
  if (this.riskScore < 60) return 'Moderate';
  return 'High';
});

// Calculate derived metrics before saving
readingResultSchema.pre('save', function(next) {
  // Calculate average time per segment
  if (this.segmentTimes && this.segmentTimes.length > 0) {
    this.averageTimePerSegment = Math.round(
      this.segmentTimes.reduce((a, b) => a + b, 0) / this.segmentTimes.length
    );
  }
  
  // Calculate average pause duration
  if (this.pauseDurations && this.pauseDurations.length > 0) {
    this.averagePauseDuration = Math.round(
      this.pauseDurations.reduce((a, b) => a + b, 0) / this.pauseDurations.length
    );
    this.longestPause = Math.max(...this.pauseDurations);
  }
  
  // Calculate words per minute
  if (this.totalReadingTime > 0 && this.passageTotalWords > 0) {
    const minutes = this.totalReadingTime / 60000;
    this.wordsPerMinute = Math.round(this.passageTotalWords / minutes);
  }
  
  // Calculate revisit rate
  if (this.passageTotalSegments > 0) {
    const uniqueRevisitedSegments = new Set(
      this.revisitDetails.map(r => r.segmentIndex)
    ).size;
    this.revisitRate = Math.round((uniqueRevisitedSegments / this.passageTotalSegments) * 100);
  }
  
  // Calculate pause frequency (pauses per minute)
  if (this.totalReadingTime > 0) {
    const minutes = this.totalReadingTime / 60000;
    this.pauseFrequency = parseFloat((this.pauseCount / minutes).toFixed(2));
  }
  
  // Calculate comprehension efficiency (score per minute)
  if (this.totalReadingTime > 0) {
    const totalMinutes = (this.totalReadingTime + this.timeToAnswerQuestions) / 60000;
    this.comprehensionEfficiency = parseFloat((this.comprehensionScore / totalMinutes).toFixed(2));
  }
  
  next();
});

// Method to calculate risk score
readingResultSchema.methods.calculateRiskScore = function() {
  const scores = {
    wpm: 0,
    revisit: 0,
    comprehension: 0,
    pause: 0,
    time: 0
  };
  
  // WPM Score (20% weight) - Lower is riskier
  if (this.wordsPerMinute < 150) {
    scores.wpm = 100;
  } else if (this.wordsPerMinute < 180) {
    scores.wpm = 70;
  } else if (this.wordsPerMinute < 200) {
    scores.wpm = 40;
  } else {
    scores.wpm = 0;
  }
  
  // Revisit Score (15% weight) - More revisits = riskier
  if (this.totalRevisits > 4) {
    scores.revisit = 100;
  } else if (this.totalRevisits > 2) {
    scores.revisit = 60;
  } else if (this.totalRevisits > 0) {
    scores.revisit = 30;
  } else {
    scores.revisit = 0;
  }
  
  // Comprehension Score (25% weight) - Lower is riskier
  if (this.comprehensionScore < 60) {
    scores.comprehension = 100;
  } else if (this.comprehensionScore < 70) {
    scores.comprehension = 70;
  } else if (this.comprehensionScore < 80) {
    scores.comprehension = 40;
  } else {
    scores.comprehension = 0;
  }
  
  // Pause Score (15% weight) - More/longer pauses = riskier
  if (this.pauseCount > 8 || this.averagePauseDuration > 6000) {
    scores.pause = 100;
  } else if (this.pauseCount > 5 || this.averagePauseDuration > 4500) {
    scores.pause = 60;
  } else if (this.pauseCount > 3 || this.averagePauseDuration > 3500) {
    scores.pause = 30;
  } else {
    scores.pause = 0;
  }
  
  // Time per Segment Score (15% weight) - Slower = riskier
  if (this.averageTimePerSegment > 45000) {
    scores.time = 100;
  } else if (this.averageTimePerSegment > 35000) {
    scores.time = 60;
  } else if (this.averageTimePerSegment > 25000) {
    scores.time = 30;
  } else {
    scores.time = 0;
  }
  
  // Weighted calculation
  this.featureScores = {
    wpmScore: scores.wpm,
    revisitScore: scores.revisit,
    comprehensionScore: scores.comprehension,
    pauseScore: scores.pause,
    timeScore: scores.time
  };
  
  this.riskScore = Math.round(
    scores.wpm * 0.20 +
    scores.revisit * 0.15 +
    scores.comprehension * 0.25 +
    scores.pause * 0.15 +
    scores.time * 0.15
  );
  
  return this.riskScore;
};

// Method to generate recommendations
readingResultSchema.methods.generateRecommendations = function() {
  const recommendations = [];
  
  if (this.wordsPerMinute < 150) {
    recommendations.push('Reading speed is below average. Consider reading fluency exercises.');
  }
  
  if (this.totalRevisits > 4) {
    recommendations.push('Frequent re-reading detected. This may indicate difficulty with text comprehension or working memory.');
  }
  
  if (this.comprehensionScore < 60) {
    recommendations.push('Comprehension score is low. Focus on reading comprehension strategies and vocabulary building.');
  }
  
  if (this.pauseCount > 6 || this.averagePauseDuration > 4000) {
    recommendations.push('Frequent or long pauses detected. This may indicate word decoding difficulties.');
  }
  
  if (this.averageTimePerSegment > 45000) {
    recommendations.push('Extended time per section suggests possible processing difficulties.');
  }
  
  if (this.riskScore >= 60) {
    recommendations.push('Multiple reading difficulty indicators present. Consider professional assessment for dyslexia.');
  } else if (this.riskScore >= 30) {
    recommendations.push('Some reading challenges detected. Targeted reading practice may be beneficial.');
  } else {
    recommendations.push('Reading performance is within typical range.');
  }
  
  this.recommendations = recommendations;
  return recommendations;
};

// Ensure virtuals are included in JSON
readingResultSchema.set('toJSON', { virtuals: true });
readingResultSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ReadingResult', readingResultSchema);
