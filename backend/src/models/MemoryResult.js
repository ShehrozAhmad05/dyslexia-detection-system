const mongoose = require('mongoose');

// =====================================================
// MEMORY RESULT SCHEMA
// Stores memory test results for both sequence and word tasks
// =====================================================

const memoryResultSchema = new mongoose.Schema({
  // User who took the test
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true  // Makes searching by user faster
  },
  
  // Type of test: 'sequence' or 'word'
  testType: {
    type: String,
    enum: ['sequence', 'word'],  // Only allow these two values
    required: true
  },
  
  // =====================================================
  // TASK DATA - Raw data from the test
  // =====================================================
  taskData: {
    // For Sequence Task (e.g., remember "A-5-D-2")
    sequences: [{
      sequence: String,          // What was shown: "A-5-D"
      userInput: String,         // What user typed: "A-5-D"
      correct: Boolean,          // Did they get it right?
      length: Number,            // How many items: 3
      timeShown: Number,         // How long displayed (milliseconds)
      responseTime: Number       // How long to answer (milliseconds)
    }],
    
    // For Word Task (e.g., remember word list)
    words: {
      shown: [String],           // Words that were displayed
      recalled: [String],        // Words user remembered
      correct: [String],         // Correctly recalled words
      incorrect: [String],       // False memories (wrong words)
      displayDuration: Number,   // Study time (milliseconds)
      recallTime: Number         // Time to recall (milliseconds)
    }
  },
  
  // =====================================================
  // CALCULATED METRICS - Auto-calculated by model
  // =====================================================
  metrics: {
    totalAttempts: { type: Number, default: 0 },     // Total sequences/trials
    correctCount: { type: Number, default: 0 },      // Number correct
    accuracy: { type: Number, min: 0, max: 100 },    // Percentage correct
    maxSequenceLength: Number,                        // Longest sequence recalled
    avgResponseTime: Number,                          // Average time per response
    errorRate: { type: Number, min: 0, max: 100 },  // Percentage errors
    consistencyScore: Number                          // How consistent (0-100)
  },
  
  // =====================================================
  // RISK ASSESSMENT - The final score
  // =====================================================
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  
  riskLevel: {
    type: String,
    enum: ['LOW', 'MODERATE', 'HIGH'],
    required: true
  },
  
  // Breakdown of risk by component
  riskBreakdown: {
    accuracyRisk: { type: Number, min: 0, max: 100 },
    capacityRisk: { type: Number, min: 0, max: 100 },
    speedRisk: { type: Number, min: 0, max: 100 },
    consistencyRisk: { type: Number, min: 0, max: 100 }
  },
  
  // Personalized recommendations
  recommendations: [String]
  
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt
});


// =====================================================
// METHOD 1: CALCULATE METRICS
// Analyzes task performance and calculates statistics
// =====================================================

memoryResultSchema.methods.calculateMetrics = function() {
  if (this.testType === 'sequence') {
    this._calculateSequenceMetrics();
  } else if (this.testType === 'word') {
    this._calculateWordMetrics();
  }
};

// Calculate metrics for sequence task
memoryResultSchema.methods._calculateSequenceMetrics = function() {
  const sequences = this.taskData.sequences;
  
  // 1. Total attempts (how many sequences they tried)
  this.metrics.totalAttempts = sequences.length;
  
  // 2. Count correct answers
  this.metrics.correctCount = sequences.filter(s => s.correct).length;
  
  // 3. Calculate accuracy percentage
  this.metrics.accuracy = (this.metrics.correctCount / this.metrics.totalAttempts) * 100;
  
  // 4. Calculate error rate (opposite of accuracy)
  this.metrics.errorRate = 100 - this.metrics.accuracy;
  
  // 5. Find maximum sequence length they got correct
  const correctSequences = sequences.filter(s => s.correct);
  this.metrics.maxSequenceLength = correctSequences.length > 0
    ? Math.max(...correctSequences.map(s => s.length))
    : 0;
  
  // 6. Calculate average response time
  const responseTimes = sequences.map(s => s.responseTime);
  this.metrics.avgResponseTime = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
  
  // 7. Calculate consistency score (lower variation = more consistent)
  const stdDev = this._calculateStdDev(responseTimes);
  const cv = (stdDev / this.metrics.avgResponseTime) * 100;  // Coefficient of Variation
  this.metrics.consistencyScore = Math.max(0, 100 - cv); // Invert so higher = better
};

