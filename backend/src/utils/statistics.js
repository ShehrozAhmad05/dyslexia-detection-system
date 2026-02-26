function mean(array) {
  if (!array || array.length === 0) return 0;
  return array.reduce((sum, val) => sum + val, 0) / array.length;
}

function standardDeviation(array) {
  if (!array || array.length === 0) return 0;
  const avg = mean(array);
  const squareDiffs = array.map(val => Math.pow(val - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

function coefficientOfVariation(array) {
  const avg = mean(array);
  if (avg === 0) return 0;
  return (standardDeviation(array) / avg) * 100;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i += 1) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i += 1) {
    for (let j = 1; j <= str1.length; j += 1) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

function calculateAccuracy(expected, actual) {
  const distance = levenshteinDistance(expected || '', actual || '');
  const maxLength = Math.max(expected?.length || 0, actual?.length || 0) || 1;
  return ((maxLength - distance) / maxLength) * 100;
}

module.exports = {
  mean,
  standardDeviation,
  coefficientOfVariation,
  levenshteinDistance,
  calculateAccuracy
};
