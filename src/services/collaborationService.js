import { supabase } from '../lib/supabase'
import { syncRevenueFromCollaboration, unsyncRevenueFromCollaboration } from './revenueService'


const syncTrattativaFromCollaboration = async (collab) => {
  if (!collab?.trattativaId) return

  const payload = {
    sales: cleanValue(collab.sales),
    ima: cleanValue(collab.agente),
    agente: cleanValue(collab.senior),
    brand_nome: cleanValue(collab.brandNome),
    contatto: cleanValue(collab.contatto),
    note_trattativa: cleanValue(collab.note),
    updated_at: new Date().toISOString()
  }

  await supabase
    .from('proposte_brand')
    .update(payload)
    .eq('id', collab.trattativaId)
}

// Utility per convertire valori vuoti in null
const cleanValue = (value) => {
  if (value === '' || value === undefined) return null
  return value
}

const toNumber = (value) => parseFloat(value || 0) || 0

const deriveFeeManagement = (collab) => {
  const explicitFee = cleanValue(collab.feeManagement)
  if (explicitFee !== null) return explicitFee

  const pagamento = toNumber(collab.pagamento)
  return pagamento > 0 ? +(pagamento * 0.25).toFixed(2) : null
}

const recalculateBrandSummary = async (brandId, fallbackBrandNome = null) => {
  if (!brandId && !fallbackBrandNome) return

  let brandQuery = supabase.from('brands').select('id, nome')
  brandQuery = brandId ? brandQuery.eq('id', brandId) : brandQuery.eq('nome', fallbackBrandNome)

  const { data: brand, error: brandError } = await brandQuery.maybeSingle()
  if (brandError || !brand) return

  const { data: collabs, error: collabsError } = await supabase
    .from('collaborations')
    .select('id, stato, data_firma, data_pagamento_agency, created_at')
    .eq('brand_id', brand.id)
    .order('created_at', { ascending: false })

  if (collabsError) return

  const completed = (collabs || []).filter(c => c.stato === 'COMPLETATA')
  const cancelled = (collabs || []).filter(c => c.stato === 'ANNULLATA')

  if (completed.length > 0) {
    const latest = [...completed].sort((a, b) => {
      const da = a.data_pagamento_agency || a.data_firma || a.created_at || ''
      const db = b.data_pagamento_agency || b.data_firma || b.created_at || ''
      return String(db).localeCompare(String(da))
    })[0]

    const lastDate =
      latest.data_pagamento_agency ||
      latest.data_pagamento_creator ||
      latest.data_firma ||
      (latest.created_at ? String(latest.created_at).slice(0, 10) : null)

    await supabase
      .from('brands')
      .update({
        ultimo_esito: 'POSITIVO',
        data_ultima_collaborazione: lastDate,
        ha_collaborazioni_passate: true
      })
      .eq('id', brand.id)

    return
  }

  if (cancelled.length > 0) {
    await supabase
      .from('brands')
      .update({
        ultimo_esito: 'NEGATIVO',
        data_ultima_collaborazione: null,
        ha_collaborazioni_passate: false
      })
      .eq('id', brand.id)

    return
  }

  await supabase
    .from('brands')
    .update({
      ultimo_esito: null,
      data_ultima_collaborazione: null,
      ha_collaborazioni_passate: false
    })
    .eq('id', brand.id)
}

// Utility per convertire da snake_case (DB) a camelCase (Frontend)
const toCamelCase = (collab) => {
  if (!collab) return null
  return {
    brandId: collab.brand_id,
    trattativaId: collab.trattativa_id,
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
    pagato_agency: collab.pagato_agency,
    contatto: collab.contatto,
    note: collab.note,
    createdAt: collab.created_at,
    updatedAt: collab.updated_at,
    senior: collab.senior,
    feeSalesCalc: collab.fee_sales_calc,
    feeAgenteCalc: collab.fee_agente_calc,
    feeSeniorCalc: collab.fee_senior_calc,
    dataPagamentoCreator: collab.data_pagamento_creator,
    dataPagamentoAgency: collab.data_pagamento_agency,
    assegnatario: collab.assegnatario || [],
    creatoDa: collab.creato_da,
    tranche: collab.tranche || [],
  }
}

