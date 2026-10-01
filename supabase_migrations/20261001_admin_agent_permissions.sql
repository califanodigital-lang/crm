begin;

-- Le policy esistenti delle sole tabelle CRM vengono sostituite con la regola
-- Admin: tutto; Agent: tutto l'operativo, nessuna gestione amministrativa.
create or replace function public.crm_mfa_satisfied()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (
    coalesce(auth.jwt()->>'aal', '') = 'aal2'
    or not exists (select 1 from auth.mfa_factors where user_id = auth.uid() and status = 'verified')
  );
$$;

create or replace function public.crm_current_role()
returns text language sql stable security definer set search_path = '' as $$
  select role::text from public.user_profiles where id = auth.uid();
$$;

create or replace function public.crm_has_access(admin_only boolean default false)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    public.crm_mfa_satisfied() and (
      public.crm_current_role() = 'ADMIN'
      or (not admin_only and public.crm_current_role() = 'AGENT')
    ), false
  );
$$;

revoke all on function public.crm_mfa_satisfied() from public, anon;
revoke all on function public.crm_current_role() from public, anon;
revoke all on function public.crm_has_access(boolean) from public, anon;
grant execute on function public.crm_mfa_satisfied() to authenticated;
grant execute on function public.crm_current_role() to authenticated;
grant execute on function public.crm_has_access(boolean) to authenticated;

do $$
declare
  target record;
  existing_policy record;
  admin_only boolean;
begin
  for target in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and c.relname = any(array[
      'user_profiles', 'brands', 'creators', 'clienti_terzi', 'proposte_brand',
      'collaborations', 'fiere_db', 'eventi', 'trattative_fiere', 'partecipazioni_eventi',
      'circuiti_eventi', 'tipologie_eventi', 'creator_impegni', 'piattaforme',
      'creator_piattaforme', 'contratti_ricorrenti', 'pagamenti_contratti',
      'pagamenti_agenti', 'revenue_mensile', 'versamenti', 'fatture_emesse', 'uscite_varie'
    ])
  loop
    for existing_policy in
      select policyname from pg_policies where schemaname = 'public' and tablename = target.relname
    loop
      execute format('drop policy %I on public.%I', existing_policy.policyname, target.relname);
    end loop;
    execute format('alter table public.%I enable row level security', target.relname);
    execute format('revoke all on table public.%I from anon, authenticated', target.relname);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', target.relname);
    if target.relname = 'user_profiles' then
      execute 'create policy crm_profile_read on public.user_profiles for select to authenticated using ((select public.crm_has_access(true)) or (id = (select auth.uid()) and (select public.crm_has_access(false))))';
      execute 'create policy crm_profile_insert on public.user_profiles for insert to authenticated with check ((select public.crm_has_access(true)))';
      execute 'create policy crm_profile_update on public.user_profiles for update to authenticated using ((select public.crm_has_access(true))) with check ((select public.crm_has_access(true)))';
      execute 'create policy crm_profile_delete on public.user_profiles for delete to authenticated using ((select public.crm_has_access(true)))';
    else
      admin_only := target.relname = any(array[
        'contratti_ricorrenti', 'pagamenti_contratti', 'pagamenti_agenti',
        'revenue_mensile', 'versamenti', 'fatture_emesse', 'uscite_varie'
      ]);
      execute format(
        'create policy crm_role_access on public.%I for all to authenticated using ((select public.crm_has_access(%L))) with check ((select public.crm_has_access(%L)))',
        target.relname, admin_only, admin_only
      );
    end if;
  end loop;
end;
$$;

-- Directory operativa: niente email, stipendi o accesso alla gestione utenti.
-- La vista usa intenzionalmente i privilegi del proprietario con un filtro
-- di ruolo/MFA esplicito, per leggere questa proiezione dei profili.
create or replace view public.crm_operator_directory with (security_barrier = true) as
select id, nome_completo, agente_nome, attivo, fee_ricerca, fee_contatto,
  fee_chiusura, riceve_fee
from public.user_profiles
where (select public.crm_has_access(false)) and role::text in ('ADMIN', 'AGENT');
revoke all on public.crm_operator_directory from public, anon, authenticated;
grant select on public.crm_operator_directory to authenticated;

