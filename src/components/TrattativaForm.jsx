// src/components/TrattativaForm.jsx
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import { getActiveAgents } from '../services/userService'
import CreatorMultiSelect from './CreatorMultiSelect'
import {
  STATI_TRATTATIVA,
  CONTATTATO_PER_OPTIONS,
  CANALI_CONTATTO,
  CANALI_TRATTATIVA,
  PRIORITA_OPTIONS,
  getStatoTrattativa,
} from '../constants/constants'

// Ordine del flusso — usato per mostrare sezioni progressive
const FLOW_ORDER = [
  'RICERCA_COMPLETATA',
  'ONBOARDING',
  'PRIMO_CONTATTO',
  'FOLLOW_UP_1',
  'FOLLOW_UP_2',
  'IN_TRATTATIVA',
  'PREVENTIVO_INVIATO',
  'CONTRATTO_INVIATO',
  'CONTRATTO_FIRMATO',
]

  const todayLocal = () => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }


const faseIndex = (stato) => {
  const idx = FLOW_ORDER.indexOf(stato)
  return idx === -1 ? 99 : idx
}

function FormSection({ title, subtitle, show, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  if (!show) return null
  return (
    <div className="mb-8 pt-6 border-t border-gray-100">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-4 group">
        <div>
          <p className="form-section-title text-left">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5 normal-case tracking-normal font-normal">
              {subtitle}
            </p>
          )}
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          : <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
        }
      </button>
      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {children}
        </div>
      )}
    </div>
  )
}

