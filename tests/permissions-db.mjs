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

  await db.exec('reset role')
  for (const table of ['creators','brands','clienti_terzi','collaborations','fiere_db','eventi','trattative_fiere','proposte_brand']) {
    await db.exec(`alter table public.${table} add column note_log jsonb not null default '[]'`)
  }
  await db.exec(`
    alter table public.collaborations add column pagato_agency boolean default false, add column numero_fattura text, add column data_fattura date,
      add column trattativa_id uuid, add column brand_id uuid, add column sales text, add column senior text,
      add column link_contratto text, add column contatto text, add column note text;
    alter table public.partecipazioni_eventi add column pagato_agency boolean default false,
      add column pagato boolean default false, add column numero_fattura text, add column data_fattura date;
    alter table public.eventi add column tipo text, add column circuito_id uuid, add column fiera_db_id uuid,
      add column trattativa_fiera_id uuid, add column data_inizio date, add column data_fine date,
      add column location text, add column citta text, add column stato text, add column created_at timestamptz default now();
    alter table public.trattative_fiere add column nome text, add column tipo text, add column circuito_id uuid,
      add column fiera_db_id uuid, add column evento_id uuid, add column data_inizio date, add column data_fine date,
      add column location text, add column citta text, add column stato text;
    alter table public.proposte_brand add column stato text, add column creator_confermati jsonb,
      add column fee_creator_map jsonb, add column importo_preventivo numeric, add column brand_id uuid,
      add column brand_nome text, add column sales text, add column ima text, add column agente text,
      add column link_preventivo text, add column contatto text, add column note_trattativa text, add column note_strategiche text;
  `)
  const auditMigration = await readFile(new URL('../supabase_migrations/20261001_audit_crm_fixes.sql', import.meta.url), 'utf8')
  await db.exec(auditMigration)
  await db.exec(auditMigration)
  await asUser(admin)
  await db.query('update public.user_profiles set attivo=false where id=$1', [agent])
  await asUser(agent, 'aal2')
  assert.equal((await db.query('select * from public.collaborations')).rows.length, 0)
  await assert.rejects(db.query('select public.crm_confirm_event_receipt($1,true,$2,null)', [part,'2026-10-01']), /Accesso negato/)
  assert.equal((await db.query('select * from public.user_profiles')).rows.length, 1)
  await asUser(admin)
  await db.query('update public.user_profiles set attivo=true where id=$1', [agent])
  await asUser(agent, 'aal2')

  await db.query('update public.creators set note_log=$1::jsonb where id=$2', [JSON.stringify([{id:'note-a',topic:'A',contenuto:'Uno',timestamp:'1900-01-01T00:00:00Z',_new:true}]),creator])
  const noteA = (await db.query('select note_log from public.creators where id=$1',[creator])).rows[0].note_log[0]
  assert.notEqual(noteA.timestamp,'1900-01-01T00:00:00Z')
  await db.query('update public.creators set note_log=$1::jsonb where id=$2', [JSON.stringify([{id:'note-b',topic:'B',contenuto:'Due',_new:true}]),creator])
  assert.equal((await db.query('select note_log from public.creators where id=$1',[creator])).rows[0].note_log.length,2)
  const base = {topic:noteA.topic,contenuto:noteA.contenuto,timestamp:noteA.timestamp,modificatoIl:noteA.modificatoIl || ''}
  const edit = {...noteA,topic:'Modificata',_base:base}
  await db.query('update public.creators set note_log=$1::jsonb where id=$2',[JSON.stringify([edit]),creator])
  await assert.rejects(db.query('update public.creators set note_log=$1::jsonb where id=$2',[JSON.stringify([edit]),creator]),/altro operatore/)
  assert.equal((await db.query('select note_log from public.creators where id=$1',[creator])).rows[0].note_log.length,2)

  await asUser(admin)
  await db.query('delete from public.fatture_emesse where partecipazione_id=$1',[part])
  assert.equal((await db.query('select fattura_emessa from public.partecipazioni_eventi where id=$1',[part])).rows[0].fattura_emessa,false)
  const receipt = await db.query('select public.crm_confirm_event_receipt($1,true,$2,$3::jsonb)',[part,'2026-10-01',JSON.stringify({numero_fattura:'F-1',data_fattura:'2026-10-01'})])
  assert.equal(receipt.rows[0].crm_confirm_event_receipt.fattura_emessa,true)
  await db.query('select public.crm_confirm_event_receipt($1,true,$2,$3::jsonb)',[part,'2026-10-01',JSON.stringify({numero_fattura:'F-1',data_fattura:'2026-10-01'})])
  assert.equal((await db.query('select * from public.fatture_emesse where partecipazione_id=$1',[part])).rows.length,1)
  await assert.rejects(db.query('select public.crm_confirm_event_receipt($1,true,$2,$3::jsonb)',[part,'2026-10-02',JSON.stringify({collab_id:collab})]),/Sorgente fattura non valida/)
  assert.equal((await db.query('select data_pagamento_agency::text as date from public.partecipazioni_eventi where id=$1',[part])).rows[0].date,'2026-10-01')
  await db.query('select public.crm_confirm_collab_receipt($1,true,$2,null)',[collab,'2026-10-01'])

  const deal = '00000000-0000-0000-0000-000000000020'
  const secondCreator = '00000000-0000-0000-0000-000000000021'
  await db.query('insert into public.creators(id,nome) values($1,$2)',[secondCreator,'Secondo'])
  await db.query('insert into public.proposte_brand(id,stato,creator_confermati,importo_preventivo,brand_nome) values($1,$2,$3::jsonb,1000,$4)',[deal,'CONTRATTO_FIRMATO',JSON.stringify([creator,secondCreator]),'Brand'])
  await assert.rejects(db.query('select public.crm_convert_deal($1)',[deal]),/fee individuale/)
  await db.query('update public.proposte_brand set fee_creator_map=$1::jsonb where id=$2',[JSON.stringify({[creator]:600,[secondCreator]:400}),deal])
  const converted = (await db.query('select public.crm_convert_deal($1) as result',[deal])).rows[0].result
  assert.equal(converted.length,2)
  assert.equal(converted.reduce((s,c)=>s+Number(c.pagamento),0),1000)
  assert.equal((await db.query('select public.crm_convert_deal($1) as result',[deal])).rows[0].result.length,2)
  assert.equal((await db.query('select stato from public.proposte_brand where id=$1',[deal])).rows[0].stato,'COLLAB_GENERATA')

  const fair = '00000000-0000-0000-0000-000000000030'
  const negotiation = '00000000-0000-0000-0000-000000000031'
  await db.query('insert into public.fiere_db(id) values($1)',[fair])
  await db.query('insert into public.trattative_fiere(id,nome,stato,fiera_db_id,data_inizio,note_log) values($1,$2,$3,$4,$5,$6::jsonb)',[negotiation,'Fiera','IN_TRATTATIVA',fair,'2026-06-01',JSON.stringify([{id:'source-note',topic:'Origine',timestamp:'2026-01-01T00:00:00Z'}])])
  const edition = (await db.query('select public.crm_sync_fair_edition($1) as id',[negotiation])).rows[0].id
  await db.query('update public.eventi set stato=$1,note_log=$2::jsonb where id=$3',['CHIUSA',JSON.stringify([{id:'event-note',topic:'Evento',_new:true}]),edition])
  await db.query('select public.crm_sync_fair_edition($1)',[negotiation])
  assert.equal((await db.query('select stato from public.eventi where id=$1',[edition])).rows[0].stato,'CHIUSA')
  await db.query('update public.trattative_fiere set evento_id=null,data_inizio=$1 where id=$2',['2027-06-01',negotiation])
  const nextEdition = (await db.query('select public.crm_sync_fair_edition($1) as id',[negotiation])).rows[0].id
  assert.notEqual(nextEdition,edition)
  console.log('OK: audit SQL idempotente, account inattivi bloccati, note concorrenti e timestamp server, fatture atomiche e rollback, conversione e budget, edizioni separate.')

} finally { await db.close() }
