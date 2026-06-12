import { supabase } from '../lib/supabase'
import { TIPOLOGIE_EVENTO } from '../constants/constants'
import { fetchAllRows } from './supabasePagination'

const cleanValue = (value) => value === '' || value === undefined ? null : value
const TABLE_NAME = 'tipologie_eventi'

const fallbackTipologie = TIPOLOGIE_EVENTO.map(nome => ({
  id: `static-${nome.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  nome,
  note: '',
  readonly: true,
}))

const toCamelCase = (tipologia) => ({
  id: tipologia.id,
  nome: tipologia.nome,
  note: tipologia.note,
  readonly: false,
  createdAt: tipologia.created_at,
  updatedAt: tipologia.updated_at,
})

const toSnakeCase = (tipologia) => ({
  nome: tipologia.nome?.trim(),
  note: cleanValue(tipologia.note),
})

const isMissingTable = (error) => (
  String(error?.message || '').includes(TABLE_NAME)
  || String(error?.details || '').includes(TABLE_NAME)
)

const mergeWithFallback = (rows = []) => {
  const mappedRows = rows.map(toCamelCase)
  const existingNames = new Set(mappedRows.map(row => row.nome.toLowerCase()))
  const missingFallback = fallbackTipologie.filter(tipologia => !existingNames.has(tipologia.nome.toLowerCase()))

  return [...mappedRows, ...missingFallback].sort((left, right) => left.nome.localeCompare(right.nome))
}

export const getAllTipologieEvento = async () => {
  try {
    const data = await fetchAllRows(() => supabase
      .from(TABLE_NAME)
      .select('*')
      .order('nome', { ascending: true }))

    return { data: mergeWithFallback(data || []), error: null, missingTable: false }
  } catch (error) {
    if (isMissingTable(error)) {
      return { data: fallbackTipologie, error: null, missingTable: true }
    }

    console.error('Error fetching tipologie evento:', error)
    return { data: fallbackTipologie, error, missingTable: false }
  }
}

export const createTipologiaEvento = async (tipologiaData) => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([toSnakeCase(tipologiaData)])
      .select()
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error creating tipologia evento:', error)
    return { data: null, error }
  }
}

export const updateTipologiaEvento = async (id, tipologiaData) => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(toSnakeCase(tipologiaData))
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error updating tipologia evento:', error)
    return { data: null, error }
  }
}

export const deleteTipologiaEvento = async (id) => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error deleting tipologia evento:', error)
    return { error }
  }
}
