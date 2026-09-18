-- ============================================================
-- C3 CRM · Coda outreach
-- 1) i sei campi di lavorazione sulle proposte brand
-- 2) la vista public.coda_outreach letta dall'esportazione notturna
-- 3) il ruolo di sola lettura usato da GitHub Actions
--
-- Le parti 1 e 2 sono gia' applicate sul progetto il 17/09/2026.
-- Sono qui perche' il repository resti la fonte di verita' dello schema.
-- La parte 3 va eseguita una volta sola, dopo aver scelto la password.
-- ============================================================

-- ------------------------------------------------------------
-- 1 · Campi nuovi (additivi: nessuna colonna esistente cambia)
-- ------------------------------------------------------------
alter table public.proposte_brand
  add column if not exists bundle           boolean not null default false,
  add column if not exists chi_altro_serve  text,
  add column if not exists come_si_entra    text,
  add column if not exists chi_cercare      text,
  add column if not exists cosa_chiedere    text,
  add column if not exists vincoli          text;

comment on column public.proposte_brand.bundle          is 'Il brand puo servire piu creator insieme';
comment on column public.proposte_brand.chi_altro_serve is 'Altri creator nostri che il brand potrebbe prendere';
comment on column public.proposte_brand.come_si_entra   is 'Canale e appiglio per il primo contatto';
comment on column public.proposte_brand.chi_cercare     is 'Ruolo o persona da raggiungere';
comment on column public.proposte_brand.cosa_chiedere   is 'Obiettivo concreto del contatto';
comment on column public.proposte_brand.vincoli         is 'Esclusive, competitor attivi, periodi da evitare';

-- ------------------------------------------------------------
-- 2 · Vista di esportazione
--     Contratto dei campi fissato con chi consuma il file:
--     date come stringhe ISO, priorita numerica, nessun campo calcolato
--     (ritardo e punteggio li calcola chi legge, non il CRM).
-- ------------------------------------------------------------
create or replace view public.coda_outreach as
select
  p.id,
  coalesce(
    nullif(btrim(p.contattato_per_creator), ''),
    (select c.nome from public.creators c
      where c.id::text = p.creator_suggeriti[1])
  )                                               as cliente,
  p.brand_nome                                    as brand,
  p.settore                                       as categoria,
  case p.priorita
    when 'URGENTE' then 1
    when 'ALTA'    then 1
    when 'BASSA'   then 3
    else 2
  end                                             as priorita,
  coalesce(p.bundle, false)                       as bundle,
  p.chi_altro_serve,
  p.come_si_entra,
  p.chi_cercare,
  p.cosa_chiedere,
  p.vincoli,
  p.stato,
  to_char(p.data_contatto, 'YYYY-MM-DD')          as data_contatto,
  to_char(
    case p.stato
      when 'PRIMO_CONTATTO' then p.data_contatto + 7
      when 'FOLLOW_UP_1'    then coalesce(p.data_followup_1, p.data_contatto) + 5
      when 'FOLLOW_UP_2'    then coalesce(p.data_followup_2, p.data_contatto) + 7
      when 'RICONTATTO_FUTURO' then p.data_ricontatto
      else null
    end, 'YYYY-MM-DD')                            as prossimo_follow_up
from public.proposte_brand p
where p.stato in (
  'RICERCA_COMPLETATA', 'ONBOARDING', 'PRIMO_CONTATTO',
  'FOLLOW_UP_1', 'FOLLOW_UP_2', 'RICONTATTO_FUTURO', 'IN_TRATTATIVA'
);

-- La vista non passa dall'app: nessun accesso per chi naviga il CRM.
revoke all on public.coda_outreach from anon, authenticated;

-- ------------------------------------------------------------
-- 3 · Ruolo di sola lettura per l'esportazione notturna
--
--     PRIMA DI ESEGUIRE: sostituire SCEGLI_UNA_PASSWORD_LUNGA con una
--     password generata a caso (almeno 32 caratteri). Non riusare la
--     password del database ne' altre chiavi del progetto.
--     La password finisce solo nel segreto CODA_OUTREACH_DB_URL di GitHub.
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'coda_export') then
    create role coda_export with login nocreatedb nocreaterole noinherit
      password 'SCEGLI_UNA_PASSWORD_LUNGA';
  end if;
end $$;

grant usage  on schema public       to coda_export;
grant select on public.coda_outreach to coda_export;

alter role coda_export set statement_timeout = '60s';
alter role coda_export set default_transaction_read_only = on;

-- ------------------------------------------------------------
-- VERIFICA
-- ------------------------------------------------------------

-- deve dire true
select has_table_privilege('coda_export', 'public.coda_outreach', 'select') as legge_la_vista;

-- devono dire tutte false: il ruolo non arriva alle tabelle
select has_table_privilege('coda_export', 'public.proposte_brand', 'select') as legge_proposte,
       has_table_privilege('coda_export', 'public.creators',       'select') as legge_creators,
       has_table_privilege('coda_export', 'public.user_profiles',  'select') as legge_utenti,
       has_table_privilege('coda_export', 'public.coda_outreach',  'update') as puo_scrivere;

-- quante righe vedra' l'esportazione
select count(*) as righe, count(prossimo_follow_up) as con_follow_up
from public.coda_outreach;
