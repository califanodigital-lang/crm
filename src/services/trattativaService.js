// src/services/trattativaService.js
import { supabase } from '../lib/supabase'

const normalizeBrandName = (value) =>
  (value || '')
    .trim()
    .replace(/\s+/g, ' ')

const ensureBrandForTrattativa = async (trattativa) => {
  if (!trattativa.creaBrandAutomaticamente) return trattativa.brandId || null
  if (trattativa.brandId) return trattativa.brandId

const normalizedName = normalizeBrandName(trattativa.brandNome)
if (!normalizedName) return null

const { data: existingRows, error: existingError } = await supabase
  .from('brands')
  .select('id, nome')
  .ilike('nome', normalizedName)

if (existingError) throw existingError

const existing = (existingRows || []).find(
  b => normalizeBrandName(b.nome).toLowerCase() === normalizedName.toLowerCase()
)

if (existing?.id) return existing.id

  const { data: created, error } = await supabase
    .from('brands')
    .insert([{
      nome: normalizedName,
      settore: trattativa.settore || null,
      contatto: trattativa.contatto || null,
      telefono: trattativa.telefono || null,
      sito_web: trattativa.sitoWeb || null,
      referenti: trattativa.riferimento || null,
      stato: 'PROSPECT',
      auto_generato_da_trattativa: true
    }])
    .select('id')
    .single()

  if (error) throw error
  return created.id
}

const cleanValue = (v) => (v === '' || v === undefined) ? null : v

const toCamelCase = (t) => {
  if (!t) return null
  return {
    id: t.id,
    brand_nome: normalizeBrandName(t.brandNome),
    brandId: t.brand_id,
    settore: t.settore,
    priorita: t.priorita,
    stato: t.stato || 'RICERCA_COMPLETATA',
    // Responsabili
    sales: t.sales,           // ricerca brand (5%)
    ima: t.ima,               // primo contatto (10%)
    senior: t.agente,         // chiusura (15%) — campo agente riusato
    // Creator
    creatorSuggeriti: t.creator_suggeriti || [],
    creatorConfermati: t.creator_confermati || [],
    // Contatti brand
    riferimento: t.riferimento,
    contatto: t.contatto,
    telefono: t.telefono,
    sitoWeb: t.sito_web,
    // Onboarding / contatto
    canaleContatto: t.canale_contatto,
    dataContatto: t.data_contatto,
    dataFollowup1: t.data_followup_1,
    dataFollowup2: t.data_followup_2,
    // Ricontatto futuro
    dataRicontatto: t.data_ricontatto,
    motivoRicontatto: t.motivo_ricontatto,
    // Trattativa
    canaleTrattativa: t.canale_trattativa,
    noteTrattativa: t.note_trattativa,
    // Preventivo / contratto
    dataPreventivo: t.data_preventivo,
    importoPreventivo: t.importo_preventivo,
    linkPreventivo: t.link_preventivo,
    // Note generali
    noteStrategiche: t.note_strategiche,
    // Meta
    brandId: t.brand_id,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    reminderRicontatto: t.reminder_ricontatto,
    callFissata: t.call_fissata,
    dataCall: t.data_call,
    creaBrandAutomaticamente: t.crea_brand_automaticamente ?? true,
  }
}

