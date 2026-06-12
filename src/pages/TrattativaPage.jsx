// src/pages/TrattativaPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Plus, Search, Edit, Trash2, List, LayoutGrid,
  ChevronDown, ChevronUp, ChevronsUpDown, Archive, ArrowRight, AlertCircle,
  TrendingUp, Clock, CheckCircle2, Handshake
} from 'lucide-react'
import TrattativaForm from '../components/TrattativaForm'
import DateRangeFilter from '../components/DateRangeFilter'
import {
  getAllTrattative,
  createTrattativa,
  updateTrattativa,
  updateStatoTrattativa,
  deleteTrattativa,
  getTrattativeStats,
  creaCollaborazioneDaTrattativa,
} from '../services/trattativaService'
import { getActiveAgents } from '../services/userService'
import { getAllCreators } from '../services/creatorService'
import { toast } from '../components/Toast'
import { confirm } from '../components/ConfirmModal'
import {
  STATI_TRATTATIVA,
  getStatoTrattativa,
  PRIORITA_OPTIONS,
} from '../constants/constants'
import { getAllBrands } from '../services/brandService'
import { useAuth } from '../contexts/AuthContext'
import { formatDate } from '../utils/date'
import { isDateInRange, isDateRangeDisabled } from '../utils/dateRange'

const STATI_CHIUSI = ['NESSUNA_RISPOSTA', 'CHIUSO_PERSO', 'COLLAB_GENERATA']
const PRIORITA_ORDER = { URGENTE: 0, ALTA: 1, NORMALE: 2, BASSA: 3 }
const STATI_CREATOR_SUGGERITI = [
  'RICERCA_COMPLETATA',
  'ONBOARDING',
  'PRIMO_CONTATTO',
  'FOLLOW_UP_1',
  'FOLLOW_UP_2',
  'RICONTATTO_FUTURO',
  'IN_TRATTATIVA',
]
const STATI_CREATOR_CONFERMATI = [
  'PREVENTIVO_INVIATO',
  'CONTRATTO_INVIATO',
  'CONTRATTO_FIRMATO',
  'COLLAB_GENERATA',
]

const mostraCreatorSuggeriti = (stato) => STATI_CREATOR_SUGGERITI.includes(stato)

const deveCopiareCreatorConfermati = (trattativa, nuovoStato) => (
  STATI_CREATOR_CONFERMATI.includes(nuovoStato)
  && (trattativa?.creatorSuggeriti || []).length > 0
  && (trattativa?.creatorConfermati || []).length === 0
)

// Campi da raccogliere per ogni cambio di stato
const STATO_FIELDS_CONFIG = {
  PRIMO_CONTATTO:    [{ key: 'dataContatto',      label: 'Data contatto',                required: true  }],
  FOLLOW_UP_1:       [{ key: 'dataFollowup1',      label: 'Data 1° follow-up',            required: true  }],
  FOLLOW_UP_2:       [{ key: 'dataFollowup2',      label: 'Data 2° follow-up',            required: true  }],
  RICONTATTO_FUTURO: [
    { key: 'dataRicontatto',    label: 'Data ricontatto previsto',  required: true  },
    { key: 'reminderRicontatto',label: 'Reminder promemoria',       required: false },
  ],
  IN_TRATTATIVA:     [{ key: 'dataCall',           label: 'Data call / incontro',         required: false }],
  PREVENTIVO_INVIATO:[{ key: 'dataPreventivo',     label: 'Data invio preventivo',        required: true  }],
  CONTRATTO_INVIATO: [{ key: 'dataPreventivo',     label: 'Data invio contratto',         required: false }],
}

