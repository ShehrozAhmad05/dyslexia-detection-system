const mongoose = require('mongoose');

const readingPassageSchema = new mongoose.Schema({
  passageId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  ageGroup: {
    type: String,
    enum: ['7-9', '10-12', '13-15', '16+'],
    default: '10-12'
  },
  totalWords: {
    type: Number,
    required: true
  },
  segments: [{
    segmentIndex: {
      type: Number,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    wordCount: {
      type: Number,
      required: true
    }
  }],
  questions: [{
    questionId: {
      type: Number,
      required: true
    },
    question: {
      type: String,
      required: true
    },
    options: [{
      type: String
    }],
    correctAnswer: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'short-answer'],
      default: 'multiple-choice'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes
readingPassageSchema.index({ passageId: 1 });
readingPassageSchema.index({ difficulty: 1, ageGroup: 1 });

module.exports = mongoose.model('ReadingPassage', readingPassageSchema);
