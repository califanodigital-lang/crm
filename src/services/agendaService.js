import { supabase } from '../lib/supabase'

const toDateKey = (value) => {
  if (!value) return null

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const overlaps = (startA, endA, startB, endB) => {
  const a1 = new Date(startA).getTime()
  const a2 = new Date(endA || startA).getTime()
  const b1 = new Date(startB).getTime()
  const b2 = new Date(endB || startB).getTime()
  return a1 <= b2 && b1 <= a2
}

const sameDay = (a, b) => toDateKey(a) === toDateKey(b)

const pushSingle = (items, date, base) => {
  const key = toDateKey(date)
  if (!key) return
  items.push({ ...base, date: key, id: `${base.tipo}-${base.refId}-${key}` })
}

const pushRange = (items, startDate, endDate, base) => {
  const start = toDateKey(startDate)
  const end = toDateKey(endDate || startDate)
  if (!start) return

  let cursor = new Date(start)
  const last = new Date(end)

  while (cursor <= last) {
    const key = cursor.toISOString().split('T')[0]
    items.push({ ...base, date: key, id: `${base.tipo}-${base.refId}-${key}` })
    cursor.setDate(cursor.getDate() + 1)
  }
}

export const getAgendaItems = async () => {
  const [
    creatorsRes,
    brandsRes,
    trattativeRes,
    collabRes,
    eventiRes,
    partecipazioniRes,
    versamentiRes,
    impegniRes
  ] = await Promise.all([
    supabase.from('creators').select('*'),
    supabase.from('brands').select('*'),
    supabase.from('proposte_brand').select('*'),
    supabase.from('collaborations').select('*'),
    supabase.from('eventi').select('*'),
    supabase
      .from('partecipazioni_eventi')
      .select(`
        *,
        creators (nome),
        eventi:evento_id (nome)
      `),
    supabase.from('versamenti').select('*'),
    supabase
      .from('creator_impegni')
      .select(`
        *,
        creators (nome)
      `)
  ])

  if (creatorsRes.error) throw creatorsRes.error
  if (brandsRes.error) throw brandsRes.error
  if (trattativeRes.error) throw trattativeRes.error
  if (collabRes.error) throw collabRes.error
  if (eventiRes.error) throw eventiRes.error
  if (partecipazioniRes.error) throw partecipazioniRes.error
  if (versamentiRes.error) throw versamentiRes.error
  if (impegniRes.error) throw impegniRes.error

  const items = []

  ;(creatorsRes.data || []).forEach(c => {
    pushSingle(items, c.ricontattare, {
      tipo: 'CREATOR_RICONTATTO',
      titolo: `Ricontattare creator · ${c.nome}`,
      creatorId: c.id,
      creatorNome: c.nome,
      refId: c.id
    })

    pushSingle(items, c.inizio_collaborazione, {
      tipo: 'CREATOR_INIZIO_COLLAB',
      titolo: `Inizio collaborazione · ${c.nome}`,
      creatorId: c.id,
      creatorNome: c.nome,
      refId: `${c.id}-inizio`
    })

    pushSingle(items, c.scadenza_contratto, {
      tipo: 'CREATOR_SCADENZA_CONTRATTO',
      titolo: `Scadenza contratto · ${c.nome}`,
      creatorId: c.id,
      creatorNome: c.nome,
      refId: `${c.id}-scadenza`
    })

    pushSingle(items, c.ultimo_aggiornamento_mediakit, {
      tipo: 'CREATOR_MEDIAKIT',
      titolo: `Aggiornamento mediakit · ${c.nome}`,
      creatorId: c.id,
      creatorNome: c.nome,
      refId: `${c.id}-mediakit`
    })

    pushSingle(items, c.data_firma_contratto, {
      tipo: 'CREATOR_FIRMA_CONTRATTO',
      titolo: `Firma contratto creator · ${c.nome}`,
      creatorId: c.id,
      creatorNome: c.nome,
      refId: `${c.id}-firma`
    })
  })

  ;(brandsRes.data || []).forEach(b => {
    pushSingle(items, b.data_contatto, {
      tipo: 'BRAND_CONTATTO',
      titolo: `Contatto brand · ${b.nome}`,
      brandId: b.id,
      brandNome: b.nome,
      refId: b.id
    })

    pushSingle(items, b.data_followup_1, {
      tipo: 'BRAND_FOLLOWUP1',
      titolo: `1° Follow-up brand · ${b.nome}`,
      brandId: b.id,
      brandNome: b.nome,
      refId: `${b.id}-f1`
    })

    pushSingle(items, b.data_followup_2, {
      tipo: 'BRAND_FOLLOWUP2',
      titolo: `2° Follow-up brand · ${b.nome}`,
      brandId: b.id,
      brandNome: b.nome,
      refId: `${b.id}-f2`
    })

    pushSingle(items, b.data_ultimo_contatto, {
      tipo: 'BRAND_ULTIMO_CONTATTO',
      titolo: `Ultimo contatto brand · ${b.nome}`,
      brandId: b.id,
      brandNome: b.nome,
      refId: `${b.id}-ultimo`
    })

    pushSingle(items, b.data_ultima_collaborazione, {
      tipo: 'BRAND_ULTIMA_COLLAB',
      titolo: `Ultima collaborazione · ${b.nome}`,
      brandId: b.id,
      brandNome: b.nome,
      refId: `${b.id}-collab`
    })
  })

  ;(trattativeRes.data || []).forEach(t => {
    pushSingle(items, t.data_contatto, {
      tipo: 'TRATTATIVA_CONTATTO',
      titolo: `Contatto trattativa · ${t.brand_nome}`,
      trattativaId: t.id,
      brandNome: t.brand_nome,
      refId: t.id
    })

    pushSingle(items, t.data_followup_1, {
      tipo: 'FOLLOWUP1',
      titolo: `1° Follow-up · ${t.brand_nome}`,
      trattativaId: t.id,
      brandNome: t.brand_nome,
      refId: `${t.id}-f1`
    })

    pushSingle(items, t.data_followup_2, {
      tipo: 'FOLLOWUP2',
      titolo: `2° Follow-up · ${t.brand_nome}`,
      trattativaId: t.id,
      brandNome: t.brand_nome,
      refId: `${t.id}-f2`
    })

    pushSingle(items, t.data_ricontatto, {
      tipo: 'RICONTATTO',
      titolo: `Ricontatto futuro · ${t.brand_nome}`,
      trattativaId: t.id,
      brandNome: t.brand_nome,
      refId: `${t.id}-ricontatto`
    })

    pushSingle(items, t.reminder_ricontatto, {
      tipo: 'REMINDER_RICONTATTO',
      titolo: `Reminder ricontatto · ${t.brand_nome}`,
      trattativaId: t.id,
      brandNome: t.brand_nome,
      refId: `${t.id}-reminder`
    })

    pushSingle(items, t.data_call, {
      tipo: 'CALL',
      titolo: `Call · ${t.brand_nome}`,
      trattativaId: t.id,
      brandNome: t.brand_nome,
      refId: `${t.id}-call`
    })

    pushSingle(items, t.data_preventivo, {
      tipo: 'PREVENTIVO',
      titolo: `Preventivo · ${t.brand_nome}`,
      trattativaId: t.id,
      brandNome: t.brand_nome,
      refId: `${t.id}-preventivo`
    })

    pushSingle(items, t.data_contratto_inviato, {
      tipo: 'CONTRATTO_INVIATO',
      titolo: `Contratto inviato · ${t.brand_nome}`,
      trattativaId: t.id,
      brandNome: t.brand_nome,
      refId: `${t.id}-contratto`
    })
  })

  ;(collabRes.data || []).forEach(c => {
    pushSingle(items, c.data_firma, {
      tipo: 'COLLAB_FIRMA',
      titolo: `Firma collaborazione · ${c.brand_nome}`,
      collaborationId: c.id,
      brandNome: c.brand_nome,
      creatorId: c.creator_id,
      refId: c.id
    })

    pushSingle(items, c.data_pubblicazione, {
      tipo: 'PUBBLICAZIONE',
      titolo: `Pubblicazione · ${c.brand_nome}`,
      collaborationId: c.id,
      brandNome: c.brand_nome,
      creatorId: c.creator_id,
      refId: `${c.id}-pubb`
    })

    pushSingle(items, c.data_pagamento, {
      tipo: 'PAGAMENTO',
      titolo: `Pagamento ricevuto · ${c.brand_nome}`,
      collaborationId: c.id,
      brandNome: c.brand_nome,
      creatorId: c.creator_id,
      refId: `${c.id}-pag`
    })

    pushSingle(items, c.data_prevista_pagamento_creator, {
      tipo: 'PAGAMENTO_CREATOR',
      titolo: `Pagamento creator · ${c.brand_nome}`,
      collaborationId: c.id,
      brandNome: c.brand_nome,
      creatorId: c.creator_id,
      refId: `${c.id}-pc`
    })

    pushSingle(items, c.data_pagamento_creator, {
      tipo: 'PAGAMENTO_CREATOR_RICEVUTO',
      titolo: `Pagamento creator ricevuto · ${c.brand_nome}`,
      collaborationId: c.id,
      brandNome: c.brand_nome,
      creatorId: c.creator_id,
      refId: `${c.id}-pcr`
    })

    pushSingle(items, c.data_prevista_pagamento_agency, {
      tipo: 'PAGAMENTO_AGENCY',
      titolo: `Pagamento agency · ${c.brand_nome}`,
      collaborationId: c.id,
      brandNome: c.brand_nome,
      creatorId: c.creator_id,
      refId: `${c.id}-pa`
    })

    pushSingle(items, c.data_pagamento_agency, {
      tipo: 'PAGAMENTO_AGENCY_RICEVUTO',
      titolo: `Pagamento agency ricevuto · ${c.brand_nome}`,
      collaborationId: c.id,
      brandNome: c.brand_nome,
      creatorId: c.creator_id,
      refId: `${c.id}-par`
    })
  })

  ;(eventiRes.data || []).forEach(e => {
    pushRange(items, e.data_inizio, e.data_fine || e.data_inizio, {
      tipo: 'EVENTO',
      titolo: e.nome,
      eventoId: e.id,
      dataInizio: e.data_inizio,
      dataFine: e.data_fine || e.data_inizio,
      citta: e.citta,
      location: e.location,
      descrizione: e.descrizione,
      link: e.link,
      note: e.note,
      refId: e.id
    })
  })

  ;(partecipazioniRes.data || []).forEach(p => {
    pushRange(
      items,
      p.data_inizio_partecipazione,
      p.data_fine_partecipazione || p.data_inizio_partecipazione,
      {
        tipo: 'PRESENZA_EVENTO',
        titolo: `${p.creators?.nome || 'Creator'} · ${p.eventi?.nome || 'Evento'}`,
        eventoId: p.evento_id,
        creatorId: p.creator_id,
        creatorNome: p.creators?.nome,
        presenzaInizio: p.data_inizio_partecipazione,
        presenzaFine: p.data_fine_partecipazione || p.data_inizio_partecipazione,
        refId: p.id
      }
    )
  })

  ;(versamentiRes.data || []).forEach(v => {
    pushSingle(items, v.mese, {
      tipo: 'VERSAMENTO_MESE',
      titolo: `Versamento mese`,
      creatorId: v.creator_id,
      refId: v.id
    })

    pushSingle(items, v.data_fattura, {
      tipo: 'FATTURA',
      titolo: `Fattura versamento`,
      creatorId: v.creator_id,
      refId: `${v.id}-fattura`
    })
  })

  ;(impegniRes.data || []).forEach(i => {
    console.log(i)
    pushRange(items, i.data_inizio, i.data_fine || i.data_inizio, {
      tipo: 'IMPEGNO_CREATOR',
      titolo: `${i.creators?.nome || 'Creator'} · ${i.titolo}`,
      creatorId: i.creator_id,
      creatorNome: i.creators?.nome,
      note: i.note,
      refId: i.id
    })
  })

  return items.sort((a, b) => a.date.localeCompare(b.date) || a.tipo.localeCompare(b.tipo))
}

export const getCreatorAvailabilityForEventDay = async (eventoId, dayKey) => {
  const [creatorsRes, partecipazioniRes, collabRes, impegniRes] = await Promise.all([
    supabase.from('creators').select('id, nome, stato'),
    supabase
      .from('partecipazioni_eventi')
      .select(`
        creator_id,
        evento_id,
        data_inizio_partecipazione,
        data_fine_partecipazione,
        creators (nome),
        eventi:evento_id (id, nome, data_inizio, data_fine)
      `),
    supabase
      .from('collaborations')
      .select('creator_id, brand_nome, data_pubblicazione'),
    supabase
      .from('creator_impegni')
      .select('creator_id, titolo, data_inizio, data_fine')
  ])

  if (creatorsRes.error) throw creatorsRes.error
  if (partecipazioniRes.error) throw partecipazioniRes.error
  if (collabRes.error) throw collabRes.error
  if (impegniRes.error) throw impegniRes.error

  const activeCreators = (creatorsRes.data || []).filter(c => c.stato === '1 Sotto contratto')

  const assegnatiEvento = (partecipazioniRes.data || [])
    .filter(p => p.evento_id === eventoId)
    .filter(p =>
      overlaps(
        dayKey,
        dayKey,
        p.data_inizio_partecipazione || p.eventi?.data_inizio,
        p.data_fine_partecipazione || p.eventi?.data_fine || p.eventi?.data_inizio
      )
    )
    .map(p => ({
      id: p.creator_id,
      nome: p.creators?.nome,
      dal: p.data_inizio_partecipazione || p.eventi?.data_inizio,
      al: p.data_fine_partecipazione || p.eventi?.data_fine || p.eventi?.data_inizio
    }))

  const assegnatiIds = new Set(assegnatiEvento.map(x => x.id))
  const busyMap = {}

  ;(partecipazioniRes.data || []).forEach(p => {
    if (p.evento_id === eventoId) return
    const start = p.data_inizio_partecipazione || p.eventi?.data_inizio
    const end = p.data_fine_partecipazione || p.eventi?.data_fine || p.eventi?.data_inizio
    if (overlaps(dayKey, dayKey, start, end)) {
      if (!busyMap[p.creator_id]) busyMap[p.creator_id] = []
      busyMap[p.creator_id].push(`${p.eventi?.nome} (${start}${end && end !== start ? ` → ${end}` : ''})`)
    }
  })

  ;(collabRes.data || []).forEach(c => {
    if (c.data_pubblicazione && sameDay(c.data_pubblicazione, dayKey)) {
      if (!busyMap[c.creator_id]) busyMap[c.creator_id] = []
      busyMap[c.creator_id].push(`Pubblicazione: ${c.brand_nome}`)
    }
  })

  ;(impegniRes.data || []).forEach(i => {
    if (overlaps(dayKey, dayKey, i.data_inizio, i.data_fine || i.data_inizio)) {
      if (!busyMap[i.creator_id]) busyMap[i.creator_id] = []
      busyMap[i.creator_id].push(`Impegno: ${i.titolo}`)
    }
  })

  const occupati = activeCreators
    .filter(c => !assegnatiIds.has(c.id) && busyMap[c.id])
    .map(c => ({
      ...c,
      impegni: busyMap[c.id]
    }))

  const liberiCount = activeCreators.filter(c => !assegnatiIds.has(c.id) && !busyMap[c.id]).length

  return {
    assegnatiEvento,
    occupati,
    liberiCount
  }
}

export const groupAgendaItemsByDate = (items = []) =>
  items.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = []
    acc[item.date].push(item)
    return acc
  }, {})

