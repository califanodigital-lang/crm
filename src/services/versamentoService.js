import { supabase } from '../lib/supabase'

const cleanValue = (value) => value === '' || value === undefined ? null : value

const toCamelCase = (v) => {
  if (!v) return null
  return {
    id: v.id,
    creatorId: v.creator_id,
    creatorNome: v.creator_nome,
    mese: v.mese,
    tipoPagamento: v.tipo_pagamento,
    importoVersato: v.importo_versato,
    numeroFattura: v.numero_fattura,
    dataFattura: v.data_fattura,
    linkFattura: v.link_fattura,
    verificato: v.verificato,
    note: v.note,
    createdAt: v.created_at,
    updatedAt: v.updated_at,
  }
}

const toSnakeCase = (v) => ({
  creator_id: v.creatorId,
  mese: v.mese,
  tipo_pagamento: cleanValue(v.tipoPagamento),
  importo_versato: cleanValue(v.importoVersato) || 0,
  numero_fattura: cleanValue(v.numeroFattura),
  data_fattura: cleanValue(v.dataFattura),
  link_fattura: cleanValue(v.linkFattura),
  verificato: v.verificato || false,
  note: cleanValue(v.note),
})

// GET: Versamenti per mese
export const getVersamentByMonth = async (mese) => {
  try {
    const { data, error } = await supabase
      .from('versamenti')
      .select(`*, creators (nome)`)
      .eq('mese', mese)
      .order('verificato', { ascending: true })

    if (error) throw error
    return { 
      data: data.map(v => ({...toCamelCase(v), creatorNome: v.creators?.nome})), 
      error: null 
    }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// GET: Versamenti per creator
export const getVersamentByCreator = async (creatorId) => {
  try {
    const { data, error } = await supabase
      .from('versamenti')
      .select('*')
      .eq('creator_id', creatorId)
      .order('mese', { ascending: false })

    if (error) throw error
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// GET: Tutti i versamenti
export const getAllVersamenti = async () => {
  try {
    const { data, error } = await supabase
      .from('versamenti')
      .select(`*, creators (nome)`)
      .order('mese', { ascending: false })

    if (error) throw error
    return { 
      data: data.map(v => ({...toCamelCase(v), creatorNome: v.creators?.nome})), 
      error: null 
    }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// POST/PUT: Upsert versamento
export const upsertVersamento = async (versamentoData) => {
  try {
    const { data, error } = await supabase
      .from('versamenti')
      .upsert(toSnakeCase(versamentoData))
      .select()
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// PUT: Toggle verificato
export const toggleVerificato = async (id, currentStatus) => {
  try {
    const { data, error } = await supabase
      .from('versamenti')
      .update({ verificato: !currentStatus })
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

// DELETE: Elimina versamento
export const deleteVersamento = async (id) => {
  try {
    const { error } = await supabase
      .from('versamenti')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error:', error)
    return { error }
  }
}

// STATS: Conta verificati/non verificati
export const getVersamentiStats = async (mese) => {
  try {
    const { data, error } = await supabase
      .from('versamenti')
      .select('verificato, importo_versato')
      .eq('mese', mese)

    if (error) throw error

    const stats = {
      totale: data.length,
      verificati: data.filter(v => v.verificato).length,
      daVerificare: data.filter(v => !v.verificato).length,
      importoTotale: data.reduce((sum, v) => sum + parseFloat(v.importo_versato || 0), 0)
    }

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}
