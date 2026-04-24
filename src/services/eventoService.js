import { supabase } from '../lib/supabase'

const cleanValue = (value) => value === '' || value === undefined ? null : value

const toCamelCase = (e) => {
  if (!e) return null
  return {
    id: e.id,
    nome: e.nome,
    tipo: e.tipo,
    fieraDbId: e.fiera_db_id,
    trattativaFieraId: e.trattativa_fiera_id,
    circuitoId: e.circuito_id,
    dataInizio: e.data_inizio,
    dataFine: e.data_fine,
    location: e.location,
    citta: e.citta,
    descrizione: e.descrizione,
    link: e.link,
    note: e.note,
    stato: e.stato || 'APERTA',
    createdAt: e.created_at,
    updatedAt: e.updated_at,
  }
}

const toSnakeCase = (e) => ({
  nome: e.nome,
  tipo: cleanValue(e.tipo),
  fiera_db_id: cleanValue(e.fieraDbId),
  trattativa_fiera_id: cleanValue(e.trattativaFieraId),
  circuito_id: cleanValue(e.circuitoId),
  data_inizio: cleanValue(e.dataInizio),
  data_fine: cleanValue(e.dataFine),
  location: cleanValue(e.location),
  citta: cleanValue(e.citta),
  descrizione: cleanValue(e.descrizione),
  link: cleanValue(e.link),
  note: cleanValue(e.note),
  stato: e.stato || 'APERTA',
})

// GET: Tutti gli eventi
export const getAllEventi = async () => {
  try {
    const { data, error } = await supabase
      .from('eventi')
      .select('*')
      .order('data_inizio', { ascending: false })

    if (error) throw error
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// GET: Evento singolo con partecipazioni
export const getEventoById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('eventi')
      .select(`
        *,
        partecipazioni_eventi (
          *,
          creators (nome)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// POST: Crea evento
export const createEvento = async (eventoData) => {
  try {
    const { data, error } = await supabase
      .from('eventi')
      .insert([toSnakeCase(eventoData)])
      .select()
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// PUT: Aggiorna evento
export const updateEvento = async (id, eventoData) => {
  try {
    const { data, error } = await supabase
      .from('eventi')
      .update(toSnakeCase(eventoData))
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

// DELETE: Elimina evento
export const deleteEvento = async (id) => {
  try {
    const { error } = await supabase
      .from('eventi')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error:', error)
    return { error }
  }
}

export const getPartecipazioniByCreator = async (creatorId) => {
  try {
    const { data, error } = await supabase
      .from('partecipazioni_eventi')
      .select(`
        *,
        eventi:evento_id (
          nome,
          data_inizio,
          data_fine,
          location,
          citta
        )
      `)
      .eq('creator_id', creatorId)
      .order('eventi(data_inizio)', { ascending: false })

    if (error) throw error

    // Mappa con info evento embedded
    const mapped = data.map(p => ({
      id: p.id,
      eventoId: p.evento_id,
      eventoNome: p.eventi?.nome,
      eventoDataInizio: p.eventi?.data_inizio,
      eventoDataFine: p.eventi?.data_fine,
      eventoLocation: p.eventi?.location,
      eventoCitta: p.eventi?.citta,
      creatorId: p.creator_id,
      rimborsoSpese: p.rimborso_spese,
      panel: p.panel,
      workshop: p.workshop,
      masterGdr: p.master_gdr,
      giochiTavolo: p.giochi_tavolo,
      giudiceCosplay: p.giudice_cosplay,
      firmacopie: p.firmacopie,
      palco: p.palco,
      moderazione: p.moderazione,
      accredito: p.accredito,
      meetGreet: p.meet_greet,
      hostPalco: p.host_palco,
      hostGaraCosplay: p.host_gara_cosplay,
      fee: p.fee,
      note: p.note,
      pagato: p.pagato,
      pagato_agency: p.pagato_agency,
      tipo: p.tipo || 'partecipante',
    }))

    return { data: mapped, error: null }
  } catch (error) {
    console.error('Error getting partecipazioni by creator:', error)
    return { data: null, error }
  }
}
