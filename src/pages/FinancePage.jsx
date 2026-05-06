import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAllCreators } from '../services/creatorService'
import { getAllCollaborations } from '../services/collaborationService'
import { getAllContrattiRicorrenti } from '../services/contrattiRicorrentiService'
import { getVersamentByMonth, upsertVersamento, toggleVerificato, deleteVersamento } from '../services/versamentoService'
import { getPagamentiByMese, generaPagamentiMese, upsertPagamentoAgente } from '../services/pagamentiAgentiService'
import { getAllUsers } from '../services/userService'
import { getAllAgentsStats } from '../services/agentService'
import { getFattureByMese, createFattura, deleteFattura } from '../services/fattureEmesseService'
import { getUsciteByMese, createUscita, updateUscita, deleteUscita, togglePagataUscita } from '../services/usciteVarieService'
import {
  CheckCircle, XCircle, ExternalLink, DollarSign, TrendingUp, TrendingDown,
  Plus, Trash2, Edit, ChevronDown, ChevronUp, FileText,
} from 'lucide-react'
import { confirm } from '../components/ConfirmModal'
import { toast } from '../components/Toast'
import { PagamentoRow } from '../components/PagamentoRow'
import ContrattiRicorrentiTab from '../components/ContrattiRicorrentiTab'
import ClientiTerziTab from '../components/ClientiTerziTab'
import Modal from '../components/Modal'
import { formatDate } from '../utils/date'
import { supabase } from '../lib/supabase'
import { CATEGORIE_USCITA, TIPI_ENTRATA } from '../constants/constants'

// Parsa "YYYY-MM-DD" come data locale (evita shift UTC→locale)
const parseLD = (s) => { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }

const getMonthRange = (month) => {
  const [year, monthIndex] = month.split('-').map(Number)
  return {
    start: new Date(year, monthIndex - 1, 1),
    end: new Date(year, monthIndex, 0),
  }
}

const emptyFattura   = { mese: '', numeroFattura: '', dataFattura: '', soggettoNome: '', importo: '', tipo: 'MANUALE', collabId: null, versamentoId: null, contrattoId: null, linkDocumento: '', note: '' }
const emptyVersamento = { creatorId: '', tipoPagamento: '', importoVersato: '', numeroFattura: '', dataFattura: '', linkFattura: '', verificato: false }
const emptyUscita    = { categoria: '', descrizione: '', importo: '', fornitore: '', note: '', pagata: false }

const tipiEntrataMap    = Object.fromEntries(TIPI_ENTRATA.map(t => [t.value, t.label]))
const categUscitaMap    = Object.fromEntries(CATEGORIE_USCITA.map(c => [c.value, c.label]))

