import { supabase } from '../lib/supabase'

const cleanValue = (value) => value === '' || value === undefined ? null : value

const toCamelCase = (row) => ({
  id: row.id,
  creatorId: row.creator_id,
  titolo: row.titolo,
  tipo: row.tipo,
  dataInizio: row.data_inizio,
  dataFine: row.data_fine,
  note: row.note,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const toSnakeCase = (row) => ({
  creator_id: row.creatorId,
  titolo: row.titolo,
  tipo: cleanValue(row.tipo) || 'ALTRO',
  data_inizio: row.dataInizio,
  data_fine: cleanValue(row.dataFine),
  note: cleanValue(row.note),
})

export const getImpegniByCreator = async (creatorId) => {
  try {
    const { data, error } = await supabase
      .from('creator_impegni')
      .select('*')
      .eq('creator_id', creatorId)
      .order('data_inizio', { ascending: true })

    if (error) throw error
    return { data: (data || []).map(toCamelCase), error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const createImpegno = async (payload) => {
  try {
    const { data, error } = await supabase
      .from('creator_impegni')
      .insert([toSnakeCase(payload)])
      .select()
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const deleteImpegno = async (id) => {
  try {
    const { error } = await supabase
      .from('creator_impegni')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}