begin;

-- Existing tasks keep their data; description and deadline are optional.
alter table public.tasks
  add column if not exists description text check (char_length(description) <= 5000),
  add column if not exists due_date date;

-- Existing grants, RLS and crm_prepare_task trigger continue to apply.
notify pgrst, 'reload schema';
commit;
