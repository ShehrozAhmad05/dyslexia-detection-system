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
  },
  {
    passageId: 'passage_003',
    title: 'The Solar System Mystery',
    difficulty: 'medium',
    ageGroup: '10-12',
    totalWords: 276,
    segments: [
      {
        segmentIndex: 0,
        content: `Jake had always dreamed of becoming an astronaut. Every night, he would gaze at the stars through his telescope, wondering about the mysteries of space. His bedroom walls were covered with posters of planets, galaxies, and space shuttles. When his science teacher announced a competition to design a mission to Mars, Jake knew this was his chance to shine.`,
        wordCount: 60
      },
      {
        segmentIndex: 1,
        content: `Jake spent weeks researching everything about Mars: its atmosphere, temperature, gravity, and the challenges of landing there. He learned that Mars has only 38% of Earth's gravity and temperatures that can drop to minus 125 degrees Celsius. He designed a spacecraft with special heat shields and landing gear that could handle the rough Martian terrain. His presentation included detailed diagrams, calculations, and even a 3D model he built from recycled materials.`,
        wordCount: 78
      },
      {
        segmentIndex: 2,
        content: `On presentation day, Jake confidently explained his mission plan to the judges. He proposed using solar panels for energy, growing vegetables in a greenhouse for food, and recycling water using advanced filtration systems. The judges were amazed by his thorough research and creative solutions. Jake won first prize and received a scholarship to space camp. More importantly, he learned that achieving your dreams requires dedication, research, and believing in yourself. His journey to becoming an astronaut had truly begun.`,
        wordCount: 86
      }
    ],
    questions: [
      {
        questionId: 1,
        question: 'What was Jake\'s dream career?',
        options: ['Scientist', 'Astronaut', 'Teacher', 'Engineer'],
        correctAnswer: 'Astronaut',
        type: 'multiple-choice'
      },
      {
        questionId: 2,
        question: 'What competition did the science teacher announce?',
        options: [
          'Design a telescope',
          'Build a rocket',
          'Design a mission to Mars',
          'Study the moon'
        ],
        correctAnswer: 'Design a mission to Mars',
        type: 'multiple-choice'
      },
      {
        questionId: 3,
        question: 'What percentage of Earth\'s gravity does Mars have?',
        options: ['25%', '38%', '50%', '75%'],
        correctAnswer: '38%',
        type: 'multiple-choice'
      },
      {
        questionId: 4,
        question: 'How low can temperatures on Mars drop to?',
        options: ['-50°C', '-75°C', '-100°C', '-125°C'],
        correctAnswer: '-125°C',
        type: 'multiple-choice'
      },
      {
        questionId: 5,
        question: 'What did Jake use to build his 3D model?',
        options: ['Plastic blocks', 'Recycled materials', 'Clay', 'Metal parts'],
        correctAnswer: 'Recycled materials',
        type: 'multiple-choice'
      },
      {
        questionId: 6,
        question: 'What energy source did Jake propose for the Mars mission?',
        options: ['Nuclear power', 'Wind turbines', 'Solar panels', 'Batteries'],
        correctAnswer: 'Solar panels',
        type: 'multiple-choice'
      },
      {
        questionId: 7,
        question: 'What prize did Jake win?',
        options: [
          'A new telescope',
          'A scholarship to space camp',
          'A trip to NASA',
          'A science book'
        ],
        correctAnswer: 'A scholarship to space camp',
        type: 'multiple-choice'
      },
      {
        questionId: 8,
        question: 'What lesson did Jake learn from this experience?',
        options: [
          'Space is too dangerous',
          'Dreams require dedication and research',
          'Competitions are easy to win',
          'Mars is impossible to reach'
        ],
        correctAnswer: 'Dreams require dedication and research',
        type: 'multiple-choice'
      }
    ],
    isActive: true
  },
  {
    passageId: 'passage_004',
    title: 'The Community Garden',
    difficulty: 'medium',
    ageGroup: '10-12',
    totalWords: 264,
    segments: [
      {
        segmentIndex: 0,
        content: `Lila noticed that her neighborhood had an empty lot filled with trash and weeds. Nobody used it, and it made the whole street look sad. One day, she had an idea: what if they could turn this lot into a beautiful community garden? She knew it would be a lot of work, but she was determined to try. First, she needed to convince her neighbors that it was a good idea.`,
        wordCount: 73
      },
      {
        segmentIndex: 1,
        content: `Lila created colorful flyers and went door to door, explaining her vision. She showed drawings of vegetable beds, flower patches, and benches where people could sit and relax. Slowly, people started to get excited. Mr. Chen, who owned a hardware store, donated tools. Mrs. Johnson, a retired teacher, offered to help teach children about plants. Within two weeks, thirty volunteers signed up to help create the garden.`,
        wordCount: 72
      },
      {
        segmentIndex: 2,
        content: `The transformation took three months of hard work. They cleared the trash, prepared the soil, and built raised beds for vegetables. They planted tomatoes, carrots, lettuce, and herbs. They even added a small playground for younger children. The once-empty lot became a vibrant gathering place where neighbors could meet, children could learn about nature, and families could grow fresh food together. Lila's simple idea had brought the entire community closer and made their neighborhood a better place to live.`,
        wordCount: 84
      }
    ],
    questions: [
      {
        questionId: 1,
        question: 'What was wrong with the empty lot?',
        options: [
          'It was too small',
          'It was filled with trash and weeds',
          'It was privately owned',
          'It was flooded'
        ],
        correctAnswer: 'It was filled with trash and weeds',
        type: 'multiple-choice'
      },
      {
        questionId: 2,
        question: 'What was Lila\'s idea for the lot?',
        options: [
          'Build a playground',
          'Create a parking lot',
          'Turn it into a community garden',
          'Build houses'
        ],
        correctAnswer: 'Turn it into a community garden',
        type: 'multiple-choice'
      },
      {
        questionId: 3,
        question: 'How did Lila promote her idea?',
        options: [
          'Posted on social media',
          'Made colorful flyers and went door to door',
          'Called a neighborhood meeting',
          'Put up posters'
        ],
        correctAnswer: 'Made colorful flyers and went door to door',
        type: 'multiple-choice'
      },
      {
        questionId: 4,
        question: 'What did Mr. Chen donate?',
        options: ['Money', 'Seeds', 'Tools', 'Wood'],
        correctAnswer: 'Tools',
        type: 'multiple-choice'
      },
      {
        questionId: 5,
        question: 'How many volunteers signed up?',
        options: ['Ten', 'Twenty', 'Thirty', 'Forty'],
        correctAnswer: 'Thirty',
        type: 'multiple-choice'
      },
      {
        questionId: 6,
        question: 'How long did the transformation take?',
        options: ['One month', 'Two months', 'Three months', 'Six months'],
        correctAnswer: 'Three months',
        type: 'multiple-choice'
      },
      {
        questionId: 7,
        question: 'Which vegetable was NOT mentioned in the garden?',
        options: ['Tomatoes', 'Carrots', 'Lettuce', 'Potatoes'],
        correctAnswer: 'Potatoes',
        type: 'multiple-choice'
      },
      {
        questionId: 8,
        question: 'What additional feature did they add for younger children?',
        options: ['A sandbox', 'A small playground', 'A fountain', 'A library'],
        correctAnswer: 'A small playground',
        type: 'multiple-choice'
      }
    ],
    isActive: true
  },
  {
    passageId: 'passage_005',
    title: 'The Coding Champion',
    difficulty: 'medium',
    ageGroup: '10-12',
    totalWords: 271,
    segments: [
      {
        segmentIndex: 0,
        content: `Emma discovered coding when she was ten years old. Her older brother was learning to make video games, and she was fascinated by how he could create entire worlds on the computer. She asked him to teach her, and soon she was writing her first lines of code. At first, the syntax was confusing and she made many mistakes, but Emma never gave up. She practiced every day after school.`,
        wordCount: 71
      },
      {
        segmentIndex: 1,
        content: `After six months of practice, Emma decided to enter a regional coding competition. The challenge was to create a game that taught younger children about recycling. Emma spent three weeks designing her game, "Eco Warriors." Players had to sort different types of waste into the correct recycling bins while racing against time. She added colorful graphics, fun sound effects, and different difficulty levels. The game was both educational and entertaining.`,
        wordCount: 73
      },
      {
        segmentIndex: 2,
        content: `At the competition, Emma presented her game to a panel of professional programmers and teachers. They were impressed by her creativity and the game's clear educational value. Emma won second place and received a laptop computer as her prize. But the best reward came later when local schools started using her game in their environmental education programs. Emma realized that coding wasn't just about technology; it was a powerful tool to solve real-world problems and help others learn.`,
        wordCount: 82
      }
    ],
    questions: [
      {
        questionId: 1,
        question: 'How old was Emma when she discovered coding?',
        options: ['Eight', 'Ten', 'Twelve', 'Fourteen'],
        correctAnswer: 'Ten',
        type: 'multiple-choice'
      },
      {
        questionId: 2,
        question: 'Who introduced Emma to coding?',
        options: ['Her teacher', 'Her older brother', 'Her father', 'A friend'],
        correctAnswer: 'Her older brother',
        type: 'multiple-choice'
      },
      {
        questionId: 3,
        question: 'How long did Emma practice before entering the competition?',
        options: ['Three months', 'Six months', 'One year', 'Two years'],
        correctAnswer: 'Six months',
        type: 'multiple-choice'
      },
      {
        questionId: 4,
        question: 'What was the game challenge about?',
        options: [
          'Teaching math',
          'Teaching about recycling',
          'Teaching languages',
          'Teaching history'
        ],
        correctAnswer: 'Teaching about recycling',
        type: 'multiple-choice'
      },
      {
        questionId: 5,
        question: 'What was Emma\'s game called?',
        options: ['Recycle Master', 'Eco Warriors', 'Green Planet', 'Save Earth'],
        correctAnswer: 'Eco Warriors',
        type: 'multiple-choice'
      },
      {
        questionId: 6,
        question: 'What place did Emma win in the competition?',
        options: ['First', 'Second', 'Third', 'Fourth'],
        correctAnswer: 'Second',
        type: 'multiple-choice'
      },
      {
        questionId: 7,
        question: 'What prize did Emma receive?',
        options: ['A trophy', 'Money', 'A laptop computer', 'A coding course'],
        correctAnswer: 'A laptop computer',
        type: 'multiple-choice'
      },
      {
        questionId: 8,
        question: 'Who started using Emma\'s game later?',
        options: ['Gaming companies', 'Local schools', 'Libraries', 'Hospitals'],
        correctAnswer: 'Local schools',
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
