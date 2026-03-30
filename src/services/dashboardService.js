// src/services/dashboardService.js
import { supabase } from '../lib/supabase'

// KPI Globali
export const getGlobalStats = async () => {
  try {
    const now = new Date()
    const meseCorrente = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const [brandsRes, creatorsRes, collabsRes, revenueRes, brandContattatoRes] = await Promise.all([
      supabase.from('brands').select('id', { count: 'exact' }),
      supabase.from('creators').select('id', { count: 'exact' }),
      supabase.from('collaborations').select('id, stato, pagamento, pagato'),
      supabase.from('revenue_mensile').select('importo, mese'),
      supabase.from('brand_contattati').select('id', { count: 'exact' })
    ])

    const STATI_ATTIVI = ['FIRMATO','IN_CORSO','REVISIONE_VIDEO','VIDEO_PUBBLICATO','ATTESA_PAGAMENTO']

    const totalBrands    = brandsRes.count || 0
    const totalCreators  = creatorsRes.count || 0
    const totalCollabs   = collabsRes.data?.length || 0
    const activeCollabs  = collabsRes.data?.filter(c => STATI_ATTIVI.includes(c.stato)).length || 0
    const completate     = collabsRes.data?.filter(c => c.stato === 'COMPLETATO' && c.pagato).length || 0
    const totalBrandContattati = brandContattatoRes.count || 0

    // Revenue da collaborazioni completate (fonte primaria)
    const revenueCollabs = collabsRes.data
      ?.filter(c => c.stato === 'COMPLETATO' && c.pagato)
      .reduce((sum, c) => sum + (parseFloat(c.pagamento) || 0), 0) || 0

    // Revenue mese corrente da revenue_mensile
    const monthlyRevenue = revenueRes.data
      ?.filter(r => r.mese?.startsWith(meseCorrente))
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
    const { data, error } = await supabase
      .from('collaborations')
      .select('creator_id, pagamento, stato, pagato, creators(nome)')
      .eq('stato', 'COMPLETATO')
      .eq('pagato', true)

    if (error) throw error

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
      const { data, error } = await supabase
        .from('revenue_mensile')
        .select('mese, importo')
        .order('mese', { ascending: true })

      if (error) throw error

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
    const { data, error } = await supabase
      .from('proposte_brand')
      .select('stato')

    if (error) throw error

    const stats = {
      totale: data.length,
      daContattare: data.filter(p => p.stato === 'DA_CONTATTARE').length,
      inTrattativa: data.filter(p => p.stato === 'IN_TRATTATIVA').length,
      chiusoVinto: data.filter(p => p.stato === 'CHIUSO_VINTO').length,
      chiusoPerso: data.filter(p => p.stato === 'CHIUSO_PERSO').length,
    }

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}
