import { useState, useEffect } from 'react'
import { ArrowLeft, Edit, Mail, Phone, Calendar, DollarSign, TrendingUp, Plus, AlertCircle, Trash2, CalendarDays } from 'lucide-react'
import CollaborationForm from './CollaborationForm'
import { getCollaborationsByCreator, createCollaboration } from '../services/collaborationService'
import { getPartecipazioniByCreator } from '../services/eventoService'
import { getPiattaformeByCreator } from '../services/piattaformeService'
import { toast } from '../components/Toast'
import { confirm } from '../components/ConfirmModal'
import { getTrattativeByCreator } from '../services/trattativaService'
import { getStatoTrattativa } from '../constants/constants'
import { getImpegniByCreator, createImpegno, deleteImpegno } from '../services/creatorImpegniService'

export default function CreatorDetail({ creator, onEdit, onBack }) {
  const [activeTab, setActiveTab] = useState('info')
  const [showCollabForm, setShowCollabForm] = useState(false)
  const [collaborations, setCollaborations] = useState([])
  const [loading, setLoading] = useState(false)
  const [partecipazioni, setPartecipazioni] = useState([])
  const [creatorPiattaforme, setCreatorPiattaforme] = useState([])
  const [impegni, setImpegni] = useState([])
  const [loadingImpegni, setLoadingImpegni] = useState(false)
  const [impegnoForm, setImpegnoForm] = useState({
    titolo: '',
    tipo: 'ALTRO',
    dataInizio: '',
    dataFine: '',
    note: ''
  })

  const loadImpegni = async () => {
    if (!creator?.id) return
    setLoadingImpegni(true)
    const { data } = await getImpegniByCreator(creator.id)
    setImpegni(data || [])
    setLoadingImpegni(false)
  }

  // Carica collaborazioni quando si apre il tab
  useEffect(() => {
    loadPiattaformeCreator()
    loadImpegni()
    if (activeTab === 'collaborazioni') {
      loadCollaborations()
    }
    if (activeTab === 'eventi') {
      loadPartecipazioni()
    }
  }, [activeTab, creator.id])


  const loadPiattaformeCreator = async () => {
    const { data } = await getPiattaformeByCreator(creator.id)
    setCreatorPiattaforme(data || [])
  }

  const loadPartecipazioni = async () => {
    setLoading(true)
    const { data } = await getPartecipazioniByCreator(creator.id)
    setPartecipazioni(data || [])
    setLoading(false)
  }

  const loadCollaborations = async () => {
    setLoading(true)
    const { data } = await getCollaborationsByCreator(creator.id)
    setCollaborations(data || [])
    setLoading(false)
  }

  const handleSaveCollaboration = async (collabData) => {
    setLoading(true)
    // Pre-compila creator_id
    const dataWithCreator = { ...collabData, creatorId: creator.id }
    const { error } = await createCollaboration(dataWithCreator)
    
    if (error) {
      toast.error('Errore durante la creazione della collaborazione')
      console.error(error)
    } else {
      setShowCollabForm(false)
      await loadCollaborations()
    }
    setLoading(false)
  }

  const TierBadge = ({ tier }) => {
    const colors = {
      NANO: 'bg-gray-100 text-gray-800',
      MICRO: 'bg-blue-100 text-blue-800',
      MACRO: 'bg-purple-100 text-purple-800',
      MEGA: 'bg-pink-100 text-pink-800',
      CELEBRITY: 'bg-pink-100 text-pink-800',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[tier] || 'bg-gray-100 text-gray-800'}`}>
        {tier || '-'}
      </span>
    )
  }

  const InfoRow = ({ label, value }) => (
    <div className="mb-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-900">{value || '-'}</div>
    </div>
  )

  const CollaborationStatusBadge = ({ status }) => {
    const config = {
      IN_LAVORAZIONE:           { bg: 'bg-purple-100',  text: 'text-purple-800',  label: 'In Lavorazione' },
      ATTESA_PAGAMENTO_CREATOR: { bg: 'bg-yellow-100',  text: 'text-yellow-800',  label: 'Attesa Pagamento Creator' },
      ATTESA_PAGAMENTO_AGENCY:  { bg: 'bg-amber-100',   text: 'text-amber-800',   label: 'Attesa Pagamento Agency' },
      COMPLETATA:               { bg: 'bg-green-100',   text: 'text-green-800',   label: 'Completata' },
      ANNULLATA:                { bg: 'bg-red-100',     text: 'text-red-800',     label: 'Annullata' },
    }
    const { bg, text, label } = config[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status }
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>{label}</span>
  }

  const handleCreateImpegno = async (e) => {
    e.preventDefault()

    if (!impegnoForm.titolo || !impegnoForm.dataInizio) return

    const { error } = await createImpegno({
      creatorId: creator.id,
      ...impegnoForm
    })

    if (!error) {
      setImpegnoForm({
        titolo: '',
        tipo: 'ALTRO',
        dataInizio: '',
        dataFine: '',
        note: ''
      })
      loadImpegni()
    }
  }

const handleDeleteImpegno = async (id) => {
  const { error } = await deleteImpegno(id)
  if (!error) loadImpegni()
}

  function TrattativePerCreator({ creatorId }) {
    const [trattative, setTrattative] = useState([])
    const [loading, setLoading] = useState(true)
    useEffect(() => {
      getTrattativeByCreator(creatorId).then(({ data }) => {
        setTrattative(data || [])
        setLoading(false)
      })
    }, [creatorId])
    if (loading) return <div className="py-6 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400" /></div>
    if (trattative.length === 0) return <p className="text-gray-400 text-sm py-4">Nessuna trattativa registrata per questo creator.</p>
    return (
      <div className="space-y-2">
        {trattative.map(t => {
          const cfg = getStatoTrattativa(t.stato)
          return (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
                <span className="text-sm font-medium text-gray-700">{t.brandNome}</span>
                {t.ima && <span className="text-xs text-gray-400">{t.ima}</span>}
              </div>
              <span className="text-xs text-gray-400">{t.dataContatto || '—'}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Indietro
        </button>
        <button
          onClick={() => onEdit(creator)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Modifica
        </button>
      </div>

      {/* Creator Header Card */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{creator.nome}</h1>
            <p className="text-lg text-gray-600 mb-3">{creator.nomeCompleto}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              <TierBadge tier={creator.tier} />
              {creator.stato && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  {creator.stato}
                </span>
              )}
              {creator.ricontattare && (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
                  ↩ Da Ricontattare
                </span>
              )}
              {creator.topic && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  {creator.topic}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            {creator.email && (
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{creator.email}</span>
              </div>
            )}
            {creator.cellulare && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{creator.cellulare}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 px-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'info'
                ? 'border-yellow-400 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Informazioni
          </button>
          <button
            onClick={() => setActiveTab('collaborazioni')}
            className={`pb-3 px-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'collaborazioni'
                ? 'border-yellow-400 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Collaborazioni
          </button>
          <button
            onClick={() => setActiveTab('trattative')}
            className={`pb-3 px-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'trattative'
                ? 'border-yellow-400 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Trattative
          </button>
          <button
            onClick={() => setActiveTab('eventi')}
            className={`pb-3 px-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'eventi'
                ? 'border-yellow-400 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Eventi
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Fee & Piattaforme
          </h2>
          {creatorPiattaforme.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Nessuna piattaforma configurata</p>
          ) : (
            <div className="space-y-4">
              {creatorPiattaforme.map(p => (
                <div key={p.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-bold text-gray-900">{p.piattaforma_nome}</span>
                    {p.tier && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">{p.tier}</span>
                    )}
                  </div>
                  {p.fees && Object.keys(p.fees).length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(p.fees).map(([key, val]) => val ? (
                        <div key={key}>
                          <div className="text-xs text-gray-500 mb-0.5">{key.replace(/_/g, ' ')}</div>
                          <div className="text-sm font-semibold text-gray-900">€{val}</div>
                        </div>
                      ) : null)}
                    </div>
                  )}
                  {p.note && <p className="text-xs text-gray-500 mt-2">{p.note}</p>}
                </div>
              ))}
            </div>
          )}
          {/* Fee fisse non legate a piattaforma */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
            <InfoRow label="Fiere & Eventi (fee standard)" value={creator.fiereEventi ? `€${creator.fiereEventi}` : '-'} />
            <InfoRow label="Collaborazioni Lunghe" value={creator.collaborazioniLunghe ? `€${creator.collaborazioniLunghe}` : '-'} />
          </div>
        </div>

          {/* Contratto */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Contratto
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InfoRow label="Tipo Contratto" value={creator.tipoContratto} />
              <InfoRow label="Data Firma" value={creator.dataContratto} />
              <InfoRow label="Scadenza" value={creator.scadenzaContratto} />
              <InfoRow label="Proviggioni" value={creator.proviggioni ? `${creator.proviggioni}%` : '-'} />
              <InfoRow label="Sales" value={creator.sales} />
            </div>
          </div>

          {/* Social & Categorie */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Social & Categorie
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoRow label="Categorie ADV" value={creator.categoriaAdv} />
              <InfoRow label="Preferenze Collaborazioni" value={creator.preferenzaCollaborazioni} />
              <InfoRow label="Obiettivo" value={creator.obiettivo} />
              <InfoRow label="Strategia" value={creator.strategia} />
              <InfoRow label="Insight" value={creator.insight} />
              <InfoRow label="Mediakit" value={creator.mediakit} />
              <InfoRow label="Ultimo Aggiornamento Mediakit" value={creator.ultimoAggiornamentoMediakit} />
            </div>
          </div>

          {/* Mediakit */}
          {creator.mediakit && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Mediakit</h2>
              
              {/* Preview PDF */}
              <div className="mb-4">
                <iframe 
                  src={creator.mediakit}
                  className="w-full h-[600px] border border-gray-300 rounded-lg"
                  title="Mediakit Preview"
                />
              </div>
              
              {/* Pulsanti */}
              <div className="flex gap-3">
                <a
                  href={creator.mediakit}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-center"
                >
                  Apri in Nuova Tab
                </a>
                <a
                  href={creator.mediakit}
                  download
                  className="flex-1 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500 text-center"
                >
                  Scarica PDF
                </a>
              </div>
              
              {creator.ultimoAggiornamentoMediakit && (
                <p className="text-sm text-gray-500 mt-3">
                  Ultimo aggiornamento: {creator.ultimoAggiornamentoMediakit}
                </p>
              )}
            </div>
          )}

          {/* Note */}
          {creator.note && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Note</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{creator.note}</p>
            </div>
          )}

          <div className="card mt-6">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-bold">Impegni Creator</h3>
            </div>

            <form onSubmit={handleCreateImpegno} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-5">
              <div className="md:col-span-2">
                <label className="label">Titolo</label>
                <input
                  className="input"
                  value={impegnoForm.titolo}
                  onChange={(e) => setImpegnoForm({ ...impegnoForm, titolo: e.target.value })}
                  placeholder="Es. Shooting, trasferta, call..."
                />
              </div>

              <div>
                <label className="label">Tipo</label>
                <select
                  className="input"
                  value={impegnoForm.tipo}
                  onChange={(e) => setImpegnoForm({ ...impegnoForm, tipo: e.target.value })}
                >
                  <option value="ALTRO">Altro</option>
                  <option value="EVENTO">Evento</option>
                  <option value="TRASFERTA">Trasferta</option>
                  <option value="CALL">Call</option>
                  <option value="PRODUZIONE">Produzione</option>
                </select>
              </div>

              <div>
                <label className="label">Dal</label>
                <input
                  type="date"
                  className="input"
                  value={impegnoForm.dataInizio}
                  onChange={(e) => setImpegnoForm({ ...impegnoForm, dataInizio: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Al</label>
                <input
                  type="date"
                  className="input"
                  value={impegnoForm.dataFine}
                  onChange={(e) => setImpegnoForm({ ...impegnoForm, dataFine: e.target.value })}
                />
              </div>

              <div className="md:col-span-4">
                <label className="label">Note</label>
                <input
                  className="input"
                  value={impegnoForm.note}
                  onChange={(e) => setImpegnoForm({ ...impegnoForm, note: e.target.value })}
                  placeholder="Note opzionali"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi
                </button>
              </div>
            </form>

            {loadingImpegni ? (
              <p className="text-sm text-gray-400">Caricamento...</p>
            ) : impegni.length === 0 ? (
              <p className="text-sm text-gray-400">Nessun impegno registrato.</p>
            ) : (
              <div className="space-y-3">
                {impegni.map((i) => (
                  <div key={i.id} className="border border-gray-100 rounded-xl p-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {i.tipo}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900">{i.titolo}</p>
                      <p className="text-sm text-gray-500">
                        {i.dataInizio} {i.dataFine ? `→ ${i.dataFine}` : ''}
                      </p>
                      {i.note && <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{i.note}</p>}
                    </div>

                    <button
                      onClick={() => handleDeleteImpegno(i.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                      title="Elimina impegno"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'collaborazioni' && (
        <div className="card">
          {showCollabForm ? (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Nuova Collaborazione per {creator.nome}</h2>
              <CollaborationForm
                collaboration={null}
                creators={[creator]}
                brands={brands}
                prefilledCreatorId={creator.id}
                onSave={handleSaveCollaboration}
                onCancel={() => setShowCollabForm(false)}
              />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Collaborazioni</h2>
                <button 
                  onClick={() => setShowCollabForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500"
                >
                  <Plus className="w-4 h-4" />
                  Nuova Collaborazione
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                </div>
              ) : collaborations.length === 0 ? (
                <div className="flex items-center gap-3 text-gray-500 py-8">
                  <AlertCircle className="w-5 h-5" />
                  <p>Nessuna collaborazione registrata</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Brand</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo ADV</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Pagamento</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Stato</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Data Firma</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collaborations.map((collab) => (
                        <tr key={collab.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{collab.brandNome}</td>
                          <td className="py-3 px-4 text-gray-600">{collab.adv || '-'}</td>
                          <td className="py-3 px-4 font-semibold">€{collab.pagamento ? parseFloat(collab.pagamento).toLocaleString() : '0'}</td>
                          <td className="py-3 px-4"><CollaborationStatusBadge status={collab.stato} /></td>
                          <td className="py-3 px-4 text-gray-600">{collab.dataFirma || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'trattative' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Trattative</h2>
            <a href="/trattative" className="text-sm text-yellow-600 hover:text-yellow-700 font-medium">
              Vai a Trattative →
            </a>
          </div>
          <TrattativePerCreator creatorId={creator.id} />
        </div>
      )}
      {activeTab === 'eventi' && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Storico Eventi</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
            </div>
          ) : partecipazioni.length === 0 ? (
            <div className="flex items-center gap-3 text-gray-500 py-8">
              <AlertCircle className="w-5 h-5" />
              <p>Nessuna partecipazione registrata</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Evento</th>
                    <th className="text-left py-3 px-4">Data</th>
                    <th className="text-left py-3 px-4">Location</th>
                    <th className="text-left py-3 px-4">Tipo Contratto</th>
                    <th className="text-right py-3 px-4">Fee</th>
                    <th className="text-left py-3 px-4">Attività</th>
                  </tr>
                </thead>
                <tbody>
                  {partecipazioni.map((p) => {
                    // Estrai attività
                    const attivita = []
                    if (p.panel) attivita.push('Panel')
                    if (p.workshop) attivita.push('Workshop')
                    if (p.masterGdr) attivita.push('Master GDR')
                    if (p.giochiTavolo) attivita.push('Giochi Tavolo')
                    if (p.giudiceCosplay) attivita.push('Giudice Cosplay')
                    if (p.firmacopie) attivita.push('Firmacopie')
                    if (p.palco) attivita.push('Palco')
                    if (p.moderazione) attivita.push('Moderazione')
                    if (p.accredito) attivita.push('Accredito')
                    
                    return (
                      <tr key={p.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium">{p.eventoNome}</td>
                        <td className="py-3 px-4 text-sm">
                          {p.eventoDataInizio ? new Date(p.eventoDataInizio).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm">{p.eventoLocation || '-'}</td>
                        <td className="py-3 px-4 text-sm">{p.tipoContratto || '-'}</td>
                        <td className="py-3 px-4 text-right font-semibold text-green-600">
                          €{parseFloat(p.fee || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {attivita.map((a, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                {a}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
