import { motion, AnimatePresence } from 'framer-motion'

export default function XPToast({ xp, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.8 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{    opacity: 0, y: -20, scale: 0.9  }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="gradient-primary rounded-2xl px-6 py-3 glow-purple flex items-center gap-3 shadow-2xl">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="text-slate-800 font-bold text-lg">+{xp} XP</p>
              <p className="text-blue-200 text-xs">Keep it up!</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
