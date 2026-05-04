import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Mic, MicOff, Send, RotateCcw, ChevronRight,
  CheckCircle, XCircle, AlertCircle, Eye, EyeOff, Zap
} from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { getLessonById, getLevelColor, getLevelLabel, extractYouTubeId, getContentTypeInfo } from '../data/lessons'
import { analyzeExplanation } from '../services/openai'
import { analyzeFluency } from '../services/whisper'
import { getStudentQuestion } from '../services/teachMode'
import XPToast from '../components/XPToast'
import VoiceRecorder from '../components/VoiceRecorder'
import useProgressSync from '../hooks/useProgressSync'

const READING_TIME = 60

export default function Lesson() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { openaiKey, completeLesson, addGaps, addSession, earnXP, calculateSessionXP, recordSessionStats, streak, customLessons, isPremium, checkAndIncrementAI, remainingAICalls } = useAppStore()
  const { syncProgress } = useProgressSync()

  const lesson = getLessonById(id) || customLessons.find((l) => l.id === id)

  const [phase, setPhase]               = useState('intro')
  const [timeLeft, setTimeLeft]         = useState(READING_TIME)
  const [explanation, setExplanation]   = useState('')
  const [feedback, setFeedback]         = useState(null)
  const [isAnalyzing, setIsAnalyzing]   = useState(false)
  const [isRecording, setIsRecording]   = useState(false)
  const [error, setError]               = useState(null)
  const [showContent, setShowContent]   = useState(false)
  const [peeked, setPeeked]             = useState(false)
  const [sessionXP, setSessionXP]       = useState(0)
  const [showXPToast, setShowXPToast]   = useState(false)
  const [inputMode, setInputMode]       = useState('text')
  const [fluency, setFluency]           = useState(null)
  const [teachHistory, setTeachHistory] = useState([])
  const [teachRound, setTeachRound]     = useState(0)
  const [teachInput, setTeachInput]     = useState('')
  const [teachLoading, setTeachLoading] = useState(false)
  const [teachScore, setTeachScore]     = useState(null)
  const [teachSummary, setTeachSummary] = useState('')

  const timerRef       = useRef(null)
  const recognitionRef = useRef(null)
  const textareaRef    = useRef(null)

  useEffect(() => {
    if (!lesson) navigate('/home')
  }, [lesson, navigate])

  // Reading timer
  useEffect(() => {
    if (phase === 'read') {
      setTimeLeft(READING_TIME)
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current)
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [phase])

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Voice recognition is not supported in your browser. Please type your explanation.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(' ')
      setExplanation(transcript)
    }
    recognition.onerror = () => {
      setIsRecording(false)
    }
    recognition.onend = () => setIsRecording(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }

  const handleSubmit = async () => {
    if (!explanation.trim() || explanation.trim().split(' ').length < 5) {
      setError('Write at least a few sentences about what you read.')
      return
    }
    if (!openaiKey) {
      setError('No OpenAI API key set. Please add it in your Profile settings.')
      return
    }
    if (!checkAndIncrementAI()) {
      navigate('/pricing')
      return
    }
    setError(null)
    setIsAnalyzing(true)
    setPhase('analyzing')

    try {
      const result = await analyzeExplanation({
        originalContent: lesson.content,
        userExplanation: explanation,
        keyPoints: lesson.keyPoints,
        apiKey: openaiKey,
      })
      setFeedback(result)
      if (result.gaps?.length) addGaps(result.gaps)
      addSession({ lessonId: lesson.id, clarityScore: result.clarityScore, coverageScore: result.coverageScore })
      setPhase('feedback')
    } catch (err) {
      setError('Failed to analyze. Check your API key in Profile.')
      setPhase('explain')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleComplete = () => {
    completeLesson(lesson.id)
    const xp = calculateSessionXP({
      clarityScore:  feedback?.clarityScore  || 0,
      coverageScore: feedback?.coverageScore || 0,
      peeked,
      streak,
    })
    earnXP(xp)
    recordSessionStats({ clarityScore: feedback?.clarityScore || 0, peeked })
    setSessionXP(xp)
    setShowXPToast(true)
    setTimeout(() => setShowXPToast(false), 2500)
    setPhase('complete')
    setTimeout(() => syncProgress(), 500)
  }

  const handleTryAgain = () => {
    setExplanation('')
    setFeedback(null)
    setError(null)
    setPhase('explain')
  }

  const handlePeek = () => { setShowContent(!showContent); if (!showContent) setPeeked(true) }

  const handleVoiceTranscript = async (text) => {
    setExplanation(text)
    setInputMode('text')
    if (openaiKey) {
      try {
        const f = await analyzeFluency({ text, duration: 0, apiKey: openaiKey })
        setFluency(f)
      } catch { /* fluency analysis is optional */ }
    }
  }

  const startTeaching = async () => {
    setPhase('teaching')
    setTeachLoading(true)
    setTeachHistory([])
    setTeachRound(0)
    try {
      const res = await getStudentQuestion({ topic: lesson.title, explanation, history: [], round: 0, apiKey: openaiKey })
      setTeachHistory([{ role: 'student', content: res.question }])
      setTeachRound(1)
    } catch { setPhase('feedback') }
    finally { setTeachLoading(false) }
  }

  const sendTeachingAnswer = async () => {
    if (!teachInput.trim() || teachLoading) return
    const userMsg    = { role: 'user', content: teachInput.trim() }
    const newHistory = [...teachHistory, userMsg]
    setTeachHistory(newHistory)
    setTeachInput('')
    setTeachLoading(true)
    try {
      const res = await getStudentQuestion({ topic: lesson.title, explanation, history: newHistory, round: teachRound, apiKey: openaiKey })
      setTeachHistory([...newHistory, { role: 'student', content: res.question, isFinal: res.concluded }])
      if (res.concluded) {
        setTeachScore(res.masteryScore)
        setTeachSummary(res.summary)
        const xpBonus = Math.round(res.masteryScore * 10)
        earnXP(xpBonus)
      } else {
        setTeachRound((r) => r + 1)
      }
    } catch { /* silent fail */ }
    finally { setTeachLoading(false) }
  }

  if (!lesson) return null

  const levelColors = getLevelColor(lesson.level)
  const wordCount   = explanation.trim() ? explanation.trim().split(/\s+/).length : 0
  const progress    = { intro: 0, read: 25, explain: 50, analyzing: 75, feedback: 85, teaching: 92, complete: 100 }[phase] || 0

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
              <ReadPhase lesson={lesson} timeLeft={timeLeft} onReady={() => setPhase('explain')} />
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
                    apiKey={openaiKey}
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
                        className="w-full bg-app-card border border-app-border rounded-2xl p-4 text-gray-700 text-sm placeholder-gray-600 resize-none focus:border-blue-500/60 transition-colors"
                      />
                      <div className="absolute bottom-3 right-3 text-gray-600 text-xs">{wordCount} words</div>
                    </div>

                    {error && (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                        <p className="text-rose-400 text-sm">{error}</p>
                      </div>
                    )}

                    <button
                      onClick={handleSubmit}
                      disabled={wordCount < 5}
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
              <FeedbackView
                feedback={feedback}
                onTryAgain={handleTryAgain}
                onComplete={handleComplete}
                onTeach={isPremium ? startTeaching : () => navigate('/pricing')}
                isPremium={isPremium}
                userExplanation={explanation}
                fluency={fluency}
              />
            </Phase>
          )}

          {/* TEACHING */}
          {phase === 'teaching' && (
            <Phase key="teaching">
              <TeachingPhase
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

function ScoreCard({ label, value, color }) {
  return (
    <div className="bg-app-card border border-app-border rounded-2xl p-4 text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}<span className="text-sm text-gray-500">/10</span></p>
      <p className="text-gray-400 text-xs mt-1">{label}</p>
    </div>
  )
}

function FeedbackView({ feedback, onTryAgain, onComplete, onTeach, isPremium, userExplanation, fluency }) {
  const [showSuggested, setShowSuggested] = useState(false)

  return (
    <div className="pt-2 space-y-5">
      <div>
        <h3 className="text-slate-800 font-bold text-lg mb-1">🤖 AI Feedback</h3>
        <p className="text-gray-400 text-sm">Here's exactly where you are and what to improve.</p>
      </div>

      {/* Scores */}
      <div className="bg-app-card border border-app-border rounded-2xl p-4 space-y-3">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-400 text-sm">Clarity</span>
            <span className="text-blue-400 text-xs font-medium">How simple & clear</span>
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

      {/* Positive note */}
      {feedback.positiveNote && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
          <p className="text-emerald-300 text-sm">{feedback.positiveNote}</p>
        </div>
      )}

      {/* Grammar Errors */}
      {feedback.grammarErrors?.length > 0 && (
        <div>
          <p className="text-rose-400 text-sm font-semibold mb-2 flex items-center gap-2">
            <XCircle size={15} /> Grammar to Fix ({feedback.grammarErrors.length})
          </p>
          <div className="space-y-2">
            {feedback.grammarErrors.map((err, i) => (
              <div key={i} className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-rose-400 text-xs line-through">"{err.error}"</span>
                  <span className="text-gray-500">→</span>
                  <span className="text-emerald-400 text-xs font-medium">"{err.correction}"</span>
                </div>
                <p className="text-gray-400 text-xs">{err.tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missed Points */}
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

      {/* Gaps */}
      {feedback.gaps?.length > 0 && (
        <div>
          <p className="text-gray-400 text-sm font-semibold mb-2">🎯 Gaps to work on</p>
          <div className="flex flex-wrap gap-2">
            {feedback.gaps.map((gap, i) => (
              <span key={i} className="bg-blue-500/20 text-blue-300 text-xs px-3 py-1.5 rounded-full capitalize">
                {gap}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Simplification tip */}
      {feedback.simplificationTip && (
        <div className="bg-app-card border border-cyan-500/20 rounded-2xl p-4">
          <p className="text-cyan-400 text-sm font-semibold mb-1">💡 Simplify it</p>
          <p className="text-gray-600 text-sm">{feedback.simplificationTip}</p>
        </div>
      )}

      {/* Suggested explanation */}
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

      {/* Fluency panel (if used voice) */}
      {fluency && (
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-cyan-400 text-sm font-semibold">🎙️ Fluency Analysis</p>
            <span className="text-cyan-400 font-bold text-sm">{fluency.fluencyScore}/10</span>
          </div>
          {fluency.wpm && <p className="text-gray-400 text-xs">{fluency.pacingFeedback}</p>}
          {fluency.fillerCount > 0 && <p className="text-gray-500 text-xs">Filler words detected: {fluency.fillerCount}</p>}
          <p className="text-gray-600 text-xs">💡 {fluency.strength}</p>
          {fluency.improvements?.map((tip, i) => (
            <p key={i} className="text-gray-500 text-xs">• {tip}</p>
          ))}
        </div>
      )}

      {/* Teach Someone CTA */}
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
          <RotateCcw size={16} />
          Try Again
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

function TeachingPhase({ history, round, input, onInput, onSend, loading, score, summary, onComplete }) {
  const chatEndRef = useRef(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history, loading])

  const concluded = score !== null

  return (
    <div className="pt-2 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-xl">🧑‍🎓</div>
        <div>
          <p className="text-slate-800 font-semibold text-sm">Teo (AI Student)</p>
          <p className="text-gray-500 text-xs">
            {concluded ? 'Session complete!' : `Round ${Math.min(round, 3)} of 3 — answer the student's question`}
          </p>
        </div>
        {!concluded && (
          <div className="ml-auto flex gap-1">
            {[1,2,3].map((r) => (
              <div key={r} className={`w-2 h-2 rounded-full ${r <= round ? 'bg-blue-500' : 'bg-app-border'}`} />
            ))}
          </div>
        )}
      </div>

      {/* Mastery score banner */}
      {concluded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 gradient-primary rounded-2xl p-4 glow-purple text-center"
        >
          <p className="text-blue-200 text-xs mb-1">Teaching Mastery</p>
          <p className="text-slate-800 font-bold text-3xl">{score}<span className="text-sm text-blue-200">/10</span></p>
          {summary && <p className="text-blue-200 text-xs mt-1 leading-tight">"{summary}"</p>}
          <p className="text-blue-200 text-xs mt-2">+{Math.round(score * 10)} XP earned!</p>
        </motion.div>
      )}

      {/* Chat bubbles */}
      <div className="flex-1 space-y-3 overflow-y-auto mb-4 max-h-80 pr-1">
        {history.length === 0 && loading && (
          <div className="flex gap-3 items-end">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-sm flex-shrink-0">🧑‍🎓</div>
            <div className="bg-app-card border border-app-border rounded-2xl rounded-bl-sm px-4 py-3">
              <motion.div className="flex gap-1" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              </motion.div>
            </div>
          </div>
        )}
        {history.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 items-end ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {msg.role === 'student' && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${msg.isFinal ? 'gradient-primary' : 'bg-blue-500/20'}`}>
                🧑‍🎓
              </div>
            )}
            <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'gradient-primary text-white rounded-br-sm'
                : 'bg-app-card border border-app-border text-gray-700 rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </motion.div>
        ))}
        {history.length > 0 && loading && (
          <div className="flex gap-3 items-end">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-sm flex-shrink-0">🧑‍🎓</div>
            <div className="bg-app-card border border-app-border rounded-2xl rounded-bl-sm px-4 py-3">
              <motion.div className="flex gap-1" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              </motion.div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input or Complete */}
      {concluded ? (
        <button
          onClick={onComplete}
          className="w-full py-4 rounded-2xl gradient-primary text-white font-semibold glow-purple flex items-center justify-center gap-2"
        >
          Complete Lesson <ChevronRight size={18} />
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => onInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
            placeholder="Answer Teo's question..."
            disabled={loading || history.length === 0}
            className="flex-1 bg-app-card border border-app-border rounded-2xl px-4 py-3 text-gray-700 text-sm placeholder-gray-600 focus:border-blue-500/60 transition-colors disabled:opacity-50"
          />
          <button
            onClick={onSend}
            disabled={!input.trim() || loading || history.length === 0}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
              input.trim() && !loading ? 'gradient-primary glow-purple' : 'bg-app-card border border-app-border'
            }`}
          >
            <Send size={18} className={input.trim() && !loading ? 'text-slate-800' : 'text-gray-600'} />
          </button>
        </div>
      )}
    </div>
  )
}

function ReadPhase({ lesson, timeLeft, onReady }) {
  const type    = lesson.type || 'text'
  const videoId = extractYouTubeId(lesson.videoUrl)

  return (
    <div className="pt-2 space-y-5">
      {/* Timer — only for text */}
      {type === 'text' && (
        <div className="flex items-center justify-between">
          <h3 className="text-slate-800 font-bold text-lg">📖 Read carefully</h3>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${
            timeLeft <= 15 ? 'bg-rose-500/20 text-rose-400' : 'bg-app-card text-cyan-400'
          }`}>
            ⏱ {timeLeft}s
          </div>
        </div>
      )}

      {/* ── VIDEO ─────────────────────────────────────────────── */}
      {type === 'video' && videoId && (
        <div className="space-y-4">
          <h3 className="text-slate-800 font-bold text-lg">🎥 Watch the video</h3>
          <div className="rounded-2xl overflow-hidden border border-app-border" style={{ aspectRatio: '16/9' }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0`}
              title={lesson.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <p className="text-amber-400 text-xs font-semibold">💡 Watch once — then explain from memory</p>
          </div>
        </div>
      )}

      {/* ── AUDIO ─────────────────────────────────────────────── */}
      {type === 'audio' && lesson.audioUrl && (
        <div className="space-y-4">
          <h3 className="text-slate-800 font-bold text-lg">🎧 Listen carefully</h3>
          <div className="bg-app-card border border-app-border rounded-2xl p-5">
            <audio controls className="w-full" controlsList="nodownload">
              <source src={lesson.audioUrl} />
              Your browser does not support the audio element.
            </audio>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <p className="text-amber-400 text-xs font-semibold">💡 Listen as many times as you need — then explain</p>
          </div>
        </div>
      )}

      {/* ── TEXT ──────────────────────────────────────────────── */}
      {type === 'text' && (
        <div className="bg-app-card border border-app-border rounded-2xl p-5">
          <p className="text-gray-700 leading-relaxed text-base">{lesson.content}</p>
        </div>
      )}

      {/* Context note for video/audio */}
      {type !== 'text' && lesson.content && (
        <div className="bg-app-card border border-app-border rounded-2xl p-4">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Context</p>
          <p className="text-gray-400 text-sm leading-relaxed">{lesson.content}</p>
        </div>
      )}

      {/* Key points */}
      <div className="bg-app-card border border-blue-500/20 rounded-2xl p-4">
        <p className="text-blue-400 text-sm font-semibold mb-2">🎯 Focus on understanding:</p>
        <ul className="space-y-1">
          {lesson.keyPoints.slice(0, 3).map((kp, i) => (
            <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>{kp}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onReady}
        className="w-full py-4 rounded-2xl gradient-primary text-white font-semibold text-lg glow-purple"
      >
        I'm Ready to Explain →
      </button>
      {type === 'text' && (
        <p className="text-center text-gray-600 text-xs">
          {timeLeft > 0 ? `Take your time — ${timeLeft}s remaining` : "Time's up — you can still keep reading"}
        </p>
      )}
    </div>
  )
}
