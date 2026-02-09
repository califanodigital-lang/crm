import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Handshake,
  DollarSign,
  Target,
  LogOut,
  Menu,
  X,
  BriefcaseBusinessIcon,
  BarChart3
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Brand', href: '/brands', icon: Briefcase },
  { name: 'Creator', href: '/creators', icon: Users },
  { name: 'Collaborazioni', href: '/collaborations', icon: Handshake },
  { name: 'Proposte', href: '/proposte', icon: Target },
  { name: 'Finance', href: '/finance', icon: DollarSign, adminOnly:true },
  { name: 'Dashboard Agenti',href: '/agenti',icon: BarChart3, adminOnly:true},
  { name: 'Utenti', href: '/users', icon: Users, adminOnly:true }
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, userProfile, signOut } = useAuth()

  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || userProfile?.role === 'ADMIN'
  )

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-gray-900">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-400 px-2 py-1 rounded">
                <span className="text-lg font-bold text-gray-900">C3</span>
              </div>
              <span className="text-lg font-bold text-white">C3 Agency</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400">
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-yellow-400 text-gray-900'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 min-h-0 bg-gray-900 border-r border-gray-800">
          <div className="flex items-center h-16 px-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-400 px-2 py-1 rounded">
                <span className="text-lg font-bold text-gray-900">C3</span>
              </div>
              <span className="text-lg font-bold text-white">C3 Agency</span>
            </div>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-yellow-400 text-gray-900'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-900">
                    {user?.email?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">Admin</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar mobile */}
        <div className="sticky top-0 z-10 flex h-16 bg-white border-b lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-gray-500 focus:outline-none"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center flex-1 px-4 gap-2">
            <div className="bg-yellow-400 px-2 py-1 rounded">
              <span className="text-sm font-bold text-gray-900">C3</span>
            </div>
            <span className="text-lg font-bold text-gray-900">C3 Agency</span>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
