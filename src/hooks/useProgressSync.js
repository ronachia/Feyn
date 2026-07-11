import { useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import useAppStore from '../store/useAppStore'
import { callEdgeFunction } from '../services/supabase'

export default function useProgressSync() {
  const { user, isSignedIn } = useUser()

  const syncProgress = useCallback(async () => {
    if (!isSignedIn || !user) return
    const s = useAppStore.getState()
    try { await callEdgeFunction('sync-progress', {
      progress: {
        xp:               s.xp,
        streak:           s.streak,
        lastSessionDate:  s.lastSessionDate,
        completedLessons: s.completedLessons,
        gaps:             s.gaps,
        sessionHistory:   s.sessionHistory,
        earnedBadges:     s.earnedBadges,
        noPeekCount:      s.noPeekCount,
        highClarityCount: s.highClarityCount,
        fixedGaps:        s.fixedGaps,
        dailyStats:       s.dailyStats,
        customLessons:    s.customLessons,
      },
    }) } catch (err) {
      console.warn('[useProgressSync] syncProgress failed (offline?):', err.message)
    }
  }, [isSignedIn, user])

  const syncProfile = useCallback(async (profileData) => {
    if (!isSignedIn || !user) return
    try { await callEdgeFunction('sync-progress', { profile: profileData }) } catch (err) {
      console.warn('[useProgressSync] syncProfile failed (offline?):', err.message)
    }
  }, [isSignedIn, user])

  const loadFromSupabase = useCallback(async () => {
    if (!isSignedIn || !user) return null
    try {
      const { profile, progress } = await callEdgeFunction('get-profile', {})
      if (progress) {
        useAppStore.setState({
          xp:               progress.xp               ?? 0,
          streak:           progress.streak            ?? 0,
          lastSessionDate:  progress.last_session_date ?? null,
          completedLessons: progress.completed_lessons ?? [],
          gaps:             progress.gaps              ?? [],
          sessionHistory:   progress.session_history   ?? [],
          earnedBadges:     progress.earned_badges     ?? [],
          noPeekCount:      progress.no_peek_count     ?? 0,
          highClarityCount: progress.high_clarity_count ?? 0,
          fixedGaps:        progress.fixed_gaps        ?? 0,
          dailyStats:       progress.daily_stats       ?? { date: null, aiCalls: 0 },
          customLessons:    progress.custom_lessons    ?? [],
        })
      }
      // Sempre sobrescrever isPremium e isAdmin pelo valor do servidor
      const expiresAt = profile?.premium_expires_at ? new Date(profile.premium_expires_at) : null
      const isActivePremium = profile?.is_premium === true && (!expiresAt || expiresAt > new Date())
      useAppStore.setState({ isPremium: isActivePremium, isAdmin: profile?.is_admin === true })

      return { profile, progress }
    } catch (err) {
      console.error('[useProgressSync] loadFromSupabase failed:', err)
      return null
    }
  }, [isSignedIn, user])

  return { syncProgress, syncProfile, loadFromSupabase }
}
