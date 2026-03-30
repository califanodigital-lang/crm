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
    dataPagamento: '',
    durataContratto: '',
    adv: '',
    agente: '',
    sales: '',
    stato: 'IN_TRATTATIVA',
    pagato: false,
    contatto: '',
    note: '',
    senior: '',
    feeSalesCalc: 0,
    feeAgenteCalc: 0,
    feeSeniorCalc: 0,
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
      if (!collaboration) return

      setFormData(prev => ({
        ...prev,
        ...collaboration,
        pagamento: collaboration.pagamento ?? '',
        feeManagement: collaboration.feeManagement ?? '',
        dataFirma: collaboration.dataFirma ?? '',
        dataPubblicazione: collaboration.dataPubblicazione ?? '',
        dataPagamento: collaboration.dataPagamento ?? '',
        durataContratto: collaboration.durataContratto ?? '',
        adv: collaboration.adv ?? '',
        agente: collaboration.agente ?? '',
        sales: collaboration.sales ?? '',
        stato: collaboration.stato ?? 'IN_TRATTATIVA',
        pagato: collaboration.pagato ?? false,
        contatto: collaboration.contatto ?? '',
        note: collaboration.note ?? '',
        senior: collaboration.senior ?? '',
        feeSalesCalc: collaboration.feeSalesCalc ?? 0,
        feeAgenteCalc: collaboration.feeAgenteCalc ?? 0,
        feeSeniorCalc: collaboration.feeSeniorCalc ?? 0,
      }))
    }, [collaboration])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

    const handleBrandSelect = (brandNome) => {
      const selectedBrand = brands.find(b => b.nome === brandNome)

      const upd = {
        ...formData,
        brandNome,
        agente: selectedBrand?.agente || formData.agente,
      }

      setFormData({
        ...upd,
        ...ricalcolaFee(upd)
      })
    }

  const handleCreatorSelect = (creatorId) => {
    setFormData(prev => ({
      ...prev,
      creatorId
    }))
  }
  const toNumber = (value) => parseFloat(value || 0) || 0

  const calcolaFeeAgente = (baseImporto, agentiList, nomeAgente, tipo) => {
    const ag = Array.isArray(agentiList)
      ? agentiList.find(a => a.agenteNome === nomeAgente)
      : null

    if (!ag || !baseImporto) return 0

    const importo = parseFloat(baseImporto) || 0

    if (tipo === 'ricerca')  return +(importo * (ag.feeRicerca  ?? 5)  / 100).toFixed(2)
    if (tipo === 'contatto') return +(importo * (ag.feeContatto ?? 10) / 100).toFixed(2)
    if (tipo === 'chiusura') return +(importo * (ag.feeChiusura ?? 15) / 100).toFixed(2)

    return 0
  }

    const ricalcolaFee = (data) => {
      const feeBase = toNumber(data.feeManagement)

      return {
        feeSalesCalc: data.sales ? calcolaFeeAgente(feeBase, agenti, data.sales, 'ricerca') : 0,
        feeAgenteCalc: data.agente ? calcolaFeeAgente(feeBase, agenti, data.agente, 'contatto') : 0,
        feeSeniorCalc: data.senior ? calcolaFeeAgente(feeBase, agenti, data.senior, 'chiusura') : 0,
      }
    }

  return (
  <form onSubmit={handleSubmit} className="space-y-0">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-8">
      <div className="md:col-span-2"><p className="form-section-title">Parti coinvolte</p></div>
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
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-8 pt-6 border-t border-gray-100">
        <div className="md:col-span-2"><p className="form-section-title">Dati economici</p></div>
        {/* Pagamento */}
        <div>
          <label className="label">Pagamento Totale (€)</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={formData.pagamento}
            onChange={(e) => {
              const pag = parseFloat(e.target.value) || 0
              const feeManagement = +(pag * 0.25).toFixed(2)

              const upd = {
                ...formData,
                pagamento: e.target.value,
                feeManagement
              }

              setFormData({
                ...upd,
                ...ricalcolaFee(upd)
              })
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
              const upd = { ...formData, feeManagement: e.target.value }
              setFormData({ ...upd, ...ricalcolaFee(upd) })
            }}
            placeholder="Auto-calcolata come 25% del pagamento brand, modificabile se necessario"
          />
          <p className="text-xs text-gray-500 mt-1">Modificabile manualmente se necessario</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5 mb-8 pt-6 border-t border-gray-100">
        <div className="md:col-span-3"><p className="form-section-title">Date</p></div>
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
          <label className="label">Data Pagamento</label>
          <input
            type="date"
            className="input"
            value={formData.dataPagamento || ''}
            onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })}
            disabled={!formData.pagato}
          />
          {!formData.pagato && (
            <p className="text-xs text-gray-500 mt-1">
              Si compila quando la collaborazione viene segnata come pagata
            </p>
          )}
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
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5 mb-8 pt-6 border-t border-gray-100">
        <div className="md:col-span-3"><p className="form-section-title">Responsabili</p></div>
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
            onChange={(e) => setFormData({ ...formData, stato: e.target.value })}
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
          onChange={(e) => {
            const checked = e.target.checked
            setFormData({
              ...formData,
              pagato: checked,
              dataPagamento: checked ? (formData.dataPagamento || new Date().toISOString().split('T')[0]) : ''
            })
          }}
          className="w-4 h-4 text-yellow-400 border-gray-300 rounded focus:ring-yellow-400"
        />
          <label htmlFor="pagato" className="label mb-0">Pagato</label>
        </div>

      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-8 pt-6 border-t border-gray-100">
        <div className="md:col-span-2"><p className="form-section-title">Note</p></div>
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
          {collaboration ? 'Aggiorna' : 'Crea'} Collaborazione
        </button>
      </div>
    </form>
  )
}
