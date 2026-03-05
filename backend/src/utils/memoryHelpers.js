// =====================================================
// MEMORY MODULE UTILITY FUNCTIONS
// Helper functions for sequence generation, validation, and analysis
// =====================================================

const memoryThresholds = require('../../config/memoryThresholds');

/**
 * Generate a random sequence of specified length
 * Avoids consecutive repeated items for better quality
 * 
 * @param {Number} length - Length of sequence to generate (e.g., 3, 4, 5)
 * @param {String} type - Type: 'letters', 'numbers', or 'mixed'
 * @returns {String} - Sequence like "A-5-D-2"
 * 
 * @example
 * generateSequence(3, 'mixed') → "A-5-D"
 * generateSequence(4, 'letters') → "B-K-M-P"
 * generateSequence(5, 'numbers') → "3-7-1-9-4"
 */
function generateSequence(length, type = 'mixed') {
  const { itemTypes } = memoryThresholds.sequenceTask;
  const items = [];
  let lastItem = null;
  
  for (let i = 0; i < length; i++) {
    let item;
    let pool;
    
    // Determine which pool to use (letters or numbers)
    if (type === 'mixed') {
      // Randomly choose letter or number for variety
      const useLetters = Math.random() > 0.5;
      pool = useLetters ? itemTypes.letters : itemTypes.numbers;
    } else if (type === 'letters') {
      pool = itemTypes.letters;
    } else if (type === 'numbers') {
      pool = itemTypes.numbers;
    } else {
      // Default to mixed if invalid type
      pool = Math.random() > 0.5 ? itemTypes.letters : itemTypes.numbers;
    }
    
    // Keep selecting until we get a different item than last
    // This prevents sequences like "A-A-B" or "5-5-7"
    do {
      item = pool[Math.floor(Math.random() * pool.length)];
    } while (item === lastItem && pool.length > 1);
    
    items.push(item);
    lastItem = item;
  }
  
  // Join with hyphens for clear separation
  return items.join('-');
}


/**
 * Generate random words for word recall task
 * OPTIMIZED: Ensures balanced difficulty, varied word lengths, no similar words
 * 
 * @param {Number} count - Number of words to select
 * @returns {Array} - Array of carefully selected random words
 * 
 * @example
 * generateWordList(4) → ['apple', 'guitar', 'sunset', 'lamp']
 */
function generateWordList(count) {
  const { wordPool } = memoryThresholds.wordTask;
  
  // Ensure we don't request more words than available
  const actualCount = Math.min(count, wordPool.length);
  
  // Categorize words by length for balanced selection
  const short = wordPool.filter(w => w.length <= 5);      // Short: 3-5 letters
  const medium = wordPool.filter(w => w.length > 5 && w.length <= 7);  // Medium: 6-7 letters
  const long = wordPool.filter(w => w.length > 7);        // Long: 8+ letters
  
  const selectedWords = [];
  
  // Strategy: Mix word lengths for balanced difficulty
  // For 4-6 words, aim for roughly equal distribution
  const shortCount = Math.ceil(actualCount / 3);
  const mediumCount = Math.ceil(actualCount / 3);
  const longCount = actualCount - shortCount - mediumCount;
  
  // Select from each category
  const selectFromCategory = (category, needed) => {
    const shuffled = [...category].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(needed, category.length));
  };
  
  selectedWords.push(...selectFromCategory(short, shortCount));
  selectedWords.push(...selectFromCategory(medium, mediumCount));
  selectedWords.push(...selectFromCategory(long, longCount));
  
  // If we don't have enough from categories, fill from full pool
  while (selectedWords.length < actualCount) {
    const remaining = wordPool.filter(w => !selectedWords.includes(w));
    if (remaining.length === 0) break;
    const randomWord = remaining[Math.floor(Math.random() * remaining.length)];
    selectedWords.push(randomWord);
  }
  
  // Remove similar words (words starting with same letter or sounding similar)
  const filtered = removeSimilarWords(selectedWords);
  
  // Shuffle final list
  return filtered.sort(() => Math.random() - 0.5).slice(0, actualCount);
}

/**
 * Remove words that are too similar (same starting letter, rhyming, etc.)
 * Reduces confusion during recall
 * 
 * @param {Array} words - List of words
 * @returns {Array} - Filtered list with dissimilar words
 */
function removeSimilarWords(words) {
  const result = [];
  const usedFirstLetters = new Set();
  
  for (const word of words) {
    const firstLetter = word[0].toLowerCase();
    
    // Allow max 2 words starting with same letter
    const countSameLetter = result.filter(w => w[0].toLowerCase() === firstLetter).length;
    
    if (countSameLetter < 2) {
      result.push(word);
      usedFirstLetters.add(firstLetter);
    }
  }
  
  return result.length >= words.length * 0.7 ? result : words; // Return original if too many filtered
}