const getTrattativaReferenceDate = (trattativa) => {
  switch (trattativa.stato) {
    case 'PRIMO_CONTATTO':
      return { label: 'Contatto', value: trattativa.dataContatto || trattativa.createdAt }
    case 'FOLLOW_UP_1':
      return { label: 'Follow-up 1', value: trattativa.dataFollowup1 || trattativa.dataContatto || trattativa.createdAt }
    case 'FOLLOW_UP_2':
      return { label: 'Follow-up 2', value: trattativa.dataFollowup2 || trattativa.dataFollowup1 || trattativa.dataContatto || trattativa.createdAt }
    case 'RICONTATTO_FUTURO':
      return { label: 'Ricontatto', value: trattativa.dataRicontatto || trattativa.reminderRicontatto || trattativa.createdAt }
    case 'TRATTATIVA':
      return { label: 'Call', value: trattativa.dataCall || trattativa.dataContatto || trattativa.createdAt }
    case 'PREVENTIVO_INVIATO':
    case 'CONTRATTO_INVIATO':
      return { label: 'Preventivo', value: trattativa.dataPreventivo || trattativa.dataCall || trattativa.createdAt }
    case 'CONTRATTO_FIRMATO':
    case 'COLLAB_GENERATA':
      return { label: 'Firma', value: trattativa.dataPreventivo || trattativa.dataCall || trattativa.createdAt }
    default:
      return { label: 'Creazione', value: trattativa.createdAt || trattativa.dataContatto }
  }
}

