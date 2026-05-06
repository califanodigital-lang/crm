import { supabase } from '../lib/supabase'

const clean = (v) => (v === '' || v === undefined) ? null : v

const toCamelCase = (c) => ({
  id: c.id,
  nome: c.nome,
  tipoSoggetto: c.tipo_soggetto,
  soggettoNome: c.soggetto_nome,
  soggettoId: c.soggetto_id,
  importoMensile: c.importo_mensile,
  dataInizio: c.data_inizio,
  dataFine: c.data_fine,
  attivo: c.attivo,
  note: c.note,
  createdAt: c.created_at,
})

const toSnakeCase = (c) => ({
  nome: c.nome,
  tipo_soggetto: c.tipoSoggetto || 'TERZO',
  soggetto_nome: c.soggettoNome,
  soggetto_id: clean(c.soggettoId),
  importo_mensile: c.importoMensile ? parseFloat(c.importoMensile) : 0,
  data_inizio: c.dataInizio,
  data_fine: clean(c.dataFine),
  attivo: c.attivo !== false,
  note: clean(c.note),
})

export const getAllContrattiRicorrenti = async () => {
  try {
    const { data, error } = await supabase
      .from('contratti_ricorrenti')
      .select('*')
      .order('data_inizio', { ascending: false })
    if (error) throw error
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const createContrattoRicorrente = async (data) => {
  try {
    const { data: row, error } = await supabase
      .from('contratti_ricorrenti')
      .insert([toSnakeCase(data)])
      .select()
      .single()
    if (error) throw error
    return { data: toCamelCase(row), error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const updateContrattoRicorrente = async (id, data) => {
  try {
    const { data: row, error } = await supabase
      .from('contratti_ricorrenti')
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

export const deleteContrattoRicorrente = async (id) => {
  try {
    const { error } = await supabase.from('contratti_ricorrenti').delete().eq('id', id)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}
