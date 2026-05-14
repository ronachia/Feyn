import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import './index.css'
import './i18n'
import i18n from './i18n'
import useAppStore from './store/useAppStore'

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
