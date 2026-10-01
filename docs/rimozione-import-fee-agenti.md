# Rimozione Import e commissioni agenti

La versione v0.22.2 elimina Import, la dipendenza Excel e le commissioni
degli agenti. Le responsabilita di ricerca, contatto e chiusura restano.
Restano anche fissi mensili e importi gia pagati, i compensi creator e le fee
di management dell'agenzia.

## Supabase e pubblicazione

1. Aggiornare prima la Edge Function `admin-create-user`: togliere le variabili
   `feeRicerca`, `feeContatto`, `feeChiusura`, l'array `fees` e il relativo controllo.
   Mantenere invece il controllo `!Number.isFinite(fissoMensile) || fissoMensile < 0`.
   Nell'upsert rimuovere `fee_ricerca`, `fee_contatto`, `fee_chiusura` e `riceve_fee`.
   Non cambiare verifica token, MFA, ruolo ADMIN e rollback.
2. Pubblicare il CRM v0.22.2. Funziona anche prima di rimuovere le colonne obsolete.
3. Dopo aver applicato la migrazione dei permessi Admin/Agent, eseguire
   `supabase_migrations/20261001_remove_agent_fees.sql` nel SQL Editor.
4. Far ricaricare il CRM agli operatori: vecchie schede potrebbero inviare ancora
   campi delle commissioni dopo la rimozione delle colonne.

La migrazione salva i vecchi valori in `crm_archive.agent_commissions`, schema
privato non accessibile agli utenti API, poi elimina le colonne obsolete e
aggiorna la directory degli operatori. Non elimina utenti, collaborazioni o
pagamenti. Non usa CASCADE: eventuali dipendenze server aggiuntive causano
rollback invece di essere eliminate automaticamente.

Non rieseguire successivamente la vecchia migrazione dei permessi: la sua
definizione storica della directory contiene colonne ora rimosse.
Eventuali trigger server personalizzati che scrivono le commissioni vanno
adeguati prima della migrazione; il loro codice non e presente nel repository.

## Verifica rapida

- Creazione e modifica utenti: niente percentuali o flag commissioni.
- Collaborazioni: responsabilita modificabili, nessun calcolo commissioni.
- Finance e Dashboard Agenti: solo fisso, totale fisso e pagamenti registrati.
- La vecchia URL `/import` torna alla dashboard e non carica alcun importatore.
- MFA disponibile per Admin e Agent dalla pagina Sicurezza account.
