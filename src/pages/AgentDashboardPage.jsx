// src/pages/AgentDashboardPage.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAllAgentsStats, getAgentStats, getAgentCollaborations } from '../services/agentService'
import { DollarSign, TrendingUp, Target, Award, ChevronDown, ChevronUp } from 'lucide-react'
import { getStatoCollaborazione } from '../constants/constants'
import { getPagamentiByMese, generaPagamentiMese, upsertPagamentoAgente } from '../services/pagamentiAgentiService'
import { getAllUsers } from '../services/userService'
import { toast } from '../components/Toast'
import { PagamentoRow } from '../components/PagamentoRow'
import { supabase } from '../lib/supabase'
import {formatDate} from '../utils/date'

// ── Badge stato ───────────────────────────────────────────────
function StatoBadge({ stato }) {
  const cfg = getStatoCollaborazione(stato)
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
}

// ── Riga agente espandibile ───────────────────────────────────
function AgentRow({ agent, index, selectedMonth }) {
  const [open, setOpen] = useState(false)
  const [collabs, setCollabs] = useState([])
  const [loading, setLoading] = useState(false)

  const handleExpand = async () => {
    if (!open && collabs.length === 0) {
      setLoading(true)
      const { data } = await getAgentCollaborations(agent.agente, selectedMonth)
      setCollabs(data || [])
      setLoading(false)
    }
    setOpen(o => !o)
  }

  return (
    <>
      <tr
        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={handleExpand}
      >
        <td className="py-3 px-4 font-bold text-gray-400">#{index + 1}</td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-black text-gray-900">{agent.agente?.[0]?.toUpperCase()}</span>
            </div>
            <span className="font-semibold text-gray-900">{agent.agente}</span>
          </div>
        </td>
        <td className="py-3 px-4 text-right text-sm">{agent.totalDealValue}</td>
        <td className="py-3 px-4 text-right text-sm">{agent.completati}</td>
        <td className="py-3 px-4 text-right font-bold text-green-600">
          €{agent.totalCommissioni.toLocaleString()}
        </td>
        <td className="py-3 px-4 text-right text-xs text-gray-500">€{(agent.commissioniRicerca || 0).toLocaleString()}</td>
        <td className="py-3 px-4 text-right text-xs text-gray-500">€{(agent.commissioniContatto || 0).toLocaleString()}</td>
        <td className="py-3 px-4 text-right text-xs text-gray-500">€{(agent.commissioniChiusura || 0).toLocaleString()}</td>
        <td className="py-3 px-4 text-right text-gray-400">
          {open ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
        </td>
      </tr>

      {open && (
        <tr className="border-b border-gray-100 bg-gray-50/50">
          <td colSpan={9} className="px-6 py-3">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-400" />
              </div>
            ) : collabs.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">Nessuna collaborazione per questo mese.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-200">
                    <th className="text-left pb-2 font-semibold">Creator</th>
                    <th className="text-left pb-2 font-semibold">Brand</th>
                    <th className="text-left pb-2 font-semibold">Ruolo</th>
                    <th className="text-left pb-2 font-semibold">Stato</th>
                    <th className="text-right pb-2 font-semibold">Pagamento</th>
                    <th className="text-right pb-2 font-semibold text-green-600">Sua Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {collabs.map(c => (
                    <tr key={c.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 text-gray-700">{c.creatorNome || '—'}</td>
                      <td className="py-2 font-medium text-gray-900">{c.brandNome}</td>
                      <td className="py-2">
                        {c.rolesLabel
                          ? <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{c.rolesLabel}</span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="py-2"><StatoBadge stato={c.stato} /></td>
                      <td className="py-2 text-right text-gray-600">€{c.pagamento.toLocaleString()}</td>
                      <td className="py-2 text-right font-semibold text-green-600">
                        {c.personalCommission > 0
                          ? `€${c.personalCommission.toLocaleString()}`
                          : <span className="text-gray-300 font-normal text-xs">non maturata</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

// ── PAGINA ────────────────────────────────────────────────────
export default function AgentDashboardPage() {
  const { userProfile } = useAuth()
  const [allAgents, setAllAgents] = useState([])
  const [myStats, setMyStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [pagamenti, setPagamenti] = useState([])
  const [allUsers, setAllUsers] = useState([])

  const isAdmin = userProfile?.role === 'ADMIN'

  useEffect(() => {
    loadData()
  }, [userProfile, selectedMonth])

  const loadData = async () => {
    setLoading(true)
    if (isAdmin) {
      const { data } = await getAllAgentsStats(selectedMonth)
      setAllAgents(data || [])
      const [pagRes, usersRes, statsRes] = await Promise.all([
        getPagamentiByMese(selectedMonth),
        getAllUsers(),
        getAllAgentsStats(selectedMonth)  // già importato
      ])
      setPagamenti(pagRes.data || [])
      setAllUsers(usersRes.data || [])
      // Arricchisci i pagamenti con le fee calcolate dagli agentStats
      const statsMap = {}
      ;(statsRes.data || []).forEach(s => { statsMap[s.agente] = s.totalCommissioni || 0 })
      setPagamenti((pagRes.data || []).map(p => ({
        ...p,
        importoFee: statsMap[p.agenteNome] || 0,
        importoTotale: p.importoFisso + (statsMap[p.agenteNome] || 0),
        differenza: (p.importoFisso + (statsMap[p.agenteNome] || 0)) - p.importoPagato,
      })))
    
    } else if (userProfile?.agenteNome) {
      const { data } = await getAgentStats(userProfile.agenteNome, selectedMonth)
      setMyStats(data)
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

  if (!userProfile) return null

  if (loading) return (
    <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400" />
    </div>
  )

  // ── VISTA AGENTE ──
  if (!isAdmin && myStats) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Le mie statistiche</h1>
          <p className="text-sm text-gray-400 mt-0.5">{userProfile.nomeCompleto}</p>
        </div>
        <div className="flex justify-end mb-6">
          <div>
            <label className="label">Mese</label>
            <input type="month" className="input" value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'I miei deal', value: myStats.totaleDeal, icon: Target, color: 'text-blue-600 bg-blue-100' },
            { label: 'Completati', value: myStats.completati, icon: Award, color: 'text-green-600 bg-green-100' },
            { label: 'In corso', value: myStats.inCorso, icon: TrendingUp, color: 'text-purple-600 bg-purple-100' },
            { label: 'Mie commissioni', value: `€${myStats.totalCommissioni.toLocaleString()}`, icon: DollarSign, color: 'text-yellow-600 bg-yellow-100' },
          ].map(s => (
            <div key={s.label} className="card flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <h2 className="text-base font-bold text-gray-900 mb-4">Dettaglio commissioni</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Ricerca (5%)', value: myStats.commissioniRicerca },
              { label: 'Contatto (10%)', value: myStats.commissioniContatto },
              { label: 'Chiusura (15%)', value: myStats.commissioniChiusura },
            ].map(s => (
              <div key={s.label} className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-lg font-bold text-gray-900">€{s.value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            Le commissioni maturano solo sulle collaborazioni con stato <strong>Completata</strong>
          </p>
        </div>
      </div>
    )
  }

  // ── VISTA ADMIN ──
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Agenti</h1>
          <p className="text-sm text-gray-400 mt-0.5">Clicca su un agente per vedere i dettagli</p>
        </div>
        <div>
          <label className="label">Mese di riferimento</label>
          <input type="month" className="input" value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Agente</th>
              <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Deal</th>
              <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Completati</th>
              <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Comm. Totali</th>
              <th className="text-right py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Ricerca</th>
              <th className="text-right py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Contatto</th>
              <th className="text-right py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Chiusura</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {allAgents.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400">Nessun dato per questo mese</td>
              </tr>
            ) : (
              allAgents.map((agent, index) => (
                <AgentRow
                  key={agent.agente}
                  agent={agent}
                  index={index}
                  selectedMonth={selectedMonth}
                />
              ))
            )}
          </tbody>
        </table>
        {/* ── PAGAMENTI MENSILI ── */}
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
      </div>
    </div>
  )
}