// Utility per convertire da camelCase (Frontend) a snake_case (DB)
const toSnakeCase = (collab) => {
  return {
    brand_id: cleanValue(collab.brandId),
    trattativa_id: cleanValue(collab.trattativaId),
    creator_id: collab.creatorId,
    brand_nome: collab.brandNome,
    pagamento: cleanValue(collab.pagamento),
    fee_management: deriveFeeManagement(collab),
    data_firma: cleanValue(collab.dataFirma),
    data_pubblicazione: cleanValue(collab.dataPubblicazione),
    durata_contratto: cleanValue(collab.durataContratto),
    adv: cleanValue(collab.adv),
    agente: cleanValue(collab.agente),
    sales: cleanValue(collab.sales),
    stato: collab.stato || 'IN_LAVORAZIONE',
    pagato_agency: collab.pagato_agency || false,
    contatto: cleanValue(collab.contatto),
    note: cleanValue(collab.note),
    senior: cleanValue(collab.senior),
    fee_sales_calc: collab.feeSalesCalc || 0,
    fee_agente_calc: collab.feeAgenteCalc || 0,
    fee_senior_calc: collab.feeSeniorCalc || 0,
    data_pagamento_creator: cleanValue(collab.dataPagamentoCreator),
    data_pagamento_agency: collab.pagato_agency ? cleanValue(collab.dataPagamentoAgency) : null,
    assegnatario: collab.assegnatario || [],
    creato_da: cleanValue(collab.creatoDa),
    tranche: collab.tranche?.length > 0 ? collab.tranche : null,
    pagato: collab.tranche?.length > 0
      ? collab.tranche.every(t => t.pagato)
      : (collab.pagato || false),
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
export const getCollaborationsByBrand = async (brandId) => {
  try {
    const { data, error } = await supabase
      .from('collaborations')
      .select(`
        *,
        creators (nome, nome_completo)
      `)
      .eq('brand_id', brandId)
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

    const collaboration = toCamelCase(data)

    await syncTrattativaFromCollaboration(collaboration)

    if (collaboration.stato === 'COMPLETATA' && collaboration.pagato) {
      await syncRevenueFromCollaboration(collaboration)
    }

    await recalculateBrandSummary(collaboration.brandId, collaboration.brandNome)
    return { data: collaboration, error: null }
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

    const collaboration = toCamelCase(data)

    await syncTrattativaFromCollaboration(collaboration)

    if (collaboration.stato === 'COMPLETATA' && collaboration.pagato) {
      await syncRevenueFromCollaboration(collaboration)
    } else {
      await unsyncRevenueFromCollaboration(id)
    }

    await recalculateBrandSummary(collaboration.brandId, collaboration.brandNome)

    return { data: collaboration, error: null }
  } catch (error) {
    console.error('Error updating collaboration:', error)
    return { data: null, error }
  }
}

// DELETE: Elimina collaborazione
export const deleteCollaboration = async (id) => {
  try {
    const { data: existing, error: readError } = await supabase
      .from('collaborations')
      .select('id, trattativa_id, brand_id, brand_nome')
      .eq('id', id)
      .single()

    if (readError) throw readError

    await unsyncRevenueFromCollaboration(id)

    const { error } = await supabase
      .from('collaborations')
      .delete()
      .eq('id', id)

    if (error) throw error

    if (existing?.trattativa_id) {
      const { count } = await supabase
        .from('collaborations')
        .select('*', { count: 'exact', head: true })
        .eq('trattativa_id', existing.trattativa_id)

      if ((count || 0) === 0) {
        await supabase
          .from('proposte_brand')
          .update({ stato: 'CONTRATTO_FIRMATO' })
          .eq('id', existing.trattativa_id)
      }
    }

    await recalculateBrandSummary(existing?.brand_id, existing?.brand_nome)

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
      inCorso: data.filter(c => ['IN_LAVORAZIONE','ATTESA_PAGAMENTO_CREATOR','ATTESA_PAGAMENTO_AGENCY'].includes(c.stato)).length,
      completate: data.filter(c => c.stato === 'COMPLETATA').length,
      totalRevenue: data
        .filter(c => c.stato === 'COMPLETATA' && c.pagato)
        .reduce((sum, c) => sum + (parseFloat(c.pagamento) || 0), 0)
    }

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error calculating stats:', error)
    return { data: null, error }
  }
}
