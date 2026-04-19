import { useState, useEffect } from 'react'
import { getActiveAgents } from '../services/userService'
import { useAuth } from '../contexts/AuthContext'
import SearchableSelect from './SearchableSelect'
import {formatDate} from '../utils/date'

export default function CollaborationForm({ collaboration = null, creators = [], brands = [],  prefilledBrand = null, prefilledCreatorId = null, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    creatorId: prefilledCreatorId || '',
    brandNome: prefilledBrand || '',
    brandId: '',
    pagamento: '',
    feeManagement: '',
    dataFirma: '',
    dataPubblicazione: '',
    dataPagamentoCreator: '',
    dataPagamentoAgency: '',
    durataContratto: '',
    adv: '',
    agente: '',
    sales: '',
    stato: 'IN_LAVORAZIONE',
    pagato: false,
    pagato_agency: false,
    contatto: '',
    note: '',
    senior: '',
    feeSalesCalc: 0,
    feeAgenteCalc: 0,
    feeSeniorCalc: 0,
    assegnatario: [],
    creatoDa: ''
  })

  const [agenti, setAgenti] = useState([])
  const { userProfile } = useAuth()
  const isAdmin = userProfile?.role === 'ADMIN'
  const puo_modificare_assegnatario = isAdmin || !collaboration || collaboration.creatoDa === userProfile?.agenteNome

  useEffect(() => {
      loadAgenti()
    }, [])

    const loadAgenti = async () => {
      const { data } = await getActiveAgents()
      setAgenti(data || [])
    }

    useEffect(() => {
     if (!collaboration && userProfile?.agenteNome) {
          setFormData(prev => ({
            ...prev,
            creatoDa: userProfile.agenteNome,
            assegnatario: userProfile.agenteNome ? [userProfile.agenteNome] : [],
          }))

          return
        }

      setFormData(prev => ({
        ...prev,
        ...collaboration,
        pagamento: collaboration.pagamento ?? '',
        brandId: collaboration.brandId ?? '',
        feeManagement: collaboration.feeManagement ?? '',
        dataFirma: collaboration.dataFirma ?? '',
        dataPubblicazione: collaboration.dataPubblicazione ?? '',
        durataContratto: collaboration.durataContratto ?? '',
        adv: collaboration.adv ?? '',
        agente: collaboration.agente ?? '',
        sales: collaboration.sales ?? '',
        stato: collaboration.stato ?? 'IN_LAVORAZIONE',
        pagato: collaboration.pagato ?? false,
        pagato_agency: collaboration.pagato_agency ?? false,
        contatto: collaboration.contatto ?? '',
        note: collaboration.note ?? '',
        senior: collaboration.senior ?? '',
        feeSalesCalc: collaboration.feeSalesCalc ?? 0,
        feeAgenteCalc: collaboration.feeAgenteCalc ?? 0,
        feeSeniorCalc: collaboration.feeSeniorCalc ?? 0,
        dataPagamentoCreator: collaboration.dataPagamentoCreator ?? '',
        dataPagamentoAgency: collaboration.dataPagamentoAgency ?? '',
        assegnatario: collaboration.assegnatario || [],
        creatoDa: collaboration.creatoDa ?? '',
      }))
    }, [collaboration])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await confirm('Salvare le modifiche alla collaborazione?', {
      title: 'Conferma salvataggio', confirmLabel: 'Salva'
    })
    if (!ok) return
    onSave(formData)
  }

  const todayLocal = () => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const handleBrandSelect = (brandNome) => {
    const selectedBrand = brands.find(b => b.nome === brandNome)

    const upd = {
      ...formData,
      brandId: selectedBrand?.id || '',
      brandNome,
    }

    setFormData({
      ...upd,
      ...ricalcolaFee(upd)
    })
  }

  const handleCreatorSelect = (creatorId) => {
    const creator = creators.find(c => c.id === creatorId)
    const pag = parseFloat(formData.pagamento) || 0
    const percFee = parseFloat(creator?.fee || 25) / 100
    const feeManagement = pag ? +(pag * percFee).toFixed(2) : formData.feeManagement
    const upd = { ...formData, creatorId, feeManagement }
    setFormData({ ...upd, ...ricalcolaFee(upd) })
  }
  const toNumber = (value) => parseFloat(value || 0) || 0

    const calcolaFeeAgente = (feeMan, agentiList, nomeAgente, tipo) => {
      const ag = Array.isArray(agentiList)
        ? agentiList.find(a => a.agenteNome === nomeAgente)
        : null

      if (!ag || !feeMan) return 0
      if (ag.riceveFee === false) return 0

      const n = parseFloat(feeMan) || 0

      if (tipo === 'ricerca')  return +(n * (ag.feeRicerca  ?? 5)  / 100).toFixed(2)
      if (tipo === 'contatto') return +(n * (ag.feeContatto ?? 10) / 100).toFixed(2)
      if (tipo === 'chiusura') return +(n * (ag.feeChiusura ?? 15) / 100).toFixed(2)

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

  const activeCreators = creators.filter(c => c.stato === '1 Sotto contratto')

  return (
  <form onSubmit={handleSubmit} 
  onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault() }}
  className="space-y-0">
      {/* ── ASSEGNATARIO ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0 mb-8 pt-0">
          <div>
            <label className="label">
              Assegnatari
              <span className="ml-1.5 text-xs font-normal text-gray-400 normal-case tracking-normal">chi gestisce questa trattativa</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(formData.assegnatario || []).map(nome => (
                <span key={nome} className="flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                  {nome}
                  {puo_modificare_assegnatario && (
                    <button type="button" onClick={() => setFormData('assegnatario', formData.assegnatario.filter(a => a !== nome))}
                      className="ml-0.5 text-yellow-600 hover:text-yellow-900">✕</button>
                  )}
                </span>
              ))}
            </div>
            {puo_modificare_assegnatario && (
              <select className="input"
                value=""
                onChange={(e) => {
                  const curr = formData.assegnatario || []
                  if (e.target.value && !curr.includes(e.target.value))
                    setFormData(prev => ({...prev, assegnatario: [...(prev.assegnatario || []), e.target.value]}))
                }}
                disabled={!puo_modificare_assegnatario}
              >
                <option value="">+ Aggiungi assegnatario...</option>
                {agenti.filter(a => !(formData.assegnatario || []).includes(a.agenteNome)).map(a => (
                  <option key={a.id} value={a.agenteNome}>{a.nomeCompleto}</option>
                ))}
              </select>
            )}
            {!puo_modificare_assegnatario && (
              <p className="text-xs text-gray-400 mt-1">Solo il creatore o un admin può modificarlo</p>
            )}
            {formData.creatoDa && (
              <p className="text-xs text-gray-400 mt-1">Creata da: <strong>{formData.creatoDa}</strong></p>
            )}
          </div>
      </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-8">
      <div className="md:col-span-2"><p className="form-section-title">Parti coinvolte</p></div>
        {/* Creator */}
        <div>
          <label className="label">Creator *</label>
          <SearchableSelect
            options={creators.map(c => ({ value: c.id, label: c.nome }))}
            value={formData.creatorId}
            onChange={handleCreatorSelect}
            placeholder="Cerca creator..."
            disabled={!!prefilledCreatorId}
            required
          />
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
              <SearchableSelect
                options={brands.map(b => ({ value: b.nome, label: b.nome }))}
                value={formData.brandNome}
                onChange={handleBrandSelect}
                placeholder="Cerca brand..."
                required
              />
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
              const creator = creators.find(c => c.id === formData.creatorId)
              const percFee = parseFloat(creator?.fee || 25) / 100
              const feeManagement = +(pag * percFee).toFixed(2)
              const upd = { ...formData, pagamento: e.target.value, feeManagement }
              setFormData({ ...upd, ...ricalcolaFee(upd) })
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
          <label className="label">Data Pagamento Creator</label>
          <input
            type="date"
            className="input"
            value={formData.dataPagamentoCreator || ''}
            onChange={(e) => setFormData({ ...formData, dataPagamentoCreator: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Data Pagamento Agency</label>
          <input
            type="date"
            className="input"
            value={formData.dataPagamentoAgency || ''}
            onChange={(e) => setFormData({ ...formData, dataPagamentoAgency: e.target.value })}
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
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5 mb-8 pt-6 border-t border-gray-100">
          {formData.trattativaId && (
            <div className="p-3 mb-4 rounded-lg bg-blue-50 text-blue-700 text-sm">
              Collaborazione generata da trattativa: ruoli e brand ereditati automaticamente.
            </div>
          )}
        <div className="md:col-span-3"><p className="form-section-title">Responsabili</p></div>
        {/* Sales — Ricerca brand (5%) */}
        <div>
          <label className="label">Ricerca <span className="text-xs text-gray-400 font-normal">(5% fee)</span></label>
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
              <option value="IN_LAVORAZIONE">In Lavorazione</option>
              <option value="ATTESA_PAGAMENTO_CREATOR">Attesa Pagamento Creator</option>
              <option value="ATTESA_PAGAMENTO_AGENCY">Attesa Pagamento Agency</option>
              <option value="COMPLETATA">Completata → Archivio Collab</option>
              <option value="ANNULLATA">Annullata → Archivio Collab</option>
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
              dataPagamentoCreator: checked ? (formData.dataPagamentoCreator || todayLocal()) : ''
            })
          }}
          className="w-4 h-4 text-yellow-400 border-gray-300 rounded focus:ring-yellow-400"
        />
          <label htmlFor="pagato" className="label mb-0">Pagamento Creator</label>
        </div>

        {/* Pagamento Agency */}
        <div className="flex items-center gap-3 pt-6">
        <input
          type="checkbox"
          id="pagato_agency"
          checked={formData.pagato_agency}
          onChange={(e) => {
            const checked = e.target.checked
            setFormData({
              ...formData,
              pagato_agency: checked,
              dataPagamentoAgency: checked ? (formData.dataPagamentoAgency || todayLocal()) : ''
            })
          }}
          className="w-4 h-4 text-yellow-400 border-gray-300 rounded focus:ring-yellow-400"
        />
          <label htmlFor="pagato" className="label mb-0">Pagamento Agency</label>
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
