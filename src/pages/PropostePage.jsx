import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, TrendingUp, AlertCircle } from 'lucide-react'
import PropostaForm from '../components/PropostaForm'
import {
  getAllProposte,
  createProposta,
  updateProposta,
  deleteProposta,
  getProposteStats
} from '../services/propostaService'

export default function PropostePage() {
  const [proposte, setProposte] = useState([])
  const [view, setView] = useState('kanban') // kanban | table | add | edit
  const [selectedProposta, setSelectedProposta] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAgente, setFilterAgente] = useState('ALL')
  const [filterPriorita, setFilterPriorita] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const { data } = await getAllProposte()
    setProposte(data || [])
    
    const { data: statsData } = await getProposteStats()
    if (statsData) setStats(statsData)
    
    setLoading(false)
  }

  const handleSave = async (propostaData) => {
    setLoading(true)
    
    if (selectedProposta) {
      const { error } = await updateProposta(selectedProposta.id, propostaData)
      if (error) {
        alert('Errore durante l\'aggiornamento')
        console.error(error)
      }
    } else {
      const { error } = await createProposta(propostaData)
      if (error) {
        alert('Errore durante la creazione')
        console.error(error)
      }
    }
    
    await loadData()
    setView('kanban')
    setSelectedProposta(null)
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questa proposta?')) return
    
    setLoading(true)
    const { error } = await deleteProposta(id)
    if (error) {
      alert('Errore durante l\'eliminazione')
      console.error(error)
    } else {
      await loadData()
    }
    setLoading(false)
  }

  const handleEdit = (proposta) => {
    setSelectedProposta(proposta)
    setView('edit')
  }

  const filteredProposte = proposte.filter(p => {
    const matchesSearch = p.brandNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (p.settore && p.settore.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesAgente = filterAgente === 'ALL' || p.agente === filterAgente
    const matchesPriorita = filterPriorita === 'ALL' || p.priorita === filterPriorita
    return matchesSearch && matchesAgente && matchesPriorita
  })

  const agentiUnici = [...new Set(proposte.map(p => p.agente).filter(Boolean))]

  const PriorityBadge = ({ priority }) => {
    const colors = {
      BASSA: 'bg-gray-100 text-gray-800',
      NORMALE: 'bg-blue-100 text-blue-800',
      ALTA: 'bg-yellow-100 text-yellow-800',
      URGENTE: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[priority]}`}>
        {priority}
      </span>
    )
  }

  const PropostaCard = ({ proposta }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 flex-1">{proposta.brandNome}</h3>
        <PriorityBadge priority={proposta.priorita} />
      </div>
      
      {proposta.settore && (
        <p className="text-sm text-gray-600 mb-2">{proposta.settore}</p>
      )}
      
      {proposta.creatorSuggeriti && (
        <div className="text-xs text-blue-600 mb-2">
          👤 {proposta.creatorSuggeriti}
        </div>
      )}
      
      {proposta.agente && (
        <div className="text-xs text-gray-500 mb-3">
          📍 {proposta.agente}
        </div>
      )}
      
      <div className="flex gap-2">
        <button
          onClick={() => handleEdit(proposta)}
          className="flex-1 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          <Edit className="w-3 h-3 inline mr-1" />
          Modifica
        </button>
        <button
          onClick={() => handleDelete(proposta.id)}
          className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )

  const KanbanColumn = ({ title, stato, count }) => {
    const proposteColonna = filteredProposte.filter(p => p.stato === stato)
    
    return (
      <div className="flex-1 min-w-[280px]">
        <div className="bg-gray-100 p-3 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <span className="bg-white px-2 py-1 rounded text-sm font-semibold">{count}</span>
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded-b-lg min-h-[500px] space-y-3">
          {proposteColonna.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              Nessuna proposta
            </div>
          ) : (
            proposteColonna.map(p => <PropostaCard key={p.id} proposta={p} />)
          )}
        </div>
      </div>
    )
  }

  if (loading && view === 'kanban') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  if (view === 'add' || view === 'edit') {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {view === 'add' ? 'Nuova Proposta Brand' : 'Modifica Proposta'}
        </h1>
        <div className="card">
          <PropostaForm
            proposta={selectedProposta}
            onSave={handleSave}
            onCancel={() => {
              setView('kanban')
              setSelectedProposta(null)
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pipeline Proposte Brand</h1>
          <p className="text-gray-600 mt-1">Gestisci la pipeline commerciale</p>
        </div>
        <button
          onClick={() => setView('add')}
          className="flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuova Proposta
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Totale</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totale || 0}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Da Contattare</p>
              <p className="text-2xl font-bold text-gray-900">{stats.daContattare || 0}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Trattativa</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inTrattativa || 0}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Urgenti</p>
              <p className="text-2xl font-bold text-gray-900">{stats.urgenti || 0}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cerca brand o settore..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterAgente}
            onChange={(e) => setFilterAgente(e.target.value)}
            className="input"
          >
            <option value="ALL">Tutti gli agenti</option>
            {agentiUnici.map(agente => (
              <option key={agente} value={agente}>{agente}</option>
            ))}
          </select>

          <select
            value={filterPriorita}
            onChange={(e) => setFilterPriorita(e.target.value)}
            className="input"
          >
            <option value="ALL">Tutte le priorità</option>
            <option value="URGENTE">URGENTE</option>
            <option value="ALTA">ALTA</option>
            <option value="NORMALE">NORMALE</option>
            <option value="BASSA">BASSA</option>
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          <KanbanColumn 
            title="Da Contattare" 
            stato="DA_CONTATTARE"
            count={filteredProposte.filter(p => p.stato === 'DA_CONTATTARE').length}
          />
          <KanbanColumn 
            title="Contattato" 
            stato="CONTATTATO"
            count={filteredProposte.filter(p => p.stato === 'CONTATTATO').length}
          />
          <KanbanColumn 
            title="In Trattativa" 
            stato="IN_TRATTATIVA"
            count={filteredProposte.filter(p => p.stato === 'IN_TRATTATIVA').length}
          />
          <KanbanColumn 
            title="Chiuso Vinto" 
            stato="CHIUSO_VINTO"
            count={filteredProposte.filter(p => p.stato === 'CHIUSO_VINTO').length}
          />
          <KanbanColumn 
            title="Chiuso Perso" 
            stato="CHIUSO_PERSO"
            count={filteredProposte.filter(p => p.stato === 'CHIUSO_PERSO').length}
          />
        </div>
      </div>
    </div>
  )
}
