import { supabase } from '../lib/supabase'
import { createEvento, getEventoById, updateEvento } from './eventoService'

const cleanValue = (value) => value === '' || value === undefined ? null : value
const CLOSED_STATUSES = ['NESSUNA_RISPOSTA', 'CHIUSO_PERSO']

const addDays = (dateString, days) => {
  if (!dateString) return null
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const ensureFollowups = (payload) => {
  const nextPayload = { ...payload }

  if (nextPayload.data_contatto && !nextPayload.data_followup_1) {
    nextPayload.data_followup_1 = addDays(nextPayload.data_contatto, 4)
  }

  if (nextPayload.data_followup_1 && !nextPayload.data_followup_2) {
    nextPayload.data_followup_2 = addDays(nextPayload.data_followup_1, 7)
  }

  return nextPayload
}

const toCamelCase = (trattativa) => {
  if (!trattativa) return null
  return {
    id: trattativa.id,
    fieraDbId: trattativa.fiera_db_id,
    eventoId: trattativa.evento_id,
    nome: trattativa.nome,
    tipo: trattativa.tipo,
    circuitoId: trattativa.circuito_id,
    location: trattativa.location,
    citta: trattativa.citta,
    dataInizio: trattativa.data_inizio,
    dataFine: trattativa.data_fine,
    referente: trattativa.referente,
    contatto: trattativa.contatto,
    telefono: trattativa.telefono,
    sitoWeb: trattativa.sito_web,
    agente: trattativa.agente,
    dataContatto: trattativa.data_contatto,
    stato: trattativa.stato || 'CONTATTATO',
    dataFollowup1: trattativa.data_followup_1,
    dataFollowup2: trattativa.data_followup_2,
    note: trattativa.note,
    createdAt: trattativa.created_at,
    updatedAt: trattativa.updated_at,
  }
}

const toSnakeCase = (trattativa) => ensureFollowups({
  fiera_db_id: cleanValue(trattativa.fieraDbId),
  evento_id: cleanValue(trattativa.eventoId),
  nome: trattativa.nome?.trim(),
  tipo: cleanValue(trattativa.tipo),
  circuito_id: cleanValue(trattativa.circuitoId),
  location: cleanValue(trattativa.location),
  citta: cleanValue(trattativa.citta),
  data_inizio: cleanValue(trattativa.dataInizio),
  data_fine: cleanValue(trattativa.dataFine),
  referente: cleanValue(trattativa.referente),
  contatto: cleanValue(trattativa.contatto),
  telefono: cleanValue(trattativa.telefono),
  sito_web: cleanValue(trattativa.sitoWeb),
  agente: cleanValue(trattativa.agente),
  data_contatto: cleanValue(trattativa.dataContatto),
  stato: trattativa.stato || 'CONTATTATO',
  data_followup_1: cleanValue(trattativa.dataFollowup1),
  data_followup_2: cleanValue(trattativa.dataFollowup2),
  note: cleanValue(trattativa.note),
})

const syncEventoFromTrattativa = async (trattativa) => {
  const baseEventoPayload = {
    nome: trattativa.nome,
    tipo: trattativa.tipo,
    circuitoId: trattativa.circuitoId,
    fieraDbId: trattativa.fieraDbId,
    trattativaFieraId: trattativa.id,
    dataInizio: trattativa.dataInizio,
    dataFine: trattativa.dataFine,
    location: trattativa.location,
    citta: trattativa.citta,
    stato: 'APERTA',
  }

  if (trattativa.eventoId) {
    const { data: currentEvento, error: currentError } = await getEventoById(trattativa.eventoId)
    if (currentError) return { data: null, error: currentError }

    const { data, error } = await updateEvento(trattativa.eventoId, {
      ...currentEvento,
      ...baseEventoPayload,
    })
    return { data, error }
  }

  const { data, error } = await createEvento(baseEventoPayload)
  return { data, error }
}

const maybeSyncEvento = async (trattativa) => {
  if (trattativa.stato !== 'IN_TRATTATIVA') return { data: null, error: null }

  const { data: evento, error } = await syncEventoFromTrattativa(trattativa)
  if (error || !evento?.id) return { data: null, error }

  if (trattativa.eventoId === evento.id) {
    return { data: evento, error: null }
  }

  const { data: updatedRow, error: updateError } = await supabase
    .from('trattative_fiere')
    .update({ evento_id: evento.id })
    .eq('id', trattativa.id)
    .select()
    .single()

  if (updateError) throw updateError
  return { data: toCamelCase(updatedRow), error: null }
}

export const getAllTrattativeFiere = async () => {
  try {
    const { data, error } = await supabase
      .from('trattative_fiere')
      .select('*')
      .order('data_inizio', { ascending: true, nullsFirst: false })

    if (error) throw error
    return { data: (data || []).map(toCamelCase), error: null }
  } catch (error) {
    console.error('Error fetching trattative fiere:', error)
    return { data: null, error }
  }
}

export const createTrattativaFiera = async (trattativaData) => {
  try {
    const payload = toSnakeCase(trattativaData)

    const { data, error } = await supabase
      .from('trattative_fiere')
      .insert([payload])
      .select()
      .single()

    if (error) throw error

    const created = toCamelCase(data)
    const { data: synced, error: syncError } = await maybeSyncEvento(created)
    if (syncError) throw syncError

    return { data: synced || created, error: null }
  } catch (error) {
    console.error('Error creating trattativa fiera:', error)
    return { data: null, error }
  }
}

export const createTrattativaFieraFromFiera = async (fieraData, agenteNome) => {
  try {
    const { data: rows, error: existingError } = await supabase
      .from('trattative_fiere')
      .select('*')
      .eq('fiera_db_id', fieraData.id)
      .order('created_at', { ascending: false })

    if (existingError) throw existingError
    const existing = (rows || []).find(row => !CLOSED_STATUSES.includes(row.stato))
    if (existing) return { data: toCamelCase(existing), error: null, reused: true }

    const today = new Date().toISOString().slice(0, 10)

    return createTrattativaFiera({
      fieraDbId: fieraData.id,
      nome: fieraData.nome,
      tipo: fieraData.tipo,
      circuitoId: fieraData.circuitoId,
      location: fieraData.location,
      citta: fieraData.citta,
      dataInizio: fieraData.dataInizio,
      dataFine: fieraData.dataFine,
      referente: fieraData.referente,
      contatto: fieraData.contatto,
      telefono: fieraData.telefono,
      sitoWeb: fieraData.sitoWeb,
      agente: agenteNome || '',
      dataContatto: today,
      stato: 'CONTATTATO',
      note: fieraData.note,
    }).then(result => ({ ...result, reused: false }))
  } catch (error) {
    console.error('Error creating trattativa from fiera:', error)
    return { data: null, error, reused: false }
  }
}

export const updateTrattativaFiera = async (id, trattativaData) => {
  try {
    const payload = toSnakeCase(trattativaData)

    const { data, error } = await supabase
      .from('trattative_fiere')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const updated = toCamelCase(data)
    const { data: synced, error: syncError } = await maybeSyncEvento(updated)
    if (syncError) throw syncError

    return { data: synced || updated, error: null }
  } catch (error) {
    console.error('Error updating trattativa fiera:', error)
    return { data: null, error }
  }
}

export const updateStatoTrattativaFiera = async (id, stato) => {
  try {
    const { data: current, error: currentError } = await supabase
      .from('trattative_fiere')
      .select('*')
      .eq('id', id)
      .single()

    if (currentError) throw currentError

    return updateTrattativaFiera(id, {
      ...toCamelCase(current),
      stato,
    })
  } catch (error) {
    console.error('Error updating stato trattativa fiera:', error)
    return { data: null, error }
  }
}

export const deleteTrattativaFiera = async (id) => {
  try {
    const { error } = await supabase
      .from('trattative_fiere')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error deleting trattativa fiera:', error)
    return { error }
  }
}
