// src/utils/daFare.js
// Regole della lista "Da fare". Sono funzioni pure, senza accesso al database:
// ricevono i record già caricati e restituiscono le azioni da compiere.
// Le soglie stanno tutte in SOGLIE_DA_FARE, così si cambiano in un solo punto.

export const SOGLIE_DA_FARE = {
  followUp1Giorni: 7,                  // come nel form trattativa: +7 giorni dal primo contatto
  followUp2Giorni: 5,                  // +5 giorni dal primo follow-up
  chiusuraDopoFollowUp2Giorni: 7,      // dopo il 2° follow-up senza risposta si propone la chiusura
  contattoFermoGiorni: 45,             // oltre questa soglia un follow-up non ha più senso
  trattativaAvanzataFermaGiorni: 21,   // In trattativa, Preventivo o Contratto inviato senza novità
  contrattoFirmatoSenzaCollabGiorni: 3,
  pagamentoFermoGiorni: 60,
  collabInLavorazioneFermaGiorni: 90,
  contrattoTalentAvvisoGiorni: 60,
  followUpFieraGiorni: 4,              // come in Trattative Fiere
  followUpFiera2Giorni: 7,
  fieraSenzaRispostaGiorni: 14,
}

export const CATEGORIE_DA_FARE = [
  { key: 'followup', label: 'Follow-up da fare', descrizione: 'Contatti e ricontatti arrivati alla data prevista.' },
  { key: 'ferme', label: 'Trattative e collaborazioni ferme', descrizione: 'Pratiche avanzate senza novità da troppo tempo.' },
  { key: 'chiudere', label: 'Da chiudere', descrizione: 'Nessuna risposta dopo i follow-up: si possono chiudere indicando il motivo.' },
  { key: 'pagamenti', label: 'Pagamenti fermi', descrizione: 'Collaborazioni in attesa di pagamento oltre la soglia.' },
  { key: 'contratti', label: 'Contratti talent', descrizione: 'Contratti scaduti o in scadenza.', soloAdmin: true },
  { key: 'fatture', label: 'Fee fiere da fatturare', descrizione: 'Eventi conclusi con fee non ancora fatturate.', soloAdmin: true },
]

export const MOTIVI_CHIUSURA = [
  'Nessuna risposta dopo i follow-up',
  'Non interessato',
  'Budget non disponibile',
  'Tempistiche non compatibili',
  'Target non in linea',
  'Altro',
]

const DAY_MS = 24 * 60 * 60 * 1000

export const toDateOnly = (value) => {
  if (!value) return null
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  }
  const text = String(value)
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) return null
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

