import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle, XCircle, ChevronRight, Zap } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { generateExercises } from '../services/exercises'
import XPToast from '../components/XPToast'
import BottomNav from '../components/BottomNav'

export default function Practice() {
  const navigate = useNavigate()
  const { gaps, openaiKey, earnXP, fixGap } = useAppStore()

  const [exercises, setExercises]   = useState([])
  const [current, setCurrent]       = useState(0)
  const [answer, setAnswer]         = useState('')
  const [selected, setSelected]     = useState(null)
  const [wordOrder, setWordOrder]   = useState([])
  const [submitted, setSubmitted]   = useState(false)
  const [isCorrect, setIsCorrect]   = useState(null)
  const [totalXP, setTotalXP]       = useState(0)
  const [showToast, setShowToast]   = useState(false)
  const [toastXP, setToastXP]       = useState(0)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [done, setDone]             = useState(false)

  const activeGaps = gaps.filter((g) => g.count > 0).map((g) => g.concept)

  useEffect(() => {
    if (!openaiKey) {
      setError('No OpenAI API key set. Add it in your Profile settings.')
      setLoading(false)
      return
    }
    if (activeGaps.length === 0) {
      setError('No gaps to practice yet! Complete a lesson first to discover your gaps.')
      setLoading(false)
      return
    }
    generateExercises({ gaps: activeGaps, apiKey: openaiKey })
      .then((ex) => {
        setExercises(ex)
        if (ex[0]?.type === 'word_order') setWordOrder([...ex[0].words].sort(() => Math.random() - 0.5))
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to generate exercises. Check your API key.')
        setLoading(false)
      })
  }, [])

  const exercise = exercises[current]

  const handleNext = () => {
    const next = current + 1
    if (next >= exercises.length) {
      setDone(true)
      return
    }
    setCurrent(next)
    setAnswer('')
    setSelected(null)
    setSubmitted(false)
    setIsCorrect(null)
    if (exercises[next]?.type === 'word_order') {
      setWordOrder([...exercises[next].words].sort(() => Math.random() - 0.5))
    }
  }

  const checkAnswer = (userAnswer) => {
    if (!exercise) return
    const normalise = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
    const correct = normalise(userAnswer) === normalise(exercise.answer)
    setIsCorrect(correct)
    setSubmitted(true)

    if (correct) {
      const xpGained = exercise.xpReward || 20
      earnXP(xpGained)
      fixGap(exercise.targetGap)
      setTotalXP((prev) => prev + xpGained)
      setToastXP(xpGained)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    }
  }

  const handleFillSubmit = () => checkAnswer(answer)
  const handleMultiChoice = (opt) => { setSelected(opt); checkAnswer(opt) }
  const handleWordOrderSubmit = () => checkAnswer(wordOrder.join(' '))

  const toggleWord = (word, idx) => {
    setWordOrder((prev) => {
      const next = [...prev]
      next.splice(idx, 1)
      return next
    })
  }

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="app-shell flex flex-col min-h-screen bg-app-bg items-center justify-center gap-6 text-center px-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-4xl glow-purple"
        >
          🧠
        </motion.div>
        <div>
          <h3 className="text-slate-800 font-bold text-xl mb-2">Generating your exercises...</h3>
          <p className="text-gray-400 text-sm">Based on your {activeGaps.length} gap{activeGaps.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="app-shell flex flex-col min-h-screen bg-app-bg pb-36">
        <div className="px-6 pt-12 pb-6">
          <button onClick={() => navigate('/home')} className="flex items-center gap-2 text-gray-400 mb-6">
            <ArrowLeft size={18} /> Back
          </button>
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 text-center">
            <p className="text-5xl mb-4">😕</p>
            <p className="text-rose-400 font-semibold mb-2">Can't load exercises</p>
            <p className="text-gray-400 text-sm">{error}</p>
            <button onClick={() => navigate('/profile')} className="mt-4 px-6 py-3 gradient-primary rounded-xl text-white font-medium text-sm">
              Go to Profile
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  // ── Done ───────────────────────────────────────────────────
  if (done) {
    return (
      <div className="app-shell flex flex-col min-h-screen bg-app-bg pb-36">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <span className="text-8xl">🏆</span>
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Practice Complete!</h2>
            <p className="text-gray-400">You just targeted your real weak spots.</p>
          </div>
          <div className="gradient-primary rounded-3xl px-8 py-5 glow-purple text-center">
            <p className="text-blue-200 text-sm mb-1">Total XP earned</p>
            <p className="text-slate-800 font-bold text-4xl">+{totalXP} XP</p>
          </div>
          <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
            <p className="text-emerald-400 text-sm font-semibold mb-1">🎯 Feynman reminder</p>
            <p className="text-gray-600 text-sm">Where you got stuck = where real learning happened.</p>
          </div>
          <div className="w-full space-y-3">
            <button onClick={() => navigate('/home')} className="w-full py-4 rounded-2xl gradient-primary text-white font-semibold text-lg glow-purple">
              Back to Home
            </button>
            <button onClick={() => window.location.reload()} className="w-full py-3 rounded-2xl bg-app-card border border-app-border text-gray-600 font-medium">
              Practice Again
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  // ── Exercise ───────────────────────────────────────────────
  return (
    <div className="app-shell flex flex-col min-h-screen bg-app-bg pb-36">
      <XPToast xp={toastXP} visible={showToast} />

      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-12 pb-4">
        <button onClick={() => navigate('/home')} className="w-9 h-9 rounded-full bg-app-card flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-gray-400 text-xs">Exercise {current + 1} of {exercises.length}</span>
            <span className="text-blue-400 text-xs font-semibold">+{totalXP} XP so far</span>
          </div>
          <div className="h-1.5 bg-app-border rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-primary rounded-full"
              animate={{ width: `${((current) / exercises.length) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 overflow-y-auto pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="space-y-5 pt-2"
          >
            {/* Gap tag */}
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-blue-400" />
              <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider capitalize">
                Practicing: {exercise.targetGap}
              </span>
              <span className="ml-auto bg-app-card text-gray-400 text-xs px-2 py-0.5 rounded-full">
                {exercise.type.replace('_', ' ')}
              </span>
            </div>

            {/* Question */}
            <div className="bg-app-card border border-app-border rounded-2xl p-4">
              <p className="text-slate-800 text-base leading-relaxed font-medium">{exercise.question}</p>
            </div>

            {/* Input by type */}
            {exercise.type === 'fill_blank' && (
              <FillBlank
                value={answer}
                onChange={setAnswer}
                submitted={submitted}
                onSubmit={handleFillSubmit}
                disabled={submitted}
              />
            )}

            {exercise.type === 'error_correction' && (
              <ErrorCorrection
                value={answer}
                onChange={setAnswer}
                submitted={submitted}
                onSubmit={handleFillSubmit}
                disabled={submitted}
              />
            )}

            {exercise.type === 'multiple_choice' && (
              <MultipleChoice
                options={exercise.options}
                selected={selected}
                answer={exercise.answer}
                submitted={submitted}
                onSelect={handleMultiChoice}
              />
            )}

            {exercise.type === 'word_order' && (
              <WordOrder
                words={exercise.words}
                orderedWords={wordOrder}
                setOrderedWords={setWordOrder}
                submitted={submitted}
                onSubmit={handleWordOrderSubmit}
                disabled={submitted}
              />
            )}

            {/* Feedback */}
            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl p-4 border ${
                  isCorrect
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {isCorrect
                    ? <CheckCircle size={18} className="text-emerald-400" />
                    : <XCircle    size={18} className="text-rose-400"    />
                  }
                  <span className={`font-semibold text-sm ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isCorrect ? `Correct! +${exercise.xpReward} XP` : 'Not quite — here\'s why:'}
                  </span>
                </div>
                {!isCorrect && (
                  <p className="text-gray-600 text-sm mb-2">
                    ✅ Correct answer: <span className="text-emerald-400 font-medium">"{exercise.answer}"</span>
                  </p>
                )}
                <p className="text-gray-400 text-sm">{exercise.explanation}</p>
              </motion.div>
            )}

            {/* Next button */}
            {submitted && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleNext}
                className="w-full py-4 rounded-2xl gradient-primary text-white font-semibold flex items-center justify-center gap-2 glow-purple"
              >
                {current + 1 >= exercises.length ? 'See Results 🏆' : 'Next Exercise'}
                <ChevronRight size={18} />
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function FillBlank({ value, onChange, submitted, onSubmit, disabled }) {
  return (
    <div className="space-y-3">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer..."
        onKeyDown={(e) => e.key === 'Enter' && !submitted && value.trim() && onSubmit()}
        className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-gray-700 text-sm placeholder-gray-600 focus:border-blue-500/60 transition-colors disabled:opacity-50"
      />
      {!submitted && (
        <button
          onClick={onSubmit}
          disabled={!value.trim()}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
            value.trim() ? 'gradient-primary text-white glow-purple' : 'bg-app-card border border-app-border text-gray-600 cursor-not-allowed'
          }`}
        >
          Check Answer
        </button>
      )}
    </div>
  )
}

function ErrorCorrection({ value, onChange, submitted, onSubmit, disabled }) {
  return (
    <div className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Rewrite the sentence correctly..."
        rows={3}
        className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-gray-700 text-sm placeholder-gray-600 resize-none focus:border-blue-500/60 transition-colors disabled:opacity-50"
      />
      {!submitted && (
        <button
          onClick={onSubmit}
          disabled={!value.trim()}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
            value.trim() ? 'gradient-primary text-white glow-purple' : 'bg-app-card border border-app-border text-gray-600 cursor-not-allowed'
          }`}
        >
          Check Answer
        </button>
      )}
    </div>
  )
}

function MultipleChoice({ options = [], selected, answer, submitted, onSelect }) {
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const isSelected = selected === opt
        const isAnswer   = opt === answer
        let style = 'border-app-border bg-app-card text-gray-600'
        if (submitted) {
          if (isAnswer)            style = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
          else if (isSelected)     style = 'border-rose-500/50 bg-rose-500/10 text-rose-300'
        } else if (isSelected) {
          style = 'border-blue-500/50 bg-blue-500/10 text-slate-800'
        }
        return (
          <button
            key={opt}
            onClick={() => !submitted && onSelect(opt)}
            disabled={submitted}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left ${style}`}
          >
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
              submitted && isAnswer ? 'border-emerald-400 bg-emerald-500' : 'border-current'
            }`}>
              {submitted && isAnswer && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <span className="text-sm font-medium">{opt}</span>
          </button>
        )
      })}
    </div>
  )
}

