const mongoose = require('mongoose');
const ReadingPassage = require('./src/models/ReadingPassage');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dyslexia_detection')
  .then(async () => {
    const passages = await ReadingPassage.find({}, 'passageId title difficulty totalWords');
    console.log('\n✓ Available passages in database:\n');
    passages.forEach(p => {
      console.log(`  ${p.passageId}: "${p.title}" (${p.difficulty}, ${p.totalWords} words)`);
    });
    console.log(`\n  Total: ${passages.length} passages\n`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
