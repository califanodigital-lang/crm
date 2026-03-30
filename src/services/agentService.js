import { supabase } from '../lib/supabase'

const toNumber = (value) => parseFloat(value || 0) || 0

const ACTIVE_STATES = ['FIRMATO', 'IN_CORSO', 'REVISIONE_VIDEO', 'VIDEO_PUBBLICATO', 'ATTESA_PAGAMENTO']

const isCompleted = (c) => c.stato === 'COMPLETATO'
const isPaidCompleted = (c) => c.stato === 'COMPLETATO' && c.pagato

const getMonthPrefix = (month) => month || new Date().toISOString().slice(0, 7)

const isInSelectedMonth = (collab, month) => {
  const prefix = getMonthPrefix(month)
  return collab.dataPagamento?.startsWith(prefix)
}

const normalizeCollab = (c) => ({
  id: c.id,
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
  dataPagamento: c.data_pagamento || '',
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
      data_pagamento,
      creators (nome)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data.map(normalizeCollab)
}

// Dashboard singolo agente
export const getAgentStats = async (agenteNome, month) => {
  try {
    const allCollabs = await fetchAllCollaborations()

    const collabs = allCollabs.filter(c =>
      c.sales === agenteNome ||
      c.agente === agenteNome ||
      c.senior === agenteNome
    )

    const monthlyPaidCompleted = collabs.filter(c =>
      isPaidCompleted(c) && isInSelectedMonth(c, month)
    )

    const stats = {
      totaleDeal: collabs.length,
      completati: collabs.filter(c => isCompleted(c)).length,
      inCorso: collabs.filter(c => ACTIVE_STATES.includes(c.stato)).length,
      totalDealValue: 0,
      totalCommissioni: 0,
      commissioniRicerca: 0,
      commissioniContatto: 0,
      commissioniChiusura: 0
    }

      monthlyPaidCompleted.forEach(c => {
        const involved =
          c.sales === agenteNome ||
          c.agente === agenteNome ||
          c.senior === agenteNome

        if (involved) {
          stats.totalDealValue += c.pagamento
        }

        if (c.sales === agenteNome) stats.commissioniRicerca += c.feeSalesCalc
        if (c.agente === agenteNome) stats.commissioniContatto += c.feeAgenteCalc
        if (c.senior === agenteNome) stats.commissioniChiusura += c.feeSeniorCalc
      })

    stats.totalCommissioni =
      stats.commissioniRicerca +
      stats.commissioniContatto +
      stats.commissioniChiusura

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error fetching agent stats:', error)
    return { data: null, error }
  }
}

// Classifica agenti
export const getAllAgentsStats = async (month) => {
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
          commissioniChiusura: 0
        }
      }
    }

    collabs.forEach(c => {
      const uniqueAgents = [...new Set([c.sales, c.agente, c.senior].filter(Boolean))]

      uniqueAgents.forEach(nome => {
        ensureAgent(nome)
        agentsMap[nome].totaleDeal += 1
        if (isCompleted(c)) agentsMap[nome].completati += 1
      })

      if (isPaidCompleted(c) && isInSelectedMonth(c, month)) {
        uniqueAgents.forEach(nome => {
          ensureAgent(nome)
          agentsMap[nome].totalDealValue += c.pagamento
        })

        if (c.sales) agentsMap[c.sales].commissioniRicerca += c.feeSalesCalc
        if (c.agente) agentsMap[c.agente].commissioniContatto += c.feeAgenteCalc
        if (c.senior) agentsMap[c.senior].commissioniChiusura += c.feeSeniorCalc
      }
    })

    const agents = Object.values(agentsMap).map(a => {
      a.totalCommissioni =
        a.commissioniRicerca +
        a.commissioniContatto +
        a.commissioniChiusura
      return a
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

// Ultime collaborazioni del singolo agente
export const getAgentCollaborations = async (agenteNome, month) => {
  try {
    const allCollabs = await fetchAllCollaborations()

    const data = allCollabs
      .filter(c =>
        c.sales === agenteNome ||
        c.agente === agenteNome ||
        c.senior === agenteNome
      )
      .filter(c => !month || isInSelectedMonth(c, month))
      .map(c => {
        let personalCommission = 0
        const roles = []

        if (c.sales === agenteNome) {
          personalCommission += c.feeSalesCalc
          roles.push('Ricerca')
        }
        if (c.agente === agenteNome) {
          personalCommission += c.feeAgenteCalc
          roles.push('Contatto')
        }
        if (c.senior === agenteNome) {
          personalCommission += c.feeSeniorCalc
          roles.push('Chiusura')
        }

        return {
          ...c,
          personalCommission: isPaidCompleted(c) ? personalCommission : 0,
          rolesLabel: roles.join(' • ')
        }
      })

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching agent collaborations:', error)
    return { data: null, error }
  }
}