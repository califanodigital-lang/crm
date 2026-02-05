import { TrendingUp, Users, Briefcase, DollarSign } from 'lucide-react'

export default function Dashboard() {
  const stats = [
    {
      name: 'Brand Attivi',
      value: '1',
      icon: Briefcase,
      color: 'bg-blue-500',
      change: '+0%'
    },
    {
      name: 'Creator',
      value: '1',
      icon: Users,
      color: 'bg-purple-500',
      change: '+0%'
    },
    {
      name: 'Collaborazioni',
      value: '0',
      icon: TrendingUp,
      color: 'bg-green-500',
      change: '+0%'
    },
    {
      name: 'Revenue Mese',
      value: '€0',
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+0%'
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Benvenuto nel sistema C3 Agency</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Attività Recente</h2>
          <p className="text-gray-500">Nessuna attività recente da visualizzare</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Brand da Contattare</h2>
          <p className="text-gray-500">Nessun brand in lista</p>
        </div>
      </div>
    </div>
  )
}
