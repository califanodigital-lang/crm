export const APP_VERSION = 'v0.12.0-beta'

export const CHANGELOG = [
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