export const buildMonthMatrix = (currentMonthDate) => {
  const year = currentMonthDate.getFullYear()
  const month = currentMonthDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const start = new Date(firstDay)
  const day = start.getDay()
  const offset = day === 0 ? 6 : day - 1
  start.setDate(start.getDate() - offset)

  const matrix = []
  const cursor = new Date(start)

  for (let week = 0; week < 6; week++) {
    const row = []
    for (let i = 0; i < 7; i++) {
      row.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    matrix.push(row)
  }

  return matrix
}

export const itemTypeLabel = (tipo) => {
  const map = {
    CREATOR_RICONTATTO: 'Ricontatto creator',
    CREATOR_INIZIO_COLLAB: 'Inizio collab creator',
    CREATOR_SCADENZA_CONTRATTO: 'Scadenza contratto',
    CREATOR_MEDIAKIT: 'Mediakit',
    CREATOR_FIRMA_CONTRATTO: 'Firma contratto creator',
    BRAND_CONTATTO: 'Contatto brand',
    BRAND_FOLLOWUP1: '1° Follow-up brand',
    BRAND_FOLLOWUP2: '2° Follow-up brand',
    BRAND_ULTIMO_CONTATTO: 'Ultimo contatto brand',
    BRAND_ULTIMA_COLLAB: 'Ultima collab brand',
    TRATTATIVA_CONTATTO: 'Contatto trattativa',
    FOLLOWUP1: '1° Follow-up',
    FOLLOWUP2: '2° Follow-up',
    RICONTATTO: 'Ricontatto',
    REMINDER_RICONTATTO: 'Reminder ricontatto',
    CALL: 'Call',
    PREVENTIVO: 'Preventivo',
    CONTRATTO_INVIATO: 'Contratto inviato',
    COLLAB_FIRMA: 'Firma collaborazione',
    PUBBLICAZIONE: 'Pubblicazione',
    PAGAMENTO: 'Pagamento ricevuto',
    PAGAMENTO_CREATOR: 'Pag. creator',
    PAGAMENTO_CREATOR_RICEVUTO: 'Pag. creator ricevuto',
    PAGAMENTO_AGENCY: 'Pag. agency',
    PAGAMENTO_AGENCY_RICEVUTO: 'Pag. agency ricevuto',
    EVENTO: 'Evento',
    PRESENZA_EVENTO: 'Presenza evento',
    VERSAMENTO_MESE: 'Versamento mese',
    FATTURA: 'Fattura',
    IMPEGNO_CREATOR: 'Impegno creator'
  }
  return map[tipo] || tipo
}

export const itemTypeColor = (tipo) => {
  const map = {
    CREATOR_RICONTATTO: 'bg-violet-100 text-violet-700',
    CREATOR_INIZIO_COLLAB: 'bg-sky-100 text-sky-700',
    CREATOR_SCADENZA_CONTRATTO: 'bg-red-100 text-red-700',
    CREATOR_MEDIAKIT: 'bg-teal-100 text-teal-700',
    CREATOR_FIRMA_CONTRATTO: 'bg-indigo-100 text-indigo-700',
    BRAND_CONTATTO: 'bg-gray-100 text-gray-700',
    BRAND_FOLLOWUP1: 'bg-blue-100 text-blue-700',
    BRAND_FOLLOWUP2: 'bg-indigo-100 text-indigo-700',
    BRAND_ULTIMO_CONTATTO: 'bg-slate-100 text-slate-700',
    BRAND_ULTIMA_COLLAB: 'bg-emerald-100 text-emerald-700',
    TRATTATIVA_CONTATTO: 'bg-gray-100 text-gray-700',
    FOLLOWUP1: 'bg-blue-100 text-blue-700',
    FOLLOWUP2: 'bg-indigo-100 text-indigo-700',
    RICONTATTO: 'bg-purple-100 text-purple-700',
    REMINDER_RICONTATTO: 'bg-fuchsia-100 text-fuchsia-700',
    CALL: 'bg-cyan-100 text-cyan-700',
    PREVENTIVO: 'bg-amber-100 text-amber-700',
    CONTRATTO_INVIATO: 'bg-orange-100 text-orange-700',
    COLLAB_FIRMA: 'bg-lime-100 text-lime-700',
    PUBBLICAZIONE: 'bg-pink-100 text-pink-700',
    PAGAMENTO: 'bg-green-100 text-green-700',
    PAGAMENTO_CREATOR: 'bg-yellow-100 text-yellow-700',
    PAGAMENTO_CREATOR_RICEVUTO: 'bg-yellow-200 text-yellow-800',
    PAGAMENTO_AGENCY: 'bg-orange-100 text-orange-700',
    PAGAMENTO_AGENCY_RICEVUTO: 'bg-orange-200 text-orange-800',
    EVENTO: 'bg-green-100 text-green-700',
    PRESENZA_EVENTO: 'bg-emerald-100 text-emerald-700',
    VERSAMENTO_MESE: 'bg-slate-100 text-slate-700',
    FATTURA: 'bg-stone-100 text-stone-700',
    IMPEGNO_CREATOR: 'bg-rose-100 text-rose-700'
  }
  return map[tipo] || 'bg-gray-100 text-gray-700'
}

export const isToday = (date) => sameDay(date, new Date())