import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, TrendingUp, BookOpen, ChevronRight, Zap } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { lessons, getLevelColor, getLevelLabel, getSubLevelColor, SUB_LEVELS, SUB_LEVEL_META } from '../data/lessons'
import { getLevelInfo } from '../data/badges'
import BottomNav from '../components/BottomNav'

const LEVEL_ORDER = ['beginner', 'intermediate', 'advanced']
const LEVEL_EMOJI = { beginner: '🌱', intermediate: '🌿', advanced: '🌳' }

export default function Home() {
  const navigate        = useNavigate()
  const { streak, completedLessons, gaps, user, xp } = useAppStore()
  const levelInfo = getLevelInfo(xp || 0)

  const nextLesson    = lessons.find((l) => !completedLessons.includes(l.id)) || lessons[0]
  const totalSessions = completedLessons.length
  const topGaps       = gaps.slice(0, 3)

  const greetingHour = new Date().getHours()
  const greeting     = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="app-shell flex flex-col min-h-screen bg-app-bg pb-36">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm">{greeting} 👋</p>
            <h1 className="text-2xl font-bold text-slate-800 mt-0.5">
              Feyn<span className="text-gradient">Learn</span>
            </h1>
          </div>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 bg-app-card border border-orange-300 rounded-2xl px-4 py-2"
          >
            <Flame size={18} className="text-orange-500" fill="currentColor" />
            <span className="text-slate-800 font-bold text-lg">{streak}</span>
            <span className="text-slate-500 text-xs">days</span>
          </motion.div>
        </div>
      </div>

      {/* ── XP Bar ──────────────────────────────────────────────── */}
      <div className="px-6 mb-4">
        <div className="bg-app-card border border-app-border rounded-2xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{levelInfo.current.emoji}</span>
              <span className="text-slate-800 font-semibold text-sm">{levelInfo.current.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap size={13} className="text-blue-600" />
              <span className="text-blue-600 font-bold text-sm">{xp || 0} XP</span>
              {levelInfo.next && <span className="text-slate-400 text-xs">/ {levelInfo.next.minXP}</span>}
            </div>
          </div>
          <div className="h-2 bg-app-border rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.progress}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
          {levelInfo.next && (
            <p className="text-slate-400 text-xs mt-1.5 text-right">{levelInfo.xpToNext} XP to {levelInfo.next.name}</p>
          )}
        </div>
      </div>

      <div className="px-6 space-y-5">
        {/* ── Stats row ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <StatCard value={streak}        label="Streak"   icon={<Flame    size={15} className="text-orange-500" />} />
          <StatCard value={totalSessions} label="Sessions" icon={<BookOpen size={15} className="text-blue-500"   />} />
          <StatCard value={gaps.length}   label="Gaps"     icon={<TrendingUp size={15} className="text-cyan-600" />} />
        </motion.div>

        {/* ── Daily Challenge ─────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Next Up</p>
          <button
            onClick={() => navigate(`/lesson/${nextLesson.id}`)}
            className="w-full bg-app-card border border-app-border rounded-3xl p-5 text-left relative overflow-hidden group hover:border-blue-400 transition-all"
          >
            <div className="absolute top-0 right-0 w-28 h-28 gradient-primary opacity-8 rounded-full translate-x-8 -translate-y-8 group-hover:opacity-15 transition-opacity" />
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-app-surface flex items-center justify-center text-3xl flex-shrink-0">
                {nextLesson.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <LevelBadge level={nextLesson.level} />
                  <span className="text-slate-400 text-xs">{nextLesson.estimatedMinutes} min</span>
                </div>
                <p className="text-slate-800 font-bold text-base truncate">{nextLesson.title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{nextLesson.category}</p>
              </div>
              <div className="gradient-primary rounded-xl p-2.5 glow-purple flex-shrink-0">
                <ChevronRight size={18} className="text-white" />
              </div>
            </div>
          </button>
        </motion.div>

        {/* ── Gaps Tracker ────────────────────────────────────────── */}
        {topGaps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Your Top Gaps</p>
            <div className="bg-app-card border border-app-border rounded-2xl divide-y divide-app-border overflow-hidden">
              {topGaps.map((gap, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center">
                      <span className="text-rose-500 text-xs font-bold">{gap.count}x</span>
                    </div>
                    <span className="text-slate-700 text-sm capitalize">{gap.concept}</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(gap.count, 5) }).map((_, j) => (
                      <div key={j} className="w-1.5 h-3 rounded-full bg-rose-400" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/practice')}
              className="mt-2 w-full py-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Zap size={15} /> Practice These Gaps
            </button>
          </motion.div>
        )}

        {/* ── Lessons by Level ────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Lessons</p>
            <button onClick={() => navigate('/lessons')} className="text-blue-500 text-xs font-medium">See all →</button>
          </div>
          <div className="space-y-5">
            {LEVEL_ORDER.map((level) => {
              const c = getLevelColor(level)
              const levelLessons = lessons.filter((l) => l.level === level)
              const doneCnt = levelLessons.filter((l) => completedLessons.includes(l.id)).length
              const pct = levelLessons.length ? Math.round((doneCnt / levelLessons.length) * 100) : 0

              const subGroups = SUB_LEVELS
                .filter((s) => SUB_LEVEL_META[s].parent === level)
                .map((s) => ({ sl: s, items: levelLessons.filter((l) => l.subLevel === s) }))
                .filter((g) => g.items.length > 0)

              return (
                <div key={level}>
                  {/* Level header */}
                  <div className={`rounded-2xl bg-gradient-to-r ${c.gradient} border ${c.border} px-4 py-3 mb-2`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{LEVEL_EMOJI[level]}</span>
                        <p className={`font-bold text-sm ${c.text}`}>{getLevelLabel(level)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-slate-500 text-xs">{doneCnt}/{levelLessons.length}</p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.dot} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {/* Sub-level groups */}
                  {subGroups.map(({ sl, items }) => {
                    const sc = getSubLevelColor(sl)
                    const meta = SUB_LEVEL_META[sl]
                    return (
                      <div key={sl} className="mb-3">
                        <div className="flex items-center gap-2 mb-1.5 pl-1">
                          <span className={`${sc.bg} ${sc.text} text-xs font-bold px-2 py-0.5 rounded-md border ${sc.border}`}>
                            {meta.label}
                          </span>
                          <span className="text-slate-400 text-xs">{meta.desc}</span>
                        </div>
                        <div className="space-y-2">
                          {items.map((lesson) => {
                            const done = completedLessons.includes(lesson.id)
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => navigate(`/lesson/${lesson.id}`)}
                                className={`w-full flex items-center gap-3 bg-app-card border rounded-2xl px-4 py-3 text-left transition-all ${
                                  done ? 'border-emerald-200' : 'border-app-border hover:border-blue-300'
                                }`}
                              >
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                                  done ? 'bg-emerald-50' : 'bg-app-surface'
                                }`}>
                                  {lesson.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-slate-800 text-sm font-semibold truncate">{lesson.title}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-slate-400 text-xs">{lesson.category}</span>
                                    <span className="text-slate-300 text-xs">·</span>
                                    <span className="text-slate-400 text-xs">{lesson.estimatedMinutes} min</span>
                                  </div>
                                </div>
                                {done
                                  ? <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                      <span className="text-emerald-500 text-xs font-bold">✓</span>
                                    </div>
                                  : <ChevronRight size={15} className="text-slate-400 flex-shrink-0" />
                                }
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* spacer so last card is never hidden behind the fixed nav */}
        <div className="h-32" />
      </div>

      <BottomNav />
    </div>
  )
}

function StatCard({ value, label, icon }) {
  return (
    <div className="bg-app-card border border-app-border rounded-2xl p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-slate-800 font-bold text-xl">{value}</p>
      <p className="text-slate-500 text-xs">{label}</p>
    </div>
  )
}

function LevelBadge({ level }) {
  const c = getLevelColor(level)
  return (
    <span className={`${c.bg} ${c.text} text-xs px-2 py-0.5 rounded-full font-medium`}>
      {getLevelLabel(level)}
    </span>
  )
}
