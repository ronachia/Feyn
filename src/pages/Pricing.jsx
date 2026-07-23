import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, X, Crown, Zap, Mic, BookOpen, Sparkles, Users, Loader2 } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { callEdgeFunction } from '../services/supabase'
import useProgressSync from '../hooks/useProgressSync'
import { openURL } from '../services/platform'

const FREE_FEATURES = [
  { label: 'Full lesson library',    ok: true  },
  { label: 'Text-based explanations', ok: true  },
  { label: '3 AI analyses per day',   ok: true  },
  { label: 'XP, levels & badges',     ok: true  },
  { label: 'Voice mode (Whisper AI)', ok: false },
  { label: 'Teach mode (Teo AI)',     ok: false },
  { label: 'Create custom lessons',   ok: false },
  { label: 'Unlimited AI feedback',   ok: false },
]

const PREMIUM_FEATURES = [
  { label: 'Everything in Free',            ok: true },
  { label: 'Voice mode with Whisper AI',    ok: true },
  { label: 'Unlimited AI feedback',         ok: true },
  { label: 'Teach mode (Teo AI Student)',   ok: true },
  { label: 'Create lessons from video/audio/text', ok: true },
  { label: 'New lessons added monthly',     ok: true },
]

const HIGHLIGHTS = [
  { icon: Mic,      label: 'Whisper Voice',    desc: 'Speak your explanation, AI transcribes + evaluates fluency'  },
  { icon: Users,    label: 'Teo AI Student',   desc: 'AI simulates a curious student asking follow-up questions'   },
  { icon: Sparkles, label: 'Custom Lessons',   desc: 'Create lessons from any text, YouTube video, or audio URL'   },
  { icon: Zap,      label: 'Unlimited AI',     desc: 'No daily caps — analyze as many explanations as you want'    },
]

