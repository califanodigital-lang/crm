# Pubblicare Tasks

1. Verificare che il server sia aggiornato ai permessi e alle correzioni audit
   v0.23.0. La nuova tabella usa `crm_has_access(false)` gia presente.
2. Eseguire `supabase_migrations/20261001_tasks.sql` nel SQL Editor Supabase.
3. Eseguire anche `supabase_migrations/20261006_tasks_details.sql`, poi pubblicare il frontend e ricaricare il CRM.
4. Creare una task di prova con Admin, assegnarla a un Agent e aprire Tasks
   con quell'account. Aggiornare la lista e completarla; controllare anche
   Mostra completate e la riapertura togliendo la spunta.

La migrazione crea solo tabella tasks, indice, trigger e policy dedicati.
Non modifica dati esistenti o Edge Function. Non richiede Realtime,
segreti aggiuntivi o configurazioni Auth.

Admin e Agent hanno accesso a tutte le task, coerentemente con i permessi
operativi del CRM; Le mie task e un filtro, non una barriera di accesso.
Gli account inattivi e le sessioni prive della verifica MFA richiesta sono
bloccati dai controlli server esistenti.

Autore e date sono assegnati dal server. I nuovi assegnatari devono essere
operatori attivi. Le task di utenti successivamente disattivati restano
conservate e visibili in Tutte. Il completamento conserva lo storico.
Il cestino elimina definitivamente una task, solo dopo conferma; usare la
spunta di completamento quando si vuole mantenere traccia del lavoro fatto.

## Aggiornamento cancellazione v0.24.1

Se la tabella Tasks e gia stata creata, eseguire soltanto
`supabase_migrations/20261001_tasks_delete.sql` nel SQL Editor, prima del deploy.
Per una prima installazione lo script `20261001_tasks.sql` include gia il permesso.
Admin e Agent possono eliminare le task; ruolo attivo e MFA restano verificati.
Non servono modifiche alle Edge Function.

La lista si aggiorna al ritorno alla finestra o tramite Aggiorna. Con il
collegamento Google Calendar attivo, gli assegnatari ricevono gli inviti email
delle task con scadenza.

## Descrizione, modifica e scadenza - v0.27.0

Se Tasks e gia attiva, applicare `supabase_migrations/20261006_tasks_details.sql`
nel SQL Editor Supabase prima di pubblicare il nuovo frontend.
La migrazione aggiunge soltanto `description` (testo facoltativo, massimo
5.000 caratteri) e `due_date` (data facoltativa) alla tabella `tasks`.
Le task esistenti restano senza descrizione e scadenza finche non vengono
modificate. Policy, permessi e trigger di completamento rimangono quelli
esistenti. Non servono nuove Edge Function o configurazioni.
La migrazione non e stata applicata al database remoto.

### Cosa dire al cliente per la prova

1. In Tasks crea una task di prova con titolo, descrizione e scadenza.
   Premi Aggiungi: devi leggere descrizione e scadenza nella lista.
2. Premi Modifica sulla task: cambia testo, descrizione, scadenza,
   assegnatario o urgenza, poi Salva modifiche. Ricarica per verificare
   che i dati siano conservati. Se cambi assegnatario, cerca la task in Tutte.
3. Modifica di nuovo il testo e premi Annulla: la task deve restare uguale.
4. Imposta una scadenza di ieri: una task ancora da completare deve mostrare
   Scaduta. La scadenza di oggi non viene indicata come scaduta.
5. Completa la task, attiva Mostra completate e modificala: deve restare
   completata. Togli la spunta per riaprirla.
6. Svuota descrizione e scadenza e salva: devono sparire dalla lista.
   Le task possono continuare a essere create anche con il solo titolo.

La scadenza e una data senza orario; il confronto usa il giorno corrente
in Italia. Con il collegamento aziendale attivo genera un evento e inviti Google Calendar;
non aggiunge automaticamente voci alla Agenda interna.

Verifiche locali: build e lint superati; `node tests/task-details.mjs`
verifica i dati inviati dal servizio, gli aggiornamenti parziali e gli errori.
La migrazione e il flusso completo con account reale restano da verificare
su Supabase prima del rilascio.

## Assegnatari multipli e Calendar - v0.28.0

Applicare, dopo la migrazione dei dettagli:

1. `supabase_migrations/20261006_tasks_assignees.sql`.
2. `supabase_migrations/20261006_tasks_calendar.sql`.

Gli assegnatari multipli funzionano anche con Calendar disattivato.
L'utente corrente resta il principale iniziale; altri operatori si selezionano
con le spunte. La stessa task compare nelle liste personali di tutti gli
assegnatari. Il completamento e unico e condiviso.

Per attivare gli inviti serve anche Google OAuth, la Edge Function e un job
pianificato: seguire `docs/tasks-google-calendar.md`. Le migrazioni lasciano
Calendar disattivato e non inviano gli eventi storici in massa.

Prova cliente: crea una task con scadenza, lascia te come principale e aggiungi
un collega. Entrambi devono trovarla in Le mie task. Dopo l'attivazione Calendar,
controllate gli inviti email e l'evento giornaliero alla data giusta. Cambia
scadenza e togli un assegnatario: deve aggiornarsi lo stesso evento. Togli
la scadenza o elimina la task: deve essere cancellato dal calendario.

## Ricerca - v0.28.1

La barra filtra per titolo, descrizione e tutti gli assegnatari. Funziona
anche con una parte del testo e senza distinzione fra maiuscole e minuscole.
Restano attivi Le mie task / Tutte e Mostra completate. Per cercare ovunque,
selezionare Tutte e attivare Mostra completate; svuotare la barra per rimuovere
la ricerca. Nessuna migrazione Supabase richiesta per questa modifica.
