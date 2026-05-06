import { useState, useEffect, Fragment } from 'react'
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, Building2, Users, User } from 'lucide-react'
import {
  getAllContrattiRicorrenti,
  createContrattoRicorrente,
  updateContrattoRicorrente,
  deleteContrattoRicorrente,
} from '../services/contrattiRicorrentiService'
import {
  getAllClientiTerzi,
  createClienteTerzo,
  updateClienteTerzo,
  deleteClienteTerzo,
} from '../services/clientiTerziService'
import { getAllPagamentiContratti, upsertPagamentoContratto } from '../services/pagamentiContrattiService'
import { getAllBrands } from '../services/brandService'
import { getAllCreators } from '../services/creatorService'
import { confirm } from './ConfirmModal'
import { toast } from './Toast'
import { formatDate } from '../utils/date'

const TIPO_OPTIONS = [
  { value: 'BRAND',   label: 'Brand' },
  { value: 'CREATOR', label: 'Creator' },
  { value: 'TERZO',   label: 'Cliente Terzo' },
]

// Parsa "YYYY-MM-DD" come data locale (evita lo shift UTC→locale)
const parseLocalDate = (s) => {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const getStatoContratto = (c) => {
  const oggi = new Date(); oggi.setHours(0, 0, 0, 0)
  const inizio = parseLocalDate(c.dataInizio)
  const fine   = c.dataFine ? parseLocalDate(c.dataFine) : null
  if (!c.attivo)             return { label: 'Sospeso', color: 'bg-gray-100 text-gray-500' }
  if (fine && fine < oggi)   return { label: 'Scaduto',  color: 'bg-red-100 text-red-700' }
  if (inizio > oggi)         return { label: 'Futuro',   color: 'bg-blue-100 text-blue-700' }
  return { label: 'Attivo', color: 'bg-green-100 text-green-700' }
}

const tipoIcon  = (t) => t === 'BRAND' ? <Building2 className="w-3 h-3" /> : t === 'CREATOR' ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />
const tipoColor = (t) => t === 'BRAND' ? 'bg-blue-50 text-blue-700' : t === 'CREATOR' ? 'bg-purple-50 text-purple-700' : 'bg-orange-50 text-orange-700'

// Ultimi N mesi nel formato "YYYY-MM-01"
const getLastMonths = (n = 3) => {
  const months = []
  const d = new Date()
  for (let i = 0; i < n; i++) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    months.unshift(`${y}-${m}-01`)
    d.setMonth(d.getMonth() - 1)
  }
  return months
}

const formatMese = (mese) =>
  new Date(mese + 'T12:00:00').toLocaleDateString('it-IT', { month: 'short', year: '2-digit' })

const currentMese = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

const emptyContratto   = { nome: '', tipoSoggetto: 'TERZO', soggettoNome: '', soggettoId: '', importoMensile: '', dataInizio: '', dataFine: '', attivo: true, note: '' }
const emptyClienteTerzo = { nome: '', email: '', telefono: '', sitoWeb: '', note: '' }

const LAST_MONTHS = getLastMonths(3)

const getAllMonths = (dataInizio, dataFine) => {
  if (!dataInizio) return []
  const months = []
  const today = new Date()
  const start = parseLocalDate(dataInizio)
  const endRaw = dataFine ? parseLocalDate(dataFine) : today
  const endCapped = endRaw > today ? today : endRaw
  const cur = new Date(start.getFullYear(), start.getMonth(), 1)
  const limit = new Date(endCapped.getFullYear(), endCapped.getMonth(), 1)
  while (cur <= limit) {
    const y = cur.getFullYear()
    const m = String(cur.getMonth() + 1).padStart(2, '0')
    months.push(`${y}-${m}-01`)
    cur.setMonth(cur.getMonth() + 1)
  }
  return months
}

