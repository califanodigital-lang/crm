import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAllCreators } from '../services/creatorService'
import { getAllRevenue, upsertRevenue, deleteRevenue, getMonthlyTotals } from '../services/revenueService'
import { CheckCircle, XCircle, FileText, ExternalLink, DollarSign, TrendingUp, Calendar, Edit, Trash2, Plus, AlertTriangle } from 'lucide-react'
import { getVersamentByMonth, upsertVersamento, toggleVerificato, deleteVersamento, getVersamentiStats } from '../services/versamentoService'
import { checkRevenueDiscrepancies } from '../services/revenueService'


export default function FinancePage() {
  const { userProfile } = useAuth()
  const [creators, setCreators] = useState([])
  const [revenue, setRevenue] = useState([])
  const [monthlyTotals, setMonthlyTotals] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ creatorId: '', importo: '', fatturato: false })
  const [activeTab, setActiveTab] = useState('revenue') // revenue | versamenti
  const [versamenti, setVersamenti] = useState([])
  const [versamentiStats, setVersamentiStats] = useState({})
  const [versamentoForm, setVersamentoForm] = useState({
    creatorId: '', tipoPagamento: '', importoVersato: '', numeroFattura: '', 
    dataFattura: '', linkFattura: '', verificato: false
  })
  const [discrepancies, setDiscrepancies] = useState([])


  useEffect(() => {
  if (userProfile?.role === 'ADMIN') {
    loadData()
    if (activeTab === 'revenue') {
      loadDiscrepancies()  // <-- AGGIUNGI questa chiamata
    }
  }
}, [userProfile, activeTab, selectedMonth])

  const loadData = async () => {
  setLoading(true)
  
  // Carica sempre creators
  const creatorsRes = await getAllCreators()
  setCreators(creatorsRes.data || [])
  
  // Carica dati in base al tab attivo
  if (activeTab === 'revenue') {
    const [revenueRes, totalsRes] = await Promise.all([
      getAllRevenue(),
      getMonthlyTotals()
    ])
    setRevenue(revenueRes.data || [])
    setMonthlyTotals(totalsRes.data || {})
  } else if (activeTab === 'versamenti') {
    const [versamentiRes, statsRes] = await Promise.all([
      getVersamentByMonth(`${selectedMonth}-01`),
      getVersamentiStats(`${selectedMonth}-01`)
    ])
    setVersamenti(versamentiRes.data || [])
    setVersamentiStats(statsRes.data || {})
  }
  
  setLoading(false)
}

  const loadDiscrepancies = async () => {
      const { data } = await checkRevenueDiscrepancies()
      setDiscrepancies(data || [])
    }

  const handleSaveVersamento = async () => {
    if (!versamentoForm.creatorId) return
    
    await upsertVersamento({
      ...versamentoForm,
      mese: `${selectedMonth}-01`
    })
    
    setVersamentoForm({
      creatorId: '', tipoPagamento: '', importoVersato: '', numeroFattura: '', 
      dataFattura: '', linkFattura: '', verificato: false
    })
    loadData()
  }

  const handleToggleVerificato = async (id, current) => {
    await toggleVerificato(id, current)
    loadData()
  }

  const handleDeleteVersamento = async (id) => {
    if (!confirm('Eliminare?')) return
    await deleteVersamento(id)
    loadData()
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
    return <div className="card"><p>Accesso negato - Solo Amministratori</p></div>
  }

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div></div>
  }

  const currentMonthRevenue = revenue.filter(r => r.mese?.startsWith(selectedMonth))
  const totalMonth = currentMonthRevenue.reduce((sum, r) => sum + parseFloat(r.importo || 0), 0)

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Finance</h1>

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

      {/* Warning Discrepanze */}
      {activeTab === 'revenue' && discrepancies.length > 0 && (
        <div className="card bg-yellow-50 border-yellow-200 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-2">
                ⚠️ Discrepanze Revenue Rilevate
              </h3>
              <p className="text-sm text-yellow-800 mb-3">
                Alcuni creator/mesi hanno sia revenue manuale che automatica (da collaborazioni). 
                Verifica se è corretto o elimina i duplicati.
              </p>
              <div className="space-y-2">
                {discrepancies.slice(0, 5).map((d, idx) => (
                  <div key={idx} className="text-sm bg-white rounded p-2 flex justify-between items-center">
                    <span className="font-medium text-gray-700">
                      Mese: {d.mese}
                    </span>
                    <div className="flex gap-4 text-xs">
                      <span className="text-blue-600">Auto: €{d.auto.toLocaleString()}</span>
                      <span className="text-purple-600">Manuale: €{d.manual.toLocaleString()}</span>
                      <span className="text-red-600 font-semibold">
                        Diff: €{Math.abs(d.auto - d.manual).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
                {discrepancies.length > 5 && (
                  <p className="text-xs text-yellow-700 text-center">
                    ... e altre {discrepancies.length - 5} discrepanze
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('revenue')}
            className={`pb-3 px-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'revenue'
                ? 'border-yellow-400 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Revenue Mensile
          </button>
          <button
            onClick={() => setActiveTab('versamenti')}
            className={`pb-3 px-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'versamenti'
                ? 'border-yellow-400 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Verifica Versamenti
          </button>
        </div>
      </div>

    {/* TAB CONTENT - SOSTITUISCI tutto dopo tabs con: */}
    {activeTab === 'revenue' && (
      <>
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
      </>
    )}

      {activeTab === 'versamenti' && (
    <>
      {/* Stats Versamenti */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <p className="text-sm text-gray-600">Totale</p>
          <p className="text-2xl font-bold text-gray-900">{versamentiStats.totale || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Verificati</p>
          <p className="text-2xl font-bold text-green-600">{versamentiStats.verificati || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Da Verificare</p>
          <p className="text-2xl font-bold text-red-600">{versamentiStats.daVerificare || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Importo Totale</p>
          <p className="text-2xl font-bold text-gray-900">€{(versamentiStats.importoTotale || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Form Nuovo Versamento */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4">Aggiungi Versamento</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select
            value={versamentoForm.creatorId}
            onChange={(e) => setVersamentoForm({...versamentoForm, creatorId: e.target.value})}
            className="input"
          >
            <option value="">Seleziona Creator...</option>
            {creators.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <input
            type="text"
            placeholder="Tipo Pagamento (F24, Ritenuta...)"
            value={versamentoForm.tipoPagamento}
            onChange={(e) => setVersamentoForm({...versamentoForm, tipoPagamento: e.target.value})}
            className="input"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Importo €"
            value={versamentoForm.importoVersato}
            onChange={(e) => setVersamentoForm({...versamentoForm, importoVersato: e.target.value})}
            className="input"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="N. Fattura"
            value={versamentoForm.numeroFattura}
            onChange={(e) => setVersamentoForm({...versamentoForm, numeroFattura: e.target.value})}
            className="input"
          />
          <input
            type="date"
            value={versamentoForm.dataFattura}
            onChange={(e) => setVersamentoForm({...versamentoForm, dataFattura: e.target.value})}
            className="input"
          />
          <input
            type="url"
            placeholder="Link Fattura (Drive, OneDrive...)"
            value={versamentoForm.linkFattura}
            onChange={(e) => setVersamentoForm({...versamentoForm, linkFattura: e.target.value})}
            className="input"
          />
          <button
            onClick={handleSaveVersamento}
            className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500"
          >
            Aggiungi
          </button>
        </div>
      </div>

      {/* Tabella Versamenti */}
      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">Creator</th>
              <th className="text-left py-3 px-4">Tipo</th>
              <th className="text-right py-3 px-4">Importo</th>
              <th className="text-left py-3 px-4">N. Fattura</th>
              <th className="text-left py-3 px-4">Data</th>
              <th className="text-center py-3 px-4">Fattura</th>
              <th className="text-center py-3 px-4">Status</th>
              <th className="text-right py-3 px-4">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {versamenti.map((v) => (
              <tr key={v.id} className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium">{v.creatorNome}</td>
                <td className="py-3 px-4 text-sm">{v.tipoPagamento || '-'}</td>
                <td className="py-3 px-4 text-right font-semibold">€{parseFloat(v.importoVersato).toLocaleString()}</td>
                <td className="py-3 px-4 text-sm">{v.numeroFattura || '-'}</td>
                <td className="py-3 px-4 text-sm">{v.dataFattura || '-'}</td>
                <td className="py-3 px-4 text-center">
                  {v.linkFattura ? (
                    <a href={v.linkFattura} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      <ExternalLink className="w-4 h-4 inline" />
                    </a>
                  ) : '-'}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => handleToggleVerificato(v.id, v.verificato)}
                    className={`p-1 rounded ${v.verificato ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {v.verificato ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </button>
                </td>
                <td className="py-3 px-4 text-right">
                  <button onClick={() => handleDeleteVersamento(v.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )}
    </div>
  )
}
