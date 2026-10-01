# Pubblicazione correzioni audit v0.23.0

## Ordine server e applicazione

Questa release dipende da nuove RPC, trigger e colonne.
Programmare un breve intervallo senza modifiche ai record e far chiudere
le vecchie schede del CRM. Non applicare la migrazione mentre gli operatori
stanno registrando pagamenti o note.

1. Verificare un backup Supabase e che siano gia state applicate le migrazioni
   permessi Admin/Agent e rimozione commissioni.
2. Pubblicare la Edge Function aggiornata presente in
   `supabase/functions/admin-create-user/index.ts`, tramite dashboard
   oppure `supabase functions deploy admin-create-user`.
   Il controllo ADMIN richiede ora anche `attivo = true`; MFA resta facoltativa
   ma obbligatoria nella sessione per chi ha un fattore verificato.
3. Eseguire `supabase_migrations/20261001_audit_crm_fixes.sql` nel SQL Editor.
4. Pubblicare il frontend v0.23.0 e far ricaricare completamente il CRM.
5. Collaudare Admin e Agent su record di prova, non su movimenti reali.

La migrazione e transazionale e idempotente. E stata provata su PostgreSQL
temporaneo con schema di test, non sul tuo schema live.
Se lo schema live ha trigger o tipi diversi, non aggirare errori con CASCADE:
conservare il messaggio e verificare la dipendenza.

## Modifiche server

- Account inattivi senza accesso operativo/amministrativo via RLS e RPC.
  Il profilo personale resta leggibile per mostrare un messaggio di account inattivo.
- Nuove date incasso e pagamento creator per le partecipazioni eventi.
- Stato e data incasso per fatture manuali.
- Importo effettivo dei pagamenti contratti, separato dal canone corrente;
  gli importi storici mancanti restano da completare, senza stime automatiche.
- Merge note per ID, timestamp/autore dal server, rilevazione conflitti.
  Le cancellazioni conservano un tombstone invisibile per evitare la ricomparsa
  da schede vecchie; i metadati di creazione sono in uno schema privato.
- Sincronizzazione delle edizioni fiere senza riaprire quelle chiuse.
- Registro fatture e spunte sorgente allineati da trigger, incluso aggiornamento
  e cancellazione. Ricevute operative atomiche insieme all'eventuale fattura.
- Conversione ADV atomica e idempotente; piu creator richiedono fee individuali.
  Il preventivo non viene copiato integralmente su ogni creator.
- Archivio privato dei vecchi riferimenti fattura prima del riallineamento.

Non vengono eliminati utenti, collaborazioni, partecipazioni, testi storici
o fatture multiple preesistenti. Non si inventano date dei pagamenti storici.

## Controlli sui dati storici

Le vecchie spunte fattura senza corrispondente voce nel registro vengono azzerate:
numero e data originari restano in `crm_archive.invoice_markers`.
Rivedere queste posizioni e registrare le fatture esterne effettivamente esistenti,
senza ricreare quelle gia presenti.

Query di controllo da SQL Editor (non eseguibile dagli operatori CRM):

```sql
select a.source_table, a.source_id, a.payload
from crm_archive.invoice_markers a
where (a.source_table = 'collaborations' and not exists (
  select 1 from public.fatture_emesse f where f.collab_id = a.source_id
)) or (a.source_table = 'partecipazioni_eventi' and not exists (
  select 1 from public.fatture_emesse f where f.partecipazione_id = a.source_id
));

select trattativa_id, creator_id, count(*)
from public.collaborations
where trattativa_id is not null
group by trattativa_id, creator_id having count(*) > 1;

select collab_id, partecipazione_id, count(*)
from public.fatture_emesse
where collab_id is not null or partecipazione_id is not null
group by collab_id, partecipazione_id having count(*) > 1;
```

Le duplicazioni storiche vanno riconciliate manualmente; la release evita nuove
conversioni duplicate ma non decide quale record storico cancellare.

Le vecchie date ricontatto/followup potenzialmente errate non vengono corrette
in massa: alcune potrebbero essere state personalizzate.
Verificare le date calcolate prima della release; da ora il calcolo usa date
civili e l'ultimo giorno valido del mese quando necessario.

## Verifiche consigliate

- Disattivare un Agent di prova: API operative negate anche con token gia ottenuto.
- Cambiare ruolo o attivazione: il fisso dell'utente deve restare invariato.
- Modificare un cliente dai contratti: dati fiscali e note precedenti preservati.
- Registrare incasso e fattura di una fiera; eliminare la fattura e verificare la spunta.
- Ripetere una conversione ADV: nessuna nuova copia; verificare budget individuali.
- Modificare una trattativa collegata a un evento chiuso: nessuna riapertura.
- Usare due schede per aggiungere note diverse e poi modificare la stessa nota.
- Provare un pagamento senza data: avviso Finance e nessun totale mensile inventato.
- Verificare gli incassi manuali e i rimborsi pagati senza doppie registrazioni.

## Limiti verificabili solo sul server

Non sono stati ispezionati DB live, configurazione Supabase Auth, log Edge
o documenti reali. Non sono disponibili test browser end-to-end nell'ambiente.
Il controllo automatico non sostituisce questo collaudo di pubblicazione.
