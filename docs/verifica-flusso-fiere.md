# Fiere: cosa dire al cliente e cosa fargli provare

Aggiornamento del 6 ottobre 2026, versione v0.26.0.

## Messaggio da mandare al cliente

Abbiamo sistemato i punti che ci hai segnalato. Ti chiediamo queste prove dopo l'aggiornamento, usando una fiera di prova e senza chiudere eventi su cui state ancora lavorando.

1. **Passaggio dal database alle trattative.** Inserire una fiera nel database non apre una trattativa automaticamente. Dopo averla contattata, premi **+ Trattativa** nella lista del database: ora lo trovi anche prima della scadenza del promemoria. Verifica che la fiera compaia nelle trattative. La data di contatto iniziale e quella di oggi: correggila se il contatto e avvenuto prima. Controlla le date della fiera per lavorare sull'edizione giusta.
2. **Ricerca della fiera.** Vai in **Trattative Fiere > Nuova Trattativa Fiera**. Sopra **Scheda DB Fiere** scrivi una parte del nome, anche piu lettere nel mezzo del nome. Il menu sotto deve mostrare le fiere corrispondenti: seleziona quella giusta. Puoi cercare anche per citta, luogo o circuito.
3. **Apertura dalla vista per data.** Nel database apri la vista raggruppata per mese e clicca in qualsiasi punto della card di una fiera. Deve aprirsi la scheda, che puoi consultare e modificare.
4. **Capire se una fiera e gia stata contattata.** Dopo aver creato una trattativa, torna al database. Sotto il nome della fiera devono comparire lo stato commerciale e la data del contatto. Se ci sono solo trattative chiuse, vedrai che e stata contattata in precedenza. Il sistema puo mostrare solo i contatti registrati nel CRM.
5. **Trattative ordinate per data.** In Trattative Fiere premi **Vedi tutto** e scegli **Data evento: crescente**, poi **decrescente**. Controlla che le date cambino ordine; le schede senza data restano in fondo. Prova anche **Dal / Al** per vedere solo un periodo: questo filtro era gia presente.
6. **Evento chiuso e archivio.** Su una fiera di prova, porta la trattativa in **In trattativa** e verifica che venga creato o collegato l'evento. Quando l'evento puo essere chiuso, chiudilo in **Fiere & Eventi**. Torna in Trattative Fiere: deve sparire dalle attive e comparire in **Archivio trattative**. Premi **Vedi tutto** e scegli **Tutti gli stati** se non lo trovi. La trattativa viene conservata, non eliminata.
7. **Contatti automatici dal circuito.** Nel database vai in **Impostazioni**, modifica un circuito e inserisci referente, email/contatto, telefono ed eventualmente **+ Aggiungi contatto**. Salva. Crea una nuova fiera e seleziona quel circuito: devono apparire i recapiti. Aggiungi un referente specifico della fiera, salva e riapri: devono esserci sia i contatti proposti sia quello aggiunto. Riapri il circuito: i suoi recapiti devono essere rimasti uguali. Prova anche a selezionare la fiera in una nuova trattativa: deve ereditare i contatti aggiuntivi.

Per ogni prova dicci se funziona; se trovi un problema, indica nome della fiera, passaggi fatti e cosa compare.

## Comportamento dei contatti

I recapiti del circuito sono una base modificabile nella singola scheda. I campi gia personalizzati non vengono sovrascritti. Se cambi circuito, i recapiti ancora uguali a quelli del precedente vengono sostituiti; i contatti aggiuntivi personalizzati restano. Rimuovere il circuito toglie i recapiti ancora uguali ai suoi, conservando quelli diversi. Un recapito identico a quello del circuito viene considerato ereditato.

Le fiere gia salvate non vengono aggiornate in massa quando cambi i contatti di un circuito. I recapiti storici scritti nelle note vanno riportati manualmente nei campi dedicati. I contatti aggiuntivi rimangono nelle schede database/trattativa; il dettaglio operativo evento non ha una rubrica dedicata.

## Prima del rilascio: intervento Supabase

Per la nuova rubrica applicare **supabase_migrations/20261006_circuit_contacts.sql** prima di pubblicare il frontend. La migrazione aggiunge referente, contatto, telefono e contatti aggiuntivi a circuiti_eventi, e contatti aggiuntivi a fiere_db e trattative_fiere. Non cancella dati e non cambia le policy di accesso. Non e stata eseguita sul database remoto.

Le precedenti correzioni di ricerca, vista per mese, ordine e archivio non richiedono migrazioni. L'archivio viene calcolato dallo stato dell'evento usando i collegamenti esistenti, senza riscrivere lo stato commerciale. Eventi senza collegamento non vengono abbinati per somiglianza del nome. Il passaggio In trattativa continua a usare la funzione server esistente crm_sync_fair_edition.

## Verifiche tecniche

Build di produzione, lint e 25 controlli mirati della rubrica e dell'archivio superati (node tests/fair-workflow.mjs). Le prove con account reale e la verifica della migrazione su Supabase restano da eseguire prima del rilascio. Nessuna pubblicazione o modifica del database remoto eseguita.
