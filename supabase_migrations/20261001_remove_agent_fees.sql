begin;

-- Archivio privato: non esposto al CRM e senza accesso per i ruoli API.
create schema if not exists crm_archive;
revoke all on schema crm_archive from public, anon, authenticated;
create table if not exists crm_archive.agent_commissions (
  source_table text not null,
  source_id text not null,
  payload jsonb not null,
  archived_at timestamptz not null default now(),
  primary key (source_table, source_id)
);
revoke all on crm_archive.agent_commissions from public, anon, authenticated;

insert into crm_archive.agent_commissions (source_table, source_id, payload)
select 'user_profiles', id::text, jsonb_strip_nulls(jsonb_build_object(
  'fee_ricerca', to_jsonb(p)->'fee_ricerca',
  'fee_contatto', to_jsonb(p)->'fee_contatto',
  'fee_chiusura', to_jsonb(p)->'fee_chiusura',
  'riceve_fee', to_jsonb(p)->'riceve_fee'
)) from public.user_profiles p
where to_jsonb(p) ?| array['fee_ricerca', 'fee_contatto', 'fee_chiusura', 'riceve_fee']
on conflict (source_table, source_id) do nothing;

insert into crm_archive.agent_commissions (source_table, source_id, payload)
select 'collaborations', id::text, jsonb_strip_nulls(jsonb_build_object(
  'fee_sales_calc', to_jsonb(c)->'fee_sales_calc',
  'fee_agente_calc', to_jsonb(c)->'fee_agente_calc',
  'fee_senior_calc', to_jsonb(c)->'fee_senior_calc'
)) from public.collaborations c
where to_jsonb(c) ?| array['fee_sales_calc', 'fee_agente_calc', 'fee_senior_calc']
on conflict (source_table, source_id) do nothing;

-- La proiezione cambia numero di colonne: ricreare la vista senza CASCADE.
drop view if exists public.crm_operator_directory;
create view public.crm_operator_directory with (security_barrier = true) as
select id, nome_completo, agente_nome, attivo
from public.user_profiles
where (select public.crm_has_access(false)) and role::text in ('ADMIN', 'AGENT');
revoke all on public.crm_operator_directory from public, anon, authenticated;
grant select on public.crm_operator_directory to authenticated;

alter table public.user_profiles
  drop column if exists fee_ricerca,
  drop column if exists fee_contatto,
  drop column if exists fee_chiusura,
  drop column if exists riceve_fee;

alter table public.collaborations
  drop column if exists fee_sales_calc,
  drop column if exists fee_agente_calc,
  drop column if exists fee_senior_calc;

-- Nessuna modifica a fissi, pagamenti effettivi, compensi creator o fee management.
commit;
