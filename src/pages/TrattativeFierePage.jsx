import { useEffect, useMemo, useState } from 'react'
import { Calendar, Edit, ExternalLink, Plus, Search, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import DateRangeFilter from '../components/DateRangeFilter'
import { getAllCircuiti } from '../services/circuitiService'
import { getAllFiereDb } from '../services/fieraDbService'
import { getActiveAgents } from '../services/userService'
import {
  createTrattativaFiera,
  deleteTrattativaFiera,
  getAllTrattativeFiere,
  updateStatoTrattativaFiera,
  updateTrattativaFiera,
} from '../services/trattativaFieraService'
import {
  getStatoTrattativaFiera,
  STATI_TRATTATIVA_FIERA,
  STATI_TRATTATIVA_FIERA_CHIUSI,
  TIPOLOGIE_EVENTO,
} from '../constants/constants'
import { confirm } from '../components/ConfirmModal'
import { toast } from '../components/Toast'
import { formatDate } from '../utils/date'
import { doesRangeOverlap, getDefaultMonthlyRange, hasAnyDateInRange, isDateRangeDisabled } from '../utils/dateRange'
import { useNavigate } from 'react-router-dom'

const EMPTY_FORM = {
  fieraDbId: '',
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
  agente: '',
  dataContatto: '',
  stato: 'CONTATTATO',
  dataFollowup1: '',
  dataFollowup2: '',
  note: '',
  eventoId: '',
}

const addDays = (dateString, days) => {
  if (!dateString) return ''
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function StatCard({ label, value, color }) {
  return (
    <div className={`card ${color}`}>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  )
}

function StatoBadge({ value }) {
  const cfg = getStatoTrattativaFiera(value)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

export default function TrattativeFierePage() {
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  const [trattative, setTrattative] = useState([])
  const [fiereDb, setFiereDb] = useState([])
  const [circuiti, setCircuiti] = useState([])
  const [agenti, setAgenti] = useState([])
  const [loading, setLoading] = useState(true)
  const [showClosed, setShowClosed] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStato, setFilterStato] = useState('ALL')
  const [dateRange, setDateRange] = useState(() => getDefaultMonthlyRange())
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [trattativeRes, fiereRes, circuitiRes, agentiRes] = await Promise.all([
      getAllTrattativeFiere(),
      getAllFiereDb(),
      getAllCircuiti(),
      getActiveAgents(),
    ])

    setTrattative(trattativeRes.data || [])
    setFiereDb(fiereRes.data || [])
    setCircuiti(circuitiRes.data || [])
    setAgenti(agentiRes.data || [])
    setLoading(false)
  }

  const circuitiMap = useMemo(
    () => Object.fromEntries((circuiti || []).map(circuito => [circuito.id, circuito.nome])),
    [circuiti]
  )

  const openCreate = () => {
    setFormOpen(true)
    setEditing(null)
    setFormData({
      ...EMPTY_FORM,
      agente: userProfile?.agenteNome || '',
      dataContatto: new Date().toISOString().slice(0, 10),
      dataFollowup1: addDays(new Date().toISOString().slice(0, 10), 4),
      dataFollowup2: addDays(addDays(new Date().toISOString().slice(0, 10), 4), 7),
    })
  }

  const openEdit = (trattativa) => {
    setFormOpen(true)
    setEditing(trattativa)
    setFormData({
      ...EMPTY_FORM,
      ...trattativa,
    })
  }

  const hydrateFromFiera = (fieraId) => {
    const selected = fiereDb.find(fiera => fiera.id === fieraId)
    if (!selected) return

    setFormData(prev => ({
      ...prev,
      fieraDbId: selected.id,
      nome: selected.nome || '',
      tipo: selected.tipo || '',
      circuitoId: selected.circuitoId || '',
      location: selected.location || '',
      citta: selected.citta || '',
      dataInizio: selected.dataInizio || '',
      dataFine: selected.dataFine || '',
      referente: selected.referente || '',
      contatto: selected.contatto || '',
      telefono: selected.telefono || '',
      sitoWeb: selected.sitoWeb || '',
      note: prev.note || selected.note || '',
    }))
  }

  const handleDataContattoChange = (value) => {
    const nextFollowup1 = addDays(value, 4)
    setFormData(prev => ({
      ...prev,
      dataContatto: value,
      dataFollowup1: nextFollowup1,
      dataFollowup2: addDays(nextFollowup1, 7),
    }))
  }

  const handleFollowup1Change = (value) => {
    setFormData(prev => ({
      ...prev,
      dataFollowup1: value,
      dataFollowup2: addDays(value, 7),
    }))
  }

  const handleSave = async () => {
    if (!formData.fieraDbId || !formData.nome.trim()) {
      toast.error('Seleziona una fiera del database e compila il nome.')
      return
    }
    if (!formData.agente) {
      toast.error('Seleziona l’agente che ha contattato la fiera.')
      return
    }
    if (!formData.dataContatto) {
      toast.error('Inserisci la data di contatto.')
      return
    }

    const previousEventoId = editing?.eventoId || null
    const action = editing
      ? updateTrattativaFiera(editing.id, formData)
      : createTrattativaFiera(formData)

    const { data, error } = await action
    if (error) {
      toast.error('Errore durante il salvataggio della trattativa fiera')
      return
    }

    setFormOpen(false)
    setEditing(null)
    setFormData(EMPTY_FORM)
    await loadData()

    if (data?.stato === 'IN_TRATTATIVA' && data?.eventoId && data.eventoId !== previousEventoId) {
      toast.success('Trattativa aggiornata: evento creato in Fiere & Eventi.')
      return
    }

    toast.success(editing ? 'Trattativa fiera aggiornata' : 'Trattativa fiera creata')
  }

  const handleDelete = async (id) => {
    const ok = await confirm('La trattativa fiera verrà eliminata definitivamente.', {
      title: 'Eliminare questa trattativa fiera?',
      confirmLabel: 'Elimina',
    })
    if (!ok) return

    const { error } = await deleteTrattativaFiera(id)
    if (error) {
      toast.error('Errore durante l’eliminazione')
      return
    }

    toast.success('Trattativa fiera eliminata')
    loadData()
  }

  const handleStatoChange = async (trattativa, stato) => {
    const previousEventoId = trattativa.eventoId || null
    const { data, error } = await updateStatoTrattativaFiera(trattativa.id, stato)
    if (error) {
      toast.error('Errore aggiornando lo stato')
      return
    }

    await loadData()

    if (stato === 'IN_TRATTATIVA' && data?.eventoId && data.eventoId !== previousEventoId) {
      toast.success('La fiera è entrata in trattativa ed è stata inviata in Fiere & Eventi.')
      return
    }

    toast.success(`Stato aggiornato a ${getStatoTrattativaFiera(stato).label}`)
  }

  const filtered = trattative.filter(trattativa => {
    const isClosed = STATI_TRATTATIVA_FIERA_CHIUSI.includes(trattativa.stato)
    if (showClosed ? !isClosed : isClosed) return false

    const haystack = [
      trattativa.nome,
      trattativa.location,
      trattativa.citta,
      circuitiMap[trattativa.circuitoId] || '',
      trattativa.agente,
      trattativa.tipo,
    ].join(' ').toLowerCase()

    const matchesSearch = haystack.includes(searchTerm.toLowerCase())
    const matchesStatus = filterStato === 'ALL' || trattativa.stato === filterStato
    const matchesDate = isDateRangeDisabled(dateRange)
      ? true
      : (trattativa.dataInizio || trattativa.dataFine)
          ? doesRangeOverlap(
              { startValue: trattativa.dataInizio, endValue: trattativa.dataFine },
              dateRange.start,
              dateRange.end
            )
          : hasAnyDateInRange(
              [trattativa.dataContatto, trattativa.dataFollowup1, trattativa.dataFollowup2],
              dateRange.start,
              dateRange.end
            )
    return matchesSearch && matchesStatus && matchesDate
  })

  const stats = {
    attive: trattative.filter(t => !STATI_TRATTATIVA_FIERA_CHIUSI.includes(t.stato)).length,
    contattate: trattative.filter(t => t.stato === 'CONTATTATO').length,
    inTrattativa: trattative.filter(t => t.stato === 'IN_TRATTATIVA').length,
    followupImminenti: trattative.filter(t => {
      const target = t.dataFollowup1 || t.dataFollowup2
      if (!target || STATI_TRATTATIVA_FIERA_CHIUSI.includes(t.stato)) return false
      const diff = Math.ceil((new Date(`${target}T00:00:00`) - new Date()) / 86400000)
      return diff >= 0 && diff <= 3
    }).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Trattative Fiere</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Flusso intermedio tra DB Fiere e Fiere & Eventi: contatto, follow-up e passaggio in trattativa.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-yellow-400 text-gray-900 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nuova Trattativa Fiera
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Attive" value={stats.attive} color="bg-blue-50 text-blue-700" />
        <StatCard label="Contattate" value={stats.contattate} color="bg-yellow-50 text-yellow-700" />
        <StatCard label="In Trattativa" value={stats.inTrattativa} color="bg-amber-50 text-amber-700" />
        <StatCard label="Follow-up Imminenti" value={stats.followupImminenti} color="bg-orange-50 text-orange-700" />
      </div>

      <div className="card mb-4">
        <div className="flex flex-col gap-3">
          <DateRangeFilter
            value={dateRange}
            onChange={setDateRange}
            label="Periodo trattative fiere"
            hint="Default: dal primo giorno del mese al primo del mese successivo. Se presenti, il filtro usa le date evento; altrimenti usa contatto e follow-up."
          />
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                className="input pl-11"
                placeholder="Cerca fiera, regione, circuito, agente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select className="input lg:w-52" value={filterStato} onChange={(e) => setFilterStato(e.target.value)}>
              <option value="ALL">Tutti gli stati</option>
              {STATI_TRATTATIVA_FIERA.map(stato => (
                <option key={stato.value} value={stato.value}>{stato.label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowClosed(value => !value)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors whitespace-nowrap ${
                showClosed
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {showClosed ? 'Torna alle attive' : 'Mostra chiuse'}
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Nessuna trattativa fiera trovata</p>
            <p className="text-gray-400 text-sm mt-1">Prova a modificare i filtri o crea una nuova trattativa dal DB Fiere.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Fiera</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Regione</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Circuito</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date Evento</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tipologia</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Agente</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Data Contatto</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Follow-up</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Stato</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(trattativa => (
                <tr key={trattativa.id} className="border-b border-gray-100 hover:bg-gray-50/70 transition-colors group">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-900 text-sm">{trattativa.nome}</div>
                    {trattativa.citta && <div className="text-xs text-gray-400">{trattativa.citta}</div>}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{trattativa.location || '—'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{circuitiMap[trattativa.circuitoId] || '—'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {trattativa.dataInizio
                      ? `${formatDate(trattativa.dataInizio)} ${trattativa.dataFine ? `→ ${formatDate(trattativa.dataFine)}` : ''}`
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{trattativa.tipo || '—'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{trattativa.agente || '—'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(trattativa.dataContatto)}</td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    <div>1°: {formatDate(trattativa.dataFollowup1)}</div>
                    <div>2°: {formatDate(trattativa.dataFollowup2)}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <StatoBadge value={trattativa.stato} />
                      <select
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
                        value={trattativa.stato}
                        onChange={(e) => handleStatoChange(trattativa, e.target.value)}
                      >
                        {STATI_TRATTATIVA_FIERA.map(stato => (
                          <option key={stato.value} value={stato.value}>{stato.label}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(trattativa)}
                        className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Modifica"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {trattativa.eventoId && (
                        <button
                          onClick={() => navigate('/eventi')}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Vai a Fiere & Eventi"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(trattativa.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Elimina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editing ? `Modifica — ${editing.nome}` : 'Nuova Trattativa Fiera'}
                </h3>
                <p className="text-sm text-gray-500">
                  Le date di follow-up vengono proposte automaticamente a +4 giorni dal contatto e +7 giorni dal primo follow-up.
                </p>
              </div>
              <button onClick={() => { setFormOpen(false); setEditing(null); setFormData(EMPTY_FORM) }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Annulla
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Scheda DB Fiere *</label>
                <select
                  className="input"
                  value={formData.fieraDbId}
                  onChange={(e) => hydrateFromFiera(e.target.value)}
                >
                  <option value="">Seleziona una fiera dal database...</option>
                  {fiereDb.map(fiera => (
                    <option key={fiera.id} value={fiera.id}>{fiera.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Nome evento *</label>
                <input className="input" value={formData.nome} onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))} />
              </div>
              <div>
                <label className="label">Tipologia evento</label>
                <select className="input" value={formData.tipo || ''} onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}>
                  <option value="">Seleziona tipologia...</option>
                  {TIPOLOGIE_EVENTO.map(tipologia => (
                    <option key={tipologia} value={tipologia}>{tipologia}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Regione</label>
                <input className="input" value={formData.location || ''} onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} />
              </div>
              <div>
                <label className="label">Città</label>
                <input className="input" value={formData.citta || ''} onChange={(e) => setFormData(prev => ({ ...prev, citta: e.target.value }))} />
              </div>
              <div>
                <label className="label">Circuito</label>
                <select className="input" value={formData.circuitoId || ''} onChange={(e) => setFormData(prev => ({ ...prev, circuitoId: e.target.value }))}>
                  <option value="">Nessun circuito</option>
                  {circuiti.map(circuito => (
                    <option key={circuito.id} value={circuito.id}>{circuito.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Agente</label>
                <select className="input" value={formData.agente || ''} onChange={(e) => setFormData(prev => ({ ...prev, agente: e.target.value }))}>
                  <option value="">Seleziona agente...</option>
                  {agenti.map(agente => (
                    <option key={agente.id} value={agente.agenteNome}>{agente.nomeCompleto}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Data inizio evento</label>
                <input type="date" className="input" value={formData.dataInizio || ''} onChange={(e) => setFormData(prev => ({ ...prev, dataInizio: e.target.value }))} />
              </div>
              <div>
                <label className="label">Data fine evento</label>
                <input type="date" className="input" value={formData.dataFine || ''} onChange={(e) => setFormData(prev => ({ ...prev, dataFine: e.target.value }))} />
              </div>
              <div>
                <label className="label">Referente</label>
                <input className="input" value={formData.referente || ''} onChange={(e) => setFormData(prev => ({ ...prev, referente: e.target.value }))} />
              </div>
              <div>
                <label className="label">Email / contatto</label>
                <input className="input" value={formData.contatto || ''} onChange={(e) => setFormData(prev => ({ ...prev, contatto: e.target.value }))} />
              </div>
              <div>
                <label className="label">Telefono</label>
                <input className="input" value={formData.telefono || ''} onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))} />
              </div>
              <div>
                <label className="label">Sito web</label>
                <input className="input" value={formData.sitoWeb || ''} onChange={(e) => setFormData(prev => ({ ...prev, sitoWeb: e.target.value }))} />
              </div>
              <div>
                <label className="label">Data contatto</label>
                <input type="date" className="input" value={formData.dataContatto || ''} onChange={(e) => handleDataContattoChange(e.target.value)} />
              </div>
              <div>
                <label className="label">Stato</label>
                <select className="input" value={formData.stato} onChange={(e) => setFormData(prev => ({ ...prev, stato: e.target.value }))}>
                  {STATI_TRATTATIVA_FIERA.map(stato => (
                    <option key={stato.value} value={stato.value}>{stato.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">1° follow-up</label>
                <input type="date" className="input" value={formData.dataFollowup1 || ''} onChange={(e) => handleFollowup1Change(e.target.value)} />
              </div>
              <div>
                <label className="label">2° follow-up</label>
                <input type="date" className="input" value={formData.dataFollowup2 || ''} onChange={(e) => setFormData(prev => ({ ...prev, dataFollowup2: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Note</label>
                <textarea className="input min-h-[100px]" value={formData.note || ''} onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setFormOpen(false); setEditing(null); setFormData(EMPTY_FORM) }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Annulla
              </button>
              <button onClick={handleSave} className="px-4 py-2 bg-yellow-400 rounded-lg font-semibold hover:bg-yellow-500">
                {editing ? 'Aggiorna Trattativa' : 'Crea Trattativa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
