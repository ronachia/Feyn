import { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Mic, MicOff, Send,
  Eye, EyeOff, Zap, AlertCircle, X
} from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { getLevelColor, getLevelLabel } from '../data/lessonHelpers'
import useLessons from '../hooks/useLessons'
import useLessonFlow from '../hooks/useLessonFlow'
import XPToast from '../components/XPToast'
import VoiceRecorder from '../components/VoiceRecorder'
import LessonRead from '../components/lesson/LessonRead'
import LessonFeedback from '../components/lesson/LessonFeedback'
import LessonTeaching from '../components/lesson/LessonTeaching'

export default function Lesson() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { customLessons } = useAppStore()
  const { getLessonById, loading: lessonsLoading } = useLessons()

  const lesson = getLessonById(id) || customLessons.find((l) => l.id === id)

  const {
    phase, setPhase, timeLeft,
    explanation, setExplanation, inputMode, setInputMode, isRecording, fluency, showContent, peeked,
    feedback, isAnalyzing,
    teachHistory, teachRound, teachInput, setTeachInput, teachLoading, teachScore, teachSummary,
    sessionXP, showXPToast,
    error, setError,
    isPremium, remainingAICalls,
    startRecording, stopRecording,
    handleSubmit, handleComplete, handleTryAgain, handlePeek,
    handleVoiceTranscript, startTeaching, sendTeachingAnswer,
  } = useLessonFlow(lesson)

  const textareaRef = useRef(null)

  useEffect(() => {
    if (!lessonsLoading && !lesson) navigate('/home')
  }, [lesson, lessonsLoading, navigate])

  if (!lesson) return null

  const levelColors = getLevelColor(lesson.level)
  const wordCount   = explanation.trim() ? explanation.trim().split(/\s+/).length : 0
  const progress    = { intro: 0, read: 25, explain: 50, analyzing: 75, feedback: 85, teaching: 92, complete: 100 }[phase] || 0

  // Errors from the explain phase have their own dedicated UI further down
  // (including the special LIMIT_REACHED treatment). Everywhere else —
  // mainly Teach Mode failures, which used to fail silently — gets this
  // shared banner instead.
  const showSharedErrorBanner = error && error !== 'LIMIT_REACHED' && phase !== 'explain'

  return (
    <div className="app-shell flex flex-col min-h-screen bg-app-bg">
      <XPToast xp={sessionXP} visible={showXPToast} />
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-6 pt-12 pb-4">
        <button onClick={() => navigate('/home')} className="w-9 h-9 rounded-full bg-app-card flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-gray-400 text-xs capitalize">{phase === 'analyzing' ? 'Analyzing...' : phase}</span>
            <span className="text-gray-500 text-xs">{progress}%</span>
          </div>
          <div className="h-1.5 bg-app-border rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* ── Content Area ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {showSharedErrorBanner && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-rose-400 text-sm flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-rose-400/70 flex-shrink-0">
              <X size={14} />
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* INTRO */}
          {phase === 'intro' && (
            <Phase key="intro">
              <div className="flex flex-col items-center text-center gap-5 pt-4">
                <div className="text-7xl">{lesson.icon}</div>
                <div>
                  <div className={`inline-flex items-center gap-1.5 ${levelColors.bg} ${levelColors.text} text-xs font-medium px-3 py-1 rounded-full mb-3`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${levelColors.dot}`} />
                    {getLevelLabel(lesson.level)}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">{lesson.title}</h2>
                  <p className="text-gray-400 text-sm mt-1">{lesson.category} · {lesson.estimatedMinutes} min</p>
                </div>

                <div className="w-full bg-app-card border border-app-border rounded-2xl p-4 text-left space-y-3">
                  <p className="text-blue-400 text-sm font-semibold">How this session works:</p>
                  {[
                    { step: '1', text: 'Read a short text carefully', time: '60 sec' },
                    { step: '2', text: 'Text disappears — explain it in English', time: '' },
                    { step: '3', text: 'AI analyzes your gaps', time: '' },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-slate-800 text-xs font-bold">{s.step}</span>
                      </div>
                      <span className="text-gray-600 text-sm flex-1">{s.text}</span>
                      {s.time && <span className="text-gray-500 text-xs">{s.time}</span>}
                    </div>
                  ))}
                </div>

                <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                  <p className="text-amber-400 text-sm font-semibold mb-1">⚠️ Feynman Rule</p>
                  <p className="text-gray-600 text-sm">Don't try to memorize. Just understand the main idea. You'll explain it in your own words.</p>
                </div>

                {/* AI limit warning — shown here, before reading, instead of
                    only surfacing after the user has already read + written
                    their explanation. They can still start (reading/writing
                    has value on its own), just with the heads-up up front. */}
                {!isPremium && remainingAICalls() === 0 && (
                  <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-xl">⚡</span>
                    <div className="flex-1 text-left">
                      <p className="text-amber-400 font-semibold text-sm">Today's free AI analyses are used up</p>
                      <p className="text-gray-500 text-xs mt-0.5 mb-3">You can still read and write your explanation, but AI feedback won't be available until tomorrow — unless you upgrade now.</p>
                      <button
                        onClick={() => navigate('/pricing')}
                        className="w-full gradient-primary text-white text-sm font-semibold py-2.5 rounded-xl"
                      >
                        👑 Upgrade to Premium — Unlimited
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setPhase('read')}
                  className="w-full py-4 rounded-2xl gradient-primary text-white font-semibold text-lg glow-purple"
                >
                  Start Reading →
                </button>
              </div>
            </Phase>
          )}

          {/* READ */}
          {phase === 'read' && (
            <Phase key="read">
              <LessonRead lesson={lesson} timeLeft={timeLeft} onReady={() => setPhase('explain')} />
            </Phase>
          )}

          {/* EXPLAIN */}
          {phase === 'explain' && (
            <Phase key="explain">
              <div className="pt-2 space-y-4">
                <div>
                  <h3 className="text-slate-800 font-bold text-lg mb-1">Explain what you read</h3>
                  <p className="text-gray-400 text-sm">In English, with your own words. Don't look back.</p>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-amber-400 text-xs font-semibold">
                    🔒 The text is hidden. Explain what you remember.
                  </p>
                </div>

                {/* Mode toggle */}
                <div className="flex gap-1 bg-app-card border border-app-border rounded-2xl p-1">
                  <button
                    onClick={() => setInputMode('text')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      inputMode === 'text' ? 'gradient-primary text-white' : 'text-gray-500'
                    }`}
                  >
                    ✍️ Write
                  </button>
                  <button
                    onClick={() => isPremium ? setInputMode('voice') : navigate('/pricing')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                      inputMode === 'voice' ? 'gradient-primary text-white' : 'text-gray-500'
                    }`}
                  >
                    🎤 Speak {!isPremium && <span className="text-xs">👑</span>}
                  </button>
                </div>

                {/* Fluency badge (after voice recording) */}
                {fluency && inputMode === 'text' && explanation && (
                  <div className="flex items-center gap-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
                    <span className="text-xl">🎙️</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-cyan-400 text-xs font-semibold">Fluency: {fluency.fluencyScore}/10
                        {fluency.wpm ? ` · ${fluency.wpm} wpm` : ''}</p>
                      <p className="text-gray-400 text-xs truncate">{fluency.strength}</p>
                    </div>
                  </div>
                )}

                {/* Show/hide original */}
                <button onClick={handlePeek} className="flex items-center gap-2 text-gray-500 text-xs">
                  {showContent ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showContent ? 'Hide original text' : 'Peek at original (reduces score)'}
                </button>
                {showContent && (
                  <div className="bg-app-card border border-rose-500/20 rounded-xl p-4 opacity-70">
                    <p className="text-gray-400 text-sm leading-relaxed">{lesson.content}</p>
                  </div>
                )}

                {/* VOICE MODE */}
                {inputMode === 'voice' && (
                  <VoiceRecorder
                    onTranscript={handleVoiceTranscript}
                  />
                )}

                {/* TEXT MODE */}
                {inputMode === 'text' && (
                  <>
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        placeholder="Explain in English... e.g. 'The text talks about...'"
                        rows={7}
                        className="w-full bg-app-card border border-app-border rounded-2xl p-4 pr-12 text-gray-700 text-sm placeholder-gray-600 resize-none focus:border-blue-500/60 transition-colors"
                      />
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                          isRecording
                            ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400 animate-pulse'
                            : 'bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                        }`}
                        title={isRecording ? 'Stop recording' : 'Speak your explanation'}
                      >
                        {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
                      </button>
                      <div className="absolute bottom-3 right-3 text-gray-600 text-xs">{wordCount} words</div>
                    </div>
                    {isRecording && (
                      <p className="text-rose-400 text-xs text-center animate-pulse">🎙️ Listening... speak now</p>
                    )}

                    {error === 'LIMIT_REACHED' ? (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                        <span className="text-xl">⚡</span>
                        <div className="flex-1">
                          <p className="text-amber-400 font-semibold text-sm">Daily limit reached</p>
                          <p className="text-gray-500 text-xs mt-0.5 mb-3">Free plan: 3 AI analyses per day. Your explanation is saved.</p>
                          <button
                            onClick={() => navigate('/pricing')}
                            className="w-full gradient-primary text-white text-sm font-semibold py-2.5 rounded-xl"
                          >
                            👑 Upgrade to Premium — Unlimited
                          </button>
                        </div>
                      </div>
                    ) : error ? (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                        <p className="text-rose-400 text-sm">{error}</p>
                      </div>
                    ) : null}

                    <button
                      onClick={handleSubmit}
                      disabled={wordCount < 5 || error === 'LIMIT_REACHED'}
                      className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold transition-all ${
                        wordCount >= 5
                          ? 'gradient-primary text-white glow-purple'
                          : 'bg-app-card text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <Send size={18} /> Analyze My Explanation
                    </button>
                    <p className="text-center text-gray-600 text-xs">
                      {isPremium
                        ? 'Unlimited AI analyses · Premium'
                        : `${remainingAICalls()} free AI ${remainingAICalls() === 1 ? 'analysis' : 'analyses'} remaining today`
                      }
                    </p>
                  </>
                )}
              </div>
            </Phase>
          )}

          {/* ANALYZING */}
          {phase === 'analyzing' && (
            <Phase key="analyzing">
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-4xl glow-purple"
                >
                  🧠
                </motion.div>
                <div>
                  <h3 className="text-slate-800 font-bold text-xl mb-2">Analyzing your explanation...</h3>
                  <p className="text-gray-400 text-sm">Finding your gaps with Feynman precision</p>
                </div>
                <div className="space-y-2 w-full">
                  {['Checking grammar...', 'Measuring coverage...', 'Finding gaps...'].map((t, i) => (
                    <motion.div
                      key={t}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.8 }}
                      className="flex items-center gap-3 bg-app-card rounded-xl px-4 py-3"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ delay: i * 0.8, duration: 0.4 }}
                        className="w-2 h-2 rounded-full bg-blue-500"
                      />
                      <span className="text-gray-400 text-sm">{t}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Phase>
          )}

          {/* FEEDBACK */}
          {phase === 'feedback' && feedback && (
            <Phase key="feedback">
              <LessonFeedback
                feedback={feedback}
                onTryAgain={handleTryAgain}
                onComplete={handleComplete}
                onTeach={isPremium ? startTeaching : () => navigate('/pricing')}
                isPremium={isPremium}
                fluency={fluency}
              />
            </Phase>
          )}

          {/* TEACHING */}
          {phase === 'teaching' && (
            <Phase key="teaching">
              <LessonTeaching
                history={teachHistory}
                round={teachRound}
                input={teachInput}
                onInput={setTeachInput}
                onSend={sendTeachingAnswer}
                loading={teachLoading}
                score={teachScore}
                summary={teachSummary}
                onComplete={handleComplete}
              />
            </Phase>
          )}

          {/* COMPLETE */}
          {phase === 'complete' && (
            <Phase key="complete">
              <div className="flex flex-col items-center text-center gap-6 pt-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="text-8xl"
                >
                  🎉
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Lesson Complete!</h2>
                  <p className="text-gray-400">You practiced active learning. That's real fluency.</p>
                </div>

                {feedback && (
                  <div className="w-full grid grid-cols-2 gap-3">
                    <ScoreCard label="Clarity"  value={feedback.clarityScore}  color="text-blue-400" />
                    <ScoreCard label="Coverage" value={feedback.coverageScore} color="text-cyan-400" />
                  </div>
                )}

                {sessionXP > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full gradient-primary rounded-2xl p-4 glow-purple text-center"
                  >
                    <p className="text-blue-200 text-xs mb-0.5">XP Earned</p>
                    <p className="text-slate-800 font-bold text-3xl">+{sessionXP} XP</p>
                    {!peeked && <p className="text-blue-200 text-xs mt-1">🧠 +30 no-peek bonus!</p>}
                  </motion.div>
                )}

                {feedback?.encouragement && (
                  <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                    <p className="text-emerald-400 text-sm font-medium">"{feedback.encouragement}"</p>
                  </div>
                )}

                <div className="w-full space-y-3">
                  <button
                    onClick={() => navigate('/practice')}
                    className="w-full py-4 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-300 font-semibold flex items-center justify-center gap-2"
                  >
                    <Zap size={18} /> Practice Your Gaps
                  </button>
                  <button
                    onClick={() => navigate('/home')}
                    className="w-full py-4 rounded-2xl gradient-primary text-white font-semibold text-lg glow-purple"
                  >
                    Back to Home
                  </button>
                  <button
                    onClick={handleTryAgain}
                    className="w-full py-3 rounded-2xl bg-app-card border border-app-border text-gray-600 font-medium"
                  >
                    Explain Again
                  </button>
                </div>
              </div>
            </Phase>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Phase({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

function ScoreCard({ label, value, color }) {
  return (
    <div className="bg-app-card border border-app-border rounded-2xl p-4 text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}<span className="text-sm text-gray-500">/10</span></p>
      <p className="text-gray-400 text-xs mt-1">{label}</p>
    </div>
  )
}
