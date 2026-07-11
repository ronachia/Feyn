import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import * as Sentry from '@sentry/react'
import App from './App.jsx'
import './index.css'
import './i18n'
import i18n from './i18n'
import useAppStore from './store/useAppStore'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    tracesSampleRate:   import.meta.env.PROD ? 0.1  : 1.0,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      if (import.meta.env.DEV) console.warn('[Sentry]', event)
      return event
    },
  })
}

const { language: savedLang, darkMode } = useAppStore.getState()
if (savedLang) i18n.changeLanguage(savedLang)
if (darkMode) document.documentElement.classList.add('dark')

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={CLERK_KEY} afterSignOutUrl="/auth">
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