-- Solo aggregati gia presenti nella dashboard comune, non il registro Finance.
create or replace view public.crm_revenue_summary with (security_barrier = true) as
select mese, sum(importo) as importo from public.revenue_mensile
where (select public.crm_has_access(false)) group by mese;
revoke all on public.crm_revenue_summary from public, anon, authenticated;
grant select on public.crm_revenue_summary to authenticated;

-- Sincronizzazione contabile atomica quando cambia una collaborazione.
-- Il trigger non offre agli Agent un'API per modificare il registro Finance.
-- La revenue automatica e per collaborazione: due deal dello stesso creator
-- nello stesso mese non devono rendere impossibile il salvataggio del secondo.
do $$
declare
  old_constraint record;
  old_index record;
begin
  for old_constraint in
    select c.conname from pg_constraint c
    where c.conrelid = 'public.revenue_mensile'::regclass and c.contype = 'u'
      and (select array_agg(a.attname::text order by a.attname)
        from unnest(c.conkey) k join pg_attribute a
        on a.attrelid = c.conrelid and a.attnum = k) = array['creator_id', 'mese']
  loop
    execute format('alter table public.revenue_mensile drop constraint %I', old_constraint.conname);
  end loop;
  for old_index in
    select i.indexrelid::regclass as name from pg_index i
    where i.indrelid = 'public.revenue_mensile'::regclass and i.indisunique
      and not i.indisprimary and i.indpred is null and i.indexprs is null
      and not exists (select 1 from pg_constraint c where c.conindid = i.indexrelid)
      and (select array_agg(a.attname::text order by a.attname)
        from unnest(i.indkey) k join pg_attribute a
        on a.attrelid = i.indrelid and a.attnum = k) = array['creator_id', 'mese']
  loop
    execute format('drop index %s', old_index.name);
  end loop;
end;
$$;
create unique index if not exists crm_revenue_collaboration_unique
  on public.revenue_mensile (collaborazione_id);
create unique index if not exists crm_revenue_manual_month_unique
  on public.revenue_mensile (creator_id, mese) where collaborazione_id is null;

