import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, CalendarDays, Edit, Plus, Search, Trash2, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { createCircuito, deleteCircuito, getAllCircuiti, updateCircuito } from '../services/circuitiService'
import { createFieraDb, deleteFieraDb, getAllFiereDb, updateFieraDb } from '../services/fieraDbService'
import { addMonths, getLatestDateSet, normalizeDateSets } from '../services/fieraDbService'
import {
  createTipologiaEvento,
  deleteTipologiaEvento,
  getAllTipologieEvento,
  updateTipologiaEvento,
} from '../services/tipologieEventoService'
import { createTrattativaFieraFromFiera } from '../services/trattativaFieraService'
import { formatDate } from '../utils/date'
import { confirm } from '../components/ConfirmModal'
import { toast } from '../components/Toast'
import NotesLogField from '../components/NotesLogField'

const emptyDateSet = () => ({ dataInizio: '', dataFine: '', prossimoContatto: '' })

const EMPTY_FIERA_FORM = {
  nome: '',
  tipo: '',
  circuitoId: '',
  location: '',
  citta: '',
  referente: '',
  contatto: '',
  telefono: '',
  sitoWeb: '',
  dateSets: [emptyDateSet()],
  note: '',
  noteLog: [],
}

const EMPTY_CIRCUITO_FORM = { nome: '', note: '' }
const EMPTY_TIPOLOGIA_FORM = { nome: '', note: '' }

const todayLocal = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const monthKey = (dateString) => (dateString ? dateString.slice(0, 7) : '')

const formatMonth = (key) => {
  if (!key) return 'Senza mese'
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric',
  })
}

const isPastOrToday = (dateString) => Boolean(dateString && dateString <= todayLocal())

const getDateRangeLabel = (dateSet) => {
  if (!dateSet?.dataInizio && !dateSet?.dataFine) return '-'
  if (!dateSet?.dataFine || dateSet.dataFine === dateSet.dataInizio) return formatDate(dateSet.dataInizio)
  return `${formatDate(dateSet.dataInizio)} -> ${formatDate(dateSet.dataFine)}`
}

const getFieraLatestDateSet = (fiera) => (
  getLatestDateSet(fiera.dateSets) || {
    dataInizio: fiera.dataInizio || '',
    dataFine: fiera.dataFine || '',
    prossimoContatto: fiera.prossimoContatto || addMonths(fiera.dataInizio, 6) || '',
  }
)

const canStartTrattativa = (fiera) => isPastOrToday(getFieraLatestDateSet(fiera).prossimoContatto)

