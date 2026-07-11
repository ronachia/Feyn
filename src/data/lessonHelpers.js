/**
 * lessonHelpers.js — funções utilitárias e constantes de lições.
 * Sem dados de lições — esses vêm do Supabase via useLessons().
 */

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

export const CATEGORIES = [
  'All', 'Daily Life', 'Social', 'Work', 'Travel', 'Health',
  'Society', 'Technology', 'Science', 'Business', 'Culture', 'Education', 'Environment',
]

export const getLevelColor = (level) => {
  const map = {
    beginner:     { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200', gradient: 'from-emerald-50' },
    intermediate: { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500',   border: 'border-amber-200',   gradient: 'from-amber-50'   },
    advanced:     { bg: 'bg-rose-100',    text: 'text-rose-700',    dot: 'bg-rose-500',    border: 'border-rose-200',    gradient: 'from-rose-50'    },
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
    text:   { icon: '📄', label: 'Text',   color: 'text-blue-600',  bg: 'bg-blue-100'  },
    video:  { icon: '🎥', label: 'Video',  color: 'text-rose-600',  bg: 'bg-rose-100'  },
    audio:  { icon: '🎧', label: 'Audio',  color: 'text-cyan-700',  bg: 'bg-cyan-100'  },
    custom: { icon: '✏️', label: 'Custom', color: 'text-blue-600',  bg: 'bg-blue-100'  },
  }
  return map[type] || map.text
}

export function extractYouTubeId(url) {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([^&\n?#]+)/)
  return match ? match[1] : null
}
