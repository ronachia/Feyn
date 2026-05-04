import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabaseConfigured } from '../services/supabase'

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode]       = useState('signin') // 'signin' | 'signup'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password)
        setSuccess('Account created! Check your email to confirm, then sign in.')
        setMode('signin')
      } else {
        await signIn(email.trim(), password)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell flex flex-col min-h-screen bg-app-bg">
      <div className="flex-1 flex flex-col justify-center px-6 pb-12">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center text-5xl glow-purple mb-4">
            🧠
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Feyn<span className="text-gradient">Learn</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Master English by explaining, not memorizing.</p>
        </motion.div>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-app-card border border-app-border rounded-2xl p-1 mb-6">
          {[['signin', 'Sign In'], ['signup', 'Create Account']].map(([m, label]) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSuccess(null) }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === m ? 'gradient-primary text-white glow-purple' : 'text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full bg-app-card border border-app-border rounded-2xl pl-11 pr-4 py-3.5 text-gray-700 text-sm placeholder-gray-500 focus:border-blue-500/60 transition-colors"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="w-full bg-app-card border border-app-border rounded-2xl pl-11 pr-12 py-3.5 text-gray-700 text-sm placeholder-gray-500 focus:border-blue-500/60 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3"
              >
                <p className="text-rose-400 text-sm">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3"
              >
                <p className="text-emerald-400 text-sm">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-all ${
              loading || !email || !password
                ? 'bg-app-card border border-app-border text-gray-500 cursor-not-allowed'
                : 'gradient-primary text-white glow-purple'
            }`}
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Loading...</>
              : <>{mode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>
            }
          </button>
        </form>

        {!supabaseConfigured && (
          <div className="mt-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-amber-600 text-xs">
              <strong>Dev mode:</strong> Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your <code>.env</code> file to enable accounts. See <code>supabase_schema.sql</code> for setup.
            </p>
          </div>
        )}
        {supabaseConfigured && (
          <p className="text-center text-gray-600 text-xs mt-6">
            Your progress syncs across all your devices. 🔄
          </p>
        )}
      </div>
    </div>
  )
}
