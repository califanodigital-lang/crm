const topic = (title, paragraphs, steps = []) => ({ title, paragraphs, steps })

export const DOCUMENTATION = [
  {
    id: 'iniziare', title: 'Iniziare e lavorare insieme', group: 'Primi passi',
    summary: 'Accesso, ruoli e percorso di lavoro: dove inserire le informazioni e come evitare doppioni.',
    topics: [
      topic('Accesso e permessi', ["Accedi con le credenziali personali. Admin vede e gestisce tutto; Agent gestisce tutte le sezioni operative, ma non Amministrazione. Un account disattivato non puo operare. Non condividere password o codici di accesso.", "Docs e disponibile agli utenti autenticati. Il pulsante in alto a destra apre la guida della schermata corrente; puoi cercare anche nelle altre sezioni."]),
      topic('Il percorso delle informazioni', ['ADV: Brand e Creator → Trattativa → Collaborazione → incasso e pagamento. Fiere: DB Fiere & Eventi → Trattative Fiere → evento e partecipazioni → chiusura. Finance raccoglie i movimenti registrati in questi percorsi.', 'Prima di creare un record, cerca quello esistente. Per una fiera ricorrente mantieni la stessa anagrafica e distingui le edizioni attraverso le date.']),
      topic('Salvare e correggere', ['Nei moduli completa i campi obbligatori e premi il comando di salvataggio. Una notifica di errore non e una conferma: verifica il messaggio prima di ripetere. Se un altro operatore ha modificato lo stesso record, ricarica prima di intervenire.', 'Le spunte di pagamento registrano fatti gia avvenuti: non eseguono bonifici. I link a contratti e fatture rimandano ai documenti; il CRM non li firma o emette.'])
    ]
  },
  {
    id: 'dashboard', title: 'Dashboard', group: 'Stats & Agenda', route: '/dashboard',
    summary: 'Una vista comune dell’attivita e degli aggiornamenti del CRM.',
    topics: [topic('Leggere il riepilogo', ['Consulta indicatori e grafici per seguire il lavoro commerciale. La vista e comune a Admin e Agent: non e automaticamente limitata alle attivita personali.', 'I grafici dipendono dagli stati e dalle date registrate. Non rappresentano il saldo bancario: per incassi e uscite effettivi usa Finance, se sei Admin.']), topic('Aggiornamenti', ['La card changelog mostra l’ultimo aggiornamento. Espandila per leggere lo storico delle modifiche.'])]
  },
  {
    id: 'agenda', title: 'Agenda', group: 'Stats & Agenda', route: '/agenda',
    summary: 'Organizzare appuntamenti, impegni e scadenze operative.',
    topics: [topic('Usare il calendario', ['Naviga tra le date e consulta gli elementi del giorno. L’agenda raccoglie impegni, ricontatti e scadenze dalle informazioni censite; le voci amministrative sono riservate agli Admin.', 'Apri la voce per consultarne i dettagli. Correggi una scadenza nel record che la genera: un promemoria non sostituisce il dato della trattativa o della collaborazione.']), topic('Nuovi impegni', ['Inserisci un impegno o promemoria con data e riferimenti utili. Per gli impegni dei creator controlla le date prima di confermare una presenza a un evento.'])]
  },
  {
    id: 'tasks', title: 'Tasks', group: 'Stats & Agenda', route: '/tasks',
    summary: 'Un blocco note condiviso per le cose da fare, con assegnatario e urgenza. Il cestino elimina definitivamente una task dopo conferma; per conservare lo storico usa invece la spunta di completamento.',
    topics: [topic('Creare e assegnare', ['Scrivi il titolo, scegli l’assegnatario e, se serve, spunta Urgente. Premi Aggiungi: la task viene salvata per l’operatore scelto. Non sono richiesti descrizione o scadenza.', 'Le mie task mostra quelle assegnate a te. Tutte permette di consultare il lavoro dell’intero gruppo; Admin e Agent possono creare e completare task. Se assegni una task ad altri, la trovi in Tutte.']), topic('Completare e consultare', ['Spunta la casella quando il lavoro e fatto. La task completata viene barrata; attiva Mostra completate per ritrovarla. Togli la spunta per riaprirla. Puoi cambiare l’urgenza dalla lista.', 'La lista si aggiorna quando torni alla finestra del CRM. Usa Aggiorna per vedere nuove assegnazioni mentre resti nella schermata. Non vengono inviate email o notifiche esterne.'])]
  },
  {
    id: 'brands', title: 'Brands', group: 'Database', route: '/brands',
    summary: 'Anagrafiche dei brand, referenti e storico commerciale.',
    topics: [topic('Censire un brand', ['Cerca prima il brand; se manca, crealo con nome, contatti e classificazioni disponibili. Mantieni aggiornati referenti e recapiti: le collaborazioni li leggono dal database brand, senza duplicarli.']), topic('Consultare e aggiornare', ['Apri il dettaglio per consultare informazioni, trattative e collaborazioni collegate. Usa la modifica per aggiornare i dati o le note. I creator suggeriti sono indicazioni commerciali, non una conferma di partecipazione.'])]
  },
  {
    id: 'creators', title: 'Creators', group: 'Database', route: '/creators',
    summary: 'Anagrafica, dati fiscali, canali social e attivita dei creator.',
    topics: [topic('Informazioni personali e fiscali', ['Compila nome, cognome, codice fiscale, partita IVA, residenza e domicilio fiscale quando disponibili. Residenza e domicilio fiscale sono informazioni distinte; verifica i dati con il creator.', 'Completa canali social, metriche e classificazioni utili al lavoro commerciale. Aggiorna la fee di management con attenzione: verifica sempre anche gli importi della singola collaborazione.']), topic('Storico e disponibilita', ['Nel dettaglio consulta attivita e impegni collegati. Creator proposto e creator confermato non sono equivalenti: conferma solo dopo l’accordo. Le date di presenza aiutano a evitare sovrapposizioni.'])]
  },
  {
    id: 'clienti', title: 'Clienti', group: 'Database', route: '/clienti',
    summary: 'Anagrafiche clienti, anche per i contratti fissi.',
    topics: [topic('Gestire l’anagrafica', ['La sezione raccoglie gli ex Clienti Terzi. Cerca un cliente prima di crearne uno; inserisci i dati gia previsti e, quando pertinenti, nome, cognome, codice fiscale, partita IVA, residenza e domicilio fiscale.', 'Mantieni qui i recapiti e i dati fiscali. I contratti in Finance si collegano al cliente: evita di creare una seconda anagrafica per ogni contratto.']), topic('Note cliente', ['Usa le note strutturate per accordi e indicazioni operative. Non inserire password o informazioni non necessarie al lavoro.'])]
  },
  {
    id: 'trattativa', title: 'Trattative ADV', group: 'Commerciale', route: '/trattativa',
    summary: 'Dalla proposta commerciale alla collaborazione, con creator e compensi chiari.',
    topics: [topic('Aprire e seguire una trattativa', ['Collega brand, creator e responsabili; registra contatti, stato, preventivo e riferimenti dei documenti. Aggiorna lo stato in base a cio che e realmente avvenuto.', 'Nelle fasi iniziali lavora sui creator suggeriti. Quando compare la selezione degli scelti, controlla i nominativi proposti inizialmente e conferma quelli concordati.']), topic('Generare le collaborazioni', ['Prima della conversione verifica contratto, creator scelti e compensi. Con piu creator indica la fee di ciascuno: il budget totale non viene assegnato integralmente a ogni persona.'], ['Completa i dati della trattativa e gli importi individuali.', 'Usa il comando di generazione previsto nella fase conclusiva.', 'Controlla le collaborazioni create: una per creator. Ripetere la conversione non deve creare altre copie.']), topic('Responsabili', ['I ruoli commerciali indicano chi segue ricerca, contatto e chiusura. Non generano commissioni agenti: le relative fee sono state rimosse.'])]
  },
  {
    id: 'collaborations', title: 'Collaborazioni', group: 'Commerciale', route: '/collaborations',
    summary: 'Gestire pubblicazione, contratto, incasso agency e pagamento creator.',
    topics: [topic('Esecuzione e scadenze', ['Controlla subito la scadenza di pubblicazione, visibile nella lista, e il link del contratto. I contatti del brand sono in sola lettura e arrivano dall’anagrafica Brands: per correggerli aggiorna il brand.', 'Aggiorna stato, informazioni operative e note durante il lavoro. Una collaborazione annullata non va trattata come un credito da incassare.']), topic('Compensi e pagamenti', ['L’importo complessivo e distinto dalla fee di management. Il compenso creator e l’importo meno quella fee: verifica la percentuale della collaborazione, non applicare automaticamente il 75% delle fiere.', 'Registra prima l’incasso agency effettivo con la sua data e, se necessario, la fattura collegata. Registra poi il pagamento creator o le tranche con le date reali. Quando entrambi i pagamenti sono completati, verifica lo stato conclusivo.', 'Una fattura registrata non prova un incasso. Rimuovere la conferma di incasso non elimina il documento gia registrato.'])]
  },
  {
    id: 'db-fiere', title: 'DB Fiere & Eventi', group: 'Fiere & Eventi', route: '/db-fiere',
    summary: 'Il database delle manifestazioni: una anagrafica, piu edizioni.',
    topics: [topic('Anagrafica e date', ['Inserisci nome, contatti, circuito e tipologia evento. Le tipologie sono censibili come i circuiti. Usa le righe di date per mantenere lo storico, senza sovrascrivere un’edizione precedente.', 'Ogni riga contiene inizio evento, fine evento e prossimo contatto. Il ricontatto proposto e sei mesi dopo l’inizio; controllalo e personalizzalo se necessario. La lista mostra la data piu recente.']), topic('Ricerca e ricontatti', ['Usa ricerca, ordinamento alfabetico o per data e vista raggruppata per mese. Prossimi contatti per il mese raccoglie le manifestazioni da contattare nel mese corrente, a partire dall’ultima edizione e dal ricontatto previsto.', 'Quando disponibile, + Trattativa avvia il lavoro commerciale per l’edizione. Controlla le date prima di procedere: una nuova edizione non deve riutilizzare per errore la trattativa dell’anno precedente.'])]
  },
  {
    id: 'trattative-fiere', title: 'Trattative Fiere', group: 'Fiere & Eventi', route: '/trattative-fiere',
    summary: 'Seguire organizzatori, proposte e follow-up di ogni edizione.',
    topics: [topic('Dal contatto alla proposta', ['Admin e Agent possono creare e gestire trattative fiere. Collega la manifestazione e indica le date dell’edizione, i riferimenti dell’organizzatore e lo stato del contatto.', 'Annota proposte, risposte e decisioni nelle note. Controlla i follow-up suggeriti: il primo e a quattro giorni dal contatto, il successivo a sette giorni dal primo. Le date possono richiedere adattamenti agli accordi.']), topic('Collegamento all’evento', ['Quando la trattativa entra nella fase In trattativa, viene sincronizzata l’edizione operativa. Le note della trattativa sono recuperate nell’evento collegato.', 'Cambiare le date puo identificare un’altra edizione; non riapre automaticamente un evento gia chiuso. Controlla sempre manifestazione, anno e partecipanti prima di aggiornare.'])]
  },
  {
    id: 'eventi', title: 'Fiere ed Eventi chiusi', group: 'Fiere & Eventi', route: '/eventi',
    summary: 'Lista eventi, presenze dei creator, compensi, rimborsi e chiusura.',
    topics: [topic('Lista e partecipanti', ['La sezione permette di distinguere eventi in gestione e chiusi tramite i filtri. La lista mostra creator proposti, confermati e giorni di presenza: controlla lo stato prima di considerare definitiva una partecipazione.', 'Apri l’evento per gestire creator, giorni e attivita. Le note sono affiancate alle informazioni sui creator e recuperano quelle della trattativa collegata.']), topic('Fee e rimborsi', ['La quota creator e il 75% della fee; la quota agency e il 25%. I rimborsi non entrano in queste percentuali.', 'Aggiungi una voce per ogni spesa con descrizione, importo e gestione agency o creator. Il totale delle voci e separato dalla fee. Gestione indica chi organizza la spesa, non se e gia stata pagata.', 'Segna Pagata / rimborsata e la data solo quando l’agenzia ha sostenuto il costo o rimborsato il creator. Una spesa sostenuta dal creator senza rimborso agency non e un’uscita dell’agenzia. Esempio: fee 1.000 euro, compenso creator 750 euro; un treno da 80 euro resta separato.']), topic('Incasso e chiusura', ['Registra incasso agency, data e eventuale fattura sulla partecipazione. Dopo il saldo effettivo registra il pagamento creator e la data. I creator ancora da saldare dopo l’incasso compaiono in Finance.', 'Chiudi l’evento quando tutti i creator confermati risultano pagati. La chiusura mantiene lo storico e aggiorna le date nel database fiere. Non cancellare le edizioni precedenti per preparare la successiva.'])]
  },
  {
    id: 'finance', title: 'Finance', group: 'Amministrazione', route: '/finance', adminOnly: true,
    summary: 'Separare fatture, incassi, debiti verso creator e spese effettive.',
    topics: [
      topic('Mese e indicatori', ['Scegli il mese in alto. Incassi registrati somma incassi ADV e fiere, versamenti verificati, contratti pagati e fatture manuali incassate. Pagamenti registrati somma compensi e tranche creator, rimborsi pagati, fissi registrati e uscite saldate.', 'Saldo movimenti registrati e la differenza fra questi totali; Fatturato usa le fatture del mese, anche non incassate. Sono movimenti censiti, non un saldo bancario o un utile fiscale.', 'I record storici senza date o importi necessari sono segnalati ed esclusi dal totale mensile. Completa i valori reali: non usare oggi come data di un pagamento passato.']),
      topic('Da fatturare e incassare', ['Questo pannello riguarda tutti i mesi. Mostra ADV non annullate e partecipazioni confermate che non risultano sia fatturate sia incassate. I due stati sono separati; la riga scompare quando entrambi sono completati.', 'Apri collaborazione o partecipazione per registrare l’incasso con la data effettiva. Se aggiungi anche la fattura dal comando operativo, i dati vengono salvati insieme. La sola fattura non conferma un incasso.']),
      topic('Creator da pagare', ['Il pannello comprende tutti i mesi e mostra il residuo fee dopo l’incasso agency. Per le fiere e il 75%; per le ADV e l’importo meno la fee di management. Le tranche gia saldate riducono il residuo.', 'Segna pagato va usato solo dopo il pagamento reale: registra oggi e salda le tranche ADV. Per pagamenti storici usa le date nel record operativo. I rimborsi sono separati.']),
      topic('Entrate: fee, versamenti e contratti', ['Fee Collaborazioni mostra la quota C3 delle ADV incassate nel mese, anche se il creator non e ancora pagato. Non confonderla con l’incasso complessivo del riepilogo. Fee Fiere raggruppa le partecipazioni confermate e riguarda tutti i mesi.', 'Versamenti Creator sono somme dal creator all’agenzia, non il contrario. Solo quelli verificati alimentano gli incassi; evita di registrarli due volte.', 'Contratti Fissi collega brand, creator o cliente a un canone. Il previsto e distinto dal pagato. Ogni pagamento conserva importo e data: cambiare canone non modifica gli incassi storici. Controlla lo storico e completa gli importi mancanti.']),
      topic('Registro fatture', ['+ Fattura registra un documento collegato: verifica soggetto, importo, numero, data e link. Il CRM non emette documenti fiscali. La data determina il mese; senza data resta il mese selezionato per la registrazione.', 'Le nuove registrazioni operative evitano duplicati per la stessa sorgente. Eliminare l’ultima fattura collegata azzera la spunta fatturata; eventuali fatture multiple storiche vanno riconciliate, non cancellate alla cieca.', 'Solo per le fatture manuali senza collegamento operativo usa Incassata e Data incasso nel registro. Non duplicare come fattura manuale un incasso ADV, fiera, contratto o versamento gia collegato.']),
      topic('Uscite e rimborsi', ['Pagamenti Agenti contiene solo fissi mensili: Genera mese prepara le righe dai fissi utenti, Registra aggiunge un pagamento e Reset mese elimina le registrazioni del mese. Non usare Reset come aggiornamento.', 'In Uscite Varie inserisci costi e fornitore; solo le voci Pagata con data alimentano i pagamenti registrati. I rimborsi delle fiere sono gestiti nella partecipazione: non reinserire la stessa spesa qui.']),
      topic('Controllo di fine mese', [], ['Verifica incassi reali e date, poi confronta fatture e documenti.', 'Controlla creator da pagare e rimborsi separati; registra solo i saldi effettivi.', 'Rivedi contratti, versamenti, fissi, uscite e avvisi sui dati storici.', 'In caso di errore ricarica e controlla il record prima di creare una nuova registrazione.'])
    ]
  },
  {
    id: 'agenti', title: 'Dashboard Agenti', group: 'Amministrazione', route: '/agenti', adminOnly: true,
    summary: 'Consultare attivita degli operatori e responsabilita commerciali.',
    topics: [topic('Leggere le attivita', ['Consulta i riepiloghi e apri il dettaglio dell’operatore per vedere le attivita collegate. I ruoli di ricerca, contatto e chiusura identificano responsabilita, non commissioni.', 'Le commissioni agenti non sono piu previste. I fissi mensili, quando configurati, si registrano in Finance: non confondere il valore delle trattative con un pagamento all’operatore.'])]
  },
  {
    id: 'users', title: 'Utenti', group: 'Amministrazione', route: '/users', adminOnly: true,
    summary: 'Creare account e gestire ruolo, attivazione e fisso mensile.',
    topics: [topic('Creare un account', ['Solo Admin puo creare utenti. Inserisci email, password iniziale, nome completo, nome agente e ruolo. Assegna Admin soltanto a chi deve accedere anche all’amministrazione; Agent puo lavorare su tutte le sezioni operative.']), topic('Aggiornare e disattivare', ['Aggiorna ruolo, attivazione e eventuale fisso mensile. Non esistono piu percentuali di commissione agenti. Disattivare l’account revoca l’accesso operativo, senza cancellarne lo storico.', 'Per problemi di password o dispositivo MFA coinvolgi l’amministratore. Non creare un secondo account per aggirare una difficolta di accesso.'])]
  },
  {
    id: 'sicurezza', title: 'Sicurezza account', group: 'Account', route: '/sicurezza',
    summary: 'Attivare la verifica a due fattori per il proprio account.',
    topics: [topic('Attivare MFA', ['Tutti gli utenti possono attivare la protezione facoltativa con un’app di autenticazione. Il QR e personale: non condividerlo. La configurazione diventa attiva solo dopo la conferma del codice.'], ['Apri Sicurezza account e avvia l’attivazione.', 'Scansiona il QR con la tua app di autenticazione.', 'Inserisci il codice a sei cifre e conferma.', 'Ai successivi accessi inserisci password e codice richiesto.']), topic('Cambio o perdita del dispositivo', ['Mantieni accesso all’app prima di cambiare telefono. La rimozione di un fattore verificato richiede una sessione con verifica MFA completata.', 'Il CRM non genera codici di recupero. Se perdi il dispositivo, contatta l’amministratore: dopo aver verificato la tua identita potra intervenire su Supabase. Non condividere codici per chiedere assistenza.'])]
  },
  {
    id: 'note', title: 'Note e storico', group: 'Strumenti comuni',
    summary: 'Registrare informazioni leggibili, con autore e data verificabili.',
    topics: [topic('Aggiungere e modificare', ['Inserisci un topic breve e un contenuto utile; premi Aggiungi nota. Se sei in un modulo, completa anche il salvataggio del record: l’aggiunta al modulo non equivale sempre al salvataggio definitivo.', 'Usa l’azione di modifica della nota per correggere topic e contenuto, poi conferma. Il sistema conserva autore e data originali e mostra autore e data della modifica. Il timestamp e assegnato dal server e visualizzato nell’ora di Roma.']), topic('Note storiche e conflitti', ['Note Deprecated contiene i vecchi testi ed e chiusa di base. Aprila quando serve; non eliminare informazioni prima di averle riportate nelle nuove note.', 'Aggiunte indipendenti di piu operatori vengono conservate. Se due persone modificano la stessa nota, il secondo salvataggio puo essere bloccato: ricarica, leggi la versione aggiornata e riprova senza sovrascrivere il lavoro altrui.', 'Le note della trattativa fiera vengono recuperate nell’edizione collegata. Controlla sempre le date quando una manifestazione ricorre ogni anno.'])]
  }
]

export function searchDocumentation(query) {
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const words = normalize(query).trim().split(/\s+/).filter(Boolean)
  return DOCUMENTATION.filter(guide => {
    const text = normalize([guide.title, guide.group, guide.summary, ...guide.topics.flatMap(item => [item.title, ...item.paragraphs, ...item.steps])].join(' '))
    return words.every(word => text.includes(word))
  })
}
