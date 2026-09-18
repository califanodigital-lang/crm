// src/pages/DaFarePage.jsx
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowUpRight, CalendarClock, CheckCircle2,
  Clock, FileText, RefreshCw, Users, Wallet, XCircle,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getActiveAgents } from '../services/userService'
import { caricaDatiDaFare, chiudiSenzaRisposta } from '../services/daFareService'
import { CATEGORIE_DA_FARE, MOTIVI_CHIUSURA, SOGLIE_DA_FARE, costruisciDaFare } from '../utils/daFare'
import { toast } from '../components/Toast'
import { formatDate } from '../utils/date'

const ICONE = {
  followup: Clock,
  ferme: AlertTriangle,
  chiudere: XCircle,
  pagamenti: Wallet,
  contratti: Users,
  fatture: FileText,
}

const COLORI = {
  followup: 'bg-blue-50 border-blue-100 text-blue-700',
  ferme: 'bg-amber-50 border-amber-100 text-amber-700',
  chiudere: 'bg-gray-50 border-gray-200 text-gray-700',
  pagamenti: 'bg-purple-50 border-purple-100 text-purple-700',
  contratti: 'bg-orange-50 border-orange-100 text-orange-700',
  fatture: 'bg-green-50 border-green-100 text-green-700',
}

const descrizioneGiorni = (item) => {
  const g = item.giorni
  if (g === null || g === undefined) return '—'
  if (item.tipo === 'contratto_in_scadenza') {
    if (g === 0) return 'scade oggi'
    return `scade tra ${g} giorni`
  }
  if (item.tipo === 'contratto_scaduto') return `scaduto da ${g} giorni`
  if (item.categoria === 'fatture') return `evento concluso da ${g} giorni`
  if (item.categoria === 'ferme') return `nessuna novità da ${g} giorni`
  if (item.categoria === 'chiudere') return `ferma da ${g} giorni`
  if (g === 0) return 'da fare oggi'
  return `in ritardo di ${g} giorni`
}

const formatValore = (valore) => {
  if (valore === null || valore === undefined) return null
  return `€${Number(valore).toLocaleString('it-IT', { maximumFractionDigits: 2 })}`
}

