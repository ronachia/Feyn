import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Plus, Trash2, ChevronRight } from 'lucide-react'
import { lessons, getLevelColor, getLevelLabel, getContentTypeInfo, getSubLevelColor, getSubLevelLabel, SUB_LEVELS, SUB_LEVEL_META } from '../data/lessons'
import useAppStore from '../store/useAppStore'
import BottomNav from '../components/BottomNav'

const LEVEL_ORDER  = ['beginner', 'intermediate', 'advanced']
const LEVEL_META   = {
  beginner:     { emoji: '🌱', desc: 'Build your foundation',  gradient: 'from-emerald-50 to-white' },
  intermediate: { emoji: '🌿', desc: 'Expand your expression', gradient: 'from-amber-50  to-white' },
  advanced:     { emoji: '🌳', desc: 'Refine to near-fluency', gradient: 'from-rose-50   to-white' },
}

function LessonCard({ lesson, done, onDelete, index }) {
  const navigate = useNavigate()
  const ct = getContentTypeInfo(lesson.type)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`bg-app-card border rounded-2xl overflow-hidden transition-all ${
        done ? 'border-emerald-500/25' : 'border-app-border hover:border-blue-500/35'
      }`}
    >
      <button
        onClick={() => navigate(`/lesson/${lesson.id}`)}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
          done ? 'bg-emerald-500/10' : 'bg-app-surface'
        }`}>
          {lesson.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-slate-800 font-semibold text-sm truncate">{lesson.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-gray-500 text-xs">{lesson.category}</span>
            {lesson.type && lesson.type !== 'text' && (
              <span className={`${ct.bg} ${ct.color} text-xs px-1.5 py-0.5 rounded-md font-medium`}>
                {ct.icon} {ct.label}
              </span>
            )}
            <span className="text-gray-600 text-xs">·</span>
            <span className="text-gray-500 text-xs">{lesson.estimatedMinutes} min</span>
          </div>
        </div>
        {done
          ? <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-400 text-xs font-bold">✓</span>
            </div>
          : <ChevronRight size={16} className="text-gray-600 flex-shrink-0" />
        }
      </button>
      {lesson.isCustom && (
        <div className="border-t border-app-border px-4 py-2 flex justify-end">
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 text-rose-400 text-xs"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )}
    </motion.div>
  )
}

function SubLevelGroup({ subLevel, lessonList, completedLessons, deleteCustomLesson, startIndex }) {
  const sc   = getSubLevelColor(subLevel)
  const meta = SUB_LEVEL_META[subLevel]
  const done = lessonList.filter((l) => completedLessons.includes(l.id)).length
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`${sc.bg} ${sc.text} text-xs font-bold px-2 py-0.5 rounded-lg border ${sc.border}`}>
          {meta.label}
        </span>
        <span className="text-slate-400 text-xs">{meta.desc}</span>
        <span className="ml-auto text-slate-400 text-xs">{done}/{lessonList.length}</span>
      </div>
      <div className="space-y-2">
        {lessonList.map((lesson, i) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            done={completedLessons.includes(lesson.id)}
            onDelete={() => deleteCustomLesson(lesson.id)}
            index={startIndex + i}
          />
        ))}
      </div>
    </div>
  )
}

function LevelSection({ level, lessonList, completedLessons, deleteCustomLesson, startIndex }) {
  const meta = LEVEL_META[level]
  const c    = getLevelColor(level)
  const done = lessonList.filter((l) => completedLessons.includes(l.id)).length
  const pct  = lessonList.length ? Math.round((done / lessonList.length) * 100) : 0

  // group by sub-level in order
  const subGroups = useMemo(() => {
    const map = {}
    lessonList.forEach((l) => {
      const k = l.subLevel || 'a1'
      if (!map[k]) map[k] = []
      map[k].push(l)
    })
    return SUB_LEVELS.filter((s) => SUB_LEVEL_META[s].parent === level && map[s]?.length).map((s) => ({ subLevel: s, items: map[s] }))
  }, [lessonList, level])

  return (
    <div className="mb-6">
      {/* Section header */}
      <div className={`rounded-2xl bg-gradient-to-r ${meta.gradient} border ${c.border} p-4 mb-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{meta.emoji}</span>
            <div>
              <p className={`font-bold text-sm ${c.text}`}>{getLevelLabel(level)}</p>
              <p className="text-slate-500 text-xs">{meta.desc}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-800 font-bold text-sm">{done}/{lessonList.length}</p>
            <p className="text-slate-400 text-xs">completed</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 bg-app-border rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${c.dot}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        </div>
      </div>

      {/* Sub-level groups */}
      {subGroups.map(({ subLevel, items }, gi) => (
        <SubLevelGroup
          key={subLevel}
          subLevel={subLevel}
          lessonList={items}
          completedLessons={completedLessons}
          deleteCustomLesson={deleteCustomLesson}
          startIndex={startIndex + subGroups.slice(0, gi).reduce((a, g) => a + g.items.length, 0)}
        />
      ))}
    </div>
  )
}

