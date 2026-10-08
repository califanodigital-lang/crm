// Classify the whole fair history, independently of the latest edition.
export const getFairRelationship = (fiera, trattative, eventi) => {
  if (fiera.collaborazioneConclusaManuale === true) return 'collaborated'
  if (!Array.isArray(trattative) || !Array.isArray(eventi)) return 'unavailable'
  const negotiations = trattative.filter(row => row.fieraDbId === fiera.id)
  const negotiationIds = new Set(negotiations.map(row => row.id).filter(Boolean))
  const eventIds = new Set(negotiations.map(row => row.eventoId).filter(Boolean))
  const linkedEvents = eventi.filter(evento => (
    (Boolean(evento.fieraDbId) && evento.fieraDbId === fiera.id)
    || (Boolean(fiera.eventoOrigineId) && evento.id === fiera.eventoOrigineId)
    || (Boolean(evento.trattativaFieraId) && negotiationIds.has(evento.trattativaFieraId))
    || (Boolean(evento.id) && eventIds.has(evento.id))
  ))
  if (linkedEvents.some(evento => evento.stato === 'CHIUSA')) return 'collaborated'
  if (negotiations.length || linkedEvents.length) return 'contacted'
  return 'uncontacted'
}