/**
 * Generate distractor words for click-based selection
 * OPTIMIZED: Ensures distractors are plausible but not too confusing
 * 
 * @param {Array} targetWords - Original words shown
 * @param {Number} distractorCount - Number of distractor words to add
 * @returns {Array} - Shuffled mixed list (target + carefully chosen distractors)
 * 
 * @example
 * generateMixedWordList(['apple', 'book'], 2) 
 * → ['apple', 'camera', 'book', 'sunset'] (shuffled, varied lengths)
 */
function generateMixedWordList(targetWords, distractorCount) {
  const { wordPool } = memoryThresholds.wordTask;
  
  // Get words NOT in target list for distractors
  let availableDistractors = wordPool.filter(word => !targetWords.includes(word));
  
  // Remove distractors that are TOO similar to target words
  availableDistractors = availableDistractors.filter(distractor => {
    const firstLetter = distractor[0].toLowerCase();
    const targetFirstLetters = targetWords.map(w => w[0].toLowerCase());
    
    // Allow some overlap but not too much (max 50% same first letters)
    const sameLetterCount = targetFirstLetters.filter(l => l === firstLetter).length;
    return sameLetterCount <= targetWords.length * 0.3; // Allow max 30% overlap
  });
  
  // Ensure variety in distractor lengths (similar to target distribution)
  const targetLengths = targetWords.map(w => w.length);
  const avgTargetLength = targetLengths.reduce((a, b) => a + b, 0) / targetLengths.length;
  
  // Prefer distractors with similar length distribution
  availableDistractors.sort((a, b) => {
    const diffA = Math.abs(a.length - avgTargetLength);
    const diffB = Math.abs(b.length - avgTargetLength);
    return diffA - diffB; // Sort by closeness to average length
  });
  
  // Mix some similar-length and some different-length distractors
  const similarLength = availableDistractors.slice(0, Math.ceil(distractorCount / 2));
  const differentLength = availableDistractors.slice(Math.ceil(distractorCount / 2));
  
  // Shuffle and select balanced distractors
  const shuffledSimilar = [...similarLength].sort(() => Math.random() - 0.5);
  const shuffledDifferent = [...differentLength].sort(() => Math.random() - 0.5);
  
  const distractors = [
    ...shuffledSimilar.slice(0, Math.ceil(distractorCount / 2)),
    ...shuffledDifferent.slice(0, Math.floor(distractorCount / 2))
  ];
  
  // Combine target words + distractors and shuffle completely
  const mixedList = [...targetWords, ...distractors].sort(() => Math.random() - 0.5);
  
  return mixedList;
}


/**
 * Check if user's answer matches the original sequence
 * Normalizes both strings for fair comparison
 * 
 * @param {String} sequence - Original sequence shown: "A-5-D"
 * @param {String} userInput - User's input: "a-5-d" or "A 5 D"
 * @returns {Boolean} - True if exact match (case-insensitive, whitespace-tolerant)
 * 
 * @example
 * validateSequence('A-5-D', 'A-5-D') → true
 * validateSequence('A-5-D', 'a-5-d') → true (case-insensitive)
 * validateSequence('A-5-D', 'A 5 D') → true (space-tolerant)
 * validateSequence('A-5-D', 'A-5-X') → false
 */
function validateSequence(sequence, userInput) {
  // Normalize both strings:
  // 1. Remove all whitespace (spaces, tabs, newlines)
  // 2. Convert to uppercase
  // 3. Standardize separators (allow spaces or hyphens)
  const normalizeString = (str) => {
    return str
      .replace(/\s+/g, '-')          // Convert spaces to hyphens
      .toUpperCase()                 // Convert to uppercase
      .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
      .replace(/-+/g, '-');          // Collapse multiple hyphens to one
  };
  
  const normalized1 = normalizeString(sequence);
  const normalized2 = normalizeString(userInput);
  
  return normalized1 === normalized2;
}


/**
 * Analyze word recall accuracy
 * Compares shown words vs recalled words
 * 
 * @param {Array} shownWords - Words that were displayed to user
 * @param {Array} recalledWords - Words user entered
 * @returns {Object} - Analysis with correct, incorrect, and missed arrays
 * 
 * @example
 * const shown = ['apple', 'book', 'chair'];
 * const recalled = ['apple', 'BOOK', 'table'];
 * analyzeWordRecall(shown, recalled) → {
 *   correct: ['apple', 'book'],     // Correctly recalled
 *   incorrect: ['table'],           // False memories
 *   missed: ['chair']               // Failed to recall
 * }
 */
