import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'

// Pass the local PGlite module path; this test never connects to Supabase.
const { PGlite } = await import(pathToFileURL(process.argv[2]).href)
const db = new PGlite()
const operator = '00000000-0000-0000-0000-000000000001'
const inactive = '00000000-0000-0000-0000-000000000002'
try {
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create function auth.uid() returns uuid language sql as $$ select '${operator}'::uuid $$;
    create table public.user_profiles (id uuid primary key, role text, attivo boolean);
    insert into public.user_profiles values ('${operator}', 'AGENT', true), ('${inactive}', 'AGENT', false);
    create function public.crm_has_access(boolean) returns boolean language sql as $$
      select coalesce((select attivo and role in ('ADMIN','AGENT') from public.user_profiles where id = auth.uid()), false)
    $$;
    grant usage on schema public, auth to authenticated;
    grant select on public.user_profiles to authenticated;
  `)
  const migration = await readFile(new URL('../supabase_migrations/20261001_tasks.sql', import.meta.url), 'utf8')
  await db.exec(migration)
  await db.exec(migration)
  const deleteMigration = await readFile(new URL('../supabase_migrations/20261001_tasks_delete.sql', import.meta.url), 'utf8')
  await db.exec('revoke delete on public.tasks from authenticated')
  await db.exec(deleteMigration)
  await db.exec(deleteMigration)
  await db.exec('set role authenticated')
  const created = await db.query(`insert into public.tasks (title, assignee_id) values ('  Prova task  ', '${operator}') returning *`)
  const task = created.rows[0]
  assert.equal(task.title, 'Prova task')
  assert.equal(task.created_by, operator)
  assert.equal(task.completed, false)
  await assert.rejects(db.query(`insert into public.tasks (title, assignee_id) values ('Non valida', '${inactive}')`))
  await assert.rejects(db.query(`insert into public.tasks (title, assignee_id) values ('   ', '${operator}')`))
  const completed = await db.query('update public.tasks set completed = true where id = $1 returning *', [task.id])
  assert.ok(completed.rows[0].completed_at)
  const reopened = await db.query('update public.tasks set completed = false, created_by = $2 where id = $1 returning *', [task.id, inactive])
  assert.equal(reopened.rows[0].completed_at, null)
  assert.equal(reopened.rows[0].created_by, operator)
  const deleted = await db.query('delete from public.tasks where id = $1 returning id', [task.id])
  assert.equal(deleted.rows[0].id, task.id)
  const retained = await db.query(`insert into public.tasks (title, assignee_id) values ('Da conservare', '${operator}') returning id`)
  await db.exec(`reset role; update public.user_profiles set attivo = false where id = '${operator}'; set role authenticated;`)
  assert.equal((await db.query('select * from public.tasks')).rows.length, 0)
  assert.equal((await db.query('delete from public.tasks where id = $1 returning id', [retained.rows[0].id])).rows.length, 0)
  await db.exec('reset role')
  assert.equal((await db.query('select id from public.tasks where id = $1', [retained.rows[0].id])).rows.length, 1)
  await db.exec('set role authenticated')
  await assert.rejects(db.query(`insert into public.tasks (title, assignee_id) values ('Negata', '${operator}')`))
  console.log('Tasks: migrazione ripetibile, creazione Agent, validazione, completamento, riapertura e accesso inattivi verificati.')
} finally {
  await db.close()
}
