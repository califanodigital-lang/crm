import { supabase } from '../lib/supabase'
import { fetchAllRows } from './supabasePagination'

const toCamelCase = (c) => ({
  id: c.id,
  nome: c.nome,
  cognome: c.cognome,
  email: c.email,
  telefono: c.telefono,
  sitoWeb: c.sito_web,
  codiceFiscale: c.codice_fiscale,
  piva: c.piva,
  residenza: c.residenza,
  domicilioFiscale: c.domicilio_fiscale,
  note: c.note,
  noteLog: c.note_log || [],
  createdAt: c.created_at,
})

const toSnakeCase = (c) => ({
  nome: c.nome,
  cognome: c.cognome || null,
  email: c.email || null,
  telefono: c.telefono || null,
  sito_web: c.sitoWeb || null,
  codice_fiscale: c.codiceFiscale || null,
  piva: c.piva || null,
  residenza: c.residenza || null,
  domicilio_fiscale: c.domicilioFiscale || null,
  note: c.note || null,
  note_log: c.noteLog || [],
})

export const getAllClientiTerzi = async () => {
  try {
    const data = await fetchAllRows(() => supabase
      .from('clienti_terzi')
      .select('*')
      .order('nome'))
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const createClienteTerzo = async (data) => {
  try {
    const { data: row, error } = await supabase
      .from('clienti_terzi')
      .insert([toSnakeCase(data)])
      .select()
      .single()
    if (error) throw error
    return { data: toCamelCase(row), error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const updateClienteTerzo = async (id, data) => {
  try {
    const { data: row, error } = await supabase
      .from('clienti_terzi')
      .update(toSnakeCase(data))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return { data: toCamelCase(row), error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const deleteClienteTerzo = async (id) => {
  try {
    const { error } = await supabase.from('clienti_terzi').delete().eq('id', id)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}
