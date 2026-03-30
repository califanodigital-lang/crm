// src/components/ConfirmModal.jsx
import { useState, useEffect } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'

let _openConfirm = null

export function confirm(message, options = {}) {
  return new Promise((resolve) => {
    if (!_openConfirm) return resolve(window.confirm(message))
    _openConfirm({ message, options, resolve })
  })
}

export function ConfirmContainer() {
  const [modal, setModal] = useState(null)

  useEffect(() => {
    _openConfirm = ({ message, options, resolve }) => {
      setModal({ message, options, resolve })
    }
    return () => { _openConfirm = null }
  }, [])

  const handle = (result) => {
    modal?.resolve(result)
    setModal(null)
  }

  if (!modal) return null

  const dangerous = modal.options.dangerous !== false
  const title = modal.options.title || 'Conferma'
  const confirmLabel = modal.options.confirmLabel || 'Elimina'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => handle(false)} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-10">
        <div className="flex items-start gap-4 mb-5">
          <div className={`p-2.5 rounded-xl flex-shrink-0 ${dangerous ? 'bg-red-100' : 'bg-yellow-100'}`}>
            {dangerous ? <Trash2 className="w-5 h-5 text-red-600" /> : <AlertTriangle className="w-5 h-5 text-yellow-600" />}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-600">{modal.message}</p>
          </div>
          <button onClick={() => handle(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={() => handle(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Annulla
          </button>
          <button onClick={() => handle(true)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              dangerous ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
            }`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// Alias per compatibilità — non fa nulla
export function ConfirmProvider({ children }) { return children }
export function useConfirm() { return confirm }