export default function TrattativaForm({ trattativa = null, onSave, onCancel, brands = [] }) {
  const [formData, setFormData] = useState({
    brandNome: '',
    brandId: '',
    settore: '',
    priorita: 'NORMALE',
    stato: 'RICERCA_COMPLETATA',
    sales: '',
    ima: '',
    senior: '',
    creatorSuggeriti: [],
    creatorConfermati: [],
    riferimento: '',
    contatto: '',
    telefono: '',
    sitoWeb: '',
    canaleContatto: '',
    dataContatto: '',
    contattatoPer: '',
    risposta: '',
    dataFollowup1: '',
    dataFollowup2: '',
    dataRicontatto: '',
    motivoRicontatto: '',
    canaleTrattativa: '',
    noteTrattativa: '',
    dataPreventivo: '',
    importoPreventivo: '',
    linkPreventivo: '',
    noteStrategiche: '',
    reminderRicontatto: '',
    callFissata: false,
    dataCall: '',
    creaBrandAutomaticamente: true,
  })

  const [agenti, setAgenti] = useState([])

  useEffect(() => { loadAgenti() }, [])

useEffect(() => {
  if (!trattativa) return

  setFormData(prev => ({
    ...prev,
    ...trattativa,
    brandNome: trattativa.brandNome ?? '',
    brandId: trattativa.brandId ?? '',
    settore: trattativa.settore ?? '',
    priorita: trattativa.priorita ?? 'NORMALE',
    stato: trattativa.stato ?? 'RICERCA_COMPLETATA',
    sales: trattativa.sales ?? '',
    ima: trattativa.ima ?? '',
    senior: trattativa.senior ?? '',
    creatorSuggeriti: trattativa.creatorSuggeriti ?? [],
    creatorConfermati: trattativa.creatorConfermati ?? [],
    riferimento: trattativa.riferimento ?? '',
    contatto: trattativa.contatto ?? '',
    telefono: trattativa.telefono ?? '',
    sitoWeb: trattativa.sitoWeb ?? '',
    canaleContatto: trattativa.canaleContatto ?? '',
    dataContatto: trattativa.dataContatto ?? '',
    contattatoPer: trattativa.contattatoPer ?? '',
    risposta: trattativa.risposta ?? '',
    dataFollowup1: trattativa.dataFollowup1 ?? '',
    dataFollowup2: trattativa.dataFollowup2 ?? '',
    dataRicontatto: trattativa.dataRicontatto ?? '',
    motivoRicontatto: trattativa.motivoRicontatto ?? '',
    canaleTrattativa: trattativa.canaleTrattativa ?? '',
    noteTrattativa: trattativa.noteTrattativa ?? '',
    dataPreventivo: trattativa.dataPreventivo ?? '',
    importoPreventivo: trattativa.importoPreventivo ?? '',
    linkPreventivo: trattativa.linkPreventivo ?? '',
    reminderRicontatto: trattativa.reminderRicontatto ?? '',
    noteStrategiche: trattativa.noteStrategiche ?? '',
    callFissata: trattativa.callFissata ?? false,
    dataCall: trattativa.dataCall ?? '',
    creaBrandAutomaticamente: trattativa.creaBrandAutomaticamente ?? true,
  }))
}, [trattativa])

  const loadAgenti = async () => {
    const { data } = await getActiveAgents()
    setAgenti(data || [])
  }

  const S = (field, val) => setFormData(prev => ({ ...prev, [field]: val }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  // Auto-calcola follow-up da data contatto
  const handleDataContattoChange = (val) => {
    const updates = { dataContatto: val }
    if (val && !formData.dataFollowup1) {
      const d1 = new Date(val)
      d1.setDate(d1.getDate() + 7)
      updates.dataFollowup1 = d1.toISOString().split('T')[0]
    }
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleFollowup1Change = (val) => {
    const updates = { dataFollowup1: val }
    if (val && !formData.dataFollowup2) {
      const d2 = new Date(val)
      d2.setDate(d2.getDate() + 5)
      updates.dataFollowup2 = d2.toISOString().split('T')[0]
    }
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleDataRicontattoChange = (val) => {
    const updates = { dataRicontatto: val }

    if (val && !formData.reminderRicontatto) {
      const d = new Date(val)
      d.setDate(d.getDate() - 10)
      updates.reminderRicontatto = d.toISOString().split('T')[0]
    }

    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleBrandSelect = (brandId) => {
    const selected = brands.find(b => b.id === brandId)

    if (!selected) {
      setFormData(prev => ({
        ...prev,
        brandId: '',
      }))
      return
    }

    setFormData(prev => ({
      ...prev,
      brandId: selected.id,
      brandNome: selected.nome || '',
      settore: selected.settore || '',
      contatto: selected.contatto || '',
      telefono: selected.telefono || '',
      sitoWeb: selected.sitoWeb || '',
      riferimento: selected.referente || '',
    }))
  }

  const fase = faseIndex(formData.stato)
  const isRicontattoFuturo = formData.stato === 'RICONTATTO_FUTURO'
  const isArchiviato = ['NESSUNA_RISPOSTA', 'CHIUSO_PERSO'].includes(formData.stato)
  const statoConfig = getStatoTrattativa(formData.stato)

  return (
    <form onSubmit={handleSubmit} className="space-y-0">

      {/* ── BASE ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-8">
        <div className="md:col-span-2">
          <p className="form-section-title">Trattativa</p>
        </div>

      <div>
        <label className="label">Brand già censito</label>
        <select
          className="input"
          value={formData.brandId}
          onChange={(e) => handleBrandSelect(e.target.value)}
        >
          <option value="">Nessuno / nuovo brand</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.nome}
            </option>
          ))}
        </select>
        <label className="label flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!formData.creaBrandAutomaticamente}
            onChange={(e) => S('creaBrandAutomaticamente', e.target.checked)}
          />
          Censisci automaticamente il brand nel database Brand
        </label>
      </div>

        <div>
          <label className="label">Brand *</label>
          <input className="input" value={formData.brandNome}
            onChange={(e) => S('brandNome', e.target.value)}
            placeholder="Nome brand" required />
        </div>

        <div>
          <label className="label">Settore</label>
          <input className="input" value={formData.settore}
            onChange={(e) => S('settore', e.target.value)}
            placeholder="es. Gaming, Food, Tech..." />
        </div>

        <div>
          <label className="label">Stato *</label>
          <select className="input" value={formData.stato}
            onChange={(e) => S('stato', e.target.value)} required>
            {STATI_TRATTATIVA.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <div className="mt-1.5">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statoConfig.color}`}>
              {statoConfig.label}
            </span>
          </div>
        </div>

        <div>
          <label className="label">Priorità</label>
          <select className="input" value={formData.priorita}
            onChange={(e) => S('priorita', e.target.value)}>
            {PRIORITA_OPTIONS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="label">Creator Suggeriti per la ricerca</label>
          <CreatorMultiSelect
            selectedIds={formData.creatorSuggeriti || []}
            onChange={(ids) => S('creatorSuggeriti', ids)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="label">Note strategiche</label>
          <input className="input" value={formData.noteStrategiche}
            onChange={(e) => S('noteStrategiche', e.target.value)}
            placeholder="Obiettivo, approccio, contesto..." />
        </div>
      </div>

      {/* ── RESPONSABILI ── sempre visibile ── */}
      <FormSection title="Responsabili"
        subtitle="Sales = ricerca (5%)  ·  IMA = contatto (10%)  ·  Senior = chiusura (15%)"
        show={true} defaultOpen={true}>
        <div>
          <label className="label">Sales — Ricerca brand</label>
          <select className="input" value={formData.sales}
            onChange={(e) => S('sales', e.target.value)}>
            <option value="">Nessuno</option>
            {agenti.map(a => (
              <option key={a.id} value={a.agenteNome}>{a.nomeCompleto}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">5% fee se riceve_fee attivo</p>
        </div>
        <div>
          <label className="label">IMA — Primo contatto</label>
          <select className="input" value={formData.ima}
            onChange={(e) => S('ima', e.target.value)}>
            <option value="">Nessuno</option>
            {agenti.map(a => (
              <option key={a.id} value={a.agenteNome}>{a.nomeCompleto}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">10% fee</p>
        </div>
        <div>
          <label className="label">Senior — Chiusura</label>
          <select className="input" value={formData.senior}
            onChange={(e) => S('senior', e.target.value)}>
            <option value="">Nessuno</option>
            {agenti.map(a => (
              <option key={a.id} value={a.agenteNome}>{a.nomeCompleto}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">15% fee</p>
        </div>
      </FormSection>

      {/* ── CONTATTI BRAND — da ONBOARDING ── */}
      <FormSection title="Contatti Brand"
        subtitle="Dati raccolti durante l'onboarding"
        show={fase >= 1 || isArchiviato}>
        <div>
          <label className="label">Referente</label>
          <input className="input" value={formData.riferimento}
            onChange={(e) => S('riferimento', e.target.value)}
            placeholder="Nome e ruolo" />
        </div>
        <div>
          <label className="label">Email / Form contatto</label>
          <input className="input" value={formData.contatto}
            onChange={(e) => S('contatto', e.target.value)}
            placeholder="email@brand.com o https://..." />
        </div>
        <div>
          <label className="label">Telefono</label>
          <input className="input" value={formData.telefono}
            onChange={(e) => S('telefono', e.target.value)} />
        </div>
        <div>
          <label className="label">Sito Web</label>
          <input type="url" className="input" value={formData.sitoWeb}
            onChange={(e) => S('sitoWeb', e.target.value)}
            placeholder="https://..." />
        </div>
      </FormSection>

      {/* ── PRIMO CONTATTO — da PRIMO_CONTATTO ── */}
      <FormSection title="Primo Contatto"
        subtitle="Data e modalità del primo contatto effettuato"
        show={fase >= 2 || isArchiviato}>
        <div>
          <label className="label">Data Primo Contatto</label>
          <input type="date" className="input" value={formData.dataContatto}
            onChange={(e) => handleDataContattoChange(e.target.value)} />
        </div>
        <div>
          <label className="label">Canale usato</label>
          <select className="input" value={formData.canaleContatto}
            onChange={(e) => S('canaleContatto', e.target.value)}>
            <option value="">Seleziona...</option>
            {CANALI_CONTATTO.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Contattato per</label>
          <select className="input" value={formData.contattatoPer}
            onChange={(e) => S('contattatoPer', e.target.value)}>
            <option value="">Tipo ADV...</option>
            {CONTATTATO_PER_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Risposta ricevuta</label>
          <input className="input" value={formData.risposta}
            onChange={(e) => S('risposta', e.target.value)}
            placeholder="Interessati, In attesa, Richiedono info..." />
        </div>
      </FormSection>

      {/* ── FOLLOW-UP — da FOLLOW_UP_1 ── */}
      <FormSection title="Follow-up"
        subtitle="Date auto-calcolate · modificabili manualmente"
        show={fase >= 3 || isArchiviato}>
        <div>
          <label className="label">Data 1° Follow-up</label>
          <input type="date" className="input" value={formData.dataFollowup1}
            onChange={(e) => handleFollowup1Change(e.target.value)} />
          <p className="text-xs text-gray-400 mt-1">Auto: +7 giorni dal primo contatto</p>
        </div>
        <div>
          <label className="label">Data 2° Follow-up</label>
          <input type="date" className="input" value={formData.dataFollowup2}
            onChange={(e) => S('dataFollowup2', e.target.value)} />
          <p className="text-xs text-gray-400 mt-1">Auto: +5 giorni dal primo follow-up</p>
        </div>
      </FormSection>

      {/* ── RICONTATTO FUTURO — solo se stato = RICONTATTO_FUTURO ── */}
      <FormSection title="Ricontatto Futuro"
        subtitle="Il brand ha chiesto di essere ricontattato in una data specifica"
        show={isRicontattoFuturo} defaultOpen={true}>
        <div>
          <label className="label">Data ricontatto *</label>
          <input type="date" className="input" value={formData.dataRicontatto}
            onChange={(e) => handleDataRicontattoChange(e.target.value)} />
        </div>
        <div>
          <label className="label">Reminder interno</label>
          <input
            type="date"
            className="input"
            value={formData.reminderRicontatto}
            onChange={(e) => S('reminderRicontatto', e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">Di solito 10 giorni prima del ricontatto</p>
        </div>
        <div>
          <label className="label">Motivo rimando</label>
          <input className="input" value={formData.motivoRicontatto}
            onChange={(e) => S('motivoRicontatto', e.target.value)}
            placeholder="Es. Budget Q3, campagna già pianificata..." />
        </div>
      </FormSection>

      {/* ── TRATTATIVA — da IN_TRATTATIVA ── */}
      <FormSection title="Trattativa"
        subtitle="Negoziazione in corso — canale e note operative"
        show={fase >= 5}>
        <div>
          <label className="label">Canale trattativa</label>
          <select className="input" value={formData.canaleTrattativa}
            onChange={(e) => S('canaleTrattativa', e.target.value)}>
            <option value="">Seleziona...</option>
            {CANALI_TRATTATIVA.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!formData.callFissata}
              onChange={(e) => S('callFissata', e.target.checked)}
            />
            Call fissata
          </label>
        </div>

        <div>
          <label className="label">Data Call</label>
          <input
            type="date"
            className="input"
            value={formData.dataCall}
            onChange={(e) => S('dataCall', e.target.value)}
            disabled={!formData.callFissata}
          />
        </div>
        <div className="md:col-span-2">
          <label className="label">Note operative</label>
          <textarea className="input min-h-[80px]" value={formData.noteTrattativa}
            onChange={(e) => S('noteTrattativa', e.target.value)}
            placeholder="WhatsApp +39..., Contatto: Mario Rossi, Richiedono contenuti su..." />
        </div>
      </FormSection>

      {/* ── PREVENTIVO / CONTRATTO — da PREVENTIVO_INVIATO ── */}
      <FormSection title="Preventivo & Contratto"
        subtitle="Offerta inviata e dettagli contrattuali"
        show={fase >= 6}>
        <div>
          <label className="label">Data invio preventivo</label>
          <input type="date" className="input" value={formData.dataPreventivo}
            onChange={(e) => S('dataPreventivo', e.target.value)} />
        </div>
        <div>
          <label className="label">Importo preventivo (€)</label>
          <input type="number" step="0.01" className="input"
            value={formData.importoPreventivo}
            onChange={(e) => S('importoPreventivo', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="label">Link preventivo / contratto</label>
          <input type="url" className="input" value={formData.linkPreventivo}
            onChange={(e) => S('linkPreventivo', e.target.value)}
            placeholder="https://drive.google.com/..." />
          <p className="text-xs text-gray-400 mt-1">Link Drive, OneDrive o altro cloud</p>
        </div>
        <div className="md:col-span-2">
          <label className="label">Creator confermati per questo preventivo</label>
          <CreatorMultiSelect
            selectedIds={formData.creatorConfermati || []}
            onChange={(ids) => S('creatorConfermati', ids)}
          />
          <p className="text-xs text-gray-400 mt-1">
            Diventeranno il team della collaborazione quando si firma il contratto
          </p>
        </div>
      </FormSection>

      {/* ── BOTTONI ── */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 mt-8">
        <button type="button" onClick={onCancel}
          className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Annulla
        </button>
        <button type="submit"
          className="px-6 py-2.5 bg-yellow-400 text-gray-900 rounded-xl text-sm font-bold hover:bg-yellow-500 transition-colors shadow-sm">
          {trattativa ? 'Aggiorna Trattativa' : 'Crea Trattativa'}
        </button>
      </div>
    </form>
  )
}