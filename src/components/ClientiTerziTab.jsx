import { useCallback, useEffect, useState } from 'react'
import { Edit, ExternalLink, Plus, Trash2 } from 'lucide-react'
import {
  getAllClientiTerzi,
  createClienteTerzo,
  updateClienteTerzo,
  deleteClienteTerzo,
} from '../services/clientiTerziService'
import { confirm } from './ConfirmModal'
import { toast } from './Toast'
import Modal from './Modal'
import NotesLogField from './NotesLogField'

const emptyClienteTerzo = {
  nome: '',
  cognome: '',
  email: '',
  telefono: '',
  sitoWeb: '',
  codiceFiscale: '',
  piva: '',
  residenza: '',
  domicilioFiscale: '',
  note: '',
  noteLog: [],
}

const getHref = (url) => {
  if (!url) return ''
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

export default function ClientiTerziTab({ onDataChanged }) {
  const [clientiTerzi, setClientiTerzi] = useState([])
  const [loading, setLoading] = useState(true)
  const [showManage, setShowManage] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingCliente, setEditingCliente] = useState(null)
  const [form, setForm] = useState(emptyClienteTerzo)

  const loadClientiTerzi = useCallback(async () => {
    setLoading(true)
    const { data } = await getAllClientiTerzi()
    setClientiTerzi(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { Promise.resolve().then(loadClientiTerzi) }, [loadClientiTerzi])

  const closeForm = () => {
    setShowForm(false)
    setEditingCliente(null)
    setForm(emptyClienteTerzo)
  }

  const closeModal = () => {
    setShowManage(false)
    closeForm()
  }

  const handleSave = async () => {
    if (!form.nome) {
      toast.error('Il nome e obbligatorio')
      return
    }

    const fn = editingCliente
      ? updateClienteTerzo(editingCliente.id, form)
      : createClienteTerzo(form)
    const { error } = await fn
    if (error) {
      toast.error('Errore durante il salvataggio')
      return
    }

    toast.success(editingCliente ? 'Cliente aggiornato' : 'Cliente creato')
    closeModal()
    await loadClientiTerzi()
    onDataChanged?.()
  }

  const handleEdit = (cliente) => {
    setEditingCliente(cliente)
    setForm({
      nome: cliente.nome,
      cognome: cliente.cognome || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      sitoWeb: cliente.sitoWeb || '',
      codiceFiscale: cliente.codiceFiscale || '',
      piva: cliente.piva || '',
      residenza: cliente.residenza || '',
      domicilioFiscale: cliente.domicilioFiscale || '',
      note: cliente.note || '',
      noteLog: cliente.noteLog || [],
    })
    setShowManage(true)
    setShowForm(true)
  }

  const openNewForm = () => {
    closeForm()
    setShowManage(true)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    const ok = await confirm('Questa azione e irreversibile.', {
      title: 'Eliminare il cliente?',
      confirmLabel: 'Elimina',
    })
    if (!ok) return

    const { error } = await deleteClienteTerzo(id)
    if (error) {
      toast.error('Errore durante eliminazione')
      return
    }
    toast.success('Cliente eliminato')
    await loadClientiTerzi()
    onDataChanged?.()
  }

  if (loading) return (
    <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400" />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-800">Clienti</h3>
          <p className="text-xs text-gray-400">{clientiTerzi.length} clienti censiti</p>
        </div>
        <button onClick={openNewForm}
          className="flex items-center gap-2 px-3 py-1.5 bg-yellow-400 text-gray-900 rounded-lg font-semibold text-sm hover:bg-yellow-500">
          <Plus className="w-4 h-4" />
          Aggiungi Cliente
        </button>
      </div>

      {clientiTerzi.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">Nessun cliente censito.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase">Nome</th>
                <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase">Cognome</th>
                <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase">Email</th>
                <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase">Telefono</th>
                <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase">P.IVA / CF</th>
                <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase">Sito</th>
                <th className="py-2.5 px-3" />
              </tr>
            </thead>
            <tbody>
              {clientiTerzi.map(cliente => (
                <tr key={cliente.id} className="border-b border-gray-100 hover:bg-gray-50 group">
                  <td className="py-2.5 px-3 font-medium text-sm text-gray-900">{cliente.nome}</td>
                  <td className="py-2.5 px-3 text-sm text-gray-500">{cliente.cognome || '-'}</td>
                  <td className="py-2.5 px-3 text-sm text-gray-500">{cliente.email || '-'}</td>
                  <td className="py-2.5 px-3 text-sm text-gray-500">{cliente.telefono || '-'}</td>
                  <td className="py-2.5 px-3 text-sm text-gray-500">{cliente.piva || cliente.codiceFiscale || '-'}</td>
                  <td className="py-2.5 px-3 text-sm text-gray-500">
                    {cliente.sitoWeb ? (
                      <a href={getHref(cliente.sitoWeb)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700">
                        Apri <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : '-'}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEdit(cliente)}
                        className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded-lg" title="Modifica cliente"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(cliente.id)}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg" title="Elimina cliente"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showManage && (
        <Modal
          title={editingCliente ? 'Modifica Cliente' : 'Nuovo Cliente'}
          subtitle="Anagrafica clienti usata nei contratti fissi e nei flussi amministrativi."
          onClose={closeModal}
          maxWidth="max-w-3xl"
        >
          {showForm && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4">
                {editingCliente ? 'Modifica Cliente' : 'Nuovo Cliente'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nome / Ragione sociale *</label>
                  <input className="input" value={form.nome}
                    onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Cognome</label>
                  <input className="input" value={form.cognome || ''}
                    onChange={e => setForm(p => ({ ...p, cognome: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input" value={form.email || ''}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Telefono</label>
                  <input className="input" value={form.telefono || ''}
                    onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Sito Web</label>
                  <input type="url" className="input" value={form.sitoWeb || ''}
                    onChange={e => setForm(p => ({ ...p, sitoWeb: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Codice Fiscale</label>
                  <input className="input" value={form.codiceFiscale || ''}
                    onChange={e => setForm(p => ({ ...p, codiceFiscale: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Partita IVA</label>
                  <input className="input" value={form.piva || ''}
                    onChange={e => setForm(p => ({ ...p, piva: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Residenza</label>
                  <input className="input" value={form.residenza || ''}
                    onChange={e => setForm(p => ({ ...p, residenza: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Domicilio Fiscale</label>
                  <input className="input" value={form.domicilioFiscale || ''}
                    onChange={e => setForm(p => ({ ...p, domicilioFiscale: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <NotesLogField
                    value={form.noteLog || []}
                    onChange={noteLog => setForm(p => ({ ...p, noteLog }))}
                    deprecatedNote={form.note}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={closeModal}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Annulla</button>
                <button onClick={handleSave}
                  className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold text-sm hover:bg-yellow-500">Salva</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
