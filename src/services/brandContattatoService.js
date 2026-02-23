// src/services/brandContattatoService.js
import { supabase } from '../lib/supabase'

const cleanValue = (value) => value === '' || value === undefined ? null : value

const toCamelCase = (bc) => {
  if (!bc) return null
  return {
    id: bc.id,
    creatorId: bc.creator_id,
    brandNome: bc.brand_nome,
    settore: bc.settore,
    dataContatto: bc.data_contatto,
    risposta: bc.risposta,
    contattatoPer: bc.contattato_per,
    referenti: bc.referenti,
    email: bc.email,
    telefono: bc.telefono,
    agente: bc.agente,
    sitoWeb: bc.sito_web,
    note: bc.note,
    contrattoChiuso: bc.contratto_chiuso,
    createdAt: bc.created_at,
    updatedAt: bc.updated_at,
    targetDem: bc.target_dem,
    topicTarget: bc.topic_target
  }
}

const toSnakeCase = (bc) => ({
  creator_id: bc.creatorId,
  brand_nome: bc.brandNome,
  settore: cleanValue(bc.settore),
  data_contatto: cleanValue(bc.dataContatto),
  risposta: cleanValue(bc.risposta),
  contattato_per: cleanValue(bc.contattatoPer),
  referenti: cleanValue(bc.referenti),
  email: cleanValue(bc.email),
  telefono: cleanValue(bc.telefono),
  agente: cleanValue(bc.agente),
  sito_web: cleanValue(bc.sitoWeb),
  note: cleanValue(bc.note),
  contratto_chiuso: bc.contrattoChiuso || false,
  target_dem: cleanValue(bc.targetDem),
  topic_target: cleanValue(bc.topicTarget)
})

// GET: Brand contattati per creator
export const getBrandContattatiByCreator = async (creatorId) => {
  try {
    const { data, error } = await supabase
      .from('brand_contattati')
      .select('*')
      .eq('creator_id', creatorId)
      .order('data_contatto', { ascending: false })

    if (error) throw error
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// POST: Aggiungi brand contattato
export const addBrandContattato = async (brandContattatoData) => {
  try {
    const { data, error } = await supabase
      .from('brand_contattati')
      .insert([toSnakeCase(brandContattatoData)])
      .select()
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// PUT: Aggiorna brand contattato
export const updateBrandContattato = async (id, brandContattatoData) => {
  try {
    const { data, error } = await supabase
      .from('brand_contattati')
      .update(toSnakeCase(brandContattatoData))
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// DELETE: Elimina brand contattato
export const deleteBrandContattato = async (id) => {
  try {
    const { error } = await supabase
      .from('brand_contattati')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error:', error)
    return { error }
  }
}

// Cerca se esiste già un record brand_contattato per creator+brand
export const getBrandContattatoByCreatorAndBrand = async (creatorId, brandNome) => {
  try {
    const { data, error } = await supabase
      .from('brand_contattati')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('brand_nome', brandNome)
      .maybeSingle()
    if (error) throw error
    return { data: data ? toCamelCase(data) : null, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const getBrandContattatiByBrandNome = async (brandNome) => {
  try {
    const { data, error } = await supabase
      .from('brand_contattati')
      .select('*')
      .eq('brand_nome', brandNome)
    if (error) throw error
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    return { data: null, error }
  }
}