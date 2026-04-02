import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import UsersPage from './pages/UsersPage'
import FinancePage from './pages/FinancePage'
import AgentDashboardPage from './pages/AgentDashboardPage'
import EventiPage from './pages/EventiPage'
import ImportPage from './pages/ImportPage'
import AgendaPage from './pages/AgendaPage'

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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard"      element={<Dashboard />} />
                <Route path="brands"         element={<BrandsPage />} />
                <Route path="creators"       element={<CreatorsPage />} />
                <Route path="collaborations" element={<CollaborationsPage />} />
                <Route path="trattativa"       element={<TrattativaPage />} />
                <Route path="eventi"         element={<EventiPage />} />
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