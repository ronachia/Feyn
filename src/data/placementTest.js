export const PLACEMENT_QUESTIONS = [
  // A1
  {
    id: 1,
    level: 'a1',
    question: 'Choose the correct sentence:',
    options: [
      'She work in a hospital.',
      'She works in a hospital.',
      'She working in a hospital.',
      'She is work in a hospital.',
    ],
    answer: 'She works in a hospital.',
    explanation: 'Third person singular (she/he/it) needs -s in simple present.',
  },
  // A2
  {
    id: 2,
    level: 'a2',
    question: 'Fill in the blank: "Yesterday I _____ to the supermarket."',
    options: ['go', 'went', 'goes', 'going'],
    answer: 'went',
    explanation: '"Yesterday" signals past tense. The past of "go" is "went".',
  },
  // A2
  {
    id: 3,
    level: 'a2',
    question: 'Which sentence is correct?',
    options: [
      'I have 25 years old.',
      'I am 25 years old.',
      'I got 25 years old.',
      'I is 25 years old.',
    ],
    answer: 'I am 25 years old.',
    explanation: 'In English we say "I am ... years old", not "I have".',
  },
  // B1
  {
    id: 4,
    level: 'b1',
    question: '"If I had more time, I _____ travel more." Choose the correct form:',
    options: ['will', 'would', 'can', 'am going to'],
    answer: 'would',
    explanation: 'This is the second conditional (hypothetical): If + past simple → would + infinitive.',
  },
  // B1
  {
    id: 5,
    level: 'b1',
    question: 'Which word best completes the sentence? "She was completely _____ by the news."',
    options: ['shock', 'shocking', 'shocks', 'shocked'],
    answer: 'shocked',
    explanation: '"Shocked" (past participle used as adjective) describes a person\'s feeling.',
  },
  // B2
  {
    id: 6,
    level: 'b2',
    question: 'Choose the sentence with the correct use of the present perfect:',
    options: [
      'I have seen that movie last week.',
      'I saw that movie since Monday.',
      'I have seen that movie three times.',
      'I have seen that movie yesterday.',
    ],
    answer: 'I have seen that movie three times.',
    explanation: 'Present perfect is used for experiences without a specific past time reference.',
  },
  // B2
  {
    id: 7,
    level: 'b2',
    question: '"Despite _____ tired, she finished the project." Choose the correct form:',
    options: ['be', 'been', 'being', 'was'],
    answer: 'being',
    explanation: 'After "despite" and "in spite of", use the -ing form (gerund).',
  },
  // C1
  {
    id: 8,
    level: 'c1',
    question: 'Which sentence uses a subjunctive correctly?',
    options: [
      'The manager suggested that he takes a break.',
      'The manager suggested that he take a break.',
      'The manager suggested that he will take a break.',
      'The manager suggested that he took a break.',
    ],
    answer: 'The manager suggested that he take a break.',
    explanation: 'Subjunctive mood is used after "suggest/recommend/insist that": base form without -s.',
  },
  // C1
  {
    id: 9,
    level: 'c1',
    question: 'What does "the powers that be" mean?',
    options: [
      'People who are very powerful physically',
      'The authorities or people in charge',
      'Supernatural forces',
      'Financial institutions',
    ],
    answer: 'The authorities or people in charge',
    explanation: '"The powers that be" is an idiom meaning those who hold authority.',
  },
  // C2
  {
    id: 10,
    level: 'c2',
    question: 'Choose the most precise and natural sentence:',
    options: [
      'The policy\'s ramifications are yet to be fully appraised.',
      'The policy\'s ramifications are still not completely evaluated.',
      'The policy\'s effects are not yet fully understood.',
      'We don\'t know all the effects of the policy.',
    ],
    answer: 'The policy\'s ramifications are yet to be fully appraised.',
    explanation: '"Ramifications" (complex consequences) and "appraised" (formally assessed) show C2 mastery.',
  },
]

// Given a list of correct answer IDs, determine the user's level
export function calculatePlacementLevel(correctIds) {
  const levelMap = { a1: 0, a2: 0, b1: 0, b2: 0, c1: 0, c2: 0 }
  correctIds.forEach((id) => {
    const q = PLACEMENT_QUESTIONS.find((q) => q.id === id)
    if (q) levelMap[q.level]++
  })

  const total = correctIds.length
  const score = total / PLACEMENT_QUESTIONS.length

  // Determine CEFR sub-level
  if (levelMap.c2 >= 1) return { subLevel: 'c2', level: 'advanced' }
  if (levelMap.c1 >= 1) return { subLevel: 'c1', level: 'advanced' }
  if (levelMap.b2 >= 2) return { subLevel: 'b3', level: 'intermediate' }
  if (levelMap.b2 >= 1) return { subLevel: 'b2', level: 'intermediate' }
  if (levelMap.b1 >= 2) return { subLevel: 'b2', level: 'intermediate' }
  if (levelMap.b1 >= 1) return { subLevel: 'b1', level: 'intermediate' }
  if (levelMap.a2 >= 2) return { subLevel: 'a3', level: 'beginner' }
  if (levelMap.a2 >= 1) return { subLevel: 'a2', level: 'beginner' }
  return { subLevel: 'a1', level: 'beginner' }
}
