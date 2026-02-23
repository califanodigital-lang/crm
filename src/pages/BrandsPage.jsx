import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import BrandForm from '../components/BrandForm'
import BrandDetail from '../components/BrandDetail'
import { getAllBrands, createBrand, updateBrand, deleteBrand } from '../services/brandService'
import { getActiveAgents } from '../services/userService'

export default function BrandsPage() {
  const [brands, setBrands] = useState([])
  const [view, setView] = useState('list')
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [agenti, setAgenti] = useState([])
  const [filterAgente, setFilterAgente] = useState('ALL')

  // Carica brand da Supabase
  useEffect(() => {
    loadBrands()
  }, [])

  const loadBrands = async () => {
    setLoading(true)
    const [brandsRes, agentiRes] = await Promise.all([
      getAllBrands(),
      getActiveAgents()
    ])
    
    if (brandsRes.error) {
      setError('Errore nel caricamento dei brand')
      console.error(brandsRes.error)
    } else {
      setBrands(brandsRes.data || [])
    }
    
    setAgenti(agentiRes.data || [])
    setLoading(false)
  }

  const handleSave = async (brandData) => {
    setLoading(true)
    
    if (selectedBrand) {
      // Update
      const { data, error } = await updateBrand(selectedBrand.id, brandData)
      if (error) {
        alert('Errore durante l\'aggiornamento del brand')
        console.error(error)
      } else {
        await loadBrands()
        setView('list')
        setSelectedBrand(null)
      }
    } else {
      // Create
      const { data, error } = await createBrand(brandData)
      if (error) {
        alert('Errore durante la creazione del brand')
        console.error(error)
      } else {
        await loadBrands()
        setView('list')
      }
    }
    
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questo brand?')) return
    
    setLoading(true)
    const { error } = await deleteBrand(id)
    
    if (error) {
      alert('Errore durante l\'eliminazione del brand')
      console.error(error)
    } else {
      await loadBrands()
    }
    
    setLoading(false)
  }

  const handleEdit = (brand) => {
    setSelectedBrand(brand)
    setView('edit')
  }

  const handleView = (brand) => {
    setSelectedBrand(brand)
    setView('detail')
  }

  const handleCancel = () => {
    setView('list')
    setSelectedBrand(null)
  }

  const filteredBrands = brands.filter(b => {
    const matchesSearch = b.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (b.settore && b.settore.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesAgente = filterAgente === 'ALL' || b.agente === filterAgente
    return matchesSearch && matchesAgente
  })

  const getStatoBrand = (brand) => {
    if (!brand) return { label: 'N/D', style: 'bg-gray-100 text-gray-800' }
    if (brand.propostaId) return { label: 'Chiuso', style: 'bg-green-100 text-green-800' }
    if (brand.dataFollowup2) return { label: '2° Follow-up', style: 'bg-orange-100 text-orange-800' }
    if (brand.dataFollowup1) return { label: '1° Follow-up', style: 'bg-yellow-100 text-yellow-800' }
    if (brand.dataContatto) return { label: 'Contattato', style: 'bg-blue-100 text-blue-800' }
    // Fallback: brand censiti prima del nuovo sistema o senza date
    return { label: 'Contattato', style: 'bg-blue-100 text-blue-800' }
  }

  const StatusBadge = ({ brand }) => {
    const { label, style } = getStatoBrand(brand)
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${style}`}>{label}</span>
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
          <h1 className="text-3xl font-bold text-gray-900">Brand</h1>
          <button
            onClick={() => setView('add')}
            className="flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Aggiungi Brand
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cerca brand per nome o settore..."
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
              {agenti.map(a => (
                <option key={a.id} value={a.agenteNome}>{a.nomeCompleto}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card">
          {filteredBrands.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Nessun brand trovato' : 'Nessun brand presente'}
              </p>
              <button
                onClick={() => setView('add')}
                className="text-yellow-600 hover:text-yellow-700 font-semibold"
              >
                + Aggiungi il primo brand
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Settore</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Stato</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Agente</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBrands.map((brand) => (
                    <tr key={brand.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{brand.nome}</td>
                      <td className="py-3 px-4 text-gray-600">{brand.settore || '-'}</td>
                      <td className="py-3 px-4">
                        <StatusBadge brand={brand} />
                      </td>
                      <td className="py-3 px-4 text-gray-600">{brand.agente || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleView(brand)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Visualizza"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(brand)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                            title="Modifica"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(brand.id)}
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
          {view === 'add' ? 'Nuovo Brand' : 'Modifica Brand'}
        </h1>
        <div className="card">
          <BrandForm
            brand={selectedBrand}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </div>
    )
  }

  // VIEW: Dettaglio
  if (view === 'detail') {
    return (
      <BrandDetail
        brand={selectedBrand}
        onEdit={handleEdit}
        onBack={handleCancel}
      />
    )
  }
}
