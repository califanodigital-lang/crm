import { useState, useEffect } from 'react'
import { ArrowLeft, Edit, Mail, Phone, Globe, Calendar, AlertCircle, Plus } from 'lucide-react'
import CollaborationForm from './CollaborationForm'
import { getCollaborationsByBrand, createCollaboration } from '../services/collaborationService'
import { getAllCreators } from '../services/creatorService'

export default function BrandDetail({ brand, onEdit, onBack }) {
  const [activeTab, setActiveTab] = useState('info')
  const [showCollabForm, setShowCollabForm] = useState(false)
  const [collaborations, setCollaborations] = useState([])
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(false)

  // Carica collaborazioni e creator
  useEffect(() => {
    if (activeTab === 'collaborazioni') {
      loadCollaborations()
      loadCreators()
    }
  }, [activeTab, brand.nome])

  const loadCollaborations = async () => {
    setLoading(true)
    const { data } = await getCollaborationsByBrand(brand.nome)
    setCollaborations(data || [])
    setLoading(false)
  }

  const loadCreators = async () => {
    const { data } = await getAllCreators()
    setCreators(data || [])
  }

  const handleSaveCollaboration = async (collabData) => {
    setLoading(true)
    // Pre-compila il nome brand
    const dataWithBrand = { ...collabData, brandNome: brand.nome }
    const { error } = await createCollaboration(dataWithBrand)
    
    if (error) {
      alert('Errore durante la creazione della collaborazione')
      console.error(error)
    } else {
      setShowCollabForm(false)
      await loadCollaborations()
    }
    setLoading(false)
  }

  const InfoRow = ({ label, value }) => (
    <div className="mb-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-900">{value || '-'}</div>
    </div>
  )

  const StatusBadge = ({ status }) => {
    const colors = {
      DA_CONTATTARE: 'bg-gray-100 text-gray-800',
      CONTATTATO: 'bg-blue-100 text-blue-800',
      IN_TRATTATIVA: 'bg-yellow-100 text-yellow-800',
      CHIUSO: 'bg-green-100 text-green-800',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  const PriorityBadge = ({ priority }) => {
    const colors = {
      BASSA: 'bg-gray-100 text-gray-800',
      NORMALE: 'bg-blue-100 text-blue-800',
      ALTA: 'bg-yellow-100 text-yellow-800',
      URGENTE: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[priority]}`}>
        {priority}
      </span>
    )
  }

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
          onClick={() => onEdit(brand)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Modifica
        </button>
      </div>

      {/* Brand Header Card */}
      <div className="card mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{brand.nome}</h1>
            {brand.settore && (
              <p className="text-lg text-gray-600 mb-3">{brand.settore}</p>
            )}
            <div className="flex gap-2 mb-4">
              <StatusBadge status={brand.stato} />
              <PriorityBadge priority={brand.priorita} />
            {brand.categorie && brand.categorie.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {brand.categorie.map((cat, index) => (
                  <span key={index} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                    {cat}
                  </span>
                ))}
              </div>
            )}
            </div>
          </div>
          <div className="text-right space-y-2">
            {brand.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${brand.email}`} className="text-sm hover:text-yellow-600">
                  {brand.email}
                </a>
              </div>
            )}
            {brand.telefono && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <a href={`tel:${brand.telefono}`} className="text-sm hover:text-yellow-600">
                  {brand.telefono}
                </a>
              </div>
            )}
            {brand.sitoWeb && (
              <div className="flex items-center gap-2 text-gray-600">
                <Globe className="w-4 h-4" />
                <a href={brand.sitoWeb} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-yellow-600">
                  Visita sito
                </a>
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
            onClick={() => setActiveTab('storico')}
            className={`pb-3 px-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'storico'
                ? 'border-yellow-400 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Storico Contatti
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          {/* Informazioni Generali */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Informazioni Generali</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InfoRow label="Settore" value={brand.settore} />
              <InfoRow label="Categoria" value={brand.categoria} />
              <InfoRow label="Target Demografico" value={brand.target} />
              <InfoRow label="Categoria ADV" value={brand.categoriaAdv} />
              <InfoRow label="Referente" value={brand.referente} />
              <InfoRow label="Agente Assegnato" value={brand.agente} />
            </div>
          </div>

          {/* Contatto */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Dettagli Contatto
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoRow label="Data Ultimo Contatto" value={brand.dataContatto} />
              <InfoRow label="Contattato Per" value={brand.contattatoPer} />
              <InfoRow label="Risposta" value={brand.risposta} />
            </div>
          </div>

          {/* Creator Suggeriti */}
          {brand.creatorSuggeriti && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Creator Suggeriti</h2>
              <p className="text-gray-700">{brand.creatorSuggeriti}</p>
            </div>
          )}

          {/* Note */}
          {brand.note && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Note</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{brand.note}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'collaborazioni' && (
        <div className="card">
          {showCollabForm ? (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Nuova Collaborazione per {brand.nome}</h2>
              <CollaborationForm
                collaboration={null}
                creators={creators}
                brands={[]}
                onSave={handleSaveCollaboration}
                onCancel={() => setShowCollabForm(false)}
              />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Collaborazioni Attive</h2>
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
                  <p>Nessuna collaborazione attiva con questo brand</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Creator</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo ADV</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Pagamento</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Stato</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Data Firma</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collaborations.map((collab) => (
                        <tr key={collab.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{collab.creatorNome}</td>
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

      {activeTab === 'storico' && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Storico Contatti</h2>
          <div className="space-y-4">
            {brand.dataContatto && (
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-900">Primo Contatto</p>
                    <span className="text-sm text-gray-500">{brand.dataContatto}</span>
                  </div>
                  {brand.risposta && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Risposta:</span> {brand.risposta}
                    </p>
                  )}
                  {brand.contattatoPer && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Motivo:</span> {brand.contattatoPer}
                    </p>
                  )}
                  {brand.agente && (
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Agente:</span> {brand.agente}
                    </p>
                  )}
                </div>
              </div>
            )}
            {!brand.dataContatto && (
              <div className="flex items-center gap-3 text-gray-500 py-4">
                <AlertCircle className="w-5 h-5" />
                <p>Nessun contatto registrato</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
