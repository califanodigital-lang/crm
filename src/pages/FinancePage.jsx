import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAllCreators } from '../services/creatorService'
import { getAllRevenue, upsertRevenue, deleteRevenue, getMonthlyTotals } from '../services/revenueService'
import { DollarSign, TrendingUp, Calendar, Edit, Trash2, Plus } from 'lucide-react'

export default function FinancePage() {
  const { userProfile } = useAuth()
  const [creators, setCreators] = useState([])
  const [revenue, setRevenue] = useState([])
  const [monthlyTotals, setMonthlyTotals] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ creatorId: '', importo: '', fatturato: false })

  useEffect(() => {
    if (userProfile?.role === 'ADMIN') loadData()
  }, [userProfile])

  const loadData = async () => {
    setLoading(true)
    const [creatorsRes, revenueRes, totalsRes] = await Promise.all([
      getAllCreators(),
      getAllRevenue(),
      getMonthlyTotals()
    ])
    setCreators(creatorsRes.data || [])
    setRevenue(revenueRes.data || [])
    setMonthlyTotals(totalsRes.data || {})
    setLoading(false)
  }

  const handleSave = async () => {
    if (!formData.creatorId) return
    
    await upsertRevenue({
      creatorId: formData.creatorId,
      mese: `${selectedMonth}-01`,
      importo: formData.importo || 0,
      fatturato: formData.fatturato
    })
    
    setFormData({ creatorId: '', importo: '', fatturato: false })
    setEditingId(null)
    loadData()
  }

  const handleEdit = (rev) => {
    setEditingId(rev.id)
    setFormData({ 
      creatorId: rev.creatorId, 
      importo: rev.importo, 
      fatturato: rev.fatturato 
    })
  }

  const handleDelete = async (id) => {
    if (!confirm('Eliminare?')) return
    await deleteRevenue(id)
    loadData()
  }

  if (userProfile?.role !== 'ADMIN') {
    return <div className="card"><p>Accesso negato - Solo Admin</p></div>
  }

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div></div>
  }

  const currentMonthRevenue = revenue.filter(r => r.mese?.startsWith(selectedMonth))
  const totalMonth = currentMonthRevenue.reduce((sum, r) => sum + parseFloat(r.importo || 0), 0)

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Finance - Revenue Mensile</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Totale Mese</p>
              <p className="text-2xl font-bold text-gray-900">€{totalMonth.toLocaleString()}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Creator Attivi</p>
              <p className="text-2xl font-bold text-gray-900">{currentMonthRevenue.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Media per Creator</p>
              <p className="text-2xl font-bold text-gray-900">
                €{currentMonthRevenue.length > 0 ? Math.round(totalMonth / currentMonthRevenue.length) : 0}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Selettore Mese */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <label className="font-semibold">Mese:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input w-auto"
          />
        </div>
      </div>

      {/* Form Nuovo/Modifica */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4">Aggiungi Revenue</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={formData.creatorId}
            onChange={(e) => setFormData({...formData, creatorId: e.target.value})}
            className="input"
          >
            <option value="">Seleziona Creator...</option>
            {creators.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            placeholder="Importo €"
            value={formData.importo}
            onChange={(e) => setFormData({...formData, importo: e.target.value})}
            className="input"
          />
          <label className="flex items-center gap-2 px-4 py-2 border rounded-lg">
            <input
              type="checkbox"
              checked={formData.fatturato}
              onChange={(e) => setFormData({...formData, fatturato: e.target.checked})}
            />
            Fatturato
          </label>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500"
          >
            {editingId ? 'Aggiorna' : 'Aggiungi'}
          </button>
        </div>
      </div>

      {/* Tabella */}
      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">Creator</th>
              <th className="text-right py-3 px-4">Importo</th>
              <th className="text-center py-3 px-4">Fatturato</th>
              <th className="text-right py-3 px-4">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {currentMonthRevenue.map((r) => (
              <tr key={r.id} className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium">{r.creatorNome}</td>
                <td className="py-3 px-4 text-right font-semibold">€{parseFloat(r.importo).toLocaleString()}</td>
                <td className="py-3 px-4 text-center">
                  {r.fatturato ? <span className="text-green-600">✓</span> : <span className="text-gray-300">—</span>}
                </td>
                <td className="py-3 px-4 text-right">
                  <button onClick={() => handleEdit(r)} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 font-bold">
              <td className="py-3 px-4">TOTALE</td>
              <td className="py-3 px-4 text-right text-xl">€{totalMonth.toLocaleString()}</td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
