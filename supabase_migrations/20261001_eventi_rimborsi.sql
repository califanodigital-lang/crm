alter table public.partecipazioni_eventi
  add column if not exists rimborsi_spese jsonb not null default '[]'::jsonb;

-- Le descrizioni storiche in rimborso_spese restano intatte.
