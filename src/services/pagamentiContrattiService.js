import { supabase } from '../lib/supabase'
import { fetchAllRows } from './supabasePagination'
import { romeToday } from '../utils/civilDate'

const toCamelCase = (p) => ({
  id: p.id,
  contrattoId: p.contratto_id,
  mese: p.mese,
  pagato: p.pagato,
  dataPagamento: p.data_pagamento,
  note: p.note,
  importo: p.importo,
})

export const getAllPagamentiContratti = async () => {
  try {
    const data = await fetchAllRows(() => supabase
      .from('pagamenti_contratti')
      .select('*'))
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const upsertPagamentoContratto = async (contrattoId, mese, pagato, date = romeToday(), amount = undefined) => {
  try {
    const { data, error } = await supabase
      .from('pagamenti_contratti')
      .upsert(
        {
          contratto_id: contrattoId,
          mese,
          pagato,
          ...(amount === undefined ? {} : { importo: amount }),
          data_pagamento: pagato ? date : null,
        },
        { onConflict: 'contratto_id,mese' }
      )
      .select()
      .single()
    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    return { data: null, error }
  }
}
