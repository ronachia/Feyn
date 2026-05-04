import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseConfigured, loadUserProgress, loadUserProfile } from '../services/supabase'
import useAppStore from '../store/useAppStore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [authUser, setAuthUser]     = useState(undefined) // undefined = loading
  const [loadingData, setLoadingData] = useState(false)

  const hydrateStore = async (supabaseUser) => {
    if (!supabaseUser) return
    setLoadingData(true)
    try {
      const [profile, progress] = await Promise.all([
        loadUserProfile(supabaseUser.id),
        loadUserProgress(supabaseUser.id),
      ])

      const store = useAppStore.getState()

      if (profile) {
        store.setUser({
          goal:              profile.goal,
          level:             profile.level,
          onboardedAt:       profile.onboarded_at,
          email:             supabaseUser.email,
          placementSubLevel: profile.placement_sub_level ?? null,
          placementDone:     Boolean(profile.placement_sub_level),
        })
        if (profile.language) store.setLanguage(profile.language)
      }

      if (progress) {
        useAppStore.setState({
          xp:                progress.xp              ?? store.xp,
          streak:            progress.streak           ?? store.streak,
          lastSessionDate:   progress.last_session_date ?? store.lastSessionDate,
          completedLessons:  progress.completed_lessons  ?? store.completedLessons,
          gaps:              progress.gaps              ?? store.gaps,
          sessionHistory:    progress.session_history   ?? store.sessionHistory,
          earnedBadges:      progress.earned_badges     ?? store.earnedBadges,
          noPeekCount:       progress.no_peek_count     ?? store.noPeekCount,
          highClarityCount:  progress.high_clarity_count ?? store.highClarityCount,
          fixedGaps:         progress.fixed_gaps        ?? store.fixedGaps,
          dailyStats:        progress.daily_stats       ?? store.dailyStats,
          customLessons:     progress.custom_lessons    ?? store.customLessons,
        })
      }
    } catch (err) {
      console.error('Error hydrating store:', err)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (!supabaseConfigured) {
      // Local-only mode — treat as anonymous logged-in user so app works without Supabase
      setAuthUser({ id: 'local', email: 'local@feynlearn.app', isLocal: true })
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null
      setAuthUser(user)
      if (user) hydrateStore(user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null
      setAuthUser(user)
      if (user) hydrateStore(user)
      if (!user) useAppStore.getState().resetProgress()
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password) => {
    if (!supabaseConfigured) throw new Error('Supabase not configured.')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  }

  const signIn = async (email, password) => {
    if (!supabaseConfigured) throw new Error('Supabase not configured.')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    if (!supabaseConfigured) return
    await supabase.auth.signOut()
    useAppStore.getState().resetProgress()
  }

  return (
    <AuthContext.Provider value={{ authUser, loadingData, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
