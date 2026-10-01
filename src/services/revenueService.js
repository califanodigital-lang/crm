import { supabase } from '../lib/supabase'
import { fetchAllRows } from './supabasePagination'

const cleanValue = (value) => value === '' || value === undefined ? null : value

const toCamelCase = (rev) => {
  if (!rev) return null
  return {
    id: rev.id,
    creatorId: rev.creator_id,
    creatorNome: rev.creator_nome,
    mese: rev.mese,
    importo: rev.importo,
    fatturato: rev.fatturato,
    note: rev.note,
    collaborazioneId: rev.collaborazione_id,
    brandNome: rev.brand_nome,
    agente: rev.agente,
    createdAt: rev.created_at,
    updatedAt: rev.updated_at,
  }
}

const toSnakeCase = (rev) => ({
  creator_id: rev.creatorId,
  mese: rev.mese,
  importo: cleanValue(rev.importo) || 0,
  fatturato: rev.fatturato || false,
  note: cleanValue(rev.note),
  collaborazione_id: cleanValue(rev.collaborazioneId),
  brand_nome: cleanValue(rev.brandNome),
  agente: cleanValue(rev.agente),
})

// GET: Revenue per mese (con nomi creator)
export const getRevenueByMonth = async (mese) => {
  try {
    const data = await fetchAllRows(() => supabase
      .from('revenue_mensile')
      .select(`*, creators (nome)`)
      .eq('mese', mese)
      .order('importo', { ascending: false }))

    return { 
      data: data.map(r => ({...toCamelCase(r), creatorNome: r.creators?.nome})), 
      error: null 
    }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// GET: Revenue per creator (tutti i mesi)
export const getRevenueByCreator = async (creatorId) => {
  try {
    const data = await fetchAllRows(() => supabase
      .from('revenue_mensile')
      .select('*')
      .eq('creator_id', creatorId)
      .order('mese', { ascending: false }))

    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// GET: Tutte le revenue
export const getAllRevenue = async () => {
  try {
    const data = await fetchAllRows(() => supabase
      .from('revenue_mensile')
      .select(`*, creators (nome)`)
      .order('mese', { ascending: false }))

    return { 
      data: data.map(r => ({...toCamelCase(r), creatorNome: r.creators?.nome})), 
      error: null 
    }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// POST/PUT: Upsert revenue (insert o update)
export const upsertRevenue = async (revenueData) => {
  try {
    const { data, error } = await supabase.rpc('crm_upsert_manual_revenue', {
      payload: toSnakeCase(revenueData),
    })

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// DELETE: Elimina revenue
export const deleteRevenue = async (id) => {
  try {
    const { error } = await supabase
      .from('revenue_mensile')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error:', error)
    return { error }
  }
}

// STATS: Totale per mese
export const getMonthlyTotals = async () => {
  try {
    const data = await fetchAllRows(() => supabase
      .from('revenue_mensile')
      .select('mese, importo'))

    // Raggruppa per mese
    const totals = data.reduce((acc, curr) => {
      const mese = curr.mese
      acc[mese] = (acc[mese] || 0) + parseFloat(curr.importo || 0)
      return acc
    }, {})

    return { data: totals, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

/**
 * Verifica discrepanze tra revenue manuale e auto
 */
export const checkRevenueDiscrepancies = async () => {
  try {
    // Revenue totale per creator/mese
    const allRevenue = await fetchAllRows(() => supabase
      .from('revenue_mensile')
      .select('creator_id, mese, importo, collaborazione_id')
      .order('mese', { ascending: false }))

    // Aggrega per creator/mese
    const grouped = {}
    allRevenue.forEach(r => {
      const key = `${r.creator_id}-${r.mese}`
      if (!grouped[key]) {
        grouped[key] = { auto: 0, manual: 0, creatorId: r.creator_id, mese: r.mese }
      }
      if (r.collaborazione_id) {
        grouped[key].auto += parseFloat(r.importo) || 0
      } else {
        grouped[key].manual += parseFloat(r.importo) || 0
      }
    })

    // Trova discrepanze (entrambi presenti)
    const discrepancies = Object.values(grouped).filter(g => g.auto > 0 && g.manual > 0)

    return { data: discrepancies, error: null }
  } catch (error) {
    console.error('Error checking discrepancies:', error)
    return { data: null, error }
  }
}
