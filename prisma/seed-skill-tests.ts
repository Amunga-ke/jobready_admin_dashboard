/**
 * Seed script for Skill Tests — 3 sample tests with real questions.
 *
 * Usage:
 *   cd /home/z/my-project/jobready_admin_dashboard
 *   npx tsx prisma/seed-skill-tests.ts
 *
 * Or via bun:
 *   bun run prisma/seed-skill-tests.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ─── 1. General Aptitude Test ───

const generalAptitudeTest = {
  title: "General Aptitude Test",
  description:
    "Assesses logical reasoning, numerical ability, and verbal comprehension. Suitable for entry-level and mid-level positions across all industries.",
  category: "GENERAL",
  durationMinutes: 15,
  passingScore: 60,
  pricePerCandidate: 50,
  questions: [
    {
      question:
        "If all roses are flowers, and some flowers fade quickly, can we conclude that some roses fade quickly?",
      questionType: "MULTIPLE_CHOICE",
      options: ["Yes, definitely", "No, not necessarily", "Only in winter", "It depends on the soil"],
      correctAnswer: "No, not necessarily",
      explanation:
        "This is a classic syllogism. The statement only says 'some flowers' fade quickly, not necessarily roses. Roses may or may not be part of that 'some'.",
      points: 1,
    },
    {
      question:
        "A train travels 120 km in 2 hours, then 180 km in 3 hours. What is the average speed for the entire journey?",
      questionType: "MULTIPLE_CHOICE",
      options: ["55 km/h", "60 km/h", "65 km/h", "75 km/h"],
      correctAnswer: "60 km/h",
      explanation:
        "Average speed = Total distance / Total time = (120 + 180) / (2 + 3) = 300 / 5 = 60 km/h.",
      points: 1,
    },
    {
      question:
        "What comes next in the series: 2, 6, 12, 20, 30, __?",
      questionType: "MULTIPLE_CHOICE",
      options: ["36", "40", "42", "44"],
      correctAnswer: "42",
      explanation:
        "The differences are: 4, 6, 8, 10... increasing by 2 each time. The next difference is 12, so 30 + 12 = 42. Alternatively, the pattern is n(n+1) for n=1,2,3,4,5,6: 1×2=2, 2×3=6, ..., 6×7=42.",
      points: 1,
    },
    {
      question: "Choose the word that is most nearly OPPOSITE in meaning to 'BENEVOLENT':",
      questionType: "MULTIPLE_CHOICE",
      options: ["Kind", "Generous", "Malevolent", "Charitable"],
      correctAnswer: "Malevolent",
      explanation:
        "Benevolent means well-meaning and kindly. Malevolent means having or showing ill will or desire to harm others — the direct opposite.",
      points: 1,
    },
    {
      question:
        "If it takes 5 machines 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?",
      questionType: "MULTIPLE_CHOICE",
      options: ["100 minutes", "5 minutes", "20 minutes", "1 minute"],
      correctAnswer: "5 minutes",
      explanation:
        "Each machine makes 1 widget in 5 minutes. So 100 machines working simultaneously will make 100 widgets in 5 minutes.",
      points: 1,
    },
    {
      question:
        "In a group of 60 people, 30 speak English, 25 speak Kiswahili, and 10 speak both languages. How many speak neither?",
      questionType: "MULTIPLE_CHOICE",
      options: ["5", "10", "15", "20"],
      correctAnswer: "15",
      explanation:
        "Using inclusion-exclusion: 30 + 25 - 10 = 45 speak at least one language. So 60 - 45 = 15 speak neither.",
      points: 1,
    },
    {
      question: "Choose the correctly spelled word:",
      questionType: "MULTIPLE_CHOICE",
      options: ["Accomodate", "Acommodate", "Accommodate", "Acomodate"],
      correctAnswer: "Accommodate",
      explanation:
        "The correct spelling is 'Accommodate' — it has double 'c' and double 'm'.",
      points: 1,
    },
    {
      question:
        "A shirt costs KES 500 after a 20% discount. What was the original price?",
      questionType: "MULTIPLE_CHOICE",
      options: ["KES 580", "KES 600", "KES 625", "KES 650"],
      correctAnswer: "KES 625",
      explanation:
        "If 500 = 80% of original price, then original = 500 / 0.80 = 625.",
      points: 1,
    },
    {
      question:
        "Which of the following is an assumption rather than an inference or observation?",
      questionType: "MULTIPLE_CHOICE",
      options: [
        "The sky is cloudy today",
        "It will probably rain this afternoon",
        "The barometer shows low pressure",
        "The wind is blowing from the east",
      ],
      correctAnswer: "It will probably rain this afternoon",
      explanation:
        "An assumption is something accepted as true without proof. Predicting rain based on clouds is an assumption (it might not rain). The other options are direct observations or instrument readings.",
      points: 1,
    },
    {
      question:
        "If you rearrange the letters 'CIFAIPC', you get the name of a(n):",
      questionType: "MULTIPLE_CHOICE",
      options: ["Country", "Ocean", "Animal", "City"],
      correctAnswer: "Ocean",
      explanation:
        "Rearranging 'CIFAIPC' gives 'PACIFIC' — the name of an ocean.",
      points: 1,
    },
  ],
};

// ─── 2. English Proficiency Test ───

const englishProficiencyTest = {
  title: "English Proficiency Test",
  description:
    "Evaluates grammar accuracy, vocabulary range, and reading comprehension. Designed for roles requiring strong written and verbal communication skills.",
  category: "ENGLISH",
  durationMinutes: 10,
  passingScore: 50,
  pricePerCandidate: 50,
  questions: [
    {
      question: "Choose the correct sentence:",
      questionType: "MULTIPLE_CHOICE",
      options: [
        "Neither the manager nor the employees was aware of the change.",
        "Neither the manager nor the employees were aware of the change.",
        "Neither the manager nor the employees has been aware of the change.",
        "Neither the manager nor the employees is aware of the change.",
      ],
      correctAnswer: "Neither the manager nor the employees were aware of the change.",
      explanation:
        'With "neither...nor", the verb agrees with the subject closest to it. "Employees" is plural, so we use "were".',
      points: 1,
    },
    {
      question:
        'What is the meaning of the idiom "to burn the midnight oil"?',
      questionType: "MULTIPLE_CHOICE",
      options: [
        "To waste energy on useless things",
        "To work or study late into the night",
        "To start a project very early",
        "To set fire to something important",
      ],
      correctAnswer: "To work or study late into the night",
      explanation:
        '"Burning the midnight oil" means staying up very late at night to work or study. It originates from the pre-electric era when people used oil lamps.',
      points: 1,
    },
    {
      question: "Complete the sentence: 'By the time the meeting started, the CEO ____ her presentation.'",
      questionType: "MULTIPLE_CHOICE",
      options: ["has finished", "had finished", "finishes", "finished"],
      correctAnswer: "had finished",
      explanation:
        'The past perfect tense ("had finished") is used for an action completed before another past action ("started").',
      points: 1,
    },
    {
      question: 'Choose the word that best fits: "The company\'s profits ____ dramatically due to the new marketing strategy."',
      questionType: "MULTIPLE_CHOICE",
      options: ["flourished", "soared", "escalated", "expanded"],
      correctAnswer: "soared",
      explanation:
        '"Soared" specifically describes a rapid, significant increase, often used with profits, prices, or statistics. "Flourished" is more about thriving; "escalated" often carries a negative connotation; "expanded" refers to growth in scope.',
      points: 1,
    },
    {
      question: 'Which word is a synonym for "meticulous"?',
      questionType: "MULTIPLE_CHOICE",
      options: ["Careless", "Thorough", "Hasty", "Vague"],
      correctAnswer: "Thorough",
      explanation:
        "Meticulous means showing great attention to detail and careful about every aspect. Thorough is the closest synonym among the choices.",
      points: 1,
    },
    {
      question:
        'Identify the error: "The team, along with their captain, are going to attend the conference next week."',
      questionType: "MULTIPLE_CHOICE",
      options: [
        '"along with their captain"',
        '"are going to"',
        '"attend the conference"',
        '"next week"',
      ],
      correctAnswer: '"are going to"',
      explanation:
        'The subject is "The team" (singular). The phrase "along with their captain" does not change the subject\'s number. It should be "is going to".',
      points: 1,
    },
    {
      question:
        "Read the passage and answer: 'Despite the economic challenges, Kenyan tech startups raised over $500 million in 2023, a significant increase from the previous year. However, most of this funding went to a few established companies.' What is the main idea?",
      questionType: "MULTIPLE_CHOICE",
      options: [
        "Tech startups in Kenya are struggling",
        "Funding increased but was concentrated in few companies",
        "Kenyan startups raised exactly $500 million",
        "Economic challenges stopped all tech investment",
      ],
      correctAnswer: "Funding increased but was concentrated in few companies",
      explanation:
        "The passage presents two facts: funding increased, but it was unevenly distributed. The key message is the contrast between overall growth and its concentration.",
      points: 1,
    },
    {
      question: 'Choose the correct form: "I wish I ____ harder for the exam."',
      questionType: "MULTIPLE_CHOICE",
      options: ["study", "studied", "had studied", "would study"],
      correctAnswer: "had studied",
      explanation:
        'With "wish" referring to a past situation, we use the past perfect. "I wish I had studied harder" expresses regret about not having studied enough in the past.',
      points: 1,
    },
  ],
};

// ─── 3. Basic IT Skills Test ───

const basicItSkillsTest = {
  title: "Basic IT Skills Test",
  description:
    "Tests fundamental computer knowledge, internet proficiency, email usage, and cybersecurity awareness. Ideal for non-technical roles that require digital literacy.",
  category: "TECHNICAL",
  durationMinutes: 20,
  passingScore: 60,
  pricePerCandidate: 50,
  questions: [
    {
      question: "What does the acronym 'URL' stand for?",
      questionType: "MULTIPLE_CHOICE",
      options: [
        "Universal Resource Locator",
        "Uniform Resource Locator",
        "Universal Reference Link",
        "Uniform Reference Locator",
      ],
      correctAnswer: "Uniform Resource Locator",
      explanation:
        "URL stands for Uniform Resource Locator. It is the address used to access resources on the internet.",
      points: 1,
    },
    {
      question:
        "Which of the following is the MOST secure password?",
      questionType: "MULTIPLE_CHOICE",
      options: [
        "password123",
        "MyDog2024",
        "Tr0ub4dor&3x!",
        "12345678",
      ],
      correctAnswer: "Tr0ub4dor&3x!",
      explanation:
        "A strong password includes uppercase and lowercase letters, numbers, and special characters. 'Tr0ub4dor&3x!' meets all these criteria with sufficient length and complexity.",
      points: 1,
    },
    {
      question: "What is the primary function of an operating system?",
      questionType: "MULTIPLE_CHOICE",
      options: [
        "To browse the internet",
        "To manage hardware and software resources",
        "To create documents",
        "To send emails",
      ],
      correctAnswer: "To manage hardware and software resources",
      explanation:
        "An operating system (like Windows, macOS, Linux) manages computer hardware, provides services for software, and serves as an interface between users and the machine.",
      points: 1,
    },
    {
      question:
        "You receive an email from your bank asking you to click a link and verify your account details. What should you do?",
      questionType: "MULTIPLE_CHOICE",
      options: [
        "Click the link immediately — it's from your bank",
        "Reply to the email asking for more information",
        "Don't click — contact the bank directly using their official number or website",
        "Forward it to your friends to warn them",
      ],
      correctAnswer: "Don't click — contact the bank directly using their official number or website",
      explanation:
        "This is a classic phishing attempt. Legitimate banks never ask for sensitive information via email links. Always verify by contacting the institution through official channels.",
      points: 1,
    },
    {
      question: "Which shortcut is used to copy text in most applications?",
      questionType: "MULTIPLE_CHOICE",
      options: ["Ctrl + V", "Ctrl + P", "Ctrl + C", "Ctrl + Z"],
      correctAnswer: "Ctrl + C",
      explanation:
        "Ctrl + C is the universal shortcut for Copy. Ctrl + V is Paste, Ctrl + P is Print, and Ctrl + Z is Undo.",
      points: 1,
    },
    {
      question: "What does 'HTTP' stand for?",
      questionType: "MULTIPLE_CHOICE",
      options: [
        "HyperText Transfer Protocol",
        "High Tech Transfer Protocol",
        "HyperText Transmission Process",
        "Hyper Transfer Text Protocol",
      ],
      correctAnswer: "HyperText Transfer Protocol",
      explanation:
        "HTTP stands for HyperText Transfer Protocol — the foundation of data communication on the World Wide Web. HTTPS adds a secure (SSL/TLS) layer.",
      points: 1,
    },
    {
      question:
        "Which of the following best describes a 'firewall' in computing?",
      questionType: "MULTIPLE_CHOICE",
      options: [
        "A physical barrier that prevents computer overheating",
        "Software or hardware that monitors and controls network traffic",
        "A type of computer virus",
        "A backup storage system",
      ],
      correctAnswer: "Software or hardware that monitors and controls network traffic",
      explanation:
        "A firewall is a security system that monitors and controls incoming and outgoing network traffic based on predetermined security rules, acting as a barrier between trusted and untrusted networks.",
      points: 1,
    },
    {
      question:
        "What is the difference between 'Save' and 'Save As' in most applications?",
      questionType: "MULTIPLE_CHOICE",
      options: [
        "There is no difference",
        "Save overwrites the current file; Save As lets you save to a new location/name",
        "Save As is only for images",
        "Save creates a backup; Save As deletes the original",
      ],
      correctAnswer: "Save overwrites the current file; Save As lets you save to a new location/name",
      explanation:
        "'Save' updates the existing file with current changes. 'Save As' opens a dialog to save the file with a new name, in a new location, or in a different format — creating a new file.",
      points: 1,
    },
    {
      question:
        "Which file format is commonly used for documents that need to look the same on all devices?",
      questionType: "MULTIPLE_CHOICE",
      options: [".docx", ".xlsx", ".pdf", ".txt"],
      correctAnswer: ".pdf",
      explanation:
        "PDF (Portable Document Format) preserves the exact layout, fonts, and formatting of a document across all devices and operating systems, making it ideal for sharing.",
      points: 1,
    },
    {
      question: "What is 'two-factor authentication' (2FA)?",
      questionType: "MULTIPLE_CHOICE",
      options: [
        "Using two different passwords for the same account",
        "A security method requiring two forms of verification (e.g., password + code)",
        "Logging in from two different devices simultaneously",
        "A way to create two different user accounts",
      ],
      correctAnswer: "A security method requiring two forms of verification (e.g., password + code)",
      explanation:
        "Two-factor authentication adds a second layer of security by requiring two different types of evidence: something you know (password) and something you have (phone/SMS code, authenticator app), making it much harder for attackers to gain access.",
      points: 1,
    },
  ],
};

async function seed() {
  console.log("🌱 Seeding skill tests...\n");

  // Check if tests already exist
  const existingCount = await db.skillTest.count();
  if (existingCount > 0) {
    console.log(
      `⚠️  Found ${existingCount} existing test(s). Skipping seed to avoid duplicates.`,
    );
    console.log('   Delete existing tests first if you want to re-seed.');
    return;
  }

  const tests = [generalAptitudeTest, englishProficiencyTest, basicItSkillsTest];

  for (const testData of tests) {
    const test = await db.skillTest.create({
      data: {
        title: testData.title,
        description: testData.description,
        category: testData.category,
        durationMinutes: testData.durationMinutes,
        passingScore: testData.passingScore,
        questionCount: testData.questions.length,
        isActive: true,
        pricePerCandidate: testData.pricePerCandidate,
        questions: {
          create: testData.questions.map((q, index) => ({
            question: q.question,
            questionType: q.questionType,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            sortOrder: index,
            points: q.points,
          })),
        },
      },
      include: { questions: true },
    });

    console.log(
      `✅ Created: "${test.title}" (${test.category}) — ${test.questions.length} questions, ${test.durationMinutes} min, ${test.passingScore}% pass`,
    );
  }

  console.log("\n🎉 All 3 skill tests seeded successfully!");
  const total = await db.skillTest.count();
  const totalQ = await db.skillTestQuestion.count();
  console.log(`   Total tests: ${total}`);
  console.log(`   Total questions: ${totalQ}`);
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
