/**
 * ML service client for communicating with FastAPI ML service.
 * Handles all HTTP calls to the Python ML backend.
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const mlClient = {
  /**
   * Get a random screening sentence from ML service.
   * Called when handwriting test page loads.
   * @returns {Promise<string>} screening sentence
   */
  async getScreeningSentence() {
    try {
      const response = await axios.get(
        `${ML_SERVICE_URL}/api/ml/handwriting/sentence`,
        { timeout: 5000 }
      );
      return response.data.sentence;
    } catch (error) {
      console.error('ML service sentence fetch failed:', error.message);
      // Fallback sentence if ML service unavailable
      return 'the big dog can jump';
    }
  },

  /**
   * Analyze handwriting image against expected sentence.
   * @param {string} imagePath - absolute path to image file
   * @param {string} expectedSentence - sentence user was asked to write
   * @returns {Promise<object>} analysis result from ML service
   */
  async analyzeHandwriting(imagePath, expectedSentence) {
    const startTime = Date.now();
    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(imagePath));
      form.append('expected_sentence', expectedSentence);

      const response = await axios.post(
        `${ML_SERVICE_URL}/api/ml/handwriting/analyze`,
        form,
        {
          headers: form.getHeaders(),
          timeout: 30000 // 30s timeout for OCR processing
        }
      );

      const processingTime = Date.now() - startTime;
      return {
        success: true,
        data: response.data,
        processingTime
      };
    } catch (error) {
      console.error('ML service analysis failed:', error.message);
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  },

  /**
   * Check if ML service is available.
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      await axios.get(
        `${ML_SERVICE_URL}/health`,
        { timeout: 3000 }
      );
      return true;
    } catch {
      return false;
    }
  }
};

module.exports = mlClient;
