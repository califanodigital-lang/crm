begin;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 300),
  urgent boolean not null default false,
  assignee_id uuid not null references public.user_profiles(id),
  completed boolean not null default false,
  created_by uuid not null references public.user_profiles(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists tasks_assignee_created_idx on public.tasks (assignee_id, created_at desc);

create or replace function public.crm_prepare_task()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not public.crm_has_access(false) then
    raise exception 'Accesso non autorizzato' using errcode = '42501';
  end if;
  if TG_OP = 'INSERT' or new.assignee_id is distinct from old.assignee_id then
    if not exists (select 1 from public.user_profiles where id = new.assignee_id
      and attivo = true and role::text in ('ADMIN', 'AGENT')) then
      raise exception 'Assegnatario non attivo' using errcode = '23514';
    end if;
  end if;
  new.title := btrim(new.title);
  if TG_OP = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
    new.completed_at := case when new.completed then now() else null end;
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.completed_at := case when not new.completed then null
      when not old.completed then now() else old.completed_at end;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.crm_prepare_task() from public, anon, authenticated;
drop trigger if exists crm_prepare_task on public.tasks;
create trigger crm_prepare_task before insert or update on public.tasks
for each row execute function public.crm_prepare_task();

alter table public.tasks enable row level security;
revoke all on public.tasks from public, anon, authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
drop policy if exists crm_tasks_access on public.tasks;
create policy crm_tasks_access on public.tasks for all to authenticated
using ((select public.crm_has_access(false)))
with check ((select public.crm_has_access(false)));

commit;
