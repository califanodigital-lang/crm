begin;

create table if not exists public.drive_attachments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('fiere_db', 'trattative_fiere')),
  entity_id uuid not null,
  note_id text not null,
  drive_file_id text not null unique,
  name text not null,
  size bigint not null check (size between 1 and 10485760),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists drive_attachments_note_idx on public.drive_attachments(entity_type, entity_id, note_id);
alter table public.drive_attachments enable row level security;
revoke all on public.drive_attachments from public, anon, authenticated;
grant select on public.drive_attachments to authenticated;
grant all on public.drive_attachments to service_role;
drop policy if exists drive_attachments_read on public.drive_attachments;
create policy drive_attachments_read on public.drive_attachments for select to authenticated
using ((select public.crm_has_access(false)) and (
  (entity_type = 'fiere_db' and exists (select 1 from public.fiere_db f where f.id = entity_id))
  or (entity_type = 'trattative_fiere' and exists (select 1 from public.trattative_fiere f where f.id = entity_id))
));

commit;
