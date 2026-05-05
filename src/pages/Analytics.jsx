import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, Calendar, Zap, Target, BookOpen, Award } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Area, AreaChart,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import useAppStore from '../store/useAppStore'
import BottomNav from '../components/BottomNav'

const CHART_COLORS = { clarity: '#1D4ED8', coverage: '#0891B2', bar: '#3B82F6' }

function StatCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue:    'bg-blue-50    border-blue-200    text-blue-600',
    cyan:    'bg-cyan-50    border-cyan-200    text-cyan-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber:   'bg-amber-50   border-amber-200   text-amber-700',
  }
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} />
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-slate-800 font-bold text-2xl">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-app-border rounded-xl px-3 py-2 text-xs shadow-md">
      <p className="text-slate-500 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function Analytics() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { sessionHistory, xp, completedLessons, streak, gaps } = useAppStore()

  const scoreTrend = useMemo(() => {
    return [...sessionHistory]
      .reverse()
      .slice(-12)
      .map((s, i) => ({
        name: `#${i + 1}`,
        [t('stats.clarity')]:  s.clarityScore  ?? 0,
        [t('stats.coverage')]: s.coverageScore ?? 0,
      }))
  }, [sessionHistory, t])

  const sessionsPerDay = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toDateString()
      const label = d.toLocaleDateString('en', { weekday: 'short' })
      const count = sessionHistory.filter((s) => new Date(s.date).toDateString() === key).length
      days.push({ name: label, Sessions: count })
    }
    return days
  }, [sessionHistory])

  const calendarDays = useMemo(() => {
    const days = []
    const activeDays = new Set(sessionHistory.map((s) => new Date(s.date).toDateString()))
    for (let i = 34; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({ date: d.toDateString(), active: activeDays.has(d.toDateString()) })
    }
    return days
  }, [sessionHistory])

  const avgClarity  = sessionHistory.length
    ? (sessionHistory.reduce((a, s) => a + (s.clarityScore  ?? 0), 0) / sessionHistory.length).toFixed(1)
    : '—'
  const avgCoverage = sessionHistory.length
    ? (sessionHistory.reduce((a, s) => a + (s.coverageScore ?? 0), 0) / sessionHistory.length).toFixed(1)
    : '—'
  const bestScore   = sessionHistory.length
    ? Math.max(...sessionHistory.map((s) => Math.round(((s.clarityScore ?? 0) + (s.coverageScore ?? 0)) / 2)))
    : '—'

  const hasData = sessionHistory.length > 0

  return (
    <div className="app-shell flex flex-col min-h-screen bg-app-bg pb-48">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-12 pb-6">
        <button onClick={() => navigate('/home')} className="w-9 h-9 rounded-full bg-app-card flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-400" />
        </button>
        <div>
          <h1 className="text-slate-800 font-bold text-xl">{t('stats.title')}</h1>
          <p className="text-gray-500 text-xs">{t('stats.subtitle')}</p>
        </div>
      </div>

      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-app-card flex items-center justify-center text-3xl">📊</div>
          <p className="text-slate-800 font-semibold">{t('stats.no_data')}</p>
          <button
            onClick={() => navigate('/lessons')}
            className="gradient-primary text-white px-6 py-3 rounded-2xl font-semibold glow-purple"
          >
            Start a Lesson →
          </button>
        </div>
      ) : (
        <div className="px-6 space-y-6">
          {/* Summary cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            <StatCard icon={BookOpen}   label={t('stats.sessions')}     value={sessionHistory.length}  color="blue" />
            <StatCard icon={Award}      label={t('stats.best_score')}   value={`${bestScore}/10`}      color="amber"  />
            <StatCard icon={TrendingUp} label={t('stats.avg_clarity')}  value={`${avgClarity}/10`}     color="cyan"   />
            <StatCard icon={Target}     label={t('stats.avg_coverage')} value={`${avgCoverage}/10`}    color="emerald"/>
          </motion.div>

          {/* Score Trend */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-app-card border border-app-border rounded-2xl p-4"
          >
            <p className="text-slate-800 font-semibold text-sm mb-4">{t('stats.score_trend')}</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={scoreTrend} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D0DCEF" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey={t('stats.clarity')}  stroke={CHART_COLORS.clarity}  strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey={t('stats.coverage')} stroke={CHART_COLORS.coverage} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 justify-center">
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded" style={{background: CHART_COLORS.clarity}} /><span className="text-gray-500 text-xs">{t('stats.clarity')}</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded" style={{background: CHART_COLORS.coverage}} /><span className="text-gray-500 text-xs">{t('stats.coverage')}</span></div>
            </div>
          </motion.div>

          {/* Sessions per day */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-app-card border border-app-border rounded-2xl p-4"
          >
            <p className="text-slate-800 font-semibold text-sm mb-4">{t('stats.sessions_per_day')}</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={sessionsPerDay} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D0DCEF" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Sessions" fill={CHART_COLORS.bar} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Consistency Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-app-card border border-app-border rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-800 font-semibold text-sm">{t('stats.consistency')}</p>
              <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                🔥 {streak} day{streak !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {calendarDays.map(({ date, active }) => (
                <div
                  key={date}
                  title={date}
                  className={`aspect-square rounded-md ${
                    active ? 'gradient-primary' : 'bg-app-border'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 mt-2">
              <div className="w-2.5 h-2.5 rounded-sm bg-app-border" /><span className="text-gray-600 text-xs">No session</span>
              <div className="w-2.5 h-2.5 rounded-sm gradient-primary" /><span className="text-gray-600 text-xs">Active</span>
            </div>
          </motion.div>

          {/* XP + Gaps summary */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="gradient-primary rounded-2xl p-4 glow-purple text-center">
              <Zap size={18} className="text-slate-800 mx-auto mb-1" />
              <p className="text-slate-800 font-bold text-2xl">{xp || 0}</p>
              <p className="text-blue-200 text-xs">Total XP</p>
            </div>
            <div className="bg-app-card border border-app-border rounded-2xl p-4 text-center">
              <p className="text-2xl mb-1">🎯</p>
              <p className="text-slate-800 font-bold text-2xl">{completedLessons.length}</p>
              <p className="text-gray-500 text-xs">Lessons done</p>
            </div>
          </motion.div>
        </div>
      )}

      <div className="h-32" />
      <BottomNav />
    </div>
  )
}
