import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n'
import i18n from './i18n'
import useAppStore from './store/useAppStore'

const savedLang = useAppStore.getState().language
if (savedLang) i18n.changeLanguage(savedLang)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
