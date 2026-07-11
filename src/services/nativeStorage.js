// Storage adapter for zustand's `persist` middleware.
//
// On native (Capacitor), progress/XP/premium status live in
// @capacitor/preferences instead of localStorage — Preferences survives
// WebView data clears and app updates more reliably than localStorage does
// inside a WebView. Zustand's persist middleware supports async storage
// (getItem/setItem/removeItem may return Promises), so this is a drop-in
// replacement for `createJSONStorage(() => localStorage)`.
//
// On web this just delegates to localStorage, so behavior there is
// unchanged.
import { isNativePlatform } from './platform'

const nativeStorage = {
  async getItem(key) {
    if (isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences')
      const { value } = await Preferences.get({ key })
      return value
    }
    return localStorage.getItem(key)
  },

  async setItem(key, value) {
    if (isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.set({ key, value })
      return
    }
    localStorage.setItem(key, value)
  },

  async removeItem(key) {
    if (isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.remove({ key })
      return
    }
    localStorage.removeItem(key)
  },
}

export default nativeStorage
