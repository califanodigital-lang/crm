export const APP_VERSION = 'v0.13.1-beta'

export const CHANGELOG = [
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