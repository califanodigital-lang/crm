# Finance: guida per gli operatori

CRM C3 Agency - v0.23.0 - 1 ottobre 2026

## Scopo e accesso

Finance e riservata agli amministratori. Gli Agent aggiornano collaborazioni
e partecipazioni agli eventi, che alimentano anche i riepiloghi Finance.
Una fattura registrata non equivale a un incasso.
Una spunta di pagamento non esegue un bonifico.
Il CRM registra le fatture: non emette documenti fiscali e non li invia a servizi esterni.

## Mese e riepiloghi

Scegli in alto il mese di riferimento.

- **Incassi registrati**: importi complessivi ADV e fiere con incasso confermato
  nel mese, versamenti verificati, contratti pagati e fatture manuali incassate.
- **Pagamenti registrati**: quote creator, tranche pagate, spese pagate o
  rimborsate, fissi agenti registrati e uscite varie effettivamente pagate.
- **Saldo movimenti registrati**: differenza fra quei due totali.
- **Fatturato**: importi del registro fatture del mese, anche se non incassati.

Per ADV e fiere si conta l'incasso complessivo, poi si sottrae il pagamento
al creator. Non si usa la sola fee C3 per l'incasso e contemporaneamente
il compenso creator come costo: sarebbe una doppia sottrazione.
Le fatture collegate a un'attivita non vengono sommate nuovamente agli incassi.

Questi totali comprendono solo i movimenti censiti nel CRM:
non rappresentano il saldo bancario, un utile fiscale o una riconciliazione automatica.
Versamenti verificati e pagamenti agenti sono attribuiti al mese registrato;
gli altri movimenti usano la data effettiva di incasso o pagamento.

I movimenti storici pagati/incassati con data o importo mancanti sono segnalati ed esclusi
dai totali mensili. Completa le date reali: non sostituirle automaticamente con oggi.

Il previsto resta distinto dai movimenti: la riga di riepilogo mostra
i crediti ADV/fiere ancora da incassare e le quote creator ancora da pagare
dopo l'incasso agency, su tutti i mesi. I contratti mostrano separatamente
i canoni previsti, anche quando non ancora pagati.

## Da fatturare e incassare

Questo pannello riguarda tutti i mesi, indipendentemente dal mese selezionato.
Raccoglie ADV non annullate e partecipazioni confermate alle fiere che
non risultano ancora sia fatturate sia incassate.

Ogni riga mostra attivita, creator, importo complessivo e due stati distinti:
fattura da registrare/registrata e incasso da ricevere/ricevuto.
Scompare quando entrambi risultano completati.

Per un incasso ADV apri la collaborazione e aggiorna il pagamento agency.
Per una fiera apri la partecipazione e aggiorna il pagamento agency,
indicando la data incasso.
Quando registri anche la fattura, pagamento e fattura vengono salvati insieme:
se l'operazione fallisce, il CRM non ne considera riuscita solo una parte.
Rimuovere un incasso non elimina la fattura gia registrata.

## Creator da pagare

Il creator compare dopo la conferma dell'incasso agency se resta una quota
fee da saldare. Questo pannello comprende tutti i mesi.

Per le fiere la quota creator e il 75% della fee complessiva.
Per le ADV e l'importo complessivo meno la fee di management della collaborazione.
Le tranche gia pagate riducono il residuo ADV.

Esempio: fiera da 1.000 euro, quota creator 750 euro.
Un treno da 80 euro resta separato dalla percentuale della fee.

Premi **Segna pagato** solo dopo il saldo effettivo:
viene registrata la data corrente; per le ADV vengono saldate anche le tranche.
Se stai ricostruendo un pagamento storico, inserisci invece la data reale
nel record operativo. Nelle fiere trovi le date nella modifica della partecipazione.

## Rimborsi e spese

Per ogni voce puoi indicare descrizione, importo e chi la gestisce:
agenzia o creator. Questo indica chi organizza la spesa, non che sia gia pagata.

