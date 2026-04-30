export const SUB_LEVELS = ['a1','a2','a3','b1','b2','b3','c1','c2','c3']

export const SUB_LEVEL_META = {
  a1: { label: 'A1', parent: 'beginner',     desc: 'Absolute Beginner'  },
  a2: { label: 'A2', parent: 'beginner',     desc: 'Elementary'         },
  a3: { label: 'A3', parent: 'beginner',     desc: 'Pre-Intermediate'   },
  b1: { label: 'B1', parent: 'intermediate', desc: 'Lower Intermediate' },
  b2: { label: 'B2', parent: 'intermediate', desc: 'Intermediate'       },
  b3: { label: 'B3', parent: 'intermediate', desc: 'Upper Intermediate' },
  c1: { label: 'C1', parent: 'advanced',     desc: 'Lower Advanced'     },
  c2: { label: 'C2', parent: 'advanced',     desc: 'Advanced'           },
  c3: { label: 'C3', parent: 'advanced',     desc: 'Near-Native'        },
}

export const lessons = [
  // ══════════════════════════════════════════════════════════════════════════
  // BEGINNER  A1 — Absolute Beginner
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 1,
    level: 'beginner',
    subLevel: 'a1',
    category: 'Daily Life',
    title: 'Morning Routine',
    icon: '☀️',
    estimatedMinutes: 15,
    content: `Sarah wakes up at 7 AM every day. She brushes her teeth, takes a shower, and makes coffee. Then she eats breakfast — usually toast with eggs. Before leaving for work, she checks her phone for messages. She takes the subway to the office and arrives at 9 AM.`,
    keyPoints: [
      'wakes up at 7 AM',
      'brushes teeth and showers',
      'eats breakfast (toast and eggs)',
      'checks phone before work',
      'takes the subway to the office',
    ],
    vocabulary: ['wakes up', 'brushes her teeth', 'subway', 'arrives'],
  },
  {
    id: 2,
    level: 'beginner',
    subLevel: 'a2',
    category: 'Social',
    title: 'At the Coffee Shop',
    icon: '☕',
    estimatedMinutes: 15,
    content: `Tom goes to his favorite coffee shop every morning. He orders a large black coffee and a croissant. The barista knows his name and his order by heart. Tom sits by the window, reads the news on his phone, and prepares for his day. He leaves a tip before he goes.`,
    keyPoints: [
      'goes to coffee shop every morning',
      'orders large black coffee and croissant',
      'barista knows his name',
      'sits by the window and reads news',
      'leaves a tip',
    ],
    vocabulary: ['orders', 'barista', 'by heart', 'tip'],
  },
  {
    id: 3,
    level: 'beginner',
    subLevel: 'a3',
    category: 'Social',
    title: 'Meeting a Friend',
    icon: '👋',
    estimatedMinutes: 15,
    content: `Lisa and Anna haven't seen each other in two months. They meet at a park and hug. Anna asks how Lisa's new job is going. Lisa says it's stressful but exciting. They walk together for an hour, talking and laughing. Before leaving, they make plans to have dinner next week.`,
    keyPoints: [
      "haven't seen each other for two months",
      'meet at a park',
      "Lisa's new job is stressful but exciting",
      'walk and talk for an hour',
      'make plans for dinner next week',
    ],
    vocabulary: ['stressful', 'exciting', 'make plans', 'hug'],
  },
  {
    id: 4,
    level: 'beginner',
    subLevel: 'a1',
    category: 'Daily Life',
    title: 'Grocery Shopping',
    icon: '🛒',
    estimatedMinutes: 15,
    content: `Every Sunday, Mark goes to the supermarket to buy food for the week. He makes a list before he goes so he doesn't forget anything. He buys vegetables, fruit, chicken, bread, and milk. At the checkout, he pays with his credit card. He always tries to spend less than fifty dollars.`,
    keyPoints: [
      'goes every Sunday',
      'makes a list beforehand',
      'buys vegetables, fruit, chicken, bread, milk',
      'pays with credit card',
      'budget of fifty dollars',
    ],
    vocabulary: ['supermarket', 'checkout', 'credit card', 'budget'],
  },

  // ─── INTERMEDIATE ────────────────────────────────────────────────────────
  {
    id: 5,
    level: 'intermediate',
    subLevel: 'b2',
    category: 'Work',
    title: 'Job Interview',
    icon: '💼',
    estimatedMinutes: 20,
    content: `Daniel had a job interview at a tech company yesterday. He wore a suit, arrived fifteen minutes early, and brought extra copies of his résumé. The interviewer asked about his previous experience and his greatest weakness. Daniel said his weakness was taking on too many projects at once, but that he was actively working on prioritizing better. At the end, he asked about the team culture. He thinks it went well.`,
    keyPoints: [
      'wore a suit and arrived early',
      'brought extra résumé copies',
      'asked about experience and weaknesses',
      'weakness: taking on too many projects',
      'asked about team culture',
    ],
    vocabulary: ['résumé', 'interviewer', 'weakness', 'prioritizing'],
  },
  {
    id: 6,
    level: 'intermediate',
    subLevel: 'b3',
    category: 'Travel',
    title: 'Planning a Trip',
    icon: '✈️',
    estimatedMinutes: 20,
    content: `Rachel and her husband are planning a trip to Japan for their anniversary. They want to visit Tokyo, Kyoto, and Osaka. Rachel is researching hostels and local food spots, while her husband handles the flights and train passes. They have a budget of two thousand dollars each. The hardest part is deciding what to leave out because there's too much to see in two weeks.`,
    keyPoints: [
      'trip to Japan for anniversary',
      'visiting Tokyo, Kyoto, Osaka',
      'Rachel researches accommodation and food',
      'husband handles flights and trains',
      'budget of $2,000 each, two-week trip',
    ],
    vocabulary: ['anniversary', 'researching', 'budget', 'accommodation'],
  },
  {
    id: 7,
    level: 'intermediate',
    subLevel: 'b1',
    category: 'Health',
    title: 'Building Healthy Habits',
    icon: '🏃',
    estimatedMinutes: 20,
    content: `Dr. Patel explains that small, consistent habits are more powerful than dramatic lifestyle changes. Instead of starting a strict diet, she recommends adding one vegetable to every meal. Instead of joining a gym, she suggests walking ten minutes a day and slowly increasing. She says the key is making the habit so small that it's impossible to skip. After three months, these tiny changes become automatic.`,
    keyPoints: [
      'small consistent habits beat dramatic changes',
      'add one vegetable to every meal',
      'start with 10 minutes of walking',
      'make habits so small they are impossible to skip',
      'after 3 months habits become automatic',
    ],
    vocabulary: ['consistent', 'dramatic', 'lifestyle', 'automatic'],
  },
  {
    id: 8,
    level: 'intermediate',
    subLevel: 'b3',
    category: 'Society',
    title: 'City vs. Countryside',
    icon: '🌆',
    estimatedMinutes: 20,
    content: `More young people are moving from rural areas to big cities in search of better jobs and opportunities. However, many of them struggle with the high cost of living, noise, and lack of community. Some eventually move back to smaller towns, bringing urban skills with them. Experts say the ideal solution might be developing smaller cities with good infrastructure and internet access.`,
    keyPoints: [
      'young people move to cities for jobs',
      'struggle with high cost and noise',
      'some return to smaller towns',
      'bring urban skills back',
      'developing smaller cities as a solution',
    ],
    vocabulary: ['rural', 'infrastructure', 'community', 'urban'],
  },

  // ─── ADVANCED ────────────────────────────────────────────────────────────
  {
    id: 9,
    level: 'advanced',
    subLevel: 'c1',
    category: 'Technology',
    title: 'The Impact of AI',
    icon: '🤖',
    estimatedMinutes: 25,
    content: `Artificial intelligence is reshaping industries faster than any previous technology. While it automates repetitive tasks — freeing humans for more creative work — it also raises serious questions about job displacement and economic inequality. Some economists argue that AI will create more jobs than it eliminates, much like the industrial revolution. Others warn that without deliberate policy intervention, the benefits will be concentrated among a few wealthy corporations, while the workforce bears the costs.`,
    keyPoints: [
      'AI reshapes industries rapidly',
      'automates repetitive tasks',
      'raises questions about job displacement',
      'some say it creates more jobs (like industrial revolution)',
      'risk of wealth concentration without policy intervention',
    ],
    vocabulary: ['displacement', 'inequality', 'intervention', 'workforce'],
  },
  {
    id: 10,
    level: 'advanced',
    subLevel: 'c1',
    category: 'Society',
    title: 'Work-Life Balance',
    icon: '⚖️',
    estimatedMinutes: 25,
    content: `The concept of work-life balance has evolved significantly over the past decade. With smartphones and remote work, the boundary between professional and personal time has become increasingly blurred. Research consistently shows that overworked employees are less productive and more prone to burnout. Progressive companies are experimenting with four-day workweeks, finding that output remains constant or improves. The challenge is cultural: many workplaces still equate long hours with dedication, despite evidence to the contrary.`,
    keyPoints: [
      'work-life balance evolved significantly',
      'smartphones blur professional and personal time',
      'overwork leads to lower productivity and burnout',
      'four-day workweeks show constant or better output',
      'cultural challenge: equating hours with dedication',
    ],
    vocabulary: ['blurred', 'burnout', 'progressive', 'equate'],
  },
  {
    id: 11,
    level: 'advanced',
    subLevel: 'c2',
    category: 'Environment',
    title: 'Climate Change Action',
    icon: '🌍',
    estimatedMinutes: 25,
    content: `Scientists agree that keeping global warming below 1.5°C requires immediate and unprecedented changes to energy, transportation, and agriculture. Individual actions — like reducing meat consumption and flying less — matter but are insufficient alone. Structural changes, including carbon pricing, renewable energy subsidies, and international agreements, are essential. Critics argue that focusing on personal responsibility distracts from holding large corporations accountable, which produce the majority of global emissions.`,
    keyPoints: [
      'need to stay below 1.5°C warming',
      'requires changes in energy, transport, agriculture',
      'individual actions matter but are insufficient',
      'need structural changes and carbon pricing',
      'critics: personal responsibility distracts from corporate accountability',
    ],
    vocabulary: ['unprecedented', 'subsidies', 'emissions', 'accountability'],
  },
  {
    id: 12,
    level: 'advanced',
    subLevel: 'c2',
    category: 'Education',
    title: 'The Future of Learning',
    icon: '🎓',
    estimatedMinutes: 25,
    content: `Traditional education systems were designed for an industrial era that no longer exists. Critics argue they prioritize memorization over critical thinking, compliance over creativity, and standardized testing over genuine understanding. Online platforms have democratized access to knowledge, but completion rates for free courses remain below 10%, suggesting that access alone isn't enough. The future of learning may lie in hybrid models — combining self-directed exploration with human mentorship, immediate feedback, and real-world application.`,
    keyPoints: [
      'education systems designed for industrial era',
      'prioritize memorization over critical thinking',
      'online platforms democratized access',
      'free course completion rates below 10%',
      'future: hybrid models with mentorship and feedback',
    ],
    vocabulary: ['democratized', 'compliance', 'standardized', 'hybrid'],
  },

  // ─── SCIENCE ─────────────────────────────────────────────────────────────
  {
    id: 13,
    type: 'text',
    level: 'intermediate',
    subLevel: 'b1',
    category: 'Science',
    title: 'Why We Dream',
    icon: '🌙',
    estimatedMinutes: 20,
    content: `Scientists still debate why humans dream, but several theories exist. One popular idea is that dreams help the brain process emotions and consolidate memories from the day. During REM sleep, the brain replays experiences, strengthening important neural connections and discarding unnecessary information. Another theory suggests dreams allow us to simulate threatening scenarios safely, preparing us to respond in real life. Some researchers believe dreams are simply random brain activity that the mind tries to turn into a story.`,
    keyPoints: [
      'scientists still debate why we dream',
      'dreams may help process emotions and consolidate memories',
      'REM sleep: brain replays experiences',
      'dreams simulate threatening scenarios safely',
      'some think dreams are random brain activity made into stories',
    ],
    vocabulary: ['consolidate', 'REM sleep', 'neural connections', 'simulate'],
  },
  {
    id: 14,
    type: 'text',
    level: 'advanced',
    subLevel: 'c2',
    category: 'Science',
    title: 'Black Holes Explained',
    icon: '🌑',
    estimatedMinutes: 25,
    content: `A black hole forms when a massive star collapses under its own gravity after running out of fuel. The gravitational pull becomes so extreme that nothing — not even light — can escape beyond a boundary called the event horizon. Time itself slows down near a black hole due to the extreme curvature of spacetime, as predicted by Einstein's theory of general relativity. Supermassive black holes, millions of times larger than the Sun, are believed to exist at the center of most galaxies, including our own Milky Way.`,
    keyPoints: [
      'black holes form from collapsed massive stars',
      'nothing escapes beyond the event horizon — not even light',
      'time slows down near black holes (general relativity)',
      'supermassive black holes at center of most galaxies',
      'Milky Way has one too',
    ],
    vocabulary: ['event horizon', 'gravitational pull', 'spacetime', 'supermassive'],
  },

  // ─── BUSINESS ────────────────────────────────────────────────────────────
  {
    id: 15,
    type: 'text',
    level: 'intermediate',
    subLevel: 'b2',
    category: 'Business',
    title: 'Negotiation Tactics',
    icon: '🤝',
    estimatedMinutes: 20,
    content: `Effective negotiation is less about winning and more about finding an agreement both sides can accept. Skilled negotiators begin by understanding what the other party truly wants — not just their stated position, but their underlying interests. A key tactic is anchoring: the first number mentioned in a negotiation tends to influence the final outcome. Active listening signals respect and often reveals information that changes the negotiator's strategy. The best deals leave both parties feeling they gained something valuable.`,
    keyPoints: [
      'negotiation is about mutual agreement, not winning',
      'understand the other party\'s underlying interests',
      'anchoring: first number influences the final result',
      'active listening reveals useful information',
      'best deals make both sides feel they won',
    ],
    vocabulary: ['anchoring', 'underlying interests', 'mutual', 'strategy'],
  },
  {
    id: 16,
    type: 'text',
    level: 'intermediate',
    subLevel: 'b3',
    category: 'Business',
    title: 'The Gig Economy',
    icon: '📱',
    estimatedMinutes: 20,
    content: `The gig economy refers to a labor market where workers take on short-term contracts or freelance work instead of permanent jobs. Platforms like Uber, Airbnb, and Fiverr have made it easier than ever to find flexible work. Workers appreciate the autonomy — choosing when and how much they work. However, gig workers often lack benefits like health insurance, paid vacation, and job security. Critics argue that companies use this model to avoid responsibilities toward workers, while supporters say it creates unprecedented economic freedom.`,
    keyPoints: [
      'gig economy: short-term contracts instead of permanent jobs',
      'Uber, Airbnb, Fiverr are examples',
      'workers value flexibility and autonomy',
      'lack of benefits: health insurance, vacation, security',
      'debate: exploitation vs. economic freedom',
    ],
    vocabulary: ['freelance', 'autonomy', 'unprecedented', 'labor market'],
  },

  // ─── CULTURE ─────────────────────────────────────────────────────────────
  {
    id: 17,
    type: 'text',
    level: 'intermediate',
    subLevel: 'b2',
    category: 'Culture',
    title: 'Hollywood vs. Bollywood',
    icon: '🎬',
    estimatedMinutes: 20,
    content: `Hollywood and Bollywood are the two largest film industries in the world. Hollywood, based in Los Angeles, is known for its massive budgets, special effects, and global distribution. Bollywood, centered in Mumbai, produces more films annually and reaches a vast audience across South Asia and the Indian diaspora worldwide. While Hollywood often focuses on individual heroes, Bollywood films traditionally celebrate family, community, and emotion — frequently featuring elaborate song and dance sequences. Both industries are increasingly influencing each other in terms of storytelling and style.`,
    keyPoints: [
      'Hollywood (LA) and Bollywood (Mumbai) are the two largest film industries',
      'Bollywood produces more films annually',
      'Hollywood: big budgets, special effects, global reach',
      'Bollywood: family, community, song and dance',
      'both industries increasingly influence each other',
    ],
    vocabulary: ['diaspora', 'elaborate', 'distribution', 'annually'],
  },

  // ─── NEWS / VIDEO ─────────────────────────────────────────────────────────
  {
    id: 18,
    type: 'video',
    level: 'intermediate',
    subLevel: 'b3',
    category: 'Science',
    title: 'The Feynman Technique',
    icon: '🧪',
    estimatedMinutes: 20,
    videoUrl: 'https://www.youtube.com/watch?v=_f-qkGJBPts',
    content: 'Watch this short video about the Feynman learning technique and how to apply it to understand anything faster.',
    keyPoints: [
      'the Feynman technique has 4 steps',
      'choose a concept and explain it simply',
      'identify gaps where you cannot explain',
      'review and simplify until a child could understand',
      'the technique works for any subject',
    ],
    vocabulary: ['technique', 'concept', 'simplify', 'identify gaps'],
  },
  {
    id: 19,
    type: 'video',
    level: 'beginner',
    subLevel: 'a2',
    category: 'Daily Life',
    title: 'How to Start a Conversation',
    icon: '💬',
    estimatedMinutes: 15,
    videoUrl: 'https://www.youtube.com/watch?v=bQVEMz9GwRY',
    content: 'Watch this video about starting conversations in English and the key phrases and strategies used.',
    keyPoints: [
      'use open-ended questions to start conversations',
      'show genuine interest in the other person',
      'common small talk topics: weather, work, weekend plans',
      'listen actively and build on what they say',
      'ending a conversation politely',
    ],
    vocabulary: ['open-ended', 'genuine', 'small talk', 'actively'],
  },

  // ── NEW  A1 ───────────────────────────────────────────────────────────────
  {
    id: 20,
    level: 'beginner',
    subLevel: 'a1',
    category: 'Daily Life',
    title: 'Numbers & Time',
    icon: '🔢',
    estimatedMinutes: 12,
    content: `Numbers and time are essential in everyday English. We use numbers to talk about age, price, address, and phone numbers. For time, we say "It's three o'clock" or "It's quarter past two." The twelve-hour clock uses AM for morning and PM for afternoon and night. Common phrases include: "What time is it?", "I'll be there at five", and "The store opens at nine AM." Knowing numbers one to one hundred and how to tell time helps in almost every situation.`,
    keyPoints: [
      'numbers used for age, price, address, phone',
      "telling time: o'clock, half past, quarter past/to",
      'AM = morning, PM = afternoon/night',
      "common phrases: What time is it? / I'll be there at...",
      'numbers 1–100 are essential for daily life',
    ],
    vocabulary: ["o'clock", 'quarter past', 'AM / PM', 'what time is it'],
  },

  // ── NEW  A2 ───────────────────────────────────────────────────────────────
  {
    id: 21,
    level: 'beginner',
    subLevel: 'a2',
    category: 'Daily Life',
    title: 'Describing Your Home',
    icon: '🏠',
    estimatedMinutes: 15,
    content: `Maria lives in a two-bedroom apartment in the city. The living room has a sofa, a coffee table, and a large window. The kitchen is small but has everything she needs: a refrigerator, a stove, and a microwave. Her bedroom is cozy with a bed, a wardrobe, and a desk where she studies. The building has an elevator and a parking lot. She pays rent every first of the month.`,
    keyPoints: [
      'two-bedroom apartment in the city',
      'living room: sofa, coffee table, large window',
      'kitchen: refrigerator, stove, microwave',
      'bedroom: bed, wardrobe, study desk',
      'building has elevator and parking',
    ],
    vocabulary: ['wardrobe', 'cozy', 'refrigerator', 'rent'],
  },

  // ── NEW  A3 ───────────────────────────────────────────────────────────────
  {
    id: 22,
    level: 'beginner',
    subLevel: 'a3',
    category: 'Work',
    title: 'Talking About Your Job',
    icon: '👔',
    estimatedMinutes: 15,
    content: `When meeting new people, talking about your job is very common. You can say: "I work as a teacher" or "I'm a software developer." It's polite to ask: "What do you do for a living?" You can describe your responsibilities: "I manage a team of five people" or "I help customers with their problems." If you don't like your job, you can say: "It pays well, but it's stressful." Many people separate their job from their career goals.`,
    keyPoints: [
      "I work as... / I'm a... (job titles)",
      "What do you do for a living? (polite question)",
      'describing responsibilities: I manage / I help',
      "it pays well but it's stressful (honest answer)",
      'difference between job and career',
    ],
    vocabulary: ['for a living', 'responsibilities', 'manage', 'stressful'],
  },
  {
    id: 23,
    level: 'beginner',
    subLevel: 'a3',
    category: 'Daily Life',
    title: 'Ordering at a Restaurant',
    icon: '🍽️',
    estimatedMinutes: 15,
    content: `Going to a restaurant in English requires some key phrases. When the waiter comes, you can say: "Can I see the menu, please?" To order, say: "I'll have the pasta" or "I'd like a glass of water." If you have questions, ask: "What does this dish come with?" or "Is this spicy?" When you're done, ask for the check: "Could we have the bill, please?" It's common to leave a tip of fifteen to twenty percent in the USA.`,
    keyPoints: [
      'Can I see the menu, please?',
      "I'll have... / I'd like... (ordering)",
      'What does this come with? / Is this spicy? (questions)',
      'Could we have the bill, please? (paying)',
      'tipping 15–20% is common in the USA',
    ],
    vocabulary: ['menu', 'bill', 'tip', 'dish'],
  },

  // ── NEW  B1 ───────────────────────────────────────────────────────────────
  {
    id: 24,
    level: 'intermediate',
    subLevel: 'b1',
    category: 'Travel',
    title: 'Using Public Transportation',
    icon: '🚌',
    estimatedMinutes: 18,
    content: `Public transportation is an affordable and eco-friendly way to get around a city. Most cities have buses, metro systems, and sometimes trams. To use the metro, you buy a ticket or tap a travel card at the turnstile. Buses usually have a fixed route number displayed at the front. If you're unsure, you can ask a fellow passenger: "Does this bus go to the city center?" Many transit apps show real-time arrivals and suggest the fastest route. Always validate your ticket to avoid fines.`,
    keyPoints: [
      'public transport: buses, metro, trams',
      'tap a travel card at the turnstile for metro',
      'buses show route number at the front',
      'ask: Does this bus go to...?',
      'validate your ticket to avoid fines',
    ],
    vocabulary: ['turnstile', 'validate', 'route', 'real-time'],
  },

  // ── NEW  C1 ───────────────────────────────────────────────────────────────
  {
    id: 25,
    level: 'advanced',
    subLevel: 'c1',
    category: 'Society',
    title: 'Social Media & Mental Health',
    icon: '📲',
    estimatedMinutes: 25,
    content: `A growing body of research links heavy social media use to increased rates of anxiety, depression, and loneliness — particularly among teenagers. Platforms are designed to maximize engagement through variable reward mechanisms, similar to slot machines, triggering dopamine releases with every like or notification. However, causality is debated: are unhappy people drawn to social media, or does social media make people unhappy? Some studies show that passive scrolling is more harmful than active interaction. Digital literacy advocates argue the solution lies not in banning platforms but in teaching critical consumption habits from an early age.`,
    keyPoints: [
      'heavy social media use linked to anxiety, depression, loneliness',
      'platforms use variable reward mechanisms like slot machines',
      'causality debate: does it cause unhappiness or attract unhappy people?',
      'passive scrolling more harmful than active interaction',
      'solution: teach critical consumption from an early age',
    ],
    vocabulary: ['variable reward', 'dopamine', 'causality', 'digital literacy'],
  },

  // ── NEW  C2 ───────────────────────────────────────────────────────────────
  {
    id: 26,
    level: 'advanced',
    subLevel: 'c2',
    category: 'Science',
    title: 'The Ethics of Gene Editing',
    icon: '🧬',
    estimatedMinutes: 25,
    content: `CRISPR-Cas9 technology allows scientists to edit DNA with unprecedented precision, opening doors to curing genetic diseases and hereditary conditions. In 2018, a Chinese researcher created the first gene-edited babies, sparking global outrage. Proponents argue that eliminating diseases like cystic fibrosis is a moral imperative. Critics warn of a slippery slope toward designer babies, genetic inequality between rich and poor, and irreversible changes to the human germline. Most scientific bodies now call for a moratorium on heritable human genome editing until society establishes clearer ethical frameworks.`,
    keyPoints: [
      'CRISPR allows precise DNA editing',
      'potential: cure genetic diseases and hereditary conditions',
      '2018: first gene-edited babies caused global outrage',
      'risk: designer babies and genetic inequality',
      'most bodies call for a moratorium on heritable editing',
    ],
    vocabulary: ['CRISPR', 'germline', 'moratorium', 'heritable'],
  },

  // ── NEW  C3 ───────────────────────────────────────────────────────────────
  {
    id: 27,
    level: 'advanced',
    subLevel: 'c3',
    category: 'Society',
    title: 'The Philosophy of Free Will',
    icon: '🧠',
    estimatedMinutes: 30,
    content: `The question of whether humans possess genuine free will has occupied philosophers for millennia. Hard determinists argue every decision is the inevitable result of prior causes — neurons firing according to physical laws leave no room for genuine choice. Compatibilists like Daniel Dennett contend that free will is compatible with determinism: what matters is whether actions stem from one's own desires, unconstrained by external coercion. Neuroscience adds complexity: Libet's experiments showed brain activity preceding conscious awareness of a decision by hundreds of milliseconds, suggesting decisions may be post-hoc rationalizations. The debate has profound implications for moral responsibility and punishment.`,
    keyPoints: [
      'hard determinism: every decision is causally inevitable',
      'compatibilism (Dennett): free will compatible with determinism',
      'Libet experiments: brain acts before conscious decision',
      'decisions may be post-hoc rationalizations',
      'implications for moral responsibility and punishment',
    ],
    vocabulary: ['determinism', 'compatibilism', 'causality', 'post-hoc rationalization'],
  },
  {
    id: 28,
    level: 'advanced',
    subLevel: 'c3',
    category: 'Business',
    title: 'Behavioral Economics',
    icon: '📊',
    estimatedMinutes: 30,
    content: `Classical economics assumes people are rational actors who maximize utility with perfect information. Behavioral economics, pioneered by Kahneman and Tversky, demonstrates that humans are systematically irrational. We suffer from loss aversion — losses feel twice as painful as equivalent gains feel pleasurable. The anchoring effect means our judgments are disproportionately influenced by the first number we encounter. Governments use "nudge theory" to improve public health and savings rates by redesigning default choices without restricting freedom. These insights have transformed marketing, public policy, and our understanding of human decision-making.`,
    keyPoints: [
      'classical economics assumes rational actors — behavioral econ disproves this',
      'loss aversion: losses feel 2x more painful than equivalent gains',
      'anchoring: first number disproportionately influences judgment',
      'status quo bias: people default to inertia',
      'nudge theory: redesigning defaults improves behavior without mandates',
    ],
    vocabulary: ['loss aversion', 'anchoring', 'choice architecture', 'nudge theory'],
  },
  {
    id: 29,
    level: 'advanced',
    subLevel: 'c3',
    category: 'Culture',
    title: 'Language Shapes Thought',
    icon: '💬',
    estimatedMinutes: 30,
    content: `The Sapir-Whorf hypothesis proposes that the language we speak influences — or even determines — how we think and perceive the world. Strong versions claim speakers of different languages literally inhabit different cognitive realities. Research supports the weaker form: Russian speakers, who have distinct words for light and dark blue, distinguish shades faster than English speakers. The Pirahã tribe in Brazil, whose language lacks number words beyond two, struggle with large quantity tasks. These findings challenge the universality of human cognition and raise questions about whether translation between languages is ever truly complete.`,
    keyPoints: [
      'Sapir-Whorf: language influences or determines thought',
      'strong version: different languages = different cognitive realities',
      'weak version: language shapes habitual patterns',
      'Russian blue example: distinct words = faster color discrimination',
      'Pirahã: no number words beyond 2 → difficulty with large quantities',
    ],
    vocabulary: ['Sapir-Whorf hypothesis', 'cognition', 'habitual', 'universality'],
  },
]

