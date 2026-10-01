begin;

alter table public.partecipazioni_eventi
  add column if not exists data_pagamento_agency date,
  add column if not exists data_pagamento_creator date;
alter table public.pagamenti_contratti add column if not exists importo numeric;
alter table public.fatture_emesse
  add column if not exists incassata boolean not null default false,
  add column if not exists data_incasso date;

-- Gli account inattivi non conservano privilegi attraverso token ancora validi.
create or replace function public.crm_current_role()
returns text language sql stable security definer set search_path = '' as $$
  select role::text from public.user_profiles where id = auth.uid() and attivo is true;
$$;
drop policy if exists crm_profile_read on public.user_profiles;
create policy crm_profile_read on public.user_profiles for select to authenticated
using ((select public.crm_has_access(true)) or (id = (select auth.uid()) and (select public.crm_mfa_satisfied())));

create schema if not exists crm_internal;
revoke all on schema crm_internal from public,anon,authenticated;
create table if not exists crm_internal.note_origins (
  id text primary key, timestamp text not null, operatore text not null
);
revoke all on crm_internal.note_origins from public,anon,authenticated;
-- Registrare solo metadati di note gia presenti; nessuna modifica ai testi storici.
do $$
declare t text;
begin
  foreach t in array array['creators','brands','clienti_terzi','collaborations','fiere_db','eventi','trattative_fiere','proposte_brand'] loop
    execute format('insert into crm_internal.note_origins(id,timestamp,operatore)
      select coalesce(n->>''id'', ''legacy-'' || coalesce(n->>''timestamp'','''') || ''-'' || coalesce(n->>''topic'','''') || ''-'' || coalesce(n->>''contenuto'','''')),
        coalesce(n->>''timestamp'',to_char(now() at time zone ''UTC'',''YYYY-MM-DD"T"HH24:MI:SS.US"Z"'')),
        coalesce(n->>''operatore'',''Operatore'')
      from public.%I p cross join lateral jsonb_array_elements(coalesce(p.note_log,''[]'')) n
      on conflict do nothing',t);
  end loop;
end;
$$;

-- Merge per ID: aggiunte concorrenti preservate, modifiche concorrenti rifiutate.
create or replace function public.crm_merge_notes()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  merged jsonb := case when TG_OP = 'UPDATE' then coalesce(OLD.note_log, '[]') else '[]'::jsonb end;
  item jsonb; existing jsonb; cleaned jsonb; base jsonb; note_id text; pos integer;
  origin crm_internal.note_origins%rowtype;
  operator_name text; stamp text := to_char(clock_timestamp() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"');
begin
  select coalesce(nullif(agente_nome,''), nome_completo, email, 'Operatore') into operator_name
    from public.user_profiles where id = auth.uid();
  operator_name := coalesce(operator_name, 'Sistema');
  for item in select value from jsonb_array_elements(coalesce(NEW.note_log, '[]')) loop
    note_id := coalesce(item->>'id', 'legacy-' || coalesce(item->>'timestamp','') || '-' || coalesce(item->>'topic','') || '-' || coalesce(item->>'contenuto',''));
    select value, ordinality::integer - 1 into existing, pos
      from jsonb_array_elements(merged) with ordinality where value->>'id' = note_id
      or (value->>'id' is null and 'legacy-' || coalesce(value->>'timestamp','') || '-' || coalesce(value->>'topic','') || '-' || coalesce(value->>'contenuto','') = note_id) limit 1;
    if found then
      if item ? '_base' then
        base := jsonb_build_object('topic',coalesce(existing->>'topic',''), 'contenuto',coalesce(existing->>'contenuto',''),
          'timestamp',coalesce(existing->>'timestamp',''), 'modificatoIl',coalesce(existing->>'modificatoIl',''));
        if base <> item->'_base' or coalesce((existing->>'_deleted')::boolean,false) then
          raise exception 'Nota modificata da un altro operatore. Ricarica e riprova.' using errcode = '40001';
        end if;
        cleaned := (existing || (item - '_base' - '_new')) ||
          jsonb_build_object('id',note_id,'timestamp',existing->>'timestamp','operatore',existing->>'operatore',
            'modificatoDa',operator_name,'modificatoIl',stamp);
        merged := jsonb_set(merged, array[pos::text], cleaned);
      end if;
      -- Nessuna base = copia o nota non modificata: non sovrascrivere quella corrente.
    else
      if item ? '_base' then raise exception 'Nota non piu disponibile. Ricarica e riprova.' using errcode = '40001'; end if;
      cleaned := (item - '_new' - '_base') || jsonb_build_object('id',note_id);
      insert into crm_internal.note_origins(id,timestamp,operatore) values(note_id,stamp,operator_name) on conflict do nothing;
      select * into origin from crm_internal.note_origins where id=note_id;
      cleaned := cleaned || jsonb_build_object('timestamp',origin.timestamp,'operatore',origin.operatore);
      merged := merged || jsonb_build_array(cleaned);
    end if;
  end loop;
  NEW.note_log := merged;
  return NEW;
end;
$$;
revoke all on function public.crm_merge_notes() from public, anon, authenticated;
do $$
declare t text;
begin
  foreach t in array array['creators','brands','clienti_terzi','collaborations','fiere_db','eventi','trattative_fiere','proposte_brand'] loop
    execute format('drop trigger if exists crm_notes_merge on public.%I',t);
    execute format('create trigger crm_notes_merge before insert or update of note_log on public.%I for each row execute function public.crm_merge_notes()',t);
  end loop;
end;
$$;

-- Aggiornare una trattativa non riapre eventi conclusi e non riusa altre edizioni.
create or replace function public.crm_sync_fair_edition(trattativa_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare t public.trattative_fiere%rowtype; e public.eventi%rowtype;
begin
  if not public.crm_has_access(false) then raise exception 'Accesso negato' using errcode='42501'; end if;
  select * into t from public.trattative_fiere where id=trattativa_id for update;
  if not found then raise exception 'Trattativa non trovata'; end if;
  if t.stato::text <> 'IN_TRATTATIVA' then return t.evento_id; end if;
  if t.fiera_db_id is not null then perform 1 from public.fiere_db where id=t.fiera_db_id for update; end if;
  if t.evento_id is not null then
    select * into e from public.eventi where id=t.evento_id for update;
    if e.id is not null and e.stato::text = 'CHIUSA' and e.data_inizio is not distinct from t.data_inizio then return e.id; end if;
    if e.id is not null and e.data_inizio is distinct from t.data_inizio then e := null; end if;
  end if;
  if e.id is null then
    select * into e from public.eventi where
      (trattativa_fiera_id=t.id or (t.fiera_db_id is not null and fiera_db_id=t.fiera_db_id))
      and data_inizio is not distinct from t.data_inizio
      order by created_at limit 1 for update;
  end if;
  if e.id is not null and e.stato::text = 'CHIUSA' then
    update public.trattative_fiere set evento_id=e.id where id=t.id;
    return e.id;
  end if;
  if e.id is null then
    insert into public.eventi(nome,tipo,circuito_id,fiera_db_id,trattativa_fiera_id,data_inizio,data_fine,location,citta,stato,note_log)
    values(t.nome,t.tipo,t.circuito_id,t.fiera_db_id,t.id,t.data_inizio,t.data_fine,t.location,t.citta,'APERTA',t.note_log)
    returning * into e;
  else
    update public.eventi set nome=t.nome,tipo=t.tipo,circuito_id=t.circuito_id,
      fiera_db_id=t.fiera_db_id,trattativa_fiera_id=t.id,data_inizio=t.data_inizio,
      data_fine=t.data_fine,location=t.location,citta=t.citta,note_log=t.note_log
      where id=e.id returning * into e;
  end if;
  update public.trattative_fiere set evento_id=e.id where id=t.id;
  return e.id;
end;
$$;
revoke all on function public.crm_sync_fair_edition(uuid) from public, anon;
grant execute on function public.crm_sync_fair_edition(uuid) to authenticated;

-- Il registro fatture e la sorgente vengono aggiornati nella stessa transazione.
create or replace function public.crm_invoice_source_sync()
returns trigger language plpgsql security definer set search_path = '' as $$
declare source_id uuid; latest public.fatture_emesse%rowtype;
begin
  for source_id in select distinct x from unnest(array[
    case when TG_OP <> 'INSERT' then OLD.collab_id end,
    case when TG_OP <> 'DELETE' then NEW.collab_id end]) x where x is not null loop
    perform 1 from public.collaborations where id=source_id for update;
    select * into latest from public.fatture_emesse where collab_id=source_id order by created_at desc,id desc limit 1;
    update public.collaborations set fattura_emessa=latest.id is not null,
      numero_fattura=latest.numero_fattura,data_fattura=latest.data_fattura where id=source_id;
  end loop;
  for source_id in select distinct x from unnest(array[
    case when TG_OP <> 'INSERT' then OLD.partecipazione_id end,
    case when TG_OP <> 'DELETE' then NEW.partecipazione_id end]) x where x is not null loop
    perform 1 from public.partecipazioni_eventi where id=source_id for update;
    select * into latest from public.fatture_emesse where partecipazione_id=source_id order by created_at desc,id desc limit 1;
    update public.partecipazioni_eventi set fattura_emessa=latest.id is not null,
      numero_fattura=latest.numero_fattura,data_fattura=latest.data_fattura where id=source_id;
  end loop;
  return null;
end;
$$;
revoke all on function public.crm_invoice_source_sync() from public, anon, authenticated;
drop trigger if exists crm_invoice_sync on public.fatture_emesse;
create trigger crm_invoice_sync after insert or update or delete on public.fatture_emesse
for each row execute function public.crm_invoice_source_sync();

-- Conversione idempotente: il preventivo e un budget totale, non per creator.
create or replace function public.crm_convert_deal(deal_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare t public.proposte_brand%rowtype; creator uuid; confirmed jsonb; amount numeric; existing jsonb; result jsonb := '[]'; created public.collaborations%rowtype;
begin
  if not public.crm_has_access(false) then raise exception 'Accesso negato' using errcode='42501'; end if;
  select * into t from public.proposte_brand where id=deal_id for update;
  if not found then raise exception 'Trattativa non trovata'; end if;
  select jsonb_agg(to_jsonb(c)) into existing from public.collaborations c where trattativa_id=deal_id;
  if existing is not null then return existing; end if;
  if t.stato::text <> 'CONTRATTO_FIRMATO' then raise exception 'Confermare prima il contratto firmato'; end if;
  confirmed := coalesce(to_jsonb(t.creator_confermati),'[]'::jsonb);
  if jsonb_array_length(confirmed)=0 then raise exception 'Nessun creator confermato'; end if;
  for creator in select value::uuid from jsonb_array_elements_text(confirmed) loop
    amount := nullif(t.fee_creator_map->>creator::text,'')::numeric;
    if amount is null and jsonb_array_length(confirmed)=1 then amount := t.importo_preventivo::numeric; end if;
    if amount is null or amount < 0 then raise exception 'Specificare la fee individuale di ogni creator prima della conversione'; end if;
    insert into public.collaborations(brand_id,trattativa_id,brand_nome,creator_id,sales,agente,senior,pagamento,fee_management,link_contratto,stato,pagato,contatto,note,note_log)
    values(t.brand_id,t.id,t.brand_nome,creator,t.sales,t.ima,t.agente,amount,round(amount*0.25,2),t.link_preventivo,'IN_LAVORAZIONE',false,t.contatto,coalesce(t.note_trattativa,t.note_strategiche),t.note_log)
    returning * into created;
    result := result || jsonb_build_array(to_jsonb(created));
  end loop;
  update public.proposte_brand set stato='COLLAB_GENERATA' where id=t.id;
  return result;
end;
$$;
revoke all on function public.crm_convert_deal(uuid) from public, anon;
grant execute on function public.crm_convert_deal(uuid) to authenticated;

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
    select * into invoice from public.fatture_emesse where collab_id = source_collab_id order by created_at desc,id desc limit 1;
    amount := coalesce(source_collab.fee_management, source_collab.pagamento * 0.25, 0);
    select concat_ws(' - ', c.nome, source_collab.brand_nome) into subject from public.creators c where c.id = source_collab.creator_id;
    invoice_type := 'COLLAB';
  else
    select * into source_part from public.partecipazioni_eventi where id = source_part_id for update;
    if not found then raise exception 'Partecipazione non trovata'; end if;
    if coalesce(source_part.tipo, 'partecipante') <> 'partecipante' then raise exception 'Creator non partecipante'; end if;
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
  end if;
  if invoice.id is not null then
    if public.crm_has_access(true) then return to_jsonb(invoice); end if;
    return jsonb_build_object('id', invoice.id);
  end if;
  invoice_date := nullif(payload->>'data_fattura', '')::date;
  if amount < 0 then raise exception 'Importo non valido'; end if;
  insert into public.fatture_emesse (mese, numero_fattura, data_fattura, soggetto_nome, importo, tipo, collab_id, partecipazione_id, link_documento, note)
  values (coalesce(date_trunc('month', invoice_date::timestamp)::date, nullif(payload->>'mese','')::date, date_trunc('month', (now() at time zone 'Europe/Rome'))::date), nullif(payload->>'numero_fattura', ''), invoice_date,
    coalesce(subject, 'Creator'), amount, invoice_type, source_collab_id, source_part_id,
    nullif(payload->>'link_documento', ''), nullif(payload->>'note', '')) returning * into invoice;
  if public.crm_has_access(true) then return to_jsonb(invoice); end if;
  return jsonb_build_object('id', invoice.id);
end;
$$;
revoke all on function public.crm_register_operational_invoice(jsonb) from public, anon;
grant execute on function public.crm_register_operational_invoice(jsonb) to authenticated;


create or replace function public.crm_confirm_event_receipt(participation_id uuid, paid boolean, payment_date date, invoice jsonb default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare p public.partecipazioni_eventi%rowtype;
begin
  if not public.crm_has_access(false) then raise exception 'Accesso negato' using errcode='42501'; end if;
  select * into p from public.partecipazioni_eventi where id=participation_id for update;
  if not found or coalesce(p.tipo,'partecipante') <> 'partecipante' then raise exception 'Partecipazione non valida'; end if;
  if paid and payment_date is null then raise exception 'Indicare la data incasso'; end if;
  update public.partecipazioni_eventi set pagato_agency=paid, data_pagamento_agency=case when paid then payment_date end where id=p.id;
  if invoice is not null then
    if not paid then raise exception 'Incasso non confermato'; end if;
    perform public.crm_register_operational_invoice(invoice || jsonb_build_object('partecipazione_id',p.id));
  end if;
  select * into p from public.partecipazioni_eventi where id=participation_id;
  return to_jsonb(p);
end;
$$;
revoke all on function public.crm_confirm_event_receipt(uuid,boolean,date,jsonb) from public,anon;
grant execute on function public.crm_confirm_event_receipt(uuid,boolean,date,jsonb) to authenticated;

create or replace function public.crm_confirm_collab_receipt(collaboration_id uuid, paid boolean, payment_date date, invoice jsonb default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c public.collaborations%rowtype;
begin
  if not public.crm_has_access(false) then raise exception 'Accesso negato' using errcode='42501'; end if;
  select * into c from public.collaborations where id=collaboration_id for update;
  if not found then raise exception 'Collaborazione non trovata'; end if;
  if paid and payment_date is null then raise exception 'Indicare la data incasso'; end if;
  update public.collaborations set pagato_agency=paid, data_pagamento_agency=case when paid then payment_date end,
    stato=case when c.stato::text='ANNULLATA' then c.stato
      when paid and c.pagato then 'COMPLETATA'
      when paid then 'ATTESA_PAGAMENTO_CREATOR'
      when c.pagato then 'ATTESA_PAGAMENTO_AGENCY' else 'IN_LAVORAZIONE' end
    where id=c.id;
  if invoice is not null then
    if not paid then raise exception 'Incasso non confermato'; end if;
    perform public.crm_register_operational_invoice(invoice || jsonb_build_object('collab_id',c.id));
  end if;
  select * into c from public.collaborations where id=collaboration_id;
  return to_jsonb(c);
end;
$$;
revoke all on function public.crm_confirm_collab_receipt(uuid,boolean,date,jsonb) from public,anon;
grant execute on function public.crm_confirm_collab_receipt(uuid,boolean,date,jsonb) to authenticated;

-- Evita conversioni duplicate anche tramite inserimenti diretti.
create or replace function public.crm_unique_deal_creator()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'UPDATE' and NEW.trattativa_id is not distinct from OLD.trattativa_id and NEW.creator_id is not distinct from OLD.creator_id then return NEW; end if;
  if NEW.trattativa_id is not null then
    perform pg_advisory_xact_lock(hashtextextended(NEW.trattativa_id::text,0));
    if exists(select 1 from public.collaborations where trattativa_id=NEW.trattativa_id and creator_id=NEW.creator_id and id<>NEW.id) then
      raise exception 'Collaborazione gia presente per questo creator e trattativa';
    end if;
  end if;
  return NEW;
end;
$$;
revoke all on function public.crm_unique_deal_creator() from public,anon,authenticated;
drop trigger if exists crm_unique_conversion on public.collaborations;
create trigger crm_unique_conversion before insert or update of trattativa_id,creator_id on public.collaborations
for each row execute function public.crm_unique_deal_creator();



-- Una scheda rimasta aperta non puo ripristinare spunte o numeri fattura obsoleti.
create or replace function public.crm_invoice_marker_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare latest public.fatture_emesse%rowtype;
begin
  if TG_TABLE_NAME='collaborations' then
    select * into latest from public.fatture_emesse where collab_id=NEW.id order by created_at desc,id desc limit 1;
  else
    select * into latest from public.fatture_emesse where partecipazione_id=NEW.id order by created_at desc,id desc limit 1;
  end if;
  NEW.fattura_emessa := latest.id is not null;
  NEW.numero_fattura := latest.numero_fattura;
  NEW.data_fattura := latest.data_fattura;
  return NEW;
end;
$$;
revoke all on function public.crm_invoice_marker_guard() from public,anon,authenticated;
drop trigger if exists crm_invoice_marker on public.collaborations;
create trigger crm_invoice_marker before insert or update of fattura_emessa,numero_fattura,data_fattura on public.collaborations
for each row execute function public.crm_invoice_marker_guard();
drop trigger if exists crm_invoice_marker on public.partecipazioni_eventi;
create trigger crm_invoice_marker before insert or update of fattura_emessa,numero_fattura,data_fattura on public.partecipazioni_eventi
for each row execute function public.crm_invoice_marker_guard();

-- Preservare metadati legacy prima di riallineare le spunte al registro.
create schema if not exists crm_archive;
revoke all on schema crm_archive from public,anon,authenticated;
create table if not exists crm_archive.invoice_markers (
  source_table text not null, source_id uuid not null, payload jsonb not null,
  archived_at timestamptz not null default now(), primary key(source_table,source_id)
);
revoke all on crm_archive.invoice_markers from public,anon,authenticated;
insert into crm_archive.invoice_markers(source_table,source_id,payload)
select 'collaborations',id,jsonb_build_object('fattura_emessa',fattura_emessa,'numero_fattura',numero_fattura,'data_fattura',data_fattura)
from public.collaborations where fattura_emessa or numero_fattura is not null or data_fattura is not null
on conflict do nothing;
insert into crm_archive.invoice_markers(source_table,source_id,payload)
select 'partecipazioni_eventi',id,jsonb_build_object('fattura_emessa',fattura_emessa,'numero_fattura',numero_fattura,'data_fattura',data_fattura)
from public.partecipazioni_eventi where fattura_emessa or numero_fattura is not null or data_fattura is not null
on conflict do nothing;
update public.collaborations c set
  fattura_emessa=exists(select 1 from public.fatture_emesse f where f.collab_id=c.id),
  numero_fattura=(select numero_fattura from public.fatture_emesse where collab_id=c.id order by created_at desc,id desc limit 1),
  data_fattura=(select data_fattura from public.fatture_emesse where collab_id=c.id order by created_at desc,id desc limit 1);
update public.partecipazioni_eventi p set
  fattura_emessa=exists(select 1 from public.fatture_emesse f where f.partecipazione_id=p.id),
  numero_fattura=(select numero_fattura from public.fatture_emesse where partecipazione_id=p.id order by created_at desc,id desc limit 1),
  data_fattura=(select data_fattura from public.fatture_emesse where partecipazione_id=p.id order by created_at desc,id desc limit 1);

commit;
