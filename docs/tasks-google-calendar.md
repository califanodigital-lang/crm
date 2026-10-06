# Tasks e Google Calendar aziendale - v0.28.0

## Comportamento

Il CRM crea un solo evento nel calendario aziendale per ogni task con scadenza.
L'evento copre l'intera giornata di scadenza e non blocca la disponibilita.
Titolo, descrizione e link al CRM sono inclusi; tutti gli assegnatari attivi
sono invitati agli indirizzi email dei loro profili CRM. I destinatari vedono
anche gli altri invitati e il contenuto della task. Un indirizzo mancante
impedisce l'invio e viene segnalato nella coda: correggere il profilo e
modificare la task per aggiornare i destinatari.

Google puo richiedere l'accettazione dell'invito prima di mostrare l'evento
nel calendario personale, secondo le impostazioni di ogni destinatario.
L'invio usa `sendUpdates=all`; i promemoria restano quelli di Google.

Le modifiche vengono applicate allo stesso evento. Il completamento aggiunge
[Completata] al titolo e conserva lo storico nel calendario. Rimuovere la
scadenza o eliminare la task cancella l'evento e invia l'aggiornamento agli
invitati. Reinserire successivamente una scadenza crea un nuovo evento.
Una task senza scadenza non genera eventi. Gli account disattivati non
ricevono nuovi inviti quando la task viene sincronizzata.

La sincronizzazione e a senso unico, dal CRM a Google. Correggere le task nel
CRM. Le risposte degli invitati sono conservate negli aggiornamenti. Non
cancellare manualmente gli eventi creati dal CRM: se succede, rimuovere la
scadenza nel CRM, attendere la sincronizzazione, poi reinserirla.
Il cambio di email nel profilo richiede una modifica della task per
aggiornare i destinatari. Cambiare calendario configurato non sposta gli
eventi esistenti: i loro riferimenti restano al calendario originale.

## Cosa serve dal cliente

- ID del calendario aziendale scelto (Impostazioni Google Calendar > Integra
  calendario > ID calendario).
- Un referente con un account Google aziendale stabile e permesso di
  modificare eventi su quel calendario, per autorizzare il collegamento.
- Conferma che le email nei profili degli assegnatari siano corrette.

Non occorrono le password o il collegamento Google di ogni singolo utente.
Il collegamento Drive gia previsto non include automaticamente Calendar.

## Preparazione Supabase

Prima del nuovo frontend, applicare nell'ordine:

1. `20261001_tasks.sql`, se Tasks non e ancora installata.
2. `20261001_tasks_delete.sql`, se mancano i permessi di cancellazione.
3. `20261006_tasks_details.sql`.
4. `20261006_tasks_assignees.sql`.
5. `20261006_tasks_calendar.sql`.

Le ultime migrazioni aggiungono gli assegnatari aggiuntivi, una coda privata,
la configurazione e le funzioni server per elaborarla. Non eliminano task o
modificano le policy operative preesistenti. La coda non e leggibile dagli
utenti; il frontend legge soltanto lo stato tramite una RPC che verifica
accesso CRM e MFA. La cancellazione di una task conserva nella coda il lavoro
necessario a rimuovere l'evento.

L'integrazione nasce DISATTIVATA. Finche non viene attivata, Tasks funziona
normalmente e mostra Google Calendar non attivo sulle task con scadenza.

## Autorizzazione Google

1. Nel progetto Google Cloud abilitare Google Calendar API e configurare il
   consenso OAuth e un client OAuth per applicazione web.
2. Usare un client proprio nel Google OAuth Playground (impostazioni > Use
   your own OAuth credentials); aggiungere temporaneamente il redirect
   `https://developers.google.com/oauthplayground` al client, se si usa questo
   strumento per l'autorizzazione iniziale.
3. Far autorizzare il referente con lo scope
   `https://www.googleapis.com/auth/calendar.events` e accesso offline.
   Conservare il refresh token nei segreti Supabase, mai nel frontend,
   nel repository, nei documenti o nei messaggi di assistenza.
4. Il progetto OAuth deve essere configurato per l'uso continuativo; la
   modalita Testing di un'app esterna puo far scadere il refresh token.
   Verificare i requisiti di pubblicazione/verifica dell'app Google.

## Segreti della Edge Function

Configurare in Supabase Functions > Secrets:

