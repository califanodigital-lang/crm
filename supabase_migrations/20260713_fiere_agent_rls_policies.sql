drop policy if exists "fiere_db_authenticated_access" on public.fiere_db;
drop policy if exists "trattative_fiere_authenticated_access" on public.trattative_fiere;
drop policy if exists "eventi_authenticated_access" on public.eventi;

create policy "fiere_db_authenticated_access"
on public.fiere_db
for all
to authenticated
using (true)
with check (true);

create policy "trattative_fiere_authenticated_access"
on public.trattative_fiere
for all
to authenticated
using (true)
with check (true);

create policy "eventi_authenticated_access"
on public.eventi
for all
to authenticated
using (true)
with check (true);
