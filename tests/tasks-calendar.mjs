import assert from 'node:assert/strict'
import { taskAssigneeIds, additionalTaskAssignees } from '../src/utils/taskAssignees.js'
import { taskCalendarEvent } from '../supabase/functions/task-calendar/event.js'
import { syncTaskCalendarJob as sync } from '../supabase/functions/task-calendar/sync.js'
assert.deepEqual(taskAssigneeIds({ assignee_id: 'a', additional_assignee_ids: ['b', 'a', 'b'] }), ['a', 'b'])
assert.deepEqual(taskAssigneeIds({ assignee_id: 'a' }), ['a'])
assert.deepEqual(additionalTaskAssignees('a', ['a', 'b', 'b']), ['b'])
const job = { task_id: 'task-1', event_id: 'c3abc123', calendar_id: 'company@example.test', payload: {
  title: 'Prova', description: '<script>bad</script>', dueDate: '2026-10-25', urgent: true,
  attendees: [{ email: 'A@example.test', displayName: 'A' }, { email: 'b@example.test', displayName: 'B' }, { email: 'a@example.test', displayName: 'A' }],
} }
const body = taskCalendarEvent(job, 'https://crm.example.test', [{ email: 'a@example.test', responseStatus: 'accepted' }])
assert.equal(body.end.date, '2026-10-26')
assert.equal(body.attendees.length, 2)
assert.equal(body.attendees[0].responseStatus, 'accepted')
assert.equal(body.attendees[1].responseStatus, 'needsAction')
assert.match(body.description, /&lt;script&gt;/)
assert.equal(taskCalendarEvent({ ...job, payload: { ...job.payload, dueDate: '2026-12-31' } }, 'https://crm.example.test').end.date, '2027-01-01')
assert.throws(() => taskCalendarEvent({ ...job, payload: { ...job.payload, dueDate: '2026-02-30' } }, 'https://crm.example.test'))
assert.throws(() => taskCalendarEvent({ ...job, payload: { ...job.payload, attendees: [{ email: '' }] } }, 'https://crm.example.test'))
const events = new Map()
const requests = []
let conflict = false
let googleFailure = false
const fakeFetch = async (url, options) => {
  const parsed = new URL(url)
  const method = options.method
  requests.push({ url: parsed, method })
  assert.equal(parsed.hostname, 'www.googleapis.com')
  if (googleFailure) return new Response('{}', { status: 503 })
  const id = parsed.pathname.split('/').at(-1)
  if (method === 'GET') {
    if (conflict && !events.has(id)) return new Response('{}', { status: 404 })
    return events.has(id) ? Response.json(events.get(id)) : new Response('{}', { status: 404 })
  }
  assert.equal(parsed.searchParams.get('sendUpdates'), 'all')
  const event = options.body ? JSON.parse(options.body) : null
  if (method === 'POST') {
    if (conflict) { conflict = false; events.set(event.id, { ...event, htmlLink: 'https://calendar.google.com/event' }); return new Response('{}', { status: 409 }) }
    assert.equal(events.has(event.id), false)
    events.set(event.id, { ...event, htmlLink: 'https://calendar.google.com/event' })
    return Response.json(events.get(event.id))
  }
  if (method === 'PATCH') { events.set(id, { ...events.get(id), ...event }); return Response.json(events.get(id)) }
  if (method === 'DELETE') { events.delete(id); return new Response(null, { status: 204 }) }
  throw new Error('Unexpected HTTP call')
}
assert.equal((await sync(job, 'fake', 'https://crm.example.test', fakeFetch)).removed, false)
assert.equal(events.size, 1)
await sync(job, 'fake', 'https://crm.example.test', fakeFetch)
assert.equal(events.size, 1)
assert.equal(requests.filter(r => r.method === 'POST').length, 1)
await sync({ ...job, payload: { ...job.payload, dueDate: '2026-11-01', attendees: [{ email: 'b@example.test' }], completed: true } }, 'fake', 'https://crm.example.test', fakeFetch)
assert.equal(events.get(job.event_id).attendees.length, 1)
assert.equal(events.get(job.event_id).start.date, '2026-11-01')
assert.match(events.get(job.event_id).summary, /Completata/)
await sync({ ...job, payload: { deleted: true } }, 'fake', 'https://crm.example.test', fakeFetch)
assert.equal(events.size, 0)
assert.equal((await sync({ ...job, payload: { deleted: true } }, 'fake', 'https://crm.example.test', fakeFetch)).removed, true)
conflict = true
await sync(job, 'fake', 'https://crm.example.test', fakeFetch)
assert.equal(events.size, 1)
googleFailure = true
await assert.rejects(sync(job, 'fake', 'https://crm.example.test', fakeFetch), /503/)
googleFailure = false
events.set(job.event_id, { extendedProperties: { private: { c3TaskId: 'someone-else' } } })
await assert.rejects(sync(job, 'fake', 'https://crm.example.test', fakeFetch), /non riconosciuto/)
console.log('Calendar simulato: assegnatari, scadenze, inviti, RSVP, modifica, retry senza duplicati, cancellazione ed errori verificati. Nessuna email reale inviata.')
