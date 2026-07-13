import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Edit, Plus, Trash2, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const formatDateTime = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  })
}

export default function NotesLogField({ value = [], onChange, deprecatedNote = '', title = 'Note' }) {
  const { userProfile } = useAuth()
  const [deprecatedOpen, setDeprecatedOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState({
    topic: '',
    contenuto: '',
  })

  const notes = Array.isArray(value)
    ? [...value]
      .map(note => ({
        ...note,
        id: note.id || `legacy-${note.timestamp || ''}-${note.topic || ''}-${note.contenuto || ''}`,
      }))
      .sort((left, right) => String(right.timestamp || '').localeCompare(String(left.timestamp || '')))
    : []
  const readonly = !onChange
  const operatorName = userProfile?.agenteNome || userProfile?.nomeCompleto || userProfile?.email || 'Operatore'

  const resetDraft = () => {
    setEditingId(null)
    setDraft({ topic: '', contenuto: '' })
  }

  const submitNote = () => {
    if (!draft.topic.trim() && !draft.contenuto.trim()) return

    if (editingId) {
      onChange?.(notes.map(note => (
        note.id === editingId
          ? {
            ...note,
            topic: draft.topic.trim(),
            contenuto: draft.contenuto.trim(),
            modificatoDa: operatorName,
            modificatoIl: new Date().toISOString(),
          }
          : note
      )))
      resetDraft()
      return
    }

    const timestamp = new Date().toISOString()
    onChange?.([
      ...notes,
      {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : timestamp,
        operatore: operatorName,
        topic: draft.topic.trim(),
        contenuto: draft.contenuto.trim(),
        timestamp,
      },
    ])
    resetDraft()
  }

  const removeNote = (id) => {
    onChange?.(notes.filter(note => note.id !== id))
  }

  const startEdit = (note) => {
    setEditingId(note.id)
    setDraft({
      topic: note.topic || '',
      contenuto: note.contenuto || '',
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="form-section-title">{title}</p>
        <p className="text-xs text-gray-400 mt-1">
          Inserisci note strutturate con operatore, topic, contenuto e data/ora.
        </p>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">Operatore</th>
              <th className="text-left px-3 py-2 font-semibold">Topic</th>
              <th className="text-left px-3 py-2 font-semibold">Contenuto</th>
              <th className="text-left px-3 py-2 font-semibold">Data e Ora</th>
              <th className="text-right px-3 py-2 font-semibold">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {notes.map(note => (
              <tr key={note.id || `${note.timestamp}-${note.topic}`} className="border-t border-gray-100 align-top">
                <td className="px-3 py-2 text-gray-700">{note.operatore || '-'}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{note.topic || '-'}</td>
                <td className="px-3 py-2 text-gray-700 whitespace-pre-wrap min-w-[220px]">{note.contenuto || '-'}</td>
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{formatDateTime(note.timestamp)}</td>
                <td className="px-3 py-2 text-right">
                  {!readonly && (
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" onClick={() => startEdit(note)} className="text-gray-400 hover:text-yellow-600" title="Modifica nota">
                        <Edit className="w-4 h-4 inline" />
                      </button>
                      <button type="button" onClick={() => removeNote(note.id)} className="text-red-500 hover:text-red-700" title="Elimina nota">
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {notes.length === 0 && (
              <tr className="border-t border-gray-100">
                <td colSpan={5} className="px-3 py-6 text-center text-gray-400">Nessuna nota strutturata.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!readonly && <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div>
          <label className="label">Topic</label>
          <input className="input" value={draft.topic} onChange={e => setDraft(prev => ({ ...prev, topic: e.target.value }))} />
        </div>
        <div className="md:col-span-2">
          <label className="label">Contenuto</label>
          <textarea className="input min-h-[80px]" value={draft.contenuto} onChange={e => setDraft(prev => ({ ...prev, contenuto: e.target.value }))} />
        </div>
        <div className="md:col-span-3 flex justify-end">
          {editingId && (
            <button type="button" onClick={resetDraft} className="inline-flex items-center gap-2 px-4 py-2 mr-2 border border-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-50">
              <X className="w-4 h-4" />
              Annulla modifica
            </button>
          )}
          <button type="button" onClick={submitNote} className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500">
            {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editingId ? 'Salva modifica' : 'Aggiungi nota'}
          </button>
        </div>
      </div>}

      {deprecatedNote && (
        <div className="border border-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => setDeprecatedOpen(open => !open)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            <span>Note Deprecated</span>
            {deprecatedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {deprecatedOpen && (
            <div className="px-4 pb-4 text-sm text-gray-700 whitespace-pre-wrap">
              {deprecatedNote}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
