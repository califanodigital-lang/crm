import { BrowserRouter, Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './components/Toast'
import { ConfirmProvider } from './components/ConfirmModal'
import Layout from './components/Layout'
import Login from './components/Login'
import Dashboard from './pages/Dashboard'
import BrandsPage from './pages/BrandsPage'
import CreatorsPage from './pages/CreatorsPage'
import CollaborationsPage from './pages/CollaborationsPage'
import TrattativaPage from './pages/TrattativaPage'
import TrattativeFierePage from './pages/TrattativeFierePage'
import UsersPage from './pages/UsersPage'
import FinancePage from './pages/FinancePage'
import AgentDashboardPage from './pages/AgentDashboardPage'
import EventiPage from './pages/EventiPage'
import AgendaPage from './pages/AgendaPage'
import FiereDbPage from './pages/FiereDbPage'
import ClientiPage from './pages/ClientiPage'
import SecurityPage from './pages/SecurityPage'
import MfaChallengePage from './pages/MfaChallengePage'
import { canUseCrm, canAccessAdministration } from './utils/permissions'

const DocsPage = lazy(() => import('./pages/DocsPage'))
const TasksPage = lazy(() => import('./pages/TasksPage'))

function AdministrationRoute() {
  const { userProfile } = useAuth()
  return canAccessAdministration(userProfile) ? <Outlet /> : <Navigate to="/dashboard" replace />
}

function AuthErrorScreen() {
  const { authError, refreshAuth, signOut } = useAuth()
  return <div className="min-h-screen flex items-center justify-center p-4"><div className="card max-w-md"><p role="alert" className="text-sm text-red-600 mb-4">{authError}</p><div className="flex gap-3"><button className="btn-primary" onClick={() => refreshAuth().catch(() => {})}>Riprova</button><button className="btn-secondary" onClick={signOut}>Esci</button></div></div></div>
}

function ProtectedRoute({ children }) {
  const { user, userProfile, loading, mfaRequired, authError, signOut } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
    </div>
  )
  if (authError) return <AuthErrorScreen />
  if (!user) return <Navigate to="/login" replace />
  if (mfaRequired) return <Navigate to="/verify-2fa" replace />
  if (!canUseCrm(userProfile)) return <div className="card"><p>Account inattivo o profilo non autorizzato. Contatta l'amministratore.</p><button className="btn-secondary" onClick={signOut}>Esci</button></div>
  return children
}

function PublicRoute({ children }) {
  const { user, loading, mfaRequired, authError } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
    </div>
  )
  if (authError) return <AuthErrorScreen />
  if (user) return <Navigate to={mfaRequired ? '/verify-2fa' : '/dashboard'} replace />
  return children
}

function MfaRoute() {
  const { user, loading, mfaRequired, authError } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center">Verifica accesso...</div>
  if (authError) return <AuthErrorScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!mfaRequired) return <Navigate to="/dashboard" replace />
  return <MfaChallengePage />
}

function PagesRedirectHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get('redirect')
    if (!redirect) return

    params.delete('redirect')
    const query = params.toString()
    const nextPath = `${redirect}${query ? `?${query}` : ''}${window.location.hash || ''}`
    const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')
    window.history.replaceState(null, '', `${basePath}${nextPath}`)
    navigate(nextPath, { replace: true })
  }, [navigate])

  return null
}

function App() {
  useEffect(() => {
    const stopNumberWheel = (event) => {
      if (document.activeElement?.type === 'number') event.preventDefault()
    }

    document.addEventListener('wheel', stopNumberWheel, { passive: false })
    return () => document.removeEventListener('wheel', stopNumberWheel)
  }, [])

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <PagesRedirectHandler />
            <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/verify-2fa" element={<MfaRoute />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard"      element={<Dashboard />} />
                <Route path="brands"         element={<BrandsPage />} />
                <Route path="creators"       element={<CreatorsPage />} />
                <Route path="clienti"        element={<ClientiPage />} />
                <Route path="sicurezza"      element={<SecurityPage />} />
                <Route path="collaborations" element={<CollaborationsPage />} />
                <Route path="trattativa"       element={<TrattativaPage />} />
                <Route path="trattative-fiere" element={<TrattativeFierePage />} />
                <Route path="eventi"         element={<EventiPage />} />
                <Route path="db-fiere"      element={<FiereDbPage />} />
                <Route path="agenda" element={<AgendaPage />} />
                <Route path="tasks" element={<Suspense fallback={<p role="status">Caricamento task...</p>}><TasksPage /></Suspense>} />
                <Route path="docs" element={<Suspense fallback={<p role="status">Caricamento guide...</p>}><DocsPage /></Suspense>} />
                <Route element={<AdministrationRoute />}>
                  <Route path="finance" element={<FinancePage />} />
                  <Route path="agenti" element={<AgentDashboardPage />} />
                  <Route path="users" element={<UsersPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
