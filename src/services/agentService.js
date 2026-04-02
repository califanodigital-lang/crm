import { supabase } from '../lib/supabase'

const toNumber = (value) => parseFloat(value || 0) || 0

const ACTIVE_STATES = [
  'IN_LAVORAZIONE',
  'ATTESA_PAGAMENTO_CREATOR',
  'ATTESA_PAGAMENTO_AGENCY'
]

const isCompleted = (c) => c.stato === 'COMPLETATO'
const isPaidCompleted = (c) => c.stato === 'COMPLETATO' && c.pagato

const normalizeCollab = (c) => ({
  id: c.id,
  creatorId: c.creator_id,
  creatorNome: c.creators?.nome || '',
  brandNome: c.brand_nome,
  pagamento: toNumber(c.pagamento),
  feeManagement: toNumber(c.fee_management),
  stato: c.stato,
  pagato: !!c.pagato,
  sales: c.sales || '',
  agente: c.agente || '',
  senior: c.senior || '',
  feeSalesCalc: toNumber(c.fee_sales_calc),
  feeAgenteCalc: toNumber(c.fee_agente_calc),
  feeSeniorCalc: toNumber(c.fee_senior_calc),
})

const getAgentContribution = (collab, agenteNome) => {
  const roles = []
  let commissioniRicerca = 0
  let commissioniContatto = 0
  let commissioniChiusura = 0

  if (collab.sales === agenteNome) {
    roles.push('Ricerca')
    commissioniRicerca = collab.feeSalesCalc
  }

  if (collab.agente === agenteNome) {
    roles.push('Contatto')
    commissioniContatto = collab.feeAgenteCalc
  }

  if (collab.senior === agenteNome) {
    roles.push('Chiusura')
    commissioniChiusura = collab.feeSeniorCalc
  }

  return {
    involved: roles.length > 0,
    roles,
    rolesLabel: roles.join(' • '),
    commissioniRicerca,
    commissioniContatto,
    commissioniChiusura,
    totalCommissioni: commissioniRicerca + commissioniContatto + commissioniChiusura
  }
}

const fetchAllCollaborations = async () => {
  const { data, error } = await supabase
    .from('collaborations')
    .select(`
      id,
      creator_id,
      brand_nome,
      pagamento,
      fee_management,
      stato,
      pagato,
      sales,
      agente,
      senior,
      fee_sales_calc,
      fee_agente_calc,
      fee_senior_calc,
      creators (nome)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data.map(normalizeCollab)
}

export const getAgentStats = async (agenteNome) => {
  try {
    const allCollabs = await fetchAllCollaborations()
    const collabs = allCollabs.filter(c => getAgentContribution(c, agenteNome).involved)

    const stats = {
      totaleDeal: collabs.length,
      completati: 0,
      inCorso: 0,
      totalDealValue: 0,
      totalCommissioni: 0,
      commissioniRicerca: 0,
      commissioniContatto: 0,
      commissioniChiusura: 0,
      conversionRate: 0
    }

    collabs.forEach(c => {
      const contribution = getAgentContribution(c, agenteNome)

      if (isCompleted(c)) stats.completati++
      if (ACTIVE_STATES.includes(c.stato)) stats.inCorso++

      if (isPaidCompleted(c)) {
        stats.totalDealValue += c.pagamento
        stats.totalCommissioni += contribution.totalCommissioni
        stats.commissioniRicerca += contribution.commissioniRicerca
        stats.commissioniContatto += contribution.commissioniContatto
        stats.commissioniChiusura += contribution.commissioniChiusura
      }
    })

    stats.conversionRate =
      stats.totaleDeal > 0
        ? ((stats.completati / stats.totaleDeal) * 100).toFixed(1)
        : 0

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error fetching agent stats:', error)
    return { data: null, error }
  }
}

export const getAllAgentsStats = async () => {
  try {
    const collabs = await fetchAllCollaborations()
    const agentsMap = {}

    const ensureAgent = (nome) => {
      if (!nome) return
      if (!agentsMap[nome]) {
        agentsMap[nome] = {
          agente: nome,
          totaleDeal: 0,
          completati: 0,
          totalDealValue: 0,
          totalCommissioni: 0,
          commissioniRicerca: 0,
          commissioniContatto: 0,
          commissioniChiusura: 0,
          conversionRate: 0
        }
      }
    }

    collabs.forEach(c => {
      const uniqueAgents = [...new Set([c.sales, c.agente, c.senior].filter(Boolean))]

      uniqueAgents.forEach(nome => {
        ensureAgent(nome)
        agentsMap[nome].totaleDeal += 1
        if (isCompleted(c)) agentsMap[nome].completati += 1
        if (isPaidCompleted(c)) agentsMap[nome].totalDealValue += c.pagamento
      })

      if (isPaidCompleted(c)) {
        if (c.sales) {
          ensureAgent(c.sales)
          agentsMap[c.sales].commissioniRicerca += c.feeSalesCalc
        }

        if (c.agente) {
          ensureAgent(c.agente)
          agentsMap[c.agente].commissioniContatto += c.feeAgenteCalc
        }

        if (c.senior) {
          ensureAgent(c.senior)
          agentsMap[c.senior].commissioniChiusura += c.feeSeniorCalc
        }
      }
    })

    const agents = Object.values(agentsMap).map(a => {
      const totalCommissioni =
        a.commissioniRicerca +
        a.commissioniContatto +
        a.commissioniChiusura

      return {
        ...a,
        totalCommissioni,
        conversionRate: a.totaleDeal > 0
          ? ((a.completati / a.totaleDeal) * 100).toFixed(1)
          : 0
      }
    })

    agents.sort((a, b) =>
      (b.totalCommissioni - a.totalCommissioni) ||
      (b.totalDealValue - a.totalDealValue) ||
      (b.completati - a.completati)
    )

    return { data: agents, error: null }
  } catch (error) {
    console.error('Error fetching all agents stats:', error)
    return { data: null, error }
  }
}

export const getAgentCollaborations = async (agenteNome) => {
  try {
    const allCollabs = await fetchAllCollaborations()

    const data = allCollabs
      .filter(c => getAgentContribution(c, agenteNome).involved)
      .map(c => {
        const contribution = getAgentContribution(c, agenteNome)

        return {
          ...c,
          personalCommission: isPaidCompleted(c) ? contribution.totalCommissioni : 0,
          commissioniRicerca: isPaidCompleted(c) ? contribution.commissioniRicerca : 0,
          commissioniContatto: isPaidCompleted(c) ? contribution.commissioniContatto : 0,
          commissioniChiusura: isPaidCompleted(c) ? contribution.commissioniChiusura : 0,
          roles: contribution.roles,
          rolesLabel: contribution.rolesLabel
        }
      })

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching agent collaborations:', error)
    return { data: null, error }
  }
}