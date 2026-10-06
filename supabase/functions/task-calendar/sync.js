import { taskCalendarEvent } from './event.js'

export async function syncTaskCalendarJob(job, token, appUrl, fetchRequest = fetch) {
  if (!job.event_id || !job.calendar_id) {
    if (!job.payload.deleted && job.payload.dueDate) throw new Error('Riferimento evento mancante.')
    return { removed: true, url: null }
  }
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(job.calendar_id)}/events`
  const request = (path, method = 'GET', body) => fetchRequest(`${base}${path}`, {
    method, signal: AbortSignal.timeout(10000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const path = `/${encodeURIComponent(job.event_id)}`
  const found = await request(path)
  if (!found.ok && ![404, 410].includes(found.status)) throw new Error(`Lettura Google Calendar non riuscita (${found.status}).`)
  const existing = found.ok ? await found.json() : null
  if (existing && existing.status !== 'cancelled' && existing.extendedProperties?.private?.c3TaskId !== job.task_id) throw new Error('Evento non riconosciuto: verifica il collegamento Calendar.')
  if (job.payload.deleted || !job.payload.dueDate) {
    if (existing && existing.status !== 'cancelled') {
      const response = await request(`${path}?sendUpdates=all`, 'DELETE')
      if (!response.ok && ![404, 410].includes(response.status)) throw new Error(`Rimozione Google Calendar non riuscita (${response.status}).`)
    }
    return { removed: true, url: null }
  }
  if (found.status === 410 || existing?.status === 'cancelled') throw new Error('Evento cancellato direttamente in Google. Rimuovi la scadenza nel CRM, attendi la sincronizzazione e reinseriscila.')
  const body = taskCalendarEvent(job, appUrl, existing?.attendees || [])
  let response = existing
    ? await request(`${path}?sendUpdates=all`, 'PATCH', body)
    : await request('?sendUpdates=all', 'POST', { ...body, id: job.event_id })
  // A retry after Google accepted an insert must update the same event.
  if (response.status === 409) {
    const duplicate = await request(path)
    const duplicateEvent = duplicate.ok ? await duplicate.json() : null
    if (duplicateEvent?.extendedProperties?.private?.c3TaskId !== job.task_id || duplicateEvent?.status === 'cancelled') throw new Error('Conflitto sul riferimento evento Google Calendar.')
    response = await request(`${path}?sendUpdates=all`, 'PATCH', taskCalendarEvent(job, appUrl, duplicateEvent.attendees || []))
  }
  if (!response.ok) throw new Error(`Sincronizzazione Google Calendar non riuscita (${response.status}).`)
  const result = await response.json()
  const link = typeof result.htmlLink === 'string' && /^https:\/\/(calendar\.google\.com|www\.google\.com)\//.test(result.htmlLink) ? result.htmlLink : null
  return { removed: false, url: link }
}