export default function ContrattiRicorrentiTab() {
  const [contratti,    setContratti]    = useState([])
  const [clientiTerzi, setClientiTerzi] = useState([])
  const [brands,       setBrands]       = useState([])
  const [creators,     setCreators]     = useState([])
  const [pagamenti,    setPagamenti]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [expandedHistory, setExpandedHistory] = useState(new Set())

  const [showForm,         setShowForm]         = useState(false)
  const [editingContratto, setEditingContratto] = useState(null)
  const [formContratto,    setFormContratto]    = useState(emptyContratto)

  const [showClientiTerzi, setShowClientiTerzi] = useState(false)
  const [showFormTerzo,    setShowFormTerzo]    = useState(false)
  const [editingTerzo,     setEditingTerzo]     = useState(null)
  const [formTerzo,        setFormTerzo]        = useState(emptyClienteTerzo)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    const [cRes, ktRes, bRes, crRes, pagRes] = await Promise.all([
      getAllContrattiRicorrenti(),
      getAllClientiTerzi(),
      getAllBrands(),
      getAllCreators(),
      getAllPagamentiContratti(),
    ])
    setContratti(cRes.data    || [])
    setClientiTerzi(ktRes.data || [])
    setBrands(bRes.data       || [])
    setCreators(crRes.data    || [])
    setPagamenti(pagRes.data  || [])
    setLoading(false)
  }

  const totaleAttivo = contratti
    .filter(c => getStatoContratto(c).label === 'Attivo')
    .reduce((s, c) => s + parseFloat(c.importoMensile || 0), 0)

  // ── Pagamenti handlers ─────────────────────────────────────
  const isPagato = (contrattoId, mese) =>
    pagamenti.some(p => p.contrattoId === contrattoId && p.mese === mese && p.pagato)

  const toggleHistory = (id) => {
    setExpandedHistory(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleTogglePagamento = async (contrattoId, mese) => {
    const current = isPagato(contrattoId, mese)
    // Ottimistico
    setPagamenti(prev => {
      const existing = prev.find(p => p.contrattoId === contrattoId && p.mese === mese)
      if (existing) return prev.map(p => p.contrattoId === contrattoId && p.mese === mese ? { ...p, pagato: !current } : p)
      return [...prev, { id: '_tmp', contrattoId, mese, pagato: true }]
    })
    const { error } = await upsertPagamentoContratto(contrattoId, mese, !current)
    if (error) { toast.error('Errore aggiornamento pagamento'); loadAll() }
  }

  // ── Contratti handlers ─────────────────────────────────────
  const handleSaveContratto = async () => {
    if (!formContratto.nome || !formContratto.soggettoNome || !formContratto.dataInizio) {
      toast.error('Compila nome, soggetto e data inizio')
      return
    }
    const fn = editingContratto
      ? updateContrattoRicorrente(editingContratto.id, formContratto)
      : createContrattoRicorrente(formContratto)
    const { error } = await fn
    if (error) { toast.error('Errore durante il salvataggio'); return }
    toast.success(editingContratto ? 'Contratto aggiornato' : 'Contratto creato')
    closeFormContratto()
    loadAll()
  }

  const handleEditContratto = (c) => { setEditingContratto(c); setFormContratto({ ...c }); setShowForm(true) }

  const handleDeleteContratto = async (id) => {
    const ok = await confirm('Questa azione è irreversibile.', { title: 'Eliminare il contratto?', confirmLabel: 'Elimina' })
    if (!ok) return
    await deleteContrattoRicorrente(id)
    toast.success('Contratto eliminato')
    loadAll()
  }

  const closeFormContratto = () => { setShowForm(false); setEditingContratto(null); setFormContratto(emptyContratto) }
  const handleTipoChange = (tipo) => setFormContratto(p => ({ ...p, tipoSoggetto: tipo, soggettoNome: '', soggettoId: '' }))

  const soggettoOptions = formContratto.tipoSoggetto === 'BRAND'
    ? brands.map(b      => ({ value: b.id, label: b.nome }))
    : formContratto.tipoSoggetto === 'CREATOR'
    ? creators.map(c    => ({ value: c.id, label: c.nome }))
    : clientiTerzi.map(t => ({ value: t.id, label: t.nome }))

  // ── Clienti Terzi handlers ─────────────────────────────────
  const handleSaveTerzo = async () => {
    if (!formTerzo.nome) { toast.error('Il nome è obbligatorio'); return }
    const fn = editingTerzo
      ? updateClienteTerzo(editingTerzo.id, formTerzo)
      : createClienteTerzo(formTerzo)
    const { error } = await fn
    if (error) { toast.error('Errore durante il salvataggio'); return }
    toast.success(editingTerzo ? 'Cliente aggiornato' : 'Cliente creato')
    closeFormTerzo()
    loadAll()
  }

  const handleDeleteTerzo = async (id) => {
    const ok = await confirm('Questa azione è irreversibile.', { title: 'Eliminare il cliente?', confirmLabel: 'Elimina' })
    if (!ok) return
    await deleteClienteTerzo(id)
    toast.success('Cliente eliminato')
    loadAll()
  }

  const closeFormTerzo = () => { setShowFormTerzo(false); setEditingTerzo(null); setFormTerzo(emptyClienteTerzo) }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400" />
    </div>
  )

  return (
    <div className="space-y-6 mt-6">

      {/* ── Summary ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-green-50 border border-green-100">
          <p className="text-sm font-medium text-green-700">Entrate fisse mensili (attive)</p>
          <p className="text-3xl font-bold text-green-800 mt-1">
            €{totaleAttivo.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-green-600 mt-1">
            {contratti.filter(c => getStatoContratto(c).label === 'Attivo').length} contratti attivi
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Contratti totali</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{contratti.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Clienti Terzi censiti</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{clientiTerzi.length}</p>
        </div>
      </div>

      {/* ── Contratti Ricorrenti ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Contratti Ricorrenti</h2>
          <button
            onClick={() => { closeFormContratto(); setShowForm(v => !v) }}
            className="flex items-center gap-2 px-3 py-1.5 bg-yellow-400 text-gray-900 rounded-lg font-semibold text-sm hover:bg-yellow-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuovo Contratto
          </button>
        </div>

        {/* Form add/edit */}
        {showForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">
              {editingContratto ? 'Modifica Contratto' : 'Nuovo Contratto Ricorrente'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nome contratto *</label>
                <input className="input" value={formContratto.nome}
                  onChange={e => setFormContratto(p => ({ ...p, nome: e.target.value }))}
                  placeholder="es. Consulenza mensile Inazuma" />
              </div>
              <div>
                <label className="label">Tipo soggetto *</label>
                <select className="input" value={formContratto.tipoSoggetto} onChange={e => handleTipoChange(e.target.value)}>
                  {TIPO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Soggetto *</label>
                {soggettoOptions.length > 0 && (
                  <select className="input mb-2" value={formContratto.soggettoId || ''}
                    onChange={e => {
                      const opt = soggettoOptions.find(o => o.value === e.target.value)
                      setFormContratto(p => ({ ...p, soggettoId: e.target.value, soggettoNome: opt?.label || '' }))
                    }}>
                    <option value="">Seleziona dal database...</option>
                    {soggettoOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                )}
                <input className="input" value={formContratto.soggettoNome}
                  onChange={e => setFormContratto(p => ({ ...p, soggettoNome: e.target.value, soggettoId: '' }))}
                  placeholder={
                    formContratto.tipoSoggetto === 'BRAND'   ? 'oppure digita nome brand...' :
                    formContratto.tipoSoggetto === 'CREATOR' ? 'oppure digita nome creator...' :
                    'oppure digita nome cliente terzo...'
                  } />
              </div>
              <div>
                <label className="label">Importo mensile (€) *</label>
                <input type="number" step="0.01" className="input" value={formContratto.importoMensile}
                  onChange={e => setFormContratto(p => ({ ...p, importoMensile: e.target.value }))}
                  placeholder="0.00" />
              </div>
              <div>
                <label className="label">Data inizio *</label>
                <input type="date" className="input" value={formContratto.dataInizio}
                  onChange={e => setFormContratto(p => ({ ...p, dataInizio: e.target.value }))} />
              </div>
              <div>
                <label className="label">
                  Data fine
                  <span className="ml-1 text-xs font-normal text-gray-400">(vuoto = a tempo indeterminato)</span>
                </label>
                <input type="date" className="input" value={formContratto.dataFine || ''}
                  onChange={e => setFormContratto(p => ({ ...p, dataFine: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Note</label>
                <input className="input" value={formContratto.note || ''}
                  onChange={e => setFormContratto(p => ({ ...p, note: e.target.value }))}
                  placeholder="Condizioni, clausole, rinnovo automatico..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="attivo-check" checked={formContratto.attivo}
                  onChange={e => setFormContratto(p => ({ ...p, attivo: e.target.checked }))} />
                <label htmlFor="attivo-check" className="text-sm font-medium text-gray-700">Contratto attivo</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={closeFormContratto}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Annulla</button>
              <button onClick={handleSaveContratto}
                className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold text-sm hover:bg-yellow-500">Salva</button>
            </div>
          </div>
        )}

        {contratti.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">
            Nessun contratto ricorrente. Aggiungi il primo con il pulsante sopra.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Contratto</th>
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Soggetto</th>
                  <th className="text-right py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">€/mese</th>
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Periodo</th>
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Stato</th>
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Pagamenti
                    <span className="ml-1 font-normal text-gray-400 normal-case">ultimi 3 mesi · storico ▾</span>
                  </th>
                  <th className="py-2.5 px-3" />
                </tr>
              </thead>
              <tbody>
                {contratti.map(c => {
                  const stato   = getStatoContratto(c)
                  const cur     = currentMese()
                  const isOpen  = expandedHistory.has(c.id)
                  return (
                    <Fragment key={c.id}>
                      <tr className="border-b border-gray-100 hover:bg-gray-50 group">
                        <td className="py-3 px-3">
                          <p className="font-semibold text-sm text-gray-900">{c.nome}</p>
                          {c.note && <p className="text-xs text-gray-400 truncate max-w-[200px]">{c.note}</p>}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${tipoColor(c.tipoSoggetto)}`}>
                            {tipoIcon(c.tipoSoggetto)}
                            {c.soggettoNome}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-gray-900">
                          €{parseFloat(c.importoMensile || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(c.dataInizio)} → {c.dataFine ? formatDate(c.dataFine) : '∞'}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${stato.color}`}>{stato.label}</span>
                        </td>
                        {/* Pagamenti — 3 dot quick view + toggle storico */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {LAST_MONTHS.map(mese => {
                              const paid = isPagato(c.id, mese)
                              const isCurrent = mese === cur
                              return (
                                <button
                                  key={mese}
                                  onClick={() => handleTogglePagamento(c.id, mese)}
                                  title={`${formatMese(mese)}: ${paid ? '✓ Pagato — clicca per annullare' : 'Non pagato — clicca per segnare pagato'}`}
                                  className="flex flex-col items-center gap-0.5 transition-all"
                                >
                                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-colors ${
                                    paid
                                      ? 'bg-green-400 border-green-500 text-white'
                                      : 'bg-gray-100 border-gray-300 text-gray-400 hover:border-gray-400'
                                  } ${isCurrent ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}`}>
                                    {paid ? '✓' : ''}
                                  </span>
                                  <span className="text-[9px] text-gray-400 leading-none">{formatMese(mese)}</span>
                                </button>
                              )
                            })}
                            <button
                              onClick={() => toggleHistory(c.id)}
                              title="Visualizza storico completo pagamenti"
                              className={`ml-1 text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                                isOpen
                                  ? 'bg-gray-200 border-gray-300 text-gray-700'
                                  : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                              }`}
                            >
                              {isOpen ? '▲ storico' : '▼ storico'}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditContratto(c)}
                              className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded-lg"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteContratto(c.id)}
                              className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                      {isOpen && (() => {
                        const allMonths = getAllMonths(c.dataInizio, c.dataFine)
                        const byYear = {}
                        allMonths.forEach(m => {
                          const y = m.slice(0, 4)
                          if (!byYear[y]) byYear[y] = []
                          byYear[y].push(m)
                        })
                        return (
                          <tr>
                            <td colSpan={7} className="px-4 pb-4 bg-gray-50/60">
                              <div className="rounded-xl border border-gray-200 bg-white p-4 mt-0">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                  Storico completo · {allMonths.length} mesi
                                </p>
                                <div className="space-y-3">
                                  {Object.entries(byYear).map(([year, months]) => (
                                    <div key={year} className="flex items-start gap-3">
                                      <span className="text-xs font-bold text-gray-400 w-8 pt-1 shrink-0">{year}</span>
                                      <div className="flex flex-wrap gap-2">
                                        {months.map(mese => {
                                          const paid = isPagato(c.id, mese)
                                          const isCur = mese === cur
                                          return (
                                            <button
                                              key={mese}
                                              onClick={() => handleTogglePagamento(c.id, mese)}
                                              title={`${formatMese(mese)}: ${paid ? '✓ Pagato — clicca per annullare' : 'Non pagato — clicca per segnare pagato'}`}
                                              className="flex flex-col items-center gap-0.5 transition-all"
                                            >
                                              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-colors ${
                                                paid
                                                  ? 'bg-green-400 border-green-500 text-white'
                                                  : 'bg-gray-100 border-gray-300 text-gray-400 hover:border-gray-400'
                                              } ${isCur ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}`}>
                                                {paid ? '✓' : ''}
                                              </span>
                                              <span className="text-[9px] text-gray-400 leading-none">{formatMese(mese)}</span>
                                            </button>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      })()}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Clienti Terzi (collassabile) ── */}
      <div className="card">
        <button className="flex items-center justify-between w-full" onClick={() => setShowClientiTerzi(v => !v)}>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">Clienti Terzi</h2>
            <span className="text-xs text-gray-400 font-normal">({clientiTerzi.length} censiti)</span>
          </div>
          {showClientiTerzi
            ? <ChevronUp className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {showClientiTerzi && (
          <div className="mt-4">
            <div className="flex justify-end mb-4">
              <button onClick={() => { closeFormTerzo(); setShowFormTerzo(v => !v) }}
                className="flex items-center gap-2 px-3 py-1.5 bg-yellow-400 text-gray-900 rounded-lg font-semibold text-sm hover:bg-yellow-500">
                <Plus className="w-4 h-4" />
                Nuovo Cliente
              </button>
            </div>

            {showFormTerzo && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">
                  {editingTerzo ? 'Modifica Cliente' : 'Nuovo Cliente Terzo'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nome / Ragione sociale *</label>
                    <input className="input" value={formTerzo.nome}
                      onChange={e => setFormTerzo(p => ({ ...p, nome: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input type="email" className="input" value={formTerzo.email || ''}
                      onChange={e => setFormTerzo(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Telefono</label>
                    <input className="input" value={formTerzo.telefono || ''}
                      onChange={e => setFormTerzo(p => ({ ...p, telefono: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Sito Web</label>
                    <input type="url" className="input" value={formTerzo.sitoWeb || ''}
                      onChange={e => setFormTerzo(p => ({ ...p, sitoWeb: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Note</label>
                    <input className="input" value={formTerzo.note || ''}
                      onChange={e => setFormTerzo(p => ({ ...p, note: e.target.value }))} />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={closeFormTerzo}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Annulla</button>
                  <button onClick={handleSaveTerzo}
                    className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold text-sm hover:bg-yellow-500">Salva</button>
                </div>
              </div>
            )}

            {clientiTerzi.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">Nessun cliente terzo censito.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase">Nome</th>
                    <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase">Email</th>
                    <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase">Telefono</th>
                    <th className="py-2.5 px-3" />
                  </tr>
                </thead>
                <tbody>
                  {clientiTerzi.map(t => (
                    <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 group">
                      <td className="py-2.5 px-3 font-medium text-sm text-gray-900">{t.nome}</td>
                      <td className="py-2.5 px-3 text-sm text-gray-500">{t.email || '—'}</td>
                      <td className="py-2.5 px-3 text-sm text-gray-500">{t.telefono || '—'}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => {
                            setEditingTerzo(t)
                            setFormTerzo({ nome: t.nome, email: t.email || '', telefono: t.telefono || '', sitoWeb: t.sitoWeb || '', note: t.note || '' })
                            setShowFormTerzo(true)
                          }} className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded-lg"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteTerzo(t.id)}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
