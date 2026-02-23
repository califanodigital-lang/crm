import { supabase } from '../lib/supabase'
import { syncRevenueFromCollaboration, unsyncRevenueFromCollaboration } from './revenueService'

// Utility per convertire valori vuoti in null
const cleanValue = (value) => {
  if (value === '' || value === undefined) return null
  return value
}

// Utility per convertire da snake_case (DB) a camelCase (Frontend)
const toCamelCase = (collab) => {
  if (!collab) return null
  return {
    id: collab.id,
    creatorId: collab.creator_id,
    creatorNome: collab.creator_nome,
    brandNome: collab.brand_nome,
    pagamento: collab.pagamento,
    feeManagement: collab.fee_management,
    dataFirma: collab.data_firma,
    dataPubblicazione: collab.data_pubblicazione,
    durataContratto: collab.durata_contratto,
    adv: collab.adv,
    agente: collab.agente,
    sales: collab.sales,
    stato: collab.stato,
    pagato: collab.pagato,
    contatto: collab.contatto,
    note: collab.note,
    createdAt: collab.created_at,
    updatedAt: collab.updated_at,
  }
}

// Utility per convertire da camelCase (Frontend) a snake_case (DB)
const toSnakeCase = (collab) => {
  return {
    creator_id: collab.creatorId,
    brand_nome: collab.brandNome,
    pagamento: cleanValue(collab.pagamento),
    fee_management: cleanValue(collab.feeManagement),
    data_firma: cleanValue(collab.dataFirma),
    data_pubblicazione: cleanValue(collab.dataPubblicazione),
    durata_contratto: cleanValue(collab.durataContratto),
    adv: cleanValue(collab.adv),
    agente: cleanValue(collab.agente),
    sales: cleanValue(collab.sales),
    stato: collab.stato || 'IN_TRATTATIVA',
    pagato: collab.pagato || false,
    contatto: cleanValue(collab.contatto),
    note: cleanValue(collab.note),
  }
}

// GET: Tutte le collaborazioni con info creator
export const getAllCollaborations = async () => {
  try {
    const { data, error } = await supabase
      .from('collaborations')
      .select(`
        *,
        creators (nome, nome_completo)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    const enrichedData = data.map(collab => ({
      ...toCamelCase(collab),
      creatorNome: collab.creators?.nome || 'N/A'
    }))
    
    return { data: enrichedData, error: null }
  } catch (error) {
    console.error('Error fetching collaborations:', error)
    return { data: null, error }
  }
}

// GET: Collaborazioni per un creator specifico
export const getCollaborationsByCreator = async (creatorId) => {
  try {
    const { data, error } = await supabase
      .from('collaborations')
      .select('*')
      .eq('creator_id', creatorId)
      .order('data_firma', { ascending: false })

    if (error) throw error
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    console.error('Error fetching creator collaborations:', error)
    return { data: null, error }
  }
}

// GET: Collaborazioni per un brand specifico
export const getCollaborationsByBrand = async (brandNome) => {
  try {
    const { data, error } = await supabase
      .from('collaborations')
      .select(`
        *,
        creators (nome, nome_completo)
      `)
      .eq('brand_nome', brandNome)
      .order('data_firma', { ascending: false })

    if (error) throw error
    
    const enrichedData = data.map(collab => ({
      ...toCamelCase(collab),
      creatorNome: collab.creators?.nome || 'N/A'
    }))
    
    return { data: enrichedData, error: null }
  } catch (error) {
    console.error('Error fetching brand collaborations:', error)
    return { data: null, error }
  }
}

// GET: Collaborazione singola per ID
export const getCollaborationById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('collaborations')
      .select(`
        *,
        creators (nome, nome_completo)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    
    const enrichedData = {
      ...toCamelCase(data),
      creatorNome: data.creators?.nome || 'N/A'
    }
    
    return { data: enrichedData, error: null }
  } catch (error) {
    console.error('Error fetching collaboration:', error)
    return { data: null, error }
  }
}

// POST: Crea nuova collaborazione
export const createCollaboration = async (collabData) => {
  try {
    const { data, error } = await supabase
      .from('collaborations')
      .insert([toSnakeCase(collabData)])
      .select()
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error creating collaboration:', error)
    return { data: null, error }
  }
}

// PUT: Aggiorna collaborazione esistente
export const updateCollaboration = async (id, collaborationData) => {
  try {
    const { data, error } = await supabase
      .from('collaborations')
      .update(toSnakeCase(collaborationData))
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // ⭐ SYNC REVENUE - AGGIUNGI QUESTO BLOCCO
    const collaboration = toCamelCase(data)
    
    if (collaboration.stato === 'COMPLETATO' && collaboration.pagato) {
      // Crea/aggiorna revenue
      await syncRevenueFromCollaboration(collaboration)
    } else {
      // Rimuovi revenue auto se non più valida
      const { data: existingRev } = await supabase
        .from('revenue_mensile')
        .select('id')
        .eq('collaborazione_id', id)
        .maybeSingle()
      
      if (existingRev) {
        await unsyncRevenueFromCollaboration(id)
      }
    }
    // ⭐ FINE SYNC

    return { data: collaboration, error: null }
  } catch (error) {
    console.error('Error updating collaboration:', error)
    return { data: null, error }
  }
}

// DELETE: Elimina collaborazione
export const deleteCollaboration = async (id) => {
  try {
    const { error } = await supabase
      .from('collaborations')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error deleting collaboration:', error)
    return { error }
  }
}

// STATS: Calcola statistiche collaborazioni
export const getCollaborationStats = async () => {
  try {
    const { data, error } = await supabase
      .from('collaborations')
      .select('stato, pagamento, pagato')

    if (error) throw error

    const stats = {
      total: data.length,
      inCorso: data.filter(c => c.stato === 'IN_CORSO').length,
      completate: data.filter(c => c.stato === 'COMPLETATO').length,
      totalRevenue: data
        .filter(c => c.stato === 'COMPLETATO' && c.pagato)
        .reduce((sum, c) => sum + (parseFloat(c.pagamento) || 0), 0)
    }

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error calculating stats:', error)
    return { data: null, error }
  }
}
