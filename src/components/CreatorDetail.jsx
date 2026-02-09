import { useState, useEffect } from 'react'
import { ArrowLeft, Edit, Mail, Phone, Calendar, DollarSign, TrendingUp, Plus, AlertCircle } from 'lucide-react'
import CollaborationForm from './CollaborationForm'
import { getCollaborationsByCreator, createCollaboration } from '../services/collaborationService'

export default function CreatorDetail({ creator, onEdit, onBack }) {
  const [activeTab, setActiveTab] = useState('info')
  const [showCollabForm, setShowCollabForm] = useState(false)
  const [collaborations, setCollaborations] = useState([])
  const [loading, setLoading] = useState(false)

  // Carica collaborazioni quando si apre il tab
  useEffect(() => {
    if (activeTab === 'collaborazioni') {
      loadCollaborations()
    }
  }, [activeTab, creator.id])

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
      alert('Errore durante la creazione della collaborazione')
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
      MID: 'bg-purple-100 text-purple-800',
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
      IN_TRATTATIVA: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Trattativa' },
      FIRMATO: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Firmato' },
      IN_CORSO: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'In Corso' },
      COMPLETATO: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completato' },
      ANNULLATO: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annullato' },
    }
    const { bg, text, label } = config[status] || config.IN_TRATTATIVA
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>{label}</span>
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
            <div className="flex gap-2 mb-4">
              <TierBadge tier={creator.tier} />
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
            onClick={() => setActiveTab('contattati')}
            className={`pb-3 px-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'contattati'
                ? 'border-yellow-400 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Brand Contattati
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          {/* Fee & Strategie */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Fee & Tariffe
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InfoRow label="Fee Video YouTube" value={creator.feeYoutube ? `€${creator.feeYoutube}` : '-'} />
              <InfoRow label="Fee Stories" value={creator.feeStories ? `€${creator.feeStories}` : '-'} />
              <InfoRow label="Fee Story Set" value={creator.feeStorySet ? `€${creator.feeStorySet}` : '-'} />
              <InfoRow label="Collaborazioni Lunghe" value={creator.collaborazioniLunghe ? `€${creator.collaborazioniLunghe}` : '-'} />
              <InfoRow label="Fiere & Eventi" value={creator.fiereEventi ? `€${creator.fiereEventi}` : '-'} />
              <InfoRow label="Logo Twitch" value={creator.logoTwitch ? `€${creator.logoTwitch}` : '-'} />
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
                brands={[]}
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

      {activeTab === 'contattati' && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Brand Contattati</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500">
              <Plus className="w-4 h-4" />
              Aggiungi Brand
            </button>
          </div>
          <div className="flex items-center gap-3 text-gray-500 py-8">
            <AlertCircle className="w-5 h-5" />
            <p>Nessun brand contattato - Feature in sviluppo</p>
          </div>
        </div>
      )}
    </div>
  )
}
