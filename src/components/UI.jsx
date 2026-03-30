// src/components/UI.jsx
// Componenti riutilizzabili condivisi in tutto il gestionale

import { AlertCircle, Loader2 } from 'lucide-react'

// ── LOADING SPINNER ─────────────────────────────────────────
export function LoadingSpinner({ size = 'md', fullPage = false }) {
  const sizes = { sm: 'h-6 w-6', md: 'h-10 w-10', lg: 'h-14 w-14' }
  const spinner = (
    <Loader2 className={`animate-spin text-yellow-400 ${sizes[size]}`} />
  )
  if (fullPage) {
    return (
      <div className="flex items-center justify-center h-64">
        {spinner}
      </div>
    )
  }
  return (
    <div className="flex justify-center py-8">
      {spinner}
    </div>
  )
}

// ── EMPTY STATE ──────────────────────────────────────────────
export function EmptyState({ icon: Icon = AlertCircle, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-gray-400" />
      </div>
      <p className="text-base font-semibold text-gray-700 mb-1">{title}</p>
      {description && <p className="text-sm text-gray-400 mb-5 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

// ── PAGE HEADER ──────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// ── STAT CARD ────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon: Icon, color = 'yellow' }) {
  const colors = {
    yellow: 'bg-yellow-100 text-yellow-700',
    blue:   'bg-blue-100 text-blue-700',
    green:  'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    red:    'bg-red-100 text-red-700',
    gray:   'bg-gray-100 text-gray-700',
  }
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}

// ── SECTION CARD ─────────────────────────────────────────────
export function SectionCard({ title, icon: Icon, children, action }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-gray-500" />}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  )
}
