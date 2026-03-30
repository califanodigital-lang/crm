import { useState, useEffect } from 'react'
import { getActiveAgents } from '../services/userService'

export default function CollaborationForm({ collaboration = null, creators = [], brands = [],  prefilledBrand = null, prefilledCreatorId = null, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    creatorId: prefilledCreatorId || '',
    brandNome: prefilledBrand || '',
    pagamento: '',
    feeManagement: '',
    dataFirma: '',
    dataPubblicazione: '',
    durataContratto: '',
    adv: '',
    agente: '',
    sales: '',
    stato: 'IN_TRATTATIVA',
    pagato: false,
    contatto: '',
    note: '',
    senior: '',
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

  const handleCreatorSelect = (creatorId) => {
    const selectedCreator = creators.find(c => c.id === creatorId)
    setFormData(prev => {
      const fee = calcolaFeeAgente(prev.pagamento, prev.stato, prev.agente, agenti, selectedCreator)
      return { ...prev, creatorId, feeManagement: fee || prev.feeManagement }
    })
  }

  const calcolaFeeAgente = (feeMan, agenti, nomeAgente, tipo) => {
    const ag = agenti.find(a => a.agenteNome === nomeAgente)
    if (!ag || !feeMan) return 0
    const feeMan_n = parseFloat(feeMan) || 0
    if (tipo === 'ricerca')  return +(feeMan_n * (ag.feeRicerca  ?? 5)  / 100).toFixed(2)
    if (tipo === 'contatto') return +(feeMan_n * (ag.feeContatto ?? 10) / 100).toFixed(2)
    if (tipo === 'chiusura') return +(feeMan_n * (ag.feeChiusura ?? 15) / 100).toFixed(2)
    return 0
  }

  const ricalcolaFee = (data) => ({
    feeSalesCalc:  calcolaFeeAgente(data.feeManagement, agenti, data.sales,   'ricerca'),
    feeAgenteCalc: calcolaFeeAgente(data.feeManagement, agenti, data.agente,  'contatto'),
    feeSeniorCalc: calcolaFeeAgente(data.feeManagement, agenti, data.senior,  'chiusura'),
  })

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Creator */}
        <div>
          <label className="label">Creator *</label>
            <select
              className="input"
              value={formData.creatorId}
              onChange={(e) => handleCreatorSelect(e.target.value)}
              disabled={!!prefilledCreatorId}
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
            onChange={(e) => {
              const pag = e.target.value
              const creator = creators.find(c => c.id === formData.creatorId)
              const fee = calcolaFeeAgente(pag, formData.stato, formData.agente, agenti, creator)
              setFormData({ ...formData, pagamento: pag, feeManagement: fee || formData.feeManagement })
            }}
          />
        </div>

        {/* Fee Management */}
        <div>
          <label className="label">Fee Management (€)</label>
          <input
            type="number"
            step="0.01"
            className="input bg-gray-50"
            value={formData.feeManagement}
            onChange={(e) => {
              const upd = {...formData, feeManagement: e.target.value}
              setFormData({...upd, ...ricalcolaFee(upd)})
            }}
            placeholder="Auto-calcolata da pagamento × proviggioni"
          />
          <p className="text-xs text-gray-500 mt-1">Modificabile manualmente se necessario</p>
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

        <div>
          <label className="label">Data Pubblicazione Contenuti</label>
          <input
            type="date"
            className="input"
            value={formData.dataPubblicazione}
            onChange={(e) => setFormData({...formData, dataPubblicazione: e.target.value})}
          />
        </div>

        <div>
          <label className="label">Durata Contratto</label>
          <input
            className="input"
            value={formData.durataContratto}
            onChange={(e) => setFormData({...formData, durataContratto: e.target.value})}
            placeholder="es. 30 giorni, 3 mesi..."
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

        {/* Sales — Ricerca brand (5%) */}
        <div>
          <label className="label">Sales / Ricerca <span className="text-xs text-gray-400 font-normal">(5% fee)</span></label>
          <select className="input" value={formData.sales}
            onChange={(e) => {
              const upd = {...formData, sales: e.target.value}
              setFormData({...upd, ...ricalcolaFee(upd)})
            }}>
            <option value="">Nessuno</option>
            {agenti.map(a => <option key={a.id} value={a.agenteNome}>{a.nomeCompleto}</option>)}
          </select>
          {formData.feeSalesCalc > 0 && <p className="text-xs text-green-600 mt-1">Fee: €{formData.feeSalesCalc}</p>}
        </div>

        {/* Agente IMA — Contatto brand (10%) */}
        <div>
          <label className="label">Agente / Contatto <span className="text-xs text-gray-400 font-normal">(10% fee)</span></label>
          <select className="input bg-gray-50" value={formData.agente}
            onChange={(e) => {
              const upd = {...formData, agente: e.target.value}
              setFormData({...upd, ...ricalcolaFee(upd)})
            }}>
            <option value="">Nessuno</option>
            {agenti.map(a => <option key={a.id} value={a.agenteNome}>{a.nomeCompleto}</option>)}
          </select>
          <p className="text-xs text-gray-500 mt-1">Auto-compilato da brand</p>
          {formData.feeAgenteCalc > 0 && <p className="text-xs text-green-600 mt-1">Fee: €{formData.feeAgenteCalc}</p>}
        </div>

        {/* Senior — Chiusura trattativa (15%) */}
        <div>
          <label className="label">Senior / Chiusura <span className="text-xs text-gray-400 font-normal">(15% fee)</span></label>
          <select className="input" value={formData.senior}
            onChange={(e) => {
              const upd = {...formData, senior: e.target.value}
              setFormData({...upd, ...ricalcolaFee(upd)})
            }}>
            <option value="">Nessuno</option>
            {agenti.map(a => <option key={a.id} value={a.agenteNome}>{a.nomeCompleto}</option>)}
          </select>
          {formData.feeSeniorCalc > 0 && <p className="text-xs text-green-600 mt-1">Fee: €{formData.feeSeniorCalc}</p>}
        </div>

        {/* Stato */}
        <div>
          <label className="label">Stato *</label>
          <select
            className="input"
            value={formData.stato}
            onChange={(e) => {
              const nuovoStato = e.target.value
              const creator = creators.find(c => c.id === formData.creatorId)
              const fee = calcolaFeeAgente(formData.pagamento, nuovoStato, formData.agente, agenti, creator)
              setFormData({ ...formData, stato: nuovoStato, feeManagement: fee || formData.feeManagement })
            }}
            required
          >
              <option value="IN_TRATTATIVA">In Trattativa</option>
              <option value="FIRMATO">Firmato</option>
              <option value="IN_CORSO">In Corso</option>
              <option value="REVISIONE_VIDEO">Revisione Video</option>
              <option value="VIDEO_PUBBLICATO">Video Pubblicato</option>
              <option value="ATTESA_PAGAMENTO">Attesa Pagamento</option>
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
