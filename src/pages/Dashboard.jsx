import { useState, useEffect, useEffectEvent } from 'react'
import { DollarSign, Briefcase, Users, Handshake } from 'lucide-react'
import { getGlobalStats, getTopCreators, getRevenueChart, getProposteStats } from '../services/dashboardService'
import ChangelogCard from '../components/ChangelogCard'
import {formatDate} from '../utils/date'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [globalStats, setGlobalStats] = useState(null)
  const [topCreators, setTopCreators] = useState([])
  const [revenueChart, setRevenueChart] = useState([])
  const [proposteStats, setProposteStats] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  const loadData = useEffectEvent(async () => {
    setLoading(true)
    
      const [global, top, chart, proposte] = await Promise.all([
        getGlobalStats(selectedMonth),
        getTopCreators(),
        getRevenueChart(selectedMonth),
        getProposteStats()
      ])
      
      setGlobalStats(global.data)
      setTopCreators(top.data || [])
      setRevenueChart(chart.data || [])
      setProposteStats(proposte.data)
    
    setLoading(false)
  })

  useEffect(() => { Promise.resolve().then(() => loadData()) }, [selectedMonth])

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div></div>
  }

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Panoramica generale</p>
        </div>

      <div className="flex justify-end mb-6">
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
                <p className="text-sm text-gray-600">Completate & Pagate</p>
                <p className="text-2xl font-bold text-gray-900">{globalStats?.completate || 0}</p>
                <p className="text-xs text-gray-500 mt-1">€{(globalStats?.revenueCollabs || 0).toLocaleString()} totali</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="card bg-blue-50 border-blue-100">
              <p className="text-sm font-medium text-blue-700 mb-2">Brand Contattati (totale)</p>
              <p className="text-3xl font-bold text-blue-900">{globalStats?.totalBrandContattati || 0}</p>
            </div>
            <div className="card bg-purple-50 border-purple-100">
              <p className="text-sm font-medium text-purple-700 mb-2">Collaborazioni Attive</p>
              <p className="text-3xl font-bold text-purple-900">{globalStats?.activeCollabs || 0}</p>
              <p className="text-xs text-purple-500 mt-1">Firmato → Attesa Pagamento</p>
            </div>
            <div className="card bg-green-50 border-green-100">
              <p className="text-sm font-medium text-green-700 mb-2">Revenue — {selectedMonth}</p>
              <p className="text-3xl font-bold text-green-900">€{(globalStats?.monthlyRevenue || 0).toLocaleString()}</p>
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
                    <span className="font-medium text-gray-700">{formatDate(item.mese).replace("01/","")}</span>
                    <span className="text-lg font-bold text-blue-600">
                      €{item.revenue.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

            <ChangelogCard />

        </div>
      </div>
    )
}
