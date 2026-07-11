import { useMemo } from 'react'
import useAppStore from '../store/useAppStore'
import useLessons from './useLessons'

const SRS_INTERVALS = [1, 3, 7, 14, 30] // days between reviews

function daysSince(isoDate) {
  if (!isoDate) return Infinity
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000)
}

export default function useSRS() {
  const { sessionHistory, completedLessons } = useAppStore()
  const { lessons } = useLessons()

  const dueForReview = useMemo(() => {
    if (lessons.length === 0) return []
    const lessonMap = {}

    sessionHistory.forEach((session) => {
      const id = session.lessonId
      if (!lessonMap[id]) {
        lessonMap[id] = { sessions: [], bestClarity: 0 }
      }
      lessonMap[id].sessions.push(session)
      lessonMap[id].bestClarity = Math.max(lessonMap[id].bestClarity, session.clarityScore || 0)
    })

    return completedLessons
      .map((id) => {
        const data    = lessonMap[id]
        const lesson  = lessons.find((l) => l.id === Number(id))
        if (!lesson || !data) return null

        const sessionCount  = data.sessions.length
        const lastSession   = data.sessions.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
        const daysSinceLast = daysSince(lastSession?.date)

        // Interval index based on how many times reviewed, capped at last interval
        const intervalIdx    = Math.min(sessionCount - 1, SRS_INTERVALS.length - 1)
        const requiredInterval = SRS_INTERVALS[intervalIdx]
        const isDue          = daysSinceLast >= requiredInterval

        return isDue ? {
          lesson,
          daysSinceLast,
          clarityScore: data.bestClarity,
          urgency: daysSinceLast / requiredInterval, // > 1 means overdue
        } : null
      })
      .filter(Boolean)
      .sort((a, b) => b.urgency - a.urgency)
      .slice(0, 5)
  }, [sessionHistory, completedLessons, lessons])


  return { dueForReview }
}
