import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import useAppStore from '../store/useAppStore'

const GOALS = [
  { id: 'work',     label: 'Work & Business',    icon: '💼', desc: 'Meetings, emails, presentations' },
  { id: 'travel',   label: 'Travel',              icon: '✈️', desc: 'Navigate the world confidently' },
  { id: 'daily',    label: 'Daily Conversations', icon: '💬', desc: 'Talk naturally with anyone'      },
  { id: 'academic', label: 'Academic / Study',    icon: '🎓', desc: 'Papers, research, exams'         },
]

const LEVELS = [
  { id: 'beginner',     label: 'Beginner',     desc: "I know basic words but can't form sentences", emoji: '🌱' },
  { id: 'intermediate', label: 'Intermediate', desc: 'I can have simple conversations',              emoji: '🌿' },
  { id: 'advanced',     label: 'Advanced',     desc: 'I read and write well but want to improve',    emoji: '🌳' },
]

const FEYNMAN_STEPS = [
  { emoji: '📖', title: 'Read',          desc: 'Study a short piece of content in English — article, video, audio.' },
  { emoji: '✍️', title: 'Explain',       desc: 'Close the text and explain it in your own words, as if teaching a friend.' },
  { emoji: '🔍', title: 'Find the gaps', desc: 'Where you struggle to explain is exactly where your understanding is weak.' },
  { emoji: '🔁', title: 'Review',        desc: 'Go back, fill the gap, and explain again. Each cycle = real improvement.' },
]

const slide = {
  initial: { opacity: 0, x: 32 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -32 },
  transition: { duration: 0.25 },
}

const TOTAL_STEPS = 4

