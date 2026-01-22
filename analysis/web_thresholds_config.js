
// Thresholds derived from ETDD70 analysis
// Generated: 2026-01-04 21:09:46.275349
// Dataset: 70 Czech children (35 dyslexic, 35 non-dyslexic)

const readingThresholds = {
  wpm: {
    dyslexic_mean: 79.0,
    non_dyslexic_mean: 170.5,
    threshold_high_risk: 124.7,
    threshold_moderate: 144.9
  },
  revisits: {
    dyslexic_mean: 8.0,
    non_dyslexic_mean: 4.5,
    threshold_high_risk: 6.2,
    threshold_moderate: 6.7
  },
  pauseCount: {
    // Note: Eye fixations (continuous) != Web pauses (inactivity)
    // Using fixation count as proxy for pause frequency
    dyslexic_mean: 276,  // Total fixations
    non_dyslexic_mean: 180,
    // Scaled down for web: expect ~5-10 inactivity pauses per test
    threshold_high_risk: 10,  // >10 pauses = concern
    threshold_moderate: 7     // 7-10 pauses = moderate
  },
  averagePauseDuration: {
    // Individual pause length when user stops (different from continuous fixation)
    // Dyslexic readers have longer individual pauses when they stop
    threshold_high_risk: 5000,     // >5 seconds per pause
    threshold_moderate: 3500       // 3.5-5 seconds per pause
  },
  metadata: {
    source: 'ETDD70 Eye-Tracking Dataset',
    conversion_method: 'Statistical mapping with conversion factors',
    note: 'Eye-tracking features converted to web behavioral proxies'
  }
};

module.exports = readingThresholds;
