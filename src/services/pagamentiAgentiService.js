import { supabase } from '../lib/supabase'

const clean = (v) => (v === '' || v === undefined) ? null : v

const toCC = (p) => ({
  id: p.id,
  agenteNome: p.agente_nome,
  mese: p.mese,
  importoFisso: parseFloat(p.importo_fisso || 0),
  importoPagato: parseFloat(p.importo_pagato || 0),
  differenza: parseFloat(p.importo_fisso || 0) - parseFloat(p.importo_pagato || 0),
  pagato: p.pagato || false,
  note: p.note,
  createdAt: p.created_at,
})

// GET: pagamenti di un mese
export const getPagamentiByMese = async (mese) => {
  try {
    const { data, error } = await supabase
      .from('pagamenti_agenti')
      .select('*')
      .eq('mese', mese)
      .order('agente_nome')
    if (error) throw error
    return { data: data.map(toCC), error: null }
  } catch (e) { return { data: null, error: e } }
}

// GET: pagamenti di un agente
export const getPagamentiByAgente = async (agenteNome) => {
  try {
    const { data, error } = await supabase
      .from('pagamenti_agenti')
      .select('*')
      .eq('agente_nome', agenteNome)
      .order('mese', { ascending: false })
    if (error) throw error
    return { data: data.map(toCC), error: null }
  } catch (e) { return { data: null, error: e } }
}

// UPSERT: crea o aggiorna pagamento mese
export const upsertPagamentoAgente = async (payload) => {
  try {
    const { data, error } = await supabase
      .from('pagamenti_agenti')
      .upsert({
        agente_nome: payload.agenteNome,
        mese: payload.mese,
        importo_fisso: payload.importoFisso || 0,
        importo_pagato: payload.importoPagato || 0,
        pagato: (payload.importoTotale || 0) > 0 && payload.importoPagato >= payload.importoTotale,
        note: clean(payload.note),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'agente_nome,mese' })
      .select().single()
    if (error) throw error
    return { data: toCC(data), error: null }
  } catch (e) { return { data: null, error: e } }
}

// Genera automaticamente le righe del mese per tutti gli agenti
export const generaPagamentiMese = async (mese, agenti) => {
  const rows = agenti.map(a => ({
    agente_nome: a.agenteNome,
    mese,
    importo_fisso: a.fissoMensile || 0,
    importo_pagato: 0,
    pagato: false,
  }))
  if (rows.length === 0) return { data: [], error: null }
  try {
    const { data, error } = await supabase
      .from('pagamenti_agenti')
      .upsert(rows, { onConflict: 'agente_nome,mese', ignoreDuplicates: true })
      .select()
    if (error) throw error
    return { data: data.map(toCC), error: null }
  } catch (e) { return { data: null, error: e } }
}