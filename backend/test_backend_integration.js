const axios = require('axios');

async function main() {
  try {
    await axios.get('http://localhost:8000/health', { timeout: 3000 });
    console.log('ML service: AVAILABLE');
  } catch (error) {
    console.log('ML service: UNAVAILABLE');
  }

  try {
    const response = await axios.get(
      'http://localhost:8000/api/ml/handwriting/sentence',
      { timeout: 5000 }
    );
    console.log(`Sentence: ${response.data.sentence}`);
  } catch (error) {
    console.log(`Sentence fetch failed: ${error.message}`);
  }

  console.log('To test full flow:');
  console.log('1. Start ML service: cd ml-models && python main.py');
  console.log('2. Start backend: cd backend && npm start');
  console.log('3. Use frontend or Postman to:');
  console.log('   a. GET /api/handwriting/sentence');
  console.log('   b. POST /api/handwriting/upload with image + expectedSentence');
  console.log('   c. POST /api/handwriting/analyze/:id');
  console.log('   d. GET /api/handwriting/results/:id');
}

main().catch((error) => {
  console.error('Backend integration test failed:', error.message);
  process.exit(1);
});
