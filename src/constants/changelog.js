export const APP_VERSION = 'v0.18.1-beta'

export const CHANGELOG = [
  {
    version: 'v0.18.1-beta',
    date: '2026-05-21',
    items: [
      'Fix caricamento liste complete da Supabase: Brand, Creator, Collaborazioni, Trattative, Fiere/Eventi, Agenda, Finance e anagrafiche collegate ora leggono i dati a pagine successive, evitando il limite implicito che nascondeva record oltre il primo blocco.',
      'Ricerca Brand/Creator resa coerente con il caricamento paginato: risultati come "WePlay" vengono trovati anche quando il record si trova oltre il limite standard della prima richiesta.',
      'Trattative Brand: nella creazione di una nuova trattativa in stato Ricerca la sezione Contatti Brand e ora visibile subito, senza dover salvare e riaprire la trattativa in modifica.',
      'Fix ricerca Trattative Brand: la barra di ricerca non perde piu il focus dopo il primo carattere digitato.',
    ]
  },
  {
    version: 'v0.18.0-beta',
    date: '2026-05-08',
    items: [
      'Pagamento Agency nelle Fiere & Eventi integrato con la fatturazione: premendo il pulsante "Pag. Agency" si apre una modal con tre modalità — nuovo pagamento (con opzione fattura), regolarizzazione fattura mancante e rimozione pagamento. Il flusso è identico a quello delle Collaborazioni.',
      'Indicatore arancione in Fiere & Eventi per pagamenti agency senza fattura: colore distinto (arancione = pagato ma senza fattura, blu = pagato con fattura) sia nella vista tabella sia nella vista card.',
      'Nuova sezione "Fee Fiere" in Finance → Entrate: mostra tutti i creator partecipanti nelle fiere attive (non chiuse), raggruppati per evento. Per ogni creator è visibile la fee, lo stato del pagamento agency e il pulsante "+ Fattura" se non ancora emessa.',
      'Sync Finance ↔ Fiere & Eventi: emettere una fattura da Finance nella sezione Fee Fiere aggiorna automaticamente i campi fattura_emessa, numero_fattura e data_fattura sulla partecipazione corrispondente.',
      'Fatture emesse di tipo FIERA collegate alla partecipazione tramite partecipazione_id: il collegamento è tracciabile in entrambe le direzioni.',
      'Fix mese fattura in Finance: la fattura viene registrata nel mese derivato dalla data fattura inserita, non dal mese di riferimento selezionato nel selettore globale.',
      'Fix focus negli input del form Clienti Terzi: risolto il problema per cui ogni carattere digitato causava la perdita del focus. La causa era la definizione di componenti interni al render del parent.',
      'Tabella fee creator nelle Fiere & Eventi: la colonna fee mostra ora le singole voci del breakdown invece del solo totale, con descrizione e importo per riga.',
    ]
  },
  {
    version: 'v0.17.0-beta',
    date: '2026-05-08',
    items: [
      'Periodo di default "Vedi Tutto" in Collaborazioni, Trattative e Trattative Fiere: le sezioni non filtrano più per mese corrente all\'apertura, mostrando subito tutti i record.',
      'Trattative Fiere: al momento della creazione è ora possibile censire automaticamente la fiera nel DB Fiere con un\'unica checkbox. I duplicati vengono rilevati automaticamente per nome, tipo e regione.',
      'Fix bug duplicazione eventi: passare una trattativa fiera in stato "In Trattativa" non crea più un evento duplicato se la fiera era già presente in Fiere & Eventi tramite fiera_db_id.',
      'Eliminazione trattativa fiera: se la trattativa ha un evento collegato in Fiere & Eventi, viene ora proposto un secondo alert per eliminare anche l\'evento.',
      'Cambio stato Trattativa con modal guidata: passando una card kanban (o dropdown lista) a un nuovo stato si apre una maschera che chiede le date rilevanti per quella fase (es. data call per In Trattativa, data preventivo per Preventivo Inviato). Annullare ripristina lo stato precedente.',
      'Pagamento Agency nelle Collaborazioni integrato con la fatturazione: premendo "Pagamento Agency" si apre un form che registra contestualmente la fattura emessa in Finance. Il collegamento è bidirezionale.',
      'Indicatore arancione in Collaborazioni per pagamenti agency senza fattura: cliccandolo si apre la modal "Regolarizza fattura" invece del semplice toggle di rimozione.',
      'Sync Finance ↔ Collaborazioni: emettere una fattura da Finance aggiorna automaticamente i campi fattura_emessa, numero_fattura e data_fattura sulla collaborazione corrispondente.',
      'Navigazione diretta Trattative Fiere ↔ Fiere & Eventi: pulsante "Vai a Fiere & Eventi" nella riga di tabella e nella maschera di modifica (visibile solo quando la trattativa ha un evento collegato); pulsante "← Trattativa Fiera" nel dettaglio evento (visibile solo quando l\'evento ha un trattativaFieraId).',
      'Fiere & Eventi ora accessibile anche agli agenti: la sezione "Aggiungi Creator" e la relativa gestione erano bloccate al solo profilo Admin.',
      'Fee multiple per creator negli eventi: nella sezione presenze è possibile aggiungere più voci fee con descrizione e importo separati. Il totale viene calcolato automaticamente e salvato nel campo fee. Il dettaglio è conservato nella colonna fees_breakdown (jsonb) su partecipazioni_eventi.',
    ]
  },
  {
    version: 'v0.16.0-beta',
    date: '2026-05-06',
    items: [
      'Finance completamente ristrutturata in due soli tab — Entrate e Uscite — con una dashboard P&L sempre visibile in cima: Saldo Netto (verde/rosso), Totale Entrate, Totale Uscite e Totale Fatturato.',
      'Tab Entrate organizzato in quattro sezioni collassabili: Fee Collaborazioni (filtra per data effettiva di pagamento agenzia), Versamenti Creator (spostati dall\'ex tab Incassato), Contratti Fissi e Registro Fatture Emesse.',
      'Nuovo sistema di fatturazione: ogni voce di entrata (collaborazione o versamento creator) mostra un pulsante "+ Fattura" che pre-compila automaticamente il form con soggetto e importo. Le fatture vengono registrate nel Registro Fatture con numero, data, link documento e tipo.',
      'Tab Uscite organizzato in due sezioni: Pagamenti Agenti (invariato) e nuova sezione Uscite Varie per spese amministrative generiche — categorie configurabili (Software, Consulenza, Marketing, Affitto, Utenze, Trasferte, Fiscale, Altro), fornitore, descrizione e toggle pagata/non pagata.',
      'Nuove costanti in constants.js: CATEGORIE_USCITA e TIPI_ENTRATA (usate nei form Finance e nei badge delle fatture).',
      'Fix critico Finance: il filtro delle collaborazioni nell\'ex tab Entrate usava data_firma invece di data_pagamento_agency, causando la comparsa di collab nel mese sbagliato.',
      'Fix stats cards Finance: i contatori Totale/Creator/Media erano sempre a zero perché il dato revenue non veniva mai caricato; ora derivano direttamente dalle collaborazioni completate nel mese.',
      'Storico completo pagamenti nei Contratti Ricorrenti: ogni riga ha un pulsante "▼ storico" che espande tutti i mesi dalla data di inizio contratto, raggruppati per anno, con gli stessi dot cliccabili della vista rapida a 3 mesi.',
    ]
  },
  {
    version: 'v0.15.1-beta',
    date: '2026-04-24',
    items: [
      'Nuovi filtri periodo su Trattative, Collaborazioni e Trattative Fiere: ogni lista parte di default dal primo giorno del mese fino al primo del mese successivo, ma il range è ora personalizzabile liberamente.',
      'Aggiunta azione rapida "Vedi tutto" nei filtri periodo di Trattative, Collaborazioni e Trattative Fiere per ignorare completamente il vincolo temporale quando serve una vista completa.',
      'Trattative: introdotta una data di riferimento smart in base alla fase corrente (contatto, follow-up, ricontatto, call, preventivo o firma) sia per il filtro periodo sia per la lettura in tabella.',
      'Collaborazioni: aggiunto filtro da data a data basato sulla Data Firma, con fallback alla data di creazione quando la firma non è ancora presente.',
      'Trattative Fiere: aggiunto filtro periodo coerente col flusso operativo, usando prima le date evento e, se mancanti, le date di contatto e follow-up.',
    ]
  },
  {
    version: 'v0.15.0-beta',
    date: '2026-04-24',
    items: [
      'Nuovo flusso fiere completo: DB Fiere & Eventi → Trattative Fiere → Fiere & Eventi, coerente con il modello già usato per Brand, Trattative e Collaborazioni.',
      'Nuova sezione "Trattative Fiere": agente che ha contattato la fiera, data contatto, follow-up automatici (+4 giorni e +7 giorni), stati operativi e passaggio automatico in Fiere & Eventi quando la fiera entra in trattativa.',
      'DB Fiere & Eventi esteso con dati master più strutturati: tipologia evento, circuito, date evento, referente, contatti e gestione dedicata dei circuiti censiti.',
      'Fiere & Eventi aggiornato per leggere e mostrare circuito e tipologia evento, mantenendo il collegamento con DB Fiere e Trattative Fiere.',
      'Audit e pulizia del flusso fiere: corretto il sync tra Trattative Fiere ed Eventi per evitare l’azzeramento involontario di campi già compilati durante gli aggiornamenti.',
      'Pulizia UI/UX su Eventi: introdotto reset centralizzato del form evento, aggiunto il campo note nel form e ridotte alcune ridondanze nei lookup dei circuiti.',
    ]
  },
  {
    version: 'v0.14.0-beta',
    date: '2026-04-24',
    items: [
      'Fiere & Eventi evoluta: aggiunte nuove attivita creator (Meet & Greet, Host Palco, Host Gara Cosplay), distinzione tra creator partecipanti e proposti, modifica diretta dei partecipanti e vista card con focus su fee, rimborsi e pagamenti.',
      'Nuova sezione "Gestione Fiere & Eventi": database dedicato per fiere/eventi chiusi o pianificati, calendario contatti a 6 mesi, creazione manuale di nuove schede e creazione di eventi operativi collegati direttamente dalla gestione.',
      'Sincronizzazione tra Gestione Fiere & Eventi e Fiere & Eventi: chiudendo una fiera la scheda viene aggiornata nel database senza duplicazioni, grazie al collegamento stabile tra record gestionale ed evento operativo.',
      'Creator potenziati: email multiple nella sezione "Email/PEC", piu nuovi campi residenza, P.IVA e codice fiscale.',
      'Trattative piu sicure e guidate: lock dei responsabili economici (sales/ima/senior) una volta impostati per i non admin, campi obbligatori al salvataggio e timeline date piu smart in base alla fase della trattativa.',
      'Collaborazioni migliorate: colonna "Data Firma" in tabella, supporto a pagamenti creator in tranches con avanzamento parziale, indicatore visivo dedicato e cambio automatico dello stato in base ai pagamenti.',
      'UI e naming affinati nelle fiere: "Location" rinominato in "Regione" e "Tipo contratto" rinominato in "Rimborso spese" vicino alla fee.',
      'Fix critico lista creator nelle fiere: i creator inseriti da CRM tornano correttamente selezionabili anche quando vengono aggiunti a posteriori.',
    ]
  },
  {
    version: 'v0.13.2-beta',
    date: '2026-04-24',
    items: [
      'Aggiunta spunta "Meet & Greet" nella sezione fiere. Spostanto in constants.js la nomenclatura.'
    ]
  },
  {
    version: 'v0.13.1-beta',
    date: '2026-04-22',
    items: [
      'Fix bug fiere: la creazione di un nuovo evento non sovrascrive più quello precedente né ne eredita i dati. La causa era selectedEvento non azzerato al ritorno dal dettaglio.',
      'ESC per tornare indietro: in tutti i form (Brand, Creator, Collaborazione, Trattativa, Fiera) premere ESC chiude il form e torna alla lista.',
      'Fix perdita focus sulla barra di ricerca delle trattative: il campo non perde più il cursore mentre si digita.',
      'Sezione "Contatti Brand" visibile subito nella trattativa quando si seleziona un brand già censito, anche allo stato iniziale di Ricerca Completata.',
      'Colonne ordinabili nella tabella Collaborazioni: clic sull\'intestazione per ordinare per Creator, Brand, Tipo ADV, Pagamento o Stato. Default: ordinamento per Stato.',
    ]
  },
  {
    version: 'v0.13.0-beta',
    date: '2026-04-19',
    items: [
      'Trattative Chiuse: le trattative passano in archivio solo dopo che la collaborazione è stata effettivamente creata (stato "Collab. Generata"), evitando che il team dimentichi di aprire la collaborazione dopo il contratto firmato.',
      'Nuovo stato trattativa "Collab. Generata": assegnato automaticamente al momento della creazione della collaborazione dalla trattativa.',
      'Colonne ordinabili nelle tabelle Trattative e Collaborazioni: clic sull\'intestazione per ordinare, clic doppio per invertire. Default trattative: priorità; default collaborazioni: stato.',
      'Priorità nella vista Kanban: le card di ogni colonna sono ordinate automaticamente per priorità (Urgente → Alta → Normale → Bassa).',
      'Archivio Trattative rinominato in "Trattative Chiuse" con logica esclusiva: si vedono o solo le attive o solo le chiuse, mai insieme.',
      'Indicatori visivi nel dropdown stato: le voci che portano all\'archivio mostrano la dicitura "→ Chiuse" accanto al nome.',
      'Kanban responsive a griglia: layout a 5 colonne con scroll verticale per ogni colonna, più leggibile su mobile.',
      'Piattaforme creator: aggiunto campo link canale social e numero iscritti/follower per ogni piattaforma. Il tier globale del creator si aggiorna automaticamente in base alla piattaforma con più follower.',
      'Fee per creator nelle trattative: sostituisce il budget totale con un importo specifico per ogni creator confermato, ereditato automaticamente alla creazione della collaborazione.',
      'Nuovi campi trattativa: link video sorgente (da cui è arrivato il brand) e creator sorgente.',
      'Pagamenti fiere: aggiunto stato di pagamento separato per creator e per agency nella sezione presenze eventi.',
      'Selettore "Contattato per" diviso in due campi affiancati: creator di riferimento e tipo di attività.',
      'Logo azienda nella sidebar sostituito con immagine SVG.',
    ]
  },
  {
    version: 'v0.12.1-beta',
    date: '2026-04-16',
    items: [
      'Patch breaking bug - Agenti che entravano in collab facevano crashare il CRM.'
    ]
  },
  {
    version: 'v0.12.0-beta',
    date: '2026-04-09',
    items: [
      'Assegnatari multipli su Trattative e Collaborazioni: è possibile aggiungere più persone responsabili della gestione. Il filtro automatico per agente ora include tutte le trattative/collaborazioni in cui l\'agente è tra gli assegnatari.',
      'Sistema pagamenti agenti completamente rivisto: la sezione "Pagamenti Agenti" in Dashboard Agenti e Finance mostra fisso mensile, fee maturate del mese e totale da corrispondere calcolato in tempo reale senza colonne aggiuntive nel DB.',
      'Pagamenti parziali: è possibile registrare acconti successivi — ogni registrazione si somma al già pagato. La differenza residua è sempre visibile.',
      'Reset mese: possibilità di azzerare e rigenerare le righe dei pagamenti per un mese specifico.',
      'Finance ristrutturata con selettore mese globale visibile su tutti e tre i tab (Entrate, Incassato, Uscite Agenti).',
      'Componente PagamentoRow condiviso tra Finance e Dashboard Agenti per uniformità e manutenibilità.',
      'Dashboard Admin con selettore mese: Revenue, collaborazioni attive e completate si aggiornano in base al mese selezionato.',
      'Ricerca brand e creator con campo testuale ricercabile (SearchableSelect): filtraggio istantaneo mentre si digita.',
      'Brand e Creator ordinati alfabeticamente in tutte le liste e nei selettori.',
      'Fix calcolo fee management nelle collaborazioni: usa la percentuale configurata sul singolo creator anziché il 25% fisso.',
      'Fix visualizzazione creator nei form: i duplicati non causano più errori di key in React.',
      'Merge brand duplicati: script SQL per unire automaticamente i brand con lo stesso nome mantenendo tutti i dati.',
    ]
  },
  {
    version: 'v0.11.0-beta',
    date: '2026-04-09',
    items: [
      'Campo "Assegnatario" su Trattative e Collaborazioni: indica chi gestisce operativamente l\'attività, indipendentemente dalle fee. Solo il creatore o un Admin può modificarlo.',
      'Fisso mensile per agente: configurabile dalla gestione utenti, tracciato mese per mese con supporto a pagamenti parziali e calcolo automatico della differenza.',
      'Sezione Finance ristrutturata in tre tab: Entrate C3 (fee management da collaborazioni completate), Incassato (versamenti creator), Uscite Agenti (pagamenti fissi mensili).',
      'Dashboard Agente: nuova card riepilogativa del fisso mensile con importo maturato, già ricevuto e differenza da saldare.',
      'Campi Brand e Creator nei form diventano ricercabili: filtraggio istantaneo mentre si digita.',
      'Cluster e Regioni creator: selezione multipla con chip visivi, lista cluster configurabile da constants.',
      'Fix calcolo Fee Management: usa la percentuale del creator invece del 25% fisso.',
    ]
  },
  {
    version: 'v0.10.0-beta',
    date: '2026-04-08',
    items: [
      'Sezione "Trattative" completamente riscritta: vista lista stile ClickUp con cambio stato inline, filtri rapidi e Kanban secondario.',
      'Nuovo flusso operativo completo: Ricerca Completata → Onboarding → Primo Contatto → Follow-up 1/2 → Ricontatto Futuro → Trattativa → Preventivo → Contratto Firmato.',
      'Follow-up automatici: date pre-calcolate (+7 giorni dal contatto, +5 dal primo follow-up).',
      'Ricontatto Futuro separato dal follow-up standard, con indicatore visivo di scadenza imminente (≤10 giorni).',
      'Form trattativa con sezioni condizionali per fase: i campi appaiono solo quando rilevanti.',
      'Brand e Creator diventano database puri: tutta la pipeline operativa vive nelle Trattative.',
      'Tab "Trattative" nei dettagli Brand e Creator con storico in tempo reale.',
      'Collaborazioni nascono solo da trattative con stato Contratto Firmato.',
      'Nuovi stati collaborazione allineati al processo reale: In Lavorazione, Revisione Video, Video Pubblicato, Attesa Pagamento Creator, Attesa Pagamento Agency, Completata.',
      'Fee agenti maturano esclusivamente a collaborazione Completata + pagato.',
      'Flag "Riceve Fee" per agente: chi non percepisce commissioni viene escluso automaticamente dal calcolo.',
      'Filtro automatico per agente: chi accede come Agent vede già le proprie trattative e collaborazioni.',
      'Creator: aggiunta sezione Cluster (multi-selezione) e Regioni di operatività (multi-selezione).',
      'Lista Brand con filtro rapido per esito storico: Collaborazione chiusa, Rifiutata, Mai contattata.',
      'Dashboard Agenti con righe espandibili: clicca su un agente per vedere le collaborazioni nel dettaglio.',
    ]
  },
  {
    version: 'v0.9.0-beta',
    date: '2026-04-03',
    items: [
      'Collegamento strutturato Brand ↔ Trattative con brand_id.',
      'Creazione collaborazioni da trattativa con ruoli ereditati.',
      'Agenda operativa con eventi, follow-up, pagamenti e scadenze.',
      'Presenze creator per singoli giorni negli eventi.',
      'Impegni creator manuali integrati in agenda.',
      'Fix fee agenti e dashboard mensile.',
      'Ricalcolo automatico del riepilogo brand dopo update/delete collaborazioni.'
    ]
  },
  {
    version: 'v0.8.0',
    date: '2026-04-01',
    items: [
      'Refactor del flusso trattative.',
      'Supporto a ricontatto futuro, reminder e preventivi.',
      'Prime dashboard agenti e metriche collaborazioni.'
    ]
  }
]