export default function FinancePage() {
  const { userProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('entrate')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(true)

  // Entrate
  const [creators, setCreators]               = useState([])
  const [collabCompletate, setCollabCompletate] = useState([])
  const [versamenti, setVersamenti]           = useState([])
  const [fattureEmesse, setFattureEmesse]     = useState([])
  const [contrattiAttiviTotale, setContrattiAttiviTotale] = useState(0)
  const [contrattiAttivi, setContrattiAttivi] = useState([])

  // Uscite
  const [pagamenti, setPagamenti]   = useState([])
  const [allUsers, setAllUsers]     = useState([])
  const [usciteVarie, setUsciteVarie] = useState([])

  // Forms
  const [fatturaForm, setFatturaForm]       = useState(emptyFattura)
  const [showFatturaForm, setShowFatturaForm] = useState(false)
  const [versamentoForm, setVersamentoForm] = useState(emptyVersamento)
  const [uscitaForm, setUscitaForm]         = useState(emptyUscita)
  const [showUscitaForm, setShowUscitaForm] = useState(false)
  const [editingUscita, setEditingUscita]   = useState(null)
  const renderInlineFatturaForm = false

  // Collapse state
  const [open, setOpen] = useState({ collab: true, versamenti: false, contratti: false, fatture: true, agenti: true, varie: true })
  const toggleSection = (k) => setOpen(p => ({ ...p, [k]: !p[k] }))

  useEffect(() => {
    if (userProfile?.role === 'ADMIN') loadData()
  }, [userProfile, selectedMonth])

  const loadData = async () => {
    setLoading(true)
    const meseFull = `${selectedMonth}-01`

    const [creatorsRes, collabRes, contrattiRes, versamentiRes, fattureRes, pagAgentiRes, usersRes, agentsStatsRes, usciteRes] = await Promise.all([
      getAllCreators(),
      getAllCollaborations(),
      getAllContrattiRicorrenti(),
      getVersamentByMonth(meseFull),
      getFattureByMese(meseFull),
      getPagamentiByMese(selectedMonth),
      getAllUsers(),
      getAllAgentsStats(selectedMonth),
      getUsciteByMese(meseFull),
    ])

    setCreators(creatorsRes.data || [])

    setCollabCompletate((collabRes.data || []).filter(c =>
      c.stato === 'COMPLETATA' && c.dataPagamentoAgency?.startsWith(selectedMonth)
    ))

    // Contratti fissi attivi — per il totale P&L
    const { start: monthStart, end: monthEnd } = getMonthRange(selectedMonth)
    const attivi = (contrattiRes.data || []).filter(c => {
      if (!c.attivo) return false
      const fine   = c.dataFine ? parseLD(c.dataFine) : null
      const inizio = parseLD(c.dataInizio)
      return inizio <= monthEnd && (!fine || fine >= monthStart)
    })
    setContrattiAttivi(attivi)
    setContrattiAttiviTotale(attivi.reduce((s, c) => s + parseFloat(c.importoMensile || 0), 0))

    setVersamenti(versamentiRes.data || [])
    setFattureEmesse(fattureRes.data || [])

    // Agenti — arricchiti con statistiche fee
    const statsMap = {}
    ;(agentsStatsRes.data || []).forEach(s => { statsMap[s.agente] = s.totalCommissioni || 0 })
    setAllUsers(usersRes.data || [])
    setPagamenti((pagAgentiRes.data || []).map(p => ({
      ...p,
      importoFee: statsMap[p.agenteNome] || 0,
      importoTotale: p.importoFisso + (statsMap[p.agenteNome] || 0),
      differenza: (p.importoFisso + (statsMap[p.agenteNome] || 0)) - p.importoPagato,
    })))

    setUsciteVarie(usciteRes.data || [])
    setLoading(false)
  }

  // ── P&L ───────────────────────────────────────────────────
  const totFeeCollab   = collabCompletate.reduce((s, c) => s + parseFloat(c.feeManagement || 0), 0)
  const totVersamenti  = versamenti.reduce((s, v) => s + parseFloat(v.importoVersato || 0), 0)
  const totEntrate     = totFeeCollab + totVersamenti + contrattiAttiviTotale
  const totFatturato   = fattureEmesse.reduce((s, f) => s + parseFloat(f.importo || 0), 0)
  const totUsciteAgenti = pagamenti.reduce((s, p) => s + parseFloat(p.importoPagato || 0), 0)
  const totUsciteVarie  = usciteVarie.reduce((s, u) => s + parseFloat(u.importo || 0), 0)
  const totUscite      = totUsciteAgenti + totUsciteVarie
  const saldo          = totEntrate - totUscite

  // ── Fatture helpers ───────────────────────────────────────
  const getFatturaForCollab      = (id) => fattureEmesse.find(f => f.collabId === id)
  const getFatturaForVersamento  = (id) => fattureEmesse.find(f => f.versamentoId === id)
  const getFatturaForContratto   = (id) => fattureEmesse.find(f => f.contrattoId === id)
  const getCollabFatturaLabel = (c) => [c.creatorNome, c.brandNome].filter(Boolean).join(' - ') || 'Collaborazione'

  const collabFatturabili = collabCompletate.filter(c => !getFatturaForCollab(c.id))
  const contrattiFatturabili = contrattiAttivi.filter(c => !getFatturaForContratto(c.id))
  const versamentiFatturabili = versamenti.filter(v => !getFatturaForVersamento(v.id))

  const openFatturaPrecompilata = (overrides) => {
    setFatturaForm({ ...emptyFattura, mese: `${selectedMonth}-01`, ...overrides })
    setShowFatturaForm(true)
  }

  const handleTipoFatturaChange = (tipo) => {
    setFatturaForm({
      ...emptyFattura,
      mese: `${selectedMonth}-01`,
      tipo,
    })
  }

  const handleFatturaSourceChange = (sourceId) => {
    if (!sourceId) {
      setFatturaForm(p => ({ ...p, collabId: null, contrattoId: null, versamentoId: null, soggettoNome: '', importo: '' }))
      return
    }

    if (fatturaForm.tipo === 'COLLAB') {
      const c = collabFatturabili.find(item => item.id === sourceId)
      if (!c) return
      setFatturaForm(p => ({ ...p, collabId: c.id, contrattoId: null, versamentoId: null, soggettoNome: getCollabFatturaLabel(c), importo: c.feeManagement || '' }))
    } else if (fatturaForm.tipo === 'RICORRENTE') {
      const c = contrattiFatturabili.find(item => item.id === sourceId)
      if (!c) return
      setFatturaForm(p => ({ ...p, collabId: null, contrattoId: c.id, versamentoId: null, soggettoNome: c.soggettoNome || c.nome || '', importo: c.importoMensile || '' }))
    } else if (fatturaForm.tipo === 'VERSAMENTO') {
      const v = versamentiFatturabili.find(item => item.id === sourceId)
      if (!v) return
      setFatturaForm(p => ({ ...p, collabId: null, contrattoId: null, versamentoId: v.id, soggettoNome: v.creatorNome || '', importo: v.importoVersato || '' }))
    }
  }

  const getFatturaSourceValue = () => {
    if (fatturaForm.tipo === 'COLLAB') return fatturaForm.collabId || ''
    if (fatturaForm.tipo === 'RICORRENTE') return fatturaForm.contrattoId || ''
    if (fatturaForm.tipo === 'VERSAMENTO') return fatturaForm.versamentoId || ''
    return ''
  }

  const getFatturaSourceOptions = () => {
    if (fatturaForm.tipo === 'COLLAB') {
      return collabFatturabili.map(c => ({
        value: c.id,
        label: `${getCollabFatturaLabel(c)} - €${parseFloat(c.feeManagement || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
      }))
    }
    if (fatturaForm.tipo === 'RICORRENTE') {
      return contrattiFatturabili.map(c => ({
        value: c.id,
        label: `${c.nome} (${c.soggettoNome}) - €${parseFloat(c.importoMensile || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
      }))
    }
    if (fatturaForm.tipo === 'VERSAMENTO') {
      return versamentiFatturabili.map(v => ({
        value: v.id,
        label: `${v.creatorNome || 'Creator'}${v.tipoPagamento ? ` - ${v.tipoPagamento}` : ''} - €${parseFloat(v.importoVersato || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
      }))
    }
    return []
  }

  const fatturaSourceOptions = getFatturaSourceOptions()
  const fatturaNeedsSource = fatturaForm.tipo !== 'MANUALE'
  const canSaveFattura = Boolean(
    fatturaForm.soggettoNome &&
    fatturaForm.importo &&
    (!fatturaNeedsSource || getFatturaSourceValue())
  )

  const handleSaveFattura = async () => {
    if (fatturaForm.tipo !== 'MANUALE' && !fatturaForm.collabId && !fatturaForm.contrattoId && !fatturaForm.versamentoId) {
      toast.error('Seleziona una voce da fatturare')
      return
    }
    if (!fatturaForm.soggettoNome || !fatturaForm.importo) {
      toast.error('Soggetto e importo obbligatori')
      return
    }
    const { error } = await createFattura({ ...fatturaForm, mese: fatturaForm.mese || `${selectedMonth}-01` })
    if (error) { toast.error('Errore salvataggio fattura'); return }
    toast.success('Fattura registrata')
    setShowFatturaForm(false)
    setFatturaForm(emptyFattura)
    loadData()
  }

  const handleDeleteFattura = async (id) => {
    const ok = await confirm('Eliminare questa fattura?', { title: 'Elimina fattura', confirmLabel: 'Elimina' })
    if (!ok) return
    await deleteFattura(id)
    toast.success('Fattura eliminata')
    loadData()
  }

  // ── Versamenti handlers ───────────────────────────────────
  const handleSaveVersamento = async () => {
    if (!versamentoForm.creatorId) return
    await upsertVersamento({ ...versamentoForm, mese: `${selectedMonth}-01` })
    setVersamentoForm(emptyVersamento)
    toast.success('Versamento registrato')
    loadData()
  }

  const handleToggleVerificato = async (id, current) => {
    await toggleVerificato(id, current)
    loadData()
  }

  const handleDeleteVersamento = async (id) => {
    const ok = await confirm('Eliminare il versamento?', { title: 'Elimina versamento', confirmLabel: 'Elimina' })
    if (!ok) return
    await deleteVersamento(id)
    toast.success('Versamento eliminato')
    loadData()
  }

  // ── Agenti handlers ───────────────────────────────────────
  const reloadAgenti = async () => {
    const [pagRes, statsRes] = await Promise.all([getPagamentiByMese(selectedMonth), getAllAgentsStats(selectedMonth)])
    const statsMap = {}
    ;(statsRes.data || []).forEach(s => { statsMap[s.agente] = s.totalCommissioni || 0 })
    setPagamenti((pagRes.data || []).map(p => ({
      ...p,
      importoFee: statsMap[p.agenteNome] || 0,
      importoTotale: p.importoFisso + (statsMap[p.agenteNome] || 0),
      differenza: (p.importoFisso + (statsMap[p.agenteNome] || 0)) - p.importoPagato,
    })))
  }

  const handlePagamento = async (agenteNome, importoPagato, importoFisso, importoTotale) => {
    await upsertPagamentoAgente({ agenteNome, mese: selectedMonth, importoFisso, importoTotale, importoPagato: parseFloat(importoPagato) })
    await reloadAgenti()
    toast.success('Pagamento registrato')
  }

  const handleGeneraMese = async () => {
    await generaPagamentiMese(selectedMonth, allUsers)
    await reloadAgenti()
    toast.success('Riepilogo generato')
  }

  const handleResetMese = async () => {
    const ok = await confirm(`Eliminare tutti i pagamenti agenti di ${selectedMonth}?`, { title: 'Reset mese', confirmLabel: 'Elimina' })
    if (!ok) return
    await supabase.from('pagamenti_agenti').delete().eq('mese', selectedMonth)
    setPagamenti([])
    toast.success('Mese resettato')
  }

  // ── Uscite varie handlers ─────────────────────────────────
  const handleSaveUscita = async () => {
    if (!uscitaForm.categoria || !uscitaForm.importo) {
      toast.error('Categoria e importo obbligatori')
      return
    }
    const payload = { ...uscitaForm, mese: `${selectedMonth}-01` }
    const { error } = editingUscita ? await updateUscita(editingUscita.id, payload) : await createUscita(payload)
    if (error) { toast.error('Errore salvataggio'); return }
    toast.success(editingUscita ? 'Uscita aggiornata' : 'Uscita registrata')
    setShowUscitaForm(false)
    setEditingUscita(null)
    setUscitaForm(emptyUscita)
    loadData()
  }

  const handleDeleteUscita = async (id) => {
    const ok = await confirm('Eliminare questa uscita?', { title: 'Elimina uscita', confirmLabel: 'Elimina' })
    if (!ok) return
    await deleteUscita(id)
    toast.success('Uscita eliminata')
    loadData()
  }

  const handleTogglePagataUscita = async (id, current) => {
    await togglePagataUscita(id, current)
    loadData()
  }

  // ── Guards ────────────────────────────────────────────────
  if (userProfile?.role !== 'ADMIN') return <div className="card"><p>Accesso negato — Solo Amministratori</p></div>
  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400" /></div>

  // ── Render helper: section collapsible header ─────────────
  const SectionHeader = ({ label, count, total, badge, sectionKey }) => (
    <button className="flex items-center justify-between w-full py-3" onClick={() => toggleSection(sectionKey)}>
      <div className="flex items-center gap-2">
        <h3 className="font-bold text-gray-800">{label}</h3>
        {count != null && <span className="text-xs text-gray-400">({count})</span>}
        {badge}
      </div>
      <div className="flex items-center gap-3">
        {total != null && (
          <span className="text-sm font-semibold text-gray-600">
            €{parseFloat(total).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </span>
        )}
        {open[sectionKey] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>
    </button>
  )

  // ── Render helper: fattura status badge ───────────────────
  const FatturaBadge = ({ fattura, onOpen }) => fattura ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
      <FileText className="w-3 h-3" /> {fattura.numeroFattura || 'Emessa'}
    </span>
  ) : (
    <button onClick={onOpen}
      className="text-xs px-2 py-0.5 border border-dashed border-gray-300 text-gray-400 hover:border-yellow-400 hover:text-yellow-600 rounded-full transition-colors">
      + Fattura
    </button>
  )

  // ─────────────────────────────────────────────────────────
  return (
    <div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Finance</h1>
        <div>
          <label className="label">Mese di riferimento</label>
          <input type="month" className="input" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
        </div>
      </div>

      {/* ── P&L Dashboard ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`card border-2 ${saldo >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center justify-between mb-1">
            <p className={`text-sm font-semibold ${saldo >= 0 ? 'text-green-700' : 'text-red-700'}`}>Saldo Netto</p>
            {saldo >= 0 ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
          </div>
          <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-800' : 'text-red-800'}`}>
            {saldo >= 0 ? '+' : '−'}€{Math.abs(saldo).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-1">Entrate − Uscite</p>
        </div>
        <div className="card border border-blue-100 bg-blue-50">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-blue-700">Entrate</p>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-800">€{totEntrate.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-blue-500 mt-1">Fee + Versamenti + Fissi</p>
        </div>
        <div className="card border border-red-100 bg-red-50">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-red-700">Uscite</p>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-800">€{totUscite.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-red-500 mt-1">Agenti + Varie</p>
        </div>
        <div className="card border border-yellow-200 bg-yellow-50">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-yellow-700">Fatturato</p>
            <FileText className="w-4 h-4 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-yellow-800">€{totFatturato.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-yellow-600 mt-1">{fattureEmesse.length} fatture emesse</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-200 mb-6">
        {[{ key: 'entrate', label: 'Entrate' }, { key: 'uscite', label: 'Uscite' }, { key: 'clientiTerzi', label: 'Clienti Terzi' }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`pb-3 px-5 font-semibold text-sm border-b-2 transition-colors ${
              activeTab === t.key ? 'border-yellow-400 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════ ENTRATE ════════════════ */}
      {activeTab === 'entrate' && (
        <div className="space-y-4">

          {/* Fee Collaborazioni */}
          <div className="card">
            <SectionHeader label="Fee Collaborazioni" count={collabCompletate.length} total={totFeeCollab} sectionKey="collab" />
            {open.collab && (
              collabCompletate.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Nessuna collaborazione con pagamento registrato in questo mese.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase">Creator</th>
                        <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase">Brand</th>
                        <th className="text-right py-2 px-3 text-xs font-bold text-gray-500 uppercase">Pag. Brand</th>
                        <th className="text-right py-2 px-3 text-xs font-bold text-gray-500 uppercase">Fee C3</th>
                        <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase">Fattura</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collabCompletate.map(c => (
                        <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2.5 px-3 text-sm font-medium">{c.creatorNome}</td>
                          <td className="py-2.5 px-3 text-sm text-gray-600">{c.brandNome}</td>
                          <td className="py-2.5 px-3 text-right text-sm text-gray-600">€{parseFloat(c.pagamento || 0).toLocaleString('it-IT')}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-green-700">€{parseFloat(c.feeManagement || 0).toLocaleString('it-IT')}</td>
                          <td className="py-2.5 px-3">
                            <FatturaBadge
                              fattura={getFatturaForCollab(c.id)}
                              onOpen={() => openFatturaPrecompilata({ tipo: 'COLLAB', soggettoNome: getCollabFatturaLabel(c), importo: c.feeManagement || '', collabId: c.id })}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200">
                        <td colSpan={3} className="py-2 px-3 text-xs font-bold text-gray-500 uppercase">Totale fee</td>
                        <td className="py-2 px-3 text-right font-bold text-green-700">€{totFeeCollab.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )
            )}
          </div>

          {/* Versamenti Creator */}
          <div className="card">
            <SectionHeader label="Versamenti Creator" count={versamenti.length} total={totVersamenti} sectionKey="versamenti" />
            {open.versamenti && (
              <div className="space-y-4">
                {/* Add form */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <select value={versamentoForm.creatorId} onChange={e => setVersamentoForm(p => ({ ...p, creatorId: e.target.value }))} className="input">
                      <option value="">Seleziona Creator...</option>
                      {creators.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                    <input placeholder="Tipo (F24, Ritenuta…)" value={versamentoForm.tipoPagamento} onChange={e => setVersamentoForm(p => ({ ...p, tipoPagamento: e.target.value }))} className="input" />
                    <input type="number" step="0.01" placeholder="Importo €" value={versamentoForm.importoVersato} onChange={e => setVersamentoForm(p => ({ ...p, importoVersato: e.target.value }))} className="input" />
                    <button onClick={handleSaveVersamento} className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold text-sm hover:bg-yellow-500">+ Aggiungi</button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <input placeholder="N. Fattura" value={versamentoForm.numeroFattura} onChange={e => setVersamentoForm(p => ({ ...p, numeroFattura: e.target.value }))} className="input" />
                    <input type="date" value={versamentoForm.dataFattura} onChange={e => setVersamentoForm(p => ({ ...p, dataFattura: e.target.value }))} className="input" />
                    <input type="url" placeholder="Link documento" value={versamentoForm.linkFattura} onChange={e => setVersamentoForm(p => ({ ...p, linkFattura: e.target.value }))} className="input" />
                  </div>
                </div>
                {/* Table */}
                {versamenti.length > 0 && (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase">Creator</th>
                        <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase">Tipo</th>
                        <th className="text-right py-2 px-3 text-xs font-bold text-gray-500 uppercase">Importo</th>
                        <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase">N. Fattura</th>
                        <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase">Data</th>
                        <th className="text-center py-2 px-3 text-xs font-bold text-gray-500 uppercase">Doc.</th>
                        <th className="text-center py-2 px-3 text-xs font-bold text-gray-500 uppercase">Verif.</th>
                        <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase">Fattura C3</th>
                        <th className="py-2 px-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {versamenti.map(v => (
                        <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-medium text-sm">{v.creatorNome}</td>
                          <td className="py-2.5 px-3 text-sm text-gray-500">{v.tipoPagamento || '—'}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-green-700">€{parseFloat(v.importoVersato).toLocaleString('it-IT')}</td>
                          <td className="py-2.5 px-3 text-sm text-gray-500">{v.numeroFattura || '—'}</td>
                          <td className="py-2.5 px-3 text-sm text-gray-500">{formatDate(v.dataFattura) || '—'}</td>
                          <td className="py-2.5 px-3 text-center">
                            {v.linkFattura ? <a href={v.linkFattura} target="_blank" rel="noopener noreferrer" className="text-blue-600"><ExternalLink className="w-4 h-4 inline" /></a> : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button onClick={() => handleToggleVerificato(v.id, v.verificato)} className={v.verificato ? 'text-green-600' : 'text-gray-400'}>
                              {v.verificato ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="py-2.5 px-3">
                            <FatturaBadge
                              fattura={getFatturaForVersamento(v.id)}
                              onOpen={() => openFatturaPrecompilata({ tipo: 'VERSAMENTO', soggettoNome: v.creatorNome, importo: v.importoVersato || '', versamentoId: v.id })}
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <button onClick={() => handleDeleteVersamento(v.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          {/* Contratti Fissi — delegato a ContrattiRicorrentiTab */}
          <div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4">
              <div className="flex items-center justify-between py-3">
                <button className="flex items-center gap-2 flex-1 text-left" onClick={() => toggleSection('contratti')}>
                  <h3 className="font-bold text-gray-800">Contratti Fissi</h3>
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-600">
                    €{contrattiAttiviTotale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </span>
                  <button onClick={() => toggleSection('contratti')}>
                    {open.contratti ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
              </div>
            </div>
            {open.contratti && (
              <div className="mt-2">
                <ContrattiRicorrentiTab
                  selectedMonth={selectedMonth}
                  onDataChanged={loadData}
                  onOpenFattura={(contratto, mese) => openFatturaPrecompilata({
                    mese,
                    tipo: 'RICORRENTE',
                    soggettoNome: contratto.soggettoNome || contratto.nome || '',
                    importo: contratto.importoMensile || '',
                    contrattoId: contratto.id,
                  })}
                />
              </div>
            )}
          </div>

          {/* Fatture Emesse */}
          <div className="card">
            <SectionHeader label="Registro Fatture Emesse" count={fattureEmesse.length} total={totFatturato} sectionKey="fatture" />
            {open.fatture && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button onClick={() => { setFatturaForm(emptyFattura); setShowFatturaForm(true) }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-yellow-400 text-gray-900 rounded-lg font-semibold text-sm hover:bg-yellow-500">
                    <Plus className="w-4 h-4" /> Nuova Fattura
                  </button>
                </div>

                {renderInlineFatturaForm && showFatturaForm && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="font-semibold text-gray-700 text-sm mb-3">Registra Fattura Emessa</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="label">Tipo *</label>
                        <select className="input" value={fatturaForm.tipo} onChange={e => setFatturaForm(p => ({ ...p, tipo: e.target.value }))}>
                          {TIPI_ENTRATA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">Soggetto *</label>
                        <input className="input" value={fatturaForm.soggettoNome} onChange={e => setFatturaForm(p => ({ ...p, soggettoNome: e.target.value }))} placeholder="Nome cliente / brand" />
                      </div>
                      <div>
                        <label className="label">Importo * (€)</label>
                        <input type="number" step="0.01" className="input" value={fatturaForm.importo} onChange={e => setFatturaForm(p => ({ ...p, importo: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">N. Fattura</label>
                        <input className="input" value={fatturaForm.numeroFattura} onChange={e => setFatturaForm(p => ({ ...p, numeroFattura: e.target.value }))} placeholder="es. 2025/001" />
                      </div>
                      <div>
                        <label className="label">Data Fattura</label>
                        <input type="date" className="input" value={fatturaForm.dataFattura} onChange={e => setFatturaForm(p => ({ ...p, dataFattura: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Link Documento</label>
                        <input type="url" className="input" value={fatturaForm.linkDocumento} onChange={e => setFatturaForm(p => ({ ...p, linkDocumento: e.target.value }))} placeholder="Drive, OneDrive…" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <button onClick={() => { setShowFatturaForm(false); setFatturaForm(emptyFattura) }}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Annulla</button>
                      <button onClick={handleSaveFattura}
                        className="px-3 py-1.5 bg-yellow-400 text-gray-900 rounded-lg font-semibold text-sm hover:bg-yellow-500">Registra</button>
                    </div>
                  </div>
                )}

                {fattureEmesse.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Nessuna fattura emessa in questo mese.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase">N. Fattura</th>
                          <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase">Data</th>
                          <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase">Soggetto</th>
                          <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase">Tipo</th>
                          <th className="text-right py-2 px-3 text-xs font-bold text-gray-500 uppercase">Importo</th>
                          <th className="text-center py-2 px-3 text-xs font-bold text-gray-500 uppercase">Doc.</th>
                          <th className="py-2 px-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {fattureEmesse.map(f => (
                          <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50 group">
                            <td className="py-2.5 px-3 font-mono text-sm text-gray-700">{f.numeroFattura || '—'}</td>
                            <td className="py-2.5 px-3 text-sm text-gray-500">{formatDate(f.dataFattura) || '—'}</td>
                            <td className="py-2.5 px-3 font-medium text-sm">{f.soggettoNome}</td>
                            <td className="py-2.5 px-3">
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{tipiEntrataMap[f.tipo] || f.tipo}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold text-green-700">€{parseFloat(f.importo).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-center">
                              {f.linkDocumento ? <a href={f.linkDocumento} target="_blank" rel="noopener noreferrer" className="text-blue-600"><ExternalLink className="w-4 h-4 inline" /></a> : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button onClick={() => handleDeleteFattura(f.id)} className="p-1 text-red-400 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-200">
                          <td colSpan={4} className="py-2 px-3 text-sm font-bold text-gray-700">Totale Fatturato</td>
                          <td className="py-2 px-3 text-right font-bold text-green-700">€{totFatturato.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'clientiTerzi' && (
        <ClientiTerziTab onDataChanged={loadData} />
      )}

      {/* ════════════════ USCITE ════════════════ */}
      {activeTab === 'uscite' && (
        <div className="space-y-4">

          {/* Agenti */}
          <div className="card overflow-hidden p-0">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <button className="flex items-center gap-2 flex-1 text-left" onClick={() => toggleSection('agenti')}>
                <h3 className="font-bold text-gray-800">Pagamenti Agenti</h3>
                <span className="text-sm text-gray-500">€{totUsciteAgenti.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                {open.agenti ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {open.agenti && (
                <div className="flex gap-2">
                  {pagamenti.length > 0 && (
                    <button onClick={handleResetMese} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200">Reset mese</button>
                  )}
                  <button onClick={handleGeneraMese} className="px-3 py-1.5 bg-yellow-400 text-gray-900 rounded-lg text-xs font-bold hover:bg-yellow-500">+ Genera mese</button>
                </div>
              )}
            </div>
            {open.agenti && (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Agente</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Fisso</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Fee Mese</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Totale</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Pagato</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Differenza</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Stato</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {pagamenti.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-400 text-sm">
                      Nessun pagamento. Clicca "Genera mese" per creare le righe.
                    </td></tr>
                  ) : pagamenti.map(p => <PagamentoRow key={p.id} pagamento={p} onSave={handlePagamento} />)}
                </tbody>
              </table>
            )}
          </div>

          {/* Uscite Varie */}
          <div className="card">
            <SectionHeader label="Uscite Varie" count={usciteVarie.length} total={totUsciteVarie} sectionKey="varie" />
            {open.varie && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button onClick={() => { setEditingUscita(null); setUscitaForm(emptyUscita); setShowUscitaForm(v => !v) }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-yellow-400 text-gray-900 rounded-lg font-semibold text-sm hover:bg-yellow-500">
                    <Plus className="w-4 h-4" /> Nuova Uscita
                  </button>
                </div>

                {showUscitaForm && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="font-semibold text-gray-700 text-sm mb-3">{editingUscita ? 'Modifica Uscita' : 'Nuova Uscita'}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="label">Categoria *</label>
                        <select className="input" value={uscitaForm.categoria} onChange={e => setUscitaForm(p => ({ ...p, categoria: e.target.value }))}>
                          <option value="">Seleziona…</option>
                          {CATEGORIE_USCITA.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">Descrizione</label>
                        <input className="input" value={uscitaForm.descrizione} onChange={e => setUscitaForm(p => ({ ...p, descrizione: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Importo * (€)</label>
                        <input type="number" step="0.01" className="input" value={uscitaForm.importo} onChange={e => setUscitaForm(p => ({ ...p, importo: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Fornitore</label>
                        <input className="input" value={uscitaForm.fornitore} onChange={e => setUscitaForm(p => ({ ...p, fornitore: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Note</label>
                        <input className="input" value={uscitaForm.note} onChange={e => setUscitaForm(p => ({ ...p, note: e.target.value }))} />
                      </div>
                      <div className="flex items-end pb-1">
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                          <input type="checkbox" checked={uscitaForm.pagata} onChange={e => setUscitaForm(p => ({ ...p, pagata: e.target.checked }))} />
                          Già pagata
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <button onClick={() => { setShowUscitaForm(false); setEditingUscita(null); setUscitaForm(emptyUscita) }}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Annulla</button>
                      <button onClick={handleSaveUscita}
                        className="px-3 py-1.5 bg-yellow-400 text-gray-900 rounded-lg font-semibold text-sm hover:bg-yellow-500">Salva</button>
                    </div>
                  </div>
                )}

                {usciteVarie.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Nessuna uscita registrata in questo mese.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase">Categoria</th>
                          <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase">Descrizione</th>
                          <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase">Fornitore</th>
                          <th className="text-right py-2 px-3 text-xs font-bold text-gray-500 uppercase">Importo</th>
                          <th className="text-center py-2 px-3 text-xs font-bold text-gray-500 uppercase">Pagata</th>
                          <th className="py-2 px-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {usciteVarie.map(u => (
                          <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 group">
                            <td className="py-2.5 px-3">
                              <span className="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded-full font-medium">{categUscitaMap[u.categoria] || u.categoria}</span>
                            </td>
                            <td className="py-2.5 px-3 text-sm text-gray-700">{u.descrizione || '—'}</td>
                            <td className="py-2.5 px-3 text-sm text-gray-500">{u.fornitore || '—'}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-red-700">€{parseFloat(u.importo).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-center">
                              <button onClick={() => handleTogglePagataUscita(u.id, u.pagata)} className={u.pagata ? 'text-green-600' : 'text-gray-400'}>
                                {u.pagata ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                              </button>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => {
                                  setEditingUscita(u)
                                  setUscitaForm({ categoria: u.categoria, descrizione: u.descrizione || '', importo: u.importo, fornitore: u.fornitore || '', note: u.note || '', pagata: u.pagata })
                                  setShowUscitaForm(true)
                                }} className="p-1 hover:bg-yellow-50 text-yellow-600 rounded"><Edit className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDeleteUscita(u.id)} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-200">
                          <td colSpan={3} className="py-2 px-3 text-sm font-bold text-gray-700">Totale Uscite Varie</td>
                          <td className="py-2 px-3 text-right font-bold text-red-700">€{totUsciteVarie.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showFatturaForm && (
        <Modal
          title="Registra Fattura Emessa"
          subtitle="Collega la fattura a una fee collaborazione, a un versamento creator o registrala come entrata manuale."
          onClose={() => { setShowFatturaForm(false); setFatturaForm(emptyFattura) }}
          maxWidth="max-w-3xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo *</label>
              <select className="input" value={fatturaForm.tipo} onChange={e => handleTipoFatturaChange(e.target.value)}>
                {TIPI_ENTRATA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {fatturaNeedsSource && (
              <div>
                <label className="label">
                  {fatturaForm.tipo === 'COLLAB'
                    ? 'Collaborazione da fatturare *'
                    : fatturaForm.tipo === 'RICORRENTE'
                    ? 'Contratto fisso da fatturare *'
                    : 'Versamento creator da fatturare *'}
                </label>
                <select
                  className="input"
                  value={getFatturaSourceValue()}
                  onChange={e => handleFatturaSourceChange(e.target.value)}
                  disabled={fatturaSourceOptions.length === 0}
                >
                  <option value="">
                    {fatturaSourceOptions.length === 0 ? 'Nessuna voce disponibile' : 'Seleziona...'}
                  </option>
                  {fatturaSourceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="label">Soggetto *</label>
              <input className="input" value={fatturaForm.soggettoNome} onChange={e => setFatturaForm(p => ({ ...p, soggettoNome: e.target.value }))} placeholder="Nome cliente / brand" />
            </div>
            <div>
              <label className="label">Importo * (€)</label>
              <input type="number" step="0.01" className="input" value={fatturaForm.importo} onChange={e => setFatturaForm(p => ({ ...p, importo: e.target.value }))} />
            </div>
            <div>
              <label className="label">N. Fattura</label>
              <input className="input" value={fatturaForm.numeroFattura} onChange={e => setFatturaForm(p => ({ ...p, numeroFattura: e.target.value }))} placeholder="es. 2026/001" />
            </div>
            <div>
              <label className="label">Data Fattura</label>
              <input type="date" className="input" value={fatturaForm.dataFattura} onChange={e => setFatturaForm(p => ({ ...p, dataFattura: e.target.value }))} />
            </div>
            <div>
              <label className="label">Link Documento</label>
              <input type="url" className="input" value={fatturaForm.linkDocumento} onChange={e => setFatturaForm(p => ({ ...p, linkDocumento: e.target.value }))} placeholder="Drive, OneDrive..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => { setShowFatturaForm(false); setFatturaForm(emptyFattura) }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Annulla</button>
            <button onClick={handleSaveFattura} disabled={!canSaveFattura}
              className={`px-4 py-2 rounded-lg font-semibold text-sm ${canSaveFattura ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>Registra</button>
          </div>
        </Modal>
      )}

    </div>
  )
}
