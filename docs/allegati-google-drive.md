# PDF delle proposte su Google Drive — v0.25.0

## Funzionamento

Nel log di Database Fiere e Trattative Fiere ogni nota salvata permette di caricare
un PDF alla volta, fino a 10 MB, scaricarlo e spostarlo nel cestino di Drive.
Per una nuova scheda/nota: aggiungere la nota, salvare la scheda e riaprirla.
Gli allegati sono salvati subito: Annulla sul modulo non annulla l'upload.
Prima di eliminare una nota rimuovere i suoi allegati. La cancellazione dell'intera
scheda non elimina i PDF da Drive: restano nell'archivio aziendale; la pulizia di
questi documenti va effettuata da un referente nel Drive.
Il caricamento non equivale all'invio della proposta: annotare separatamente quando
e a chi è stata inviata. Non vengono spedite email.

I file restano privati. Supabase conserva i metadati e il riferimento Drive;
download/upload passano dalla Edge Function con verifica della sessione,
profilo attivo Admin/Agent, MFA per chi l'ha attivata e accesso alla scheda via RLS.
Nessuna credenziale Google viene inviata al browser. Il PDF non viene salvato in
Supabase Storage. Se Drive non è configurato il CRM mostra un errore esplicito.

## Cosa chiedere al C3

1. Link della cartella destinata alle proposte, account aziendale proprietario
   (o referente autorizzato), e referente che possa autorizzare il collegamento.
2. Conferma se è una cartella in "Il mio Drive" o in un Drive condiviso Workspace.
   Questa implementazione usa OAuth e funziona in entrambi, con un account che
   possa aggiungere file e spostarli nel cestino nella cartella scelta.
3. Disponibilità del referente per un'autorizzazione Google iniziale. Non chiedere
   password. Chiarire che deve essere un account aziendale stabile, con spazio
   disponibile, perché revoche/disattivazioni richiederanno un nuovo collegamento.

Testo pronto:

> Abbiamo preparato nel CRM gli allegati PDF delle proposte. Per attivarli ci serve
> il link della cartella del vostro Drive dove conservarli e un referente con
> permessi di caricamento e gestione dei documenti. Con il referente configureremo
> il collegamento e faremo una singola autorizzazione tramite Google; non serve
> comunicarci password e gli altri operatori useranno soltanto il CRM.

## Configurazione a cura dello sviluppatore / referente IT

1. Applicare `supabase_migrations/20261001_drive_attachments.sql` nel SQL Editor.
   Richiede le tabelle fiere/trattative e `crm_has_access(boolean)` delle migrazioni
   precedenti. Non cambiare le policy esistenti di queste tabelle.
2. Nel progetto Google Cloud della C3 abilitare Google Drive API, configurare
   Google Auth Platform e creare un client OAuth di tipo applicazione web.
3. Registrare un redirect URI HTTPS esatto del flusso usato per l'autorizzazione.
   La release non include una pagina di collegamento OAuth nel CRM: l'autorizzazione
   iniziale è un passaggio assistito di configurazione. Si può usare OAuth Playground
   con **Use your own OAuth credentials**, registrando come redirect
   `https://developers.google.com/oauthplayground`. Non usare le credenziali
   predefinite del Playground: quelle proprie evitano la revoca automatica dei
   refresh token dopo 24 ore applicata dal Playground alle credenziali predefinite.
4. Per la cartella esistente identificata tramite ID, autorizzare lo scope
   `https://www.googleapis.com/auth/drive` con accesso offline e consenso esplicito.
   Lo scope è ampio: i permessi OAuth riguardano l'account; il backend limita la
   destinazione alla cartella configurata e gestisce soltanto gli ID registrati
   dal CRM. Lo scope `drive.file` richiede invece una selezione tramite Picker o
   una cartella creata dall'app: questa release non implementa quel flusso.
5. Scambiare il codice per ottenere un refresh token del nostro client. Non
   lasciare un'app esterna in Testing: con scope Drive il token scade dopo 7 giorni.
   Per Workspace valutare audience Internal; per account esterni configurare
   Production e verificare gli obblighi Google di verifica per lo scope richiesto
   e per l'effettiva distribuzione dell'app. Non promettere assenza di verifica.
6. Nei segreti delle Edge Functions Supabase impostare:

   - `GOOGLE_DRIVE_CLIENT_ID`
   - `GOOGLE_DRIVE_CLIENT_SECRET`
   - `GOOGLE_DRIVE_REFRESH_TOKEN`
   - `GOOGLE_DRIVE_FOLDER_ID` (ID finale del link `/folders/…`, senza parametri)

   Usare dashboard/secrets, mai variabili `VITE_*`, Git o chat/email in chiaro.
   Le variabili Supabase standard vengono fornite dalla piattaforma.
7. Pubblicare `supabase functions deploy drive-attachments`, mantenendo la verifica
   JWT; pubblicare il frontend. Non serve configurare un bucket Storage.
8. Collaudare con un PDF di prova: upload/download/rimozione per Admin e Agent,
   account inattivo bloccato, sessione MFA incompleta bloccata, file non-PDF e
   oltre 10 MB respinti, token revocato gestito senza perdere il log.
   Verificare il file nella cartella privata e il cestino dopo la rimozione.

Un errore di registrazione Supabase dopo upload provoca un tentativo di spostamento
nel cestino. Se fallisce, la Function registra l'ID del file per pulizia manuale.
Interruzioni di rete dopo il successo possono comunque lasciare un file archiviato:
prima di ripetere upload controllare l'elenco riaprendo la scheda.

## Riferimenti ufficiali

- https://developers.google.com/identity/protocols/oauth2/web-server
- https://developers.google.com/identity/protocols/oauth2 (scadenza Testing)
- https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- https://developers.google.com/workspace/drive/api/guides/manage-uploads
- https://supabase.com/docs/guides/functions/secrets

La release locale non applica SQL, non distribuisce Function e non collega account
remoti automaticamente. Il collaudo su Drive reale richiede le credenziali del C3.
