import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAgentStats, getAgentCollaborations } from '../services/agentService'
import { TrendingUp, Award, Target, DollarSign, Briefcase, Users, Handshake } from 'lucide-react'
import { getGlobalStats, getTopCreators, getRevenueChart, getProposteStats } from '../services/dashboardService'

export default function Dashboard() {
  const { userProfile } = useAuth()
  const [agentStats, setAgentStats] = useState(null)
  const [agentCollabs, setAgentCollabs] = useState([])
  const [loading, setLoading] = useState(true)
  const [globalStats, setGlobalStats] = useState(null)
  const [topCreators, setTopCreators] = useState([])
  const [revenueChart, setRevenueChart] = useState([])
  const [proposteStats, setProposteStats] = useState(null)

  useEffect(() => {
    loadData()
  }, [userProfile])

  const loadData = async () => {
    setLoading(true)
    
    if (userProfile?.role === 'AGENT') {
      // Agent: carica sue stats
      const [statsRes, collabsRes] = await Promise.all([
        getAgentStats(userProfile.agenteNome),
        getAgentCollaborations(userProfile.agenteNome)
      ])
      setAgentStats(statsRes.data)
      setAgentCollabs(collabsRes.data || [])
    } else if (userProfile?.role === 'ADMIN') {
      // Admin: carica stats globali
      const [global, top, chart, proposte] = await Promise.all([
        getGlobalStats(),
        getTopCreators(),
        getRevenueChart(),
        getProposteStats()
      ])
      
      setGlobalStats(global.data)
      setTopCreators(top.data || [])
      setRevenueChart(chart.data || [])
      setProposteStats(proposte.data)
    }
    
    setLoading(false)
}

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div></div>
  }

  // VISTA AGENT
  if (userProfile?.role === 'AGENT' && agentStats) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Benvenuto, {userProfile.nomeCompleto}</p>
        </div>

        {/* Stats Cards Agent */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">I Tuoi Deal</p>
                <p className="text-2xl font-bold text-gray-900">{agentStats.totaleDeal}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completati</p>
                <p className="text-2xl font-bold text-gray-900">{agentStats.completati}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tua Revenue</p>
                <p className="text-2xl font-bold text-gray-900">€{agentStats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{agentStats.conversionRate}%</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Commissioni Card Grande */}
        <div className="card mb-6 bg-gradient-to-r from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Le Tue Commissioni</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">€{agentStats.totalCommissioni.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">Da deal completati e pagati</p>
            </div>
            <div className="bg-yellow-400 p-4 rounded-lg">
              <DollarSign className="w-10 h-10 text-gray-900" />
            </div>
          </div>
        </div>

        {/* Tabella Ultime Collaborazioni */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Le Tue Ultime Collaborazioni</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Creator</th>
                  <th className="text-left py-3 px-4">Brand</th>
                  <th className="text-left py-3 px-4">Stato</th>
                  <th className="text-right py-3 px-4">Pagamento</th>
                  <th className="text-right py-3 px-4">Tua Fee</th>
                </tr>
              </thead>
              <tbody>
                {agentCollabs.slice(0, 10).map((c) => (
                  <tr key={c.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">{c.creatorNome}</td>
                    <td className="py-3 px-4">{c.brand_nome}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        c.stato === 'COMPLETATO' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {c.stato}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">€{parseFloat(c.pagamento || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-semibold text-green-600">
                      €{parseFloat(c.fee_management || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // VISTA ADMIN (stats globali - da implementare)
  if (userProfile?.role === 'ADMIN') {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600 mt-1">Panoramica generale</p>
        </div>

        {/* Stats Cards Admin */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totale Brand</p>
                <p className="text-2xl font-bold text-gray-900">{globalStats?.totalBrands || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totale Creator</p>
                <p className="text-2xl font-bold text-gray-900">{globalStats?.totalCreators || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Collaborazioni Attive</p>
                <p className="text-2xl font-bold text-gray-900">{globalStats?.activeCollabs || 0}</p>
                <p className="text-xs text-gray-500 mt-1">{globalStats?.totalCollabs || 0} totali</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Handshake className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue Mensile</p>
                <p className="text-2xl font-bold text-gray-900">€{(globalStats?.monthlyRevenue || 0).toLocaleString()}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline Proposte */}
        {proposteStats && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pipeline Proposte</h2>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{proposteStats.totale}</p>
                <p className="text-sm text-gray-600">Totale</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{proposteStats.daContattare}</p>
                <p className="text-sm text-gray-600">Da Contattare</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{proposteStats.inTrattativa}</p>
                <p className="text-sm text-gray-600">In Trattativa</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{proposteStats.chiusoVinto}</p>
                <p className="text-sm text-gray-600">Vinti</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{proposteStats.chiusoPerso}</p>
                <p className="text-sm text-gray-600">Persi</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top 5 Creator */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top 5 Creator per Revenue</h2>
            {topCreators.length === 0 ? (
              <p className="text-gray-500">Nessun dato disponibile</p>
            ) : (
              <div className="space-y-3">
                {topCreators.map((creator, index) => (
                  <div key={creator.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-gray-400">#{index + 1}</span>
                      <span className="font-medium text-gray-900">{creator.nome}</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      €{creator.revenue.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Revenue Ultimi 6 Mesi */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Ultimi 6 Mesi</h2>
            {revenueChart.length === 0 ? (
              <p className="text-gray-500">Nessun dato disponibile</p>
            ) : (
              <div className="space-y-3">
                {revenueChart.map((item) => (
                  <div key={item.mese} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{item.mese}</span>
                    <span className="text-lg font-bold text-blue-600">
                      €{item.revenue.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
