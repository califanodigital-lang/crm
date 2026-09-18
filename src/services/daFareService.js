// src/services/daFareService.js
// Carica i dati che servono alla lista "Da fare" e gestisce la chiusura guidata.
import { supabase } from '../lib/supabase'
import { fetchAllRows } from './supabasePagination'
import { getAllTrattative } from './trattativaService'
import { getAllTrattativeFiere, updateTrattativaFiera } from './trattativaFieraService'
import { getAllCollaborations } from './collaborationService'
import { getAllCreators } from './creatorService'

const caricaPartecipazioniFiere = async () => {
  const rows = await fetchAllRows(() => supabase
    .from('partecipazioni_eventi')
    .select('id, evento_id, fee, fattura_emessa, tipo, eventi!inner (id, nome, data_inizio, data_fine, stato)')
    .eq('tipo', 'partecipante'))

  return rows.map(p => ({
    id: p.id,
    eventoId: p.evento_id,
    fee: p.fee,
    fatturaEmessa: p.fattura_emessa ?? false,
    evento: {
      id: p.eventi?.id,
      nome: p.eventi?.nome,
      dataInizio: p.eventi?.data_inizio,
      dataFine: p.eventi?.data_fine,
      stato: p.eventi?.stato,
    },
  }))
}

export const caricaDatiDaFare = async ({ isAdmin = false } = {}) => {
  const [trattativeRes, fiereRes, collabRes, creatorsRes, partecipazioni] = await Promise.all([
    getAllTrattative(),
    getAllTrattativeFiere(),
    getAllCollaborations(),
    isAdmin ? getAllCreators() : Promise.resolve({ data: [] }),
    isAdmin ? caricaPartecipazioniFiere().catch(() => []) : Promise.resolve([]),
  ])

  const errori = [trattativeRes, fiereRes, collabRes, creatorsRes]
    .map(res => res?.error)
    .filter(Boolean)

  return {
    data: {
      trattative: trattativeRes.data || [],
      trattativeFiere: fiereRes.data || [],
      collaborazioni: collabRes.data || [],
      creators: creatorsRes.data || [],
      partecipazioni: partecipazioni || [],
    },
    error: errori[0] || null,
  }
}

const nuovaNotaChiusura = ({ motivo, nota, operatore }) => {
  const timestamp = new Date().toISOString()
  const dettaglio = (nota || '').trim()
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : timestamp,
    operatore: operatore || 'Operatore',
    topic: 'Chiusura',
    contenuto: dettaglio ? `${motivo}. ${dettaglio}` : motivo,
    timestamp,
  }
}

const chiudiTrattativaBrand = async (id, nota) => {
  const { data: corrente, error: readError } = await supabase
    .from('proposte_brand')
    .select('id, stato, note_log')
    .eq('id', id)
    .single()
  if (readError) throw readError

  const noteLog = Array.isArray(corrente.note_log) ? corrente.note_log : []
  const { error } = await supabase
    .from('proposte_brand')
    .update({
      stato: 'NESSUNA_RISPOSTA',
      note_log: [...noteLog, nota],
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

const chiudiTrattativaFiera = async (record, nota) => {
  const { data: corrente, error: readError } = await supabase
    .from('trattative_fiere')
    .select('*')
    .eq('id', record.id)
    .single()
  if (readError) throw readError

  const { error } = await updateTrattativaFiera(record.id, {
    fieraDbId: corrente.fiera_db_id,
    eventoId: corrente.evento_id,
    nome: corrente.nome,
    tipo: corrente.tipo,
    circuitoId: corrente.circuito_id,
    location: corrente.location,
    citta: corrente.citta,
    dataInizio: corrente.data_inizio,
    dataFine: corrente.data_fine,
    referente: corrente.referente,
    contatto: corrente.contatto,
    telefono: corrente.telefono,
    sitoWeb: corrente.sito_web,
    agente: corrente.agente,
    dataContatto: corrente.data_contatto,
    stato: 'NESSUNA_RISPOSTA',
    dataFollowup1: corrente.data_followup_1,
    dataFollowup2: corrente.data_followup_2,
    note: corrente.note,
    noteLog: [...(Array.isArray(corrente.note_log) ? corrente.note_log : []), nota],
  })
  if (error) throw error
}

// items: voci della categoria "chiudere" selezionate nella pagina
export const chiudiSenzaRisposta = async (items, { motivo, nota, operatore }) => {
  const esito = { chiuse: 0, errori: [] }
  for (const item of items) {
    try {
      const notaChiusura = nuovaNotaChiusura({ motivo, nota, operatore })
      if (item.entita === 'trattativa') {
        await chiudiTrattativaBrand(item.entitaId, notaChiusura)
      } else if (item.entita === 'trattativa_fiera') {
        await chiudiTrattativaFiera({ id: item.entitaId }, notaChiusura)
      } else {
        continue
      }
      esito.chiuse += 1
    } catch (error) {
      esito.errori.push({ item, error })
    }
  }
  return esito
}