const toSnakeCase = (t) => ({
  brand_nome: t.brandNome,
  brand_id: cleanValue(t.brandId),
  settore: cleanValue(t.settore),
  priorita: t.priorita || 'NORMALE',
  stato: t.stato || 'RICERCA_COMPLETATA',
  sales: cleanValue(t.sales),
  ima: cleanValue(t.ima),
  agente: cleanValue(t.senior),         // senior mappa su agente
  creator_suggeriti: t.creatorSuggeriti || [],
  creator_confermati: t.creatorConfermati || [],
  riferimento: cleanValue(t.riferimento),
  contatto: cleanValue(t.contatto),
  telefono: cleanValue(t.telefono),
  sito_web: cleanValue(t.sitoWeb),
  canale_contatto: cleanValue(t.canaleContatto),
  data_contatto: cleanValue(t.dataContatto),
  data_followup_1: cleanValue(t.dataFollowup1),
  data_followup_2: cleanValue(t.dataFollowup2),
  data_ricontatto: cleanValue(t.dataRicontatto),
  motivo_ricontatto: cleanValue(t.motivoRicontatto),
  canale_trattativa: cleanValue(t.canaleTrattativa),
  note_trattativa: cleanValue(t.noteTrattativa),
  data_preventivo: cleanValue(t.dataPreventivo),
  importo_preventivo: cleanValue(t.importoPreventivo),
  link_preventivo: cleanValue(t.linkPreventivo),
  note_strategiche: cleanValue(t.noteStrategiche),
  reminder_ricontatto: cleanValue(t.reminderRicontatto),
  call_fissata: !!t.callFissata,
  data_call: cleanValue(t.dataCall),
  crea_brand_automaticamente: t.creaBrandAutomaticamente ?? true,
})

// ── CRUD ─────────────────────────────────────────────────────

export const getAllTrattative = async () => {
  try {
    const { data, error } = await supabase
      .from('proposte_brand')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return { data: data.map(toCamelCase), error: null }
  } catch (error) { return { data: null, error } }
}

export const getTrattativaById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('proposte_brand').select('*').eq('id', id).single()
    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) { return { data: null, error } }
}

