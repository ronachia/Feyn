import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, BookOpen, Target, Key, Trash2, ChevronRight, Eye, EyeOff, TrendingUp, Zap, Crown, Bell, Globe, LogOut, Moon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import useAppStore from '../store/useAppStore'
import { getLessonById } from '../data/lessons'
import { BADGES, getLevelInfo } from '../data/badges'
import BottomNav from '../components/BottomNav'
import useNotifications from '../hooks/useNotifications'
import { useUser, useClerk } from '@clerk/clerk-react'
import useProgressSync from '../hooks/useProgressSync'

export default function Profile() {
  const navigate = useNavigate()
  const { t }    = useTranslation()
  const {
    streak, completedLessons, gaps, sessionHistory,
    openaiKey, setOpenaiKey, resetProgress, xp, earnedBadges,
    isPremium, activatePremium, deactivatePremium, language, setLanguage,
    darkMode, setDarkMode,
  } = useAppStore()
  const levelInfo = getLevelInfo(xp || 0)
  const { notificationsEnabled, isSupported, enable, disable } = useNotifications()
  const { user, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const { syncProfile } = useProgressSync()

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    i18n.changeLanguage(lang)
    syncProfile({ language: lang })
  }

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/auth' })
  }

  const [apiKeyInput, setApiKeyInput]   = useState(openaiKey)
  const [showKey, setShowKey]           = useState(false)
  const [saved, setSaved]               = useState(false)
  const [showReset, setShowReset]       = useState(false)

  const handleSaveKey = () => {
    setOpenaiKey(apiKeyInput.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const avgClarity = sessionHistory.length
    ? Math.round(sessionHistory.reduce((a, s) => a + (s.clarityScore || 0), 0) / sessionHistory.length * 10) / 10
    : 0

  const avgCoverage = sessionHistory.length
    ? Math.round(sessionHistory.reduce((a, s) => a + (s.coverageScore || 0), 0) / sessionHistory.length * 10) / 10
    : 0

  return (
    <div className="app-shell flex flex-col min-h-screen bg-app-bg pb-48">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-slate-800">Profile</h1>
        <p className="text-gray-500 text-sm mt-0.5">Your progress & settings</p>
      </div>

      <div className="px-6 space-y-5">
        {/* ── Account ───────────────────────────────────────────────── */}
        {isSignedIn && user && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-app-card border border-app-border rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-lg glow-purple flex-shrink-0">
                {user.firstName?.[0]?.toUpperCase() || user.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 text-sm font-semibold truncate">
                  {user.firstName || user.emailAddresses?.[0]?.emailAddress}
                </p>
                <p className="text-gray-500 text-xs">Synced across devices ✓</p>
              </div>
              <button onClick={handleSignOut} className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-rose-400 transition-colors">
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Subscription Banner ───────────────────────────────────── */}
        {isPremium ? (
          <div className="gradient-primary rounded-2xl p-4 flex items-center gap-3 glow-purple">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Crown size={20} className="text-slate-800" />
            </div>
            <div className="flex-1">
              <p className="text-slate-800 font-bold text-sm">Premium Active 👑</p>
              <p className="text-blue-200 text-xs">All features unlocked · unlimited AI</p>
            </div>
            <button onClick={deactivatePremium} className="text-blue-300 text-xs underline">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/pricing')}
            className="w-full flex items-center gap-3 bg-app-card border border-blue-500/30 rounded-2xl p-4"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Crown size={20} className="text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-slate-800 font-semibold text-sm">Upgrade to Premium</p>
              <p className="text-gray-500 text-xs">Voice · Teach mode · Custom lessons · Unlimited AI</p>
            </div>
            <ChevronRight size={16} className="text-gray-500" />
          </button>
        )}

        {/* ── Dev Tools (only in development) ─────────────────────── */}
        {import.meta.env.DEV && (
          <div className="bg-app-card border border-dashed border-gray-700 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">🛠 Dev · Premium</p>
              <p className="text-gray-600 text-xs mt-0.5">{isPremium ? '👑 Active' : '🔓 Free'}</p>
            </div>
            <button
              onClick={() => isPremium ? deactivatePremium() : activatePremium()}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isPremium
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'gradient-primary text-white'
              }`}
            >
              {isPremium ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        )}

        {/* ── Level + XP ───────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="gradient-primary rounded-3xl p-5 glow-purple">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-blue-200 text-xs mb-0.5">Current Level</p>
                <p className="text-slate-800 font-bold text-xl">{levelInfo.current.emoji} {levelInfo.current.name}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-200 text-xs mb-0.5">Total XP</p>
                <p className="text-slate-800 font-bold text-xl flex items-center gap-1 justify-end"><Zap size={16}/>{xp || 0}</p>
              </div>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${levelInfo.progress}%` }} />
            </div>
            {levelInfo.next && (
              <p className="text-blue-200 text-xs mt-2">{levelInfo.xpToNext} XP to {levelInfo.next.name} {levelInfo.next.emoji}</p>
            )}
          </div>
        </motion.div>

        {/* ── Stats ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Your Stats</p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<Flame size={18} className="text-orange-400" />}  value={streak}                 label="Day Streak"       sub="days"    />
            <StatCard icon={<BookOpen size={18} className="text-blue-400" />} value={completedLessons.length} label="Lessons Done"    sub="completed" />
            <StatCard icon={<Target size={18} className="text-cyan-400" />}   value={avgClarity}             label="Avg Clarity"      sub="/ 10"    />
            <StatCard icon={<TrendingUp size={18} className="text-emerald-400" />} value={avgCoverage}        label="Avg Coverage"     sub="/ 10"    />
          </div>
        </motion.div>

        {/* ── Badges ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Badges ({(earnedBadges || []).length}/{BADGES.length})
          </p>
          <div className="grid grid-cols-2 gap-3">
            {BADGES.map((badge) => {
              const earned = (earnedBadges || []).includes(badge.id)
              return (
                <div
                  key={badge.id}
                  className={`rounded-2xl p-3 border transition-all ${
                    earned
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : 'bg-app-card border-app-border opacity-40'
                  }`}
                >
                  <p className="text-2xl mb-1.5">{badge.icon}</p>
                  <p className={`text-sm font-semibold ${earned ? 'text-slate-800' : 'text-gray-500'}`}>{badge.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5 leading-tight">{badge.desc}</p>
                  {earned && <p className="text-blue-400 text-xs mt-1 font-medium">✓ Earned</p>}
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* ── Gaps Tracker ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Knowledge Gaps ({gaps.length})
          </p>
          <div className="bg-app-card border border-app-border rounded-3xl p-4">
            {gaps.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                Complete a lesson to discover your gaps 🎯
              </p>
            ) : (
              <div className="space-y-3">
                {gaps.map((gap, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        gap.count >= 3 ? 'bg-rose-500/20' : gap.count === 2 ? 'bg-amber-500/20' : 'bg-blue-500/20'
                      }`}>
                        <span className={`text-xs font-bold ${
                          gap.count >= 3 ? 'text-rose-400' : gap.count === 2 ? 'text-amber-400' : 'text-blue-400'
                        }`}>{gap.count}x</span>
                      </div>
                      <div>
                        <p className="text-slate-800 text-sm capitalize font-medium">{gap.concept}</p>
                        <p className="text-gray-500 text-xs">
                          Last seen {new Date(gap.lastSeen).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(gap.count, 5) }).map((_, j) => (
                        <div key={j} className={`w-1.5 h-4 rounded-full ${
                          gap.count >= 3 ? 'bg-rose-500/70' : gap.count === 2 ? 'bg-amber-500/70' : 'bg-blue-500/70'
                        }`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Session History ───────────────────────────────────────── */}
        {sessionHistory.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Recent Sessions</p>
            <div className="bg-app-card border border-app-border rounded-3xl divide-y divide-app-border overflow-hidden">
              {sessionHistory.slice(0, 5).map((session, i) => {
                const lesson = getLessonById(session.lessonId)
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xl">{lesson?.icon || '📖'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 text-sm font-medium truncate">{lesson?.title || 'Lesson'}</p>
                      <p className="text-gray-500 text-xs">{new Date(session.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-400 text-sm font-bold">{session.clarityScore}/10</p>
                      <p className="text-gray-600 text-xs">clarity</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ── Language & Notifications ─────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Preferences</p>
          <div className="bg-app-card border border-app-border rounded-3xl divide-y divide-app-border overflow-hidden">
            {/* Language */}
            <div className="flex items-center gap-3 px-4 py-4">
              <Globe size={18} className="text-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-slate-800 text-sm font-medium">{t('profile.language')}</p>
              </div>
              <div className="flex gap-1 bg-app-surface rounded-xl p-1">
                {[['en', '🇺🇸 EN'], ['pt', '🇧🇷 PT']].map(([code, label]) => (
                  <button
                    key={code}
                    onClick={() => handleLanguageChange(code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      language === code ? 'gradient-primary text-white' : 'text-gray-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {/* Dark Mode */}
            <div className="flex items-center gap-3 px-4 py-4">
              <Moon size={18} className="text-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-slate-800 text-sm font-medium">Dark Mode</p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-6 rounded-full transition-all flex items-center px-0.5 ${
                  darkMode ? 'gradient-primary justify-end' : 'bg-app-border justify-start'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow" />
              </button>
            </div>

            {/* Notifications */}
            {isSupported && (
              <div className="flex items-center gap-3 px-4 py-4">
                <Bell size={18} className="text-blue-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-slate-800 text-sm font-medium">{t('profile.notifications')}</p>
                  <p className="text-gray-500 text-xs">{t('profile.notifications_sub')}</p>
                </div>
                <button
                  onClick={notificationsEnabled ? disable : enable}
                  className={`w-12 h-6 rounded-full transition-all flex items-center px-0.5 ${
                    notificationsEnabled ? 'gradient-primary justify-end' : 'bg-app-border justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow" />
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── API Key ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">OpenAI API Key</p>
          <div className="bg-app-card border border-app-border rounded-3xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Key size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-gray-400 text-sm">
                Required to analyze your explanations. Your key is stored locally and never sent anywhere except OpenAI.
              </p>
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-gray-700 text-sm pr-10 focus:border-blue-500/60 transition-colors"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              onClick={handleSaveKey}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                saved
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'gradient-primary text-white glow-purple'
              }`}
            >
              {saved ? '✓ Saved!' : 'Save API Key'}
            </button>
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-blue-400 text-xs"
            >
              Get your key at platform.openai.com <ChevronRight size={12} />
            </a>
          </div>
        </motion.div>

        {/* ── Danger Zone ──────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          {!showReset ? (
            <button
              onClick={() => setShowReset(true)}
              className="flex items-center gap-2 text-gray-600 text-sm"
            >
              <Trash2 size={14} /> Reset all progress
            </button>
          ) : (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 space-y-3">
              <p className="text-rose-400 text-sm font-semibold">Reset all progress?</p>
              <p className="text-gray-400 text-xs">This will delete your streak, lessons, and gaps. Cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowReset(false)} className="flex-1 py-2.5 rounded-xl bg-app-card border border-app-border text-gray-600 text-sm font-medium">Cancel</button>
                <button
                  onClick={() => { resetProgress(); setShowReset(false) }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 text-sm font-medium"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <div className="h-32" />
      <BottomNav />
    </div>
  )
}

function StatCard({ icon, value, label, sub }) {
  return (
    <div className="bg-app-card border border-app-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-gray-400 text-xs">{label}</span></div>
      <p className="text-slate-800 font-bold text-2xl">
        {value}<span className="text-gray-500 text-sm font-normal ml-1">{sub}</span>
      </p>
    </div>
  )
}
