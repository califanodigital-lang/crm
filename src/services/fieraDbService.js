import { supabase } from '../lib/supabase'

const cleanValue = (value) => value === '' || value === undefined ? null : value
const normalizeValue = (value) => (value || '').trim().toLowerCase()
const isSameOptionalValue = (left, right) => {
  const normalizedLeft = normalizeValue(left)
  const normalizedRight = normalizeValue(right)
  return !normalizedLeft || !normalizedRight || normalizedLeft === normalizedRight
}

const toCamelCase = (f) => {
  if (!f) return null
  return {
    id: f.id,
    nome: f.nome,
    tipo: f.tipo,
    circuitoId: f.circuito_id,
    location: f.location,
    citta: f.citta,
    dataInizio: f.data_inizio,
    dataFine: f.data_fine,
    referente: f.referente,
    contatto: f.contatto,
    telefono: f.telefono,
    sitoWeb: f.sito_web,
    ultimaData: f.ultima_data,
    prossimoContatto: f.prossimo_contatto,
    note: f.note,
    eventoOrigineId: f.evento_origine_id,
    createdAt: f.created_at,
    updatedAt: f.updated_at,
  }
}

const toSnakeCase = (f) => ({
  nome: f.nome,
  tipo: cleanValue(f.tipo),
  circuito_id: cleanValue(f.circuitoId),
  location: cleanValue(f.location),
  citta: cleanValue(f.citta),
  data_inizio: cleanValue(f.dataInizio),
  data_fine: cleanValue(f.dataFine),
  referente: cleanValue(f.referente),
  contatto: cleanValue(f.contatto),
  telefono: cleanValue(f.telefono),
  sito_web: cleanValue(f.sitoWeb),
  ultima_data: cleanValue(f.ultimaData),
  prossimo_contatto: cleanValue(f.prossimoContatto),
  note: cleanValue(f.note),
  evento_origine_id: cleanValue(f.eventoOrigineId),
})

const isSameFieraKey = (left, right) =>
  normalizeValue(left.nome) === normalizeValue(right.nome) &&
  isSameOptionalValue(left.tipo, right.tipo) &&
  isSameOptionalValue(left.location, right.location) &&
  isSameOptionalValue(left.citta, right.citta)

const getFieraCandidates = async () => {
  const { data, error } = await supabase
    .from('fiere_db')
    .select('id, nome, tipo, location, citta, evento_origine_id, created_at, updated_at')
    .order('updated_at', { ascending: false, nullsFirst: false })

  if (error) throw error
  return data || []
}

const getFieraById = async (id) => {
  const { data, error } = await supabase
    .from('fiere_db')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

const findExistingFiera = async ({ id, nome, tipo, location, citta, eventoOrigineId }) => {
  if (id) {
    const existingById = await getFieraById(id)
    if (existingById) return existingById
  }

  if (eventoOrigineId) {
    const { data: existingByEvento, error } = await supabase
      .from('fiere_db')
      .select('*')
      .eq('evento_origine_id', eventoOrigineId)
      .maybeSingle()

    if (error) throw error
    if (existingByEvento) return existingByEvento
  }

  const candidates = await getFieraCandidates()
  const matching = candidates.find(candidate =>
    isSameFieraKey(candidate, { nome, tipo, location, citta })
  )

  if (!matching) return null
  return getFieraById(matching.id)
}

const computeProssimoContatto = (ultimaData) => {
  if (!ultimaData) return null

  const d = new Date(ultimaData + 'T00:00:00')
  d.setMonth(d.getMonth() + 6)
  return d.toISOString().slice(0, 10)
}

export const getAllFiereDb = async () => {
  try {
    const { data, error } = await supabase
      .from('fiere_db')
      .select('*')
      .order('prossimo_contatto', { ascending: true, nullsFirst: false })

    if (error) throw error
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    console.error('Error fetching fiere_db:', error)
    return { data: null, error }
  }
}

export const createFieraDb = async (fieraData) => {
  try {
    const payload = toSnakeCase(fieraData)
    const existing = await findExistingFiera({
      nome: payload.nome,
      tipo: payload.tipo,
      location: payload.location,
      citta: payload.citta,
    })

    if (existing) {
      const mergedPayload = {
        nome: payload.nome || existing.nome,
        tipo: payload.tipo ?? existing.tipo,
        circuito_id: payload.circuito_id ?? existing.circuito_id,
        location: payload.location ?? existing.location,
        citta: payload.citta ?? existing.citta,
        data_inizio: payload.data_inizio ?? existing.data_inizio,
        data_fine: payload.data_fine ?? existing.data_fine,
        referente: payload.referente ?? existing.referente,
        contatto: payload.contatto ?? existing.contatto,
        telefono: payload.telefono ?? existing.telefono,
        sito_web: payload.sito_web ?? existing.sito_web,
        ultima_data: payload.ultima_data ?? existing.ultima_data,
        prossimo_contatto: payload.prossimo_contatto ?? existing.prossimo_contatto,
        note: payload.note ?? existing.note,
        evento_origine_id: payload.evento_origine_id ?? existing.evento_origine_id,
      }

      const { data, error } = await supabase
        .from('fiere_db')
        .update(mergedPayload)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return { data: toCamelCase(data), error: null, reused: true }
    }

    const { data, error } = await supabase
      .from('fiere_db')
      .insert([payload])
      .select()
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null, reused: false }
  } catch (error) {
    console.error('Error creating fiera_db:', error)
    return { data: null, error, reused: false }
  }
}

export const upsertFieraFromEvento = async (evento) => {
  try {
    const ultimaData = evento.dataFine || evento.dataInizio || null
    const prossimoContatto = computeProssimoContatto(ultimaData)

    const payload = {
      nome: evento.nome,
      tipo: evento.tipo || null,
      circuito_id: evento.circuitoId || null,
      location: evento.location || null,
      citta: evento.citta || null,
      data_inizio: evento.dataInizio || null,
      data_fine: evento.dataFine || null,
      ultima_data: ultimaData,
      prossimo_contatto: prossimoContatto,
      evento_origine_id: evento.id,
    }

    const existing = await findExistingFiera({
      id: evento.fieraDbId,
      nome: payload.nome,
      tipo: payload.tipo,
      location: payload.location,
      citta: payload.citta,
      eventoOrigineId: evento.id,
    })

    if (existing) {
      const { data, error } = await supabase
        .from('fiere_db')
        .update({ ...payload })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      if (evento.id) {
        const { error: linkError } = await supabase
          .from('eventi')
          .update({ fiera_db_id: existing.id })
          .eq('id', evento.id)

        if (linkError) throw linkError
      }
      return { data: toCamelCase(data), error: null }
    } else {
      const { data, error } = await supabase
        .from('fiere_db')
        .insert([payload])
        .select()
        .single()
      if (error) throw error
      if (evento.id) {
        const { error: linkError } = await supabase
          .from('eventi')
          .update({ fiera_db_id: data.id })
          .eq('id', evento.id)

        if (linkError) throw linkError
      }
      return { data: toCamelCase(data), error: null }
    }
  } catch (error) {
    console.error('Error upserting fiera_db:', error)
    return { data: null, error }
  }
}

export const updateFieraDb = async (id, fieraData) => {
  try {
    const { data, error } = await supabase
      .from('fiere_db')
      .update(toSnakeCase(fieraData))
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error updating fiera_db:', error)
    return { data: null, error }
  }
}

export const deleteFieraDb = async (id) => {
  try {
    const { error } = await supabase
      .from('fiere_db')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error deleting fiera_db:', error)
    return { error }
  }
}
