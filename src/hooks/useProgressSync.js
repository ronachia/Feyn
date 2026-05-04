import { useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { saveUserProgress, saveUserProfile } from '../services/supabase'
import useAppStore from '../store/useAppStore'

export default function useProgressSync() {
  const { authUser } = useAuth()

  const syncProgress = useCallback(async () => {
    if (!authUser || authUser.isLocal) return
    const s = useAppStore.getState()
    try {
      await saveUserProgress(authUser.id, {
        xp:                   s.xp,
        streak:               s.streak,
        last_session_date:    s.lastSessionDate,
        completed_lessons:    s.completedLessons,
        gaps:                 s.gaps,
        session_history:      s.sessionHistory,
        earned_badges:        s.earnedBadges,
        no_peek_count:        s.noPeekCount,
        high_clarity_count:   s.highClarityCount,
        fixed_gaps:           s.fixedGaps,
        daily_stats:          s.dailyStats,
        custom_lessons:       s.customLessons,
      })
    } catch (err) {
      console.error('Progress sync failed:', err)
    }
  }, [authUser])

  const syncProfile = useCallback(async (profileData) => {
    if (!authUser || authUser.isLocal) return
    try {
      await saveUserProfile(authUser.id, profileData)
    } catch (err) {
      console.error('Profile sync failed:', err)
    }
  }, [authUser])

  return { syncProgress, syncProfile }
}
