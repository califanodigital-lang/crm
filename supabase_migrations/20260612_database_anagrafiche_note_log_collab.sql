alter table if exists public.creators
  add column if not exists cognome text,
  add column if not exists domicilio_fiscale text,
  add column if not exists note_log jsonb not null default '[]'::jsonb;

alter table if exists public.brands
  add column if not exists note_log jsonb not null default '[]'::jsonb;

alter table if exists public.clienti_terzi
  add column if not exists cognome text,
  add column if not exists codice_fiscale text,
  add column if not exists piva text,
  add column if not exists residenza text,
  add column if not exists domicilio_fiscale text,
  add column if not exists note_log jsonb not null default '[]'::jsonb;

alter table if exists public.collaborations
  add column if not exists link_contratto text,
  add column if not exists note_log jsonb not null default '[]'::jsonb;

alter table if exists public.fiere_db
  add column if not exists note_log jsonb not null default '[]'::jsonb;

alter table if exists public.eventi
  add column if not exists note_log jsonb not null default '[]'::jsonb;

alter table if exists public.trattative_fiere
  add column if not exists note_log jsonb not null default '[]'::jsonb;

alter table if exists public.proposte_brand
  add column if not exists note_log jsonb not null default '[]'::jsonb;
