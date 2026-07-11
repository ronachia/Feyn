// Platform abstraction layer
// Web: uses browser APIs directly
// Capacitor: uses @capacitor/browser for external URLs
// Mobile (React Native): swap each function for its RN equivalent
//
// openURL     → import { Linking } from 'react-native'; Linking.openURL(url)
// applyDark   → handled by React Native Appearance API + theme context
// createSpeechRecognizer → @react-native-voice/voice or Whisper-only mode

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
