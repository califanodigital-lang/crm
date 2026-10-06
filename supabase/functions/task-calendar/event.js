const nextDay = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) throw new Error('Scadenza non valida.')
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error('Scadenza non valida.')
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}
const escapeHtml = text => String(text || '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])

export function taskCalendarEvent(job, appUrl, existingAttendees = []) {
  const task = job.payload
  const emails = new Set()
  const attendees = (task.attendees || []).map(person => {
    const email = String(person.email || '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Un assegnatario non ha una email valida nel CRM.')
    if (emails.has(email)) return null
    emails.add(email)
    const existing = existingAttendees.find(attendee => attendee.email?.toLowerCase() === email)
    return { email, displayName: person.displayName || email, responseStatus: existing?.responseStatus || 'needsAction' }
  }).filter(Boolean)
  return {
    summary: `${task.completed ? '[Completata] ' : ''}${task.urgent ? '[Urgente] ' : ''}${task.title}`,
    description: `${escapeHtml(task.description)}<br><br>Task C3 Agency: <a href="${escapeHtml(new URL('/tasks', appUrl).href)}">Apri il CRM</a>`,
    start: { date: task.dueDate }, end: { date: nextDay(task.dueDate) },
    transparency: 'transparent',
    attendees, guestsCanModify: false, guestsCanInviteOthers: false,
    extendedProperties: { private: { c3TaskId: job.task_id } },
  }
}
