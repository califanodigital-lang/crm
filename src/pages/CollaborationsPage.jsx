import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, DollarSign, Calendar, CheckCircle, XCircle } from 'lucide-react'
import CollaborationForm from '../components/CollaborationForm'
import { 
  getAllCollaborations, 
  createCollaboration, 
  updateCollaboration, 
  deleteCollaboration,
  getCollaborationStats 
} from '../services/collaborationService'
import { getAllCreators } from '../services/creatorService'
import { getAllBrands } from '../services/brandService'

export default function CollaborationsPage() {
  const location = useLocation()
  const [collaborations, setCollaborations] = useState([])
  const [creators, setCreators] = useState([])
  const [brands, setBrands] = useState([])
  const [view, setView] = useState('list')
  const [selectedCollaboration, setSelectedCollaboration] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, inCorso: 0, completate: 0, totalRevenue: 0 })
  const [prefilledData, setPrefilledData] = useState(null)

  // Gestisci pre-riempimento da altre pagine
  useEffect(() => {
    if (location.state?.preselectedCreator) {
      setPrefilledData({ creatorId: location.state.preselectedCreator })
      setView('add')
    } else if (location.state?.preselectedBrand) {
      setPrefilledData({ brandNome: location.state.preselectedBrand })
      setView('add')
    }
  }, [location.state])

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

  const handleSave = async (collaborationData) => {
    setLoading(true)
    
    if (selectedCollaboration) {
      // Update
      const { error } = await updateCollaboration(selectedCollaboration.id, collaborationData)
      if (error) {
        alert('Errore durante l\'aggiornamento della collaborazione')
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
        alert('Errore durante la creazione della collaborazione')
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
    if (!confirm('Sei sicuro di voler eliminare questa collaborazione?')) return
    
    setLoading(true)
    const { error } = await deleteCollaboration(id)
    
    if (error) {
      alert('Errore durante l\'eliminazione della collaborazione')
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

  const filteredCollaborations = collaborations.filter(c => {
    const matchesSearch = c.creatorNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.brandNome?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'ALL' || c.stato === filterStatus
    return matchesSearch && matchesStatus
  })

  const StatusBadge = ({ status }) => {
    const config = {
      IN_TRATTATIVA:   { bg: 'bg-yellow-100',  text: 'text-yellow-800',  label: 'In Trattativa' },
      FIRMATO:         { bg: 'bg-blue-100',     text: 'text-blue-800',    label: 'Firmato' },
      IN_CORSO:        { bg: 'bg-purple-100',   text: 'text-purple-800',  label: 'In Corso' },
      REVISIONE_VIDEO: { bg: 'bg-orange-100',   text: 'text-orange-800',  label: 'Revisione Video' },
      VIDEO_PUBBLICATO:{ bg: 'bg-indigo-100',   text: 'text-indigo-800',  label: 'Video Pubblicato' },
      ATTESA_PAGAMENTO:{ bg: 'bg-pink-100',     text: 'text-pink-800',    label: 'Attesa Pagamento' },
      COMPLETATO:      { bg: 'bg-green-100',    text: 'text-green-800',   label: 'Completato' },
      ANNULLATO:       { bg: 'bg-red-100',      text: 'text-red-800',     label: 'Annullato' },
    }
    const { bg, text, label } = config[status] || config.IN_TRATTATIVA
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>{label}</span>
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
          <h1 className="text-3xl font-bold text-gray-900">Collaborazioni</h1>
          <button
            onClick={() => setView('add')}
            className="flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuova Collaborazione
          </button>
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
                <p className="text-sm text-gray-600">Revenue</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cerca per creator o brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input"
            >
              <option value="ALL">Tutti gli stati</option>
              <option value="IN_TRATTATIVA">In Trattativa</option>
              <option value="FIRMATO">Firmato</option>
              <option value="IN_CORSO">In Corso</option>
              <option value="REVISIONE_VIDEO">Revisione Video</option>
              <option value="VIDEO_PUBBLICATO">Video Pubblicato</option>
              <option value="ATTESA_PAGAMENTO">Attesa Pagamento</option>
              <option value="COMPLETATO">Completato</option>
              <option value="ANNULLATO">Annullato</option>
            </select>
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
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Creator</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Brand</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo ADV</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Pagamento</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Stato</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Pagato</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCollaborations.map((collab) => (
                    <tr key={collab.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{collab.creatorNome}</td>
                      <td className="py-3 px-4 text-gray-600">{collab.brandNome}</td>
                      <td className="py-3 px-4 text-gray-600">{collab.adv || '-'}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        €{collab.pagamento ? parseFloat(collab.pagamento).toLocaleString() : '0'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={collab.stato} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        {collab.pagato ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
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