export const getLessonById = (id) => lessons.find((l) => l.id === Number(id))

export const getLevelColor = (level) => {
  const map = {
    beginner:     { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200', gradient: 'from-emerald-50' },
    intermediate: { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500',   border: 'border-amber-200',   gradient: 'from-amber-50'   },
    advanced:     { bg: 'bg-rose-100',     text: 'text-rose-700',    dot: 'bg-rose-500',    border: 'border-rose-200',    gradient: 'from-rose-50'    },
  }
  return map[level] || map.beginner
}

export const getSubLevelColor = (subLevel) => {
  const map = {
    a1: { bg: 'bg-emerald-50',  text: 'text-emerald-600', border: 'border-emerald-200' },
    a2: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
    a3: { bg: 'bg-emerald-200', text: 'text-emerald-800', border: 'border-emerald-400' },
    b1: { bg: 'bg-amber-50',    text: 'text-amber-600',   border: 'border-amber-200'   },
    b2: { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-300'   },
    b3: { bg: 'bg-amber-200',   text: 'text-amber-800',   border: 'border-amber-400'   },
    c1: { bg: 'bg-rose-50',     text: 'text-rose-600',    border: 'border-rose-200'    },
    c2: { bg: 'bg-rose-100',    text: 'text-rose-700',    border: 'border-rose-300'    },
    c3: { bg: 'bg-rose-200',    text: 'text-rose-800',    border: 'border-rose-400'    },
  }
  return map[subLevel] || map.a1
}

export const getSubLevelLabel = (subLevel) => subLevel?.toUpperCase() || ''

export const getLevelLabel = (level) => {
  const map = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }
  return map[level] || level
}

export const getContentTypeInfo = (type) => {
  const map = {
    text:   { icon: '📄', label: 'Text',   color: 'text-blue-600',  bg: 'bg-blue-100'   },
    video:  { icon: '🎥', label: 'Video',  color: 'text-rose-600',  bg: 'bg-rose-100'   },
    audio:  { icon: '🎧', label: 'Audio',  color: 'text-cyan-700',  bg: 'bg-cyan-100'   },
    custom: { icon: '✏️', label: 'Custom', color: 'text-blue-600',  bg: 'bg-blue-100'   },
  }
  return map[type] || map.text
}

export const CATEGORIES = [
  'All', 'Daily Life', 'Social', 'Work', 'Travel', 'Health',
  'Society', 'Technology', 'Science', 'Business', 'Culture', 'Education', 'Environment',
]

export function extractYouTubeId(url) {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return match ? match[1] : null
}
