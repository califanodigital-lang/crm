import { useState, useEffect } from 'react'

export default function CreatorForm({ creator = null, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    nome: '',
    nomeCompleto: '',
    email: '',
    cellulare: '',
    tier: '',
    topic: '',
    categoriaAdv: '',
    feeYoutube: '',
    feeStories: '',
    feeStorySet: '',
    dataContratto: '',
    scadenzaContratto: '',
    tipoContratto: '',
    note: '',
  })

  useEffect(() => {
    if (creator) setFormData(creator)
  }, [creator])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-lg font-bold text-gray-900 mb-4">Informazioni Generali</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="label">Nome Creator *</label>
          <input
            className="input"
            value={formData.nome}
            onChange={(e) => setFormData({...formData, nome: e.target.value})}
            required
          />
        </div>
        
        <div>
          <label className="label">Nome Completo</label>
          <input
            className="input"
            value={formData.nomeCompleto}
            onChange={(e) => setFormData({...formData, nomeCompleto: e.target.value})}
          />
        </div>
        
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>
        
        <div>
          <label className="label">Cellulare</label>
          <input
            className="input"
            value={formData.cellulare}
            onChange={(e) => setFormData({...formData, cellulare: e.target.value})}
          />
        </div>
        
        <div>
          <label className="label">Tier</label>
          <select
            className="input"
            value={formData.tier}
            onChange={(e) => setFormData({...formData, tier: e.target.value})}
          >
            <option value="">Seleziona...</option>
            <option value="NANO">NANO (5-10K)</option>
            <option value="MICRO">MICRO (10-50K)</option>
            <option value="MID">MID TIER (50-300K)</option>
            <option value="CELEBRITY">CELEBRITY (3M+)</option>
          </select>
        </div>
        
        <div>
          <label className="label">Topic</label>
          <input
            className="input"
            placeholder="Gaming, Tech, Food..."
            value={formData.topic}
            onChange={(e) => setFormData({...formData, topic: e.target.value})}
          />
        </div>

        {/* Mediakit URL */}
        <div>
          <label className="label">Mediakit (URL)</label>
          <input
            type="url"
            className="input"
            value={formData.mediakit}
            onChange={(e) => setFormData({...formData, mediakit: e.target.value})}
            placeholder="https://onedrive.live.com/..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Link OneDrive, Google Drive, Dropbox, etc.
          </p>
        </div>

        {/* Data Aggiornamento Mediakit */}
        <div>
          <label className="label">Ultimo Aggiornamento Mediakit</label>
          <input
            type="date"
            className="input"
            value={formData.ultimoAggiornamentoMediakit}
            onChange={(e) => setFormData({...formData, ultimoAggiornamentoMediakit: e.target.value})}
          />
        </div>
          
        <div className="md:col-span-2">
          <label className="label">Categorie ADV</label>
          <input
            className="input"
            placeholder="FOOD, TECH, GAMING..."
            value={formData.categoriaAdv}
            onChange={(e) => setFormData({...formData, categoriaAdv: e.target.value})}
          />
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-4">Fee & Contratto</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="label">Fee Video YouTube (€)</label>
          <input
            type="number"
            className="input"
            value={formData.feeYoutube}
            onChange={(e) => setFormData({...formData, feeYoutube: e.target.value})}
          />
        </div>
        
        <div>
          <label className="label">Fee Stories (€)</label>
          <input
            type="number"
            className="input"
            value={formData.feeStories}
            onChange={(e) => setFormData({...formData, feeStories: e.target.value})}
          />
        </div>
        
        <div>
          <label className="label">Fee Story Set (€)</label>
          <input
            type="number"
            className="input"
            value={formData.feeStorySet}
            onChange={(e) => setFormData({...formData, feeStorySet: e.target.value})}
          />
        </div>
        
        <div>
          <label className="label">Tipo Contratto</label>
          <select
            className="input"
            value={formData.tipoContratto}
            onChange={(e) => setFormData({...formData, tipoContratto: e.target.value})}
          >
            <option value="">Seleziona...</option>
            <option value="MENSILE">Mensile</option>
            <option value="ANNUALE">Annuale</option>
            <option value="PROGETTO">A Progetto</option>
          </select>
        </div>
        
        <div>
          <label className="label">Data Firma Contratto</label>
          <input
            type="date"
            className="input"
            value={formData.dataContratto}
            onChange={(e) => setFormData({...formData, dataContratto: e.target.value})}
          />
        </div>
        
        <div>
          <label className="label">Scadenza Contratto</label>
          <input
            type="date"
            className="input"
            value={formData.scadenzaContratto}
            onChange={(e) => setFormData({...formData, scadenzaContratto: e.target.value})}
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="label">Note</label>
        <textarea
          className="input min-h-[100px]"
          value={formData.note}
          onChange={(e) => setFormData({...formData, note: e.target.value})}
        />
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
          {creator ? 'Aggiorna' : 'Crea'} Creator
        </button>
      </div>
    </form>
  )
}
