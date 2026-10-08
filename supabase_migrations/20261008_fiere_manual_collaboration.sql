begin;

-- Optional manual history, independent of closed events and current negotiations.
alter table public.fiere_db
  add column if not exists collaborazione_conclusa_manuale boolean not null default false;

-- Existing row policies and grants continue to apply. No historical records changed.
notify pgrst, 'reload schema';
commit;