export default function LessonsList() {
  const navigate = useNavigate()
  const { completedLessons, customLessons, deleteCustomLesson, isPremium } = useAppStore()
  const [search, setSearch] = useState('')
  const [tab, setTab]       = useState('library')

  const sourceList = tab === 'library' ? lessons : customLessons

  const filtered = useMemo(() =>
    sourceList.filter((l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.category.toLowerCase().includes(search.toLowerCase())
    ),
  [sourceList, search])

  const grouped = useMemo(() => {
    const map = {}
    LEVEL_ORDER.forEach((lvl) => { map[lvl] = [] })
    filtered.forEach((l) => {
      const key = l.level || 'beginner'
      if (!map[key]) map[key] = []
      map[key].push(l)
    })
    return map
  }, [filtered])

  const showGrouped = tab === 'library' && !search

  return (
    <div className="app-shell flex flex-col min-h-screen bg-app-bg pb-36">
      {/* Header */}
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Lessons</h1>
            <p className="text-gray-500 text-xs mt-0.5">{lessons.length} lessons · {completedLessons.length} completed</p>
          </div>
          <button
            onClick={() => navigate(isPremium ? '/create' : '/pricing')}
            className="flex items-center gap-1.5 gradient-primary px-4 py-2 rounded-xl text-white text-sm font-semibold glow-purple"
          >
            <Plus size={15} /> Create
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-app-card border border-app-border rounded-2xl p-1 mb-4">
          {[['library', '📚 Library'], ['custom', '✏️ My Lessons']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === key ? 'gradient-primary text-white' : 'text-gray-500'
              }`}
            >
              {label}{key === 'custom' && customLessons.length > 0 ? ` (${customLessons.length})` : ''}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by title or topic…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-app-card border border-app-border rounded-2xl pl-10 pr-4 py-3 text-gray-700 text-sm placeholder-gray-600 focus:border-blue-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-5xl mb-4">{tab === 'custom' && !search ? '✏️' : '🔍'}</p>
            {tab === 'custom' && !search ? (
              <>
                <p className="text-slate-800 font-semibold mb-1">No custom lessons yet</p>
                <p className="text-gray-500 text-sm mb-4">Create a lesson from any text, video, or audio</p>
                <button
                  onClick={() => navigate(isPremium ? '/create' : '/pricing')}
                  className="gradient-primary px-6 py-3 rounded-2xl text-white font-semibold text-sm glow-purple"
                >
                  {isPremium ? '+ Create Lesson' : '👑 Upgrade to Create'}
                </button>
              </>
            ) : (
              <p className="text-gray-400 text-sm">No lessons found for "<span className="text-slate-800">{search}</span>"</p>
            )}
          </div>
        ) : showGrouped ? (
          // ── Grouped by level ─────────────────────────────────────
          LEVEL_ORDER.map((lvl, si) => {
            const list = grouped[lvl]
            if (!list?.length) return null
            const prevCount = LEVEL_ORDER.slice(0, si).reduce((a, k) => a + (grouped[k]?.length || 0), 0)
            return (
              <LevelSection
                key={lvl}
                level={lvl}
                lessonList={list}
                completedLessons={completedLessons}
                deleteCustomLesson={deleteCustomLesson}
                startIndex={prevCount}
              />
            )
          })
        ) : (
          // ── Flat list (search or custom tab) ─────────────────────
          <div className="space-y-2 pb-4">
            {filtered.map((lesson, i) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                done={completedLessons.includes(lesson.id)}
                onDelete={() => deleteCustomLesson(lesson.id)}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

      <div className="h-32" />
      <BottomNav />
    </div>
  )
}
