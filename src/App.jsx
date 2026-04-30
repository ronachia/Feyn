import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAppStore from './store/useAppStore'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Lesson from './pages/Lesson'
import Profile from './pages/Profile'
import LessonsList from './pages/LessonsList'
import Practice from './pages/Practice'
import CreateLesson from './pages/CreateLesson'
import Pricing from './pages/Pricing'
import Analytics from './pages/Analytics'
import ThemePreview from './pages/ThemePreview'

function RequireOnboarding({ children }) {
  const user = useAppStore((s) => s.user)
  if (!user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OnboardingGuard />} />
        <Route path="/home" element={<RequireOnboarding><Home /></RequireOnboarding>} />
        <Route path="/lessons" element={<RequireOnboarding><LessonsList /></RequireOnboarding>} />
        <Route path="/lesson/:id" element={<RequireOnboarding><Lesson /></RequireOnboarding>} />
        <Route path="/practice" element={<RequireOnboarding><Practice /></RequireOnboarding>} />
        <Route path="/create" element={<RequireOnboarding><CreateLesson /></RequireOnboarding>} />
        <Route path="/pricing" element={<RequireOnboarding><Pricing /></RequireOnboarding>} />
        <Route path="/stats" element={<RequireOnboarding><Analytics /></RequireOnboarding>} />
        <Route path="/profile" element={<RequireOnboarding><Profile /></RequireOnboarding>} />
        <Route path="/theme-preview" element={<ThemePreview />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function OnboardingGuard() {
  const user = useAppStore((s) => s.user)
  if (user) return <Navigate to="/home" replace />
  return <Onboarding />
}
