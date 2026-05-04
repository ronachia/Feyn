import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import useNotifications from './hooks/useNotifications'
import useAppStore from './store/useAppStore'
import Onboarding from './pages/Onboarding'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Lesson from './pages/Lesson'
import Profile from './pages/Profile'
import LessonsList from './pages/LessonsList'
import Practice from './pages/Practice'
import CreateLesson from './pages/CreateLesson'
import Pricing from './pages/Pricing'
import Analytics from './pages/Analytics'
import ThemePreview from './pages/ThemePreview'
import PlacementTest from './pages/PlacementTest'

function RequireAuth({ children }) {
  const { authUser } = useAuth()
  if (authUser === undefined) return <LoadingScreen />
  if (!authUser) return <Navigate to="/auth" replace />
  return children
}

function RequireOnboarding({ children }) {
  const { authUser } = useAuth()
  const user = useAppStore((s) => s.user)
  if (authUser === undefined) return <LoadingScreen />
  if (!authUser) return <Navigate to="/auth" replace />
  if (!user) return <Navigate to="/" replace />
  return children
}

function NotificationInit() {
  useNotifications()
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NotificationInit />
        <Routes>
          <Route path="/auth" element={<AuthGate />} />
          <Route path="/" element={<RequireAuth><OnboardingGuard /></RequireAuth>} />
          <Route path="/home"     element={<RequireOnboarding><Home /></RequireOnboarding>} />
          <Route path="/lessons"  element={<RequireOnboarding><LessonsList /></RequireOnboarding>} />
          <Route path="/lesson/:id" element={<RequireOnboarding><Lesson /></RequireOnboarding>} />
          <Route path="/practice" element={<RequireOnboarding><Practice /></RequireOnboarding>} />
          <Route path="/create"   element={<RequireOnboarding><CreateLesson /></RequireOnboarding>} />
          <Route path="/pricing"  element={<RequireOnboarding><Pricing /></RequireOnboarding>} />
          <Route path="/stats"    element={<RequireOnboarding><Analytics /></RequireOnboarding>} />
          <Route path="/profile"  element={<RequireOnboarding><Profile /></RequireOnboarding>} />
          <Route path="/placement" element={<RequireAuth><PlacementTest /></RequireAuth>} />
          <Route path="/theme-preview" element={<ThemePreview />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

function AuthGate() {
  const { authUser } = useAuth()
  if (authUser === undefined) return <LoadingScreen />
  if (authUser) return <Navigate to="/" replace />
  return <Auth />
}

function OnboardingGuard() {
  const user = useAppStore((s) => s.user)
  if (user && !user.placementDone) return <Navigate to="/placement" replace />
  if (user) return <Navigate to="/home" replace />
  return <Onboarding />
}

function LoadingScreen() {
  return (
    <div className="app-shell flex items-center justify-center min-h-screen bg-app-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-4xl glow-purple animate-pulse">
          🧠
        </div>
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}
