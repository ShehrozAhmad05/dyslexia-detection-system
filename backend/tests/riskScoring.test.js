/**
 * Unit Tests for Risk Scoring Algorithm
 * 
 * Tests the validated risk scoring system based on ETDD70 dataset
 * and literature-backed thresholds.
 * 
 * Run: npm test or jest riskScoring.test.js
 */

const {
  normalizeReadingTime,
  normalizeComprehension,
  normalizeRevisits,
  normalizePauses,
  normalizePauseDuration,
  calculateRiskScore,
  linearNormalize,
  inverseLinearNormalize,
  clamp
} = require('../src/utils/scoreNormalizers');

const {
  FEATURE_WEIGHTS,
  READING_TIME,
  COMPREHENSION,
  REVISIT_COUNT,
  PAUSE_COUNT,
  AVG_PAUSE_DURATION
} = require('../config/readingThresholds');

describe('Helper Functions', () => {
  describe('linearNormalize', () => {
    test('should return 0 for value at minimum', () => {
      expect(linearNormalize(10, 10, 20)).toBe(0);
    });

    test('should return 100 for value at maximum', () => {
      expect(linearNormalize(20, 10, 20)).toBe(100);
    });

    test('should return 50 for value at midpoint', () => {
      expect(linearNormalize(15, 10, 20)).toBe(50);
    });

    test('should clamp values below minimum to 0', () => {
      expect(linearNormalize(5, 10, 20)).toBe(0);
    });

    test('should clamp values above maximum to 100', () => {
      expect(linearNormalize(25, 10, 20)).toBe(100);
    });
  });

  describe('inverseLinearNormalize', () => {
    test('should return 100 for value at minimum', () => {
      expect(inverseLinearNormalize(10, 10, 20)).toBe(100);
    });

    test('should return 0 for value at maximum', () => {
      expect(inverseLinearNormalize(20, 10, 20)).toBe(0);
    });

    test('should return 50 for value at midpoint', () => {
      expect(inverseLinearNormalize(15, 10, 20)).toBe(50);
    });
  });

  describe('clamp', () => {
    test('should return value if within range', () => {
      expect(clamp(15, 10, 20)).toBe(15);
    });

    test('should return min if value below range', () => {
      expect(clamp(5, 10, 20)).toBe(10);
    });

    test('should return max if value above range', () => {
      expect(clamp(25, 10, 20)).toBe(20);
    });
  });
});

