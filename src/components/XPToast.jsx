import { motion, AnimatePresence } from 'framer-motion'
import TeoMascot from './TeoMascot'

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
          <div className="gradient-primary rounded-2xl pl-3 pr-6 py-3 glow-purple flex items-center gap-3 shadow-2xl">
            <motion.div
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 0.6, repeat: 1 }}
              className="w-10 h-10 flex-shrink-0"
            >
              <TeoMascot mood="excited" className="w-full h-full" />
            </motion.div>
            <div>
              <p className="text-slate-800 font-bold text-lg">+{xp} XP</p>
              <p className="text-violet-200 text-xs">Keep it up!</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
