// Regole per trasformare una trattativa vinta in collaborazioni.
//
// La fee di ogni creator deve essere scritta esplicitamente nella trattativa.
// Prima di questa regola, quando mancava, ogni collaborazione prendeva
// l'intero importo del preventivo: tre creator su un preventivo da 10.000
// diventavano 30.000 a sistema.

export const PERCENTUALE_FEE_PREDEFINITA = 25

/** Il valore inserito per quel creator, oppure null se non c'e' o non e' un numero. */
export const feeDelCreator = (mappaFee, creatorId) => {
  const grezzo = (mappaFee || {})[creatorId]
  if (grezzo === null || grezzo === undefined) return null

  const testo = String(grezzo).trim()
  if (testo === '') return null

  const numero = Number(testo.replace(',', '.'))
  if (!Number.isFinite(numero) || numero < 0) return null

  return numero
}

/** Gli id dei creator confermati per cui manca la fee. */
export const creatorSenzaFee = (creatorIds, mappaFee) => (
  (creatorIds || []).filter(id => feeDelCreator(mappaFee, id) === null)
)

/** Percentuale trattenuta dall'agenzia per quel creator, con lo stesso criterio del form collaborazione. */
export const percentualeAgenzia = (creator) => {
  const valore = Number(creator?.fee)
  return Number.isFinite(valore) && valore > 0 ? valore : PERCENTUALE_FEE_PREDEFINITA
}

export const feeAgenzia = (pagamento, creator) => {
  const importo = Number(pagamento)
  if (!Number.isFinite(importo) || importo <= 0) return null
  return +(importo * percentualeAgenzia(creator) / 100).toFixed(2)
}

/** Messaggio per chi converte, con i nomi invece degli id quando li conosciamo. */
export const messaggioFeeMancanti = (idMancanti, creatorsPerId = {}) => {
  const nomi = (idMancanti || []).map(id => creatorsPerId[id]?.nome || id)
  const elenco = nomi.join(', ')
  return nomi.length === 1
    ? `Manca la fee di ${elenco}. Aprire la trattativa, compilare "Fee per creator" e riprovare.`
    : `Mancano le fee di ${elenco}. Aprire la trattativa, compilare "Fee per creator" e riprovare.`
}

/**
 * Righe di collaborazione da inserire, una per creator confermato.
 * Non inventa importi: se una fee manca la conversione si ferma prima di arrivare qui.
 */
export const righeCollaborazione = ({ trattativa, creatorIds, creatorsPerId = {} }) => {
  const mappaFee = trattativa.fee_creator_map || {}

  return (creatorIds || []).map((creatorId) => {
    const pagamento = feeDelCreator(mappaFee, creatorId)
    const creator = creatorsPerId[creatorId]

    return {
      brand_id: trattativa.brand_id || null,
      trattativa_id: trattativa.id,
      brand_nome: trattativa.brand_nome,
      creator_id: creatorId,
      sales: trattativa.sales || null,
      agente: trattativa.ima || null,
      senior: trattativa.agente || null,
      pagamento,
      fee_management: feeAgenzia(pagamento, creator),
      link_contratto: trattativa.link_preventivo || null,
      stato: 'IN_LAVORAZIONE',
      pagato: false,
      contatto: trattativa.contatto || null,
      note: trattativa.note_trattativa || trattativa.note_strategiche || null,
    }
  })
}
