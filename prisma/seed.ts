import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  // Clear existing data
  await prisma.submission.deleteMany();
  await prisma.puzzle.deleteMany();
  await prisma.player.deleteMany();

  // ═══════════════════════════════════════════════════════════
  // PUZZLES (Logic-based Riddles)
  // ═══════════════════════════════════════════════════════════
  
  const puzzle1 = await prisma.puzzle.create({
    data: {
      code: 'QUEST-001',
      type: 'puzzle',
      title: 'The Ancient Library',
      question: 'I have cities but no houses, forests but no trees, and water but no fish. What am I?',
      answer: 'map',
      hint: 'You might find me on a wall or in a book',
      points: 10,
      category: 'riddle',
      difficulty: 'easy',
    },
  });
  console.log('✅ Created puzzle:', puzzle1.code);

  const puzzle2 = await prisma.puzzle.create({
    data: {
      code: 'QUEST-002',
      type: 'puzzle',
      title: 'The Bathroom Mystery',
      question: 'What gets wetter the more it dries?',
      answer: 'towel',
      hint: 'Used after a shower or bath',
      points: 15,
      category: 'riddle',
      difficulty: 'easy',
    },
  });
  console.log('✅ Created puzzle:', puzzle2.code);

  const puzzle3 = await prisma.puzzle.create({
    data: {
      code: 'QUEST-003',
      type: 'puzzle',
      title: 'The Riddler\'s Riddle',
      question: 'The more you take, the more you leave behind. What am I?',
      answer: 'footsteps',
      hint: 'Think about what follows you when you walk',
      points: 20,
      category: 'riddle',
      difficulty: 'medium',
    },
  });
  console.log('✅ Created puzzle:', puzzle3.code);

  const puzzle4 = await prisma.puzzle.create({
    data: {
      code: 'QUEST-004',
      type: 'puzzle',
      title: 'Silence is Golden',
      question: 'What has hands but cannot clap?',
      answer: 'clock',
      hint: 'It tells you something every hour',
      points: 15,
      category: 'riddle',
      difficulty: 'easy',
    },
  });
  console.log('✅ Created puzzle:', puzzle4.code);

  const puzzle5 = await prisma.puzzle.create({
    data: {
      code: 'QUEST-005',
      type: 'puzzle',
      title: 'The Dark Room',
      question: 'What comes once in a minute, twice in a moment, and never in one thousand years?',
      answer: 'the letter m',
      hint: 'Think about the letters in the words',
      points: 25,
      category: 'riddle',
      difficulty: 'hard',
    },
  });
  console.log('✅ Created puzzle:', puzzle5.code);

  // ═══════════════════════════════════════════════════════════
  // TRIVIA (Multiple Choice)
  // ═══════════════════════════════════════════════════════════

  const trivia1 = await prisma.puzzle.create({
    data: {
      code: 'TRIVIA-001',
      type: 'trivia',
      title: 'History Trivia',
      question: 'In what year did the Titanic sink?',
      answer: '1912',
      choices: JSON.stringify(['1905', '1912', '1920', '1898']),
      explanation: 'The RMS Titanic sank on April 15, 1912, after hitting an iceberg in the North Atlantic Ocean.',
      points: 20,
      category: 'history',
      difficulty: 'medium',
    },
  });
  console.log('✅ Created trivia:', trivia1.code);

  const trivia2 = await prisma.puzzle.create({
    data: {
      code: 'TRIVIA-002',
      type: 'trivia',
      title: 'Science Trivia',
      question: 'What is the chemical symbol for Gold?',
      answer: 'Au',
      choices: JSON.stringify(['Go', 'Gd', 'Au', 'Ag']),
      explanation: 'The chemical symbol for gold is Au, from its Latin name "Aurum".',
      points: 15,
      category: 'science',
      difficulty: 'medium',
    },
  });
  console.log('✅ Created trivia:', trivia2.code);

  const trivia3 = await prisma.puzzle.create({
    data: {
      code: 'TRIVIA-003',
      type: 'trivia',
      title: 'Geography Trivia',
      question: 'Which is the largest country by area?',
      answer: 'Russia',
      choices: JSON.stringify(['Canada', 'Russia', 'China', 'United States']),
      explanation: 'Russia is the largest country in the world, spanning over 17 million square kilometers.',
      points: 15,
      category: 'geography',
      difficulty: 'easy',
    },
  });
  console.log('✅ Created trivia:', trivia3.code);

  const trivia4 = await prisma.puzzle.create({
    data: {
      code: 'TRIVIA-004',
      type: 'trivia',
      title: 'Literature Trivia',
      question: 'Who wrote "Romeo and Juliet"?',
      answer: 'William Shakespeare',
      choices: JSON.stringify(['Jane Austen', 'William Shakespeare', 'Charles Dickens', 'George Bernard Shaw']),
      explanation: 'William Shakespeare wrote "Romeo and Juliet" early in his career, and it remains one of his most famous works.',
      points: 10,
      category: 'literature',
      difficulty: 'easy',
    },
  });
  console.log('✅ Created trivia:', trivia4.code);

  const trivia5 = await prisma.puzzle.create({
    data: {
      code: 'TRIVIA-005',
      type: 'trivia',
      title: 'Space Trivia',
      question: 'Which planet is closest to the Sun?',
      answer: 'Mercury',
      choices: JSON.stringify(['Venus', 'Mercury', 'Earth', 'Mars']),
      explanation: 'Mercury is the smallest and closest planet to the Sun in our solar system.',
      points: 12,
      category: 'science',
      difficulty: 'easy',
    },
  });
  console.log('✅ Created trivia:', trivia5.code);

  const trivia6 = await prisma.puzzle.create({
    data: {
      code: 'TRIVIA-006',
      type: 'trivia',
      title: 'Sports Trivia',
      question: 'How many players are on a basketball court for one team during a game?',
      answer: '5',
      choices: JSON.stringify(['3', '5', '7', '10']),
      explanation: 'A basketball team has 5 players on the court at a time during a regulation game.',
      points: 10,
      category: 'sports',
      difficulty: 'easy',
    },
  });
  console.log('✅ Created trivia:', trivia6.code);

  const trivia7 = await prisma.puzzle.create({
    data: {
      code: 'TRIVIA-007',
      type: 'trivia',
      title: 'Technology Trivia',
      question: 'What does HTML stand for?',
      answer: 'HyperText Markup Language',
      choices: JSON.stringify(['Home Tool Markup Language', 'HyperText Markup Language', 'High Tech Modern Language', 'Home Text Markup Logic']),
      explanation: 'HTML stands for HyperText Markup Language and is the standard markup language for creating web pages.',
      points: 15,
      category: 'technology',
      difficulty: 'medium',
    },
  });
  console.log('✅ Created trivia:', trivia7.code);

  const trivia8 = await prisma.puzzle.create({
    data: {
      code: 'TRIVIA-008',
      type: 'trivia',
      title: 'Biology Trivia',
      question: 'How many bones are in the human body?',
      answer: '206',
      choices: JSON.stringify(['186', '206', '226', '246']),
      explanation: 'An adult human body typically has 206 bones. Babies are born with more bones, but some fuse together as they grow.',
      points: 15,
      category: 'science',
      difficulty: 'medium',
    },
  });
  console.log('✅ Created trivia:', trivia8.code);

  // ═══════════════════════════════════════════════════════════
  // SAMPLE PLAYERS
  // ═══════════════════════════════════════════════════════════

  const player1 = await prisma.player.create({
    data: {
      name: 'Alex the Brave',
      score: 150,
    },
  });
  console.log('✅ Created player:', player1.name);

  const player2 = await prisma.player.create({
    data: {
      name: 'Sarah Explorer',
      score: 135,
    },
  });
  console.log('✅ Created player:', player2.name);

  const player3 = await prisma.player.create({
    data: {
      name: 'Jordan Quest',
      score: 120,
    },
  });
  console.log('✅ Created player:', player3.name);

  // ═══════════════════════════════════════════════════════════
  // SAMPLE SUBMISSIONS (Completed puzzles)
  // ═══════════════════════════════════════════════════════════

  await prisma.submission.create({
    data: {
      playerId: player1.id,
      puzzleId: puzzle1.id,
      correct: true,
      attempts: 1,
      timeSpent: 45,
    },
  });

  await prisma.submission.create({
    data: {
      playerId: player1.id,
      puzzleId: trivia1.id,
      correct: true,
      attempts: 1,
      timeSpent: 30,
    },
  });

  await prisma.submission.create({
    data: {
      playerId: player2.id,
      puzzleId: puzzle2.id,
      correct: true,
      attempts: 2,
      timeSpent: 60,
    },
  });

  await prisma.submission.create({
    data: {
      playerId: player2.id,
      puzzleId: trivia3.id,
      correct: true,
      attempts: 1,
      timeSpent: 25,
    },
  });

  console.log('✅ Created sample submissions');

  // Ensure app settings exist
  try {
    await prisma.appSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { leaderboardVisible: true },
    });
    console.log('✅ Ensured AppSettings');
  } catch (e) {
    console.log('⚠️ Could not create AppSettings (maybe already exists)');
  }

  try {
    await prisma.gameHub.upsert({
      where: { code: 'WELCOME2026' },
      update: {
        name: 'Welcome Week Hub',
        enabledGames: JSON.stringify(['trivia', 'puzzle']),
        triviaEnabled: true,
        puzzleEnabled: true,
      },
      create: {
        name: 'Welcome Week Hub',
        code: 'WELCOME2026',
        enabledGames: JSON.stringify(['trivia', 'puzzle']),
        triviaEnabled: true,
        puzzleEnabled: true,
      },
    });
    console.log('✅ Ensured default Game Hub: WELCOME2026');
  } catch (e) {
    console.log('⚠️ Could not create default Game Hub');
  }

  // Default trivia categories
  const defaultCategories = ['Geography', 'Egyptian Trivia', 'Memory Challenge', 'Movies & TV', 'Sports Trivia'];
  for (const name of defaultCategories) {
    try {
      await prisma.triviaCategory.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      console.log('✅ Ensured category:', name);
    } catch {}
  }

  // Sample PhotoPuzzle
  try {
    await prisma.photoPuzzle.create({
      data: {
        title: 'Mysterious Campus Clock',
        imageUrl: '/puzzles/clock.jpg',
        question: 'What time is the clock showing?',
        answer: '3:15',
        points: 15,
        active: true,
      },
    });
    console.log('✅ Created sample PhotoPuzzle');
  } catch {}

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✨ Database seeding completed successfully!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('📊 Summary:');
  console.log(`  • Created 5 Puzzles (riddles)`);
  console.log(`  • Created 8 Trivia Questions (multiple choice)`);
  console.log(`  • Created 3 Sample Players`);
  console.log(`  • Created 4 Sample Submissions`);
  console.log('');
  console.log('🚀 Ready to start your quest!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
