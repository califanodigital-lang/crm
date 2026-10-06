begin;

-- Enable explicitly only after Google secrets and the scheduled worker are ready.
create table if not exists public.task_calendar_config (
  id boolean primary key default true check (id),
  enabled boolean not null default false
);
insert into public.task_calendar_config(id) values(true) on conflict do nothing;

-- No foreign key to tasks: deletion must leave a durable cancellation job.
create table if not exists public.task_calendar_jobs (
  task_id uuid primary key,
  payload jsonb not null,
  version bigint not null default 1,
  synced_version bigint not null default 0,
  event_id text,
  calendar_id text,
  event_url text,
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_until timestamptz,
  claim_token uuid,
  last_error text,
  updated_at timestamptz not null default now()
);
create index if not exists task_calendar_jobs_pending_idx on public.task_calendar_jobs(next_attempt_at)
  where version > synced_version;

alter table public.task_calendar_config enable row level security;
alter table public.task_calendar_jobs enable row level security;
revoke all on public.task_calendar_config, public.task_calendar_jobs from public, anon, authenticated;
grant all on public.task_calendar_config, public.task_calendar_jobs to service_role;

create or replace function public.crm_enqueue_task_calendar()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  item public.tasks;
  desired jsonb;
  recipients jsonb;
begin
  if not coalesce((select enabled from public.task_calendar_config where id), false) then
    -- Keep existing remote events consistent while the worker is paused.
    if TG_OP = 'DELETE' then
      if not exists(select 1 from public.task_calendar_jobs where task_id = old.id) then return null; end if;
    else
      if not exists(select 1 from public.task_calendar_jobs where task_id = new.id) then return null; end if;
    end if;
  end if;
  if TG_OP = 'DELETE' then
    item := old;
    desired := jsonb_build_object('deleted', true);
  else
    item := new;
    if TG_OP = 'UPDATE' then
      if row(new.title, new.description, new.due_date, new.assignee_id, new.additional_assignee_ids, new.completed, new.urgent)
        is not distinct from row(old.title, old.description, old.due_date, old.assignee_id, old.additional_assignee_ids, old.completed, old.urgent) then
        return null;
      end if;
    end if;
    select coalesce(jsonb_agg(jsonb_build_object('email', email, 'displayName', coalesce(nome_completo, agente_nome, email)) order by id), '[]'::jsonb)
      into recipients from public.user_profiles
      where id = any(array[item.assignee_id] || item.additional_assignee_ids)
        and attivo = true and role::text in ('ADMIN', 'AGENT');
    desired := jsonb_build_object('deleted', false, 'title', item.title, 'description', item.description,
      'dueDate', item.due_date, 'completed', item.completed, 'urgent', item.urgent,
      'assigneeIds', to_jsonb(array[item.assignee_id] || item.additional_assignee_ids), 'attendees', recipients);
  end if;
  -- No event and no deadline: nothing to send or cancel.
  if (TG_OP = 'DELETE' or item.due_date is null)
    and not exists(select 1 from public.task_calendar_jobs where task_id = item.id) then
    return null;
  end if;
  insert into public.task_calendar_jobs(task_id, payload) values(item.id, desired)
    on conflict(task_id) do update set payload = excluded.payload,
      version = public.task_calendar_jobs.version + 1, attempts = 0,
      last_error = null, next_attempt_at = now(), updated_at = now();
  return null;
end;
$$;
revoke all on function public.crm_enqueue_task_calendar() from public, anon, authenticated;
drop trigger if exists crm_enqueue_task_calendar on public.tasks;
create trigger crm_enqueue_task_calendar after insert or update or delete on public.tasks
  for each row execute function public.crm_enqueue_task_calendar();

create or replace function public.crm_claim_task_calendar(target_calendar text)
returns setof public.task_calendar_jobs language plpgsql security definer set search_path = '' as $$
begin
  if not coalesce((select enabled from public.task_calendar_config where id), false) then return; end if;
  if nullif(btrim(target_calendar), '') is null then raise exception 'Calendario richiesto'; end if;
  return query
    with candidate as (
      select task_id from public.task_calendar_jobs
        where version > synced_version and next_attempt_at <= now()
          and (locked_until is null or locked_until < now())
        order by next_attempt_at, task_id for update skip locked limit 1
    )
    update public.task_calendar_jobs j set
      locked_until = now() + interval '3 minutes', claim_token = gen_random_uuid(),
      event_id = case when j.payload->>'dueDate' is not null and not coalesce((j.payload->>'deleted')::boolean, false)
        then coalesce(j.event_id, 'c3' || replace(gen_random_uuid()::text, '-', '')) else j.event_id end,
      calendar_id = case when j.payload->>'dueDate' is not null and not coalesce((j.payload->>'deleted')::boolean, false)
        then coalesce(j.calendar_id, target_calendar) else j.calendar_id end,
      attempts = attempts + 1
    from candidate c where j.task_id = c.task_id returning j.*;
end;
$$;

create or replace function public.crm_finish_task_calendar(
  target_task uuid, claimed_version bigint, token uuid, succeeded boolean,
  removed boolean default false, failure_message text default null, google_event_url text default null
) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.task_calendar_jobs set
    synced_version = case when succeeded then claimed_version else synced_version end,
    event_id = case when succeeded and removed then null else event_id end,
    calendar_id = case when succeeded and removed then null else calendar_id end,
    event_url = case when succeeded then google_event_url else event_url end,
    last_error = case when version <> claimed_version or succeeded then null else left(failure_message, 300) end,
    next_attempt_at = case when version <> claimed_version or succeeded then now()
      else now() + make_interval(secs => least(3600, (30 * power(2, least(attempts, 7)))::integer)) end,
    locked_until = null, claim_token = null, updated_at = now()
  where task_id = target_task and claim_token = token;
end;
$$;

create or replace function public.crm_task_calendar_status(task_ids uuid[])
returns table(task_id uuid, status text, event_url text)
language plpgsql security definer set search_path = '' as $$
begin
  if not public.crm_has_access(false) then raise exception 'Accesso non autorizzato' using errcode = '42501'; end if;
  return query select t.id,
    case when not coalesce(c.enabled, false) then 'disabled'
      when j.version > j.synced_version then case when j.last_error is not null then 'error' else 'pending' end
      when t.due_date is null then 'not_required'
      when j.task_id is null then 'not_queued'
      else 'synced' end,
    case when c.enabled and j.version = j.synced_version then j.event_url else null end
    from public.tasks t left join public.task_calendar_jobs j on j.task_id = t.id
    left join public.task_calendar_config c on c.id = true where t.id = any(task_ids);
end;
$$;

revoke all on function public.crm_claim_task_calendar(text) from public, anon, authenticated;
revoke all on function public.crm_finish_task_calendar(uuid, bigint, uuid, boolean, boolean, text, text) from public, anon, authenticated;
grant execute on function public.crm_claim_task_calendar(text) to service_role;
grant execute on function public.crm_finish_task_calendar(uuid, bigint, uuid, boolean, boolean, text, text) to service_role;
revoke all on function public.crm_task_calendar_status(uuid[]) from public, anon;
grant execute on function public.crm_task_calendar_status(uuid[]) to authenticated;

notify pgrst, 'reload schema';
commit;
