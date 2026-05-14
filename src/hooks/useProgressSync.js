import { useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import useAppStore from '../store/useAppStore'

// TODO: Implementar sync com backend quando tiver API
// Por enquanto, dados ficam apenas no localStorage via Zustand persist

export default function useProgressSync() {
  const { user, isSignedIn } = useUser()

  const syncProgress = useCallback(async () => {
    if (!isSignedIn || !user) return
    // TODO: Sync com seu backend quando implementar
    // const s = useAppStore.getState()
    // await api.saveProgress(user.id, { ... })
    console.log('Progress sync - Clerk user:', user.id)
  }, [isSignedIn, user])

  const syncProfile = useCallback(async (profileData) => {
    if (!isSignedIn || !user) return
    // TODO: Sync com seu backend quando implementar
    // await api.saveProfile(user.id, profileData)
    console.log('Profile sync - Clerk user:', user.id, profileData)
  }, [isSignedIn, user])

  return { syncProgress, syncProfile }
}
