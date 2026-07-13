import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
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
import ImportPage from './pages/ImportPage'
import AgendaPage from './pages/AgendaPage'
import FiereDbPage from './pages/FiereDbPage'
import ClientiPage from './pages/ClientiPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
    </div>
  )
  if (user) return <Navigate to="/dashboard" replace />
  return children
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
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard"      element={<Dashboard />} />
                <Route path="brands"         element={<BrandsPage />} />
                <Route path="creators"       element={<CreatorsPage />} />
                <Route path="clienti"        element={<ClientiPage />} />
                <Route path="collaborations" element={<CollaborationsPage />} />
                <Route path="trattativa"       element={<TrattativaPage />} />
                <Route path="trattative-fiere" element={<TrattativeFierePage />} />
                <Route path="eventi"         element={<EventiPage />} />
                <Route path="db-fiere"      element={<FiereDbPage />} />
                <Route path="agenda" element={<AgendaPage />} />
                <Route path="finance"        element={<FinancePage />} />
                <Route path="agenti"         element={<AgentDashboardPage />} />
                <Route path="users"          element={<UsersPage />} />
                <Route path="import"         element={<ImportPage />} />
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
