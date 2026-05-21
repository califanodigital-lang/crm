// src/services/dashboardService.js
import { supabase } from '../lib/supabase'
import { fetchAllRows } from './supabasePagination'

// KPI Globali
export const getGlobalStats = async (mese) => {
  try {
    const now = new Date()
    const meseCorrente = mese || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const [brandsRes, creatorsRes, collabsData, revenueData, brandContattatoRes] = await Promise.all([
      supabase.from('brands').select('id', { count: 'exact' }),
      supabase.from('creators').select('id', { count: 'exact' }),
      fetchAllRows(() => supabase.from('collaborations').select('id, stato, pagamento, pagato')),
      fetchAllRows(() => supabase.from('revenue_mensile').select('importo, mese')),
      supabase.from('proposte_brand').select('id', { count: 'exact' }).not('stato', 'in', '("NESSUNA_RISPOSTA","CHIUSO_PERSO")')
    ])

    const STATI_ATTIVI = ['IN_LAVORAZIONE','ATTESA_PAGAMENTO_CREATOR','ATTESA_PAGAMENTO_AGENCY']

    const totalBrands    = brandsRes.count || 0
    const totalCreators  = creatorsRes.count || 0
    const totalCollabs   = collabsData.length
    const activeCollabs  = collabsData.filter(c => STATI_ATTIVI.includes(c.stato)).length
    const completate     = collabsData.filter(c => c.stato === 'COMPLETATA' && c.pagato).length
    const totalBrandContattati = brandContattatoRes.count || 0

    // Revenue da collaborazioni completate (fonte primaria)
    const revenueCollabs = collabsData
      .filter(c => c.stato === 'COMPLETATA' && c.pagato)
      .reduce((sum, c) => sum + (parseFloat(c.pagamento) || 0), 0) || 0

    // Revenue mese corrente da revenue_mensile
    const monthlyRevenue = revenueData
      .filter(r => r.mese?.startsWith(meseCorrente))
      .reduce((sum, r) => sum + (parseFloat(r.importo) || 0), 0) || 0

    return {
      data: {
        totalBrands, totalCreators, totalCollabs,
        activeCollabs, completate, monthlyRevenue,
        revenueCollabs, totalBrandContattati
      },
      error: null
    }
  } catch (error) {
    return { data: null, error }
  }
}

// Top 5 Creator per revenue
export const getTopCreators = async () => {
  try {
    const data = await fetchAllRows(() => supabase
      .from('collaborations')
      .select('creator_id, pagamento, stato, pagato, creators(nome)')
      .eq('stato', 'COMPLETATA')
      .eq('pagato', true))

    const map = {}
    data.forEach(c => {
      const id = c.creator_id
      if (!map[id]) map[id] = { id, nome: c.creators?.nome || '?', revenue: 0 }
      map[id].revenue += parseFloat(c.pagamento || 0)
    })

    const top = Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
    return { data: top, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

  // Revenue ultimi 6 mesi (per grafico)
  export const getRevenueChart = async () => {
    try {
      const data = await fetchAllRows(() => supabase
        .from('revenue_mensile')
        .select('mese, importo')
        .order('mese', { ascending: true }))

      const monthlyMap = {}

      data.forEach(r => {
        const mese = (r.mese || '').substring(0, 7)
        if (!mese) return
        monthlyMap[mese] = (monthlyMap[mese] || 0) + (parseFloat(r.importo) || 0)
      })

      const chartData = Object.keys(monthlyMap)
        .sort()
        .slice(-6)
        .map(mese => ({
          mese,
          revenue: monthlyMap[mese]
        }))

      return { data: chartData, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

// Proposte stats
export const getProposteStats = async () => {
  try {
    const data = await fetchAllRows(() => supabase
      .from('proposte_brand')
      .select('stato'))

    const stats = {
      totale: data.length,
      daContattare: data.filter(p => ['RICERCA_COMPLETATA','ONBOARDING','PRIMO_CONTATTO'].includes(p.stato)).length,
      inTrattativa: data.filter(p => p.stato === 'IN_TRATTATIVA').length,
      chiusoVinto: data.filter(p => p.stato === 'CONTRATTO_FIRMATO').length,
      chiusoPerso: data.filter(p => p.stato === 'CHIUSO_PERSO').length,
    }

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}
