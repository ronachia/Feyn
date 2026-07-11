import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, TrendingUp, BookOpen, ChevronRight, Zap, RotateCcw, X, Play, Brain, PenLine, RefreshCw } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { getLevelColor, getLevelLabel } from '../data/lessonHelpers'
import useLessons from '../hooks/useLessons'
import { getLevelInfo } from '../data/badges'
import BottomNav from '../components/BottomNav'
import useSRS from '../hooks/useSRS'

export default function Home() {
  const navigate        = useNavigate()
  const { streak, completedLessons, gaps, user, xp } = useAppStore()
  const { lessons } = useLessons()
  const levelInfo = getLevelInfo(xp || 0)

  const nextLesson    = lessons.find((l) => !completedLessons.includes(l.id)) || lessons[0]
  const totalSessions = completedLessons.length
  const topGaps       = gaps.slice(0, 3)
  const { dueForReview } = useSRS()

  const greetingHour = new Date().getHours()
  const greeting     = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening'

  const [methodCardVisible, setMethodCardVisible] = useState(
    () => localStorage.getItem('feynman-intro-dismissed') !== 'true'
  )
  const dismissMethodCard = () => {
    localStorage.setItem('feynman-intro-dismissed', 'true')
    setMethodCardVisible(false)
  }

  return (
    <div className="app-shell flex flex-col min-h-screen bg-app-bg pb-48">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm">{greeting} 👋</p>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight">
              Feyn<span className="text-gradient">Learn</span>
            </h1>
          </div>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-2 shadow-sm"
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
              <span className="text-blue-600 font-bold text-sm tabular-nums">{xp || 0} XP</span>
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
            className="w-full bg-app-card border border-app-border rounded-3xl p-5 text-left relative overflow-hidden group hover:border-blue-400 hover:shadow-md active:scale-[0.99] transition-all duration-200"
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

        {/* ── SRS Review Due ──────────────────────────────────────── */}
        {dueForReview.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">
              🔁 Review Due ({dueForReview.length})
            </p>
            <div className="bg-app-card border border-amber-200 rounded-2xl divide-y divide-app-border overflow-hidden">
              {dueForReview.map(({ lesson, daysSinceLast, clarityScore, urgency }) => (
                <button
                  key={lesson.id}
                  onClick={() => navigate(`/lesson/${lesson.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-50/40 active:scale-[0.99] transition-all"
                >
                  <span className="text-xl flex-shrink-0">{lesson.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 text-sm font-semibold truncate">{lesson.title}</p>
                    <p className="text-gray-400 text-xs">
                      Last: {daysSinceLast === 0 ? 'today' : `${daysSinceLast}d ago`} · Clarity {clarityScore}/10
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                    urgency > 1.5
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    <RotateCcw size={11} />
                    {urgency > 1.5 ? 'Overdue' : 'Due'}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Feynman Method Card ─────────────────────────────────── */}
        <AnimatePresence>
          {methodCardVisible && (
            <motion.div
              key="method-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 overflow-hidden">
                {/* dismiss */}
                <button
                  onClick={dismissMethodCard}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <X size={13} className="text-white" />
                </button>

                {/* decorative blobs */}
                <div className="absolute -bottom-4 -right-4 w-28 h-28 bg-white/10 rounded-full" />
                <div className="absolute -top-6 -left-6 w-20 h-20 bg-white/10 rounded-full" />

                <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Why it works</p>
                <h3 className="text-white font-extrabold text-base mb-3 leading-snug">
                  The Feynman Technique — learn by teaching
                </h3>

                <div className="space-y-2 mb-4">
                  {[
                    { icon: <BookOpen size={13} />, text: 'Read — absorb a concept deeply' },
                    { icon: <PenLine  size={13} />, text: 'Explain — teach it in plain words' },
                    { icon: <Brain    size={13} />, text: 'AI feedback — spot your gaps instantly' },
                    { icon: <RefreshCw size={13}/>, text: 'Review — reinforce what you missed' },
                  ].map(({ icon, text }, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white flex-shrink-0">
                        {icon}
                      </div>
                      <p className="text-white/90 text-xs">{text}</p>
                    </div>
                  ))}
                </div>

                <a
                  href="https://youtu.be/tkm0TNFzIeg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                >
                  <Play size={12} fill="currentColor" /> Watch 4-min intro
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Course Progress Card ────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <button
            onClick={() => navigate('/lessons')}
            className="w-full bg-app-card border border-app-border rounded-3xl p-5 text-left hover:border-blue-300 hover:shadow-sm active:scale-[0.99] transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-800 font-bold text-sm">Course Progress</p>
              <span className="text-blue-500 text-xs font-semibold flex items-center gap-1">
                Browse all <ChevronRight size={13} />
              </span>
            </div>

            {/* Per-level bars */}
            <div className="space-y-2.5">
              {[
                { level: 'beginner',     emoji: '🌱', label: 'Beginner'     },
                { level: 'intermediate', emoji: '🌿', label: 'Intermediate' },
                { level: 'advanced',     emoji: '🌳', label: 'Advanced'     },
              ].map(({ level, emoji, label }) => {
                const c       = getLevelColor(level)
                const lvl     = lessons.filter((l) => l.level === level)
                const done    = lvl.filter((l) => completedLessons.includes(l.id)).length
                const pct     = lvl.length ? Math.round((done / lvl.length) * 100) : 0
                return (
                  <div key={level}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-600 text-xs flex items-center gap-1.5">
                        {emoji} {label}
                      </span>
                      <span className="text-slate-400 text-xs tabular-nums">{done}/{lvl.length}</span>
                    </div>
                    <div className="h-1.5 bg-app-border rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.dot} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-slate-400 text-xs mt-3">
              {completedLessons.length} of {lessons.length} lessons completed
            </p>
          </button>
        </motion.div>

        <div className="h-8" />
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
