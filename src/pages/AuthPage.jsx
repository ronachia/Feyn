import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Loader2,
  Sparkles, Gift, Zap, Github, Chrome, Apple,
  CheckCircle2, AlertCircle, ArrowLeft
} from 'lucide-react'
import { useSignIn, useSignUp, useClerk, useAuth } from '@clerk/clerk-react'
import { isNativePlatform } from '../services/platform'

// ─────────────────────────────────────────────────────────────────────────────
// AUTH PAGE PRINCIPAL - Entry point com tabs de Sign In / Sign Up
// ─────────────────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const { isSignedIn } = useAuth()
  const navigate = useNavigate()

  // Se já está logado, redireciona.
  // NOTE: era `window.location.href = '/home'` — isso forçava um full page
  // reload. Dentro do WebView do Capacitor (origem https://localhost) isso
  // é a causa mais provável do "site can't be reached" visto no Android:
  // navegação de página inteira em vez de troca de rota do próprio SPA.
  useEffect(() => {
    if (isSignedIn) navigate('/home', { replace: true })
  }, [isSignedIn, navigate])

  if (isSignedIn) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-4xl shadow-xl shadow-violet-500/25">
            🧠
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            FeynLearn
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Master English by explaining, not memorizing
          </p>
        </motion.div>

        {/* Card Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-white/50"
        >
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {[
              { id: 'signin', label: 'Sign In', icon: Zap },
              { id: 'signup', label: 'Create Account', icon: Sparkles }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all ${
                  mode === id 
                    ? 'text-violet-600 border-b-2 border-violet-500 bg-violet-50/50' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {mode === 'signin' ? (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <SignInForm />
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <SignUpForm />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Features / Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 grid grid-cols-3 gap-4"
        >
          {[
            { icon: CheckCircle2, label: '85+ Lessons', color: 'text-emerald-500' },
            { icon: Zap, label: 'AI Powered', color: 'text-amber-500' },
            { icon: Gift, label: 'Free Trial', color: 'text-violet-500' }
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <Icon size={20} className={color} />
              <span className="text-xs font-medium text-slate-500">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGN IN FORM
// ─────────────────────────────────────────────────────────────────────────────

function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const [strategy, setStrategy] = useState('password') // 'password' | 'magic'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!isLoaded) return <LoadingState />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (strategy === 'magic') {
        // Magic Link
        const result = await signIn.create({
          strategy: 'email_link',
          identifier: email,
        })
        if (result.status === 'complete') {
          setSuccess('Magic link sent! Check your email.')
        }
      } else {
        // Password
        const result = await signIn.create({
          identifier: email,
          password,
        })
        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId })
        }
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleSocial = async (provider) => {
    try {
      await signIn.authenticateWithRedirect({
        strategy: `oauth_${provider}`,
        redirectUrl: '/auth/callback',
        redirectUrlComplete: '/home'
      })
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Social login failed')
    }
  }

  return (
    <div className="space-y-5">
      {/* Social Login — hidden on native: Clerk's authenticateWithRedirect
          does a full-page window.location redirect to a relative URL, which
          only makes sense on the web. Inside the Capacitor WebView there's
          no real https://localhost/auth/callback to redirect back to, so
          this reliably breaks (ERR_CONNECTION_REFUSED). Needs a proper
          native OAuth flow (custom scheme + Clerk Dashboard config) before
          re-enabling here — tracked as a follow-up, not fixed by this hide. */}
      {!isNativePlatform() && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'google', icon: Chrome, label: 'Google', color: 'hover:bg-red-50 hover:border-red-200' },
              { id: 'apple', icon: Apple, label: 'Apple', color: 'hover:bg-slate-100 hover:border-slate-300' },
              { id: 'github', icon: Github, label: 'GitHub', color: 'hover:bg-slate-800 hover:text-white' }
            ].map(({ id, icon: Icon, label, color }) => (
              <button
                key={id}
                onClick={() => handleSocial(id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 transition-all ${color}`}
              >
                <Icon size={20} />
                <span className="text-xs font-medium text-slate-600">{label}</span>
              </button>
            ))}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-400">or continue with email</span>
            </div>
          </div>
        </>
      )}

      {/* Strategy Toggle */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
        {[
          { id: 'password', label: 'Password', icon: Lock },
          { id: 'magic', label: 'Magic Link', icon: Mail }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setStrategy(id); setError(''); setSuccess('') }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
              strategy === id 
                ? 'bg-white text-violet-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
        </div>

        {strategy === 'password' && (
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required={strategy === 'password'}
              minLength={8}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-12 py-3 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        )}

        {strategy === 'password' && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => signIn?.create({ strategy: 'reset_password_email_code', identifier: email })}
              className="text-xs text-violet-600 hover:text-violet-700 font-medium"
            >
              Forgot password?
            </button>
          </div>
        )}

        {/* Error/Success */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3"
            >
              <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />
              <p className="text-rose-600 text-xs">{error}</p>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3"
            >
              <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
              <p className="text-emerald-600 text-xs">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={loading || !email || (strategy === 'password' && !password)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5"
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Please wait...</>
          ) : (
            <>{strategy === 'magic' ? 'Send Magic Link' : 'Sign In'} <ArrowRight size={18} /></>
          )}
        </button>
      </form>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGN UP FORM
// ─────────────────────────────────────────────────────────────────────────────

function SignUpForm() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [showReferral, setShowReferral] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [code, setCode] = useState('')

  if (!isLoaded) return <LoadingState />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      })

      if (result.status === 'missing_requirements') {
        // Precisa verificar email
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        setVerifying(true)
      } else if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  const handleSocial = async (provider) => {
    try {
      await signUp.authenticateWithRedirect({
        strategy: `oauth_${provider}`,
        redirectUrl: '/auth/callback',
        redirectUrlComplete: '/home'
      })
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Social signup failed')
    }
  }

  if (verifying) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-100 flex items-center justify-center">
          <Mail size={32} className="text-violet-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Check your email</h3>
          <p className="text-sm text-slate-500 mt-1">
            We sent a verification code to <strong>{email}</strong>
          </p>
        </div>
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength={6}
            className="w-full text-center tracking-[0.5em] font-mono text-lg bg-slate-50 border border-slate-200 rounded-xl py-3 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
          {error && (
            <p className="text-rose-500 text-xs">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-500 to-purple-600 text-white disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Verify Email'}
          </button>
        </form>
        <button
          onClick={() => setVerifying(false)}
          className="text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1"
        >
          <ArrowLeft size={12} /> Go back
        </button>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Social Signup — hidden on native, same reason as SignInForm above. */}
      {!isNativePlatform() && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'google', icon: Chrome, label: 'Google', color: 'hover:bg-red-50 hover:border-red-200' },
              { id: 'apple', icon: Apple, label: 'Apple', color: 'hover:bg-slate-100 hover:border-slate-300' },
              { id: 'github', icon: Github, label: 'GitHub', color: 'hover:bg-slate-800 hover:text-white' }
            ].map(({ id, icon: Icon, label, color }) => (
              <button
                key={id}
                onClick={() => handleSocial(id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 transition-all ${color}`}
              >
                <Icon size={20} />
                <span className="text-xs font-medium text-slate-600">{label}</span>
              </button>
            ))}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-400">or create with email</span>
            </div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        {/* Email */}
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create password (8+ characters)"
            required
            minLength={8}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-12 py-3 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Password Strength Indicator */}
        <PasswordStrength password={password} />

        {/* Referral Code (Optional) */}
        <AnimatePresence>
          {showReferral ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative"
            >
              <Gift size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Referral code (optional)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 uppercase tracking-wider"
              />
            </motion.div>
          ) : (
            <button
              type="button"
              onClick={() => setShowReferral(true)}
              className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
            >
              <Gift size={12} /> Have a referral code?
            </button>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3"
            >
              <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />
              <p className="text-rose-600 text-xs">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !email || !password || password.length < 8}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5"
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Creating...</>
          ) : (
            <>Create Account <Sparkles size={18} /></>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-slate-400">
        By signing up, you agree to our{' '}
        <a href="#" className="text-violet-600 hover:underline">Terms</a> and{' '}
        <a href="#" className="text-violet-600 hover:underline">Privacy</a>
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD STRENGTH INDICATOR
// ─────────────────────────────────────────────────────────────────────────────

function PasswordStrength({ password }) {
  const requirements = [
    { test: /.{8,}/, label: '8+ characters' },
    { test: /[A-Z]/, label: 'Uppercase' },
    { test: /[a-z]/, label: 'Lowercase' },
    { test: /[0-9]/, label: 'Number' },
    { test: /[^A-Za-z0-9]/, label: 'Special char' }
  ]

  const met = requirements.filter(r => r.test.test(password)).length
  const strength = met === 0 ? 'weak' : met < 3 ? 'fair' : met < 5 ? 'good' : 'strong'
  
  const colors = {
    weak: 'bg-rose-400',
    fair: 'bg-amber-400',
    good: 'bg-blue-400',
    strong: 'bg-emerald-400'
  }

  if (!password) return null

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= Math.ceil(met / 1.25) ? colors[strength] : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {requirements.map(({ test, label }) => (
          <span
            key={label}
            className={`text-[10px] px-2 py-1 rounded-full transition-colors ${
              test.test(password) 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING STATE
// ─────────────────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 size={32} className="animate-spin text-violet-500 mb-3" />
      <p className="text-slate-400 text-sm">Loading...</p>
    </div>
  )
}
