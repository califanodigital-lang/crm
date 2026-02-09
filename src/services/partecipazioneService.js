import { supabase } from '../lib/supabase'

const cleanValue = (value) => value === '' || value === undefined ? null : value

const toCamelCase = (p) => {
  if (!p) return null
  return {
    id: p.id,
    eventoId: p.evento_id,
    creatorId: p.creator_id,
    creatorNome: p.creator_nome,
    tipoContratto: p.tipo_contratto,
    panel: p.panel,
    workshop: p.workshop,
    masterGdr: p.master_gdr,
    giochiTavolo: p.giochi_tavolo,
    giudiceCosplay: p.giudice_cosplay,
    firmacopie: p.firmacopie,
    palco: p.palco,
    moderazione: p.moderazione,
    accredito: p.accredito,
    fee: p.fee,
    note: p.note,
  }
}

const toSnakeCase = (p) => ({
  evento_id: p.eventoId,
  creator_id: p.creatorId,
  tipo_contratto: cleanValue(p.tipoContratto),
  panel: p.panel || false,
  workshop: p.workshop || false,
  master_gdr: p.masterGdr || false,
  giochi_tavolo: p.giochiTavolo || false,
  giudice_cosplay: p.giudiceCosplay || false,
  firmacopie: p.firmacopie || false,
  palco: p.palco || false,
  moderazione: p.moderazione || false,
  accredito: p.accredito || false,
  fee: cleanValue(p.fee),
  note: cleanValue(p.note),
})

// GET: Partecipazioni per evento
export const getPartecipazioniByEvento = async (eventoId) => {
  try {
    const { data, error } = await supabase
      .from('partecipazioni_eventi')
      .select(`*, creators (nome)`)
      .eq('evento_id', eventoId)

    if (error) throw error
    return { 
      data: data.map(p => ({...toCamelCase(p), creatorNome: p.creators?.nome})), 
      error: null 
    }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// GET: Eventi per creator
export const getEventiByCreator = async (creatorId) => {
  try {
    const { data, error } = await supabase
      .from('partecipazioni_eventi')
      .select(`
        *,
        eventi (*)
      `)
      .eq('creator_id', creatorId)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// POST: Aggiungi partecipazione
export const addPartecipazione = async (partecipazioneData) => {
  try {
    const { data, error } = await supabase
      .from('partecipazioni_eventi')
      .insert([toSnakeCase(partecipazioneData)])
      .select()
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// PUT: Aggiorna partecipazione
export const updatePartecipazione = async (id, partecipazioneData) => {
  try {
    const { data, error } = await supabase
      .from('partecipazioni_eventi')
      .update(toSnakeCase(partecipazioneData))
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// DELETE: Rimuovi partecipazione
export const deletePartecipazione = async (id) => {
  try {
    const { error } = await supabase
      .from('partecipazioni_eventi')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error:', error)
    return { error }
  }
}
