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

// revenueService.js - AGGIUNGI FUNZIONE SYNC

/**
 * Sincronizza revenue da collaborazione completata e pagata
 */
export const syncRevenueFromCollaboration = async (collaboration) => {
  try {
    // Verifica condizioni
    if (collaboration.stato !== 'COMPLETATO' || !collaboration.pagato) {
      console.log('Collaboration not ready for revenue sync:', collaboration.id)
      return { data: null, error: null } // Non è errore, semplicemente non sincronizzare
    }

    if (!collaboration.dataFirmaContratto) {
      console.warn('Collaboration missing dataFirmaContratto:', collaboration.id)
      return { data: null, error: { message: 'Data firma contratto mancante' } }
    }

    // Calcola mese (YYYY-MM)
    const dataFirma = new Date(collaboration.dataFirmaContratto)
    const mese = `${dataFirma.getFullYear()}-${String(dataFirma.getMonth() + 1).padStart(2, '0')}`

    // Verifica se revenue esiste già per questa collaborazione
    const { data: existingRevenue, error: checkError } = await supabase
      .from('revenue_mensile')
      .select('id, importo')
      .eq('collaborazione_id', collaboration.id)
      .maybeSingle()

    if (checkError) throw checkError

    const revenueData = {
      creator_id: collaboration.creatorId,
      mese: mese,
      importo: parseFloat(collaboration.pagamento) || 0,
      collaborazione_id: collaboration.id,
      brand_nome: collaboration.brandNome,
      agente: collaboration.agente
    }

    if (existingRevenue) {
      // UPDATE revenue esistente
      const { data, error } = await supabase
        .from('revenue_mensile')
        .update(revenueData)
        .eq('id', existingRevenue.id)
        .select()
        .single()

      if (error) throw error
      console.log('Revenue updated from collaboration:', collaboration.id)
      return { data, error: null }
    } else {
      // CREATE nuova revenue
      const { data, error } = await supabase
        .from('revenue_mensile')
        .insert([revenueData])
        .select()
        .single()

      if (error) throw error
      console.log('Revenue created from collaboration:', collaboration.id)
      return { data, error: null }
    }
  } catch (error) {
    console.error('Error syncing revenue from collaboration:', error)
    return { data: null, error }
  }
}

/**
 * Rimuove revenue auto-generata se collaborazione non è più completata/pagata
 */
export const unsyncRevenueFromCollaboration = async (collaborationId) => {
  try {
    const { error } = await supabase
      .from('revenue_mensile')
      .delete()
      .eq('collaborazione_id', collaborationId)

    if (error) throw error
    console.log('Revenue unsynced from collaboration:', collaborationId)
    return { error: null }
  } catch (error) {
    console.error('Error unsyncing revenue:', error)
    return { error }
  }
}

/**
 * Verifica discrepanze tra revenue manuale e auto
 */
export const checkRevenueDiscrepancies = async () => {
  try {
    // Revenue totale per creator/mese
    const { data: allRevenue, error } = await supabase
      .from('revenue_mensile')
      .select('creator_id, mese, importo, collaborazione_id')
      .order('mese', { ascending: false })

    if (error) throw error

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