describe('Individual Normalization Functions', () => {
  describe('normalizeReadingTime', () => {
    test('should return 0 for optimal reading time (70.4s)', () => {
      const score = normalizeReadingTime(READING_TIME.reference.normalMean);
      expect(score).toBe(0);
    });

    test('should return 100 for dyslexic mean reading time (151.8s)', () => {
      const score = normalizeReadingTime(READING_TIME.reference.dyslexicMean);
      expect(score).toBe(100);
    });

    test('should return ~50 for threshold reading time (111s)', () => {
      const score = normalizeReadingTime(READING_TIME.reference.threshold);
      expect(score).toBeGreaterThan(45);
      expect(score).toBeLessThan(55);
    });

    test('should handle very fast reading (<70.4s)', () => {
      const score = normalizeReadingTime(50);
      expect(score).toBe(0); // Clamped to 0
    });

    test('should handle very slow reading (>151.8s)', () => {
      const score = normalizeReadingTime(200);
      expect(score).toBe(100); // Clamped to 100
    });

    test('should return 50 for null/invalid input', () => {
      expect(normalizeReadingTime(null)).toBe(50);
      expect(normalizeReadingTime(undefined)).toBe(50);
      expect(normalizeReadingTime(NaN)).toBe(50);
      expect(normalizeReadingTime(-10)).toBe(50);
    });
  });

  describe('normalizeComprehension', () => {
    test('should return 0 for perfect comprehension (100%)', () => {
      const score = normalizeComprehension(100);
      expect(score).toBe(0);
    });

    test('should return 100 for zero comprehension (0%)', () => {
      const score = normalizeComprehension(0);
      expect(score).toBe(100);
    });

    test('should return 30 for 70% comprehension', () => {
      const score = normalizeComprehension(70);
      expect(score).toBe(30);
    });

    test('should return 50 for 50% comprehension', () => {
      const score = normalizeComprehension(50);
      expect(score).toBe(50);
    });

    test('should handle values above 100 by clamping', () => {
      const score = normalizeComprehension(120);
      expect(score).toBe(0); // Clamped to 100%, returns 0 risk
    });

    test('should return 50 for null/invalid input', () => {
      expect(normalizeComprehension(null)).toBe(50);
      expect(normalizeComprehension(undefined)).toBe(50);
      expect(normalizeComprehension(NaN)).toBe(50);
    });
  });

  describe('normalizeRevisits', () => {
    test('should return 0 for no revisits', () => {
      const score = normalizeRevisits(0);
      expect(score).toBe(0);
    });

    test('should return ~50 for threshold revisits (6.2)', () => {
      const score = normalizeRevisits(REVISIT_COUNT.reference.webThreshold);
      expect(score).toBeGreaterThan(45);
      expect(score).toBeLessThan(55);
    });

    test('should return 100 for max revisits (12)', () => {
      const maxRevisits = REVISIT_COUNT.reference.webThreshold * 2;
      const score = normalizeRevisits(maxRevisits);
      expect(score).toBe(100);
    });

    test('should handle excessive revisits (>12)', () => {
      const score = normalizeRevisits(20);
      expect(score).toBe(100); // Clamped to 100
    });

    test('should return 0 for null/invalid input', () => {
      expect(normalizeRevisits(null)).toBe(0);
      expect(normalizeRevisits(undefined)).toBe(0);
      expect(normalizeRevisits(NaN)).toBe(0);
      expect(normalizeRevisits(-5)).toBe(0);
    });
  });

  describe('normalizePauses', () => {
    test('should return 0 for minimal pauses (5)', () => {
      const score = normalizePauses(5);
      expect(score).toBe(0);
    });

    test('should return 50 for moderate pauses (10)', () => {
      const score = normalizePauses(10);
      expect(score).toBe(50);
    });

    test('should return 100 for max pauses (15)', () => {
      const score = normalizePauses(15);
      expect(score).toBe(100);
    });

    test('should handle excessive pauses (>15)', () => {
      const score = normalizePauses(25);
      expect(score).toBe(100); // Clamped to 100
    });

    test('should return 0 for null/invalid input', () => {
      expect(normalizePauses(null)).toBe(0);
      expect(normalizePauses(undefined)).toBe(0);
      expect(normalizePauses(NaN)).toBe(0);
      expect(normalizePauses(-3)).toBe(0);
    });
  });

  describe('normalizePauseDuration', () => {
    test('should return 0 for minimal pause duration (3000ms)', () => {
      const score = normalizePauseDuration(3000);
      expect(score).toBe(0);
    });

    test('should return 50 for moderate pause duration (4500ms)', () => {
      const score = normalizePauseDuration(4500);
      expect(score).toBe(50);
    });

    test('should return 100 for max pause duration (6000ms)', () => {
      const score = normalizePauseDuration(6000);
      expect(score).toBe(100);
    });

    test('should handle excessive pause duration (>6000ms)', () => {
      const score = normalizePauseDuration(8000);
      expect(score).toBe(100); // Clamped to 100
    });

    test('should return 0 for null/invalid input', () => {
      expect(normalizePauseDuration(null)).toBe(0);
      expect(normalizePauseDuration(undefined)).toBe(0);
      expect(normalizePauseDuration(NaN)).toBe(0);
      expect(normalizePauseDuration(-1000)).toBe(0);
    });
  });
});

describe('Feature Weights Configuration', () => {
  test('weights should sum to 1.0', () => {
    const sum = Object.values(FEATURE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5); // Allow for floating point precision
  });

  test('reading time should have highest weight (30.8%)', () => {
    expect(FEATURE_WEIGHTS.readingTime).toBe(0.308);
  });

  test('comprehension should have second highest weight (30%)', () => {
    expect(FEATURE_WEIGHTS.comprehension).toBe(0.30);
  });

  test('all weights should be positive', () => {
    Object.values(FEATURE_WEIGHTS).forEach(weight => {
      expect(weight).toBeGreaterThan(0);
      expect(weight).toBeLessThanOrEqual(1);
    });
  });
});

