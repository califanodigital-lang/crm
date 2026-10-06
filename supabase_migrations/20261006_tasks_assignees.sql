begin;

-- Preserve the existing primary assignee and historical tasks.
alter table public.tasks add column if not exists additional_assignee_ids uuid[] not null default '{}';

create or replace function public.crm_prepare_task_assignees()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  candidate uuid;
begin
  if not public.crm_has_access(false) then
    raise exception 'Accesso non autorizzato' using errcode = '42501';
  end if;
  new.additional_assignee_ids := array(
    select distinct id from unnest(coalesce(new.additional_assignee_ids, '{}'::uuid[])) as ids(id)
    where id is not null and id <> new.assignee_id order by id
  );
  foreach candidate in array new.additional_assignee_ids loop
    -- Existing assignments to subsequently disabled accounts are retained.
    -- New assignments must point to active operators.
    if not exists (select 1 from public.user_profiles where id = candidate) then
      raise exception 'Assegnatario inesistente' using errcode = '23503';
    end if;
    if TG_OP = 'INSERT' then
      if not exists (select 1 from public.user_profiles where id = candidate
        and attivo = true and role::text in ('ADMIN', 'AGENT')) then
        raise exception 'Assegnatario non attivo' using errcode = '23514';
      end if;
    elsif not (candidate = old.assignee_id or candidate = any(old.additional_assignee_ids)) then
      if not exists (select 1 from public.user_profiles where id = candidate
        and attivo = true and role::text in ('ADMIN', 'AGENT')) then
        raise exception 'Assegnatario non attivo' using errcode = '23514';
      end if;
    end if;
  end loop;
  return new;
end;
$$;

revoke all on function public.crm_prepare_task_assignees() from public, anon, authenticated;
drop trigger if exists crm_prepare_task_assignees on public.tasks;
create trigger crm_prepare_task_assignees before insert or update on public.tasks
for each row execute function public.crm_prepare_task_assignees();

notify pgrst, 'reload schema';
commit;
