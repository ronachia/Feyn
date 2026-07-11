import { useEffect, lazy, Suspense } from 'react'
import * as Sentry from '@sentry/react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn, useUser, useAuth } from '@clerk/clerk-react'
import useNotifications from './hooks/useNotifications'
import useAppStore from './store/useAppStore'
import useProgressSync from './hooks/useProgressSync'
import { initEdgeFunctions } from './services/supabase'
import { onAppUrlOpen } from './services/platform'
import Home from './pages/Home'
import AuthPage from './pages/AuthPage'
import Onboarding from './pages/Onboarding'
import PlacementTest from './pages/PlacementTest'

const Lesson       = lazy(() => import('./pages/Lesson'))
const Profile     = lazy(() => import('./pages/Profile'))
const LessonsList = lazy(() => import('./pages/LessonsList'))
const Practice    = lazy(() => import('./pages/Practice'))
const CreateLesson = lazy(() => import('./pages/CreateLesson'))
const Pricing     = lazy(() => import('./pages/Pricing'))
const Analytics   = lazy(() => import('./pages/Analytics'))
const ThemePreview   = lazy(() => import('./pages/ThemePreview'))
const AdminPanel     = lazy(() => import('./pages/admin/AdminPanel'))
const AdminLessonEditor  = lazy(() => import('./pages/admin/AdminLessonEditor'))
const AdminAnalytics     = lazy(() => import('./pages/admin/AdminAnalytics'))

function RequireAdmin({ children }) {
  const isAdmin = useAppStore((s) => s.isAdmin)
  const { isSignedIn } = useUser()
  if (!isSignedIn) return <Navigate to="/auth" replace />
  if (!isAdmin) return <Navigate to="/home" replace />
  return children
}

function RequireAuth({ children }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  )
}

function RequireOnboarding({ children }) {
  const { isSignedIn, isLoaded } = useUser()
  const user = useAppStore((s) => s.user)
  if (!isLoaded) return <LoadingScreen />
  if (!isSignedIn) return <Navigate to="/auth" replace />
  if (!user) return <Navigate to="/" replace />
  return children
}

function NotificationInit() {
  useNotifications()
  return null
}

// Handles the app being reopened via a deep link — e.g. Mercado Pago's
// back_urls bringing the user back after checkout. Only fires on native
// (see onAppUrlOpen); on web the browser navigates normally so there's
// nothing to do. Requires Android App Links / iOS Universal Links to be
// configured once a production domain exists — see android/app/src/main/AndroidManifest.xml
// for the exact intent-filter to add, and PARECER_AUDITORIA_MOBILE.md for the iOS side.
function DeepLinkHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    let removeListener = () => {}
    onAppUrlOpen((url) => {
      try {
        const { pathname, search } = new URL(url)
        navigate(pathname + search, { replace: true })
      } catch {
        /* malformed or unrecognized deep link — ignore */
      }
    }).then((remove) => { removeListener = remove })
    return () => removeListener()
  }, [navigate])

  return null
}

function EdgeFunctionInit() {
  const { getToken } = useAuth()
  const { isSignedIn } = useUser()
  const { user } = useUser()
  const { loadFromSupabase } = useProgressSync()

  useEffect(() => {
    initEdgeFunctions(() => getToken())
  }, [getToken])

  useEffect(() => {
    if (isSignedIn && user) {
      loadFromSupabase()
      Sentry.setUser({ id: user.id, email: user.primaryEmailAddress?.emailAddress })
    } else {
      Sentry.setUser(null)
    }
  }, [isSignedIn, user?.id])

  useEffect(() => {
    if (!isSignedIn) return
    const interval = setInterval(() => loadFromSupabase(), 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [isSignedIn, loadFromSupabase])

  return null
}

export default function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorScreen />} showDialog>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <NotificationInit />
      <EdgeFunctionInit />
      <DeepLinkHandler />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
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
          <Route path="/admin" element={<RequireAdmin><AdminPanel /></RequireAdmin>} />
          <Route path="/admin/lesson/:id"  element={<RequireAdmin><AdminLessonEditor /></RequireAdmin>} />
          <Route path="/admin/analytics"   element={<RequireAdmin><AdminAnalytics /></RequireAdmin>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </Sentry.ErrorBoundary>
  )
}

function OnboardingGuard() {
  const { isSignedIn } = useUser()
  const user = useAppStore((s) => s.user)
  if (!isSignedIn) return <Navigate to="/auth" replace />
  if (user && !user.placementDone) return <Navigate to="/placement" replace />
  if (user) return <Navigate to="/home" replace />
  return <Onboarding />
}

function ErrorScreen() {
  return (
    <div className="app-shell flex items-center justify-center min-h-screen bg-app-bg px-6 text-center">
      <div className="flex flex-col items-center gap-4 max-w-xs">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center text-4xl">⚠️</div>
        <h1 className="text-slate-800 font-bold text-xl">Something went wrong</h1>
        <p className="text-gray-400 text-sm">The error has been reported automatically. Try reloading the app.</p>
        <button
          onClick={() => window.location.href = '/home'}
          className="w-full py-3 gradient-primary rounded-2xl text-white font-semibold glow-purple"
        >
          Reload App
        </button>
      </div>
    </div>
  )
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
