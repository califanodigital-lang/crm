// src/constants/constants.js

// ── STATI TRATTATIVA ─────────────────────────────────────────
// Ordine del flusso operativo reale
export const STATI_TRATTATIVA = [
  { value: 'RICERCA_COMPLETATA',  label: 'Ricerca',  color: 'bg-gray-100 text-gray-700',    dot: 'bg-gray-400'   },
  //{ value: 'ONBOARDING',          label: 'Onboarding',          color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  { value: 'PRIMO_CONTATTO',      label: 'Primo Contatto',      color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500'   },
  { value: 'FOLLOW_UP_1',         label: '1° Follow-up',        color: 'bg-yellow-100 text-yellow-700',dot: 'bg-yellow-500' },
  { value: 'FOLLOW_UP_2',         label: '2° Follow-up',        color: 'bg-orange-100 text-orange-700',dot: 'bg-orange-500' },
  { value: 'RICONTATTO_FUTURO',   label: 'Ricontatto Futuro',   color: 'bg-purple-100 text-purple-700',dot: 'bg-purple-500' },
  { value: 'IN_TRATTATIVA',       label: 'In Trattativa',       color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500'  },
  { value: 'PREVENTIVO_INVIATO',  label: 'Preventivo Inviato',  color: 'bg-lime-100 text-lime-700',    dot: 'bg-lime-500'   },
  { value: 'CONTRATTO_INVIATO',   label: 'Contratto Inviato',   color: 'bg-teal-100 text-teal-700',    dot: 'bg-teal-500'   },
  { value: 'CONTRATTO_FIRMATO',   label: 'Contratto Firmato',   color: 'bg-green-100 text-green-700',    dot: 'bg-green-500'    },
  { value: 'COLLAB_GENERATA',     label: 'Collab. Generata',    color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  { value: 'CHIUSO_PERSO',        label: 'Chiuso Perso',        color: 'bg-red-100 text-red-700',        dot: 'bg-red-500'      },
  { value: 'NESSUNA_RISPOSTA',    label: 'Nessuna Risposta',    color: 'bg-gray-100 text-gray-400',      dot: 'bg-gray-300'     },
]

// Stati attivi di default (NESSUNA_RISPOSTA e CHIUSO_PERSO nascosti senza filtro)
export const STATI_TRATTATIVA_ATTIVI = STATI_TRATTATIVA
  .filter(s => !['NESSUNA_RISPOSTA', 'CHIUSO_PERSO'].includes(s.value))

// Helper per trovare la config di uno stato
export const getStatoTrattativa = (value) =>
  STATI_TRATTATIVA.find(s => s.value === value) || STATI_TRATTATIVA[0]

// ── STATI COLLABORAZIONE ─────────────────────────────────────
export const STATI_COLLABORAZIONE = [
  { value: 'IN_LAVORAZIONE',          label: 'In Lavorazione',         color: 'bg-purple-100 text-purple-700' },
  { value: 'ATTESA_PAGAMENTO_CREATOR',label: 'Attesa Pagamento Creator',color: 'bg-yellow-100 text-yellow-700'},
  { value: 'ATTESA_PAGAMENTO_AGENCY', label: 'Attesa Pagamento Agency', color: 'bg-amber-100 text-amber-700'  },
  { value: 'COMPLETATA',              label: 'Completata',             color: 'bg-green-100 text-green-700'   },
  { value: 'ANNULLATA',               label: 'Annullata',              color: 'bg-red-100 text-red-700'       },
]

export const getStatoCollaborazione = (value) =>
  STATI_COLLABORAZIONE.find(s => s.value === value) || { label: value, color: 'bg-gray-100 text-gray-700' }

// ── CANALI CONTATTO ──────────────────────────────────────────
export const CANALI_CONTATTO = ['Email', 'Telefono', 'Form sito web', 'LinkedIn', 'Instagram DM', 'Altro']

export const CANALI_TRATTATIVA = ['Call', 'Email', 'WhatsApp', 'Meeting', 'Altro']

// ── CONTATTATO PER ───────────────────────────────────────────
export const CONTATTATO_PER_OPTIONS = [
  'Video YouTube',
  'Stories Instagram',
  'Story Set Instagram',
  'Post Instagram',
  'Reel Instagram',
  'TikTok',
  'Twitch',
  'Partnership Lunga',
  'Fiera / Evento',
  'Pacchetto Multi-Piattaforma',
  'Altro',
]

// ── TIER CREATOR ─────────────────────────────────────────────
export const TIER_OPTIONS = [
  { value: 'NANO',      label: 'NANO (5-10K)' },
  { value: 'MICRO',     label: 'MICRO (10-50K)' },
  { value: 'MID',       label: 'MID TIER (50-150K)' },
  { value: 'MACRO',     label: 'MACRO (150-500K)' },
  { value: 'MEGA',      label: 'MEGA (500K-3M)' },
  { value: 'CELEBRITY', label: 'CELEBRITY (3M+)' },
]

// ── PIATTAFORME FEE ──────────────────────────────────────────
export const PIATTAFORME_FEE_CONFIG = {
  'YouTube':   [
    { key: 'short_form', label: 'Short Form (€)' },
    { key: 'long_form', label: 'Long Form (€)' }
  ],
  'Instagram': [
    { key: 'short_form',   label: 'Short Form (€)' },
    { key: 'story_set', label: 'Story Set (€)' },
    { key: 'post', label: 'Post (€)' },
  ],
  'TikTok':  [
    { key: 'short_form',        label: 'Short Form (€)' },
    { key: 'story_set', label: 'Story Set (€)' }
  ],
  'Twitch':  [{ key: 'logo_schermo', label: 'Logo a Schermo + CTA (€)' }],
  'Multipiattaforma': [
    {key:'short_form', label: "Short Form - YouTube, Instagram e TikTok (€)"}
  ]
}

// ── PRIORITÀ ─────────────────────────────────────────────────
export const PRIORITA_OPTIONS = [
  { value: 'BASSA',    label: 'Bassa',    color: 'bg-gray-100 text-gray-600'  },
  { value: 'NORMALE',  label: 'Normale',  color: 'bg-blue-100 text-blue-600'  },
  { value: 'ALTA',     label: 'Alta',     color: 'bg-orange-100 text-orange-600' },
  { value: 'URGENTE',  label: 'Urgente',  color: 'bg-red-100 text-red-700'    },
]

export const TIPO_CONTRATTO = [
  { value: 'CONSULENZA',      label: 'Consulenza' },
  { value: 'MANAGEMENT',      label: 'Management' },
  { value: 'CONSULENZA_MANAGEMENT',      label: 'Consulenza + Management' },
  { value: 'MANAGEMENT_NE',      label: 'Management non esclusivo' },
  { value: 'MANAGEMENT_NE_POSTA',      label: 'Management non esclusivo + posta' },
]

export const CLUSTER = [
  "Divulgazione", "Cultura pop", "Cultura nerd", "Cosplay", "Comedy", "GDR", "Giochi da tavolo", 
  "Tech", "Gaming", "Intrattenimento", "Spettacolo", "Musica", "Generico"
]

export const REGIONI = ['Nazionale','Abruzzo','Basilicata','Calabria','Campania','Emilia-Romagna','Friuli-Venezia Giulia','Lazio','Liguria','Lombardia','Marche','Molise','Piemonte','Puglia','Sardegna','Sicilia','Toscana','Trentino-Alto Adige','Umbria','Valle d\'Aosta','Veneto','Estero']

export const TIPO_ADV_OPTIONS = [
  'Video YouTube', 'Stories Instagram', 'Story Set Instagram',
  'Post Instagram', 'Reel Instagram', 'TikTok', 'Twitch',
  'Partnership Lunga', 'Fiera / Evento', 'Pacchetto Multi-Piattaforma', 'Altro'
]