import { supabase } from '../lib/supabase'
import { fetchAllRows } from './supabasePagination'
import { romeToday } from '../utils/civilDate'

const toCamelCase = (u) => ({
  id: u.id,
  mese: u.mese,
  categoria: u.categoria,
  descrizione: u.descrizione,
  importo: u.importo,
  fornitore: u.fornitore,
  note: u.note,
  pagata: u.pagata,
  dataPagamento: u.data_pagamento,
  createdAt: u.created_at,
})

const toSnakeCase = (u) => ({
  mese: u.mese,
  categoria: u.categoria,
  descrizione: u.descrizione || null,
  importo: parseFloat(u.importo) || 0,
  fornitore: u.fornitore || null,
  note: u.note || null,
  pagata: u.pagata || false,
  data_pagamento: u.pagata ? (u.dataPagamento || romeToday()) : null,
})

export const getUsciteByMese = async (mese) => {
  try {
    const data = await fetchAllRows(() => supabase
      .from('uscite_varie')
      .select('*')
      .eq('mese', mese)
      .order('created_at', { ascending: false }))
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const createUscita = async (uscita) => {
  try {
    const { data, error } = await supabase
      .from('uscite_varie')
      .insert([toSnakeCase(uscita)])
      .select()
      .single()
    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const updateUscita = async (id, uscita) => {
  try {
    const { data, error } = await supabase
      .from('uscite_varie')
      .update(toSnakeCase(uscita))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const deleteUscita = async (id) => {
  try {
    const { error } = await supabase.from('uscite_varie').delete().eq('id', id)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export const togglePagataUscita = async (id, current) => {
  try {
    const { data, error } = await supabase
      .from('uscite_varie')
      .update({
        pagata: !current,
        data_pagamento: !current ? romeToday() : null,
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    return { data: null, error }
  }
}
export const getAllUscite = async () => {
  try { return { data: (await fetchAllRows(() => supabase.from('uscite_varie').select('*').order('created_at', { ascending: false }))).map(toCamelCase), error: null } }
  catch (error) { return { data: null, error } }
}

