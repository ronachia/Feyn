import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Users, BookOpen, Zap, Target } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts'
import { callEdgeFunction } from '../../services/supabase'

const PERIODS = [{ label: '7d', days: 7 }, { label: '30d', days: 30 }, { label: '90d', days: 90 }]

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-app-card border border-app-border rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-gray-500 text-xs">{label}</p>
        <p className="text-slate-800 font-bold text-xl">{value ?? '—'}</p>
      </div>
    </div>
  )
}

export default function AdminAnalytics() {
  const navigate = useNavigate()
  const [days, setDays]       = useState(30)
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await callEdgeFunction('get-analytics', { days })
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [days])

  const ec = data?.eventCounts || {}
  const started   = ec['lesson_started']   || 0
  const completed = ec['lesson_completed'] || 0
  const completionRate = started > 0 ? Math.round((completed / started) * 100) : null

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-app-bg border-b border-app-border px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/admin')} className="w-9 h-9 rounded-full bg-app-card flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-400" />
        </button>
        <h1 className="text-slate-800 font-bold text-lg flex-1">Analytics</h1>
        <div className="flex gap-1 bg-app-card border border-app-border rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                days === p.days ? 'gradient-primary text-white' : 'text-gray-500'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button onClick={load} className="w-9 h-9 rounded-full bg-app-card flex items-center justify-center">
          <RefreshCw size={15} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="px-6 py-5 space-y-6 pb-16">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
            <p className="text-rose-400 text-sm">{error}</p>
          </div>
        )}

        {loading && !data ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
        ) : data && (
          <>
            {/* ── Stat Cards ────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Users}    label="Total Users"    value={data.totalUsers}                           color="bg-blue-500"    />
              <StatCard icon={BookOpen} label="Lessons Started" value={started}                                  color="bg-emerald-500" />
              <StatCard icon={Target}  label="Completion Rate" value={completionRate != null ? `${completionRate}%` : '—'} color="bg-amber-500"   />
              <StatCard icon={Zap}     label="AI Pass Rate"    value={data.passRate != null ? `${data.passRate}%` : '—'} color="bg-purple-500"  />
            </div>

            {/* ── DAU Chart ─────────────────────────────────────── */}
            {data.dau?.length > 0 && (
              <div className="bg-app-card border border-app-border rounded-2xl p-4">
                <p className="text-slate-800 font-semibold text-sm mb-4">Daily Active Users</p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={data.dau} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip formatter={(v) => [v, 'Users']} labelFormatter={(l) => l} />
                    <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ── Lesson Funnel ─────────────────────────────────── */}
            <div className="bg-app-card border border-app-border rounded-2xl p-4">
              <p className="text-slate-800 font-semibold text-sm mb-4">Learning Funnel</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart
                  data={[
                    { name: 'Started',    value: started },
                    { name: 'Analyzed',   value: (ec['analysis_requested'] || 0) },
                    { name: 'Passed',     value: (ec['analysis_passed']    || 0) },
                    { name: 'Completed',  value: completed },
                  ]}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ── Top Lessons ───────────────────────────────────── */}
            {data.topLessons?.length > 0 && (
              <div className="bg-app-card border border-app-border rounded-2xl p-4">
                <p className="text-slate-800 font-semibold text-sm mb-3">Top Lessons</p>
                <div className="space-y-2">
                  {data.topLessons.slice(0, 6).map((l, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-gray-400 text-xs w-5 text-right">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-gray-700 text-xs truncate">{l.title}</span>
                          <span className="text-gray-500 text-xs ml-2 flex-shrink-0">{l.started} starts · {l.completed} done</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${l.started > 0 ? Math.round((l.completed / l.started) * 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Top Gaps ──────────────────────────────────────── */}
            {data.topGaps?.length > 0 && (
              <div className="bg-app-card border border-app-border rounded-2xl p-4">
                <p className="text-slate-800 font-semibold text-sm mb-3">Most Common Gaps</p>
                <div className="space-y-1.5">
                  {data.topGaps.map((g, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-app-border last:border-0">
                      <span className="text-gray-700 text-xs">{g.gap}</span>
                      <span className="text-purple-500 text-xs font-semibold">{g.count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
