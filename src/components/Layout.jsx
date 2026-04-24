// src/components/Layout.jsx
import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, Briefcase, Users, Handshake,
  DollarSign, Target, LogOut, Menu, X,
  BarChart3, Calendar, ChevronRight, CalendarRange
} from 'lucide-react'
import { ToastContainer } from './Toast'
import { ConfirmContainer } from './ConfirmModal'
import { APP_VERSION } from '../constants/changelog'

const NAV_GROUPS = [
  {
    label: 'Stats & Agenda',
    items: [
      { name: 'Dashboard',       href: '/dashboard',     icon: LayoutDashboard },
      { name: 'Agenda', href: '/agenda', icon: Calendar },
    ]
  },
  {
    label: 'Brand & Creators',
    items: [
      { name: 'Brand',           href: '/brands',        icon: Briefcase },
      { name: 'Creators',         href: '/creators',      icon: Users },
      { name: 'Trattative',        href: '/trattativa',      icon: Target },
      { name: 'Collaborazioni',  href: '/collaborations',icon: Handshake },
    ]
  },
  {
    label: 'Gestione Fiere & Eventi',
    items: [
      { name: 'DB Fiere & Eventi', href: '/db-fiere', icon: CalendarRange },
      { name: 'Trattative Fiere', href: '/trattative-fiere', icon: Target },
      { name: 'Fiere & Eventi', href: '/eventi', icon: Calendar },
    ]
  },
  {
    label: 'Amministrazione',
    adminOnly: true,
    items: [
      { name: 'Finance',          href: '/finance',  icon: DollarSign },
      { name: 'Dashboard Agenti', href: '/agenti',   icon: BarChart3 },
      { name: 'Utenti',           href: '/users',    icon: Users },
      //{ name: 'Import',           href: '/import',   icon: Import },
    ]
  }
]

function NavItem({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-yellow-400 text-gray-900 shadow-sm'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-gray-900' : ''}`} />
      <span className="flex-1">{item.name}</span>
      {active && <ChevronRight className="w-3 h-3 opacity-60" />}
    </Link>
  )
}

function SidebarContent({ onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, userProfile, signOut } = useAuth()

  const isActive = (href) =>
    location.pathname === href || location.pathname.startsWith(href + '/')

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const isAdmin = userProfile?.role === 'ADMIN'

  return (
    <div className="flex flex-col h-full bg-gray-950 border-r border-white/5">
      {/* Logo */}
      <div className="flex items-center justify-between h-[72px] px-4 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-400 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-400/20">
            <img src="/icon.svg" alt="C3 logo" className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">C3 Agency</p>
            <p className="text-xs text-gray-500 mt-0.5">CRM</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300 font-semibold">
              {APP_VERSION}
            </span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-white lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 min-h-0 overflow-y-hidden px-3 py-3 space-y-4">
        {NAV_GROUPS.map(group => {
          if (group.adminOnly && !isAdmin) return null
          return (
            <div key={group.label}>
              <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest mb-1.5 px-3">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavItem
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    onClick={onClose}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="p-2.5 border-t border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-xs font-black text-gray-900">
              {(userProfile?.nomeCompleto || user?.email)?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-none mb-0.5">
              {userProfile?.nomeCompleto || 'Utente'}
            </p>
            <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
              isAdmin
                ? 'bg-yellow-400/20 text-yellow-400'
                : 'bg-blue-400/20 text-blue-400'
            }`}>
              {userProfile?.role || 'AGENT'}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { userProfile } = useAuth()
  const location = useLocation()

  // Trova il nome della pagina corrente
  const allItems = NAV_GROUPS.flatMap(g => g.items)
  const currentPage = allItems.find(i =>
    location.pathname === i.href || location.pathname.startsWith(i.href + '/')
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 lg:hidden transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex lg:flex-col">
        <SidebarContent />
      </div>

      {/* Main */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="sticky top-0 z-30 flex items-center h-14 px-4 bg-white border-b border-gray-200 shadow-sm lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <div className="bg-yellow-400 w-6 h-6 rounded flex items-center justify-center">
              <span className="text-xs font-black text-gray-900">C3</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">
              {currentPage?.name || 'C3 Agency'}
            </span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
      <ConfirmContainer />
    </div>
  )
}
