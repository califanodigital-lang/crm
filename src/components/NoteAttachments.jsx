import { useEffect, useState } from 'react'
import { listAttachments, uploadAttachment, downloadAttachment, deleteAttachment } from '../services/driveAttachmentService'
import { toast } from './Toast'

export default function NoteAttachments({ entityType, entityId, note, readonly }) {
  const [files, setFiles] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const saved = Boolean(entityId && !note._new)
  useEffect(() => {
    let active = true
    if (saved) listAttachments(entityType, entityId, note.id).then(data => {
      if (active) { setFiles(data); setError('') }
    }).catch(err => { if (active) setError(err.message) })
    return () => { active = false }
  }, [entityType, entityId, note.id, saved])

  const run = async action => {
    setBusy(true)
    try { await action(); setError('') } catch (err) { toast.error(err.message) }
    finally { setBusy(false) }
  }

  if (!saved) return <p className="text-xs text-gray-500 mt-2">Salva la scheda per allegare PDF a questa nota.</p>
  return <div className="mt-2 space-y-2">
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    {files.map(file => <div key={file.id} className="flex flex-wrap items-center gap-2 text-xs">
      <button type="button" disabled={busy} className="text-blue-700 underline disabled:opacity-50" onClick={() => run(() => downloadAttachment(file))}>
        {file.name} ({Math.ceil(file.size / 1024)} KB)
      </button>
      {!readonly && <button type="button" disabled={busy} className="text-red-600 disabled:opacity-50" onClick={() => {
        if (window.confirm(`Spostare nel cestino di Drive il PDF "${file.name}"?`)) run(async () => {
          await deleteAttachment(file.id)
          setFiles(current => current.filter(item => item.id !== file.id))
        })
      }}>Rimuovi PDF</button>}
    </div>)}
    {!readonly && <label className="block text-xs text-gray-600">
      {busy ? 'Operazione in corso…' : 'Allega PDF (max 10 MB)'}
      <input type="file" accept="application/pdf,.pdf" disabled={busy} className="block mt-1 max-w-full text-xs" onChange={event => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (file) run(async () => {
          const uploaded = await uploadAttachment(file, entityType, entityId, note.id)
          setFiles(current => [...current, uploaded])
          toast.success('PDF caricato su Drive')
        })
      }} />
    </label>}
    {!readonly && <p className="text-xs text-gray-400">Gli allegati vengono salvati subito, anche se annulli le altre modifiche della scheda.</p>}
  </div>
}