// Calculate metrics for word task
memoryResultSchema.methods._calculateWordMetrics = function() {
  const words = this.taskData.words;
  
  // 1. Total attempts (words shown)
  this.metrics.totalAttempts = words.shown.length;
  
  // 2. Correct count (words correctly recalled)
  this.metrics.correctCount = words.correct.length;
  
  // 3. Calculate accuracy percentage
  this.metrics.accuracy = (this.metrics.correctCount / this.metrics.totalAttempts) * 100;
  
  // 4. Calculate error rate
  this.metrics.errorRate = 100 - this.metrics.accuracy;
  
  // 5. Max sequence length (for word task, this is total correct)
  this.metrics.maxSequenceLength = words.correct.length;
  
  // 6. Average response time (total recall time / number of words shown)
  // This represents average time spent per word during recall phase
  this.metrics.avgResponseTime = words.recallTime / Math.max(words.shown.length, 1);
  
  // 7. Consistency (not applicable for word task, set default)
  this.metrics.consistencyScore = 80;
};

// Helper function: Calculate standard deviation
memoryResultSchema.methods._calculateStdDev = function(values) {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;
  return Math.sqrt(variance);
};


// =====================================================
// METHOD 2: CALCULATE RISK SCORE
// Converts metrics into 0-100 risk score
// =====================================================

memoryResultSchema.methods.calculateRiskScore = function() {
  const { accuracy, maxSequenceLength, avgResponseTime, consistencyScore } = this.metrics;
  
  // Calculate each component (0-100, higher = more risk)
  this.riskBreakdown.accuracyRisk = this._scoreAccuracyRisk(accuracy);
  this.riskBreakdown.capacityRisk = this._scoreCapacityRisk(maxSequenceLength);
  this.riskBreakdown.speedRisk = this._scoreSpeedRisk(avgResponseTime);
  this.riskBreakdown.consistencyRisk = this._scoreConsistencyRisk(consistencyScore);
  
  // Weighted sum (accuracy is most important at 40%)
  this.riskScore = Math.round(
    this.riskBreakdown.accuracyRisk * 0.40 +      // 40% weight
    this.riskBreakdown.capacityRisk * 0.30 +      // 30% weight
    this.riskBreakdown.speedRisk * 0.20 +         // 20% weight
    this.riskBreakdown.consistencyRisk * 0.10     // 10% weight
  );
  
  // Determine risk level based on final score
  if (this.riskScore >= 70) {
    this.riskLevel = 'HIGH';
  } else if (this.riskScore >= 40) {
    this.riskLevel = 'MODERATE';
  } else {
    this.riskLevel = 'LOW';
  }
};

// Scoring functions - convert metrics to 0-100 risk scale
// Higher score = higher risk
// UPDATED: Age-appropriate thresholds for 12-15 year olds

memoryResultSchema.methods._scoreAccuracyRisk = function(accuracy) {
  // Research-validated for ages 12-15
  if (accuracy >= 80) return 10;   // Excellent (>= 80%)
  if (accuracy >= 65) return 30;   // Good (65-79%)
  if (accuracy >= 45) return 60;   // Concerning (45-64%)
  return 90;                       // Poor (< 45%)
};

memoryResultSchema.methods._scoreCapacityRisk = function(maxLength) {
  // Ages 12-15: typical = 6-8 items, dyslexic = 3-5 items
  if (maxLength >= 7) return 10;   // Excellent (7+ items)
  if (maxLength >= 5) return 30;   // Good (5-6 items)
  if (maxLength >= 3) return 60;   // Concerning (3-4 items)
  return 90;                       // Poor (2 or less)
};

