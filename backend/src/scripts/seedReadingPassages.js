const mongoose = require('mongoose');
const ReadingPassage = require('../models/ReadingPassage');
require('dotenv').config();

// Sample passages
const passages = [
  {
    passageId: 'passage_001',
    title: 'The Lost Treasure',
    difficulty: 'medium',
    ageGroup: '10-12',
    totalWords: 285,
    segments: [
      {
        segmentIndex: 0,
        content: `Tommy had always been fascinated by old maps and hidden treasures. One rainy afternoon, while exploring his grandmother's attic, he discovered a dusty wooden chest tucked behind some old furniture. Inside, wrapped in yellow cloth, was an ancient-looking map with mysterious symbols and a red X marking a location in the nearby forest.`,
        wordCount: 55
      },
      {
        segmentIndex: 1,
        content: `The next morning, Tommy gathered his courage and some supplies. He carefully studied the map, noting the landmarks: a giant oak tree, a stream that curved like a snake, and three large boulders forming a triangle. The forest was dense and quiet, with only the sound of birds chirping and leaves rustling in the wind. After an hour of searching, he finally found the oak tree mentioned on the map.`,
        wordCount: 74
      },
      {
        segmentIndex: 2,
        content: `Following the map's directions, Tommy walked fifty paces east and discovered the three boulders. His heart raced with excitement as he began to dig near the center of the triangle. After digging for what felt like hours, his shovel hit something solid. It was a metal box! Inside, he found not gold or jewels, but something even more valuable: his grandmother's childhood diary, filled with stories and memories she had buried as a time capsule fifty years ago. Tommy realized that some treasures are worth more than gold.`,
        wordCount: 98
      }
    ],
    questions: [
      {
        questionId: 1,
        question: 'Where did Tommy find the old map?',
        options: ['In the forest', 'In his grandmother\'s attic', 'At school', 'In a library'],
        correctAnswer: 'In his grandmother\'s attic',
        type: 'multiple-choice'
      },
      {
        questionId: 2,
        question: 'What was the weather like when Tommy found the map?',
        options: ['Sunny', 'Snowy', 'Rainy', 'Windy'],
        correctAnswer: 'Rainy',
        type: 'multiple-choice'
      },
      {
        questionId: 3,
        question: 'Which of these was NOT a landmark on the map?',
        options: ['A giant oak tree', 'A winding stream', 'Three large boulders', 'A tall mountain'],
        correctAnswer: 'A tall mountain',
        type: 'multiple-choice'
      },
      {
        questionId: 4,
        question: 'How long did Tommy search before finding the oak tree?',
        options: ['30 minutes', 'An hour', 'Two hours', 'All day'],
        correctAnswer: 'An hour',
        type: 'multiple-choice'
      },
      {
        questionId: 5,
        question: 'What shape did the three boulders form?',
        options: ['A circle', 'A square', 'A triangle', 'A line'],
        correctAnswer: 'A triangle',
        type: 'multiple-choice'
      },
      {
        questionId: 6,
        question: 'What did Tommy find inside the metal box?',
        options: ['Gold coins', 'Precious jewels', 'His grandmother\'s diary', 'Old photographs'],
        correctAnswer: 'His grandmother\'s diary',
        type: 'multiple-choice'
      },
      {
        questionId: 7,
        question: 'How long ago had the treasure been buried?',
        options: ['Ten years ago', 'Twenty years ago', 'Fifty years ago', 'One hundred years ago'],
        correctAnswer: 'Fifty years ago',
        type: 'multiple-choice'
      },
      {
        questionId: 8,
        question: 'What lesson did Tommy learn from this experience?',
        options: [
          'Always bring a map when exploring',
          'Gold is the most valuable treasure',
          'Some treasures are worth more than gold',
          'Never dig in the forest'
        ],
        correctAnswer: 'Some treasures are worth more than gold',
        type: 'multiple-choice'
      }
    ],
    isActive: true
  },
  {
    passageId: 'passage_002',
    title: 'The Science Fair Project',
    difficulty: 'medium',
    ageGroup: '10-12',
    totalWords: 268,
    segments: [
      {
        segmentIndex: 0,
        content: `Maya was nervous about the upcoming science fair. She had only two weeks to complete her project, and she still didn't have a good idea. Her teacher, Ms. Rodriguez, had encouraged her to think about problems she observed in everyday life. That evening, while washing dishes, Maya noticed how much water went down the drain. This sparked an idea: what if she could create a system to recycle water at home?`,
        wordCount: 75
      },
      {
        segmentIndex: 1,
        content: `Maya spent the next week researching water conservation and building a model filtration system. She used common materials: sand, gravel, activated charcoal, and coffee filters. Her design allowed gray water from sinks to be filtered and reused for watering plants. She carefully documented each step with photographs and detailed notes. The hardest part was testing the system multiple times to ensure it worked properly and was safe for plants.`,
        wordCount: 71
      },
      {
        segmentIndex: 2,
        content: `On the day of the science fair, Maya set up her display with confidence. She had charts showing how much water households waste daily and how her system could save up to 30% of that water. The judges were impressed by her practical approach to an important environmental issue. Although she didn't win first place, Maya received a special recognition award for "Most Practical Real-World Application." More importantly, her school decided to install a similar system in the student garden, making Maya's idea a reality.`,
        wordCount: 94
      }
    ],
    questions: [
      {
        questionId: 1,
        question: 'How much time did Maya have to complete her project?',
        options: ['One week', 'Two weeks', 'One month', 'Two months'],
        correctAnswer: 'Two weeks',
        type: 'multiple-choice'
      },
      {
        questionId: 2,
        question: 'What gave Maya the idea for her project?',
        options: [
          'Reading a science book',
          'Watching water go down the drain',
          'Talking to her teacher',
          'Seeing a TV show'
        ],
        correctAnswer: 'Watching water go down the drain',
        type: 'multiple-choice'
      },
      {
        questionId: 3,
        question: 'Which material did Maya NOT use in her filtration system?',
        options: ['Sand', 'Gravel', 'Plastic bottles', 'Coffee filters'],
        correctAnswer: 'Plastic bottles',
        type: 'multiple-choice'
      },
      {
        questionId: 4,
        question: 'What was the filtered water used for?',
        options: ['Drinking', 'Cooking', 'Watering plants', 'Washing dishes'],
        correctAnswer: 'Watering plants',
        type: 'multiple-choice'
      },
      {
        questionId: 5,
        question: 'How much water could Maya\'s system save?',
        options: ['10%', '20%', '30%', '50%'],
        correctAnswer: '30%',
        type: 'multiple-choice'
      },
      {
        questionId: 6,
        question: 'Did Maya win first place?',
        options: ['Yes', 'No', 'The passage doesn\'t say', 'She tied for first'],
        correctAnswer: 'No',
        type: 'multiple-choice'
      },
      {
        questionId: 7,
        question: 'What special award did Maya receive?',
        options: [
          'Best Design Award',
          'Most Creative Project',
          'Most Practical Real-World Application',
          'Best Presentation'
        ],
        correctAnswer: 'Most Practical Real-World Application',
        type: 'multiple-choice'
      },
      {
        questionId: 8,
        question: 'What happened to Maya\'s idea after the science fair?',
        options: [
          'Nothing happened',
          'It was featured in a magazine',
          'The school installed a similar system',
          'She sold it to a company'
        ],
        correctAnswer: 'The school installed a similar system',
        type: 'multiple-choice'
      }
    ],
    isActive: true
  }
];

// Connect to MongoDB and seed data
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dyslexia_detection')
  .then(async () => {
    console.log('✓ Connected to MongoDB');
    
    // Clear existing passages
    await ReadingPassage.deleteMany({});
    console.log('✓ Cleared existing passages');
    
    // Insert sample passages
    await ReadingPassage.insertMany(passages);
    console.log(`✓ Inserted ${passages.length} sample passages`);
    
    console.log('\n✅ Database seeded successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  });
