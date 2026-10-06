begin;

-- Additive migration: preserves existing records, permissions and contact fields.
alter table public.circuiti_eventi
  add column if not exists referente text,
  add column if not exists contatto text,
  add column if not exists telefono text,
  add column if not exists contatti_aggiuntivi jsonb not null default '[]'::jsonb
    check (jsonb_typeof(contatti_aggiuntivi) = 'array');

alter table public.fiere_db
  add column if not exists contatti_aggiuntivi jsonb not null default '[]'::jsonb
    check (jsonb_typeof(contatti_aggiuntivi) = 'array');

alter table public.trattative_fiere
  add column if not exists contatti_aggiuntivi jsonb not null default '[]'::jsonb
    check (jsonb_typeof(contatti_aggiuntivi) = 'array');

notify pgrst, 'reload schema';
commit;
