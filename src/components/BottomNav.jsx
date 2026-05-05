import { useLocation, useNavigate } from 'react-router-dom'
import { Home, User, BookOpen, Crown, BarChart2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import useAppStore from '../store/useAppStore'

export default function BottomNav() {
  const location   = useLocation()
  const navigate   = useNavigate()
  const isPremium  = useAppStore((s) => s.isPremium)
  const { t }      = useTranslation()

  const tabs = [
    { path: '/home',    icon: Home,      label: t('nav.home')    },
    { path: '/lessons', icon: BookOpen,  label: t('nav.lessons') },
    { path: '/stats',   icon: BarChart2, label: t('nav.stats')   },
    { path: '/profile', icon: User,      label: t('nav.profile') },
  ]

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Upgrade pill for free users */}
      {!isPremium && (
        <div className="mx-4 mb-2 flex justify-center">
          <button
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-2 gradient-primary px-5 py-2 rounded-full text-white text-xs font-semibold shadow-lg glow-blue"
          >
            <Crown size={13} /> Upgrade to Premium
          </button>
        </div>
      )}

      <div className="mx-4 mb-3 bg-white border border-app-border rounded-3xl px-2 py-2 flex items-center justify-around" style={{boxShadow:'0 -2px 16px rgba(37,99,235,0.12)'}}>
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path
            || (path === '/lessons' && location.pathname.startsWith('/lesson'))
            || (path === '/stats' && location.pathname === '/stats')
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex-1 flex flex-col items-center gap-1 py-2 relative"
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 bg-orange-50 rounded-2xl"
                />
              )}
              <div className="relative">
                <Icon
                  size={22}
                  className={`transition-colors ${active ? 'text-orange-500' : 'text-slate-400'}`}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {isPremium && path === '/profile' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full gradient-primary flex items-center justify-center">
                    <Crown size={7} className="text-white" />
                  </div>
                )}
              </div>
              <span className={`text-xs transition-colors ${active ? 'text-orange-500 font-semibold' : 'text-slate-400'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
