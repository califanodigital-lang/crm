import { supabase } from '../lib/supabase'

// STATS: Dashboard agente (collaborazioni + revenue)
export const getAgentStats = async (agenteNome) => {
  try {
    // 1. Collaborazioni dell'agente
    const { data: collabs, error: collabError } = await supabase
      .from('collaborations')
      .select('stato, pagamento, fee_management, pagato')
      .eq('agente', agenteNome)

    if (collabError) throw collabError

    // 2. Calcola stats
    const stats = {
      totaleDeal: collabs.length,
      completati: collabs.filter(c => c.stato === 'COMPLETATO').length,
      inCorso: collabs.filter(c => c.stato === 'IN_CORSO').length,
      totalRevenue: collabs
        .filter(c => c.stato === 'COMPLETATO' && c.pagato)
        .reduce((sum, c) => sum + parseFloat(c.pagamento || 0), 0),
      totalCommissioni: collabs
        .filter(c => c.stato === 'COMPLETATO' && c.pagato)
        .reduce((sum, c) => sum + parseFloat(c.fee_management || 0), 0),
      conversionRate: collabs.length > 0 
        ? ((collabs.filter(c => c.stato === 'COMPLETATO').length / collabs.length) * 100).toFixed(1)
        : 0
    }

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// STATS: Tutti gli agenti (classifica)
export const getAllAgentsStats = async () => {
  try {
    const { data: collabs, error } = await supabase
      .from('collaborations')
      .select('agente, stato, pagamento, fee_management, pagato')

    if (error) throw error

    // Raggruppa per agente
    const agentsMap = {}
    
    collabs.forEach(c => {
      const addAgent = (nome, tipo, importo) => {
        if (!nome) return
        if (!agentsMap[nome]) agentsMap[nome] = {
          agente: nome, totaleDeal: 0, completati: 0,
          totalRevenue: 0, totalCommissioni: 0,
          commissioniRicerca: 0, commissioniContatto: 0, commissioniChiusura: 0
        }
        if (tipo === 'deal') { agentsMap[nome].totaleDeal++ }
        if (tipo === 'revenue' && c.pagato) {
          agentsMap[nome].totalRevenue += importo
          agentsMap[nome].completati++
        }
        if (tipo === 'ricerca')  agentsMap[nome].commissioniRicerca  += parseFloat(c.fee_sales_calc  || 0)
        if (tipo === 'contatto') agentsMap[nome].commissioniContatto += parseFloat(c.fee_agente_calc || 0)
        if (tipo === 'chiusura') agentsMap[nome].commissioniChiusura += parseFloat(c.fee_senior_calc || 0)
        agentsMap[nome].totalCommissioni =
          agentsMap[nome].commissioniRicerca +
          agentsMap[nome].commissioniContatto +
          agentsMap[nome].commissioniChiusura
      }

      addAgent(c.sales,  'deal', 0)
      addAgent(c.agente, 'deal', 0)
      addAgent(c.senior, 'deal', 0)
      if (c.stato === 'COMPLETATO') {
        addAgent(c.sales,  'revenue', parseFloat(c.pagamento || 0))
        addAgent(c.sales,  'ricerca',  0)
        addAgent(c.agente, 'contatto', 0)
        addAgent(c.senior, 'chiusura', 0)
      }
    })

    // Converti in array e aggiungi conversion rate
    const agents = Object.values(agentsMap).map(a => ({
      ...a,
      conversionRate: a.totaleDeal > 0 
        ? ((a.completati / a.totaleDeal) * 100).toFixed(1)
        : 0
    }))

    // Ordina per revenue
    agents.sort((a, b) => b.totalRevenue - a.totalRevenue)

    return { data: agents, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// GET: Collaborazioni dell'agente (dettaglio)
export const getAgentCollaborations = async (agenteNome) => {
  try {
    const { data, error } = await supabase
      .from('collaborations')
      .select(`
        *,
        creators (nome)
      `)
      .eq('agente', agenteNome)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return { 
      data: data.map(c => ({
        ...c,
        creatorNome: c.creators?.nome
      })), 
      error: null 
    }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}