function StatoBadgeInline({ trattativa, onUpdate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const cfg = getStatoTrattativa(trattativa.stato)

  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleChange = async (nuovoStato) => {
    setOpen(false)
    await onUpdate(trattativa.id, nuovoStato)
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(value => !value)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:opacity-80 ${cfg.color}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 top-8 z-50 w-60 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {STATI_TRATTATIVA.map(stato => {
            const vaInArchivio = STATI_CHIUSI.includes(stato.value)
            return (
              <button
                key={stato.value}
                onClick={() => handleChange(stato.value)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors text-left ${
                  stato.value === trattativa.stato ? 'bg-gray-50 font-bold' : ''
                }`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stato.dot}`} />
                <span className="flex-1">{stato.label}</span>
                {vaInArchivio && (
                  <span className="text-gray-400 text-[10px] flex-shrink-0">→ Chiuse</span>
                )}
                {stato.value === trattativa.stato && <CheckCircle2 className="w-3 h-3 text-gray-400 flex-shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatoChangeModal({ pendingChange, onConfirm, onCancel }) {
  const today = new Date().toISOString().slice(0, 10)
  const { trattativaId, nuovoStato, trattativa } = pendingChange
  const stateFields = STATO_FIELDS_CONFIG[nuovoStato] || []
  const cfg = getStatoTrattativa(nuovoStato)

  const [fieldValues, setFieldValues] = useState(() => {
    const vals = {}
    stateFields.forEach(f => { vals[f.key] = trattativa[f.key] || today })
    return vals
  })

  const isValid = stateFields.filter(f => f.required).every(f => !!fieldValues[f.key])

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-1">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1 ${cfg.dot}`} />
            {cfg.label}
          </span>
          <h3 className="text-base font-bold text-gray-900">Dati richiesti per questa fase</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Inserisci i dati per <strong>{trattativa.brandNome}</strong> prima di confermare il passaggio.
        </p>

        <div className="space-y-3 mb-5">
          {stateFields.map(field => (
            <div key={field.key}>
              <label className="label">
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input
                type="date"
                className="input"
                value={fieldValues[field.key] || ''}
                onChange={e => setFieldValues(prev => ({ ...prev, [field.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            onClick={() => onConfirm(trattativaId, nuovoStato, fieldValues)}
            disabled={!isValid}
            className="px-4 py-2 bg-yellow-400 rounded-xl text-sm font-semibold hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Conferma passaggio
          </button>
        </div>
      </div>
    </div>
  )
}

function PrioritaBadge({ value }) {
  const cfg = PRIORITA_OPTIONS.find(priorita => priorita.value === value) || PRIORITA_OPTIONS[1]
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

function TrattativaRow({ trattativa, creators, onEdit, onDelete, onStatoChange, onCreaCollab }) {
  const isStatoSuggerito = mostraCreatorSuggeriti(trattativa.stato)
  const creatorNomi = (
    isStatoSuggerito
      ? (trattativa.creatorSuggeriti || [])
      : (trattativa.creatorConfermati || [])
  ).map(id => creators.find(creator => creator.id === id)?.nome).filter(Boolean)
  const referenceDate = getTrattativaReferenceDate(trattativa)

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/70 transition-colors group">
      <td className="py-3 px-4">
        <div className="font-semibold text-gray-900 text-sm">{trattativa.brandNome}</div>
        {trattativa.settore && <div className="text-xs text-gray-400">{trattativa.settore}</div>}
      </td>

      <td className="py-3 px-4">
        <div className="flex flex-wrap gap-1 items-center">
          <span className="text-xs text-gray-400 mr-1">{isStatoSuggerito ? 'Suggeriti:' : 'Scelti:'}</span>
          {creatorNomi.slice(0, 2).map(nome => (
            <span key={nome} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">{nome}</span>
          ))}
          {creatorNomi.length > 2 && <span className="text-xs text-gray-400">+{creatorNomi.length - 2}</span>}
          {creatorNomi.length === 0 && <span className="text-xs text-gray-300">—</span>}
        </div>
      </td>

      <td className="py-3 px-4">
        <div className="flex flex-wrap gap-1">
          {(trattativa.assegnatario || []).length > 0
            ? (trattativa.assegnatario || []).map(assegnatario => (
                <span key={assegnatario} className="px-2 py-0.5 bg-yellow-50 text-yellow-800 rounded-full text-xs font-medium">{assegnatario}</span>
              ))
            : <span className="text-gray-300 text-sm">—</span>}
        </div>
      </td>

      <td className="py-3 px-4">
        <div className="flex flex-col items-start gap-1">
          <StatoBadgeInline trattativa={trattativa} onUpdate={onStatoChange} />
          {trattativa.stato === 'RICONTATTO_FUTURO' && trattativa.dataRicontatto && (() => {
            const giorni = Math.ceil((new Date(trattativa.dataRicontatto) - new Date()) / 86400000)
            if (giorni <= 10 && giorni >= 0) {
              return (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold animate-pulse">
                  Scade tra {giorni}gg
                </span>
              )
            }
            if (giorni < 0) {
              return (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                  Scaduto
                </span>
              )
            }
            return null
          })()}
        </div>
      </td>

      <td className="py-3 px-4">
        <PrioritaBadge value={trattativa.priorita} />
      </td>

      <td className="py-3 px-4">
        {referenceDate.value ? (
          <>
            <div className="text-sm text-gray-700">{formatDate(referenceDate.value)}</div>
            <div className="text-[11px] uppercase tracking-wide text-gray-400 mt-0.5">{referenceDate.label}</div>
          </>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>

      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {trattativa.stato === 'CONTRATTO_FIRMATO' && (trattativa.creatorConfermati?.length || 0) > 0 && (
            <button
              onClick={() => onCreaCollab(trattativa)}
              className="text-xs px-2 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg transition-colors"
            >
              Crea Collaborazione
            </button>
          )}
          <button
            onClick={() => onEdit(trattativa)}
            className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
            title="Modifica"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(trattativa.id)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Elimina"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

function KanbanCard({ trattativa, creators, onEdit, onDelete, onCreaCollab, isDragging }) {
  const isStatoSuggerito = mostraCreatorSuggeriti(trattativa.stato)
  const creatorNomi = (
    isStatoSuggerito
      ? (trattativa.creatorSuggeriti || [])
      : (trattativa.creatorConfermati || [])
  ).map(id => creators.find(creator => creator.id === id)?.nome).filter(Boolean)

  return (
    <div
      draggable
      className={`bg-white border rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
        isDragging ? 'opacity-50 shadow-lg border-yellow-400' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-semibold text-sm text-gray-900 break-words">{trattativa.brandNome}</span>
        <PrioritaBadge value={trattativa.priorita} />
      </div>
      {trattativa.settore && <p className="text-xs text-gray-400 mb-2">{trattativa.settore}</p>}
      {creatorNomi.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {creatorNomi.slice(0, 2).map(nome => (
            <span key={nome} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">{nome}</span>
          ))}
          {creatorNomi.length > 2 && <span className="text-xs text-gray-400">+{creatorNomi.length - 2}</span>}
        </div>
      )}
      {trattativa.ima && <p className="text-xs text-gray-400 mb-3">IMA: {trattativa.ima}</p>}
      <div className="flex gap-1.5">
        {trattativa.stato === 'CONTRATTO_FIRMATO' && (trattativa.creatorConfermati?.length || 0) > 0 && (
          <button
            onClick={() => onCreaCollab(trattativa)}
            className="text-xs px-2 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg transition-colors"
          >
            Crea Collaborazione
          </button>
        )}
        <button
          onClick={() => onEdit(trattativa)}
          className="flex-1 text-xs px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-center"
        >
          <Edit className="w-3 h-3 inline mr-1" />Modifica
        </button>
        <button
          onClick={() => onDelete(trattativa.id)}
          className="text-xs px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

export default function TrattativaPage() {
  const [trattative, setTrattative] = useState([])
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStato, setFilterStato] = useState('ALL')
  const [filterAssegnatario, setFilterAssegnatario] = useState('ALL')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [mostraArchiviati, setMostraArchiviati] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [agenti, setAgenti] = useState([])
  const [creators, setCreators] = useState([])
  const [draggedId, setDraggedId] = useState(null)
  const [brands, setBrands] = useState([])
  const [sortField, setSortField] = useState('priorita')
  const [sortDir, setSortDir] = useState('asc')
  const [pendingStatoChange, setPendingStatoChange] = useState(null)
  const { userProfile } = useAuth()
  const isAgent = userProfile?.role === 'AGENT'

  useEffect(() => {
    if (isAgent && userProfile?.agenteNome) {
      Promise.resolve().then(() => setFilterAssegnatario(userProfile.agenteNome))
    }
  }, [isAgent, userProfile])

  const loadBrands = useCallback(async () => {
    const { data } = await getAllBrands()
    setBrands(data || [])
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    const [trattativeRes, statsRes, agentiRes, creatorsRes] = await Promise.all([
      getAllTrattative(),
      getTrattativeStats(),
      getActiveAgents(),
      getAllCreators(),
    ])

    await loadBrands()
    setTrattative(trattativeRes.data || [])
    if (statsRes.data) setStats(statsRes.data)
    setAgenti(agentiRes.data || [])
    setCreators(creatorsRes.data || [])
    setLoading(false)
  }, [loadBrands])

  useEffect(() => {
    Promise.resolve().then(loadData)
  }, [loadData])

  const handleSave = async (data) => {
    setLoading(true)
    const action = selected ? updateTrattativa(selected.id, data) : createTrattativa(data)
    const { error } = await action
    if (error) {
      toast.error('Errore durante il salvataggio')
    } else {
      toast.success(selected ? 'Trattativa aggiornata' : 'Trattativa creata')
    }
    await loadData()
    setView('list')
    setSelected(null)
    setLoading(false)
  }

  const handleDelete = async (id) => {
    const ok = await confirm('La trattativa verrà eliminata definitivamente.', {
      title: 'Eliminare questa trattativa?',
      confirmLabel: 'Elimina',
    })
    if (!ok) return

    setLoading(true)
    await deleteTrattativa(id)
    toast.success('Trattativa eliminata')
    await loadData()
    setLoading(false)
  }

  const handleStatoChange = (id, nuovoStato) => {
    const fields = STATO_FIELDS_CONFIG[nuovoStato]
    if (fields) {
      const trattativa = trattative.find(t => t.id === id)
      setPendingStatoChange({ trattativaId: id, nuovoStato, trattativa })
      return
    }
    // Nessun campo richiesto: aggiorna direttamente
    doStatoChange(id, nuovoStato)
  }

  const doStatoChange = async (id, nuovoStato, dateFields = {}) => {
    const trattativa = trattative.find(t => t.id === id)
    const hasDateFields = Object.keys(dateFields).length > 0
    const shouldSeedCreatorConfermati = deveCopiareCreatorConfermati(trattativa, nuovoStato)
    const needsFullUpdate = hasDateFields || shouldSeedCreatorConfermati
    const nextTrattativa = {
      ...trattativa,
      stato: nuovoStato,
      ...dateFields,
      ...(shouldSeedCreatorConfermati ? { creatorConfermati: trattativa.creatorSuggeriti } : {}),
    }
    const { error } = needsFullUpdate
      ? await updateTrattativa(id, nextTrattativa)
      : await updateStatoTrattativa(id, nuovoStato)
    if (error) {
      toast.error('Errore aggiornamento stato')
      return
    }
    const cfg = getStatoTrattativa(nuovoStato)
    toast.success(`Stato → ${cfg.label}`)
    if (needsFullUpdate) {
      await loadData()
    } else {
      setTrattative(prev => prev.map(t => (t.id === id ? { ...t, stato: nuovoStato } : t)))
    }
  }

  const handleStatoChangeConfirm = async (id, nuovoStato, dateFields) => {
    setPendingStatoChange(null)
    await doStatoChange(id, nuovoStato, dateFields)
  }

  const handleCreaCollab = async (trattativa) => {
    const ok = await confirm(
      `Verranno create una o più collaborazioni per "${trattativa.brandNome}" usando i creator confermati della trattativa.`,
      { title: 'Crea Collaborazioni', confirmLabel: 'Crea', dangerous: false }
    )
    if (!ok) return

    setLoading(true)
    const { data, error } = await creaCollaborazioneDaTrattativa(trattativa.id)
    if (error) {
      toast.error('Errore durante la creazione della collaborazione')
    } else {
      const count = Array.isArray(data) ? data.length : 1
      toast.success(`${count} collaborazione/i create — vai su Collaborazioni per completarle`)
      await handleStatoChange(trattativa.id, 'COLLAB_GENERATA')
    }
    setLoading(false)
  }

  const handleDragStart = (id) => setDraggedId(id)

  const handleDrop = async (nuovoStato) => {
    if (!draggedId) return
    const dragged = trattative.find(trattativa => trattativa.id === draggedId)
    if (dragged && dragged.stato !== nuovoStato) {
      await handleStatoChange(draggedId, nuovoStato)
    }
    setDraggedId(null)
  }

  const filtered = trattative.filter(trattativa => {
    if (mostraArchiviati) {
      if (!STATI_CHIUSI.includes(trattativa.stato)) return false
    } else if (STATI_CHIUSI.includes(trattativa.stato)) {
      return false
    }

    const matchSearch =
      trattativa.brandNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trattativa.settore?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trattativa.ima?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStato = filterStato === 'ALL' || trattativa.stato === filterStato
    const matchAssegnatario = filterAssegnatario === 'ALL' || (trattativa.assegnatario || []).includes(filterAssegnatario)
    const matchDate = isDateRangeDisabled(dateRange)
      ? true
      : isDateInRange(getTrattativaReferenceDate(trattativa).value, dateRange.start, dateRange.end)

    return matchSearch && matchStato && matchAssegnatario && matchDate
  })

  const handleSort = (field) => {
    if (sortField === field) setSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sortedFiltered = [...filtered].sort((a, b) => {
    let comparison = 0
    if (sortField === 'priorita') {
      comparison = (PRIORITA_ORDER[a.priorita] ?? 2) - (PRIORITA_ORDER[b.priorita] ?? 2)
    } else if (sortField === 'brand') {
      comparison = (a.brandNome || '').localeCompare(b.brandNome || '')
    } else if (sortField === 'stato') {
      comparison = (a.stato || '').localeCompare(b.stato || '')
    } else if (sortField === 'data') {
      comparison = String(getTrattativaReferenceDate(a).value || '').localeCompare(String(getTrattativaReferenceDate(b).value || ''))
    } else if (sortField === 'assegnatario') {
      comparison = ((a.assegnatario || [])[0] || '').localeCompare((b.assegnatario || [])[0] || '')
    }
    return sortDir === 'asc' ? comparison : -comparison
  })

  if (view === 'form') {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => { setView('list'); setSelected(null) }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5 rotate-180 text-gray-500" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {selected ? `Modifica — ${selected.brandNome}` : 'Nuova Trattativa'}
          </h1>
        </div>
        <div className="card">
          <TrattativaForm
            trattativa={selected}
            onSave={handleSave}
            onCancel={() => { setView('list'); setSelected(null) }}
            brands={brands}
          />
        </div>
      </div>
    )
  }

  const StatsBar = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[
        { label: 'Attive', value: stats.attive || 0, icon: TrendingUp, color: 'bg-blue-50 text-blue-700' },
        { label: 'In Trattativa', value: stats.inTrattativa || 0, icon: Handshake, color: 'bg-amber-50 text-amber-700' },
        { label: 'Preventivo Inviato', value: stats.preventivoInviato || 0, icon: Clock, color: 'bg-lime-50 text-lime-700' },
        { label: 'Contratti Firmati', value: stats.contrattiFirmati || 0, icon: CheckCircle2, color: 'bg-green-50 text-green-700' },
        {
          label: 'Ricontatto Imminente',
          value: trattative.filter(trattativa => {
            if (trattativa.stato !== 'RICONTATTO_FUTURO' || !trattativa.dataRicontatto) return false
            const giorni = Math.ceil((new Date(trattativa.dataRicontatto) - new Date()) / 86400000)
            return giorni >= 0 && giorni <= 10
          }).length,
          icon: Clock,
          color: 'bg-orange-50 text-orange-700',
        },
      ].map(stat => (
        <div key={stat.label} className={`card flex items-center gap-3 py-4 ${stat.color}`}>
          <stat.icon className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="text-2xl font-bold leading-none">{stat.value}</p>
            <p className="text-xs mt-0.5 opacity-75">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  )

  const Filters = () => (
    <div className="card mb-4">
      <div className="flex flex-col gap-3">
        <DateRangeFilter
          value={dateRange}
          onChange={setDateRange}
          label="Periodo trattative"
          hint="Default: dal primo giorno del mese al primo del mese successivo. La data usata è quella più rilevante per la fase corrente."
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <input
              className="input pl-11"
              placeholder="Cerca brand, settore, IMA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="input sm:w-52" value={filterStato} onChange={(e) => setFilterStato(e.target.value)}>
            <option value="ALL">Tutti gli stati</option>
            {STATI_TRATTATIVA.map(stato => (
              <option key={stato.value} value={stato.value}>{stato.label}</option>
            ))}
          </select>
          <select className="input sm:w-44" value={filterAssegnatario} onChange={(e) => setFilterAssegnatario(e.target.value)}>
            <option value="ALL">Tutti gli assegnatari</option>
            {agenti.map(agente => (
              <option key={agente.id} value={agente.agenteNome}>{agente.nomeCompleto}</option>
            ))}
          </select>
          <button
            onClick={() => { setMostraArchiviati(value => !value); setFilterStato('ALL') }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors whitespace-nowrap ${
              mostraArchiviati
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Archive className="w-4 h-4" />
            {mostraArchiviati ? 'Torna alle attive' : 'Trattative Chiuse'}
          </button>
        </div>
      </div>
    </div>
  )

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 opacity-40" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-yellow-500" />
      : <ChevronDown className="w-3 h-3 text-yellow-500" />
  }

  const SortTh = ({ field, children }) => (
    <th
      className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-800 transition-colors"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">{children}<SortIcon field={field} /></span>
    </th>
  )

  const ListView = () => (
    <div className="card overflow-visible p-0">
      {sortedFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Nessuna trattativa trovata</p>
          <p className="text-gray-400 text-sm mt-1">
            {searchTerm || filterStato !== 'ALL' ? 'Prova a modificare i filtri' : 'Crea la prima trattativa'}
          </p>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <SortTh field="brand">Brand</SortTh>
              <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Creator</th>
              <SortTh field="assegnatario">Assegnatario</SortTh>
              <SortTh field="stato">Stato</SortTh>
              <SortTh field="priorita">Priorità</SortTh>
              <SortTh field="data">Data</SortTh>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {sortedFiltered.map(trattativa => (
              <TrattativaRow
                key={trattativa.id}
                trattativa={trattativa}
                creators={creators}
                onEdit={(value) => { setSelected(value); setView('form') }}
                onDelete={handleDelete}
                onStatoChange={handleStatoChange}
                onCreaCollab={handleCreaCollab}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  const KanbanView = () => {
    const statiVisibili = mostraArchiviati
      ? STATI_TRATTATIVA.filter(stato => STATI_CHIUSI.includes(stato.value))
      : STATI_TRATTATIVA.filter(stato => !STATI_CHIUSI.includes(stato.value))

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {statiVisibili.map(stato => {
          const cards = filtered
            .filter(trattativa => trattativa.stato === stato.value)
            .sort((a, b) => (PRIORITA_ORDER[a.priorita] ?? 2) - (PRIORITA_ORDER[b.priorita] ?? 2))
          const isOver = draggedId && trattative.find(trattativa => trattativa.id === draggedId)?.stato !== stato.value

          return (
            <div
              key={stato.value}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(stato.value)}
            >
              <div className={`rounded-t-xl px-3 py-2.5 flex items-center justify-between ${stato.color}`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stato.dot}`} />
                  <span className="text-xs font-bold truncate">{stato.label}</span>
                </div>
                <span className="text-xs font-bold opacity-60 ml-1 flex-shrink-0">{cards.length}</span>
              </div>
              <div className={`rounded-b-xl bg-gray-50 border border-t-0 border-gray-200 p-2 space-y-2 overflow-y-auto max-h-[480px] min-h-[80px] transition-colors ${
                isOver ? 'bg-yellow-50 border-yellow-300' : ''
              }`}>
                {cards.map(trattativa => (
                  <div key={trattativa.id} draggable onDragStart={() => handleDragStart(trattativa.id)}>
                    <KanbanCard
                      trattativa={trattativa}
                      creators={creators}
                      onEdit={(value) => { setSelected(value); setView('form') }}
                      onDelete={handleDelete}
                      onCreaCollab={handleCreaCollab}
                      isDragging={draggedId === trattativa.id}
                    />
                  </div>
                ))}
                {cards.length === 0 && (
                  <div className="flex items-center justify-center h-16 text-gray-300 text-xs">
                    {isOver ? '↓ Rilascia qui' : 'Vuoto'}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {mostraArchiviati ? 'Trattative Chiuse' : 'Trattative'}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {mostraArchiviati
              ? `${filtered.length} chiuse nel periodo selezionato`
              : `${filtered.length} visibili nel periodo selezionato · ${stats.attive || 0} attive totali`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={`p-2.5 transition-colors ${view === 'list' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              title="Vista lista"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`p-2.5 transition-colors ${view === 'kanban' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              title="Vista kanban"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          {!mostraArchiviati && (
            <button
              onClick={() => { setSelected(null); setView('form') }}
              className="flex items-center gap-2 px-4 py-2.5 bg-yellow-400 text-gray-900 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nuova Trattativa
            </button>
          )}
        </div>
      </div>

      {StatsBar()}
      {Filters()}

      {view === 'list' && ListView()}
      {view === 'kanban' && KanbanView()}

      {pendingStatoChange && (
        <StatoChangeModal
          pendingChange={pendingStatoChange}
          onConfirm={handleStatoChangeConfirm}
          onCancel={() => setPendingStatoChange(null)}
        />
      )}
    </div>
  )
}
