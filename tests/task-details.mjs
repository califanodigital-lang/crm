import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { additionalTaskAssignees } from '../src/utils/taskAssignees.js'

// Exercise service payloads locally; never connects to the remote CRM.
const source = (await readFile(new URL('../src/services/taskService.js', import.meta.url), 'utf8'))
  .replace("import { supabase } from '../lib/supabase'", 'const supabase = globalThis.__taskDetailsMock')
  .replace("import { fetchAllRows } from './supabasePagination'", 'const fetchAllRows = () => []')
  .replace("import { additionalTaskAssignees } from '../utils/taskAssignees'", `const additionalTaskAssignees = ${additionalTaskAssignees.toString()}`)
const calls = []
let fail = false
const query = {
  insert(payload) { calls.push({ action: 'insert', payload }); return this },
  update(payload) { calls.push({ action: 'update', payload }); return this },
  eq(field, value) { calls.at(-1).filter = { field, value }; return this },
  select() { return this },
  async single() { return fail ? { error: new Error('Save failed') } : { data: { id: 'task-1', ...calls.at(-1).payload }, error: null } },
}
globalThis.__taskDetailsMock = { from(table) { assert.equal(table, 'tasks'); return query }, async rpc() { throw new Error('Unavailable') } }
try {
  const { createTask, updateTask, getTaskCalendarStatuses } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
  await createTask({ title: ' Prova ', urgent: true, assigneeId: 'agent-1', description: ' Dettagli ', dueDate: '2026-10-07' })
  assert.deepEqual(calls.at(-1).payload, { title: 'Prova', urgent: true, assignee_id: 'agent-1', additional_assignee_ids: [], description: 'Dettagli', due_date: '2026-10-07' })
  await createTask({ title: 'Condivisa', urgent: false, assigneeId: 'agent-1', additionalAssigneeIds: ['agent-1', 'agent-2', 'agent-2'] })
  assert.deepEqual(calls.at(-1).payload.additional_assignee_ids, ['agent-2'])
  assert.deepEqual(await getTaskCalendarStatuses(['task-1']), { 'task-1': { status: 'unavailable' } })
  assert.deepEqual(await getTaskCalendarStatuses([]), {})
  await createTask({ title: 'Semplice', urgent: false, assigneeId: 'agent-1' })
  assert.equal(calls.at(-1).payload.description, null)
  assert.equal(calls.at(-1).payload.due_date, null)
  await updateTask('task-1', { title: 'Modificata', description: null, due_date: null, urgent: false, assignee_id: 'agent-2' })
  assert.deepEqual(calls.at(-1).filter, { field: 'id', value: 'task-1' })
  assert.equal(calls.at(-1).payload.description, null)
  assert.equal(calls.at(-1).payload.due_date, null)
  assert.equal(Object.hasOwn(calls.at(-1).payload, 'completed'), false)
  assert.equal(Object.hasOwn(calls.at(-1).payload, 'created_by'), false)
  await updateTask('task-1', { completed: true })
  assert.deepEqual(calls.at(-1).payload, { completed: true })
  fail = true
  await assert.rejects(createTask({ title: 'Errore', assigneeId: 'agent-1', urgent: false }), /Save failed/)
  await assert.rejects(updateTask('task-1', { description: 'Errore' }), /Save failed/)
  console.log('Tasks: dettagli, campi facoltativi, rimozione, aggiornamenti parziali ed errori di salvataggio verificati.')
} finally { delete globalThis.__taskDetailsMock }