export default function Pricing() {
  const navigate              = useNavigate()
  const [params]              = useSearchParams()
  const { isPremium, activatePremium, remainingAICalls } = useAppStore()
  const { loadFromSupabase }  = useProgressSync()
  const [activated, setActivated]   = useState(false)
  const [billing, setBilling]       = useState('monthly')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [verifying, setVerifying]   = useState(false)
  const pollRef = useRef(null)

  useEffect(() => {
    if (params.get('payment') === 'success' && !isPremium) {
      setVerifying(true)
      let attempts = 0
      pollRef.current = setInterval(async () => {
        attempts++
        const result = await loadFromSupabase()
        if (result?.profile?.is_premium) {
          clearInterval(pollRef.current)
          activatePremium()
          setActivated(true)
          setVerifying(false)
        } else if (attempts >= 8) {
          clearInterval(pollRef.current)
          setVerifying(false)
        }
      }, 2000)
    }
    return () => clearInterval(pollRef.current)
  }, [])

  const price        = billing === 'monthly' ? 'R$59,90' : 'R$598,80'
  const priceOld     = billing === 'monthly' ? 'R$89,90' : 'R$1.078,80'
  const period       = billing === 'monthly' ? '/mês' : '/ano (R$49,90/mês)'
  const discountPct  = billing === 'monthly' ? '33%' : '44%'
  const saving       = billing === 'yearly'

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    try {
      const { url } = await callEdgeFunction('create-subscription', { billing })
      await openURL(url)
    } catch (err) {
      alert(err.message || 'Failed to start checkout. Try again.')
      setCheckoutLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="app-shell flex flex-col min-h-screen bg-app-bg items-center justify-center px-6 text-center gap-4">
        <Loader2 size={40} className="text-blue-400 animate-spin" />
        <p className="text-slate-800 font-semibold text-lg">Verifying your payment...</p>
        <p className="text-gray-400 text-sm">This usually takes a few seconds.</p>
      </div>
    )
  }

  if (activated || isPremium) {
    return (
      <div className="app-shell flex flex-col min-h-screen bg-app-bg items-center justify-center px-6 text-center gap-6">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center glow-purple"
        >
          <Crown size={40} className="text-slate-800" />
        </motion.div>
        <div>
          <h1 className="text-slate-800 font-bold text-2xl mb-2">You're Premium! 👑</h1>
          <p className="text-gray-400">All features unlocked. Enjoy FeynLearn without limits.</p>
        </div>
        <div className="w-full space-y-2">
          {PREMIUM_FEATURES.map((f, i) => (
            <div key={i} className="flex items-center gap-3 bg-app-card border border-emerald-500/20 rounded-xl px-4 py-3">
              <Check size={16} className="text-emerald-400 flex-shrink-0" />
              <span className="text-gray-700 text-sm">{f.label}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate('/home')}
          className="w-full py-4 rounded-2xl gradient-primary text-white font-semibold text-lg glow-purple"
        >
          Go Learn →
        </button>
      </div>
    )
  }

  return (
    <div className="app-shell flex flex-col min-h-screen bg-app-bg pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-12 pb-2">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-app-card flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="flex-1 px-6 overflow-y-auto space-y-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4 glow-purple">
            <Crown size={28} className="text-slate-800" />
          </div>
          <h1 className="text-slate-800 font-bold text-2xl mb-1">FeynLearn Premium</h1>
          <p className="text-gray-400 text-sm">
            Unlock every tool to master English with the Feynman method.
          </p>
          {remainingAICalls() < 3 && (
            <div className="mt-3 inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5">
              <span className="text-amber-400 text-xs font-semibold">
                {remainingAICalls() === 0
                  ? "Today's free AI analyses used up"
                  : `${remainingAICalls()} free AI ${remainingAICalls() === 1 ? 'analysis' : 'analyses'} left today`}
              </span>
            </div>
          )}
        </motion.div>

        {/* Premium highlights */}
        <div className="grid grid-cols-2 gap-3">
          {HIGHLIGHTS.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-app-card border border-blue-500/20 rounded-2xl p-4">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center mb-2">
                <Icon size={16} className="text-slate-800" />
              </div>
              <p className="text-slate-800 font-semibold text-sm mb-1">{label}</p>
              <p className="text-gray-500 text-xs leading-tight">{desc}</p>
            </div>
          ))}
        </div>

        {/* Billing toggle */}
        <div className="flex gap-1 bg-app-card border border-app-border rounded-2xl p-1">
          {['monthly', 'yearly'].map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                billing === b ? 'gradient-primary text-white' : 'text-gray-500'
              }`}
            >
              {b === 'monthly' ? 'Mensal' : 'Anual  🔥 -44%'}
            </button>
          ))}
        </div>

        {/* Price + CTA */}
        <div className="bg-app-card border border-blue-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gray-400 text-sm line-through">{priceOld}</span>
            <span className="bg-rose-500/20 text-rose-400 text-xs font-bold px-2 py-0.5 rounded-full">🔥 Lançamento</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-slate-800 font-bold text-4xl">{price}</span>
            <span className="text-gray-400 text-sm pb-1">{period}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
            <Zap size={11} className="text-emerald-400" />
            <span className="text-emerald-400 text-xs font-semibold">{discountPct} OFF no preço de lançamento</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={checkoutLoading}
            className="w-full py-4 rounded-2xl gradient-primary text-white font-bold text-lg glow-purple flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {checkoutLoading
              ? <><Loader2 size={20} className="animate-spin" /> Redirecting...</>
              : <><Crown size={20} /> Get Premium →</>
            }
          </button>
          <p className="text-gray-600 text-xs text-center">
            Cancele quando quiser · Pagamento seguro via Mercado Pago
          </p>
        </div>

        {/* Comparison */}
        <div className="space-y-3">
          <h2 className="text-slate-800 font-bold text-base">Free vs Premium</h2>
          <div className="grid grid-cols-2 gap-2">
            {/* Free column */}
            <div className="bg-app-card border border-app-border rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 mb-3">
                <BookOpen size={14} className="text-gray-400" />
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Free</span>
              </div>
              {FREE_FEATURES.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  {f.ok
                    ? <Check size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    : <X    size={13} className="text-gray-700    flex-shrink-0 mt-0.5" />
                  }
                  <span className={`text-xs leading-tight ${f.ok ? 'text-gray-600' : 'text-gray-600'}`}>{f.label}</span>
                </div>
              ))}
            </div>
            {/* Premium column */}
            <div className="bg-blue-500/5 border border-blue-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 mb-3">
                <Crown size={14} className="text-blue-400" />
                <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">Premium</span>
              </div>
              {PREMIUM_FEATURES.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-xs leading-tight">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-3 pb-4">
          <h2 className="text-slate-800 font-bold text-base">FAQ</h2>
          {[
            { q: 'How does the AI work?', a: 'FeynLearn uses OpenAI GPT-4o-mini on our secure servers. No API key needed — just subscribe and start learning.' },
            { q: 'Posso cancelar quando quiser?', a: 'Sim. Cancele a assinatura pelo Mercado Pago a qualquer momento, sem multa.' },
            { q: 'O pagamento é seguro?', a: 'Todos os pagamentos passam pelo Mercado Pago — nunca armazenamos seus dados de cartão.' },
          ].map(({ q, a }) => (
            <div key={q} className="bg-app-card border border-app-border rounded-xl p-4">
              <p className="text-slate-800 text-sm font-semibold mb-1">{q}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
