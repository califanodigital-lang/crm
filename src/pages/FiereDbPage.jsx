import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Calendar, Edit, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { createCircuito, deleteCircuito, getAllCircuiti, updateCircuito } from '../services/circuitiService'
import { createFieraDb, deleteFieraDb, getAllFiereDb, updateFieraDb } from '../services/fieraDbService'
import { createTrattativaFieraFromFiera } from '../services/trattativaFieraService'
import { TIPOLOGIE_EVENTO } from '../constants/constants'
import { formatDate } from '../utils/date'
import { confirm } from '../components/ConfirmModal'
import { toast } from '../components/Toast'

const EMPTY_FIERA_FORM = {
  nome: '',
  tipo: '',
  circuitoId: '',
  location: '',
  citta: '',
  dataInizio: '',
  dataFine: '',
  referente: '',
  contatto: '',
  telefono: '',
  sitoWeb: '',
  ultimaData: '',
  prossimoContatto: '',
  note: '',
}

const EMPTY_CIRCUITO_FORM = {
  nome: '',
  note: '',
}

function getContactStatus(prossimoContatto) {
  if (!prossimoContatto) return 'nessuna'

  const d = new Date(`${prossimoContatto}T00:00:00`)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((d - now) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'scaduto'
  if (diffDays <= 30) return 'imminente'
  return 'ok'
}

function StatusBadge({ status }) {
  if (status === 'scaduto') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Scaduto</span>
  if (status === 'imminente') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Entro 30gg</span>
  if (status === 'ok') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">OK</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">-</span>
}

export default function FiereDbPage() {
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  const [fiere, setFiere] = useState([])
  const [circuiti, setCircuiti] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('lista')
  const [fieraModalOpen, setFieraModalOpen] = useState(false)
  const [editingFiera, setEditingFiera] = useState(null)
  const [fieraForm, setFieraForm] = useState(EMPTY_FIERA_FORM)
  const [circuitoModalOpen, setCircuitoModalOpen] = useState(false)
  const [editingCircuito, setEditingCircuito] = useState(null)
  const [circuitoForm, setCircuitoForm] = useState(EMPTY_CIRCUITO_FORM)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [fiereRes, circuitiRes] = await Promise.all([getAllFiereDb(), getAllCircuiti()])
    setFiere(fiereRes.data || [])
    setCircuiti(circuitiRes.data || [])
    setLoading(false)
  }

  const circuitiMap = useMemo(
    () => Object.fromEntries((circuiti || []).map(circuito => [circuito.id, circuito.nome])),
    [circuiti]
  )

  const openCreateFieraModal = () => {
    setEditingFiera(null)
    setFieraForm(EMPTY_FIERA_FORM)
    setFieraModalOpen(true)
  }

  const openEditFieraModal = (fiera) => {
    setEditingFiera(fiera)
    setFieraForm({
      ...EMPTY_FIERA_FORM,
      ...fiera,
    })
    setFieraModalOpen(true)
  }

  const handleSaveFiera = async () => {
    if (!fieraForm.nome.trim()) {
      toast.error('Il nome della fiera è obbligatorio')
      return
    }

    const action = editingFiera
      ? updateFieraDb(editingFiera.id, fieraForm)
      : createFieraDb(fieraForm)

    const { error, reused } = await action
    if (error) {
      toast.error('Errore durante il salvataggio della scheda')
      return
    }

    setFieraModalOpen(false)
    setEditingFiera(null)
    setFieraForm(EMPTY_FIERA_FORM)
    await loadData()

    if (!editingFiera && reused) {
      toast.success('Scheda già presente: ho aggiornato quella esistente.')
      return
    }

    toast.success(editingFiera ? 'Scheda fiera aggiornata' : 'Fiera aggiunta al database')
  }

  const handleDeleteFiera = async (id) => {
    const ok = await confirm('Rimuovere questa fiera dal database?', { title: 'Elimina fiera', confirmLabel: 'Elimina' })
    if (!ok) return

    const { error } = await deleteFieraDb(id)
    if (error) {
      toast.error('Errore durante l’eliminazione')
      return
    }

    toast.success('Scheda fiera eliminata')
    loadData()
  }

  const handleStartTrattativa = async (fiera) => {
    const { error, reused } = await createTrattativaFieraFromFiera(fiera, userProfile?.agenteNome)
    if (error) {
      toast.error('Errore creando la trattativa fiera')
      return
    }

    toast.success(reused ? 'Esiste già una trattativa aperta per questa fiera.' : 'Trattativa fiera creata.')
    navigate('/trattative-fiere')
  }

  const openCreateCircuitoModal = () => {
    setEditingCircuito(null)
    setCircuitoForm(EMPTY_CIRCUITO_FORM)
    setCircuitoModalOpen(true)
  }

  const openEditCircuitoModal = (circuito) => {
    setEditingCircuito(circuito)
    setCircuitoForm({
      nome: circuito.nome || '',
      note: circuito.note || '',
    })
    setCircuitoModalOpen(true)
  }

  const handleSaveCircuito = async () => {
    if (!circuitoForm.nome.trim()) {
      toast.error('Il nome del circuito è obbligatorio')
      return
    }

    const action = editingCircuito
      ? updateCircuito(editingCircuito.id, circuitoForm)
      : createCircuito(circuitoForm)

    const { error } = await action
    if (error) {
      toast.error('Errore salvando il circuito')
      return
    }

    setCircuitoModalOpen(false)
    setEditingCircuito(null)
    setCircuitoForm(EMPTY_CIRCUITO_FORM)
    await loadData()
    toast.success(editingCircuito ? 'Circuito aggiornato' : 'Circuito creato')
  }

  const handleDeleteCircuito = async (id) => {
    const ok = await confirm('Eliminare questo circuito?', { title: 'Elimina circuito', confirmLabel: 'Elimina' })
    if (!ok) return

    const { error } = await deleteCircuito(id)
    if (error) {
      toast.error('Errore eliminando il circuito')
      return
    }

    await loadData()
    toast.success('Circuito eliminato')
  }

  const fiereByMonth = {}
  fiere.forEach(fiera => {
    if (!fiera.prossimoContatto) return
    const key = fiera.prossimoContatto.slice(0, 7)
    if (!fiereByMonth[key]) fiereByMonth[key] = []
    fiereByMonth[key].push(fiera)
  })

  const sortedMonths = Object.keys(fiereByMonth).sort()
  const scadute = fiere.filter(fiera => getContactStatus(fiera.prossimoContatto) === 'scaduto').length
  const imminenti = fiere.filter(fiera => getContactStatus(fiera.prossimoContatto) === 'imminente').length

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div></div>
  }

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">DB Fiere & Eventi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Database master delle fiere: anagrafica, contatti, circuiti e dati utili per aprire le Trattative Fiere.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTab('circuiti')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg font-semibold hover:bg-gray-50"
          >
            Gestisci circuiti
          </button>
          <button
            onClick={openCreateFieraModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500"
          >
            <Plus className="w-4 h-4" />
            Nuova Fiera / Evento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-900">{fiere.length}</p>
          <p className="text-sm text-gray-500">Schede totali</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-yellow-600">{imminenti}</p>
          <p className="text-sm text-gray-500">Contatti entro 30gg</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-600">{scadute}</p>
          <p className="text-sm text-gray-500">Contatti scaduti</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'lista', label: 'Database Fiere' },
          { key: 'calendario', label: 'Calendario Contatti' },
          { key: 'circuiti', label: 'Circuiti' },
        ].map(currentTab => (
          <button
            key={currentTab.key}
            onClick={() => setTab(currentTab.key)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              tab === currentTab.key
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {currentTab.label}
          </button>
        ))}
      </div>

      {tab === 'lista' && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-sm">
                <th className="text-left py-2 pr-4 font-semibold">Nome</th>
                <th className="text-left py-2 pr-4 font-semibold">Regione</th>
                <th className="text-left py-2 pr-4 font-semibold">Circuito</th>
                <th className="text-left py-2 pr-4 font-semibold">Data inizio</th>
                <th className="text-left py-2 pr-4 font-semibold">Data fine</th>
                <th className="text-left py-2 pr-4 font-semibold">Tipologia</th>
                <th className="text-left py-2 pr-4 font-semibold">Prossimo contatto</th>
                <th className="text-left py-2 pr-4 font-semibold">Stato</th>
                <th className="text-right py-2 font-semibold">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {fiere.map(fiera => {
                const status = getContactStatus(fiera.prossimoContatto)
                return (
                  <tr key={fiera.id} className={`border-b ${status === 'scaduto' ? 'bg-red-50' : status === 'imminente' ? 'bg-yellow-50' : ''}`}>
                    <td className="py-2 pr-4">
                      <div className="font-medium">{fiera.nome}</div>
                      {fiera.citta && <div className="text-xs text-gray-400">{fiera.citta}</div>}
                    </td>
                    <td className="py-2 pr-4 text-sm text-gray-600">{fiera.location || '-'}</td>
                    <td className="py-2 pr-4 text-sm text-gray-600">{circuitiMap[fiera.circuitoId] || '-'}</td>
                    <td className="py-2 pr-4 text-sm">{formatDate(fiera.dataInizio)}</td>
                    <td className="py-2 pr-4 text-sm">{formatDate(fiera.dataFine)}</td>
                    <td className="py-2 pr-4 text-sm text-gray-600">{fiera.tipo || '-'}</td>
                    <td className="py-2 pr-4 text-sm">{formatDate(fiera.prossimoContatto)}</td>
                    <td className="py-2 pr-4"><StatusBadge status={status} /></td>
                    <td className="py-2 text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => handleStartTrattativa(fiera)}
                          className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 font-medium"
                          title="Apri la trattativa fiera a partire da questa scheda"
                        >
                          <Plus className="w-3 h-3 inline" /> Trattativa
                        </button>
                        <button onClick={() => openEditFieraModal(fiera)} className="text-yellow-600 hover:text-yellow-800">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteFiera(fiera.id)} className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {fiere.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-gray-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>Nessuna fiera nel database.</p>
                    <p className="text-sm mt-1">Crea la prima scheda per iniziare il flusso DB Fiere → Trattative Fiere → Fiere & Eventi.</p>
                    <button
                      onClick={openCreateFieraModal}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500"
                    >
                      <Plus className="w-4 h-4" />
                      Nuova Fiera / Evento
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'calendario' && (
        <div className="space-y-6">
          {sortedMonths.length === 0 && (
            <div className="card text-center py-10 text-gray-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Nessuna data di contatto impostata.</p>
            </div>
          )}
          {sortedMonths.map(month => {
            const [year, monthIndex] = month.split('-')
            const monthLabel = new Date(parseInt(year, 10), parseInt(monthIndex, 10) - 1, 1)
              .toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

            return (
              <div key={month} className="card">
                <h3 className="font-bold text-gray-900 mb-3 capitalize">{monthLabel}</h3>
                <div className="space-y-2">
                  {fiereByMonth[month].map(fiera => {
                    const status = getContactStatus(fiera.prossimoContatto)
                    return (
                      <div
                        key={fiera.id}
                        className={`flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-3 rounded-lg border ${
                          status === 'scaduto'
                            ? 'border-red-200 bg-red-50'
                            : status === 'imminente'
                              ? 'border-yellow-200 bg-yellow-50'
                              : 'border-gray-100 bg-gray-50'
                        }`}
                      >
                        <div>
                          <span className="font-medium text-gray-900">{fiera.nome}</span>
                          {fiera.citta && <span className="text-sm text-gray-500 ml-2">- {fiera.citta}</span>}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {fiera.tipo || 'Tipologia non definita'}{circuitiMap[fiera.circuitoId] ? ` · ${circuitiMap[fiera.circuitoId]}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm text-gray-600">{formatDate(fiera.prossimoContatto)}</span>
                          <StatusBadge status={status} />
                          <button
                            onClick={() => handleStartTrattativa(fiera)}
                            className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 font-medium"
                          >
                            <Plus className="w-3 h-3 inline" /> Trattativa
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'circuiti' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Circuiti censiti</h3>
              <p className="text-sm text-gray-500">Usati nelle schede DB Fiere, nelle Trattative Fiere e negli Eventi.</p>
            </div>
            <button
              onClick={openCreateCircuitoModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500"
            >
              <Plus className="w-4 h-4" />
              Nuovo circuito
            </button>
          </div>

          <div className="space-y-2">
            {circuiti.map(circuito => (
              <div key={circuito.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
                <div>
                  <div className="font-medium text-gray-900">{circuito.nome}</div>
                  {circuito.note && <div className="text-xs text-gray-400 mt-0.5">{circuito.note}</div>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditCircuitoModal(circuito)} className="text-yellow-600 hover:text-yellow-800">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteCircuito(circuito.id)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {circuiti.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Nessun circuito censito.</p>
            )}
          </div>
        </div>
      )}

      {fieraModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold mb-1">{editingFiera ? `Modifica — ${editingFiera.nome}` : 'Nuova fiera / evento'}</h3>
            <p className="text-sm text-gray-500 mb-4">
              Questa scheda rappresenta il database master della fiera: anagrafica, contatti e dati utili per aprire una trattativa.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nome *</label>
                <input className="input" value={fieraForm.nome} onChange={(e) => setFieraForm(form => ({ ...form, nome: e.target.value }))} />
              </div>
              <div>
                <label className="label">Tipologia evento</label>
                <select className="input" value={fieraForm.tipo || ''} onChange={(e) => setFieraForm(form => ({ ...form, tipo: e.target.value }))}>
                  <option value="">Seleziona tipologia...</option>
                  {TIPOLOGIE_EVENTO.map(tipologia => (
                    <option key={tipologia} value={tipologia}>{tipologia}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Circuito</label>
                <select className="input" value={fieraForm.circuitoId || ''} onChange={(e) => setFieraForm(form => ({ ...form, circuitoId: e.target.value }))}>
                  <option value="">Nessun circuito</option>
                  {circuiti.map(circuito => (
                    <option key={circuito.id} value={circuito.id}>{circuito.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Regione</label>
                <input className="input" value={fieraForm.location || ''} onChange={(e) => setFieraForm(form => ({ ...form, location: e.target.value }))} />
              </div>
              <div>
                <label className="label">Città</label>
                <input className="input" value={fieraForm.citta || ''} onChange={(e) => setFieraForm(form => ({ ...form, citta: e.target.value }))} />
              </div>
              <div>
                <label className="label">Referente</label>
                <input className="input" value={fieraForm.referente || ''} onChange={(e) => setFieraForm(form => ({ ...form, referente: e.target.value }))} />
              </div>
              <div>
                <label className="label">Email / contatto</label>
                <input className="input" value={fieraForm.contatto || ''} onChange={(e) => setFieraForm(form => ({ ...form, contatto: e.target.value }))} />
              </div>
              <div>
                <label className="label">Telefono</label>
                <input className="input" value={fieraForm.telefono || ''} onChange={(e) => setFieraForm(form => ({ ...form, telefono: e.target.value }))} />
              </div>
              <div>
                <label className="label">Sito web</label>
                <input className="input" value={fieraForm.sitoWeb || ''} onChange={(e) => setFieraForm(form => ({ ...form, sitoWeb: e.target.value }))} />
              </div>
              <div>
                <label className="label">Data inizio evento</label>
                <input type="date" className="input" value={fieraForm.dataInizio || ''} onChange={(e) => setFieraForm(form => ({ ...form, dataInizio: e.target.value }))} />
              </div>
              <div>
                <label className="label">Data fine evento</label>
                <input type="date" className="input" value={fieraForm.dataFine || ''} onChange={(e) => setFieraForm(form => ({ ...form, dataFine: e.target.value }))} />
              </div>
              <div>
                <label className="label">Ultima data evento</label>
                <input type="date" className="input" value={fieraForm.ultimaData || ''} onChange={(e) => setFieraForm(form => ({ ...form, ultimaData: e.target.value }))} />
              </div>
              <div>
                <label className="label">Prossimo contatto</label>
                <input type="date" className="input" value={fieraForm.prossimoContatto || ''} onChange={(e) => setFieraForm(form => ({ ...form, prossimoContatto: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Note</label>
                <textarea className="input min-h-[100px]" value={fieraForm.note || ''} onChange={(e) => setFieraForm(form => ({ ...form, note: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => { setFieraModalOpen(false); setEditingFiera(null); setFieraForm(EMPTY_FIERA_FORM) }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Annulla
              </button>
              <button onClick={handleSaveFiera} className="px-4 py-2 bg-yellow-400 rounded-lg font-semibold hover:bg-yellow-500">
                {editingFiera ? 'Salva' : 'Crea Scheda'}
              </button>
            </div>
          </div>
        </div>
      )}

      {circuitoModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold mb-4">{editingCircuito ? `Modifica circuito — ${editingCircuito.nome}` : 'Nuovo circuito'}</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Nome *</label>
                <input className="input" value={circuitoForm.nome} onChange={(e) => setCircuitoForm(form => ({ ...form, nome: e.target.value }))} />
              </div>
              <div>
                <label className="label">Note</label>
                <textarea className="input min-h-[100px]" value={circuitoForm.note || ''} onChange={(e) => setCircuitoForm(form => ({ ...form, note: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => { setCircuitoModalOpen(false); setEditingCircuito(null); setCircuitoForm(EMPTY_CIRCUITO_FORM) }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Annulla
              </button>
              <button onClick={handleSaveCircuito} className="px-4 py-2 bg-yellow-400 rounded-lg font-semibold hover:bg-yellow-500">
                {editingCircuito ? 'Salva circuito' : 'Crea circuito'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
