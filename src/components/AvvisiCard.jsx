// src/components/AvvisiCard.jsx
// Riquadro in dashboard con il numero di azioni in scadenza, collegato alla pagina "Da fare".
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, BellRing, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { caricaDatiDaFare } from '../services/daFareService'
import { CATEGORIE_DA_FARE, costruisciDaFare } from '../utils/daFare'

export default function AvvisiCard() {
  const { userProfile } = useAuth()
  const isAdmin = userProfile?.role === 'ADMIN'
  const [stato, setStato] = useState({ loading: true, conteggi: {}, totale: 0 })

  useEffect(() => {
    let annullato = false
    const carica = async () => {
      const { data } = await caricaDatiDaFare({ isAdmin })
      if (annullato || !data) return
      const risultato = costruisciDaFare(data, {
        oggi: new Date(),
        agenteNome: isAdmin ? null : (userProfile?.agenteNome || null),
        isAdmin,
      })
      setStato({ loading: false, conteggi: risultato.conteggi, totale: risultato.totale })
    }
    carica().catch(() => { if (!annullato) setStato({ loading: false, conteggi: {}, totale: 0 }) })
    return () => { annullato = true }
  }, [isAdmin, userProfile?.agenteNome])

  if (stato.loading) {
    return (
      <div className="card mb-6">
        <p className="text-sm text-gray-500">Calcolo delle azioni in scadenza...</p>
      </div>
    )
  }

  if (stato.totale === 0) {
    return (
      <div className="card mb-6 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <p className="text-sm text-gray-700 font-medium">Nessuna azione in scadenza.</p>
      </div>
    )
  }

  const categorie = CATEGORIE_DA_FARE.filter(cat => (!cat.soloAdmin || isAdmin) && (stato.conteggi[cat.key] || 0) > 0)

  return (
    <div className="card mb-6 border-yellow-200 bg-yellow-50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-yellow-400/30">
            <BellRing className="w-5 h-5 text-yellow-700" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{stato.totale} azioni in scadenza</p>
            <p className="text-sm text-gray-600">
              {categorie.map(cat => `${cat.label.toLowerCase()}: ${stato.conteggi[cat.key]}`).join(' · ')}
            </p>
          </div>
        </div>
        <Link to="/da-fare" className="btn-primary self-start sm:self-auto">
          Apri Da fare
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
