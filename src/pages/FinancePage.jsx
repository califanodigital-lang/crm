import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAllCreators } from '../services/creatorService'
import { getAllRevenue, upsertRevenue, deleteRevenue, getMonthlyTotals } from '../services/revenueService'
import { CheckCircle, XCircle, FileText, ExternalLink, DollarSign, TrendingUp, Calendar, Edit, Trash2, Plus, AlertTriangle } from 'lucide-react'
import { getVersamentByMonth, upsertVersamento, toggleVerificato, deleteVersamento, getVersamentiStats } from '../services/versamentoService'
import { checkRevenueDiscrepancies } from '../services/revenueService'
import { confirm } from '../components/ConfirmModal'
import { getPagamentiByMese, generaPagamentiMese, upsertPagamentoAgente } from '../services/pagamentiAgentiService'
import { getAllUsers } from '../services/userService'
import { getAllCollaborations } from '../services/collaborationService'
import { PagamentoRow } from '../components/PagamentoRow'
import { getAllAgentsStats } from '../services/agentService'
import { toast } from '../components/Toast'
import { supabase } from '../lib/supabase'
import {formatDate} from '../utils/date'

export default function FinancePage() {
  const { userProfile } = useAuth()
  const [creators, setCreators] = useState([])
  const [revenue, setRevenue] = useState([])
  const [monthlyTotals, setMonthlyTotals] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ creatorId: '', importo: '', fatturato: false })
  const [activeTab, setActiveTab] = useState('entrate') //'entrate' | 'incassato' | 'uscite'
  const [versamenti, setVersamenti] = useState([])
  const [versamentiStats, setVersamentiStats] = useState({})
  const [versamentoForm, setVersamentoForm] = useState({
    creatorId: '', tipoPagamento: '', importoVersato: '', numeroFattura: '', 
    dataFattura: '', linkFattura: '', verificato: false
  })
  const [discrepancies, setDiscrepancies] = useState([])
  const [pagamenti, setPagamenti] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [collabCompletate, setCollabCompletate] = useState([])



  useEffect(() => {
  if (userProfile?.role === 'ADMIN') {
    loadData()
    if (activeTab === 'entrate') {
      loadDiscrepancies()  // <-- AGGIUNGI questa chiamata
    }
  }
}, [userProfile, activeTab, selectedMonth])

  const loadData = async () => {
  setLoading(true)
  
  // Carica sempre creators
  const creatorsRes = await getAllCreators()
  setCreators(creatorsRes.data || [])
  
  if (activeTab === 'entrate') {
    const [collabRes, versamentiRes] = await Promise.all([
      getAllCollaborations(),
      getVersamentByMonth(`${selectedMonth}-01`),
    ])
    setCollabCompletate((collabRes.data || []).filter(c =>
      c.stato === 'COMPLETATA' && c.pagato &&
      c.dataFirma?.startsWith(selectedMonth)
    ))
    setVersamenti(versamentiRes.data || [])
  }
  if (activeTab === 'incassato') {
    const [versamentiRes, statsRes] = await Promise.all([
      getVersamentByMonth(`${selectedMonth}-01`),
      getVersamentiStats(`${selectedMonth}-01`)
    ])
    setVersamenti(versamentiRes.data || [])
    setVersamentiStats(statsRes.data || {})
  }
  if (activeTab === 'uscite') {
    const [pagRes, usersRes, statsRes] = await Promise.all([
      getPagamentiByMese(selectedMonth),
      getAllUsers(),
      getAllAgentsStats(selectedMonth)
    ])
    setAllUsers(usersRes.data || [])
    const statsMap = {}
    ;(statsRes.data || []).forEach(s => { statsMap[s.agente] = s.totalCommissioni || 0 })
    setPagamenti((pagRes.data || []).map(p => ({
      ...p,
      importoFee: statsMap[p.agenteNome] || 0,
      importoTotale: p.importoFisso + (statsMap[p.agenteNome] || 0),
      differenza: (p.importoFisso + (statsMap[p.agenteNome] || 0)) - p.importoPagato,
    })))
  }
    
  setLoading(false)
}

 const handlePagamento = async (agenteNome, importoPagato, importoFisso, importoTotale) => {
    await upsertPagamentoAgente({
      agenteNome,
      mese: selectedMonth,
      importoFisso,
      importoTotale,
      importoPagato: parseFloat(importoPagato),
    })
    // Ricarica e riarricchisci con le fee
    const [pagRes, statsRes] = await Promise.all([
      getPagamentiByMese(selectedMonth),
      getAllAgentsStats(selectedMonth)
    ])
    const statsMap = {}
    ;(statsRes.data || []).forEach(s => { statsMap[s.agente] = s.totalCommissioni || 0 })
    setPagamenti((pagRes.data || []).map(p => ({
      ...p,
      importoFee: statsMap[p.agenteNome] || 0,
      importoTotale: p.importoFisso + (statsMap[p.agenteNome] || 0),
      differenza: (p.importoFisso + (statsMap[p.agenteNome] || 0)) - p.importoPagato,
    })))
    toast.success('Pagamento registrato')
  }

  const handleGeneraMese = async () => {
    await generaPagamentiMese(selectedMonth, allUsers)
    const [pagRes, statsRes] = await Promise.all([
      getPagamentiByMese(selectedMonth),
      getAllAgentsStats(selectedMonth)
    ])
    const statsMap = {}
    ;(statsRes.data || []).forEach(s => { statsMap[s.agente] = s.totalCommissioni || 0 })
    setPagamenti((pagRes.data || []).map(p => ({
      ...p,
      importoFee: statsMap[p.agenteNome] || 0,
      importoTotale: p.importoFisso + (statsMap[p.agenteNome] || 0),
      differenza: (p.importoFisso + (statsMap[p.agenteNome] || 0)) - p.importoPagato,
    })))
    toast.success('Riepilogo generato')
  }

  const handleResetMese = async () => {
    const ok = await confirm(`Eliminare tutti i pagamenti di ${selectedMonth}?`, {
      title: 'Reset mese', confirmLabel: 'Elimina'
    })
    if (!ok) return
    await supabase.from('pagamenti_agenti').delete().eq('mese', selectedMonth)
    setPagamenti([])
    toast.success('Mese resettato')
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
    const ok = await confirm('Questa azione è irreversibile.', {
      title: 'Eliminare il versamento?',
      confirmLabel: 'Elimina'
    })
    if (!ok) return
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
    const ok = await confirm('Questa azione è irreversibile.', {
      title: 'Eliminare?',
      confirmLabel: 'Elimina'
    })
    if (!ok) return
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Finance</h1>
        <div>
          <label className="label">Mese di riferimento</label>
          <input type="month" className="input" value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)} />
        </div>
      </div>

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
      {activeTab === 'entrate' && discrepancies.length > 0 && (
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
      {[
        { key: 'entrate',  label: 'Entrate' },
        { key: 'incassato',label: 'Incassato' },
        { key: 'uscite',   label: 'Uscite Agenti' },
      ].map(t => (
        <button key={t.key} onClick={() => setActiveTab(t.key)}
          className={`pb-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === t.key
              ? 'border-yellow-400 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          {t.label}
        </button>
      ))}

    {/* TAB CONTENT - SOSTITUISCI tutto dopo tabs con: */}
    {activeTab === 'entrate' && (() => {
      const maturato = collabCompletate.reduce((s, c) => s + parseFloat(c.feeManagement || 0), 0)
      const incassato = versamenti.reduce((s, v) => s + parseFloat(v.importoVersato || 0), 0)
      const delta = maturato - incassato
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="card bg-blue-50 border-blue-100">
              <p className="text-sm font-medium text-blue-700 mb-1">Fee Maturate</p>
              <p className="text-2xl font-bold text-blue-900">€{maturato.toLocaleString()}</p>
              <p className="text-xs text-blue-500 mt-1">Da {collabCompletate.length} collaborazioni</p>
            </div>
            <div className="card bg-green-50 border-green-100">
              <p className="text-sm font-medium text-green-700 mb-1">Già Incassato</p>
              <p className="text-2xl font-bold text-green-900">€{incassato.toLocaleString()}</p>
            </div>
            <div className={`card border ${delta > 0 ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
              <p className={`text-sm font-medium mb-1 ${delta > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                {delta > 0 ? 'Crediti in Sospeso' : 'Tutto Incassato'}
              </p>
              <p className={`text-2xl font-bold ${delta > 0 ? 'text-orange-900' : 'text-green-900'}`}>
                {delta > 0 ? `€${delta.toLocaleString()}` : '✓'}
              </p>
            </div>
          </div>
          {collabCompletate.length > 0 && (
            <div className="card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-500">Creator</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-500">Brand</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-500">Pagamento Brand</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-500">Fee C3 (25%)</th>
                  </tr>
                </thead>
                <tbody>
                  {collabCompletate.map(c => (
                    <tr key={c.id} className="border-b border-gray-100">
                      <td className="py-2 px-4">{c.creatorNome}</td>
                      <td className="py-2 px-4">{c.brandNome}</td>
                      <td className="py-2 px-4 text-right">€{parseFloat(c.pagamento || 0).toLocaleString()}</td>
                      <td className="py-2 px-4 text-right font-semibold text-green-600">€{parseFloat(c.feeManagement || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )
    })()}

      {activeTab === 'incassato' && (
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
                    <td className="py-3 px-4 text-sm">{formatDate(v.dataFattura) || '-'}</td>
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
      {activeTab === 'uscite' && (
        <div className="card mt-6 overflow-hidden p-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Pagamenti Agenti — {formatDate(selectedMonth).replace("01/","")}</h2>
            {pagamenti.length > 0 && (
              <button onClick={handleResetMese}
                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200">
                Reset mese
              </button>
            )}
            <button onClick={handleGeneraMese}
              className="px-3 py-1.5 bg-yellow-400 text-gray-900 rounded-lg text-xs font-bold hover:bg-yellow-500">
              + Genera mese
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Agente</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Fisso</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Fee Mese</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Totale</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Pagato</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Differenza</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Stato</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {pagamenti.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400 text-sm">
                  Nessun pagamento per questo mese. Clicca "Genera mese" per creare le righe.
                </td></tr>
              ) : pagamenti.map(p => (
                <PagamentoRow key={p.id} pagamento={p} onSave={handlePagamento} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