export const addDays = (value, days) => {
  const date = toDateOnly(value)
  if (!date) return null
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// Giorni da "from" a "to" (positivo se "to" è dopo "from")
export const daysBetween = (from, to) => {
  const start = toDateOnly(from)
  const end = toDateOnly(to)
  if (!start || !end) return null
  return Math.round((end - start) / DAY_MS)
}

export const toIso = (date) => {
  if (!date) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const latestDate = (...values) => values
  .map(toDateOnly)
  .filter(Boolean)
  .sort((a, b) => b - a)[0] || null

const toNumber = (value) => {
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : null
}

// Un record appartiene all'agente se è tra gli assegnatari;
// se gli assegnatari mancano si guardano i ruoli economici.
export const isAssegnatoA = (record, agenteNome) => {
  if (!agenteNome) return true
  const assegnatari = Array.isArray(record?.assegnatari) ? record.assegnatari : []
  if (assegnatari.length > 0) return assegnatari.includes(agenteNome)
  return (record?.ruoli || []).includes(agenteNome)
}

// ── TRATTATIVE BRAND ───────────────────────────────────────────
export const regoleTrattativa = (t, oggi, soglie = SOGLIE_DA_FARE) => {
  if (!t) return []
  const base = {
    entita: 'trattativa',
    entitaId: t.id,
    riferimento: t.brandNome || 'Brand senza nome',
    assegnatari: t.assegnatario || [],
    ruoli: [t.sales, t.ima, t.senior].filter(Boolean),
    stato: t.stato,
  }
  const item = (extra) => ({ ...base, ...extra, id: `${extra.categoria}-${extra.tipo}-${t.id}` })

  switch (t.stato) {
    case 'PRIMO_CONTATTO': {
      const ultimo = toDateOnly(t.dataContatto) || toDateOnly(t.createdAt)
      const eta = daysBetween(ultimo, oggi)
      if (eta !== null && eta >= soglie.contattoFermoGiorni) {
        return [item({ categoria: 'chiudere', tipo: 'contatto_fermo', titolo: 'Nessuna risposta al primo contatto', giorni: eta, data: toIso(ultimo) })]
      }
      const scadenza = toDateOnly(t.dataFollowup1) || addDays(ultimo, soglie.followUp1Giorni)
      const ritardo = daysBetween(scadenza, oggi)
      if (ritardo !== null && ritardo >= 0) {
        return [item({ categoria: 'followup', tipo: 'followup1', titolo: '1° follow-up da fare', giorni: ritardo, data: toIso(scadenza) })]
      }
      return []
    }
    case 'FOLLOW_UP_1': {
      const ultimo = toDateOnly(t.dataFollowup1) || toDateOnly(t.dataContatto) || toDateOnly(t.updatedAt)
      const eta = daysBetween(ultimo, oggi)
      if (eta !== null && eta >= soglie.contattoFermoGiorni) {
        return [item({ categoria: 'chiudere', tipo: 'followup1_fermo', titolo: 'Nessuna risposta dopo il 1° follow-up', giorni: eta, data: toIso(ultimo) })]
      }
      const scadenza = toDateOnly(t.dataFollowup2) || addDays(ultimo, soglie.followUp2Giorni)
      const ritardo = daysBetween(scadenza, oggi)
      if (ritardo !== null && ritardo >= 0) {
        return [item({ categoria: 'followup', tipo: 'followup2', titolo: '2° follow-up da fare', giorni: ritardo, data: toIso(scadenza) })]
      }
      return []
    }
    case 'FOLLOW_UP_2': {
      const ultimo = toDateOnly(t.dataFollowup2) || toDateOnly(t.dataFollowup1) || toDateOnly(t.updatedAt)
      const eta = daysBetween(ultimo, oggi)
      if (eta !== null && eta >= soglie.chiusuraDopoFollowUp2Giorni) {
        return [item({ categoria: 'chiudere', tipo: 'dopo_followup2', titolo: 'Nessuna risposta dopo il 2° follow-up', giorni: eta, data: toIso(ultimo) })]
      }
      return []
    }
    case 'RICONTATTO_FUTURO': {
      const scadenza = toDateOnly(t.reminderRicontatto) || toDateOnly(t.dataRicontatto)
      const ritardo = daysBetween(scadenza, oggi)
      if (ritardo !== null && ritardo >= 0) {
        return [item({
          categoria: 'followup',
          tipo: 'ricontatto',
          titolo: t.reminderRicontatto ? 'Promemoria di ricontatto' : 'Ricontatto previsto',
          dettaglio: t.motivoRicontatto || null,
          giorni: ritardo,
          data: toIso(scadenza),
        })]
      }
      return []
    }
    case 'IN_TRATTATIVA':
    case 'PREVENTIVO_INVIATO':
    case 'CONTRATTO_INVIATO': {
      const ultimo = latestDate(t.dataCall, t.dataPreventivo, t.dataContatto, t.updatedAt, t.createdAt)
      const eta = daysBetween(ultimo, oggi)
      if (eta !== null && eta >= soglie.trattativaAvanzataFermaGiorni) {
        const titoli = {
          IN_TRATTATIVA: 'Trattativa senza aggiornamenti',
          PREVENTIVO_INVIATO: 'Preventivo senza risposta',
          CONTRATTO_INVIATO: 'Contratto non ancora firmato',
        }
        return [item({ categoria: 'ferme', tipo: 'trattativa_ferma', titolo: titoli[t.stato], giorni: eta, data: toIso(ultimo), valore: toNumber(t.importoPreventivo) })]
      }
      return []
    }
    case 'CONTRATTO_FIRMATO': {
      const ultimo = latestDate(t.dataPreventivo, t.updatedAt, t.createdAt)
      const eta = daysBetween(ultimo, oggi)
      if (eta !== null && eta >= soglie.contrattoFirmatoSenzaCollabGiorni) {
        return [item({ categoria: 'ferme', tipo: 'firmato_senza_collab', titolo: 'Contratto firmato: creare la collaborazione', giorni: eta, data: toIso(ultimo), valore: toNumber(t.importoPreventivo) })]
      }
      return []
    }
    default:
      return []
  }
}

// ── TRATTATIVE FIERE ───────────────────────────────────────────
export const regoleTrattativaFiera = (t, oggi, soglie = SOGLIE_DA_FARE) => {
  if (!t || t.stato !== 'CONTATTATO') return []
  const contatto = toDateOnly(t.dataContatto) || toDateOnly(t.createdAt)
  const followUp1 = toDateOnly(t.dataFollowup1) || addDays(contatto, soglie.followUpFieraGiorni)
  const followUp2 = toDateOnly(t.dataFollowup2) || addDays(followUp1, soglie.followUpFiera2Giorni)
  const base = {
    entita: 'trattativa_fiera',
    entitaId: t.id,
    riferimento: t.nome || 'Fiera senza nome',
    assegnatari: t.agente ? [t.agente] : [],
    ruoli: [],
    stato: t.stato,
  }
  const item = (extra) => ({ ...base, ...extra, id: `${extra.categoria}-${extra.tipo}-${t.id}` })

  const oltreFollowUp2 = daysBetween(followUp2, oggi)
  if (oltreFollowUp2 !== null && oltreFollowUp2 >= soglie.fieraSenzaRispostaGiorni) {
    return [item({ categoria: 'chiudere', tipo: 'fiera_senza_risposta', titolo: 'Fiera senza risposta dopo i follow-up', giorni: oltreFollowUp2, data: toIso(followUp2) })]
  }
  if (oltreFollowUp2 !== null && oltreFollowUp2 >= 0) {
    return [item({ categoria: 'followup', tipo: 'fiera_followup2', titolo: '2° follow-up fiera', giorni: oltreFollowUp2, data: toIso(followUp2) })]
  }
  const oltreFollowUp1 = daysBetween(followUp1, oggi)
  if (oltreFollowUp1 !== null && oltreFollowUp1 >= 0) {
    return [item({ categoria: 'followup', tipo: 'fiera_followup1', titolo: '1° follow-up fiera', giorni: oltreFollowUp1, data: toIso(followUp1) })]
  }
  return []
}

// ── COLLABORAZIONI ─────────────────────────────────────────────
export const regoleCollaborazione = (c, oggi, soglie = SOGLIE_DA_FARE) => {
  if (!c) return []
  const base = {
    entita: 'collaborazione',
    entitaId: c.id,
    riferimento: `${c.brandNome || 'Brand'} · ${c.creatorNome || 'Creator'}`,
    assegnatari: c.assegnatario || [],
    ruoli: [c.sales, c.agente, c.senior].filter(Boolean),
    stato: c.stato,
    valore: toNumber(c.pagamento),
  }
  const item = (extra) => ({ ...base, ...extra, id: `${extra.categoria}-${extra.tipo}-${c.id}` })

  if (c.stato === 'ATTESA_PAGAMENTO_CREATOR' || c.stato === 'ATTESA_PAGAMENTO_AGENCY') {
    const riferimento = toDateOnly(c.dataPubblicazione) || toDateOnly(c.dataFirma) || toDateOnly(c.createdAt)
    const eta = daysBetween(riferimento, oggi)
    if (eta !== null && eta >= soglie.pagamentoFermoGiorni) {
      const agency = c.stato === 'ATTESA_PAGAMENTO_AGENCY'
      return [item({
        categoria: 'pagamenti',
        tipo: agency ? 'attesa_agency' : 'attesa_creator',
        titolo: agency ? 'In attesa del pagamento agency' : 'In attesa del pagamento al creator',
        giorni: eta,
        data: toIso(riferimento),
      })]
    }
    return []
  }

  if (c.stato === 'IN_LAVORAZIONE') {
    const riferimento = toDateOnly(c.dataFirma) || toDateOnly(c.createdAt)
    const eta = daysBetween(riferimento, oggi)
    if (eta !== null && eta >= soglie.collabInLavorazioneFermaGiorni) {
      return [item({ categoria: 'ferme', tipo: 'collab_ferma', titolo: 'Collaborazione in lavorazione da molto tempo', giorni: eta, data: toIso(riferimento) })]
    }
  }
  return []
}

// ── CONTRATTI TALENT ───────────────────────────────────────────
export const regoleCreator = (creator, oggi, soglie = SOGLIE_DA_FARE) => {
  if (!creator?.scadenzaContratto) return []
  // Solo talent sotto contratto (o senza stato indicato)
  if (creator.stato && !String(creator.stato).startsWith('1')) return []
  const scadenza = toDateOnly(creator.scadenzaContratto)
  const mancano = daysBetween(oggi, scadenza)
  if (mancano === null) return []
  const base = {
    entita: 'creator',
    entitaId: creator.id,
    riferimento: creator.nome || 'Creator',
    assegnatari: [],
    ruoli: [creator.sales].filter(Boolean),
    stato: creator.stato,
    data: toIso(scadenza),
  }
  if (mancano < 0) {
    return [{ ...base, id: `contratti-scaduto-${creator.id}`, categoria: 'contratti', tipo: 'contratto_scaduto', titolo: 'Contratto scaduto', giorni: -mancano }]
  }
  if (mancano <= soglie.contrattoTalentAvvisoGiorni) {
    // urgenza negativa: i contratti già scaduti restano sopra, poi i più vicini alla scadenza
    return [{ ...base, id: `contratti-scadenza-${creator.id}`, categoria: 'contratti', tipo: 'contratto_in_scadenza', titolo: 'Contratto in scadenza', giorni: mancano, urgenza: -mancano }]
  }
  return []
}

// ── FEE FIERE DA FATTURARE ─────────────────────────────────────
// partecipazioni: righe con fee, fatturaEmessa ed evento { id, nome, dataInizio, dataFine, stato }
export const regoleFeeFiere = (partecipazioni, oggi) => {
  const perEvento = new Map()
  ;(partecipazioni || []).forEach(p => {
    const fee = toNumber(p.fee)
    if (!fee || fee <= 0 || p.fatturaEmessa) return
    const evento = p.evento || {}
    if (evento.stato === 'CHIUSA') return
    const fine = toDateOnly(evento.dataFine) || toDateOnly(evento.dataInizio)
    const giorni = daysBetween(fine, oggi)
    if (giorni === null || giorni < 1) return
    const key = evento.id || p.eventoId
    if (!perEvento.has(key)) {
      perEvento.set(key, {
        id: `fatture-evento-${key}`,
        categoria: 'fatture',
        tipo: 'fee_fiera',
        entita: 'evento',
        entitaId: key,
        riferimento: evento.nome || 'Evento',
        titolo: 'Fee da fatturare',
        assegnatari: [],
        ruoli: [],
        giorni,
        data: toIso(fine),
        valore: 0,
        conteggio: 0,
      })
    }
    const voce = perEvento.get(key)
    voce.valore += fee
    voce.conteggio += 1
  })
  return [...perEvento.values()].map(voce => ({
    ...voce,
    dettaglio: `${voce.conteggio} fee da fatturare`,
  }))
}

// ── COMPOSIZIONE ───────────────────────────────────────────────
export const costruisciDaFare = (dati, { oggi = new Date(), agenteNome = null, isAdmin = false, soglie = SOGLIE_DA_FARE } = {}) => {
  const giorno = toDateOnly(oggi)
  const tutte = [
    ...(dati.trattative || []).flatMap(t => regoleTrattativa(t, giorno, soglie)),
    ...(dati.trattativeFiere || []).flatMap(t => regoleTrattativaFiera(t, giorno, soglie)),
    ...(dati.collaborazioni || []).flatMap(c => regoleCollaborazione(c, giorno, soglie)),
    ...(isAdmin ? (dati.creators || []).flatMap(c => regoleCreator(c, giorno, soglie)) : []),
    ...(isAdmin ? regoleFeeFiere(dati.partecipazioni, giorno) : []),
  ]

  const visibili = agenteNome ? tutte.filter(item => isAssegnatoA(item, agenteNome)) : tutte

  const perCategoria = {}
  CATEGORIE_DA_FARE.forEach(cat => { perCategoria[cat.key] = [] })
  visibili.forEach(item => {
    if (!perCategoria[item.categoria]) perCategoria[item.categoria] = []
    perCategoria[item.categoria].push(item)
  })
  const peso = (item) => (item.urgenza ?? item.giorni ?? 0)
  Object.values(perCategoria).forEach(lista => lista.sort((a, b) => peso(b) - peso(a)))

  const conteggi = Object.fromEntries(Object.entries(perCategoria).map(([key, lista]) => [key, lista.length]))
  return { items: visibili, perCategoria, conteggi, totale: visibili.length }
}