export const getTrattativeByBrand = async (brandId) => {
  try {
    const { data, error } = await supabase
      .from('proposte_brand')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const getTrattativeByCreator = async (creatorId) => {
  try {
    const { data, error } = await supabase
      .from('proposte_brand').select('*')
      .contains('creator_suggeriti', [creatorId])
      .order('created_at', { ascending: false })
    if (error) throw error
    return { data: data.map(toCamelCase), error: null }
  } catch (error) { return { data: null, error } }
}

export const createTrattativa = async (trattativaData) => {
  try {

    const brandId = await ensureBrandForTrattativa(trattativaData)
    const payload = toSnakeCase({ ...trattativaData, brandId })

    const { data, error } = await supabase
      .from('proposte_brand')
      .insert([payload])
      .select()
      .single()

    if (error) throw error

    // Step 2: se ci sono campi nuovi, aggiornali subito dopo
    /*const nuoviCampi = {
      ima: cleanValue(trattativaData.ima),
      canale_contatto: cleanValue(trattativaData.canaleContatto),
      data_ricontatto: cleanValue(trattativaData.dataRicontatto),
      motivo_ricontatto: cleanValue(trattativaData.motivoRicontatto),
      canale_trattativa: cleanValue(trattativaData.canaleTrattativa),
      note_trattativa: cleanValue(trattativaData.noteTrattativa),
      data_preventivo: cleanValue(trattativaData.dataPreventivo),
      importo_preventivo: cleanValue(trattativaData.importoPreventivo),
      link_preventivo: cleanValue(trattativaData.linkPreventivo),
      creator_confermati: trattativaData.creatorConfermati || [],
    }

    // Aggiorna solo se almeno un campo nuovo è valorizzato
    const haNuoviCampi = Object.values(nuoviCampi).some(v => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0))
    if (haNuoviCampi) {
      await supabase.from('proposte_brand').update(nuoviCampi).eq('id', data.id)
    }*/

    return { data: toCamelCase(data), error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const updateTrattativa = async (id, trattativaData) => {
  try {

    const brandId = await ensureBrandForTrattativa(trattativaData)
    const payload = toSnakeCase({ ...trattativaData, brandId })

    const { data, error } = await supabase
      .from('proposte_brand').update(payload).eq('id', id).select().single()
    if (error) throw error
    
    return { data: toCamelCase(data), error: null }
  } catch (error) { return { data: null, error } }
}

// Aggiornamento rapido solo dello stato (usato inline nella lista)
export const updateStatoTrattativa = async (id, stato) => {
  try {
    const { data, error } = await supabase
      .from('proposte_brand').update({ stato }).eq('id', id).select().single()
    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) { return { data: null, error } }
}

export const deleteTrattativa = async (id) => {
  try {
    const { data: existing, error: readError } = await supabase
      .from('proposte_brand')
      .select('id, brand_id')
      .eq('id', id)
      .single()

    if (readError) throw readError

    const { error } = await supabase
      .from('proposte_brand')
      .delete()
      .eq('id', id)

    if (error) throw error

    if (existing?.brand_id) {
      const [{ count: trattativeCount }, { count: collabCount }, { data: brandData }] = await Promise.all([
        supabase
          .from('proposte_brand')
          .select('*', { count: 'exact', head: true })
          .eq('brand_id', existing.brand_id),
        supabase
          .from('collaborations')
          .select('*', { count: 'exact', head: true })
          .eq('brand_id', existing.brand_id),
        supabase
          .from('brands')
          .select('id, auto_generato_da_trattativa')
          .eq('id', existing.brand_id)
          .maybeSingle()
      ])

      const noMoreLinks = (trattativeCount || 0) === 0 && (collabCount || 0) === 0

      if (brandData?.auto_generato_da_trattativa && noMoreLinks) {
        await supabase
          .from('brands')
          .delete()
          .eq('id', existing.brand_id)
      }
    }

    return { error: null }
  } catch (error) {
    return { error }
  }
}
// ── STATS ────────────────────────────────────────────────────
export const getTrattativeStats = async () => {
  try {
    const { data, error } = await supabase
      .from('proposte_brand').select('stato, priorita, agente')
    if (error) throw error

    const count = (val) => data.filter(t => t.stato === val).length
    return {
      data: {
        totale: data.length,
        attive: data.filter(t => !['NESSUNA_RISPOSTA','CHIUSO_PERSO'].includes(t.stato)).length,
        inTrattativa: count('IN_TRATTATIVA'),
        preventivoInviato: count('PREVENTIVO_INVIATO'),
        contrattiFirmati: count('CONTRATTO_FIRMATO'),
        nessuna_risposta: count('NESSUNA_RISPOSTA'),
        chiuso_perso: count('CHIUSO_PERSO'),
        urgenti: data.filter(t => t.priorita === 'URGENTE').length,
      },
      error: null
    }
  } catch (error) { return { data: null, error } }
}

// ── CONVERSIONE → COLLABORAZIONE ─────────────────────────────
// Chiamata quando stato diventa CONTRATTO_FIRMATO
export const creaCollaborazioneDaTrattativa = async (trattativaId) => {
  try {
    const { data: t, error } = await supabase
      .from('proposte_brand')
      .select('*')
      .eq('id', trattativaId)
      .single()

    if (error) throw error

    const creatorIds = (t.creator_confermati && t.creator_confermati.length > 0)
      ? t.creator_confermati
      : []

    if (creatorIds.length === 0) {
      throw new Error('Nessun creator confermato nella trattativa')
    }

    const payload = creatorIds.map((creatorId) => ({
      brand_id: t.brand_id || null,
      trattativa_id: t.id,
      brand_nome: t.brand_nome,
      creator_id: creatorId,
      sales: t.sales || null,
      agente: t.ima || null,
      senior: t.agente || null,
      pagamento: t.importo_preventivo || null,
      fee_management: t.importo_preventivo
        ? +(parseFloat(t.importo_preventivo) * 0.25).toFixed(2)
        : null,
      stato: 'IN_LAVORAZIONE',
      pagato: false,
      contatto: t.contatto || null,
      note: t.note_trattativa || t.note_strategiche || null,
    }))

    const { data: created, error: collabError } = await supabase
      .from('collaborations')
      .insert(payload)
      .select()

    if (collabError) throw collabError

    return { data: created, error: null }
  } catch (error) {
    return { data: null, error }
  }
}