import { supabase } from '../lib/supabase'
import { fetchAllRows } from './supabasePagination'

const activeStates = ['IN_LAVORAZIONE', 'ATTESA_PAGAMENTO_CREATOR', 'ATTESA_PAGAMENTO_AGENCY']
const isPaidCompleted = c => c.stato === 'COMPLETATA' && c.pagato
const inMonth = (c, month) => !month || c.dataPagamentoAgency?.startsWith(month)
const rolesFor = (c, name) => [
  c.sales === name && 'Ricerca',
  c.agente === name && 'Contatto',
  c.senior === name && 'Chiusura',
].filter(Boolean)

const fetchCollaborations = async () => {
  const rows = await fetchAllRows(() => supabase.from('collaborations')
    .select('id, creator_id, brand_nome, pagamento, stato, pagato, sales, agente, senior, data_pagamento_agency, created_at, creators(nome)')
    .order('created_at', { ascending: false }))
  return rows.map(c => ({
    id: c.id,
    creatorId: c.creator_id,
    creatorNome: c.creators?.nome || '',
    brandNome: c.brand_nome,
    pagamento: parseFloat(c.pagamento || 0) || 0,
    stato: c.stato,
    pagato: !!c.pagato,
    sales: c.sales || '',
    agente: c.agente || '',
    senior: c.senior || '',
    dataPagamentoAgency: c.data_pagamento_agency,
  }))
}

export const getAllAgentsStats = async (selectedMonth = null) => {
  try {
    const collabs = await fetchCollaborations()
    const agents = new Map()
    for (const c of collabs) {
      for (const name of new Set([c.sales, c.agente, c.senior].filter(Boolean))) {
        if (!agents.has(name)) agents.set(name, {
          agente: name, totaleDeal: 0, completati: 0, inCorso: 0, totalDealValue: 0,
        })
        const stats = agents.get(name)
        stats.totaleDeal++
        if (c.stato === 'COMPLETATA') stats.completati++
        if (activeStates.includes(c.stato)) stats.inCorso++
        if (isPaidCompleted(c) && inMonth(c, selectedMonth)) stats.totalDealValue += c.pagamento
      }
    }
    const data = [...agents.values()].map(a => ({
      ...a,
      conversionRate: a.totaleDeal ? ((a.completati / a.totaleDeal) * 100).toFixed(1) : 0,
    })).sort((a, b) => b.totalDealValue - a.totalDealValue || b.completati - a.completati)
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const getAgentCollaborations = async (agenteNome, selectedMonth = null) => {
  try {
    const collabs = await fetchCollaborations()
    const data = collabs
      .filter(c => rolesFor(c, agenteNome).length > 0)
      .filter(c => inMonth(c, selectedMonth) || !isPaidCompleted(c))
      .map(c => ({ ...c, roles: rolesFor(c, agenteNome), rolesLabel: rolesFor(c, agenteNome).join(' / ') }))
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
