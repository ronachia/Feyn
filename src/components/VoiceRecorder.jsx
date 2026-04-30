import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, RotateCcw, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { transcribeAudio } from '../services/whisper'

const BAR_COUNT = 18

export default function VoiceRecorder({ onTranscript, apiKey, disabled }) {
  const [status, setStatus]         = useState('idle')
  const [duration, setDuration]     = useState(0)
  const [editedText, setEditedText] = useState('')
  const [error, setError]           = useState('')
  const [barHeights, setBarHeights] = useState(Array(BAR_COUNT).fill(4))

  const mediaRecorderRef = useRef(null)
  const chunksRef        = useRef([])
  const timerRef         = useRef(null)
  const waveRef          = useRef(null)
  const analyserRef      = useRef(null)
  const audioCtxRef      = useRef(null)

  useEffect(() => () => {
    clearInterval(timerRef.current)
    cancelAnimationFrame(waveRef.current)
    audioCtxRef.current?.close()
  }, [])

  const animateWave = (analyser) => {
    const data = new Uint8Array(analyser.frequencyBinCount)
    const draw = () => {
      waveRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(data)
      const step  = Math.floor(data.length / BAR_COUNT)
      const bars  = Array.from({ length: BAR_COUNT }, (_, i) => {
        const val = data[i * step] || 0
        return Math.max(4, Math.round((val / 255) * 40))
      })
      setBarHeights(bars)
    }
    draw()
  }

  const startRecording = async () => {
    if (disabled) return
    setError('')
    try {
      const stream    = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      const audioCtx  = new (window.AudioContext || window.webkitAudioContext)()
      const analyser  = audioCtx.createAnalyser()
      analyser.fftSize = 64
      audioCtx.createMediaStreamSource(stream).connect(analyser)
      audioCtxRef.current = audioCtx
      analyserRef.current = analyser
      animateWave(analyser)

      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        cancelAnimationFrame(waveRef.current)
        audioCtxRef.current?.close()
        setBarHeights(Array(BAR_COUNT).fill(4))
        const blob = new Blob(chunksRef.current, { type: mr.mimeType })
        setStatus('transcribing')
        try {
          const result = await transcribeAudio(blob, apiKey)
          setEditedText(result.text)
          setStatus('done')
        } catch (e) {
          setError(e.message || 'Transcription failed. Check your API key.')
          setStatus('error')
        }
      }

      mr.start(200)
      mediaRecorderRef.current = mr
      setDuration(0)
      setStatus('recording')
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
    } catch {
      setError('Microphone access denied. Please allow access in browser settings.')
      setStatus('error')
    }
  }

  const stopRecording = () => {
    clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
  }

  const reset = () => {
    setStatus('idle')
    setEditedText('')
    setDuration(0)
    setError('')
    setBarHeights(Array(BAR_COUNT).fill(4))
  }

  const handleUse = () => {
    if (editedText.trim()) onTranscript(editedText.trim())
  }

  const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">

        {/* ── IDLE ─────────────────────────────────────────────────── */}
        {status === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button
              onClick={startRecording}
              disabled={disabled}
              className="w-full flex flex-col items-center gap-3 py-8 rounded-2xl bg-app-card border-2 border-dashed border-blue-500/30 hover:border-blue-500/60 transition-all group"
            >
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center glow-purple group-hover:scale-105 transition-transform">
                <Mic size={28} className="text-slate-800" />
              </div>
              <div className="text-center">
                <p className="text-slate-800 font-semibold">Tap to Record</p>
                <p className="text-gray-500 text-xs mt-0.5">Transcribed by OpenAI Whisper</p>
              </div>
            </button>
          </motion.div>
        )}

        {/* ── RECORDING ────────────────────────────────────────────── */}
        {status === 'recording' && (
          <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Waveform */}
            <div className="bg-app-card border border-rose-500/20 rounded-2xl p-5">
              <div className="flex items-end justify-center gap-1 h-12 mb-4">
                {barHeights.map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: h }}
                    transition={{ duration: 0.1 }}
                    className="w-1.5 rounded-full bg-gradient-to-t from-blue-600 to-cyan-400"
                    style={{ minHeight: 4 }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-rose-400 font-mono text-sm font-bold">{fmt(duration)}</span>
                <span className="text-gray-500 text-xs">recording...</span>
              </div>
            </div>
            <button
              onClick={stopRecording}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold"
            >
              <Square size={18} fill="currentColor" /> Stop Recording
            </button>
          </motion.div>
        )}

        {/* ── TRANSCRIBING ─────────────────────────────────────────── */}
        {status === 'transcribing' && (
          <motion.div key="transcribing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-10 bg-app-card border border-app-border rounded-2xl"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
              <Loader size={32} className="text-blue-400" />
            </motion.div>
            <div className="text-center">
              <p className="text-slate-800 font-semibold">Transcribing with Whisper...</p>
              <p className="text-gray-500 text-xs mt-1">OpenAI is converting your speech to text</p>
            </div>
          </motion.div>
        )}

        {/* ── DONE ─────────────────────────────────────────────────── */}
        {status === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} className="text-emerald-400" />
              <span className="text-emerald-400 text-sm font-semibold">Transcribed — review & edit if needed</span>
            </div>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={5}
              className="w-full bg-app-card border border-emerald-500/30 rounded-xl px-4 py-3 text-gray-700 text-sm resize-none focus:border-blue-500/60 transition-colors"
            />
            <p className="text-gray-600 text-xs text-right">{editedText.trim().split(/\s+/).filter(Boolean).length} words</p>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-app-card border border-app-border text-gray-400 text-sm font-medium"
              >
                <RotateCcw size={14} /> Re-record
              </button>
              <button
                onClick={handleUse}
                disabled={editedText.trim().split(/\s+/).length < 5}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                  editedText.trim().split(/\s+/).length >= 5
                    ? 'gradient-primary text-white glow-purple'
                    : 'bg-app-card border border-app-border text-gray-600 cursor-not-allowed'
                }`}
              >
                <CheckCircle size={16} /> Use This Explanation
              </button>
            </div>
          </motion.div>
        )}

        {/* ── ERROR ────────────────────────────────────────────────── */}
        {status === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={18} className="text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-rose-400 text-sm">{error}</p>
            </div>
            <button onClick={reset} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-app-card border border-app-border text-gray-600 font-medium text-sm">
              <RotateCcw size={14} /> Try Again
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
