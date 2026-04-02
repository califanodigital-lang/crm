import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import BrandForm from '../components/BrandForm'
import BrandDetail from '../components/BrandDetail'
import { getAllBrands, createBrand, updateBrand, deleteBrand } from '../services/brandService'
import { toast } from '../components/Toast'
import { confirm } from '../components/ConfirmModal'

export default function BrandsPage() {
  const [brands, setBrands] = useState([])
  const [view, setView] = useState('list')
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterEsito, setFilterEsito] = useState('ALL')

  // Carica brand da Supabase
  useEffect(() => {
    loadBrands()
  }, [])

  const loadBrands = async () => {
    setLoading(true)
    const [brandsRes] = await Promise.all([
      getAllBrands(),
    ])
    
    if (brandsRes.error) {
      setError('Errore nel caricamento dei brand')
      console.error(brandsRes.error)
    } else {
      setBrands(brandsRes.data || [])
    }
    
    setLoading(false)
  }

  const handleSave = async (brandData) => {
    setLoading(true)
    
    if (selectedBrand) {
      // Update
      const { data, error } = await updateBrand(selectedBrand.id, brandData)
      if (error) {
        toast.error('Errore durante l\'aggiornamento del brand')
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
        toast.error('Errore durante la creazione del brand')
        console.error(error)
      } else {
        await loadBrands()
        setView('list')
      }
    }
    
    setLoading(false)
  }

  const handleDelete = async (id) => {
    const ok = await confirm('Questa azione è irreversibile.', {
      title: 'Sei sicuro di voler eliminare questo brand?',
      confirmLabel: 'Elimina'
    })
    if (!ok) return
    
    setLoading(true)
    const { error } = await deleteBrand(id)
    
    if (error) {
      toast.error('Errore durante l\'eliminazione del brand')
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
    const matchesEsito =
      filterEsito === 'ALL' ||
      (filterEsito === 'POSITIVO' && b.ultimoEsito === 'POSITIVO') ||
      (filterEsito === 'NEGATIVO' && b.ultimoEsito === 'NEGATIVO') ||
      (filterEsito === 'MAI' && !b.ultimoEsito)
    return matchesSearch && matchesEsito
  })

  const getStatoBrand = (brand) => {
    if (!brand) return { label: 'N/D', style: 'bg-gray-100 text-gray-800' }
    if (brand.propostaId) return { label: 'Chiuso', style: 'bg-green-100 text-green-800' }
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
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-3 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Cerca brand per nome o settore..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
            <select className="input sm:w-44" value={filterEsito}
              onChange={(e) => setFilterEsito(e.target.value)}>
              <option value="ALL">Tutti i brand</option>
              <option value="POSITIVO">✓ Collaborazione chiusa</option>
              <option value="NEGATIVO">✗ Collaborazione persa</option>
              <option value="MAI">Nessuna collaborazione</option>
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
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBrands.map((brand) => (
                    <tr key={brand.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{brand.nome}</td>
                      <td className="py-3 px-4 text-gray-600">{brand.settore || '-'}</td>
                      <td className="py-3 px-4">
                        {brand.ultimoEsito === 'POSITIVO' && (
                          <div>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">✓ Collab. chiusa</span>
                            {brand.dataUltimaCollaborazione && (
                              <p className="text-xs text-gray-400 mt-0.5">{brand.dataUltimaCollaborazione}</p>
                            )}
                          </div>
                        )}
                        {brand.ultimoEsito === 'NEGATIVO' && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">✗ Rifiutata</span>
                        )}
                        {!brand.ultimoEsito && (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
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
