// src/components/SearchableSelect.jsx
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'

export default function SearchableSelect({
  options = [],       // [{ value, label }]
  value = '',
  onChange,
  placeholder = 'Cerca o seleziona...',
  disabled = false,
  required = false,
  className = '',
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Chiudi al click fuori
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find(o => o.value === value)

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (opt) => {
    onChange(opt.value)
    setSearch('')
    setOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setSearch('')
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Input visibile */}
      <div
        className={`input flex items-center gap-2 cursor-pointer pr-8 ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
        onClick={() => { if (!disabled) setOpen(o => !o) }}
      >
        {open ? (
          <input
            autoFocus
            className="flex-1 outline-none bg-transparent text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={`flex-1 text-sm truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
            {selected ? selected.label : placeholder}
          </span>
        )}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && !disabled && (
            <button type="button" onClick={handleClear} className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">Nessun risultato</p>
          ) : (
            filtered.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                  opt.value === value ? 'bg-yellow-50 font-semibold text-yellow-800' : 'text-gray-900'
                }`}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}

      {/* Hidden required input */}
      {required && <input tabIndex={-1} className="sr-only" value={value} required readOnly />}
    </div>
  )
}