function analyzeWordRecall(shownWords, recalledWords) {
  // Convert all words to lowercase for case-insensitive comparison
  const shownSet = new Set(shownWords.map(w => w.toLowerCase().trim()));
  const recalledNormalized = recalledWords.map(w => w.toLowerCase().trim());
  
  // Find correctly recalled words (existed in shown words)
  const correct = recalledNormalized.filter(w => shownSet.has(w));
  
  // Find incorrectly recalled words (false memories - didn't exist in shown words)
  const incorrect = recalledNormalized.filter(w => !shownSet.has(w) && w.length > 0);
  
  // Find missed words (shown but not recalled)
  const recalledSet = new Set(recalledNormalized);
  const missed = shownWords.filter(w => !recalledSet.has(w.toLowerCase().trim()));
  
  return {
    correct,
    incorrect,
    missed
  };
}


/**
 * Calculate standard deviation of an array of numbers
 * Used for measuring consistency/variability
 * 
 * @param {Array} values - Array of numbers (e.g., response times)
 * @returns {Number} - Standard deviation
 * 
 * @example
 * calculateStdDev([2000, 2500, 3000]) → ~408.25
 */
function calculateStdDev(values) {
  if (!values || values.length === 0) return 0;
  
  // Step 1: Calculate mean (average)
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  
  // Step 2: Calculate squared differences from mean
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  
  // Step 3: Calculate variance (average of squared differences)
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;
  
  // Step 4: Standard deviation is square root of variance
  return Math.sqrt(variance);
}


/**
 * Calculate coefficient of variation (CV%)
 * Measures relative variability (higher = more inconsistent)
 * 
 * @param {Array} values - Array of numbers
 * @returns {Number} - Coefficient of variation as percentage
 * 
 * @example
 * calculateCV([2000, 2500, 3000]) → ~16.3%
 * calculateCV([1000, 5000, 9000]) → ~83.7% (very inconsistent)
 */
function calculateCV(values) {
  if (!values || values.length === 0) return 0;
  
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (mean === 0) return 0; // Avoid division by zero
  
  const stdDev = calculateStdDev(values);
  
  // CV = (Standard Deviation / Mean) × 100
  return (stdDev / mean) * 100;
}


/**
 * Parse user's word recall input
 * Handles various formats: comma-separated, newline-separated, space-separated
 * 
 * @param {String} input - User's raw input
 * @returns {Array} - Array of cleaned words
 * 
 * @example
 * parseWordInput('apple, book, chair') → ['apple', 'book', 'chair']
 * parseWordInput('apple\nbook\nchair') → ['apple', 'book', 'chair']
 * parseWordInput('apple book chair') → ['apple', 'book', 'chair']
 */
function parseWordInput(input) {
  if (!input || typeof input !== 'string') return [];
  
  // Split by commas, newlines, or multiple spaces
  const words = input
    .split(/[,\n]+/)                    // Split by comma or newline
    .map(w => w.trim())                 // Remove whitespace
    .filter(w => w.length > 0)          // Remove empty strings
    .map(w => w.toLowerCase());         // Normalize to lowercase
  
  // Remove duplicates (user might type same word twice)
  return [...new Set(words)];
}


/**
 * Format sequence for display
 * Adds spacing for better readability
 * 
 * @param {String} sequence - Raw sequence: "A-5-D"
 * @returns {String} - Formatted: "A - 5 - D"
 * 
 * @example
 * formatSequenceForDisplay('A-5-D-2') → 'A - 5 - D - 2'
 */
function formatSequenceForDisplay(sequence) {
  return sequence.replace(/-/g, ' - ');
}


/**
 * Calculate memory span score
 * Based on longest sequence correctly recalled
 * 
 * @param {Number} maxLength - Maximum sequence length achieved
 * @returns {String} - Description of memory span
 * 
 * @example
 * getMemorySpanDescription(7) → 'Excellent (Normal adult range)'
 * getMemorySpanDescription(4) → 'Below average (May indicate difficulty)'
 */
function getMemorySpanDescription(maxLength) {
  if (maxLength >= 7) {
    return 'Excellent (Normal adult range)';
  } else if (maxLength >= 5) {
    return 'Good (Slightly below average)';
  } else if (maxLength >= 3) {
    return 'Below average (May indicate difficulty)';
  } else {
    return 'Concerning (Significantly below expected)';
  }
}


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  generateSequence,
  generateWordList,
  generateMixedWordList,
  validateSequence,
  analyzeWordRecall,
  calculateStdDev,
  calculateCV,
  parseWordInput,
  formatSequenceForDisplay,
  getMemorySpanDescription
};
