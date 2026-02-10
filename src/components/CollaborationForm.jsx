import { useState, useEffect } from 'react'
import { getActiveAgents } from '../services/userService'

export default function CollaborationForm({ collaboration = null, creators = [], brands = [],  prefilledBrand = null, prefilledCreatorId = null, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    creatorId: prefilledCreatorId || '',
    brandNome: prefilledBrand || '',
    pagamento: '',
    feeManagement: '',
    dataFirma: '',
    adv: '',
    agente: '',
    sales: '',
    stato: 'IN_TRATTATIVA',
    pagato: false,
    contatto: '',
    note: '',
  })

  const [agenti, setAgenti] = useState([])

  useEffect(() => {
      loadAgenti()
    }, [])

    const loadAgenti = async () => {
      const { data } = await getActiveAgents()
      setAgenti(data || [])
    }

  useEffect(() => {
    if (collaboration) {
      setFormData(collaboration)
    }
  }, [collaboration])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleBrandSelect = (brandNome) => {
    const selectedBrand = brands.find(b => b.nome === brandNome)
    
    if (selectedBrand) {
      setFormData({
        ...formData,
        brandNome: selectedBrand.nome,
        agente: selectedBrand.agente || formData.agente,
      })
    } else {
      setFormData({...formData, brandNome})
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Creator */}
        <div>
          <label className="label">Creator *</label>
          <select
            className="input"
            value={formData.creatorId}
            onChange={(e) => setFormData({...formData, creatorId: e.target.value})}
            disabled={!!prefilledCreatorId}  // <-- AGGIUNGI
            required
          >
            <option value="">Seleziona creator...</option>
            {creators.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          {prefilledCreatorId && (
            <p className="text-xs text-gray-500 mt-1">Creator preselezionato</p>
          )}
        </div>

        {/* Brand */}
        <div>
          <label className="label">Brand *</label>
          {prefilledBrand ? (
            <>
              <input className="input bg-gray-100" value={formData.brandNome} disabled required />
              <p className="text-xs text-gray-500 mt-1">Brand preselezionato</p>
            </>
          ) : (
            <>
              <select
                className="input"
                value={formData.brandNome}
                onChange={(e) => handleBrandSelect(e.target.value)}  // <-- MODIFICA
                required
              >
                <option value="">Seleziona brand...</option>
                {brands.map(b => (
                  <option key={b.id} value={b.nome}>{b.nome}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                L'agente verrà compilato automaticamente dal brand
              </p>
            </>
          )}
        </div>

        {/* Pagamento */}
        <div>
          <label className="label">Pagamento Totale (€)</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={formData.pagamento}
            onChange={(e) => setFormData({...formData, pagamento: e.target.value})}
          />
        </div>

        {/* Fee Management */}
        <div>
          <label className="label">Fee Management (€)</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={formData.feeManagement}
            onChange={(e) => setFormData({...formData, feeManagement: e.target.value})}
          />
        </div>

        {/* Data Firma */}
        <div>
          <label className="label">Data Firma Contratto</label>
          <input
            type="date"
            className="input"
            value={formData.dataFirma}
            onChange={(e) => setFormData({...formData, dataFirma: e.target.value})}
          />
        </div>

        {/* Tipo ADV */}
        <div>
          <label className="label">Tipo ADV</label>
          <select
            className="input"
            value={formData.adv}
            onChange={(e) => setFormData({...formData, adv: e.target.value})}
          >
            <option value="">Seleziona...</option>
            <option value="VIDEO_YOUTUBE">Video YouTube</option>
            <option value="STORIES">Stories</option>
            <option value="STORY_SET">Story Set</option>
            <option value="POST_INSTAGRAM">Post Instagram</option>
            <option value="REEL">Reel</option>
            <option value="TWITCH">Twitch</option>
            <option value="COLLABORAZIONE_LUNGA">Collaborazione Lunga</option>
          </select>
        </div>

        {/* Agente */}
        <div>
          <label className="label">Agente</label>
          <select
            className="input bg-gray-50"
            value={formData.agente}
            onChange={(e) => setFormData({...formData, agente: e.target.value})}
          >
            <option value="">Nessuno</option>
            {agenti.map(a => (
              <option key={a.id} value={a.agenteNome}>{a.nomeCompleto}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Auto-compilato da brand, modificabile</p>
        </div>

        {/* Sales */}
        <div>
          <label className="label">Sales</label>
          <select
            className="input"
            value={formData.sales}
            onChange={(e) => setFormData({...formData, sales: e.target.value})}
          >
            <option value="">Nessuno</option>
            {agenti.map(a => (
              <option key={a.id} value={a.agenteNome}>{a.nomeCompleto}</option>
            ))}
          </select>
        </div>

        {/* Stato */}
        <div>
          <label className="label">Stato *</label>
          <select
            className="input"
            value={formData.stato}
            onChange={(e) => setFormData({...formData, stato: e.target.value})}
            required
          >
            <option value="IN_TRATTATIVA">In Trattativa</option>
            <option value="FIRMATO">Firmato</option>
            <option value="IN_CORSO">In Corso</option>
            <option value="COMPLETATO">Completato</option>
            <option value="ANNULLATO">Annullato</option>
          </select>
        </div>

        {/* Pagato */}
        <div className="flex items-center gap-3 pt-6">
          <input
            type="checkbox"
            id="pagato"
            checked={formData.pagato}
            onChange={(e) => setFormData({...formData, pagato: e.target.checked})}
            className="w-4 h-4 text-yellow-400 border-gray-300 rounded focus:ring-yellow-400"
          />
          <label htmlFor="pagato" className="label mb-0">Pagato</label>
        </div>

        {/* Contatto */}
        <div>
          <label className="label">Contatto</label>
          <input
            className="input"
            value={formData.contatto}
            onChange={(e) => setFormData({...formData, contatto: e.target.value})}
            placeholder="Email o telefono"
          />
        </div>

        {/* Note */}
        <div className="md:col-span-2">
          <label className="label">Note</label>
          <textarea
            className="input min-h-[100px]"
            value={formData.note}
            onChange={(e) => setFormData({...formData, note: e.target.value})}
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Annulla
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
        >
          {collaboration ? 'Aggiorna' : 'Crea'} Collaborazione
        </button>
      </div>
    </form>
  )
}
