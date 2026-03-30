import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAllAgentsStats } from '../services/agentService'

export default function AgentDashboardPage() {
  const { userProfile } = useAuth()
  const [allAgents, setAllAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

    useEffect(() => {
      if (userProfile?.role === 'ADMIN') loadData()
    }, [userProfile, selectedMonth])

  const loadData = async () => {
    setLoading(true)
    const { data } = await getAllAgentsStats(selectedMonth)
    setAllAgents(data || [])
    setLoading(false)
  }

  // Solo ADMIN può vedere questa pagina
  if (userProfile?.role !== 'ADMIN') {
    return (
      <div className="card">
        <p className="text-gray-600">Accesso negato - Solo Amministratori</p>
      </div>
    )
  }

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div></div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Tutti gli Agenti</h1>
        <div className="mb-6 flex justify-end">
          <div>
            <label className="label">Mese di riferimento</label>
            <input
              type="month"
              className="input"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        </div>

      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">#</th>
              <th className="text-left py-3 px-4">Agente</th>
              <th className="text-right py-3 px-4">Deal</th>
              <th className="text-right py-3 px-4">Completati</th>
              <th className="text-right py-3 px-4">Comm. Totali</th>
              <th className="text-right py-3 px-4 text-gray-400 text-xs">di cui Ricerca</th>
              <th className="text-right py-3 px-4 text-gray-400 text-xs">di cui Contatto</th>
              <th className="text-right py-3 px-4 text-gray-400 text-xs">di cui Chiusura</th>
            </tr>
          </thead>
          <tbody>
            {allAgents.map((agent, index) => (
              <tr key={agent.agente} className="border-b border-gray-100">
                <td className="py-3 px-4 font-bold text-gray-400">#{index + 1}</td>
                <td className="py-3 px-4 font-semibold">{agent.agente}</td>
                <td className="py-3 px-4 text-right">{agent.totaleDeal}</td>
                <td className="py-3 px-4 text-right">{agent.completati}</td>
                <td className="py-3 px-4 text-right font-semibold text-green-600">
                  €{agent.totalCommissioni.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right text-xs text-gray-500">
                  €{(agent.commissioniRicerca || 0).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right text-xs text-gray-500">
                  €{(agent.commissioniContatto || 0).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right text-xs text-gray-500">
                  €{(agent.commissioniChiusura || 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
