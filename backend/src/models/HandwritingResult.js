const mongoose = require('mongoose');

const handwritingResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imagePath: {
    type: String,
    required: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  expectedSentence: {
    type: String,
    default: null
  },
  detectedSentence: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'analyzing', 'completed', 'failed'],
    default: 'pending'
  },
  analysisResults: {
    riskScore: {
      type: Number,
      min: 0,
      max: 1,
      default: null
    },
    detectedIssues: [{
      type: {
        type: String,
        enum: ['letter_reversal', 'irregular_spacing', 'inconsistent_size', 
               'poor_alignment', 'letter_formation', 'pressure_variation']
      },
      count: Number,
      severity: {
        type: String,
        enum: ['low', 'moderate', 'high']
      },
      examples: [String]
    }],
    recommendations: [String],
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    processingTime: Number, // milliseconds
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    reversalCount: {
      type: Number,
      default: null
    },
    substitutionCount: {
      type: Number,
      default: null
    },
    multiErrorCount: {
      type: Number,
      default: null
    },
    correctCount: {
      type: Number,
      default: null
    },
    reversalRate: {
      type: Number,
      default: null
    },
    errorRate: {
      type: Number,
      default: null
    },
    wordResults: [{
      position: Number,
      expectedWord: String,
      writtenWord: String,
      errorType: String,
      detail: String
    }],
    overrideApplied: {
      type: Boolean,
      default: false
    },
    unableToAssess: {
      type: Boolean,
      default: false
    },
    featureScores: {
      reversalScore: Number,
      errorScore: Number
    }
  },
  mlModelVersion: {
    type: String,
    default: 'google-vision-v1.0'
  },
  analyzedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
handwritingResultSchema.index({ user: 1, createdAt: -1 });
handwritingResultSchema.index({ status: 1 });

// Virtual for risk level
handwritingResultSchema.virtual('riskLevel').get(function() {
  // Use overallScore (0-100) if available
  if (this.analysisResults?.overallScore !== null &&
      this.analysisResults?.overallScore !== undefined) {
    const score = this.analysisResults.overallScore;
    if (score >= 67) return 'high';
    if (score >= 34) return 'moderate';
    return 'low';
  }
  // Fall back to riskScore (0-1) for backward compatibility
  if (!this.analysisResults?.riskScore) return 'unknown';
  if (this.analysisResults.riskScore >= 0.7) return 'high';
  if (this.analysisResults.riskScore >= 0.4) return 'moderate';
  return 'low';
});

// Ensure virtuals are included in JSON
handwritingResultSchema.set('toJSON', { virtuals: true });
handwritingResultSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('HandwritingResult', handwritingResultSchema);
