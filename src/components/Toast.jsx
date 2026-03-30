// src/components/Toast.jsx
import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

// ── Singleton globale — non usa Context ──────────────────────
let _addToast = null

export const toast = {
  success: (msg) => _addToast?.('success', msg),
  error:   (msg) => _addToast?.('error',   msg),
  warning: (msg) => _addToast?.('warning', msg),
  info:    (msg) => _addToast?.('info',    msg),
}

// ── Componente da montare UNA VOLTA in Layout ────────────────
export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    _addToast = (type, message) => {
      const id = Date.now() + Math.random()
      setToasts(prev => [...prev, { id, type, message }])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, type === 'error' ? 6000 : 4000)
    }
    return () => { _addToast = null }
  }, [])

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  const config = {
    success: { icon: CheckCircle,   bg: 'bg-green-50',  border: 'border-green-200',  ic: 'text-green-600',  tx: 'text-green-900' },
    error:   { icon: XCircle,       bg: 'bg-red-50',    border: 'border-red-200',    ic: 'text-red-600',    tx: 'text-red-900' },
    warning: { icon: AlertTriangle, bg: 'bg-yellow-50', border: 'border-yellow-300', ic: 'text-yellow-600', tx: 'text-yellow-900' },
    info:    { icon: Info,          bg: 'bg-blue-50',   border: 'border-blue-200',   ic: 'text-blue-600',   tx: 'text-blue-900' },
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map(t => {
        const c = config[t.type] || config.info
        const Icon = c.icon
        return (
          <div key={t.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg pointer-events-auto
              ${c.bg} ${c.border}`}
            style={{ animation: 'toastIn 0.2s ease' }}
          >
            <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${c.ic}`} />
            <p className={`text-sm font-medium flex-1 ${c.tx}`}>{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateX(16px) } to { opacity:1; transform:translateX(0) } }`}</style>
    </div>
  )
}

// Alias per compatibilità — non fa nulla, i provider non servono più
export function ToastProvider({ children }) { return children }
export function useToast() { return toast }