export default function Onboarding() {
  const navigate  = useNavigate()
  const setUser   = useAppStore((s) => s.setUser)
  const [step, setStep]   = useState(0)
  const [goal, setGoal]   = useState(null)
  const [level, setLevel] = useState(null)

  const handleFinish = () => {
    setUser({ goal, level, onboardedAt: new Date().toISOString() })
    navigate('/home')
  }

  return (
    <div className="app-shell flex flex-col min-h-screen bg-app-bg">

      {/* ── Top bar: back + progress ─────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 pt-10 pb-2">
        {step > 0 && step < TOTAL_STEPS && (
          <button
            onClick={() => setStep(step - 1)}
            className="w-9 h-9 rounded-full bg-app-card border border-app-border flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft size={16} className="text-gray-400" />
          </button>
        )}
        {step > 0 && step < TOTAL_STEPS && (
          <div className="flex-1 flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS - 1 }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-all duration-400 ${
                  i < step ? 'gradient-primary' : 'bg-app-border'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col px-6 pb-8">
        <AnimatePresence mode="wait">

          {/* ── Step 0: Welcome ─────────────────────────────────── */}
          {step === 0 && (
            <motion.div key="welcome" {...slide} className="flex-1 flex flex-col justify-center items-center text-center gap-7">

              {/* Logo */}
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl gradient-primary flex items-center justify-center text-6xl glow-purple">
                  🧠
                </div>
                <motion.div
                  className="absolute -inset-3 rounded-[40px] gradient-primary opacity-15 -z-10"
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                />
              </div>

              <div>
                <h1 className="text-4xl font-bold text-slate-800 tracking-tight mb-2">
                  Feyn<span className="text-gradient">Learn</span>
                </h1>
                <p className="text-gray-400 text-base">Master English by explaining, not memorizing.</p>
              </div>

              {/* Feature pills */}
              <div className="w-full grid grid-cols-2 gap-2.5">
                {[
                  { e: '📖', t: 'Read real content'    },
                  { e: '✍️', t: 'Explain in your words'},
                  { e: '🤖', t: 'AI finds your gaps'   },
                  { e: '⚡', t: '15 min/day — fluency' },
                ].map(({ e, t }) => (
                  <div key={t} className="flex items-center gap-2.5 bg-app-card border border-app-border rounded-2xl px-3 py-3">
                    <span className="text-xl">{e}</span>
                    <span className="text-gray-600 text-xs font-medium leading-tight">{t}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full py-4 rounded-2xl gradient-primary text-white font-bold text-base glow-purple"
              >
                Get Started →
              </button>
              <p className="text-gray-600 text-xs -mt-3">No account needed · Free to start</p>
            </motion.div>
          )}

          {/* ── Step 1: Feynman Method ───────────────────────────── */}
          {step === 1 && (
            <motion.div key="feynman" {...slide} className="flex-1 flex flex-col pt-4 gap-6">
              <div>
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">The Science Behind It</p>
                <h2 className="text-2xl font-bold text-slate-800 leading-snug">
                  The Feynman Technique
                </h2>
                <p className="text-gray-400 text-sm mt-1.5 leading-relaxed">
                  Nobel Prize physicist Richard Feynman's method to understand anything deeply — proven to work.
                </p>
              </div>

              {/* Feynman 4 steps */}
              <div className="space-y-3 flex-1">
                {FEYNMAN_STEPS.map((s, i) => (
                  <motion.div
                    key={s.title}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4 bg-app-card border border-app-border rounded-2xl p-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl flex-shrink-0">
                      {s.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Step {i + 1}</span>
                        <span className="text-slate-800 font-semibold text-sm">{s.title}</span>
                      </div>
                      <p className="text-gray-400 text-xs leading-relaxed">{s.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-blue-500/8 border border-blue-500/20 rounded-2xl px-4 py-3">
                <p className="text-blue-300 text-xs text-center font-medium">
                  💡 If you can't explain it simply, you don't understand it yet.
                </p>
                <p className="text-gray-600 text-xs text-center mt-0.5">— Richard Feynman</p>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-4 rounded-2xl gradient-primary text-white font-bold text-base glow-purple flex items-center justify-center gap-2"
              >
                I'm Ready <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {/* ── Step 2: Goal ────────────────────────────────────── */}
          {step === 2 && (
            <motion.div key="goal" {...slide} className="flex-1 flex flex-col pt-4 gap-5">
              <div>
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Step 1 of 2</p>
                <h2 className="text-2xl font-bold text-slate-800">What's your main goal?</h2>
                <p className="text-gray-400 text-sm mt-1">We'll tailor your lessons around it.</p>
              </div>

              <div className="space-y-3 flex-1">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                      goal === g.id
                        ? 'border-blue-500/60 bg-blue-500/10 glow-purple'
                        : 'border-app-border bg-app-card hover:border-blue-500/30'
                    }`}
                  >
                    <span className="text-3xl">{g.icon}</span>
                    <div className="flex-1">
                      <p className="text-slate-800 font-semibold text-sm">{g.label}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{g.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      goal === g.id ? 'border-blue-500 bg-blue-500' : 'border-app-border'
                    }`}>
                      {goal === g.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => goal && setStep(3)}
                disabled={!goal}
                className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                  goal ? 'gradient-primary text-white glow-purple' : 'bg-app-card text-gray-600 cursor-not-allowed'
                }`}
              >
                Continue <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {/* ── Step 3: Level ───────────────────────────────────── */}
          {step === 3 && (
            <motion.div key="level" {...slide} className="flex-1 flex flex-col pt-4 gap-5">
              <div>
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Step 2 of 2</p>
                <h2 className="text-2xl font-bold text-slate-800">Your current English level?</h2>
                <p className="text-gray-400 text-sm mt-1">Be honest — the app adapts to you.</p>
              </div>

              <div className="space-y-3 flex-1">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLevel(l.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                      level === l.id
                        ? 'border-blue-500/60 bg-blue-500/10 glow-purple'
                        : 'border-app-border bg-app-card hover:border-blue-500/30'
                    }`}
                  >
                    <span className="text-3xl">{l.emoji}</span>
                    <div className="flex-1">
                      <p className="text-slate-800 font-semibold text-sm">{l.label}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{l.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      level === l.id ? 'border-blue-500 bg-blue-500' : 'border-app-border'
                    }`}>
                      {level === l.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>

              {/* Ready card */}
              <div className="bg-app-card border border-app-border rounded-2xl px-4 py-3 space-y-1.5">
                <p className="text-cyan-400 text-xs font-semibold">⏱ What a session looks like</p>
                {['📖 Read · 60 seconds', '🔒 Text hides · you explain', '🤖 AI scores your gaps', '🔁 Improve each round'].map((s) => (
                  <p key={s} className="text-gray-400 text-xs">{s}</p>
                ))}
              </div>

              <button
                onClick={() => level && handleFinish()}
                disabled={!level}
                className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                  level ? 'gradient-primary text-white glow-purple' : 'bg-app-card text-gray-600 cursor-not-allowed'
                }`}
              >
                Start Learning 🧠
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
