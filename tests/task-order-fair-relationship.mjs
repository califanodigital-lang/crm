import assert from 'node:assert/strict'
import { sortTasksByDeadline } from '../src/utils/taskOrder.js'
import { getFairRelationship as relationship } from '../src/utils/fairRelationship.js'

const tasks = [
  { id: 'tomorrow', due_date: '2026-10-09', urgent: true, created_at: '2026-10-08T11:00:00Z' },
  { id: 'today', due_date: '2026-10-08', urgent: true, created_at: '2026-10-08T10:00:00Z' },
  { id: 'no-date', due_date: null, urgent: true, created_at: '2026-10-08T12:00:00Z' },
  { id: 'overdue', due_date: '2026-10-07', urgent: false },
  { id: 'done', due_date: '2026-10-01', completed: true },
  { id: 'today-normal', due_date: '2026-10-08', urgent: false },
]
const original = structuredClone(tasks)
assert.deepEqual(sortTasksByDeadline(tasks).map(row => row.id), ['today', 'tomorrow', 'no-date', 'overdue', 'today-normal', 'done'])
assert.deepEqual(tasks, original)
assert.deepEqual(sortTasksByDeadline([
  { id: 'old', due_date: '2026-10-08', urgent: true, created_at: '2026-10-01' },
  { id: 'new', due_date: '2026-10-08', urgent: true, created_at: '2026-10-08' },
]).map(row => row.id), ['new', 'old'])
assert.deepEqual(sortTasksByDeadline([]), [])
assert.deepEqual(sortTasksByDeadline([{ id: 'a' }, { id: 'b', due_date: '2027-01-01' }]).map(row => row.id), ['b', 'a'])

// Regression: an undated urgent task stays above any non-urgent task.
assert.deepEqual(sortTasksByDeadline([
  { id: 'normal-overdue', urgent: false, due_date: '2026-01-01' },
  { id: 'urgent-undated', urgent: true },
  { id: 'completed-urgent', urgent: true, completed: true, due_date: '2026-01-01' },
  { id: 'urgent-today', urgent: true, due_date: '2026-10-09' },
]).map(row => row.id), ['urgent-today', 'urgent-undated', 'normal-overdue', 'completed-urgent'])

const fair = { id: 'fair-1', nome: 'Fiera di prova' }
const contact = { id: 'negotiation-1', fieraDbId: fair.id, stato: 'CONTATTATO' }
const closedEvent = { id: 'event-1', fieraDbId: fair.id, stato: 'CHIUSA' }
assert.equal(relationship(fair, [], []), 'uncontacted')
assert.equal(relationship(fair, [contact], []), 'contacted')
assert.equal(relationship(fair, [{ ...contact, stato: 'CHIUSO_PERSO' }], []), 'contacted')
assert.equal(relationship(fair, [{ ...contact, stato: 'NESSUNA_RISPOSTA' }], []), 'contacted')
assert.equal(relationship(fair, [], [closedEvent]), 'collaborated')
assert.equal(relationship(fair, [], [{ ...closedEvent, stato: 'APERTA' }]), 'contacted')
assert.equal(relationship(fair, [contact], [closedEvent]), 'collaborated')
assert.equal(relationship(fair, [contact], [{ id: 'event-2', trattativaFieraId: contact.id, stato: 'CHIUSA' }]), 'collaborated')
assert.equal(relationship(fair, [{ ...contact, eventoId: 'event-3' }], [{ id: 'event-3', stato: 'CHIUSA' }]), 'collaborated')
assert.equal(relationship({ ...fair, eventoOrigineId: 'event-4' }, [], [{ id: 'event-4', stato: 'CHIUSA' }]), 'collaborated')
assert.equal(relationship(fair, [{ ...contact, fieraDbId: 'different' }], [{ ...closedEvent, fieraDbId: 'different', nome: fair.nome }]), 'uncontacted')
assert.equal(relationship(fair, null, []), 'unavailable')
assert.equal(relationship(fair, [], null), 'unavailable')
assert.equal(relationship(fair, [], [{ stato: 'CHIUSA' }]), 'uncontacted')
assert.equal(relationship({ ...fair, collaborazioneConclusaManuale: true }, [], []), 'collaborated')
assert.equal(relationship({ ...fair, collaborazioneConclusaManuale: true }, null, null), 'collaborated')
assert.equal(relationship({ ...fair, collaborazioneConclusaManuale: false }, [], []), 'uncontacted')
assert.equal(relationship({ ...fair, collaborazioneConclusaManuale: false }, [contact], []), 'contacted')
assert.equal(relationship({ ...fair, collaborazioneConclusaManuale: false }, [], [closedEvent]), 'collaborated')
console.log('25 verifiche superate: ordine task, urgenza, assenza scadenza, storico fiere, collegamenti e dati non disponibili.')
