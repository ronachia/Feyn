import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, CheckCircle, XCircle } from 'lucide-react'
import { PLACEMENT_QUESTIONS, calculatePlacementLevel } from '../data/placementTest'
import useAppStore from '../store/useAppStore'
import { useUser } from '@clerk/clerk-react'
import useProgressSync from '../hooks/useProgressSync'

const LEVEL_LABELS = {
  a1: 'A1 — Absolute Beginner',
  a2: 'A2 — Elementary',
  a3: 'A3 — Pre-Intermediate',
  b1: 'B1 — Lower Intermediate',
  b2: 'B2 — Intermediate',
  b3: 'B3 — Upper Intermediate',
  c1: 'C1 — Advanced',
  c2: 'C2 — Proficient',
  c3: 'C3 — Near-Native',
}

const LEVEL_EMOJI = {
  beginner: '🌱', intermediate: '🌿', advanced: '🌳',
}

export default function PlacementTest() {
  const navigate   = useNavigate()
  const setUser    = useAppStore((s) => s.setUser)
  const user       = useAppStore((s) => s.user)
  const { user: clerkUser } = useUser()
  const { syncProfile } = useProgressSync()

  const [current, setCurrent]       = useState(0)
  const [selected, setSelected]     = useState(null)
  const [submitted, setSubmitted]   = useState(false)
  const [correctIds, setCorrectIds] = useState([])
  const [done, setDone]             = useState(false)
  const [result, setResult]         = useState(null)

  const question = PLACEMENT_QUESTIONS[current]
  const isCorrect = submitted && selected === question.answer

  const handleSelect = (opt) => {
    if (submitted) return
    setSelected(opt)
  }

  const handleSubmit = () => {
    if (!selected || submitted) return
    const correct = selected === question.answer
    if (correct) setCorrectIds((prev) => [...prev, question.id])
    setSubmitted(true)
  }

  const handleNext = () => {
    const next = current + 1
    if (next >= PLACEMENT_QUESTIONS.length) {
      const allCorrect = submitted && selected === question.answer
        ? [...correctIds, question.id]
        : correctIds
      const r = calculatePlacementLevel(allCorrect)
      setResult(r)
      setDone(true)
    } else {
      setCurrent(next)
      setSelected(null)
      setSubmitted(false)
    }
  }

  const handleConfirm = async () => {
    const updatedUser = { ...user, level: result.level, placementSubLevel: result.subLevel, placementDone: true }
    setUser(updatedUser)
    await syncProfile({
      level: result.level,
      placement_sub_level: result.subLevel,
    })
    navigate('/home', { replace: true })
  }

  if (done && result) {
    return (
      <div className="app-shell flex flex-col min-h-screen bg-app-bg px-6 pb-12">
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6 pt-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-8xl"
          >
            {LEVEL_EMOJI[result.level]}
          </motion.div>

          <div>
            <p className="text-gray-400 text-sm mb-1">Your English Level</p>
            <h2 className="text-3xl font-bold text-slate-800">{LEVEL_LABELS[result.subLevel]}</h2>
          </div>

          <div className="w-full bg-app-card border border-app-border rounded-2xl p-4 text-left space-y-2">
            <p className="text-blue-400 text-sm font-semibold">What this means:</p>
            {result.level === 'beginner' && (
              <p className="text-gray-500 text-sm">You're building your English foundation. We'll start with everyday situations and essential vocabulary.</p>
            )}
            {result.level === 'intermediate' && (
              <p className="text-gray-500 text-sm">You can communicate in many situations. We'll focus on grammar precision, vocabulary depth, and fluency.</p>
            )}
            {result.level === 'advanced' && (
              <p className="text-gray-500 text-sm">You have strong English. We'll challenge you with complex texts, nuanced grammar, and near-native expression.</p>
            )}
            <p className="text-gray-600 text-xs mt-2">
              ✅ {correctIds.length} of {PLACEMENT_QUESTIONS.length} correct
            </p>
          </div>

          <div className="w-full space-y-3">
            <button
              onClick={handleConfirm}
              className="w-full py-4 rounded-2xl gradient-primary text-white font-bold text-base glow-purple flex items-center justify-center gap-2"
            >
              Start at {LEVEL_LABELS[result.subLevel].split('—')[0].trim()} <ChevronRight size={18} />
            </button>
            <button
              onClick={() => navigate('/home', { replace: true })}
              className="w-full py-3 rounded-2xl bg-app-card border border-app-border text-gray-500 text-sm font-medium"
            >
              Skip — choose my own level
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell flex flex-col min-h-screen bg-app-bg">
      {/* Header */}
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Placement Test</p>
          <span className="text-gray-400 text-xs">{current + 1} / {PLACEMENT_QUESTIONS.length}</span>
        </div>
        <div className="h-1.5 bg-app-border rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-primary rounded-full"
            animate={{ width: `${((current) / PLACEMENT_QUESTIONS.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className="text-slate-800 font-bold text-lg mt-4 leading-snug">{question.question}</p>
      </div>

      <div className="flex-1 px-6 pb-8 space-y-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {question.options.map((opt) => {
              let style = 'border-app-border bg-app-card text-gray-700'
              if (submitted) {
                if (opt === question.answer) style = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700'
                else if (opt === selected)   style = 'border-rose-500/50 bg-rose-500/10 text-rose-600'
              } else if (opt === selected) {
                style = 'border-blue-500/60 bg-blue-500/10 text-blue-700'
              }

              return (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  disabled={submitted}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all text-sm font-medium ${style}`}
                >
                  {submitted && opt === question.answer && <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />}
                  {submitted && opt === selected && opt !== question.answer && <XCircle size={16} className="text-rose-500 flex-shrink-0" />}
                  {(!submitted || (opt !== question.answer && opt !== selected)) && (
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${selected === opt ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`} />
                  )}
                  <span>{opt}</span>
                </button>
              )
            })}

            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl p-4 border ${
                  isCorrect
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}
              >
                <p className={`text-sm font-semibold mb-1 ${isCorrect ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isCorrect ? '✅ Correct!' : '📚 Good to know:'}
                </p>
                <p className="text-gray-600 text-xs leading-relaxed">{question.explanation}</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="pt-2">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={!selected}
              className={`w-full py-4 rounded-2xl font-semibold text-base transition-all ${
                selected
                  ? 'gradient-primary text-white glow-purple'
                  : 'bg-app-card border border-app-border text-gray-500 cursor-not-allowed'
              }`}
            >
              Check Answer
            </button>
          ) : (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleNext}
              className="w-full py-4 rounded-2xl gradient-primary text-white font-semibold text-base glow-purple flex items-center justify-center gap-2"
            >
              {current + 1 >= PLACEMENT_QUESTIONS.length ? 'See My Level 🎯' : 'Next Question'}
              <ChevronRight size={18} />
            </motion.button>
          )}
        </div>

        <button
          onClick={() => navigate('/home', { replace: true })}
          className="w-full text-center text-gray-500 text-xs py-2"
        >
          Skip placement test
        </button>
      </div>
    </div>
  )
}
