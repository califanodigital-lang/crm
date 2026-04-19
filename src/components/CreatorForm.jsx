import { useState, useEffect } from 'react'
import { getActiveAgents } from '../services/userService'
import CreatorPiattaforme from './CreatorPiattaforme'
import { getAllPiattaforme } from '../services/piattaformeService'
import { TIPO_CONTRATTO, CLUSTER, REGIONI } from '../constants/constants'
import {MultiSelectChips} from './MultiSelectChips'

export default function CreatorForm({ creator = null, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    nome: '',
    nomeCompleto: '',
    email: '',
    cellulare: '',
    cluster: [],
    regioni: [],
    categoriaAdv: '',
    stato: '',
    ricontattare: '',
    insight: '',
    dataContratto: '',
    scadenzaContratto: '',
    tipoContratto: '',
    fee: '',
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
          note: p.note || '',
          link: p.link_canale || '',
          iscritti: p.iscritti || '',
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await confirm('Salvare le modifiche al creator?', {
      title: 'Conferma salvataggio', confirmLabel: 'Salva'
    })
    if (!ok) return

    // Auto-calcola iscritti_max e tier globale dalle piattaforme
    const maxIscritti = creatorPiattaforme.reduce((max, p) => {
      const n = parseInt(p.iscritti) || 0
      return n > max ? n : max
    }, 0)

    const calcolaTier = (n) => {
      if (!n) return formData.tier || ''
      if (n >= 3000000) return 'CELEBRITY'
      if (n >= 500000) return 'MEGA'
      if (n >= 150000) return 'MACRO'
      if (n >= 50000) return 'MID'
      if (n >= 10000) return 'MICRO'
      return 'NANO'
    }

    const enrichedData = {
      ...formData,
      iscrittiMax: maxIscritti || null,
      tier: maxIscritti > 0 ? calcolaTier(maxIscritti) : (formData.tier || ''),
    }

    onSave(enrichedData, creatorPiattaforme)
  }

  return (
    <form onSubmit={handleSubmit} 
    onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault() }}
    className="space-y-0">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-8">
        <div className="md:col-span-2"><p className="form-section-title">Anagrafica</p></div>

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
            <option value="MACRO">MACRO (100-500K)</option>
            <option value="MEGA">MEGA (500K-3M)</option>
            <option value="CELEBRITY">CELEBRITY (3M+)</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <MultiSelectChips
            label="Cluster"
            value={formData.cluster}
            onChange={(v) => setFormData({...formData, cluster: v})}
            options={CLUSTER}
          />
        </div>

        <div className="md:col-span-2">
          <MultiSelectChips
            label="Regioni di Operatività"
            value={formData.regioni}
            onChange={(v) => setFormData({...formData, regioni: v})}
            options={REGIONI}
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

        <div>
          <label className="label">Stato</label>
          <select className="input" value={formData.stato}
            onChange={(e) => setFormData({...formData, stato: e.target.value})}>
            <option value="">Seleziona...</option>
            <option value="1 Sotto contratto">Sotto Contratto</option>
            <option value="2 Proposta in carico">Proposta in Carico</option>
            <option value="3 Trattativa">Trattativa</option>
            <option value="4 Possibilità future">Possibilità future</option>
            <option value="5 Perso">Perso</option>
          </select>
        </div>

        <div>
          <label className="label">Ricontattare il</label>
          <input
            type="date"
            className="input"
            value={formData.ricontattare || ''}
            onChange={(e) => setFormData({ ...formData, ricontattare: e.target.value })}
          />
        </div>
      </div>

      {/* ── FEE & CONTRATTO ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-8 pt-6 border-t border-gray-100">
        <div className="md:col-span-2"><p className="form-section-title">Contratto</p></div>
        <div>
          <label className="label">Tipo Contratto</label>
          <select className="input" value={formData.tipoContratto}
            onChange={(e) => setFormData({...formData, tipoContratto: e.target.value})}>
            <option value="">Seleziona...</option>
            {TIPO_CONTRATTO.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Fee Management (%)</label>
          <input
            type="number"
            step="1"
            min="0"
            max="100"
            value={formData.fee}
            onChange={(e) => setFormData({...formData, fee: e.target.value})}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-8 pt-6 border-t border-gray-100">
        <div className="md:col-span-2"><p className="form-section-title">Strategia & Preferenze</p></div>

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

      <div className="flex gap-3 justify-end pt-2">
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