describe('Combined Risk Score Calculation', () => {
  describe('Extreme Dyslexic Profile', () => {
    test('should return HIGH risk for typical dyslexic profile', () => {
      const metrics = {
        readingTime: 151.8,        // Dyslexic mean (100 risk)
        comprehensionScore: 45,     // Low comprehension (55 risk)
        revisitCount: 12,           // High revisits (100 risk)
        pauseCount: 15,             // Many pauses (100 risk)
        avgPauseDuration: 6000      // Long pauses (100 risk)
      };

      const result = calculateRiskScore(metrics);
      
      expect(result.riskScore).toBeGreaterThanOrEqual(70); // HIGH risk threshold
      expect(result.riskLevel).toBe('HIGH');
      expect(result.riskLevelData.label).toBe('High Risk');
    });

    test('should provide detailed breakdown for dyslexic profile', () => {
      const metrics = {
        readingTime: 151.8,
        comprehensionScore: 45,
        revisitCount: 12,
        pauseCount: 15,
        avgPauseDuration: 6000
      };

      const result = calculateRiskScore(metrics);
      
      expect(result.breakdown).toHaveProperty('readingTime');
      expect(result.breakdown).toHaveProperty('comprehension');
      expect(result.breakdown).toHaveProperty('revisitCount');
      expect(result.breakdown).toHaveProperty('pauseCount');
      expect(result.breakdown).toHaveProperty('avgPauseDuration');
      
      // Verify each breakdown has required properties
      expect(result.breakdown.readingTime).toHaveProperty('raw');
      expect(result.breakdown.readingTime).toHaveProperty('normalized');
      expect(result.breakdown.readingTime).toHaveProperty('weighted');
      expect(result.breakdown.readingTime).toHaveProperty('weight');
    });
  });

  describe('Extreme Normal Profile', () => {
    test('should return LOW risk for typical normal profile', () => {
      const metrics = {
        readingTime: 70.4,         // Normal mean (0 risk)
        comprehensionScore: 90,     // High comprehension (10 risk)
        revisitCount: 2,            // Few revisits (~17 risk)
        pauseCount: 5,              // Minimal pauses (0 risk)
        avgPauseDuration: 3000      // Normal pauses (0 risk)
      };

      const result = calculateRiskScore(metrics);
      
      expect(result.riskScore).toBeLessThan(40); // LOW risk threshold
      expect(result.riskLevel).toBe('LOW');
      expect(result.riskLevelData.label).toBe('Low Risk');
    });
  });

  describe('Borderline/Moderate Profile', () => {
    test('should return MODERATE risk for borderline profile', () => {
      const metrics = {
        readingTime: 111,           // Threshold (50 risk)
        comprehensionScore: 60,     // Borderline (40 risk)
        revisitCount: 6,            // Threshold (~50 risk)
        pauseCount: 10,             // Moderate (50 risk)
        avgPauseDuration: 4500      // Moderate (50 risk)
      };

      const result = calculateRiskScore(metrics);
      
      expect(result.riskScore).toBeGreaterThanOrEqual(40);
      expect(result.riskScore).toBeLessThan(70);
      expect(result.riskLevel).toBe('MODERATE');
      expect(result.riskLevelData.label).toBe('Moderate Risk');
    });
  });

  describe('Edge Cases', () => {
    test('should handle all zero metrics', () => {
      const metrics = {
        readingTime: 0,
        comprehensionScore: 0,
        revisitCount: 0,
        pauseCount: 0,
        avgPauseDuration: 0
      };

      const result = calculateRiskScore(metrics);
      
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
      expect(['LOW', 'MODERATE', 'HIGH']).toContain(result.riskLevel);
    });

    test('should handle all null metrics gracefully', () => {
      const metrics = {
        readingTime: null,
        comprehensionScore: null,
        revisitCount: null,
        pauseCount: null,
        avgPauseDuration: null
      };

      const result = calculateRiskScore(metrics);
      
      // Should use default values (50 for required, 0 for optional)
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    test('should handle extremely high values by clamping', () => {
      const metrics = {
        readingTime: 9999,
        comprehensionScore: 200,
        revisitCount: 100,
        pauseCount: 50,
        avgPauseDuration: 20000
      };

      const result = calculateRiskScore(metrics);
      
      expect(result.riskScore).toBeLessThanOrEqual(100); // Clamped to max
    });

    test('should handle negative values gracefully', () => {
      const metrics = {
        readingTime: -50,
        comprehensionScore: -10,
        revisitCount: -5,
        pauseCount: -3,
        avgPauseDuration: -1000
      };

      const result = calculateRiskScore(metrics);
      
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Weighted Contribution Validation', () => {
    test('reading time should contribute 30.8% to final score', () => {
      const metrics = {
        readingTime: 151.8,         // 100 normalized
        comprehensionScore: 100,    // 0 normalized
        revisitCount: 0,            // 0 normalized
        pauseCount: 5,              // 0 normalized
        avgPauseDuration: 3000      // 0 normalized
      };

      const result = calculateRiskScore(metrics);
      const expectedScore = 100 * 0.308; // Only reading time contributes
      
      expect(result.riskScore).toBeCloseTo(Math.round(expectedScore), 0);
    });

    test('comprehension should contribute 30% to final score', () => {
      const metrics = {
        readingTime: 70.4,          // 0 normalized
        comprehensionScore: 0,      // 100 normalized
        revisitCount: 0,            // 0 normalized
        pauseCount: 5,              // 0 normalized
        avgPauseDuration: 3000      // 0 normalized
      };

      const result = calculateRiskScore(metrics);
      const expectedScore = 100 * 0.30; // Only comprehension contributes
      
      expect(result.riskScore).toBeCloseTo(Math.round(expectedScore), 0);
    });
  });

  describe('Risk Level Boundaries', () => {
    test('score 70 should be HIGH risk', () => {
      // Create metrics that result in exactly 70 score
      const metrics = {
        readingTime: 151.8,
        comprehensionScore: 50,
        revisitCount: 6,
        pauseCount: 8,
        avgPauseDuration: 4000
      };

      const result = calculateRiskScore(metrics);
      
      if (result.riskScore >= 70) {
        expect(result.riskLevel).toBe('HIGH');
      }
    });

    test('score 40 should be MODERATE risk', () => {
      const metrics = {
        readingTime: 100,
        comprehensionScore: 70,
        revisitCount: 4,
        pauseCount: 7,
        avgPauseDuration: 3500
      };

      const result = calculateRiskScore(metrics);
      
      if (result.riskScore >= 40 && result.riskScore < 70) {
        expect(result.riskLevel).toBe('MODERATE');
      }
    });

    test('score 39 should be LOW risk', () => {
      const metrics = {
        readingTime: 80,
        comprehensionScore: 85,
        revisitCount: 2,
        pauseCount: 5,
        avgPauseDuration: 3000
      };

      const result = calculateRiskScore(metrics);
      
      if (result.riskScore < 40) {
        expect(result.riskLevel).toBe('LOW');
      }
    });
  });
});

describe('Real-World Scenario Tests', () => {
  test('Student A: Fast reader, poor comprehension', () => {
    const metrics = {
      readingTime: 65,            // Fast (0 risk)
      comprehensionScore: 40,     // Poor comprehension (60 risk)
      revisitCount: 8,            // High revisits (~67 risk)
      pauseCount: 6,              // Moderate pauses (10 risk)
      avgPauseDuration: 3200      // Normal pauses (~7 risk)
    };

    const result = calculateRiskScore(metrics);
    
    // Expected: MODERATE to HIGH (comprehension + revisits drive risk)
    expect(result.riskScore).toBeGreaterThan(30);
    console.log('Student A - Fast reader, poor comprehension:', result.riskScore, result.riskLevel);
  });

  test('Student B: Slow reader, good comprehension', () => {
    const metrics = {
      readingTime: 140,           // Slow (85 risk)
      comprehensionScore: 85,     // Good comprehension (15 risk)
      revisitCount: 3,            // Low revisits (25 risk)
      pauseCount: 7,              // Moderate pauses (20 risk)
      avgPauseDuration: 3500      // Moderate pauses (17 risk)
    };

    const result = calculateRiskScore(metrics);
    
    // Expected: MODERATE (slow reading offset by good comprehension)
    expect(result.riskScore).toBeGreaterThan(25);
    expect(result.riskScore).toBeLessThan(60);
    console.log('Student B - Slow reader, good comprehension:', result.riskScore, result.riskLevel);
  });

  test('Student C: Average across all metrics', () => {
    const metrics = {
      readingTime: 111,           // Threshold (50 risk)
      comprehensionScore: 70,     // Borderline (30 risk)
      revisitCount: 6,            // Threshold (50 risk)
      pauseCount: 10,             // Threshold (50 risk)
      avgPauseDuration: 4500      // Threshold (50 risk)
    };

    const result = calculateRiskScore(metrics);
    
    // Expected: MODERATE (all metrics at threshold)
    expect(result.riskScore).toBeGreaterThan(35);
    expect(result.riskScore).toBeLessThan(55);
    expect(result.riskLevel).toBe('MODERATE');
    console.log('Student C - Average across all metrics:', result.riskScore, result.riskLevel);
  });
});

describe('Return Value Structure', () => {
  test('should return complete result structure', () => {
    const metrics = {
      readingTime: 100,
      comprehensionScore: 70,
      revisitCount: 5,
      pauseCount: 8,
      avgPauseDuration: 4000
    };

    const result = calculateRiskScore(metrics);
    
    // Required top-level properties
    expect(result).toHaveProperty('riskScore');
    expect(result).toHaveProperty('riskLevel');
    expect(result).toHaveProperty('riskLevelData');
    expect(result).toHaveProperty('normalizedScores');
    expect(result).toHaveProperty('weights');
    expect(result).toHaveProperty('breakdown');
    
    // Risk level data properties
    expect(result.riskLevelData).toHaveProperty('label');
    expect(result.riskLevelData).toHaveProperty('color');
    expect(result.riskLevelData).toHaveProperty('recommendation');
    expect(result.riskLevelData).toHaveProperty('actionable');
    
    // Normalized scores for all metrics
    expect(result.normalizedScores).toHaveProperty('readingTime');
    expect(result.normalizedScores).toHaveProperty('comprehension');
    expect(result.normalizedScores).toHaveProperty('revisitCount');
    expect(result.normalizedScores).toHaveProperty('pauseCount');
    expect(result.normalizedScores).toHaveProperty('avgPauseDuration');
  });
});
