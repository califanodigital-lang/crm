begin;

-- Richiede MFA solo agli account che hanno confermato un secondo fattore.
-- Non modifica le autorizzazioni esistenti e non attiva RLS implicitamente.
create or replace function public.crm_mfa_satisfied()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and (
    coalesce(auth.jwt()->>'aal', '') = 'aal2'
    or not exists (
      select 1 from auth.mfa_factors
      where user_id = auth.uid() and status = 'verified'
    )
  );
$$;

revoke all on function public.crm_mfa_satisfied() from public, anon;
grant execute on function public.crm_mfa_satisfied() to authenticated;

do $$
declare
  target record;
begin
  for target in
    select c.relname, c.relrowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
      and c.relname = any(array[
        'user_profiles', 'brands', 'creators', 'clienti_terzi',
        'proposte_brand', 'collaborations', 'fiere_db', 'eventi',
        'trattative_fiere', 'partecipazioni_eventi', 'circuiti_eventi',
        'tipologie_eventi', 'creator_impegni', 'piattaforme',
        'creator_piattaforme', 'contratti_ricorrenti', 'pagamenti_contratti',
        'pagamenti_agenti', 'revenue_mensile', 'versamenti',
        'fatture_emesse', 'uscite_varie'
      ])
  loop
    execute format('drop policy if exists crm_mfa_verified on public.%I', target.relname);
    execute format(
      'create policy crm_mfa_verified on public.%I as restrictive for all to authenticated using ((select public.crm_mfa_satisfied())) with check ((select public.crm_mfa_satisfied()))',
      target.relname
    );
    if not target.relrowsecurity then
      raise warning 'MFA NON applicata su public.%: RLS disattivato. Verificare le policy prima di attivarlo.', target.relname;
    end if;
  end loop;
end;
$$;

commit;

-- Tutte le tabelle sotto devono avere RLS attivo per la protezione API.
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in (
  select tablename from pg_policies
  where schemaname = 'public' and policyname = 'crm_mfa_verified'
)
order by tablename;
