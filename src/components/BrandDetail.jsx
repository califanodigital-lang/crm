import { useState, useEffect } from 'react'
import { ArrowLeft, Edit, Mail, Phone, Globe, Calendar, AlertCircle, Plus } from 'lucide-react'
import CollaborationForm from './CollaborationForm'
import { getCollaborationsByBrand, createCollaboration } from '../services/collaborationService'
import { getAllCreators } from '../services/creatorService'
import { toast } from '../components/Toast'
import { confirm } from '../components/ConfirmModal'
import { getTrattativeByBrand } from '../services/trattativaService'
import { getStatoTrattativa } from '../constants/constants'

export default function BrandDetail({ brand, onEdit, onBack }) {
  const [activeTab, setActiveTab] = useState('info')
  const [showCollabForm, setShowCollabForm] = useState(false)
  const [collaborations, setCollaborations] = useState([])
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(false)

  // Carica creators sempre (serve per info tab — creatorSuggeriti — e per form collaborazione)
  useEffect(() => {
    loadCreators()
  }, [])

  useEffect(() => {
    if (activeTab === 'collaborazioni') {
      loadCollaborations()
    }
  }, [activeTab, brand.id])

  const loadCollaborations = async () => {
    setLoading(true)
    const { data } = await getCollaborationsByBrand(brand.id)
    setCollaborations(data || [])
    setLoading(false)
  }

  const loadCreators = async () => {
    const { data } = await getAllCreators()
    setCreators(data || [])
  }

  const handleSaveCollaboration = async (collabData) => {
    setLoading(true)
    const { error } = await createCollaboration(collabData)
    if (error) {
      toast.error('Errore durante la creazione della collaborazione')
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
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace('_', ' ')}
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
      IN_LAVORAZIONE:           { bg: 'bg-purple-100',  text: 'text-purple-800',  label: 'In Lavorazione' },
      ATTESA_PAGAMENTO_CREATOR: { bg: 'bg-yellow-100',  text: 'text-yellow-800',  label: 'Attesa Pagamento Creator' },
      ATTESA_PAGAMENTO_AGENCY:  { bg: 'bg-amber-100',   text: 'text-amber-800',   label: 'Attesa Pagamento Agency' },
      COMPLETATA:               { bg: 'bg-green-100',   text: 'text-green-800',   label: 'Completata' },
      ANNULLATA:                { bg: 'bg-red-100',     text: 'text-red-800',     label: 'Annullata' },
    }
    const { bg, text, label } = config[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status }
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>{label}</span>
  }

function TrattativePerBrand({ brandId  }) {
  const [trattative, setTrattative] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    getTrattativeByBrand(brandId ).then(({ data }) => {
      setTrattative(data || [])
      setLoading(false)
    })
  }, [brandId ])
  if (loading) return <div className="py-6 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400" /></div>
  if (trattative.length === 0) return <p className="text-gray-400 text-sm py-4">Nessuna trattativa registrata per questo brand.</p>
  return (
    <div className="space-y-2">
      {trattative.map(t => {
        const cfg = getStatoTrattativa(t.stato)
        return (
          <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
            <div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
              {t.ima && <span className="ml-2 text-xs text-gray-400">{t.ima}</span>}
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
            {brand.settore && <p className="text-lg text-gray-600 mb-3">{brand.settore}</p>}
            <div className="flex flex-wrap gap-2 mb-4">
              {brand.categorie && brand.categorie.map((cat, i) => (
                <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">{cat}</span>
              ))}
              {brand.propostaId && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">🎯 Da Proposta</span>
              )}
            </div>
          </div>
          <div className="text-right space-y-2">
            {brand.contatto && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                {brand.contatto.includes('@') ? (
                  <a href={`mailto:${brand.contatto}`} className="text-sm hover:text-yellow-600">{brand.contatto}</a>
                ) : (
                  <a href={brand.contatto} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-yellow-600">Form Contatto</a>
                )}
              </div>
            )}
            {brand.telefono && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <a href={`tel:${brand.telefono}`} className="text-sm hover:text-yellow-600">{brand.telefono}</a>
              </div>
            )}
            {brand.sitoWeb && (
              <div className="flex items-center gap-2 text-gray-600">
                <Globe className="w-4 h-4" />
                <a href={brand.sitoWeb} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-yellow-600">Visita sito</a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6">
          {['info', 'collaborazioni'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-2 font-semibold transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-yellow-400 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'info' ? 'Informazioni' : 'Collaborazioni'}
            </button>
          ))}
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
        </div>
      </div>

      {/* ── TAB INFO ── */}
      {activeTab === 'info' && (
        <div className="space-y-6">

          {/* Informazioni generali */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Informazioni Generali</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InfoRow label="Settore" value={brand.settore} />
              <InfoRow label="Categoria" value={brand.categoria} />
              <InfoRow label="Target Demografico" value={brand.target} />
              <InfoRow label="Categoria ADV" value={brand.categoriaAdv} />
              <InfoRow label="Referente" value={brand.referente} />
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold mb-3">Storico commerciale</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Ultimo esito:</strong> {brand.ultimoEsito || '—'}</p>
              <p><strong>Ultima collaborazione:</strong> {brand.dataUltimaCollaborazione || '—'}</p>
              <p><strong>Collaborazioni passate:</strong> {brand.haCollaborazioniPassate ? 'Sì' : 'No'}</p>
            </div>
          </div>

          {/* Creator suggeriti — caricati da DB */}
          {brand.creatorSuggeriti && brand.creatorSuggeriti.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Creator Suggeriti</h2>
              <div className="flex flex-wrap gap-2">
                {brand.creatorSuggeriti.map(creatorId => {
                  const creator = creators.find(c => c.id === creatorId)
                  if (!creator) return null
                  return (
                    <span key={creatorId} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {creator.nome}
                    </span>
                  )
                })}
              </div>
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

      {/* ── TAB COLLABORAZIONI ── */}
      {activeTab === 'collaborazioni' && (
        <div className="card">
          {showCollabForm ? (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Nuova Collaborazione per {brand.nome}</h2>
              <CollaborationForm
                collaboration={null}
                creators={creators}
                brands={[]}
                prefilledBrand={brand.nome}
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

      {activeTab === 'trattative' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Trattative</h2>
            
              <a href="/trattative"
              className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
            >
              Vai a Trattative →
            </a>
          </div>
          <TrattativePerBrand brandId={brand.id} />
        </div>
      )}

    </div>
  )
}
