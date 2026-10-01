# Pubblicare Tasks

1. Verificare che il server sia aggiornato ai permessi e alle correzioni audit
   v0.23.0. La nuova tabella usa `crm_has_access(false)` gia presente.
2. Eseguire `supabase_migrations/20261001_tasks.sql` nel SQL Editor Supabase.
3. Pubblicare il frontend e ricaricare il CRM.
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

Non ci sono email o aggiornamenti realtime: la lista si aggiorna al ritorno
alla finestra o tramite Aggiorna.
