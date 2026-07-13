import { supabase } from '../lib/supabase'
import { fetchAllRows } from './supabasePagination'

const cleanValue = (value) => value === '' || value === undefined ? null : value

const toCamelCase = (p) => {
  if (!p) return null
  return {
    id: p.id,
    eventoId: p.evento_id,
    creatorId: p.creator_id,
    creatorNome: p.creator_nome,
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
    feesBreakdown: p.fees_breakdown || [],
    note: p.note,
    dataInizioPartecipazione: p.data_inizio_partecipazione,
    dataFinePartecipazione: p.data_fine_partecipazione,
    pagato: p.pagato,
    pagato_agency: p.pagato_agency,
    fatturaEmessa: p.fattura_emessa ?? false,
    numeroFattura: p.numero_fattura ?? null,
    dataFattura: p.data_fattura ?? null,
    tipo: p.tipo || 'partecipante',
  }
}

const toSnakeCase = (p) => ({
  evento_id: p.eventoId,
  creator_id: p.creatorId,
  rimborso_spese: cleanValue(p.rimborsoSpese),
  panel: p.panel || false,
  workshop: p.workshop || false,
  master_gdr: p.masterGdr || false,
  giochi_tavolo: p.giochiTavolo || false,
  giudice_cosplay: p.giudiceCosplay || false,
  firmacopie: p.firmacopie || false,
  palco: p.palco || false,
  moderazione: p.moderazione || false,
  accredito: p.accredito || false,
  meet_greet: p.meetGreet || false,
  host_palco: p.hostPalco || false,
  host_gara_cosplay: p.hostGaraCosplay || false,
  ...(() => {
    const hasBreakdown = p.feesBreakdown?.some(f => parseFloat(f.importo) > 0)
    return {
      fee: hasBreakdown
        ? p.feesBreakdown.reduce((s, f) => s + (parseFloat(f.importo) || 0), 0)
        : cleanValue(p.fee),
      fees_breakdown: hasBreakdown ? p.feesBreakdown : null,
    }
  })(),
  note: cleanValue(p.note),
  data_inizio_partecipazione: cleanValue(p.dataInizioPartecipazione),
  data_fine_partecipazione: cleanValue(p.dataFinePartecipazione),
  pagato: p.pagato || false,
  pagato_agency: p.pagato_agency || false,
  fattura_emessa: p.fatturaEmessa ?? false,
  numero_fattura: p.numeroFattura ?? null,
  data_fattura: p.dataFattura ?? null,
  tipo: p.tipo || 'partecipante',
})

// GET: Partecipazioni per evento
export const getPartecipazioniByEvento = async (eventoId) => {
  try {
    const data = await fetchAllRows(() => supabase
      .from('partecipazioni_eventi')
      .select(`*, creators (nome)`)
      .eq('evento_id', eventoId))

    return {
      data: data.map(p => ({
        ...toCamelCase(p),
        creatorNome: p.creators?.nome
      })),
      error: null
    }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

export const getPartecipazioniByEventi = async (eventoIds = []) => {
  try {
    if (!eventoIds.length) return { data: [], error: null }

    const data = await fetchAllRows(() => supabase
      .from('partecipazioni_eventi')
      .select(`*, creators (nome)`)
      .in('evento_id', eventoIds))

    return {
      data: data.map(p => ({
        ...toCamelCase(p),
        creatorNome: p.creators?.nome || p.creator_nome || 'N/A',
      })),
      error: null,
    }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error }
  }
}

// GET: Eventi per creator
export const getEventiByCreator = async (creatorId) => {
  try {
    const data = await fetchAllRows(() => supabase
      .from('partecipazioni_eventi')
      .select(`
        *,
        eventi (*)
      `)
      .eq('creator_id', creatorId))

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

// GET: Tutte le partecipazioni per le fiere attive (per sezione Finance Fee Fiere)
export const getAllPartecipazioniAgency = async () => {
  try {
    const data = await fetchAllRows(() => supabase
      .from('partecipazioni_eventi')
      .select(`
        *,
        creators (nome),
        eventi!inner (id, nome, data_inizio, citta, stato)
      `)
      .eq('tipo', 'partecipante')
      .neq('eventi.stato', 'CHIUSA')
      .order('created_at', { ascending: false }))
    return {
      data: data.map(p => ({
        ...toCamelCase(p),
        creatorNome: p.creators?.nome || 'N/A',
        eventoId: p.evento_id,
        eventoNome: p.eventi?.nome || '—',
        eventoDataInizio: p.eventi?.data_inizio,
        eventoCitta: p.eventi?.citta,
      })),
      error: null,
    }
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
