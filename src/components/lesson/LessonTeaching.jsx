import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, ChevronRight } from 'lucide-react'

export default function LessonTeaching({ history, round, input, onInput, onSend, loading, score, summary, onComplete }) {
  const chatEndRef = useRef(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history, loading])

  const concluded = score !== null

  return (
    <div className="pt-2 flex flex-col h-full">
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
