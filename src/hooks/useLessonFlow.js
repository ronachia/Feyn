import { useState, useEffect, useRef } from 'react'
import useAppStore from '../store/useAppStore'
import useProgressSync from './useProgressSync'
import useAnalytics from './useAnalytics'
import { analyzeExplanation } from '../services/ai'
import { analyzeFluency } from '../services/whisper'
import { getStudentQuestion } from '../services/teachMode'
import { createSpeechRecognizer } from '../services/platform'

const READING_TIME = 60

/**
 * Owns every piece of state and every handler for the lesson flow
 * (intro → read → explain → analyzing → feedback → teaching → complete).
 * Lesson.jsx just renders whatever phase is active — this hook is where
 * the actual orchestration and API calls live, so the component doesn't
 * have to carry ~15 useState calls and a dozen handlers itself.
 */
export default function useLessonFlow(lesson) {
  const {
    completeLesson, addGaps, addSession, earnXP, calculateSessionXP,
    recordSessionStats, streak, isPremium, checkAndIncrementAI, remainingAICalls,
  } = useAppStore()
  const { syncProgress } = useProgressSync()
  const analytics = useAnalytics()

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

  useEffect(() => {
    if (lesson && phase === 'read') analytics.lessonStarted(lesson)
  }, [phase, lesson?.id])

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
    const recognition = createSpeechRecognizer({
      onResult: (transcript) => setExplanation(transcript),
      onError:  () => setIsRecording(false),
      onEnd:    () => setIsRecording(false),
    })
    if (!recognition) {
      setError('Voice recognition is not supported in your browser. Please type your explanation.')
      return
    }
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
    if (!checkAndIncrementAI()) {
      setError('LIMIT_REACHED')
      analytics.analysisFailed(lesson, 'LIMIT_REACHED')
      return
    }
    setError(null)
    setIsAnalyzing(true)
    setPhase('analyzing')
    analytics.analysisRequested(lesson, inputMode)

    try {
      const result = await analyzeExplanation({
        originalContent: lesson.content,
        userExplanation: explanation,
        keyPoints: lesson.keyPoints,
      })
      setFeedback(result)
      if (result.gaps?.length) {
        addGaps(result.gaps)
        result.gaps.forEach((g) => analytics.gapDetected(g, lesson.id))
      }
      analytics.analysisPassed(lesson, result)
      addSession({ lessonId: lesson.id, clarityScore: result.clarityScore, coverageScore: result.coverageScore })
      setPhase('feedback')
    } catch (err) {
      analytics.analysisFailed(lesson, 'API_ERROR')
      setError('Failed to analyze. Please try again.')
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
    analytics.lessonCompleted(lesson, { clarityScore: feedback?.clarityScore, coverageScore: feedback?.coverageScore, xp })
    setSessionXP(xp)
    setShowXPToast(true)
    setTimeout(() => setShowXPToast(false), 2500)
    setPhase('complete')
    syncProgress().catch((e) => console.error('syncProgress failed:', e))
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
    try {
      const f = await analyzeFluency({ text, duration: 0 })
      setFluency(f)
    } catch {
      // Fluency scoring is a bonus on top of the transcript the user already
      // has in hand — don't block their flow, just let them know it's missing.
      setError('Could not analyze fluency for this recording, but your explanation was saved.')
    }
  }

  const startTeaching = async () => {
    setPhase('teaching')
    setTeachLoading(true)
    setTeachHistory([])
    setTeachRound(0)
    setError(null)
    try {
      const res = await getStudentQuestion({ topic: lesson.title, explanation, history: [], round: 0 })
      setTeachHistory([{ role: 'student', content: res.question }])
      setTeachRound(1)
    } catch {
      setError('Could not start Teach Mode. Please try again.')
      setPhase('feedback')
    } finally {
      setTeachLoading(false)
    }
  }

  const sendTeachingAnswer = async () => {
    if (!teachInput.trim() || teachLoading) return
    const userMsg    = { role: 'user', content: teachInput.trim() }
    const newHistory = [...teachHistory, userMsg]
    setTeachHistory(newHistory)
    setTeachInput('')
    setTeachLoading(true)
    setError(null)
    try {
      const res = await getStudentQuestion({ topic: lesson.title, explanation, history: newHistory, round: teachRound })
      setTeachHistory([...newHistory, { role: 'student', content: res.question, isFinal: res.concluded }])
      if (res.concluded) {
        setTeachScore(res.masteryScore)
        setTeachSummary(res.summary)
        const xpBonus = Math.round(res.masteryScore * 10)
        earnXP(xpBonus)
      } else {
        setTeachRound((r) => r + 1)
      }
    } catch {
      setError("Teo didn't respond — try sending your answer again.")
    } finally {
      setTeachLoading(false)
    }
  }

  return {
    // phase
    phase, setPhase,
    // reading
    timeLeft,
    // explain
    explanation, setExplanation,
    inputMode, setInputMode,
    isRecording, fluency,
    showContent, peeked,
    // feedback
    feedback, isAnalyzing,
    // teaching
    teachHistory, teachRound, teachInput, setTeachInput, teachLoading, teachScore, teachSummary,
    // completion
    sessionXP, showXPToast,
    // shared
    error, setError,
    isPremium, remainingAICalls,
    // handlers
    startRecording, stopRecording,
    handleSubmit, handleComplete, handleTryAgain, handlePeek,
    handleVoiceTranscript, startTeaching, sendTeachingAnswer,
  }
}