export default function DaFarePage() {
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  const isAdmin = userProfile?.role === 'ADMIN'

  const [loading, setLoading] = useState(true)
  const [dati, setDati] = useState(null)
  const [agenti, setAgenti] = useState([])
  const [filtroAgente, setFiltroAgente] = useState('ALL')
  const [selezionate, setSelezionate] = useState([])
  const [modaleChiusura, setModaleChiusura] = useState(false)
  const [motivo, setMotivo] = useState(MOTIVI_CHIUSURA[0])
  const [nota, setNota] = useState('')
  const [salvataggio, setSalvataggio] = useState(false)
  const [espanse, setEspanse] = useState({})

  const caricaDati = useCallback(async () => {
    setLoading(true)
    const { data, error } = await caricaDatiDaFare({ isAdmin })
    if (error) toast.error('Alcuni dati non sono stati caricati')
    setDati(data)
    setSelezionate([])
    setLoading(false)
  }, [isAdmin])

  useEffect(() => {
    Promise.resolve().then(caricaDati)
  }, [caricaDati])

  useEffect(() => {
    if (!isAdmin) return
    getActiveAgents().then(({ data }) => setAgenti(data || []))
  }, [isAdmin])

  const agenteNome = isAdmin
    ? (filtroAgente === 'ALL' ? null : filtroAgente)
    : (userProfile?.agenteNome || null)

  const risultato = useMemo(() => {
    if (!dati) return { perCategoria: {}, conteggi: {}, totale: 0 }
    return costruisciDaFare(dati, { oggi: new Date(), agenteNome, isAdmin })
  }, [dati, agenteNome, isAdmin])

  const categorieVisibili = CATEGORIE_DA_FARE.filter(cat => !cat.soloAdmin || isAdmin)
  const daChiudere = risultato.perCategoria.chiudere || []
  const selezionabili = daChiudere.filter(item => item.entita === 'trattativa' || item.entita === 'trattativa_fiera')
  const itemsSelezionati = selezionabili.filter(item => selezionate.includes(item.id))

  const toggleSelezione = (id) => {
    setSelezionate(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  const toggleTutte = () => {
    setSelezionate(prev => (prev.length === selezionabili.length ? [] : selezionabili.map(item => item.id)))
  }

  const apri = (item) => {
    if (item.entita === 'trattativa') navigate('/trattativa', { state: { openTrattativaId: item.entitaId } })
    else if (item.entita === 'trattativa_fiera') navigate('/trattative-fiere', { state: { openTrattativaFieraId: item.entitaId } })
    else if (item.entita === 'collaborazione') navigate('/collaborations')
    else if (item.entita === 'creator') navigate('/creators')
    else if (item.entita === 'evento') navigate('/eventi', { state: { openEventoId: item.entitaId } })
  }

  const confermaChiusura = async () => {
    if (!motivo) return
    if (motivo === 'Altro' && !nota.trim()) {
      toast.error('Con il motivo "Altro" serve una nota')
      return
    }
    setSalvataggio(true)
    const esito = await chiudiSenzaRisposta(itemsSelezionati, {
      motivo,
      nota,
      operatore: userProfile?.agenteNome || userProfile?.nomeCompleto || userProfile?.email,
    })
    setSalvataggio(false)
    setModaleChiusura(false)
    setNota('')
    if (esito.chiuse > 0) toast.success(`${esito.chiuse} chiuse come Nessuna risposta`)
    if (esito.errori.length > 0) toast.error(`${esito.errori.length} non sono state chiuse`)
    await caricaDati()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Da fare</h1>
          <p className="text-gray-600 mt-1">
            Le azioni in scadenza calcolate dalle date già presenti nel CRM.
          </p>
        </div>
        <div className="flex items-end gap-3">
          {isAdmin && (
            <div>
              <label className="label">Assegnatario</label>
              <select className="input sm:w-52" value={filtroAgente} onChange={(e) => setFiltroAgente(e.target.value)}>
                <option value="ALL">Tutti</option>
                {agenti.map(a => (
                  <option key={a.id} value={a.agenteNome}>{a.agenteNome}</option>
                ))}
              </select>
            </div>
          )}
          <button onClick={caricaDati} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
            Aggiorna
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {categorieVisibili.map(cat => {
          const Icona = ICONE[cat.key] || Clock
          const totale = (risultato.perCategoria[cat.key] || []).length
          return (
            <a key={cat.key} href={`#sezione-${cat.key}`} className={`card border ${COLORI[cat.key]} hover:shadow-md transition-shadow`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-3xl font-bold leading-none">{totale}</p>
                <Icona className="w-5 h-5 opacity-70" />
              </div>
              <p className="text-xs font-semibold mt-2 leading-snug">{cat.label}</p>
            </a>
          )
        })}
      </div>

      {risultato.totale === 0 && (
        <div className="card text-center py-12">
          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <p className="font-semibold text-gray-900">Nessuna azione in scadenza</p>
          <p className="text-sm text-gray-500 mt-1">Follow-up, pagamenti e contratti sono in ordine.</p>
        </div>
      )}

      <div className="space-y-6">
        {categorieVisibili.map(cat => {
          const items = risultato.perCategoria[cat.key] || []
          if (items.length === 0) return null
          const Icona = ICONE[cat.key] || Clock
          const tutteVisibili = espanse[cat.key]
          const visibili = tutteVisibili ? items : items.slice(0, 25)
          const isChiudere = cat.key === 'chiudere'

          return (
            <div key={cat.key} id={`sezione-${cat.key}`} className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-gray-100">
                    <Icona className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{cat.label} <span className="text-gray-400 font-semibold">({items.length})</span></h2>
                    <p className="text-sm text-gray-500">{cat.descrizione}</p>
                  </div>
                </div>
                {isChiudere && selezionabili.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button onClick={toggleTutte} className="btn-secondary">
                      {selezionate.length === selezionabili.length ? 'Deseleziona tutte' : 'Seleziona tutte'}
                    </button>
                    <button
                      onClick={() => setModaleChiusura(true)}
                      disabled={itemsSelezionati.length === 0}
                      className={`btn-primary ${itemsSelezionati.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Chiudi selezionate ({itemsSelezionati.length})
                    </button>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                      {isChiudere && <th className="py-2 px-3 w-10"></th>}
                      <th className="py-2 px-3">Azione</th>
                      <th className="py-2 px-3">Riferimento</th>
                      <th className="py-2 px-3">Tempi</th>
                      <th className="py-2 px-3">Assegnatari</th>
                      <th className="py-2 px-3 text-right">Apri</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibili.map(item => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        {isChiudere && (
                          <td className="py-3 px-3">
                            {(item.entita === 'trattativa' || item.entita === 'trattativa_fiera') && (
                              <input
                                type="checkbox"
                                className="w-4 h-4 accent-yellow-500"
                                checked={selezionate.includes(item.id)}
                                onChange={() => toggleSelezione(item.id)}
                              />
                            )}
                          </td>
                        )}
                        <td className="py-3 px-3">
                          <p className="font-medium text-gray-900">{item.titolo}</p>
                          {item.dettaglio && <p className="text-xs text-gray-500 mt-0.5">{item.dettaglio}</p>}
                        </td>
                        <td className="py-3 px-3 text-gray-700">
                          {item.riferimento}
                          {item.valore ? <span className="text-xs text-gray-500 block">{formatValore(item.valore)}</span> : null}
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-sm font-semibold text-gray-800">{descrizioneGiorni(item)}</p>
                          {item.data && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <CalendarClock className="w-3 h-3" />
                              {formatDate(item.data)}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-sm text-gray-600">
                          {(item.assegnatari || []).join(', ') || (item.ruoli || []).join(', ') || '—'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button onClick={() => apri(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Apri">
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {items.length > 25 && (
                <div className="mt-3 text-center">
                  <button
                    onClick={() => setEspanse(prev => ({ ...prev, [cat.key]: !prev[cat.key] }))}
                    className="text-sm font-semibold text-yellow-600 hover:text-yellow-700"
                  >
                    {tutteVisibili ? 'Mostra solo le prime 25' : `Mostra tutte (${items.length})`}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 mt-6">
        Soglie usate: follow-up a {SOGLIE_DA_FARE.followUp1Giorni} e {SOGLIE_DA_FARE.followUp2Giorni} giorni,
        chiusura proposta dopo {SOGLIE_DA_FARE.chiusuraDopoFollowUp2Giorni} giorni dal 2° follow-up o
        {' '}{SOGLIE_DA_FARE.contattoFermoGiorni} giorni di silenzio, trattative avanzate ferme da {SOGLIE_DA_FARE.trattativaAvanzataFermaGiorni} giorni,
        pagamenti oltre {SOGLIE_DA_FARE.pagamentoFermoGiorni} giorni, contratti in scadenza entro {SOGLIE_DA_FARE.contrattoTalentAvvisoGiorni} giorni.
      </p>

      {modaleChiusura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setModaleChiusura(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 z-10">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Chiudere {itemsSelezionati.length} pratiche?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Lo stato diventa "Nessuna risposta" e il motivo viene salvato nelle note, con il tuo nome e la data.
            </p>
            <div className="space-y-4">
              <div>
                <label className="label">Motivo *</label>
                <select className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                  {MOTIVI_CHIUSURA.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Nota {motivo === 'Altro' ? '*' : '(opzionale)'}</label>
                <textarea
                  className="input min-h-[80px]"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Dettaglio da salvare nelle note"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModaleChiusura(false)} className="btn-secondary">Annulla</button>
              <button onClick={confermaChiusura} disabled={salvataggio} className={`btn-primary ${salvataggio ? 'opacity-50' : ''}`}>
                {salvataggio ? 'Chiusura in corso...' : 'Chiudi come Nessuna risposta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
