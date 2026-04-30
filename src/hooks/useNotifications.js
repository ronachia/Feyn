import { useEffect, useCallback } from 'react'
import useAppStore from '../store/useAppStore'

const NOTIF_KEY = 'feynlearn_last_notif'

export default function useNotifications() {
  const { notificationsEnabled, setNotificationsEnabled, streak, lastSessionDate } = useAppStore()

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    const result = await Notification.requestPermission()
    return result === 'granted'
  }, [])

  const enable = useCallback(async () => {
    const granted = await requestPermission()
    if (granted) {
      setNotificationsEnabled(true)
      new Notification('FeynLearn 🧠', {
        body: "Daily reminders enabled! We'll remind you to keep your streak.",
        icon: '/favicon.ico',
      })
    } else {
      alert('Please allow notifications in your browser settings to enable reminders.')
    }
  }, [requestPermission, setNotificationsEnabled])

  const disable = useCallback(() => {
    setNotificationsEnabled(false)
  }, [setNotificationsEnabled])

  const showStreakReminder = useCallback(() => {
    if (!notificationsEnabled || Notification.permission !== 'granted') return
    const today = new Date().toDateString()
    const lastNotif = localStorage.getItem(NOTIF_KEY)
    if (lastNotif === today) return
    const lastSession = lastSessionDate ? new Date(lastSessionDate).toDateString() : null
    if (lastSession === today) return
    localStorage.setItem(NOTIF_KEY, today)
    new Notification('FeynLearn 🧠', {
      body: streak > 0
        ? `Keep your ${streak}-day streak alive! Time to learn something new.`
        : "Ready to practice your English today? 🚀",
      icon: '/favicon.ico',
    })
  }, [notificationsEnabled, streak, lastSessionDate])

  useEffect(() => {
    if (notificationsEnabled) {
      const timer = setTimeout(showStreakReminder, 3000)
      return () => clearTimeout(timer)
    }
  }, [notificationsEnabled, showStreakReminder])

  return {
    notificationsEnabled,
    isSupported: 'Notification' in window,
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
    enable,
    disable,
  }
}
