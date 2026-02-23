import { supabase } from '../lib/supabase'
import { createBrand } from './brandService'

const cleanValue = (value) => {
  if (value === '' || value === undefined) return null
  return value
}

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
    contatto: proposta.contatto,
    sitoWeb: proposta.sito_web,
    dataContatto: proposta.data_contatto,
    dataFollowup1: proposta.data_followup_1,   // B.1
    dataFollowup2: proposta.data_followup_2,   // B.1
    categorie: proposta.categorie || [],
    categoriaAdv: proposta.categoria_adv,
    target: proposta.target,
    contattatoPer: proposta.contattato_per,
    risposta: proposta.risposta,
    dataUltimaAzione: proposta.data_ultima_azione,
    brandId: proposta.brand_id,
    createdAt: proposta.created_at,
    updatedAt: proposta.updated_at,
  }
}

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
    contatto: cleanValue(proposta.contatto),
    sito_web: cleanValue(proposta.sitoWeb),
    data_contatto: cleanValue(proposta.dataContatto),
    data_followup_1: cleanValue(proposta.dataFollowup1),   // B.1
    data_followup_2: cleanValue(proposta.dataFollowup2),   // B.1
    data_ultima_azione: cleanValue(proposta.dataUltimaAzione),
  }
}

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

    data.forEach(p => {
      if (p.agente) {
        if (!stats.perAgente[p.agente]) stats.perAgente[p.agente] = 0
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
// Fix Fase A: referente→referenti, target→target_dem
export const convertPropostaToBrand = async (propostaId) => {
  try {
    const { data: proposta, error: fetchError } = await supabase
      .from('proposte_brand')
      .select('*')
      .eq('id', propostaId)
      .single()

    if (fetchError) throw fetchError

    const { data: existingBrand, error: checkError } = await supabase
      .from('brands')
      .select('id, nome')
      .eq('nome', proposta.brand_nome)
      .maybeSingle()

    if (checkError) throw checkError

    if (existingBrand) {
      const { error: updateError } = await supabase
        .from('proposte_brand')
        .update({ brand_id: existingBrand.id })
        .eq('id', propostaId)

      if (updateError) throw updateError

      return {
        data: null,
        error: { message: `Brand "${existingBrand.nome}" già esistente. Proposta collegata.` }
      }
    }

    const { data: newBrand, error: createError } = await supabase
      .from('brands')
      .insert([{
        nome: proposta.brand_nome,
        settore: proposta.settore,
        target_dem: proposta.target,              // Fix Fase A
        categorie: proposta.categorie || [],
        categoria_adv: proposta.categoria_adv,
        referenti: proposta.riferimento,          // Fix Fase A
        contatto: proposta.contatto,
        telefono: proposta.telefono,
        sito_web: proposta.sito_web,
        agente: proposta.agente,
        priorita: proposta.priorita,
        stato: 'CONTATTATO',
        data_contatto: proposta.data_contatto,
        data_followup_1: proposta.data_followup_1,  // B.1
        data_followup_2: proposta.data_followup_2,  // B.1
        contattato_per: proposta.contattato_per,
        risposta: proposta.risposta,
        note: proposta.note_strategiche,
        creator_suggeriti: proposta.creator_suggeriti || [],
        proposta_id: propostaId
      }])
      .select()
      .single()

    if (createError) throw createError

    const { error: linkError } = await supabase
      .from('proposte_brand')
      .update({ brand_id: newBrand.id })
      .eq('id', propostaId)

    if (linkError) throw linkError

    return { data: newBrand, error: null }
  } catch (error) {
    console.error('Error converting proposta to brand:', error)
    return { data: null, error }
  }
}
