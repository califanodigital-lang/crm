import { supabase } from '../lib/supabase'
import { fetchAllRows } from './supabasePagination'

const toCamelCase = (f) => ({
  id: f.id,
  mese: f.mese,
  numeroFattura: f.numero_fattura,
  dataFattura: f.data_fattura,
  soggettoNome: f.soggetto_nome,
  importo: f.importo,
  tipo: f.tipo,
  collabId: f.collab_id,
  contrattoId: f.contratto_id,
  versamentoId: f.versamento_id,
  partecipazioneId: f.partecipazione_id,
  linkDocumento: f.link_documento,
  note: f.note,
  createdAt: f.created_at,
})

const toSnakeCase = (f) => ({
  mese: f.mese,
  numero_fattura: f.numeroFattura || null,
  data_fattura: f.dataFattura || null,
  soggetto_nome: f.soggettoNome,
  importo: parseFloat(f.importo) || 0,
  tipo: f.tipo || 'MANUALE',
  collab_id: f.collabId || null,
  contratto_id: f.contrattoId || null,
  versamento_id: f.versamentoId || null,
  partecipazione_id: f.partecipazioneId || null,
  link_documento: f.linkDocumento || null,
  note: f.note || null,
})

export const getFattureByMese = async (mese) => {
  try {
    const data = await fetchAllRows(() => supabase
      .from('fatture_emesse')
      .select('*')
      .eq('mese', mese)
      .order('created_at', { ascending: false }))
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const createFattura = async (fattura) => {
  try {
    const { data, error } = await supabase
      .from('fatture_emesse')
      .insert([toSnakeCase(fattura)])
      .select()
      .single()
    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const updateFattura = async (id, fattura) => {
  try {
    const { data, error } = await supabase
      .from('fatture_emesse')
      .update(toSnakeCase(fattura))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const deleteFattura = async (id) => {
  try {
    const { error } = await supabase.from('fatture_emesse').delete().eq('id', id)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}
