import { useEffect, useState } from 'react'
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

const emptyClienteTerzo = { nome: '', email: '', telefono: '', sitoWeb: '', note: '' }

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

  useEffect(() => { loadClientiTerzi() }, [])

  const loadClientiTerzi = async () => {
    setLoading(true)
    const { data } = await getAllClientiTerzi()
    setClientiTerzi(data || [])
    setLoading(false)
  }

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
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      sitoWeb: cliente.sitoWeb || '',
      note: cliente.note || '',
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

  const ClienteTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/50">
            <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase">Nome</th>
            <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase">Email</th>
            <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase">Telefono</th>
            <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase">Sito</th>
            <th className="py-2.5 px-3" />
          </tr>
        </thead>
        <tbody>
          {clientiTerzi.map(cliente => (
            <tr key={cliente.id} className="border-b border-gray-100 hover:bg-gray-50 group">
              <td className="py-2.5 px-3 font-medium text-sm text-gray-900">{cliente.nome}</td>
              <td className="py-2.5 px-3 text-sm text-gray-500">{cliente.email || '-'}</td>
              <td className="py-2.5 px-3 text-sm text-gray-500">{cliente.telefono || '-'}</td>
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
  )

  const ModalForm = () => (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
      <h3 className="font-semibold text-gray-800 mb-4">
        {editingCliente ? 'Modifica Cliente' : 'Nuovo Cliente Terzo'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Nome / Ragione sociale *</label>
          <input className="input" value={form.nome}
            onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
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
          <label className="label">Note</label>
          <input className="input" value={form.note || ''}
            onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button onClick={closeModal}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Annulla</button>
        <button onClick={handleSave}
          className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold text-sm hover:bg-yellow-500">Salva</button>
      </div>
    </div>
  )

  if (loading) return (
    <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400" />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-800">Clienti Terzi</h3>
          <p className="text-xs text-gray-400">{clientiTerzi.length} clienti censiti</p>
        </div>
        <button onClick={openNewForm}
          className="flex items-center gap-2 px-3 py-1.5 bg-yellow-400 text-gray-900 rounded-lg font-semibold text-sm hover:bg-yellow-500">
          <Plus className="w-4 h-4" />
          Aggiungi Cliente
        </button>
      </div>

      {clientiTerzi.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">Nessun cliente terzo censito.</p>
      ) : (
        <ClienteTable />
      )}

      {showManage && (
        <Modal
          title={editingCliente ? 'Modifica Cliente Terzo' : 'Nuovo Cliente Terzo'}
          subtitle="Anagrafica dei soggetti esterni usati nei contratti fissi."
          onClose={closeModal}
          maxWidth="max-w-3xl"
        >
          {showForm && <ModalForm />}
        </Modal>
      )}
    </div>
  )
}