- `GOOGLE_CALENDAR_CLIENT_ID`
- `GOOGLE_CALENDAR_CLIENT_SECRET`
- `GOOGLE_CALENDAR_REFRESH_TOKEN`
- `GOOGLE_CALENDAR_ID`
- `CRM_APP_URL`: URL HTTPS del CRM, senza credenziali o token.
- `TASK_CALENDAR_WORKER_SECRET`: segreto casuale lungo dedicato al worker.

SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono forniti dal runtime Supabase.
Non usare credenziali Drive come refresh token Calendar senza aver autorizzato
anche lo scope Calendar. Gli account OAuth possono coincidere, ma i segreti
sono separati per evitare di alterare l'integrazione Drive.

Pubblicare:

```powershell
supabase functions deploy task-calendar --no-verify-jwt
```

La funzione non e chiamata dal browser: accetta solo POST con l'header
`x-task-calendar-secret` valido. `--no-verify-jwt` e necessario per il worker
pianificato; l'autenticazione e il segreto dedicato, non una funzione aperta.

## Job pianificato

Abilitare pg_cron e pg_net dal dashboard Supabase. Salvare in Vault due
segreti, tramite dashboard oppure SQL Editor, senza committarne i valori:

- `task_calendar_worker_url`: URL HTTPS della funzione, per esempio
  `https://PROJECT.supabase.co/functions/v1/task-calendar`.
- `task_calendar_worker_secret`: lo stesso TASK_CALENDAR_WORKER_SECRET.

Pianificare una chiamata ogni minuto (non creare piu job con lo stesso scopo):

```sql
select cron.schedule(
  'c3-task-calendar-worker',
  '* * * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets
              where name = 'task_calendar_worker_url'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-task-calendar-secret', (select decrypted_secret from vault.decrypted_secrets
                                  where name = 'task_calendar_worker_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 90000
    );
  $$
);
```

Dopo aver verificato segreti, funzione e job, attivare dal SQL Editor:

```sql
update public.task_calendar_config set enabled = true where id = true;
```

Il server elabora fino a cinque task per chiamata. Normalmente gli inviti
partono al giro successivo del job; code lunghe o errori possono ritardare
l'invio. I tentativi falliti hanno attese crescenti fino a un'ora. Una nuova
modifica alla task rende nuovamente pronto il lavoro. ID evento persistente,
lease e versione del lavoro impediscono la creazione di un nuovo evento ad
ogni retry e conservano le modifiche arrivate durante una sincronizzazione.
Non e garantita una singola email in caso di retry dopo una risposta persa.

Le task gia esistenti non vengono spedite tutte all'attivazione. Per
sincronizzarne una, modificarne un dato significativo e salvarla.
Per sospendere nuovi inviti impostare enabled = false: il worker si ferma;
le modifiche/cancellazioni degli eventi gia gestiti restano in coda per
quando il collegamento viene riattivato.

## Prove da mandare al cliente

1. Crea una task di prova con scadenza, lascia te come principale e aggiungi
   un collega. Deve comparire in Le mie task per entrambi.
2. Attendi la sincronizzazione e premi Aggiorna: deve apparire Google Calendar:
   sincronizzato. Controllate le email di invito e il calendario aziendale.
3. L'evento deve essere nella data di scadenza e includere titolo e descrizione.
   Se non appare nel calendario personale, aprite l'invito e accettatelo.
4. Cambia titolo e scadenza: deve aggiornarsi lo stesso evento.
5. Aggiungi/togli un assegnatario e verifica che cambino gli invitati.
6. Completa la task: lo stato e condiviso nel CRM e il titolo Google diventa
   [Completata]. Riaprila per togliere questa indicazione.
7. Togli la scadenza e poi prova a eliminare una diversa task di prova: i
   rispettivi eventi devono sparire. Una task senza scadenza non invia inviti.

## Verifiche eseguite e limiti

Build e lint superati. Test locali del servizio Tasks, del payload Calendar
e delle richieste Google simulate; test PostgreSQL locale su migrazioni ripetibili, conservazione dei
dati, accesso, assegnatari, retry, versioni concorrenti e cancellazioni.
Nessuna email reale inviata e nessuna migrazione/configurazione remota applicata.
Verificare autorizzazione OAuth, runtime Edge, job e inviti reali prima del rilascio.

Riferimenti ufficiali:

- https://developers.google.com/workspace/calendar/api/concepts/inviting-attendees-to-events
- https://developers.google.com/workspace/calendar/api/v3/reference/events/insert
- https://developers.google.com/identity/protocols/oauth2/web-server
- https://supabase.com/docs/guides/functions/schedule-functions
