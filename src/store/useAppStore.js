import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BADGES, getLevelInfo } from '../data/badges'

const useAppStore = create(
  persist(
    (set, get) => ({
      // ─── User ────────────────────────────────────────────────
      user: null,
      setUser: (user) => set({ user }),

      // ─── Progress ────────────────────────────────────────────
      streak: 0,
      lastSessionDate: null,
      completedLessons: [],

      updateStreak: () => {
        const today = new Date().toDateString()
        const last = get().lastSessionDate
        if (last === today) return
        const yesterday = new Date(Date.now() - 86400000).toDateString()
        const newStreak = last === yesterday ? get().streak + 1 : 1
        set({ streak: newStreak, lastSessionDate: today })
      },

      completeLesson: (lessonId) => {
        const already = get().completedLessons.includes(lessonId)
        if (!already) {
          set({ completedLessons: [...get().completedLessons, lessonId] })
        }
        get().updateStreak()
      },

      // ─── Gaps ─────────────────────────────────────────────────
      gaps: [],

      addGaps: (newGaps) => {
        if (!newGaps || newGaps.length === 0) return
        const existing = [...get().gaps]
        newGaps.forEach((concept) => {
          const idx = existing.findIndex(
            (g) => g.concept.toLowerCase() === concept.toLowerCase()
          )
          if (idx >= 0) {
            existing[idx] = {
              ...existing[idx],
              count: existing[idx].count + 1,
              lastSeen: new Date().toISOString(),
            }
          } else {
            existing.push({
              concept,
              count: 1,
              lastSeen: new Date().toISOString(),
            })
          }
        })
        set({ gaps: existing.sort((a, b) => b.count - a.count) })
      },

      fixGap: (concept) => {
        const existing = [...get().gaps]
        const idx = existing.findIndex(
          (g) => g.concept.toLowerCase() === concept.toLowerCase()
        )
        if (idx >= 0) {
          existing[idx] = { ...existing[idx], count: Math.max(0, existing[idx].count - 1) }
        }
        const fixedGaps = (get().fixedGaps || 0) + 1
        set({ gaps: existing, fixedGaps })
        get().checkBadges()
      },

      // ─── Session History ───────────────────────────────────────
      sessionHistory: [],

      addSession: (session) => {
        set({
          sessionHistory: [
            { ...session, date: new Date().toISOString() },
            ...get().sessionHistory.slice(0, 99),
          ],
        })
      },

      // ─── Preferences ──────────────────────────────────────────
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      notificationsEnabled: false,
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      darkMode: false,
      setDarkMode: (v) => {
        set({ darkMode: v })
        document.documentElement.classList.toggle('dark', v)
      },

      // ─── Gamification ─────────────────────────────────────────
      xp: 0,
      earnedBadges: [],
      noPeekCount: 0,
      highClarityCount: 0,
      fixedGaps: 0,

      earnXP: (amount) => {
        const newXP = (get().xp || 0) + amount
        set({ xp: newXP })
        get().checkBadges()
        return newXP
      },

      calculateSessionXP: ({ clarityScore = 0, coverageScore = 0, peeked = false, streak = 0 }) => {
        let xp = 50
        xp += clarityScore  * 5
        xp += coverageScore * 5
        if (!peeked)         xp += 30
        if (streak >= 3)     xp += 15
        if (streak >= 7)     xp += 25
        if (clarityScore >= 9) xp += 20
        return xp
      },

      recordSessionStats: ({ clarityScore, peeked }) => {
        const updates = {}
        if (!peeked) updates.noPeekCount = (get().noPeekCount || 0) + 1
        if (clarityScore >= 9) updates.highClarityCount = (get().highClarityCount || 0) + 1
        if (Object.keys(updates).length) set(updates)
      },

      checkBadges: () => {
        const s = get()
        const earned = [...(s.earnedBadges || [])]
        let changed = false
        BADGES.forEach((badge) => {
          if (!earned.includes(badge.id) && badge.condition(s)) {
            earned.push(badge.id)
            changed = true
          }
        })
        if (changed) set({ earnedBadges: earned })
      },

      newBadges: [],
      clearNewBadges: () => set({ newBadges: [] }),

      // ─── Custom Lessons ───────────────────────────────────────
      customLessons: [],

      addCustomLesson: (lesson) => {
        const id = `custom-${Date.now()}`
        const newLesson = { ...lesson, id, isCustom: true, createdAt: new Date().toISOString() }
        set({ customLessons: [newLesson, ...get().customLessons] })
        return id
      },

      deleteCustomLesson: (id) => {
        set({ customLessons: get().customLessons.filter((l) => l.id !== id) })
      },

      // ─── Subscription ─────────────────────────────────────────
      isPremium: false,
      premiumActivatedAt: null,
      dailyStats: { date: null, aiCalls: 0 },

      activatePremium: () =>
        set({ isPremium: true, premiumActivatedAt: new Date().toISOString() }),

      deactivatePremium: () =>
        set({ isPremium: false, premiumActivatedAt: null }),

      checkAndIncrementAI: () => {
        if (get().isPremium) return true
        const today = new Date().toDateString()
        let stats = get().dailyStats
        if (stats.date !== today) stats = { date: today, aiCalls: 0 }
        if (stats.aiCalls >= 3) return false
        set({ dailyStats: { date: today, aiCalls: stats.aiCalls + 1 } })
        return true
      },

      remainingAICalls: () => {
        if (get().isPremium) return Infinity
        const today = new Date().toDateString()
        const stats = get().dailyStats
        if (stats.date !== today) return 3
        return Math.max(0, 3 - stats.aiCalls)
      },

      // ─── Settings ─────────────────────────────────────────────
      openaiKey: '',
      setOpenaiKey: (key) => set({ openaiKey: key }),

      // ─── Reset ────────────────────────────────────────────────
      resetProgress: () =>
        set({
          user: null,
          streak: 0,
          lastSessionDate: null,
          completedLessons: [],
          gaps: [],
          sessionHistory: [],
          xp: 0,
          earnedBadges: [],
          noPeekCount: 0,
          highClarityCount: 0,
          fixedGaps: 0,
          newBadges: [],
          customLessons: [],
          dailyStats: { date: null, aiCalls: 0 },
        }),
    }),
    { name: 'feynlearn-storage' }
  )
)

export default useAppStore