function WordOrder({ words, orderedWords, setOrderedWords, submitted, onSubmit, disabled }) {
  const remaining = words.filter((w) => !orderedWords.includes(w))

  const addWord = (word) => {
    if (!disabled) setOrderedWords((prev) => [...prev, word])
  }

  const removeWord = (idx) => {
    if (!disabled) setOrderedWords((prev) => prev.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-4">
      {/* Answer area */}
      <div className="min-h-16 bg-app-card border border-app-border rounded-xl p-3 flex flex-wrap gap-2">
        {orderedWords.length === 0 && (
          <p className="text-gray-600 text-sm self-center">Tap words below to build the sentence...</p>
        )}
        {orderedWords.map((word, i) => (
          <button
            key={`${word}-${i}`}
            onClick={() => removeWord(i)}
            disabled={disabled}
            className="bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm px-3 py-1.5 rounded-lg"
          >
            {word}
          </button>
        ))}
      </div>

      {/* Word bank */}
      <div className="flex flex-wrap gap-2">
        {words.map((word, i) => {
          const used = orderedWords.includes(word)
          return (
            <button
              key={`${word}-${i}`}
              onClick={() => !used && addWord(word)}
              disabled={disabled || used}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${
                used
                  ? 'border-app-border bg-app-surface text-gray-600 cursor-not-allowed'
                  : 'border-app-border bg-app-card text-gray-600 hover:border-blue-500/40'
              }`}
            >
              {word}
            </button>
          )
        })}
      </div>

      {!submitted && (
        <button
          onClick={onSubmit}
          disabled={orderedWords.length < words.length}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
            orderedWords.length >= words.length
              ? 'gradient-primary text-white glow-purple'
              : 'bg-app-card border border-app-border text-gray-600 cursor-not-allowed'
          }`}
        >
          Check Order
        </button>
      )}
    </div>
  )
}
