import { useEffect, useCallback } from 'react'
import useAppStore from '../store/useAppStore'
import {
  notificationsSupported,
  requestNotificationPermission,
  hasNotificationPermission,
  showLocalNotification,
} from '../services/platform'

const NOTIF_KEY = 'feynlearn_last_notif'

export default function useNotifications() {
  const { notificationsEnabled, setNotificationsEnabled, streak, lastSessionDate } = useAppStore()

  const enable = useCallback(async () => {
    const granted = await requestNotificationPermission()
    if (granted) {
      setNotificationsEnabled(true)
      showLocalNotification({
        title: 'FeynLearn 🧠',
        body: "Daily reminders enabled! We'll remind you to keep your streak.",
      })
    } else {
      alert('Please allow notifications to enable reminders.')
    }
  }, [setNotificationsEnabled])

  const disable = useCallback(() => {
    setNotificationsEnabled(false)
  }, [setNotificationsEnabled])

  const showStreakReminder = useCallback(async () => {
    if (!notificationsEnabled) return
    if (!(await hasNotificationPermission())) return

    const today = new Date().toDateString()
    const lastNotif = localStorage.getItem(NOTIF_KEY)
    if (lastNotif === today) return
    const lastSession = lastSessionDate ? new Date(lastSessionDate).toDateString() : null
    if (lastSession === today) return
    localStorage.setItem(NOTIF_KEY, today)

    showLocalNotification({
      title: 'FeynLearn 🧠',
      body: streak > 0
        ? `Keep your ${streak}-day streak alive! Time to learn something new.`
        : 'Ready to practice your English today? 🚀',
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
    isSupported: notificationsSupported(),
    enable,
    disable,
    showStreakReminder,
  }
}
