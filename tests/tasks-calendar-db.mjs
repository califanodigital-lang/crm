import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'
const { PGlite } = await import(pathToFileURL(process.argv[2]).href)
const db = new PGlite()
const operator = '00000000-0000-0000-0000-000000000001'
const other = '00000000-0000-0000-0000-000000000002'
const inactive = '00000000-0000-0000-0000-000000000003'
const migration = async file => db.exec(await readFile(new URL(`../supabase_migrations/${file}`, import.meta.url), 'utf8'))
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create function auth.uid() returns uuid language sql as $$ select '${operator}'::uuid $$;
    create table public.user_profiles(id uuid primary key, role text, attivo boolean, email text, nome_completo text, agente_nome text);
    insert into public.user_profiles values
      ('${operator}', 'AGENT', true, 'one@example.test', 'Uno', 'Uno'),
      ('${other}', 'AGENT', true, 'two@example.test', 'Due', 'Due'),
      ('${inactive}', 'AGENT', false, 'three@example.test', 'Tre', 'Tre');
    create function public.crm_has_access(boolean) returns boolean language sql as $$
      select coalesce((select attivo and role in ('ADMIN','AGENT') from public.user_profiles where id = auth.uid()), false)
    $$;
    grant usage on schema public, auth to authenticated, service_role;
    grant select on public.user_profiles to authenticated;
  `)
  await migration('20261001_tasks.sql')
  await db.exec('set role authenticated')
  const old = (await db.query(`insert into public.tasks(title, assignee_id) values('Storica', '${operator}') returning *`)).rows[0]
  await db.exec('reset role')
  for (let i = 0; i < 2; i++) {
    await migration('20261006_tasks_details.sql')
    await migration('20261006_tasks_assignees.sql')
    await migration('20261006_tasks_calendar.sql')
  }
  assert.equal((await db.query('select * from public.tasks where id = $1', [old.id])).rows[0].title, 'Storica')
  assert.equal((await db.query('select count(*) from public.task_calendar_jobs')).rows[0].count, 0)
  await db.exec('set role authenticated')
  const task = (await db.query(`insert into public.tasks(title, description, due_date, assignee_id, additional_assignee_ids) values('Prova', 'Dettagli', '2026-10-07', '${operator}', array['${other}'::uuid, '${other}'::uuid, '${operator}'::uuid]) returning *`)).rows[0]
  assert.deepEqual(task.additional_assignee_ids, [other])
  await assert.rejects(db.query(`update public.tasks set additional_assignee_ids = array['${inactive}'::uuid] where id = $1`, [task.id]))
  await assert.rejects(db.query(`update public.tasks set description = repeat('x', 5001) where id = $1`, [task.id]))
  await assert.rejects(db.query('select * from public.task_calendar_jobs'))
  assert.equal((await db.query('select status from public.crm_task_calendar_status(array[$1::uuid])', [task.id])).rows[0].status, 'disabled')
  await assert.rejects(db.query("select * from public.crm_claim_task_calendar('company')"))
  await db.exec('reset role; update public.task_calendar_config set enabled = true')
  await db.exec('set role authenticated')
  await db.query("update public.tasks set title = 'Aggiornata' where id = $1", [task.id])
  assert.equal((await db.query('select status from public.crm_task_calendar_status(array[$1::uuid])', [task.id])).rows[0].status, 'pending')
  await db.exec('reset role; set role service_role')
  const claim = () => db.query("select * from public.crm_claim_task_calendar('company')")
  const finish = (job, success, removed = false, message = null) => db.query('select public.crm_finish_task_calendar($1,$2,$3,$4,$5,$6,$7)', [job.task_id, job.version, job.claim_token, success, removed, message, success && !removed ? 'https://calendar.google.com/event' : null])
  const first = (await claim()).rows[0]
  assert.equal(first.payload.attendees.length, 2)
  assert.equal((await claim()).rows.length, 0)
  await finish(first, false, false, 'Google non disponibile')
  assert.equal((await claim()).rows.length, 0)
  await db.exec('reset role; set role authenticated')
  assert.equal((await db.query('select status from public.crm_task_calendar_status(array[$1::uuid])', [task.id])).rows[0].status, 'error')
  await db.query("update public.tasks set description = 'Nuovi dettagli' where id = $1", [task.id])
  await db.exec('reset role; set role service_role')
  const second = (await claim()).rows[0]
  assert.equal(second.event_id, first.event_id)
  await db.exec('reset role; set role authenticated')
  await db.query("update public.tasks set due_date = '2026-10-08' where id = $1", [task.id])
  await db.exec('reset role; set role service_role')
  await finish(second, true)
  const third = (await claim()).rows[0]
  assert.equal(third.payload.dueDate, '2026-10-08')
  assert.equal(third.event_id, first.event_id)
  await finish(third, true)
  await db.exec('reset role; set role authenticated')
  assert.equal((await db.query('select status from public.crm_task_calendar_status(array[$1::uuid])', [task.id])).rows[0].status, 'synced')
  await db.query('update public.tasks set due_date = null where id = $1', [task.id])
  await db.exec('reset role; set role service_role')
  const removal = (await claim()).rows[0]
  assert.equal(removal.event_id, first.event_id)
  await finish(removal, true, true)
  await db.exec('reset role; set role authenticated')
  await db.query("update public.tasks set due_date = '2026-10-09' where id = $1", [task.id])
  await db.exec('reset role; set role service_role')
  const recreated = (await claim()).rows[0]
  assert.notEqual(recreated.event_id, first.event_id)
  await finish(recreated, true)
  await db.exec('reset role; update public.task_calendar_config set enabled = false; set role authenticated')
  await db.query('delete from public.tasks where id = $1', [task.id])
  await db.exec('reset role; set role service_role')
  assert.equal((await claim()).rows.length, 0)
  await db.exec('reset role; update public.task_calendar_config set enabled = true; set role service_role')
  const deletion = (await claim()).rows[0]
  assert.equal(deletion.payload.deleted, true)
  assert.equal(deletion.event_id, recreated.event_id)
  await finish(deletion, true, true)
  assert.equal((await claim()).rows.length, 0)
  // Disabling an existing extra assignee must not prevent completing old tasks.
  await db.exec('reset role; set role authenticated')
  await db.query('update public.tasks set additional_assignee_ids = array[$2::uuid] where id = $1', [old.id, other])
  await db.exec(`reset role; update public.user_profiles set attivo = false where id = '${other}'; set role authenticated`)
  await db.query('update public.tasks set completed = true where id = $1', [old.id])
  assert.equal((await db.query('select completed from public.tasks where id = $1', [old.id])).rows[0].completed, true)
  await db.exec(`reset role; update public.user_profiles set attivo = false where id = '${operator}'; set role authenticated`)
  await assert.rejects(db.query('select * from public.crm_task_calendar_status(array[$1::uuid])', [old.id]))
  console.log('PostgreSQL locale: migrazioni ripetibili, dati storici, assegnatari attivi, permessi, coda, lease, retry, versioni concorrenti, cancellazione e riattivazione verificati.')
} finally { await db.close() }
