// src/services/dashboardService.js
import { supabase } from '../lib/supabase'

// KPI Globali
export const getGlobalStats = async () => {
  try {
    const [brandsRes, creatorsRes, collabsRes, revenueRes] = await Promise.all([
      supabase.from('brands').select('id', { count: 'exact' }),
      supabase.from('creators').select('id', { count: 'exact' }),
      supabase.from('collaborations').select('id, stato', { count: 'exact' }),
      supabase.from('revenue_mensile').select('importo')
    ])

    const totalBrands = brandsRes.count || 0
    const totalCreators = creatorsRes.count || 0
    const totalCollabs = collabsRes.count || 0
    const activeCollabs = collabsRes.data?.filter(c => 
      c.stato === 'IN_CORSO' || c.stato === 'FIRMATO'
    ).length || 0

    // Revenue mensile totale (ultimi 30 giorni)
    const monthlyRevenue = revenueRes.data?.reduce((sum, r) => sum + (parseFloat(r.importo) || 0), 0) || 0

    return {
      data: {
        totalBrands,
        totalCreators,
        totalCollabs,
        activeCollabs,
        monthlyRevenue
      },
      error: null
    }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// Top 5 Creator per revenue
export const getTopCreators = async () => {
  try {
    const { data, error } = await supabase
      .from('revenue_mensile')
      .select('creator_id, importo')

    if (error) throw error

    // Aggrega per creator
    const creatorRevenue = {}
    data.forEach(r => {
      if (!creatorRevenue[r.creator_id]) {
        creatorRevenue[r.creator_id] = 0
      }
      creatorRevenue[r.creator_id] += parseFloat(r.importo) || 0
    })

    // Ordina e prendi top 5
    const sorted = Object.entries(creatorRevenue)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    // Prendi nomi creator
    const creatorIds = sorted.map(([id]) => id)
    const { data: creators } = await supabase
      .from('creators')
      .select('id, nome')
      .in('id', creatorIds)

    const topCreators = sorted.map(([id, revenue]) => ({
      id,
      nome: creators?.find(c => c.id === id)?.nome || 'Unknown',
      revenue
    }))

    return { data: topCreators, error: null }
  } catch (error) {
    console.error('Error:', error)
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

    // Aggrega per mese
    const monthlyData = {}
    data.forEach(r => {
      if (!monthlyData[r.mese]) {
        monthlyData[r.mese] = 0
      }
      monthlyData[r.mese] += parseFloat(r.importo) || 0
    })

    // Prendi ultimi 6 mesi
    const months = Object.keys(monthlyData).sort().slice(-6)
    const chartData = months.map(mese => ({
      mese,
      revenue: monthlyData[mese]
    }))

    return { data: chartData, error: null }
  } catch (error) {
    console.error('Error:', error)
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
