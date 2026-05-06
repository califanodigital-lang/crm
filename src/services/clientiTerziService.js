import { supabase } from '../lib/supabase'

const toCamelCase = (c) => ({
  id: c.id,
  nome: c.nome,
  email: c.email,
  telefono: c.telefono,
  sitoWeb: c.sito_web,
  note: c.note,
  createdAt: c.created_at,
})

const toSnakeCase = (c) => ({
  nome: c.nome,
  email: c.email || null,
  telefono: c.telefono || null,
  sito_web: c.sitoWeb || null,
  note: c.note || null,
})

export const getAllClientiTerzi = async () => {
  try {
    const { data, error } = await supabase
      .from('clienti_terzi')
      .select('*')
      .order('nome')
    if (error) throw error
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
