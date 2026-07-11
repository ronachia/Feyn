// Platform abstraction layer
// Web: uses browser APIs directly
// Capacitor: uses @capacitor/browser for external URLs, @capacitor/local-notifications for reminders
// Mobile (React Native): swap each function for its RN equivalent
//
// openURL     → import { Linking } from 'react-native'; Linking.openURL(url)
// applyDark   → handled by React Native Appearance API + theme context
// createSpeechRecognizer → @react-native-voice/voice or Whisper-only mode
// notifications → @notifee/react-native or react-native-push-notification

// Capacitor's native bridge injects `window.Capacitor` into the WebView
// before app JS runs, so this is a safe synchronous check in both native
// and web builds (it's simply undefined in a browser).
export function isNativePlatform() {
  return typeof window !== 'undefined' && Boolean(window.Capacitor?.isNativePlatform?.())
}

export async function openURL(url) {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.isNativePlatform()) {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url, presentationStyle: 'popover' })
      return
    }
  } catch { /* not in Capacitor, fall through */ }
  window.location.href = url
}

export function applyDarkMode(enabled) {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', enabled)
  }
}

export function createSpeechRecognizer({ onResult, onEnd, onError }) {
  const SpeechRecognition =
    (typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)) ||
    null

  if (!SpeechRecognition) return null

  const recognition = new SpeechRecognition()
  recognition.lang = 'en-US'
  recognition.continuous = true
  recognition.interimResults = true

  recognition.onresult = (e) => {
    const transcript = Array.from(e.results)
      .map((r) => r[0].transcript)
      .join(' ')
    onResult(transcript)
  }
  recognition.onerror = onError || (() => {})
  recognition.onend   = onEnd   || (() => {})

  return recognition
}

// True if reminders are possible at all on this platform: always true when
// running natively (LocalNotifications ships with the app), or when the
// browser exposes the Notification API on web.
export function notificationsSupported() {
  if (isNativePlatform()) return true
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestNotificationPermission() {
  if (isNativePlatform()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const { display } = await LocalNotifications.requestPermissions()
    return display === 'granted'
  }
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function hasNotificationPermission() {
  if (isNativePlatform()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const { display } = await LocalNotifications.checkPermissions()
    return display === 'granted'
  }
  return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
}

// Fires `callback(url)` whenever the native app is opened/resumed via a
// deep link (custom scheme or, once configured, an Android App
// Link / iOS Universal Link) — e.g. the Mercado Pago checkout redirecting
// back after payment. No-op on web, where the browser just navigates
// normally and React Router already sees the URL.
export async function onAppUrlOpen(callback) {
  if (!isNativePlatform()) return () => {}
  const { App } = await import('@capacitor/app')
  const handle = await App.addListener('appUrlOpen', (data) => callback(data.url))
  return () => handle.remove()
}

export async function showLocalNotification({ title, body }) {
  if (isNativePlatform()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Math.random() * 2147483647),
        title,
        body,
        schedule: { at: new Date(Date.now() + 250) },
      }],
    })
    return
  }
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' })
  }
}
