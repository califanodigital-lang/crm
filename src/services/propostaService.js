import { supabase } from '../lib/supabase'
import { createBrand } from './brandService'

// Utility per convertire valori vuoti in null
const cleanValue = (value) => {
  if (value === '' || value === undefined) return null
  return value
}

// Utility da snake_case a camelCase
const toCamelCase = (proposta) => {
  if (!proposta) return null
  return {
    id: proposta.id,
    brandNome: proposta.brand_nome,
    settore: proposta.settore,
    priorita: proposta.priorita,
    stato: proposta.stato,
    agente: proposta.agente,
    creatorSuggeriti: proposta.creator_suggeriti || [],
    noteStrategiche: proposta.note_strategiche,
    riferimento: proposta.riferimento,
    telefono: proposta.telefono,
    contatto: proposta.contatto,           // email o URL form
    sitoWeb: proposta.sito_web,            // URL sito
    dataContatto: proposta.data_contatto,
    dataUltimaAzione: proposta.data_ultima_azione,
    createdAt: proposta.created_at,
    updatedAt: proposta.updated_at,
  }
}

// Utility da camelCase a snake_case
const toSnakeCase = (proposta) => {
  return {
    brand_nome: proposta.brandNome,
    settore: cleanValue(proposta.settore),
    priorita: proposta.priorita || 'NORMALE',
    stato: proposta.stato || 'DA_CONTATTARE',
    agente: cleanValue(proposta.agente),
    creator_suggeriti: proposta.creatorSuggeriti || [],
    note_strategiche: cleanValue(proposta.noteStrategiche),
    riferimento: cleanValue(proposta.riferimento),
    telefono: cleanValue(proposta.telefono),
    contatto: cleanValue(proposta.contatto),           // email o URL form
    sito_web: cleanValue(proposta.sitoWeb),           // URL sito
    data_contatto: cleanValue(proposta.dataContatto),
    data_ultima_azione: cleanValue(proposta.dataUltimaAzione),
  }
}

// GET: Tutte le proposte
export const getAllProposte = async () => {
  try {
    const { data, error } = await supabase
      .from('proposte_brand')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    console.error('Error fetching proposte:', error)
    return { data: null, error }
  }
}

// GET: Proposte per agente
export const getProposteByAgente = async (agente) => {
  try {
    const { data, error } = await supabase
      .from('proposte_brand')
      .select('*')
      .eq('agente', agente)
      .order('priorita', { ascending: false })

    if (error) throw error
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    console.error('Error fetching proposte by agente:', error)
    return { data: null, error }
  }
}

// GET: Proposte per stato
export const getProposteByStato = async (stato) => {
  try {
    const { data, error } = await supabase
      .from('proposte_brand')
      .select('*')
      .eq('stato', stato)
      .order('priorita', { ascending: false })

    if (error) throw error
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    console.error('Error fetching proposte by stato:', error)
    return { data: null, error }
  }
}

// GET: Proposta singola
export const getPropostaById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('proposte_brand')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error fetching proposta:', error)
    return { data: null, error }
  }
}

// POST: Crea proposta
export const createProposta = async (propostaData) => {
  try {
    const { data, error } = await supabase
      .from('proposte_brand')
      .insert([toSnakeCase(propostaData)])
      .select()
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error creating proposta:', error)
    return { data: null, error }
  }
}

// PUT: Aggiorna proposta
export const updateProposta = async (id, propostaData) => {
  try {
    const { data, error } = await supabase
      .from('proposte_brand')
      .update(toSnakeCase(propostaData))
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error updating proposta:', error)
    return { data: null, error }
  }
}

// DELETE: Elimina proposta
export const deleteProposta = async (id) => {
  try {
    const { error } = await supabase
      .from('proposte_brand')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error deleting proposta:', error)
    return { error }
  }
}

// STATS: Statistiche pipeline
export const getProposteStats = async () => {
  try {
    const { data, error } = await supabase
      .from('proposte_brand')
      .select('stato, priorita, agente')

    if (error) throw error

    const stats = {
      totale: data.length,
      daContattare: data.filter(p => p.stato === 'DA_CONTATTARE').length,
      contattati: data.filter(p => p.stato === 'CONTATTATO').length,
      inTrattativa: data.filter(p => p.stato === 'IN_TRATTATIVA').length,
      urgenti: data.filter(p => p.priorita === 'URGENTE').length,
      perAgente: {}
    }

    // Raggruppa per agente
    data.forEach(p => {
      if (p.agente) {
        if (!stats.perAgente[p.agente]) {
          stats.perAgente[p.agente] = 0
        }
        stats.perAgente[p.agente]++
      }
    })

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error calculating stats:', error)
    return { data: null, error }
  }
}

// CONVERSIONE: Proposta → Brand
export const convertPropostaToBrand = async (propostaId) => {
  try {
    const { data: proposta, error: propostaError } = await supabase
      .from('proposte_brand')
      .select('*')
      .eq('id', propostaId)
      .single()

    if (propostaError) throw propostaError

    // 1. VERIFICA se brand con stesso nome esiste già
    const { data: existingBrand, error: checkError } = await supabase
      .from('brands')
      .select('id, nome')
      .eq('nome', proposta.brand_nome)
      .maybeSingle()

    if (checkError) throw checkError

    if (existingBrand) {
      // Brand già esistente - collega proposta e ritorna errore
      await supabase
        .from('proposte_brand')
        .update({ brand_id: existingBrand.id })
        .eq('id', propostaId)
      
      return { 
        data: null, 
        error: { 
          message: `Brand "${proposta.brand_nome}" esiste già! Collegato alla proposta.`,
          existingBrand 
        } 
      }
    }

    // 2. Brand NON esiste, crealo
    const brandData = {
      nome: proposta.brand_nome,
      settore: proposta.settore,
      contatto: proposta.contatto,
      telefono: proposta.telefono,
      sitoWeb: proposta.sito_web,
      agente: proposta.agente,
      stato: 'CONTATTATO',
      priorita: proposta.priorita,
      dataContatto: proposta.data_contatto,
      note: proposta.note_strategiche,
      creatorSuggeriti: proposta.creator_suggeriti || [],
      riferimento: proposta.riferimento,
      propostaId: propostaId
    }

    const { data: brand, error: brandError } = await createBrand(brandData)
    if (brandError) throw brandError

    // 3. Aggiorna proposta con brand_id
    const { error: updateError } = await supabase
      .from('proposte_brand')
      .update({ brand_id: brand.id })
      .eq('id', propostaId)

    if (updateError) throw updateError

    return { data: brand, error: null }
  } catch (error) {
    console.error('Error converting proposta:', error)
    return { data: null, error }
  }
}