create or replace function public.crm_upsert_manual_revenue(payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  result public.revenue_mensile%rowtype;
begin
  if not public.crm_has_access(true) then raise exception 'Accesso negato' using errcode = '42501'; end if;
  if nullif(payload->>'collaborazione_id', '') is not null then raise exception 'Revenue non manuale'; end if;
  insert into public.revenue_mensile (creator_id, mese, importo, fatturato, note, brand_nome, agente)
  values ((payload->>'creator_id')::uuid, (payload->>'mese')::date,
    coalesce((payload->>'importo')::numeric, 0), coalesce((payload->>'fatturato')::boolean, false),
    payload->>'note', payload->>'brand_nome', payload->>'agente')
  on conflict (creator_id, mese) where collaborazione_id is null do update
  set importo = excluded.importo, fatturato = excluded.fatturato, note = excluded.note,
    brand_nome = excluded.brand_nome, agente = excluded.agente
  returning * into result;
  return to_jsonb(result);
end;
$$;
revoke all on function public.crm_upsert_manual_revenue(jsonb) from public, anon;
grant execute on function public.crm_upsert_manual_revenue(jsonb) to authenticated;

create or replace function public.crm_sync_collab_revenue()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  existing_id uuid;
  revenue_month date;
begin
  if tg_op = 'DELETE' then
    delete from public.revenue_mensile where collaborazione_id = old.id;
    return old;
  end if;
  if new.stato = 'COMPLETATA' and new.pagato and new.data_pagamento_agency is not null then
    revenue_month := date_trunc('month', new.data_pagamento_agency::timestamp)::date;
    select id into existing_id from public.revenue_mensile where collaborazione_id = new.id limit 1;
    if existing_id is null then
      insert into public.revenue_mensile (creator_id, mese, importo, fatturato, collaborazione_id, brand_nome, agente)
      values (new.creator_id, revenue_month, coalesce(new.pagamento, 0), false, new.id, new.brand_nome, new.agente);
    else
      update public.revenue_mensile set creator_id = new.creator_id, mese = revenue_month,
        importo = coalesce(new.pagamento, 0), brand_nome = new.brand_nome, agente = new.agente
      where collaborazione_id = new.id;
    end if;
  else
    delete from public.revenue_mensile where collaborazione_id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.crm_sync_collab_revenue() from public, anon, authenticated;
drop trigger if exists crm_collab_revenue on public.collaborations;
create trigger crm_collab_revenue after insert or update or delete on public.collaborations
for each row execute function public.crm_sync_collab_revenue();

-- Gli Agent possono registrare la fattura dalla collaborazione/partecipazione,
-- ma importo e soggetto vengono letti dal DB, non decisi dal payload chiamante.
create or replace function public.crm_register_operational_invoice(payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  source_collab public.collaborations%rowtype;
  source_part public.partecipazioni_eventi%rowtype;
  invoice public.fatture_emesse%rowtype;
  source_collab_id uuid := nullif(payload->>'collab_id', '')::uuid;
  source_part_id uuid := nullif(payload->>'partecipazione_id', '')::uuid;
  invoice_date date;
  amount numeric;
  subject text;
  invoice_type text;
begin
  if not public.crm_has_access(false) then raise exception 'Accesso negato' using errcode = '42501'; end if;
  if (source_collab_id is null) = (source_part_id is null)
    or nullif(payload->>'contratto_id', '') is not null or nullif(payload->>'versamento_id', '') is not null
  then raise exception 'Sorgente fattura non valida'; end if;

  if source_collab_id is not null then
    select * into source_collab from public.collaborations where id = source_collab_id for update;
    if not found then raise exception 'Collaborazione non trovata'; end if;
    if not public.crm_has_access(true) and not coalesce(source_collab.fattura_emessa, false) then
      raise exception 'Confermare la fattura nella collaborazione';
    end if;
    select * into invoice from public.fatture_emesse where collab_id = source_collab_id order by created_at limit 1;
    amount := coalesce(source_collab.fee_management, source_collab.pagamento * 0.25, 0);
    select concat_ws(' - ', c.nome, source_collab.brand_nome) into subject from public.creators c where c.id = source_collab.creator_id;
    invoice_type := 'COLLAB';
  else
    select * into source_part from public.partecipazioni_eventi where id = source_part_id for update;
    if not found then raise exception 'Partecipazione non trovata'; end if;
    if coalesce(source_part.tipo, 'partecipante') <> 'partecipante' then raise exception 'Creator non partecipante'; end if;
    if not public.crm_has_access(true) and not coalesce(source_part.fattura_emessa, false) then
      raise exception 'Confermare la fattura nella partecipazione';
    end if;
    select * into invoice from public.fatture_emesse where partecipazione_id = source_part_id order by created_at limit 1;
    amount := coalesce(source_part.fee, 0);
    select concat_ws(' - ', c.nome, e.nome) into subject from public.creators c
      join public.eventi e on e.id = source_part.evento_id where c.id = source_part.creator_id;
    invoice_type := 'FIERA';
  end if;
  if public.crm_has_access(true) then
    -- Conserva i dati modificabili manualmente dagli Admin in Finance.
    amount := coalesce(nullif(payload->>'importo', '')::numeric, amount);
    subject := coalesce(nullif(payload->>'soggetto_nome', ''), subject);
  elsif invoice.id is not null then
    return jsonb_build_object('id', invoice.id);
  end if;
  invoice_date := coalesce(nullif(payload->>'data_fattura', '')::date, current_date);
  insert into public.fatture_emesse (mese, numero_fattura, data_fattura, soggetto_nome, importo, tipo, collab_id, partecipazione_id, link_documento, note)
  values (date_trunc('month', invoice_date::timestamp)::date, nullif(payload->>'numero_fattura', ''), invoice_date,
    coalesce(subject, 'Creator'), amount, invoice_type, source_collab_id, source_part_id,
    nullif(payload->>'link_documento', ''), nullif(payload->>'note', '')) returning * into invoice;
  if public.crm_has_access(true) then return to_jsonb(invoice); end if;
  return jsonb_build_object('id', invoice.id);
end;
$$;
revoke all on function public.crm_register_operational_invoice(jsonb) from public, anon;
grant execute on function public.crm_register_operational_invoice(jsonb) to authenticated;

commit;

select tablename, rowsecurity from pg_tables where schemaname = 'public'
  and tablename in (select tablename from pg_policies where schemaname = 'public' and policyname like 'crm_%')
order by tablename;
