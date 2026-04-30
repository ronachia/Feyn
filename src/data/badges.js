export const LEVELS = [
  { name: 'Novice',    emoji: '🌱', minXP: 0,    maxXP: 200  },
  { name: 'Explorer',  emoji: '🗺️',  minXP: 200,  maxXP: 500  },
  { name: 'Thinker',   emoji: '💭', minXP: 500,  maxXP: 1000 },
  { name: 'Explainer', emoji: '🎤', minXP: 1000, maxXP: 2000 },
  { name: 'Feynman',   emoji: '🧪', minXP: 2000, maxXP: 9999 },
]

export function getLevelInfo(xp = 0) {
  const current = [...LEVELS].reverse().find((l) => xp >= l.minXP) || LEVELS[0]
  const nextIdx  = LEVELS.indexOf(current) + 1
  const next     = LEVELS[nextIdx] || null
  const progress = next
    ? ((xp - current.minXP) / (next.minXP - current.minXP)) * 100
    : 100
  return { current, next, progress: Math.min(progress, 100), xpToNext: next ? next.minXP - xp : 0 }
}

export const BADGES = [
  {
    id:        'first_lesson',
    icon:      '🎓',
    name:      'First Step',
    desc:      'Complete your first lesson',
    condition: (s) => (s.completedLessons?.length || 0) >= 1,
  },
  {
    id:        'streak_3',
    icon:      '🔥',
    name:      'On Fire',
    desc:      '3-day streak',
    condition: (s) => (s.streak || 0) >= 3,
  },
  {
    id:        'streak_7',
    icon:      '💪',
    name:      'Unstoppable',
    desc:      '7-day streak',
    condition: (s) => (s.streak || 0) >= 7,
  },
  {
    id:        'no_peek_5',
    icon:      '🧠',
    name:      'No Peeking',
    desc:      'Complete 5 sessions without peeking',
    condition: (s) => (s.noPeekCount || 0) >= 5,
  },
  {
    id:        'clarity_9',
    icon:      '🎯',
    name:      'Crystal Clear',
    desc:      'Get clarity 9+ in 3 sessions',
    condition: (s) => (s.highClarityCount || 0) >= 3,
  },
  {
    id:        'gap_killer',
    icon:      '⚡',
    name:      'Gap Killer',
    desc:      'Fix 5 recurring gaps via exercises',
    condition: (s) => (s.fixedGaps || 0) >= 5,
  },
  {
    id:        'lessons_5',
    icon:      '📚',
    name:      'Bookworm',
    desc:      'Complete 5 lessons',
    condition: (s) => (s.completedLessons?.length || 0) >= 5,
  },
  {
    id:        'lessons_12',
    icon:      '🏆',
    name:      'Completionist',
    desc:      'Complete all 12 lessons',
    condition: (s) => (s.completedLessons?.length || 0) >= 12,
  },
  {
    id:        'xp_500',
    icon:      '⭐',
    name:      'Rising Star',
    desc:      'Reach 500 XP',
    condition: (s) => (s.xp || 0) >= 500,
  },
  {
    id:        'xp_2000',
    icon:      '🧪',
    name:      'The Feynman',
    desc:      'Reach 2000 XP — you think like Feynman',
    condition: (s) => (s.xp || 0) >= 2000,
  },
]
