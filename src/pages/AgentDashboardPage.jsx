import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAllAgentsStats } from '../services/agentService'

export default function AgentDashboardPage() {
  const { userProfile } = useAuth()
  const [allAgents, setAllAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userProfile?.role === 'ADMIN') loadData()
  }, [userProfile])

  const loadData = async () => {
    setLoading(true)
    const { data } = await getAllAgentsStats()
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Classifica Agenti</h1>

      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">#</th>
              <th className="text-left py-3 px-4">Agente</th>
              <th className="text-right py-3 px-4">Deal</th>
              <th className="text-right py-3 px-4">Completati</th>
              <th className="text-right py-3 px-4">Revenue</th>
              <th className="text-right py-3 px-4">Commissioni</th>
              <th className="text-right py-3 px-4">Conversion %</th>
            </tr>
          </thead>
          <tbody>
            {allAgents.map((agent, index) => (
              <tr key={agent.agente} className="border-b border-gray-100">
                <td className="py-3 px-4 font-bold text-gray-400">#{index + 1}</td>
                <td className="py-3 px-4 font-semibold">{agent.agente}</td>
                <td className="py-3 px-4 text-right">{agent.totaleDeal}</td>
                <td className="py-3 px-4 text-right">{agent.completati}</td>
                <td className="py-3 px-4 text-right font-semibold">€{agent.totalRevenue.toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-semibold text-green-600">
                  €{agent.totalCommissioni.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    agent.conversionRate >= 50 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {agent.conversionRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
