import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Eye, EyeOff, RotateCcw, ChevronRight } from 'lucide-react'

function ScoreBar({ value, max = 10, color }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-app-border rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="text-slate-800 font-bold text-sm w-6 text-right">{value}</span>
    </div>
  )
}

const TABS = [
  { id: 'scores',  label: '📊 Scores'  },
  { id: 'grammar', label: '✏️ Grammar' },
  { id: 'gaps',    label: '🎯 Gaps'    },
  { id: 'tips',    label: '💡 Tips'    },
]

export default function LessonFeedback({ feedback, onTryAgain, onComplete, onTeach, isPremium, fluency }) {
  const [tab, setTab]               = useState('scores')
  const [showSuggested, setShowSuggested] = useState(false)

  const grammarCount = feedback.grammarErrors?.length ?? 0
  const gapsCount    = (feedback.gaps?.length ?? 0) + (feedback.missedPoints?.length ?? 0)

  return (
    <div className="pt-2 space-y-4">
      <div>
        <h3 className="text-slate-800 font-bold text-lg mb-1">🤖 AI Feedback</h3>
        <p className="text-gray-400 text-sm">Here's exactly where you are and what to improve.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-app-card border border-app-border rounded-2xl p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              tab === t.id ? 'gradient-primary text-white' : 'text-gray-500'
            }`}
          >
            {t.label}
            {t.id === 'grammar' && grammarCount > 0 && (
              <span className="ml-1 bg-rose-500 text-white text-[10px] rounded-full px-1">{grammarCount}</span>
            )}
            {t.id === 'gaps' && gapsCount > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-[10px] rounded-full px-1">{gapsCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── SCORES TAB ──────────────────────────────────────────── */}
      {tab === 'scores' && (
        <div className="space-y-4">
          <div className="bg-app-card border border-app-border rounded-2xl p-4 space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-400 text-sm">Clarity</span>
                <span className="text-blue-400 text-xs font-medium">How simple &amp; clear</span>
              </div>
              <ScoreBar value={feedback.clarityScore} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-400 text-sm">Coverage</span>
                <span className="text-cyan-400 text-xs font-medium">Key points covered</span>
              </div>
              <ScoreBar value={feedback.coverageScore} color="bg-cyan-500" />
            </div>
          </div>

          {feedback.positiveNote && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircle size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <p className="text-emerald-300 text-sm">{feedback.positiveNote}</p>
            </div>
          )}

          {fluency && (
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-cyan-400 text-sm font-semibold">🎙️ Fluency Analysis</p>
                <span className="text-cyan-400 font-bold text-sm">{fluency.fluencyScore}/10</span>
              </div>
              {fluency.wpm && <p className="text-gray-400 text-xs">{fluency.pacingFeedback}</p>}
              {fluency.fillerCount > 0 && <p className="text-gray-500 text-xs">Filler words: {fluency.fillerCount}</p>}
              <p className="text-gray-600 text-xs">💡 {fluency.strength}</p>
            </div>
          )}
        </div>
      )}

      {/* ── GRAMMAR TAB ─────────────────────────────────────────── */}
      {tab === 'grammar' && (
        <div className="space-y-3">
          {grammarCount === 0 ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center">
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-emerald-400 font-semibold">No grammar errors!</p>
              <p className="text-gray-500 text-sm mt-1">Your English is on point.</p>
            </div>
          ) : (
            feedback.grammarErrors.map((err, i) => (
              <div key={i} className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle size={13} className="text-rose-400 flex-shrink-0" />
                  <span className="text-rose-400 text-xs line-through">"{err.error}"</span>
                  <span className="text-gray-500">→</span>
                  <span className="text-emerald-400 text-xs font-medium">"{err.correction}"</span>
                </div>
                <p className="text-gray-400 text-xs pl-5">{err.tip}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── GAPS TAB ────────────────────────────────────────────── */}
      {tab === 'gaps' && (
        <div className="space-y-4">
          {feedback.missedPoints?.length > 0 && (
            <div>
              <p className="text-amber-400 text-sm font-semibold mb-2 flex items-center gap-2">
                <AlertCircle size={15} /> Points You Missed
              </p>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-1">
                {feedback.missedPoints.map((pt, i) => (
                  <p key={i} className="text-amber-300 text-sm flex items-start gap-2">
                    <span className="mt-1 flex-shrink-0">•</span> {pt}
                  </p>
                ))}
              </div>
            </div>
          )}

          {feedback.gaps?.length > 0 && (
            <div>
              <p className="text-gray-400 text-sm font-semibold mb-2">🎯 Concepts to revisit</p>
              <div className="flex flex-wrap gap-2">
                {feedback.gaps.map((gap, i) => (
                  <span key={i} className="bg-blue-500/20 text-blue-300 text-xs px-3 py-1.5 rounded-full capitalize">
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {gapsCount === 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center">
              <p className="text-3xl mb-2">✨</p>
              <p className="text-emerald-400 font-semibold">No gaps detected!</p>
              <p className="text-gray-500 text-sm mt-1">You covered all the key points.</p>
            </div>
          )}
        </div>
      )}

      {/* ── TIPS TAB ────────────────────────────────────────────── */}
      {tab === 'tips' && (
        <div className="space-y-4">
          {feedback.simplificationTip && (
            <div className="bg-app-card border border-cyan-500/20 rounded-2xl p-4">
              <p className="text-cyan-400 text-sm font-semibold mb-1">💡 Simplify it</p>
              <p className="text-gray-600 text-sm">{feedback.simplificationTip}</p>
            </div>
          )}

          <div>
            <button
              onClick={() => setShowSuggested(!showSuggested)}
              className="flex items-center gap-2 text-blue-400 text-sm font-medium"
            >
              {showSuggested ? <EyeOff size={15} /> : <Eye size={15} />}
              {showSuggested ? 'Hide' : 'See'} Feynman model explanation
            </button>
            {showSuggested && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4"
              >
                <p className="text-gray-600 text-sm leading-relaxed">{feedback.suggestedExplanation}</p>
              </motion.div>
            )}
          </div>

          {!feedback.simplificationTip && !feedback.suggestedExplanation && (
            <div className="bg-app-card border border-app-border rounded-2xl p-5 text-center">
              <p className="text-gray-500 text-sm">No additional tips for this session.</p>
            </div>
          )}
        </div>
      )}

      {/* Teach CTA */}
      <button
        onClick={onTeach}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-300 font-semibold"
      >
        <span className="text-xl">🧑‍🎓</span>
        <div className="text-left flex-1">
          <p className="text-sm font-semibold">Teach the Student</p>
          <p className="text-blue-400 text-xs">Teo asks questions to deepen your understanding</p>
        </div>
        {!isPremium && <span className="text-base">👑</span>}
      </button>

      {/* Actions */}
      <div className="flex gap-3 pb-4">
        <button
          onClick={onTryAgain}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-app-card border border-app-border text-gray-600 font-medium"
        >
          <RotateCcw size={16} /> Try Again
        </button>
        <button
          onClick={onComplete}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl gradient-primary text-white font-semibold glow-purple"
        >
          Complete <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