Usa **Pagata / rimborsata** quando l'agenzia ha effettivamente sostenuto
la spesa o rimborsato il creator; indica anche la data.
Solo queste voci alimentano i pagamenti registrati del mese.
Se il creator sostiene una spesa senza rimborso da parte dell'agenzia,
non segnare un movimento agency.

I rimborsi non modificano il 75% e non fanno parte del totale delle fee creator.
Non registrare la stessa spesa anche in Uscite Varie.

## Scheda Entrate

### Fee Collaborazioni

Raccoglie le fee C3 delle ADV incassate nel mese, anche se il creator
deve ancora essere pagato. **+ Fattura** apre una registrazione collegata.
Controlla importo, soggetto, numero, data e documento.

Il valore della fee in questa tabella e la quota C3; non confonderlo
con l'incasso complessivo usato nel riepilogo dei movimenti.

### Versamenti Creator

Sono importi versati dai creator all'agenzia, non pagamenti ai creator.
Registra creator, importo e riferimenti e verifica il movimento.
Solo i versamenti verificati alimentano gli incassi registrati.
Non aggiungere piu volte lo stesso versamento.

### Contratti Fissi

Gestisce accordi mensili con brand, creator o clienti.
Il canone previsto e distinto dall'incasso effettivo.
Ogni incasso conserva il proprio importo: cambiare il canone non cambia
gli importi dei pagamenti gia registrati. Per gli incassi storici mancanti
completa anche l'importo effettivo nello storico.
La spunta mensile registra il pagamento; lo storico permette di correggere
la data incasso. Controlla la data soprattutto per ricostruzioni di mesi passati.
La registrazione della fattura proposta dopo l'incasso resta distinta dal pagamento.

### Fee Fiere

Raggruppa i creator confermati per evento e mostra fee complessiva,
pagamento agency e fattura. L'intestazione indica **tutti i mesi**.
**+ Fattura** collega direttamente il documento alla partecipazione.

### Registro Fatture Emesse

Mostra le registrazioni del mese.
Con una data fattura, il mese deriva da quella data.
Senza data, viene mantenuto il mese della registrazione selezionata.

La registrazione operativa e unica per sorgente nelle nuove operazioni:
ripetere il comando non aggiunge una seconda fattura.
Le eventuali registrazioni multiple storiche non vengono eliminate.
Se ne elimini una, la sorgente resta fatturata finche esiste un'altra
fattura collegata; eliminando l'ultima si azzera anche la relativa spunta.

Per una fattura manuale senza collegamenti operativi puoi usare **Incassata**
e **Data incasso** nel registro. Solo la conferma dell'incasso contribuisce
ai movimenti; la sola registrazione fattura contribuisce al fatturato.

Non creare fatture manuali per duplicare ADV, fiere, contratti o versamenti
che hanno gia una registrazione collegata.

## Scheda Uscite

### Pagamenti Agenti

Restano i fissi mensili, non le commissioni.
**Genera mese** prepara le righe dai fissi configurati negli utenti.
**Registra** aggiunge il pagamento all'importo gia censito.
**Reset mese** elimina le registrazioni del mese: non usarlo come aggiornamento.

### Uscite Varie

Registra costi con categoria, descrizione, importo e fornitore.
Le voci non pagate restano visibili ma non alimentano i pagamenti registrati.
Quando saldi una voce, conferma **Pagata** e controlla la data.

## Note e lavoro di squadra

Le note mostrano operatore, titolo, contenuto e timestamp server in ora di Roma.
Le modifiche mostrano anche autore e data dell'aggiornamento.
Le aggiunte di due operatori vengono conservate.
Se due operatori modificano la stessa nota, il secondo riceve un avviso:
ricarica prima di riprovare, senza sovrascrivere il lavoro altrui.

## Controllo consigliato

1. Controlla gli incassi reali e le relative date.
2. Confronta fatture registrate e documenti.
3. Controlla creator da pagare e rimborsi separati.
4. Registra i saldi solo dopo il pagamento.
5. Completa le date storiche mancanti.
6. Controlla contratti, versamenti, fissi e uscite.
7. In caso di errore non inserire duplicati: verifica il messaggio e ricarica.
