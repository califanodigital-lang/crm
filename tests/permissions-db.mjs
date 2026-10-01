/* global process */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

// Dipendenza solo per questo test, senza modificare package.json del CRM.
const modulePath = process.argv[2]
if (!modulePath) throw new Error('Indicare il percorso di @electric-sql/pglite/dist/index.js')
const { PGlite } = await import(pathToFileURL(modulePath).href)
const db = new PGlite()
const admin = '00000000-0000-0000-0000-000000000001'
const agent = '00000000-0000-0000-0000-000000000002'
const creator = '00000000-0000-0000-0000-000000000003'
const collab = '00000000-0000-0000-0000-000000000004'
const part = '00000000-0000-0000-0000-000000000005'
const event = '00000000-0000-0000-0000-000000000006'

try {
  await db.exec(`
    create role authenticated; create role anon;
    create schema auth;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt()->>'sub', '')::uuid $$;
    grant usage on schema auth to authenticated;
    create table auth.mfa_factors (user_id uuid, status text);
    create table public.user_profiles (id uuid primary key, role text, email text, nome_completo text, agente_nome text, attivo boolean, fee_ricerca numeric, fee_contatto numeric, fee_chiusura numeric, riceve_fee boolean, fisso_mensile numeric);
    create table public.creators (id uuid primary key default gen_random_uuid(), nome text);
    create table public.eventi (id uuid primary key default gen_random_uuid(), nome text);
    create table public.collaborations (id uuid primary key default gen_random_uuid(), creator_id uuid, stato text, pagato boolean, data_pagamento_agency date, pagamento numeric, fee_management numeric, brand_nome text, agente text, fattura_emessa boolean);
    create table public.partecipazioni_eventi (id uuid primary key, creator_id uuid, evento_id uuid, tipo text, fattura_emessa boolean, fee numeric);
    create table public.revenue_mensile (id uuid primary key default gen_random_uuid(), creator_id uuid, mese date, importo numeric, fatturato boolean, collaborazione_id uuid, brand_nome text, agente text, note text, unique(creator_id,mese));
    create table public.fatture_emesse (id uuid primary key default gen_random_uuid(), mese date, numero_fattura text, data_fattura date, soggetto_nome text, importo numeric, tipo text, collab_id uuid, partecipazione_id uuid, link_documento text, note text, created_at timestamptz default now());
    insert into public.user_profiles values ('${admin}', 'ADMIN', 'admin@example.test', 'Admin', 'Admin', true, 5, 10, 15, true, 1000), ('${agent}', 'AGENT', 'agent@example.test', 'Agent', 'Agent', true, 5, 10, 15, true, 500);
    insert into public.creators values ('${creator}', 'Creator');
    insert into public.eventi values ('${event}', 'Evento');
    insert into public.partecipazioni_eventi values ('${part}', '${creator}', '${event}', 'partecipante', true, 200);
  `)
  const extraTables = ['brands', 'clienti_terzi', 'proposte_brand', 'fiere_db', 'trattative_fiere', 'circuiti_eventi', 'tipologie_eventi', 'creator_impegni', 'piattaforme', 'creator_piattaforme', 'contratti_ricorrenti', 'pagamenti_contratti', 'pagamenti_agenti', 'versamenti', 'uscite_varie']
  for (const name of extraTables) await db.exec(`create table public.${name} (id uuid primary key default gen_random_uuid(), note text);`)
  const migration = await readFile(new URL('../supabase_migrations/20261001_admin_agent_permissions.sql', import.meta.url), 'utf8')
  await db.exec(migration)
  await db.exec(migration)

  const asUser = async (id, aal = 'aal1') => {
    await db.exec('reset role')
    await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: id, aal })])
    await db.exec('set role authenticated')
  }

  await asUser(agent)
  await db.query("insert into public.brands(note) values ('Agent puo creare')")
  assert.equal((await db.query('select * from public.brands')).rows.length, 1)
  await db.query("update public.brands set note = 'Agent puo modificare'")
  assert.equal((await db.query('select note from public.brands')).rows[0].note, 'Agent puo modificare')
  await db.query('delete from public.brands')
  assert.equal((await db.query('select * from public.brands')).rows.length, 0)

  assert.equal((await db.query('select * from public.user_profiles')).rows.length, 1)
  await db.query("update public.user_profiles set role = 'ADMIN' where id = $1", [agent])
  assert.equal((await db.query('select role from public.user_profiles')).rows[0].role, 'AGENT')
  assert.equal((await db.query('select * from public.crm_operator_directory')).rows.length, 2)
  const directory = (await db.query('select * from public.crm_operator_directory')).rows[0]
  assert.equal('email' in directory, false)
  assert.equal('fisso_mensile' in directory, false)
  for (const name of ['pagamenti_agenti', 'versamenti', 'uscite_varie', 'contratti_ricorrenti']) {
    await assert.rejects(db.query(`insert into public.${name} default values`), /row-level security/)
    assert.equal((await db.query(`select * from public.${name}`)).rows.length, 0)
  }

  await db.query('insert into public.collaborations(id,creator_id,stato,pagato,data_pagamento_agency,pagamento,brand_nome) values ($1,$2,$3,true,$4,100,$5)', [collab, creator, 'COMPLETATA', '2026-10-01', 'Brand'])
  assert.equal((await db.query('select * from public.revenue_mensile')).rows.length, 0)
  assert.equal(Number((await db.query('select importo from public.crm_revenue_summary')).rows[0].importo), 100)
  await db.query('update public.collaborations set pagamento=150 where id=$1', [collab])
  assert.equal(Number((await db.query('select importo from public.crm_revenue_summary')).rows[0].importo), 150)
  const secondCollab = '00000000-0000-0000-0000-000000000007'
  await db.query('insert into public.collaborations(id,creator_id,stato,pagato,data_pagamento_agency,pagamento,brand_nome) values ($1,$2,$3,true,$4,50,$5)', [secondCollab, creator, 'COMPLETATA', '2026-10-02', 'Altro brand'])
  assert.equal(Number((await db.query('select importo from public.crm_revenue_summary')).rows[0].importo), 200)
  await db.query('delete from public.collaborations where id=$1', [secondCollab])
  assert.equal(Number((await db.query('select importo from public.crm_revenue_summary')).rows[0].importo), 150)

  const invoicePayload = { partecipazione_id: part, data_fattura: '2026-10-01', numero_fattura: 'TEST', importo: 9999, soggetto_nome: 'Soggetto falso' }
  const register = payload => db.query('select public.crm_register_operational_invoice($1::jsonb) as invoice', [JSON.stringify(payload)])
  const first = (await register(invoicePayload)).rows[0].invoice
  assert.deepEqual(Object.keys(first), ['id'])
  assert.equal((await register(invoicePayload)).rows[0].invoice.id, first.id)
  assert.equal((await db.query('select * from public.fatture_emesse')).rows.length, 0)
  await assert.rejects(register({ ...invoicePayload, collab_id: collab }), /Sorgente fattura non valida/)

  await asUser(admin)
  assert.equal((await db.query('select * from public.user_profiles')).rows.length, 2)
  assert.equal((await db.query('select * from public.fatture_emesse')).rows.length, 1)
  const storedInvoice = (await db.query('select * from public.fatture_emesse')).rows[0]
  assert.equal(Number(storedInvoice.importo), 200)
  assert.equal(storedInvoice.soggetto_nome, 'Creator - Evento')
  await db.query('insert into public.uscite_varie default values')
  const manual = (await register({ ...invoicePayload, importo: 321, soggetto_nome: 'Titolo Admin' })).rows[0].invoice
  assert.equal(Number(manual.importo), 321)
  assert.equal(manual.soggetto_nome, 'Titolo Admin')
  const manualRevenue = { creator_id: creator, mese: '2026-10-01', importo: 30 }
  await db.query('select public.crm_upsert_manual_revenue($1::jsonb)', [JSON.stringify(manualRevenue)])
  await db.query('select public.crm_upsert_manual_revenue($1::jsonb)', [JSON.stringify({ ...manualRevenue, importo: 40 })])
  assert.equal((await db.query('select * from public.revenue_mensile')).rows.length, 2)
  assert.equal(Number((await db.query('select importo from public.crm_revenue_summary')).rows[0].importo), 190)

  await db.exec('reset role')
  await db.query('insert into auth.mfa_factors values ($1,$2)', [agent, 'verified'])
  await asUser(agent)
  assert.equal((await db.query('select * from public.collaborations')).rows.length, 0)
  assert.equal((await db.query('select * from public.crm_operator_directory')).rows.length, 0)
  await assert.rejects(register(invoicePayload), /Accesso negato/)
  await asUser(agent, 'aal2')
  assert.equal((await db.query('select * from public.collaborations')).rows.length, 1)
  await db.query('update public.collaborations set pagato=false where id=$1', [collab])
  assert.equal(Number((await db.query('select importo from public.crm_revenue_summary')).rows[0].importo), 40)
  await db.exec('reset role; set role anon')
  await assert.rejects(db.query('select * from public.creators'), /permission denied/)
  console.log('OK: migrazione idempotente, CRUD Agent, niente auto-promozione o Finance, directory sicura, sincronizzazione revenue, fatture validate, privilegi Admin, MFA e anon.')
  await db.exec('reset role')
  const removal = await readFile(new URL('../supabase_migrations/20261001_remove_agent_fees.sql', import.meta.url), 'utf8')
  await db.exec(removal)
  await db.exec(removal)
  assert.equal((await db.query("select column_name from information_schema.columns where table_schema='public' and table_name='user_profiles' and column_name in ('fee_ricerca','fee_contatto','fee_chiusura','riceve_fee')")).rows.length, 0)
  assert.equal((await db.query("select * from crm_archive.agent_commissions where source_table='user_profiles'")).rows.length, 2)
  await asUser(agent, 'aal2')
  const cleanedDirectory = (await db.query('select * from public.crm_operator_directory')).rows
  assert.equal(cleanedDirectory.length, 2)
  assert.deepEqual(Object.keys(cleanedDirectory[0]).sort(), ['agente_nome', 'attivo', 'id', 'nome_completo'])
  await assert.rejects(db.query('select * from crm_archive.agent_commissions'), /permission denied/)
  console.log('OK: rimozione commissioni idempotente, archivio privato e directory operativa senza commissioni.')
} finally { await db.close() }
