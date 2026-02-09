import { supabase } from '../lib/supabase'

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
})

// GET: Revenue per mese (con nomi creator)
export const getRevenueByMonth = async (mese) => {
  try {
    const { data, error } = await supabase
      .from('revenue_mensile')
      .select(`*, creators (nome)`)
      .eq('mese', mese)
      .order('importo', { ascending: false })

    if (error) throw error
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
    const { data, error } = await supabase
      .from('revenue_mensile')
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

// GET: Tutte le revenue
export const getAllRevenue = async () => {
  try {
    const { data, error } = await supabase
      .from('revenue_mensile')
      .select(`*, creators (nome)`)
      .order('mese', { ascending: false })

    if (error) throw error
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
    const { data, error } = await supabase
      .from('revenue_mensile')
      .upsert(toSnakeCase(revenueData), { onConflict: 'creator_id,mese' })
      .select()
      .single()

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
    const { data, error } = await supabase
      .from('revenue_mensile')
      .select('mese, importo')

    if (error) throw error

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
