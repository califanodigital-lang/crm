# Permessi Admin e Agent

La versione v0.22.1 applica una regola unica:

- Admin: tutto il CRM, inclusa Amministrazione.
- Agent: tutte le sezioni operative, senza Amministrazione.
- Amministrazione comprende Finance, Dashboard Agenti e Utenti.

Entrambi vedono la dashboard generale e tutte le trattative/collaborazioni.
I filtri per assegnatario rimangono disponibili, ma non vengono attivati automaticamente per gli Agent.
Responsabili, assegnatari, creazione/modifica/eliminazione e chiusura fiere non dipendono dal proprietario o dal ruolo, fuori da Amministrazione.
La verifica MFA rimane richiesta per gli account che l'hanno attivata.

## Aggiornamento Supabase

Eseguire `supabase_migrations/20261001_admin_agent_permissions.sql` e pubblicare il CRM aggiornato nello stesso rilascio.
Il nuovo codice dipende dalle viste e dalla funzione di registrazione fatture create dalla migrazione.

La migrazione:

- Sostituisce le policy delle sole 22 tabelle CRM elencate nel file; attiva RLS e mantiene il controllo MFA.
- Consente CRUD operativo ad Admin e Agent, anche sui record di altri operatori.
- Riserva i registri amministrativi agli Admin.
- Permette agli Agent di leggere il proprio profilo, ma non di cambiarlo o cambiare ruolo.
- Espone una directory di operatori per i menu commerciali, senza email o stipendi; conserva le percentuali necessarie ai calcoli commerciali.
- Espone gli aggregati mensili della dashboard senza aprire il registro revenue agli Agent.
- Sposta il sync delle revenue da chiamate client a un trigger, nella stessa transazione della collaborazione.
- Consente la registrazione di fatture operative tramite una funzione controllata: per Agent importo e soggetto derivano dal record commerciale e viene restituito solo l'ID della registrazione, senza dati amministrativi; Admin conserva le modifiche manuali in Finance.

Non cancella o riscrive dati storici. Gli indici revenue vengono adeguati per avere una riga automatica per collaborazione e una riga manuale per creator/mese.
Questo evita che due collaborazioni dello stesso creator nello stesso mese blocchino il secondo salvataggio.
Se esistono gia duplicati per collaborazione o per revenue manuale creator/mese, la migrazione fallisce e la transazione viene annullata: non eliminare record per forzarla; verificare prima i dati.

Le vecchie policy sulle tabelle indicate vengono intenzionalmente sostituite: limiti per proprietario o vecchi ruoli non devono continuare a negare operazioni autorizzate.
Eventuali trigger, viste, Storage o funzioni personalizzate esterne al repository vanno verificati separatamente.
La Edge Function `admin-create-user`, non presente nel repository, deve mantenere il controllo del ruolo Admin sul server e il controllo MFA descritto in `docs/autenticazione-due-fattori.md`.

## Verifiche sul progetto live

1. Login Admin: tutte le sezioni visibili; operazioni commerciali e amministrative disponibili.
2. Login Agent: tutte le sezioni operative disponibili; niente gruppo Amministrazione.
3. Con Agent aprire direttamente `/finance`, `/agenti`, `/users`: redirect alla dashboard, senza montare la pagina amministrativa o caricarne i dati.
4. Modificare responsabili e assegnatari di una trattativa/collaborazione creata da un altro operatore.
5. Creare/modificare/rimuovere creator partecipanti e chiudere una fiera con pagamenti completati.
6. Registrare pagamento agency e fattura da collaborazione/fiera; Admin ritrova la fattura in Finance.
7. Completare due collaborazioni dello stesso creator nello stesso mese; entrambe devono avere revenue automatica.
8. Aggiornare il compenso o annullare il completamento: la sola revenue collegata si aggiorna o viene rimossa; quella manuale rimane intatta.
9. Tentare via API di leggere registri Finance o di aggiornare il proprio ruolo con Agent: accesso negato.
10. Verificare login con e senza MFA, anche ricaricando la pagina prima di inserire il codice.

## Test locali

`node --test tests/permissions.test.js tests/mfaOperations.test.js`

Le policy e i trigger sono stati provati anche su PostgreSQL temporaneo tramite PGlite, con uno schema di prova costruito sui campi usati dal CRM. Questo non sostituisce la verifica dello schema reale Supabase.
Il test non usa credenziali o dati live e non aggiunge dipendenze runtime al CRM.

```powershell
npm install --prefix "$env:TEMP\c3-crm-permission-tests" --no-save --ignore-scripts @electric-sql/pglite
node tests/permissions-db.mjs "$env:TEMP\c3-crm-permission-tests\node_modules\@electric-sql\pglite\dist\index.js"
```
