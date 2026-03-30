import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import CreatorForm from '../components/CreatorForm'
import CreatorDetail from '../components/CreatorDetail'
import { getAllCreators, createCreator, updateCreator, deleteCreator } from '../services/creatorService'
import { saveCreatorPiattaforme } from '../services/piattaformeService'
import { toast } from '../components/Toast'
import { confirm } from '../components/ConfirmModal'

export default function CreatorsPage() {
  const [creators, setCreators] = useState([])
  const [view, setView] = useState('list')
  const [selectedCreator, setSelectedCreator] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStato, setFilterStato] = useState('ALL')
  const [filterTier, setFilterTier] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Carica creator da Supabase
  useEffect(() => {
    loadCreators()
  }, [])

  const loadCreators = async () => {
    setLoading(true)
    const { data, error } = await getAllCreators()
    if (error) {
      setError('Errore nel caricamento dei creator')
      console.error(error)
    } else {
      setCreators(data || [])
    }
    setLoading(false)
  }

  const handleSave = async (creatorData, piattaforme) => {
    setLoading(true)

    if (selectedCreator) {
      const { error } = await updateCreator(selectedCreator.id, creatorData)
      if (error) {
        toast.error('Errore durante l\'aggiornamento del creator')
        console.error(error)
      } else {
        await saveCreatorPiattaforme(selectedCreator.id, piattaforme || [])
        await loadCreators()
        setView('list')
        setSelectedCreator(null)
      }
    } else {
      const { data, error } = await createCreator(creatorData)
      if (error) {
        toast.error('Errore durante la creazione del creator')
        console.error(error)
      } else {
        if (data?.id) {
          await saveCreatorPiattaforme(data.id, piattaforme || [])
        }
        await loadCreators()
        setView('list')
      }
    }

    setLoading(false)
  }

  const handleDelete = async (id) => {
    const ok = await confirm('Questa azione è irreversibile.', {
      title: 'Sei sicuro di voler eliminare questo creator?',
      confirmLabel: 'Elimina'
    })
    if (!ok) return
    
    setLoading(true)
    const { error } = await deleteCreator(id)
    
    if (error) {
      toast.error('Errore durante l\'eliminazione del creator')
      console.error(error)
    } else {
      await loadCreators()
    }
    
    setLoading(false)
  }

  const handleEdit = (creator) => {
    setSelectedCreator(creator)
    setView('edit')
  }

  const handleView = (creator) => {
    setSelectedCreator(creator)
    setView('detail')
  }

  const handleCancel = () => {
    setView('list')
    setSelectedCreator(null)
  }

  const filteredCreators = creators.filter(c => {
    const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.nomeCompleto && c.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStato = filterStato === 'ALL' || c.stato === filterStato
    const matchesTier  = filterTier === 'ALL' || c.tier === filterTier
    return matchesSearch && matchesStato && matchesTier
  })

  const TierBadge = ({ tier }) => {
    const colors = {
      NANO: 'bg-gray-100 text-gray-800',
      MICRO: 'bg-blue-100 text-blue-800',
      MID: 'bg-purple-100 text-purple-800',
      MEGA: 'bg-pink-100 text-pink-800',
      CELEBRITY: 'bg-pink-100 text-pink-800',
    }
    const labels = {
      NANO: 'Nano (5-10K)',
      MICRO: 'Micro (10-50K)',
      MACRO: 'Macro (100-500K)',
      MEGA: 'Mega (500K-3M)',
      CELEBRITY: 'Celebrity (3M+)',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[tier] || 'bg-gray-100 text-gray-800'}`}>
        {labels[tier] || tier || '-'}
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

  // VIEW: Lista
  if (view === 'list') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Creator</h1>
          <button
            onClick={() => setView('add')}
            className="flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Aggiungi Creator
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cerca creator per nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
            <select className="input sm:w-44" value={filterStato}
              onChange={(e) => setFilterStato(e.target.value)}>
              <option value="ALL">Tutti gli stati</option>
              <option value="1 Sotto contratto">Sotto Contratto</option>
              <option value="2 Proposta in carico">Proposta in Carico</option>
              <option value="3 Trattativa">Trattativa</option>
              <option value="4 Possibilità future">Possibilità future</option>
              <option value="5 Perso">Perso</option>
            </select>
            <select className="input sm:w-40" value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}>
              <option value="ALL">Tutti i tier</option>
              <option value="NANO">NANO</option>
              <option value="MICRO">MICRO</option>
              <option value="MACRO">MACRO</option>
              <option value="MEGA">MEGA</option>
              <option value="CELEBRITY">CELEBRITY</option>
            </select>
          </div>
        </div>

        <div className="card">
          {filteredCreators.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Nessun creator trovato' : 'Nessun creator presente'}
              </p>
              <button
                onClick={() => setView('add')}
                className="text-yellow-600 hover:text-yellow-700 font-semibold"
              >
                + Aggiungi il primo creator
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome Completo</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tier</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Topic</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Stato</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCreators.map((creator) => (
                    <tr key={creator.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{creator.nome}</td>
                      <td className="py-3 px-4 text-gray-600">{creator.nomeCompleto || '-'}</td>
                      <td className="py-3 px-4">
                        <TierBadge tier={creator.tier} />
                      </td>
                      <td className="py-3 px-4 text-gray-600">{creator.topic || '-'}</td>
                      <td className="py-3 px-4">
                        {creator.stato
                          ? <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">{creator.stato}</span>
                          : <span className="text-gray-400">-</span>
                        }
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleView(creator)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Visualizza"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(creator)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                            title="Modifica"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(creator.id)}
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

  // VIEW: Aggiungi/Modifica
  if (view === 'add' || view === 'edit') {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {view === 'add' ? 'Nuovo Creator' : 'Modifica Creator'}
        </h1>
        <div className="card">
          <CreatorForm
            creator={selectedCreator}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </div>
    )
  }

  // VIEW: Dettaglio
  if (view === 'detail' && selectedCreator) {
    return (
      <CreatorDetail
        creator={selectedCreator}
        onEdit={handleEdit}
        onBack={handleCancel}
      />
    )
  }

  return null
}
