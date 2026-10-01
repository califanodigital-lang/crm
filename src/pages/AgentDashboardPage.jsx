import { confirm } from '../components/ConfirmModal'
// src/pages/AgentDashboardPage.jsx
import { useState, useEffect, useEffectEvent } from 'react'
import { getAllAgentsStats, getAgentCollaborations } from '../services/agentService'
import { ChevronDown, ChevronUp } from 'lucide-react'
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
        <td className="py-3 px-4 text-right text-gray-400">
          {open ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
        </td>
      </tr>

      {open && (
        <tr className="border-b border-gray-100 bg-gray-50/50">
          <td colSpan={5} className="px-6 py-3">
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
  const [allAgents, setAllAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [pagamenti, setPagamenti] = useState([])
  const [allUsers, setAllUsers] = useState([])


  const loadData = useEffectEvent(async () => {
    setLoading(true)
      const { data } = await getAllAgentsStats(selectedMonth)
      setAllAgents(data || [])
      const [pagRes, usersRes] = await Promise.all([
        getPagamentiByMese(selectedMonth),
        getAllUsers(),
      ])
      setPagamenti(pagRes.data || [])
      setAllUsers(usersRes.data || [])

    setLoading(false)
  })

  useEffect(() => { Promise.resolve().then(() => loadData()) }, [selectedMonth])

  const handlePagamento = async (agenteNome, importoPagato, importoFisso, importoTotale) => {
    await upsertPagamentoAgente({
      agenteNome,
      mese: selectedMonth,
      importoFisso,
      importoTotale,
      importoPagato: parseFloat(importoPagato),
    })
    const { data, error } = await getPagamentiByMese(selectedMonth)
    if (error) { toast.error('Errore caricamento pagamenti'); return }
    setPagamenti(data || [])
    toast.success('Pagamento registrato')
  }

  const handleGeneraMese = async () => {
    await generaPagamentiMese(selectedMonth, allUsers)
    const { data, error } = await getPagamentiByMese(selectedMonth)
    if (error) { toast.error('Errore caricamento pagamenti'); return }
    setPagamenti(data || [])
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


  if (loading) return (
    <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400" />
    </div>
  )

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
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {allAgents.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">Nessun dato per questo mese</td>
              </tr>
            ) : (
              allAgents.map((agent, index) => (
                <AgentRow
                  key={`${selectedMonth}:${agent.agente}`}
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
                <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Totale</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Pagato</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Differenza</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Stato</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {pagamenti.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm">
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
