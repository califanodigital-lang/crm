import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, DollarSign, Calendar, CheckCircle, XCircle, Archive, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { formatDate } from '../utils/date'
import { getDefaultMonthlyRange, isDateInRange, isDateRangeDisabled } from '../utils/dateRange'
import CollaborationForm from '../components/CollaborationForm'
import DateRangeFilter from '../components/DateRangeFilter'
import { 
  getAllCollaborations, 
  createCollaboration, 
  updateCollaboration, 
  deleteCollaboration,
  getCollaborationStats 
} from '../services/collaborationService'
import { getAllCreators } from '../services/creatorService'
import { getAllBrands } from '../services/brandService'
import { toast } from '../components/Toast'
import { confirm } from '../components/ConfirmModal'
import { getStatoCollaborazione } from '../constants/constants'
import { useAuth } from '../contexts/AuthContext'


export default function CollaborationsPage() {
  const location = useLocation()
  const [collaborations, setCollaborations] = useState([])
  const [creators, setCreators] = useState([])
  const [brands, setBrands] = useState([])
  const [view, setView] = useState('list')
  const [selectedCollaboration, setSelectedCollaboration] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterAssegnatario, setFilterAssegnatario] = useState('ALL')
  const [agenti, setAgenti] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, inCorso: 0, completate: 0, totalRevenue: 0 })
  const [prefilledData, setPrefilledData] = useState(null)
  const { userProfile } = useAuth()
  const isAgent = userProfile?.role === 'AGENT'
  const [pagamentoModal, setPagamentoModal] = useState(null)
  const [mostraArchivio, setMostraArchivio] = useState(false)
  const [sortField, setSortField] = useState('stato')
  const [sortDir, setSortDir] = useState('asc')
  const [dateRange, setDateRange] = useState(() => getDefaultMonthlyRange())


  // Gestisci pre-riempimento da altre pagine

  useEffect(() => {
    if (isAgent && userProfile?.agenteNome) {
      setFilterAssegnatario(userProfile.agenteNome)
    }
  }, [isAgent, userProfile])

  useEffect(() => {
    if (location.state?.preselectedCreator) {
      setPrefilledData({ creatorId: location.state.preselectedCreator })
      setView('add')
    } else if (location.state?.preselectedBrand) {
      setPrefilledData({ brandNome: location.state.preselectedBrand })
      setView('add')
    }
  }, [location.state])

  useEffect(() => {
    import('../services/userService').then(({ getActiveAgents }) => {
      getActiveAgents().then(({ data }) => setAgenti(data || []))
    })
  }, [])

  // Carica dati da Supabase
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    
    const [collabRes, creatorsRes, brandsRes, statsRes] = await Promise.all([
      getAllCollaborations(),
      getAllCreators(),
      getAllBrands(),        // <-- AGGIUNGI
      getCollaborationStats()
    ])
    
    setCollaborations(collabRes.data || [])
    setCreators(creatorsRes.data || [])
    setBrands(brandsRes.data || [])   // <-- AGGIUNGI
    if (statsRes.data) setStats(statsRes.data)
    
    setLoading(false)
  }

  const handleTogglePagato = async (tipo, valore, data, updatedTranche = null) => {
    const collab = collaborations.find(c => c.id === pagamentoModal.id)
    let payload = {}

    if (updatedTranche !== null) {
      const allPaid = updatedTranche.every(t => t.pagato)
      const lastDate = [...updatedTranche].reverse().find(t => t.pagato)?.data || null
      payload = { tranche: updatedTranche, pagato: allPaid, dataPagamentoCreator: allPaid ? (lastDate || null) : collab.dataPagamentoCreator }
    } else if (tipo === 'creator') {
      payload = { pagato: valore, dataPagamentoCreator: data || null }
    } else {
      payload = { pagato_agency: valore, dataPagamentoAgency: data || null }
    }

    const newPagato = 'pagato' in payload ? payload.pagato : (collab.pagato || false)
    const newPagatoAgency = 'pagato_agency' in payload ? payload.pagato_agency : (collab.pagato_agency || false)

    const wasCompleted = collab.stato === 'COMPLETATA'
    if (newPagato && newPagatoAgency) {
      payload.stato = 'COMPLETATA'
    } else if (newPagatoAgency && !newPagato && !['COMPLETATA', 'ANNULLATA'].includes(collab.stato)) {
      payload.stato = 'ATTESA_PAGAMENTO_CREATOR'
    } else if (newPagato && !newPagatoAgency && !['COMPLETATA', 'ANNULLATA'].includes(collab.stato)) {
      payload.stato = 'ATTESA_PAGAMENTO_AGENCY'
    }

    await updateCollaboration(collab.id, { ...collab, ...payload })
    setPagamentoModal(null)
    if (payload.stato === 'COMPLETATA' && !wasCompleted) {
      toast.success('Tutti i pagamenti registrati — collaborazione completata!')
    }
    loadData()
  }

  const handleSave = async (collaborationData) => {
    setLoading(true)
    
    if (selectedCollaboration) {
      // Update
      const { error } = await updateCollaboration(selectedCollaboration.id, collaborationData)
      if (error) {
        toast.error('Errore durante l\'aggiornamento della collaborazione')
        console.error(error)
      } else {
        await loadData()
        setView('list')
        setSelectedCollaboration(null)
        setPrefilledData(null)
      }
    } else {
      // Create
      const { error } = await createCollaboration(collaborationData)
      if (error) {
        toast.error('Errore durante la creazione della collaborazione')
        console.error(error)
      } else {
        await loadData()
        setView('list')
        setPrefilledData(null)
      }
    }
    
    setLoading(false)
  }

  const handleDelete = async (id) => {
    const ok = await confirm('Questa azione è irreversibile.', {
      title: 'Sei sicuro di voler eliminare questa collaborazione?',
      confirmLabel: 'Elimina'
    })
    if (!ok) return
    
    setLoading(true)
    const { error } = await deleteCollaboration(id)
    
    if (error) {
      toast.error('Errore durante l\'eliminazione della collaborazione')
      console.error(error)
    } else {
      await loadData()
    }
    
    setLoading(false)
  }

  const handleEdit = (collaboration) => {
    setSelectedCollaboration(collaboration)
    setView('edit')
  }

  const handleCancel = () => {
    setView('list')
    setSelectedCollaboration(null)
    setPrefilledData(null)
  }

  const STATI_ARCHIVIO = ['COMPLETATA', 'ANNULLATA']
  const STATO_ORDER = { IN_LAVORAZIONE: 0, ATTESA_PAGAMENTO_CREATOR: 1, ATTESA_PAGAMENTO_AGENCY: 2, COMPLETATA: 3, ANNULLATA: 4 }

  const filteredCollaborations = collaborations.filter(c => {
    if (mostraArchivio) {
      if (!STATI_ARCHIVIO.includes(c.stato)) return false
    } else {
      if (STATI_ARCHIVIO.includes(c.stato)) return false
    }
    const matchesSearch = c.creatorNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.brandNome?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'ALL' || c.stato === filterStatus
    const matchesAgente = filterAssegnatario === 'ALL' || (c.assegnatario || []).includes(filterAssegnatario)
    const matchesDate = isDateRangeDisabled(dateRange)
      ? true
      : isDateInRange(c.dataFirma || c.createdAt, dateRange.start, dateRange.end)
    return matchesSearch && matchesStatus && matchesAgente && matchesDate
  })

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const sortedCollaborations = [...filteredCollaborations].sort((a, b) => {
    let cmp = 0
    if (sortField === 'stato') {
      cmp = (STATO_ORDER[a.stato] ?? 99) - (STATO_ORDER[b.stato] ?? 99)
    } else if (sortField === 'creator') {
      cmp = (a.creatorNome || '').localeCompare(b.creatorNome || '')
    } else if (sortField === 'brand') {
      cmp = (a.brandNome || '').localeCompare(b.brandNome || '')
    } else if (sortField === 'pagamento') {
      cmp = (parseFloat(a.pagamento) || 0) - (parseFloat(b.pagamento) || 0)
    } else if (sortField === 'adv') {
      cmp = (a.adv || '').localeCompare(b.adv || '')
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 opacity-40" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-yellow-500" />
      : <ChevronDown className="w-3 h-3 text-yellow-500" />
  }
  const SortTh = ({ field, children, className = 'text-left' }) => (
    <th
      className={`py-3 px-4 font-semibold text-gray-700 cursor-pointer select-none hover:text-gray-900 transition-colors ${className}`}
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">{children}<SortIcon field={field} /></span>
    </th>
  )

    const StatusBadge = ({ status }) => {
      const cfg = getStatoCollaborazione(status)
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
          {cfg.label}
        </span>
      )
    }
  // Loading state
  if (loading && view === 'list') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  if (view === 'list') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {mostraArchivio ? 'Archivio Collaborazioni' : 'Collaborazioni'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {mostraArchivio
                ? 'Collaborazioni completate o annullate'
                : 'Il flusso standard prevede la creazione dalla sezione Trattative dopo il contratto firmato.'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setMostraArchivio(v => !v); setFilterStatus('ALL') }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold border transition-colors ${mostraArchivio ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <Archive className="w-4 h-4" />
              {mostraArchivio ? 'Torna alle attive' : 'Archivio Collab'}
            </button>
            {!mostraArchivio && (
              <button
                onClick={() => setView('add')}
                className="flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nuova Collaborazione (manuale)
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totali</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Corso</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inCorso}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completate}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valore Deal Pagati</p>
                <p className="text-2xl font-bold text-gray-900">€{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col gap-3">
            <DateRangeFilter
              value={dateRange}
              onChange={setDateRange}
              label="Periodo collaborazioni"
              hint="Default: dal primo giorno del mese al primo del mese successivo. Il filtro usa la data firma, con fallback alla data di creazione se manca."
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-3 text-gray-400 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cerca per creator o brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
              <select className="input sm:w-44" value={filterAssegnatario}
                onChange={(e) => setFilterAssegnatario(e.target.value)}>
                <option value="ALL">Tutti gli assegnatari</option>
                {agenti.map(a => (
                  <option key={a.id} value={a.agenteNome}>{a.nomeCompleto}</option>
                ))}
              </select>
              <select className="input sm:w-48" value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="ALL">Tutti gli stati</option>
                <option value="IN_LAVORAZIONE">In Lavorazione</option>
                <option value="ATTESA_PAGAMENTO_CREATOR">Attesa Pagamento Creator</option>
                <option value="ATTESA_PAGAMENTO_AGENCY">Attesa Pagamento Agency</option>
                <option value="COMPLETATA">Completata</option>
                <option value="ANNULLATA">Annullata</option>
              </select>
            </div>
          </div>
        </div>
        {/* Table */}
        <div className="card">
          {filteredCollaborations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchTerm || filterStatus !== 'ALL' ? 'Nessuna collaborazione trovata' : 'Nessuna collaborazione presente'}
              </p>
              <button
                onClick={() => setView('add')}
                className="text-yellow-600 hover:text-yellow-700 font-semibold"
              >
                + Aggiungi la prima collaborazione
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <SortTh field="creator">Creator</SortTh>
                    <SortTh field="brand">Brand</SortTh>
                    <SortTh field="adv">Tipo ADV</SortTh>
                    <SortTh field="pagamento">Pagamento</SortTh>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Data Firma</th>
                    <SortTh field="stato">Stato</SortTh>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Pagato Creator</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Pagata Agency</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCollaborations.map((collab) => (
                    <tr key={collab.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{collab.creatorNome}</td>
                      <td className="py-3 px-4 text-gray-600">{collab.brandNome}</td>
                      <td className="py-3 px-4 text-gray-600">{collab.adv || '-'}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        €{collab.pagamento ? parseFloat(collab.pagamento).toLocaleString() : '0'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {formatDate(collab.dataFirma) || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={collab.stato} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => setPagamentoModal({ id: collab.id, tipo: 'creator', currentValue: collab.pagato, dataAttuale: collab.dataPagamentoCreator })}>
                          {(() => {
                            const tr = collab.tranche || []
                            if (tr.length > 1) {
                              const paid = tr.filter(t => t.pagato).length
                              if (paid === 0) return <XCircle className="w-5 h-5 text-gray-300 mx-auto hover:text-gray-400" />
                              if (paid < tr.length) return <CheckCircle className="w-5 h-5 text-yellow-500 mx-auto" title={`${paid}/${tr.length} tranches pagate`} />
                              return <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                            }
                            return collab.pagato
                              ? <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                              : <XCircle className="w-5 h-5 text-gray-300 mx-auto hover:text-gray-400" />
                          })()}
                        </button>
                      </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => setPagamentoModal({ id: collab.id, tipo: 'agency', currentValue: collab.pagato_agency, dataAttuale: collab.dataPagamentoAgency })}>
                        {collab.pagato_agency
                          ? <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          : <XCircle className="w-5 h-5 text-gray-300 mx-auto hover:text-gray-400" />}
                      </button>
                    </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(collab)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                            title="Modifica"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(collab.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Elimina"
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        {pagamentoModal && <PagamentoDateModal
          modal={pagamentoModal}
          collab={collaborations.find(c => c.id === pagamentoModal.id)}
          onConfirm={handleTogglePagato}
          onClose={() => setPagamentoModal(null)}
        />}
        </div>
      </div>
    )
  }

  // View: Add/Edit
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {view === 'add' ? 'Nuova Collaborazione' : 'Modifica Collaborazione'}
      </h1>
      <div className="card">
        <CollaborationForm
          collaboration={selectedCollaboration || prefilledData}
          creators={creators}
          brands={brands}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>

  )
}

function PagamentoDateModal({ modal, collab, onConfirm, onClose }) {
  const today = new Date().toISOString().split('T')[0]
  const [data, setData] = useState(modal.dataAttuale || today)
  const nuovoValore = !modal.currentValue
  const hasTranche = modal.tipo === 'creator' && (collab?.tranche?.length > 1)
  const [trancheState, setTrancheState] = useState(
    hasTranche ? collab.tranche.map(t => ({ ...t })) : []
  )

  if (hasTranche) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
          <h3 className="text-base font-bold text-gray-900 mb-1">Tranches pagamento creator</h3>
          <p className="text-sm text-gray-400 mb-4">Segna le singole tranches come pagate</p>
          <div className="space-y-3 mb-5">
            {trancheState.map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={t.pagato}
                  onChange={(e) => {
                    const updated = [...trancheState]
                    updated[i] = { ...updated[i], pagato: e.target.checked, data: e.target.checked ? (updated[i].data || today) : null }
                    setTrancheState(updated)
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700 w-24 shrink-0">
                  Tranche {i + 1}{t.importo ? ` — €${t.importo}` : ''}
                </span>
                {t.pagato && (
                  <input
                    type="date"
                    className="input text-xs py-1"
                    value={t.data || today}
                    onChange={(e) => {
                      const updated = [...trancheState]
                      updated[i] = { ...updated[i], data: e.target.value }
                      setTrancheState(updated)
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Annulla</button>
            <button
              onClick={() => onConfirm('creator', null, null, trancheState)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-green-500 hover:bg-green-600"
            >Salva</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <h3 className="text-base font-bold text-gray-900 mb-1">
          {nuovoValore ? 'Segna come pagato' : 'Rimuovi pagamento'}
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          {modal.tipo === 'creator' ? 'Pagamento Creator' : 'Pagamento Agency'}
        </p>
        {nuovoValore && (
          <div className="mb-4">
            <label className="label">Data pagamento</label>
            <input type="date" className="input" value={data}
              onChange={(e) => setData(e.target.value)} />
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
            Annulla
          </button>
          <button
            onClick={() => onConfirm(modal.tipo, nuovoValore, nuovoValore ? data : null)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white ${nuovoValore ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
            {nuovoValore ? 'Conferma pagamento' : 'Rimuovi'}
          </button>
        </div>
      </div>
    </div>
  )
}