memoryResultSchema.methods._scoreSpeedRisk = function(avgTime) {
  // Ages 12-15: adjusted for faster processing than adults
  if (avgTime <= 3500) return 10;  // Fast (≤ 3.5 seconds)
  if (avgTime <= 5500) return 30;  // Normal (3.5-5.5 seconds)
  if (avgTime <= 8000) return 60;  // Slow (5.5-8 seconds)
  return 90;                       // Very slow (> 8 seconds)
};

memoryResultSchema.methods._scoreConsistencyRisk = function(consistencyScore) {
  // consistencyScore is 0-100 (higher = better consistency)
  // Convert to risk: higher consistency = lower risk
  // Ages 12-15: more variable than adults, adjusted thresholds
  if (consistencyScore >= 80) return 10;   // Excellent consistency
  if (consistencyScore >= 65) return 30;   // Good consistency
  if (consistencyScore >= 40) return 60;   // Concerning (ADHD/attention issues)
  return 90;                               // Poor (highly variable)
};


// =====================================================
// METHOD 3: GENERATE RECOMMENDATIONS
// Creates personalized advice based on ACTUAL PERFORMANCE ISSUES
// Tracks specific game activities and provides targeted advice
// =====================================================

memoryResultSchema.methods.generateRecommendations = function() {
  const recommendations = [];
  const { accuracy, maxSequenceLength, avgResponseTime, consistencyScore, correctCount, totalAttempts } = this.metrics;
  
  // Track specific issues for more targeted recommendations
  // UPDATED: Age-appropriate thresholds for ages 12-15
  const issues = {
    lowAccuracy: accuracy < 65,
    veryLowAccuracy: accuracy < 45,
    lowCapacity: maxSequenceLength < 5,
    veryLowCapacity: maxSequenceLength < 3,
    slowSpeed: avgResponseTime > 5500,
    verySlowSpeed: avgResponseTime > 8000,
    inconsistent: consistencyScore < 65,
    veryInconsistent: consistencyScore < 40
  };
  
  // Calculate error patterns for sequence tasks
  if (this.testType === 'sequence') {
    const sequences = this.taskData.sequences;
    const longerSequenceErrors = sequences.filter(s => !s.correct && s.length >= 4).length;
    const shorterSequenceErrors = sequences.filter(s => !s.correct && s.length <= 3).length;
    
    // ISSUE 1: Accuracy problems with specific patterns
    if (issues.veryLowAccuracy) {
      recommendations.push('🎯 You\'re having trouble remembering sequences. Start with just 2-3 items and practice daily.');
      recommendations.push('📝 Try the chunking method: Break "A-B-C-1-2-3" into "ABC" and "123" groups.');
      
      if (shorterSequenceErrors > longerSequenceErrors) {
        recommendations.push('⚠️ Even short sequences are challenging. Use visual aids: draw or write items as you see them.');
      }
    } else if (issues.lowAccuracy) {
      recommendations.push('🎯 Your recall needs improvement. Practice the "repeat aloud" technique while memorizing.');
      
      if (longerSequenceErrors > shorterSequenceErrors) {
        recommendations.push('📊 Longer sequences are your weak point. Build up gradually from 3 to 4 to 5 items.');
      }
    }
    
    // ISSUE 2: Memory capacity problems
    if (issues.veryLowCapacity) {
      recommendations.push('🧠 Your memory span is limited to ' + maxSequenceLength + ' items. Work on expanding this through daily practice.');
      recommendations.push('🎵 Use the "rhythm method": turn sequences into a beat or song pattern.');
    } else if (issues.lowCapacity) {
      recommendations.push('💪 Your current memory span is ' + maxSequenceLength + ' items. Aim to reach 5-6 items consistently.');
    }
    
    // ISSUE 3: Speed problems
    if (issues.verySlowSpeed) {
      const avgSeconds = (avgResponseTime / 1000).toFixed(1);
      recommendations.push('⏱️ You\'re taking ' + avgSeconds + ' seconds on average to recall. This suggests processing difficulties.');
      recommendations.push('🧘 Practice relaxation before tests - anxiety can slow recall significantly.');
    } else if (issues.slowSpeed) {
      recommendations.push('⚡ Your response time can be improved. Try the "instant snapshot" technique: capture the whole sequence as one image.');
    }
    
    // ISSUE 4: Consistency problems
    if (issues.veryInconsistent) {
      recommendations.push('📊 Your performance varies significantly between attempts (consistency: ' + consistencyScore.toFixed(0) + '%).');
      recommendations.push('😴 Check if you\'re getting enough sleep and practicing at consistent times of day.');
      recommendations.push('📵 Eliminate distractions during practice - find a quiet environment.');
    } else if (issues.inconsistent) {
      recommendations.push('🎯 Your performance fluctuates. Develop a consistent routine for memorization.');
    }
  }
  
  // Calculate error patterns for word tasks
  else if (this.testType === 'word') {
    const words = this.taskData.words;
    const incorrectSelections = words.incorrect.length;  // Words selected but wrong
    const missedWords = words.shown.length - words.correct.length;  // Words not recalled
    
    // ISSUE 1: Accuracy problems with specific patterns
    if (issues.veryLowAccuracy) {
      recommendations.push('📚 You recalled only ' + correctCount + ' out of ' + totalAttempts + ' words correctly.');
      
      if (incorrectSelections > missedWords) {
        recommendations.push('⚠️ You\'re selecting many wrong words (' + incorrectSelections + ' incorrect). You may be guessing too much.');
        recommendations.push('🎯 Focus on ONLY selecting words you\'re absolutely sure about.');
      } else {
        recommendations.push('💭 You\'re missing many words (' + missedWords + ' missed). You may not be encoding them properly.');
        recommendations.push('🖼️ Create a mental image or story connecting all the words together.');
      }
    } else if (issues.lowAccuracy) {
      recommendations.push('📖 Your word recall needs work. You got ' + correctCount + '/' + totalAttempts + ' correct.');
      
      if (incorrectSelections >= 2) {
        recommendations.push('🚫 You selected ' + incorrectSelections + ' wrong words. Take more time to be sure before selecting.');
      }
      if (missedWords >= 2) {
        recommendations.push('🔍 You missed ' + missedWords + ' words. Try grouping words by category (animals, colors, actions).');
      }
    }
    
    // ISSUE 2: Memory capacity problems for words
    if (issues.veryLowCapacity) {
      recommendations.push('📝 You can only recall ' + maxSequenceLength + ' words reliably. Start practicing with smaller word lists.');
      recommendations.push('🔗 Use the "story method": connect words into a silly sentence to remember them.');
    } else if (issues.lowCapacity) {
      recommendations.push('📚 Build your word memory capacity through reading and recalling key words from stories.');
    }
    
    // ISSUE 3: Selection strategy problems
    if (incorrectSelections > correctCount) {
      recommendations.push('❌ You\'re selecting more wrong words than correct ones. This indicates guessing rather than true recall.');
      recommendations.push('✋ STOP and think before clicking - only select words you clearly remember seeing.');
    }
  }
  
  // ISSUE 5: High overall risk requires intervention
  if (this.riskLevel === 'HIGH') {
    recommendations.push('🏥 Your overall risk score is HIGH (' + this.riskScore + '/100). Consider consulting an educational specialist.');
    recommendations.push('📱 Use assistive tools: Set phone reminders, use note-taking apps, try voice recording.');
  } else if (this.riskLevel === 'MODERATE') {
    recommendations.push('⚠️ Your risk score is MODERATE (' + this.riskScore + '/100). Regular practice can improve this.');
  }
  
  // Add general wellness tips ONLY if there are issues
  if (recommendations.length > 0) {
    recommendations.push('💤 Ensure 8-10 hours of sleep - sleep consolidates memories.');
    recommendations.push('🏃 Daily exercise improves brain function and memory.');
  }
  
  // If NO issues, provide minimal maintenance advice
  if (recommendations.length === 0) {
    recommendations.push('✅ No significant issues detected. Continue practicing to maintain your skills.');
  }
  
  this.recommendations = recommendations;
};


// Export the model
module.exports = mongoose.model('MemoryResult', memoryResultSchema);