function MonthContactsModal({ fiere, circuitiMap, onClose, onStartTrattativa }) {
  const currentMonth = monthKey(todayLocal())
  const monthFiere = fiere
    .map(fiera => ({ fiera, dateSet: getFieraLatestDateSet(fiera) }))
    .filter(item => monthKey(item.dateSet.prossimoContatto) === currentMonth)
    .sort((left, right) => (left.dateSet.prossimoContatto || '').localeCompare(right.dateSet.prossimoContatto || ''))

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Prossimi contatti per il mese</h3>
            <p className="text-sm text-gray-500 mt-1">
              Fiere da ricontattare in {formatMonth(currentMonth)}, calcolate dall'ultima data inizio evento + 6 mesi.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {monthFiere.map(({ fiera, dateSet }) => (
            <div key={fiera.id} className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="font-semibold text-gray-900">{fiera.nome}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {fiera.citta || '-'} {fiera.location ? `- ${fiera.location}` : ''} {circuitiMap[fiera.circuitoId] ? `- ${circuitiMap[fiera.circuitoId]}` : ''}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Ultimo evento: <strong>{getDateRangeLabel(dateSet)}</strong>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-2.5 py-1 bg-yellow-50 text-yellow-800 rounded-full text-xs font-semibold">
                  Contatto: {formatDate(dateSet.prossimoContatto)}
                </span>
                {canStartTrattativa(fiera) ? (
                  <button
                    onClick={() => onStartTrattativa(fiera)}
                    className="text-xs px-3 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 font-semibold"
                  >
                    <Plus className="w-3 h-3 inline" /> Trattativa
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">Disponibile dal {formatDate(dateSet.prossimoContatto)}</span>
                )}
              </div>
            </div>
          ))}

          {monthFiere.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Nessuna fiera da contattare nel mese corrente.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FiereDbPage() {
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  const [fiere, setFiere] = useState([])
  const [circuiti, setCircuiti] = useState([])
  const [tipologie, setTipologie] = useState([])
  const [tipologieMissingTable, setTipologieMissingTable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('lista')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortMode, setSortMode] = useState('dateDesc')
  const [contactsModalOpen, setContactsModalOpen] = useState(false)
  const [fieraModalOpen, setFieraModalOpen] = useState(false)
  const [editingFiera, setEditingFiera] = useState(null)
  const [fieraForm, setFieraForm] = useState(EMPTY_FIERA_FORM)
  const [circuitoModalOpen, setCircuitoModalOpen] = useState(false)
  const [editingCircuito, setEditingCircuito] = useState(null)
  const [circuitoForm, setCircuitoForm] = useState(EMPTY_CIRCUITO_FORM)
  const [tipologiaModalOpen, setTipologiaModalOpen] = useState(false)
  const [editingTipologia, setEditingTipologia] = useState(null)
  const [tipologiaForm, setTipologiaForm] = useState(EMPTY_TIPOLOGIA_FORM)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [fiereRes, circuitiRes, tipologieRes] = await Promise.all([
      getAllFiereDb(),
      getAllCircuiti(),
      getAllTipologieEvento(),
    ])
    setFiere(fiereRes.data || [])
    setCircuiti(circuitiRes.data || [])
    setTipologie(tipologieRes.data || [])
    setTipologieMissingTable(Boolean(tipologieRes.missingTable))
    setLoading(false)
  }, [])

  useEffect(() => {
    Promise.resolve().then(loadData)
  }, [loadData])

  const circuitiMap = useMemo(
    () => Object.fromEntries((circuiti || []).map(circuito => [circuito.id, circuito.nome])),
    [circuiti]
  )

  const contactsThisMonth = useMemo(() => {
    const currentMonth = monthKey(todayLocal())
    return fiere.filter(fiera => monthKey(getFieraLatestDateSet(fiera).prossimoContatto) === currentMonth)
  }, [fiere])

  const filteredFiere = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase()
    const filtered = fiere.filter(fiera => {
      if (!needle) return true
      return [
        fiera.nome,
        fiera.tipo,
        fiera.location,
        fiera.citta,
        fiera.referente,
        fiera.contatto,
        circuitiMap[fiera.circuitoId],
      ].some(value => String(value || '').toLowerCase().includes(needle))
    })

    return [...filtered].sort((left, right) => {
      if (sortMode === 'alpha') return (left.nome || '').localeCompare(right.nome || '')

      const leftDate = getFieraLatestDateSet(left).dataInizio || ''
      const rightDate = getFieraLatestDateSet(right).dataInizio || ''
      return sortMode === 'dateAsc'
        ? leftDate.localeCompare(rightDate)
        : rightDate.localeCompare(leftDate)
    })
  }, [circuitiMap, fiere, searchTerm, sortMode])

  const eventMonthGroups = useMemo(() => {
    const groups = {}

    filteredFiere.forEach(fiera => {
      normalizeDateSets(fiera.dateSets, fiera).forEach(dateSet => {
        const key = monthKey(dateSet.dataInizio) || 'senza-data'
        if (!groups[key]) groups[key] = []
        groups[key].push({ fiera, dateSet })
      })
    })

    Object.values(groups).forEach(items => {
      items.sort((left, right) => (left.dateSet.dataInizio || '').localeCompare(right.dateSet.dataInizio || ''))
    })

    return Object.entries(groups).sort(([left], [right]) => right.localeCompare(left))
  }, [filteredFiere])

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
      noteLog: fiera.noteLog || [],
      dateSets: normalizeDateSets(fiera.dateSets, fiera).length > 0
        ? normalizeDateSets(fiera.dateSets, fiera)
        : [emptyDateSet()],
    })
    setFieraModalOpen(true)
  }

  const closeFieraModal = () => {
    setFieraModalOpen(false)
    setEditingFiera(null)
    setFieraForm(EMPTY_FIERA_FORM)
  }

  const updateDateSet = (index, field, value) => {
    setFieraForm(form => ({
      ...form,
      dateSets: form.dateSets.map((dateSet, currentIndex) => {
        if (currentIndex !== index) return dateSet
        const next = { ...dateSet, [field]: value }
        if (field === 'dataInizio') next.prossimoContatto = addMonths(value, 6) || ''
        return next
      }),
    }))
  }

  const addDateSetRow = () => {
    setFieraForm(form => ({ ...form, dateSets: [...form.dateSets, emptyDateSet()] }))
  }

  const removeDateSetRow = (index) => {
    setFieraForm(form => ({
      ...form,
      dateSets: form.dateSets.length === 1
        ? [emptyDateSet()]
        : form.dateSets.filter((_, currentIndex) => currentIndex !== index),
    }))
  }

  const handleSaveFiera = async () => {
    if (!fieraForm.nome.trim()) {
      toast.error('Il nome della fiera e obbligatorio')
      return
    }

    const normalizedDateSets = normalizeDateSets(fieraForm.dateSets)
    const payload = { ...fieraForm, dateSets: normalizedDateSets }
    const action = editingFiera
      ? updateFieraDb(editingFiera.id, payload)
      : createFieraDb(payload)

    const { error, reused } = await action
    if (error) {
      toast.error('Errore durante il salvataggio della scheda')
      return
    }

    closeFieraModal()
    await loadData()
    toast.success(!editingFiera && reused ? 'Scheda gia presente: aggiornata quella esistente.' : editingFiera ? 'Scheda fiera aggiornata' : 'Fiera aggiunta al database')
  }

  const handleDeleteFiera = async (id) => {
    const ok = await confirm('Rimuovere questa fiera dal database?', { title: 'Elimina fiera', confirmLabel: 'Elimina' })
    if (!ok) return

    const { error } = await deleteFieraDb(id)
    if (error) {
      toast.error('Errore durante l eliminazione')
      return
    }

    toast.success('Scheda fiera eliminata')
    loadData()
  }

  const handleStartTrattativa = async (fiera) => {
    const latestDateSet = getFieraLatestDateSet(fiera)
    const payload = {
      ...fiera,
      dataInizio: latestDateSet.dataInizio,
      dataFine: latestDateSet.dataFine,
      prossimoContatto: latestDateSet.prossimoContatto,
    }
    const { error, reused } = await createTrattativaFieraFromFiera(payload, userProfile?.agenteNome)
    if (error) {
      toast.error('Errore creando la trattativa fiera')
      return
    }

    toast.success(reused ? 'Esiste gia una trattativa aperta per questa fiera.' : 'Trattativa fiera creata.')
    navigate('/trattative-fiere')
  }

  const openCreateCircuitoModal = () => {
    setEditingCircuito(null)
    setCircuitoForm(EMPTY_CIRCUITO_FORM)
    setCircuitoModalOpen(true)
  }

  const openEditCircuitoModal = (circuito) => {
    setEditingCircuito(circuito)
    setCircuitoForm({ nome: circuito.nome || '', note: circuito.note || '' })
    setCircuitoModalOpen(true)
  }

  const handleSaveCircuito = async () => {
    if (!circuitoForm.nome.trim()) {
      toast.error('Il nome del circuito e obbligatorio')
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

  const openCreateTipologiaModal = () => {
    setEditingTipologia(null)
    setTipologiaForm(EMPTY_TIPOLOGIA_FORM)
    setTipologiaModalOpen(true)
  }

  const openEditTipologiaModal = (tipologia) => {
    if (tipologia.readonly) return
    setEditingTipologia(tipologia)
    setTipologiaForm({ nome: tipologia.nome || '', note: tipologia.note || '' })
    setTipologiaModalOpen(true)
  }

  const handleSaveTipologia = async () => {
    if (!tipologiaForm.nome.trim()) {
      toast.error('Il nome della tipologia e obbligatorio')
      return
    }

    const action = editingTipologia
      ? updateTipologiaEvento(editingTipologia.id, tipologiaForm)
      : createTipologiaEvento(tipologiaForm)
    const { error } = await action
    if (error) {
      toast.error('Errore salvando la tipologia. Verifica che la tabella tipologie_eventi esista in Supabase.')
      return
    }

    setTipologiaModalOpen(false)
    setEditingTipologia(null)
    setTipologiaForm(EMPTY_TIPOLOGIA_FORM)
    await loadData()
    toast.success(editingTipologia ? 'Tipologia aggiornata' : 'Tipologia creata')
  }

  const handleDeleteTipologia = async (tipologia) => {
    if (tipologia.readonly) return
    const ok = await confirm('Eliminare questa tipologia evento?', { title: 'Elimina tipologia', confirmLabel: 'Elimina' })
    if (!ok) return

    const { error } = await deleteTipologiaEvento(tipologia.id)
    if (error) {
      toast.error('Errore eliminando la tipologia')
      return
    }

    await loadData()
    toast.success('Tipologia eliminata')
  }

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div></div>
  }

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">DB Fiere & Eventi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Database master delle fiere: anagrafica, storico date evento e contatti utili per aprire le Trattative Fiere.
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
            onClick={() => setTab('tipologie')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg font-semibold hover:bg-gray-50"
          >
            Gestisci tipologie
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
          <p className="text-2xl font-bold text-yellow-600">{contactsThisMonth.length}</p>
          <p className="text-sm text-gray-500">Contatti nel mese</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-900">{tipologie.length}</p>
          <p className="text-sm text-gray-500">Tipologie disponibili</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'lista', label: 'Database Fiere' },
          { key: 'mesi-evento', label: 'Mesi evento' },
          { key: 'tipologie', label: 'Tipologie' },
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

      {(tab === 'lista' || tab === 'mesi-evento') && (
        <div className="card mb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className="input pl-9"
                placeholder="Cerca fiera, regione, citta, circuito, tipologia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select className="input w-auto" value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
                <option value="dateDesc">Data: piu recente</option>
                <option value="dateAsc">Data: piu vecchia</option>
                <option value="alpha">Nome: A-Z</option>
              </select>
              <button
                onClick={() => setContactsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-900 rounded-lg font-semibold hover:bg-yellow-200"
              >
                <CalendarDays className="w-4 h-4" />
                Prossimi contatti per il mese
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'lista' && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-sm">
                <th className="text-left py-2 pr-4 font-semibold">Nome</th>
                <th className="text-left py-2 pr-4 font-semibold">Regione</th>
                <th className="text-left py-2 pr-4 font-semibold">Circuito</th>
                <th className="text-left py-2 pr-4 font-semibold">Data evento</th>
                <th className="text-left py-2 pr-4 font-semibold">Tipologia</th>
                <th className="text-left py-2 pr-4 font-semibold">Referente</th>
                <th className="text-left py-2 pr-4 font-semibold">Contatto</th>
                <th className="text-right py-2 font-semibold">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiere.map(fiera => {
                const latestDateSet = getFieraLatestDateSet(fiera)
                return (
                  <tr key={fiera.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-4">
                      <div className="font-medium">{fiera.nome}</div>
                      {fiera.citta && <div className="text-xs text-gray-400">{fiera.citta}</div>}
                    </td>
                    <td className="py-2 pr-4 text-sm text-gray-600">{fiera.location || '-'}</td>
                    <td className="py-2 pr-4 text-sm text-gray-600">{circuitiMap[fiera.circuitoId] || '-'}</td>
                    <td className="py-2 pr-4 text-sm">
                      <div>{getDateRangeLabel(latestDateSet)}</div>
                      {(fiera.dateSets || []).length > 1 && (
                        <div className="text-[11px] text-gray-400">{fiera.dateSets.length} set date censiti</div>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-sm text-gray-600">{fiera.tipo || '-'}</td>
                    <td className="py-2 pr-4 text-sm text-gray-600">{fiera.referente || '-'}</td>
                    <td className="py-2 pr-4 text-sm text-gray-600">{fiera.contatto || '-'}</td>
                    <td className="py-2 text-right">
                      <div className="flex gap-1 justify-end">
                        {canStartTrattativa(fiera) && (
                          <button
                            onClick={() => handleStartTrattativa(fiera)}
                            className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 font-medium"
                            title="Apri la trattativa fiera a partire da questa scheda"
                          >
                            <Plus className="w-3 h-3 inline" /> Trattativa
                          </button>
                        )}
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
              {filteredFiere.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>Nessuna fiera trovata.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'mesi-evento' && (
        <div className="space-y-6">
          {eventMonthGroups.map(([key, items]) => (
            <div key={key} className="card">
              <h3 className="font-bold text-gray-900 mb-3 capitalize">{formatMonth(key)}</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {items.map(({ fiera, dateSet }, index) => (
                  <div key={`${fiera.id}-${index}`} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                    <div className="font-semibold text-gray-900">{fiera.nome}</div>
                    <div className="text-sm text-gray-600 mt-1">{getDateRangeLabel(dateSet)}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {fiera.tipo || 'Tipologia non definita'} {fiera.citta ? `- ${fiera.citta}` : ''} {circuitiMap[fiera.circuitoId] ? `- ${circuitiMap[fiera.circuitoId]}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {eventMonthGroups.length === 0 && (
            <div className="card text-center py-10 text-gray-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Nessuna fiera da raggruppare.
            </div>
          )}
        </div>
      )}

      {tab === 'tipologie' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Tipologie evento censite</h3>
              <p className="text-sm text-gray-500">Usate nelle schede DB Fiere, nelle Trattative Fiere e negli Eventi.</p>
              {tipologieMissingTable && (
                <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mt-2">
                  Tabella tipologie_eventi non trovata: sono visibili le tipologie statiche, ma per crearne nuove serve applicare la migration.
                </p>
              )}
            </div>
            <button
              onClick={openCreateTipologiaModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500"
            >
              <Plus className="w-4 h-4" />
              Nuova tipologia
            </button>
          </div>

          <div className="space-y-2">
            {tipologie.map(tipologia => (
              <div key={tipologia.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
                <div>
                  <div className="font-medium text-gray-900">{tipologia.nome}</div>
                  {tipologia.readonly && <div className="text-xs text-gray-400 mt-0.5">Tipologia legacy</div>}
                  {tipologia.note && <div className="text-xs text-gray-400 mt-0.5">{tipologia.note}</div>}
                </div>
                {!tipologia.readonly && (
                  <div className="flex gap-1">
                    <button onClick={() => openEditTipologiaModal(tipologia)} className="text-yellow-600 hover:text-yellow-800">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteTipologia(tipologia)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
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

      {contactsModalOpen && (
        <MonthContactsModal
          fiere={fiere}
          circuitiMap={circuitiMap}
          onClose={() => setContactsModalOpen(false)}
          onStartTrattativa={handleStartTrattativa}
        />
      )}

      {fieraModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold mb-1">{editingFiera ? `Modifica - ${editingFiera.nome}` : 'Nuova fiera / evento'}</h3>
            <p className="text-sm text-gray-500 mb-4">
              Censisci anagrafica e storico date. Il prossimo contatto viene calcolato a 6 mesi dalla data inizio evento.
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
                  {tipologie.map(tipologia => (
                    <option key={tipologia.id} value={tipologia.nome}>{tipologia.nome}</option>
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
                <label className="label">Citta</label>
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

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Date evento</label>
                  <button
                    type="button"
                    onClick={addDateSetRow}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-900 rounded-lg text-xs font-semibold hover:bg-yellow-200"
                  >
                    <Plus className="w-3 h-3" />
                    Aggiungi date
                  </button>
                </div>
                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold">Data inizio Evento</th>
                        <th className="text-left px-3 py-2 font-semibold">Data Fine Evento</th>
                        <th className="text-left px-3 py-2 font-semibold">Data Prossimo Contatto</th>
                        <th className="text-right px-3 py-2 font-semibold">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fieraForm.dateSets.map((dateSet, index) => (
                        <tr key={index} className="border-t border-gray-100">
                          <td className="px-3 py-2">
                            <input
                              type="date"
                              className="input"
                              value={dateSet.dataInizio || ''}
                              onChange={(e) => updateDateSet(index, 'dataInizio', e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="date"
                              className="input"
                              value={dateSet.dataFine || ''}
                              onChange={(e) => updateDateSet(index, 'dataFine', e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="date"
                              className="input bg-gray-50"
                              value={dateSet.prossimoContatto || ''}
                              readOnly
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeDateSetRow(index)}
                              className="text-red-600 hover:text-red-800"
                              title="Rimuovi set date"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="md:col-span-2">
                <NotesLogField
                  value={fieraForm.noteLog || []}
                  onChange={(noteLog) => setFieraForm(form => ({ ...form, noteLog }))}
                  deprecatedNote={fieraForm.note}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <button onClick={closeFieraModal} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
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
            <h3 className="text-lg font-bold mb-4">{editingCircuito ? `Modifica circuito - ${editingCircuito.nome}` : 'Nuovo circuito'}</h3>
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

      {tipologiaModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold mb-4">{editingTipologia ? `Modifica tipologia - ${editingTipologia.nome}` : 'Nuova tipologia evento'}</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Nome *</label>
                <input className="input" value={tipologiaForm.nome} onChange={(e) => setTipologiaForm(form => ({ ...form, nome: e.target.value }))} />
              </div>
              <div>
                <label className="label">Note</label>
                <textarea className="input min-h-[100px]" value={tipologiaForm.note || ''} onChange={(e) => setTipologiaForm(form => ({ ...form, note: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => { setTipologiaModalOpen(false); setEditingTipologia(null); setTipologiaForm(EMPTY_TIPOLOGIA_FORM) }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Annulla
              </button>
              <button onClick={handleSaveTipologia} className="px-4 py-2 bg-yellow-400 rounded-lg font-semibold hover:bg-yellow-500">
                {editingTipologia ? 'Salva tipologia' : 'Crea tipologia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
