begin;

-- La policy crm_tasks_access gia verifica ruolo attivo e MFA anche per DELETE.
grant delete on public.tasks to authenticated;

commit;
