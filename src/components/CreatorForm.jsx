import { useState, useEffect } from 'react'
import { getActiveAgents } from '../services/userService'
import CreatorPiattaforme from './CreatorPiattaforme'
import { getAllPiattaforme } from '../services/piattaformeService'

export default function CreatorForm({ creator = null, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    nome: '',
    nomeCompleto: '',
    email: '',
    cellulare: '',
    topic: '',
    categoriaAdv: '',
    stato: '',
    ricontattare: false,
    insight: '',
    fiereEventi: '',
    dataContratto: '',
    scadenzaContratto: '',
    tipoContratto: '',
    proviggioni: '',
    sales: '',
    mediakit: '',
    ultimoAggiornamentoMediakit: '',
    strategia: '',
    obiettivo: '',
    preferenzaCollaborazioni: '',
    note: '',
  })

  const [agenti, setAgenti] = useState([])
  const [piattaforme, setPiattaforme] = useState([])
  const [creatorPiattaforme, setCreatorPiattaforme] = useState([])

  useEffect(() => {
    loadAgenti()
    loadPiattaforme()
  }, [])

  useEffect(() => {
    if (creator) setFormData(creator)
    if (creator?.id) {
    // Carica piattaforme esistenti del creator
    import('../services/piattaformeService').then(({ getPiattaformeByCreator }) => {
      getPiattaformeByCreator(creator.id).then(({ data }) => {
        if (data) setCreatorPiattaforme(data.map(p => ({
          nome: p.piattaforma_nome,
          tier: p.tier || '',
          fees: p.fees || {},
          note: p.note || ''
        })))
      })
    })
  }
  }, [creator])

  const loadAgenti = async () => {
    const { data } = await getActiveAgents()
    setAgenti(data || [])
  }

  const loadPiattaforme = async () => {
    const { data } = await getAllPiattaforme()
    setPiattaforme(data || [])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData, creatorPiattaforme)
  }

  return (
    <form onSubmit={handleSubmit}>

      {/* ── INFORMAZIONI GENERALI ── */}
      <h3 className="text-lg font-bold text-gray-900 mb-4">Informazioni Generali</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        <div>
          <label className="label">Nome Creator *</label>
          <input
            className="input"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="label">Nome Completo</label>
          <input
            className="input"
            value={formData.nomeCompleto}
            onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Cellulare</label>
          <input
            className="input"
            value={formData.cellulare}
            onChange={(e) => setFormData({ ...formData, cellulare: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Tier</label>
          <select
            className="input"
            value={formData.tier}
            onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
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
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Mediakit (URL)</label>
          <input
            type="url"
            className="input"
            value={formData.mediakit}
            onChange={(e) => setFormData({ ...formData, mediakit: e.target.value })}
            placeholder="https://onedrive.live.com/..."
          />
          <p className="text-xs text-gray-500 mt-1">Link OneDrive, Google Drive, Dropbox, etc.</p>
        </div>

        <div>
          <label className="label">Ultimo Aggiornamento Mediakit</label>
          <input
            type="date"
            className="input"
            value={formData.ultimoAggiornamentoMediakit}
            onChange={(e) => setFormData({ ...formData, ultimoAggiornamentoMediakit: e.target.value })}
          />
        </div>

        <div className="md:col-span-2">
          <label className="label">Categorie ADV</label>
          <input
            className="input"
            placeholder="FOOD, TECH, GAMING..."
            value={formData.categoriaAdv}
            onChange={(e) => setFormData({ ...formData, categoriaAdv: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="label">Stato</label>
        <select className="input" value={formData.stato}
          onChange={(e) => setFormData({...formData, stato: e.target.value})}>
          <option value="">Seleziona...</option>
          <option value="1 Sotto contratto">Sotto Contratto</option>
          <option value="2 Ex cliente">Ex Cliente</option>
          <option value="3 Prospect">Prospect</option>
        </select>
      </div>

      <div className="flex items-center gap-3 pt-6">
        <input type="checkbox" id="ricontattare"
          checked={formData.ricontattare}
          onChange={(e) => setFormData({...formData, ricontattare: e.target.checked})}
          className="w-4 h-4 text-yellow-400 border-gray-300 rounded" />
        <label htmlFor="ricontattare" className="label mb-0">Da Ricontattare</label>
      </div>

      {/* ── FEE & CONTRATTO ── */}
      <h3 className="text-lg font-bold text-gray-900 mb-4">Contratto</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="label">Tipo Contratto</label>
          <select className="input" value={formData.tipoContratto}
            onChange={(e) => setFormData({...formData, tipoContratto: e.target.value})}>
            <option value="">Seleziona...</option>
            <option value="MENSILE">Mensile</option>
            <option value="ANNUALE">Annuale</option>
            <option value="PROGETTO">A Progetto</option>
          </select>
        </div>
        <div>
          <label className="label">Proviggioni (%)</label>
          <input type="number" step="0.1" className="input"
            value={formData.proviggioni}
            onChange={(e) => setFormData({...formData, proviggioni: e.target.value})}
            placeholder="es. 25" />
        </div>
        <div>
          <label className="label">Data Firma Contratto</label>
          <input type="date" className="input" value={formData.dataContratto}
            onChange={(e) => setFormData({...formData, dataContratto: e.target.value})} />
        </div>
        <div>
          <label className="label">Scadenza Contratto</label>
          <input type="date" className="input" value={formData.scadenzaContratto}
            onChange={(e) => setFormData({...formData, scadenzaContratto: e.target.value})} />
        </div>
        <div>
          <label className="label">Sales</label>
          <select className="input" value={formData.sales}
            onChange={(e) => setFormData({...formData, sales: e.target.value})}>
            <option value="">Nessuno</option>
            {agenti.map(a => <option key={a.id} value={a.agenteNome}>{a.nomeCompleto}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Fee Fiere & Eventi (€)</label>
          <input type="number" step="0.01" className="input"
            value={formData.fiereEventi}
            onChange={(e) => setFormData({...formData, fiereEventi: e.target.value})} />
          <p className="text-xs text-gray-500 mt-1">Fee standard per partecipazione a fiere/eventi</p>
        </div>
        <div>
          <label className="label">Fee Collaborazioni Lunghe (€)</label>
          <input type="number" step="0.01" className="input"
            value={formData.collaborazioniLunghe}
            onChange={(e) => setFormData({...formData, collaborazioniLunghe: e.target.value})} />
        </div>
      </div>

      {/* ── PIATTAFORME ── */}
      <div className="mb-8">
        <CreatorPiattaforme
          piattaforme={piattaforme}
          value={creatorPiattaforme}
          onChange={setCreatorPiattaforme}
        />
      </div>

      {/* ── STRATEGIA ── */}
      <h3 className="text-lg font-bold text-gray-900 mb-4">Strategia & Preferenze</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        <div>
          <label className="label">Obiettivo</label>
          <input
            className="input"
            value={formData.obiettivo}
            onChange={(e) => setFormData({ ...formData, obiettivo: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Preferenza Collaborazioni</label>
          <input
            className="input"
            value={formData.preferenzaCollaborazioni}
            onChange={(e) => setFormData({ ...formData, preferenzaCollaborazioni: e.target.value })}
          />
        </div>

        <div className="md:col-span-2">
          <label className="label">Strategia</label>
          <textarea
            className="input min-h-[80px]"
            value={formData.strategia}
            onChange={(e) => setFormData({ ...formData, strategia: e.target.value })}
          />
        </div>

      </div>

      <div className="mb-6">
        <label className="label">Note</label>
        <textarea
          className="input min-h-[100px]"
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
