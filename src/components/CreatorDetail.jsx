import { useState, useEffect } from 'react'
import { ArrowLeft, Edit, Mail, Phone, Calendar, DollarSign, TrendingUp, Plus, AlertCircle, Trash2 } from 'lucide-react'
import CollaborationForm from './CollaborationForm'
import { getCollaborationsByCreator, createCollaboration } from '../services/collaborationService'
import { getAllBrands } from '../services/brandService'
import { getBrandContattatiByCreator, addBrandContattato, deleteBrandContattato, updateBrandContattato } from '../services/brandContattatoService'
import { getActiveAgents } from '../services/userService'

export default function CreatorDetail({ creator, onEdit, onBack }) {
  const [activeTab, setActiveTab] = useState('info')
  const [showCollabForm, setShowCollabForm] = useState(false)
  const [collaborations, setCollaborations] = useState([])
  const [loading, setLoading] = useState(false)
  const [brands, setBrands] = useState([])
  const [brandContattati, setBrandContattati] = useState([])
  const [showBrandForm, setShowBrandForm] = useState(false)
  const [agenti, setAgenti] = useState([])
  const [brandForm, setBrandForm] = useState({
    brandNome: '',
    settore: '',
    dataContatto: '',
    risposta: '',
    contattatoPer: '',
    referenti: '',
    email: '',
    telefono: '',
    agente: '',
    sitoWeb: '',
    note: '',
    contrattoChiuso: false
  })
  const [editingBrandContattato, setEditingBrandContattato] = useState(null)

  // Carica collaborazioni quando si apre il tab
  useEffect(() => {
    if (activeTab === 'collaborazioni') {
      loadCollaborations()
      loadBrands()
    }
    if (activeTab === 'contattati') {
        loadBrandContattati()
        loadAgenti()
        loadBrands()
    }
  }, [activeTab, creator.id])

  const loadBrands = async () => {
    const { data } = await getAllBrands()
    setBrands(data || [])
  }

  const loadCollaborations = async () => {
    setLoading(true)
    const { data } = await getCollaborationsByCreator(creator.id)
    setCollaborations(data || [])
    setLoading(false)
  }

  const loadBrandContattati = async () => {
    setLoading(true)
    const { data } = await getBrandContattatiByCreator(creator.id)
    setBrandContattati(data || [])
    setLoading(false)
  }

  const loadAgenti = async () => {
    const { data } = await getActiveAgents()
    setAgenti(data || [])
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

  const handleBrandSelect = (brandNome) => {
    const selectedBrand = brands.find(b => b.nome === brandNome)
    
    if (selectedBrand) {
      setBrandForm({
        ...brandForm,
        brandNome: selectedBrand.nome,
        settore: selectedBrand.settore || brandForm.settore,
        email: selectedBrand.contatto || brandForm.email,
        telefono: selectedBrand.telefono || brandForm.telefono,
        sitoWeb: selectedBrand.sitoWeb || brandForm.sitoWeb,
        agente: selectedBrand.agente || brandForm.agente,
      })
    } else {
      setBrandForm({...brandForm, brandNome})
    }
  }

  const handleEditBrandContattato = (bc) => {
    setBrandForm({
      brandNome: bc.brandNome,
      settore: bc.settore,
      dataContatto: bc.dataContatto,
      risposta: bc.risposta,
      contattatoPer: bc.contattatoPer,
      referenti: bc.referenti,
      email: bc.email,
      telefono: bc.telefono,
      agente: bc.agente,
      sitoWeb: bc.sitoWeb,
      note: bc.note,
      contrattoChiuso: bc.contrattoChiuso
    })
    setEditingBrandContattato(bc)
    setShowBrandForm(true)
  }

  const handleSaveBrandContattato = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    let error
    if (editingBrandContattato) {
      // UPDATE
      const result = await updateBrandContattato(editingBrandContattato.id, {
        ...brandForm,
        creatorId: creator.id
      })
      error = result.error
    } else {
      // CREATE
      const result = await addBrandContattato({
        ...brandForm,
        creatorId: creator.id
      })
      error = result.error
    }
    
    if (error) {
      alert('Errore durante il salvataggio')
      console.error(error)
    } else {
      setBrandForm({
        brandNome: '', settore: '', dataContatto: '', risposta: '', contattatoPer: '',
        referenti: '', email: '', telefono: '', agente: '', sitoWeb: '', note: '', contrattoChiuso: false
      })
      setShowBrandForm(false)
      setEditingBrandContattato(null)
      await loadBrandContattati()
    }
    setLoading(false)
  }

  const handleDeleteBrandContattato = async (id) => {
    if (!confirm('Eliminare questo contatto?')) return
    setLoading(true)
    await deleteBrandContattato(id)
    await loadBrandContattati()
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

      {activeTab === 'contattati' && (
        <div className="card">
          {showBrandForm ? (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingBrandContattato ? 'Modifica' : 'Aggiungi'} Brand Contattato
              </h2>
              <form onSubmit={handleSaveBrandContattato}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="label">Brand *</label>
                      <select
                        className="input"
                        value={brandForm.brandNome}
                        onChange={(e) => handleBrandSelect(e.target.value)}  // <-- MODIFICA
                        required
                      >
                        <option value="">Seleziona brand...</option>
                        {brands.map(b => (
                          <option key={b.id} value={b.nome}>{b.nome}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        I dati del brand verranno compilati automaticamente
                      </p>
                    </div>
                  <div>
                      <label className="label">Settore</label>
                      <input 
                        className="input bg-gray-50" 
                        value={brandForm.settore} 
                        onChange={(e) => setBrandForm({...brandForm, settore: e.target.value})} 
                        placeholder="Auto-compilato da brand"
                      />
                    </div>
                  <div>
                    <label className="label">Data Contatto</label>
                    <input type="date" className="input" value={brandForm.dataContatto} onChange={(e) => setBrandForm({...brandForm, dataContatto: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Risposta</label>
                    <input className="input" value={brandForm.risposta} onChange={(e) => setBrandForm({...brandForm, risposta: e.target.value})} placeholder="Positiva, Negativa..." />
                  </div>
                  <div>
                    <label className="label">Contattato Per</label>
                    <input className="input" value={brandForm.contattatoPer} onChange={(e) => setBrandForm({...brandForm, contattatoPer: e.target.value})} placeholder="Video, Stories..." />
                  </div>
                  <div>
                    <label className="label">Referenti</label>
                    <input className="input" value={brandForm.referenti} onChange={(e) => setBrandForm({...brandForm, referenti: e.target.value})} />
                  </div>
                  <div>
                      <label className="label">Email</label>
                      <input 
                        type="email" 
                        className="input bg-gray-50" 
                        value={brandForm.email} 
                        onChange={(e) => setBrandForm({...brandForm, email: e.target.value})} 
                        placeholder="Auto-compilato da brand"
                      />
                    </div>
                  <div>
                      <label className="label">Telefono</label>
                      <input 
                        className="input bg-gray-50" 
                        value={brandForm.telefono} 
                        onChange={(e) => setBrandForm({...brandForm, telefono: e.target.value})} 
                        placeholder="Auto-compilato da brand"
                      />
                    </div>
                  <div>
                    <label className="label">Agente</label>
                    <select className="input" value={brandForm.agente} onChange={(e) => setBrandForm({...brandForm, agente: e.target.value})}>
                      <option value="">Nessuno</option>
                      {agenti.map(a => <option key={a.id} value={a.agenteNome}>{a.nomeCompleto}</option>)}
                    </select>
                  </div>
                  <div>
                      <label className="label">Sito Web</label>
                      <input 
                        type="url" 
                        className="input bg-gray-50" 
                        value={brandForm.sitoWeb} 
                        onChange={(e) => setBrandForm({...brandForm, sitoWeb: e.target.value})} 
                        placeholder="Auto-compilato da brand"
                      />
                    </div>
                  <div className="md:col-span-2">
                    <label className="label">Note</label>
                    <textarea className="input" value={brandForm.note} onChange={(e) => setBrandForm({...brandForm, note: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={brandForm.contrattoChiuso} onChange={(e) => setBrandForm({...brandForm, contrattoChiuso: e.target.checked})} />
                      <span className="text-sm font-medium">Contratto Chiuso</span>
                    </label>
                  </div>
                </div>
                <div className="mt-6 flex gap-3 justify-end">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowBrandForm(false)
                      setEditingBrandContattato(null)
                    }} 
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Annulla
                  </button>
                  <button type="submit" className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500">Salva</button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Brand Contattati</h2>
                <button onClick={() => setShowBrandForm(true)} className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500">
                  <Plus className="w-4 h-4" />
                  Aggiungi Brand
                </button>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                </div>
              ) : brandContattati.length === 0 ? (
                <div className="flex items-center gap-3 text-gray-500 py-8">
                  <AlertCircle className="w-5 h-5" />
                  <p>Nessun brand contattato</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4">Brand</th>
                        <th className="text-left py-3 px-4">Data Contatto</th>
                        <th className="text-left py-3 px-4">Risposta</th>
                        <th className="text-left py-3 px-4">Contattato Per</th>
                        <th className="text-center py-3 px-4">Contratto</th>
                        <th className="text-right py-3 px-4">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brandContattati.map((bc) => (
                        <tr key={bc.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{bc.brandNome}</td>
                          <td className="py-3 px-4 text-gray-600">{bc.dataContatto || '-'}</td>
                          <td className="py-3 px-4 text-gray-600">{bc.risposta || '-'}</td>
                          <td className="py-3 px-4 text-gray-600">{bc.contattatoPer || '-'}</td>
                          <td className="py-3 px-4 text-center">
                            {bc.contrattoChiuso ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">✓ Chiuso</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleEditBrandContattato(bc)} 
                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
                                title="Modifica"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteBrandContattato(bc.id)} 
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                title="Elimina"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
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
    </div>
  )
}
