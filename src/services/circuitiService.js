import { supabase } from '../lib/supabase'
import { fetchAllRows } from './supabasePagination'

import { normalizeExtraContacts } from '../utils/circuitContacts'

const cleanValue = (value) => value === '' || value === undefined ? null : value

const toCamelCase = (circuito) => {
  if (!circuito) return null
  return {
    id: circuito.id,
    nome: circuito.nome,
    note: circuito.note,
    referente: circuito.referente,
    contatto: circuito.contatto,
    telefono: circuito.telefono,
    contattiAggiuntivi: normalizeExtraContacts(circuito.contatti_aggiuntivi),
    createdAt: circuito.created_at,
    updatedAt: circuito.updated_at,
  }
}

const toSnakeCase = (circuito) => ({
  nome: circuito.nome?.trim(),
  note: cleanValue(circuito.note),
  referente: cleanValue(circuito.referente),
  contatto: cleanValue(circuito.contatto),
  telefono: cleanValue(circuito.telefono),
  contatti_aggiuntivi: normalizeExtraContacts(circuito.contattiAggiuntivi),
})

export const getAllCircuiti = async () => {
  try {
    const data = await fetchAllRows(() => supabase
      .from('circuiti_eventi')
      .select('*')
      .order('nome', { ascending: true }))

    return { data: (data || []).map(toCamelCase), error: null }
  } catch (error) {
    console.error('Error fetching circuiti:', error)
    return { data: null, error }
  }
}

export const createCircuito = async (circuitoData) => {
  try {
    const { data, error } = await supabase
      .from('circuiti_eventi')
      .insert([toSnakeCase(circuitoData)])
      .select()
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error creating circuito:', error)
    return { data: null, error }
  }
}

export const updateCircuito = async (id, circuitoData) => {
  try {
    const { data, error } = await supabase
      .from('circuiti_eventi')
      .update(toSnakeCase(circuitoData))
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error updating circuito:', error)
    return { data: null, error }
  }
}

export const deleteCircuito = async (id) => {
  try {
    const { error } = await supabase
      .from('circuiti_eventi')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error deleting circuito:', error)
    return { error }
  }
}
