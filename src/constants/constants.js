// src/constants/constants.js

export const STATI_BRAND = {
  DA_CONTATTARE: 'DA_CONTATTARE',
  CONTATTATO: 'CONTATTATO',
  IN_TRATTATIVA: 'IN_TRATTATIVA',
  CHIUSO: 'CHIUSO'
}

export const STATI_PROPOSTA = {
  DA_CONTATTARE: 'DA_CONTATTARE',
  CONTATTATO: 'CONTATTATO',
  IN_TRATTATIVA: 'IN_TRATTATIVA',
  CHIUSO_VINTO: 'CHIUSO_VINTO',
  CHIUSO_PERSO: 'CHIUSO_PERSO'
}

export const PRIORITA = {
  BASSA: 'BASSA',
  NORMALE: 'NORMALE',
  ALTA: 'ALTA',
  URGENTE: 'URGENTE'
}

export const STATI_COLLABORAZIONE = {
  IN_TRATTATIVA: 'IN_TRATTATIVA',
  FIRMATO: 'FIRMATO',
  IN_CORSO: 'IN_CORSO',
  COMPLETATO: 'COMPLETATO',
  ANNULLATO: 'ANNULLATO'
}

export const TIPI_CONTRATTO = [
  'Standard',
  'Esclusivo',
  'Partnership',
  'Consulenza',
  'Altro'
]

export const TIPI_ADV = [
  'VIDEO_YOUTUBE',
  'STORIES',
  'STORY_SET',
  'POST',
  'REEL',
  'LIVE',
  'COLLABORAZIONE_LUNGA'
]

// Opzioni standardizzate per risposta brand — usate in BrandForm, PropostaForm, CreatorDetail
export const RISPOSTE_OPTIONS = [
  'In Attesa',
  'Positiva',
  'Negativa',
  'Nessuna Risposta',
  'Follow-up 1 Inviato',
  'Follow-up 2 Inviato',
  'Appuntamento Fissato',
  'Non Interessato',
]

// Opzioni standardizzate per "contattato per" — usate in BrandForm, PropostaForm, CreatorDetail
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

// Config fee per piattaforma — definisce i campi fee di ogni piattaforma
// Aggiungere qui nuove piattaforme quando necessario
export const PIATTAFORME_FEE_CONFIG = {
  'YouTube':   [{ key: 'integrazione', label: 'Integrazione Video (€)' }],
  'Instagram': [
    { key: 'stories',   label: 'Stories (€)' },
    { key: 'story_set', label: 'Story Set (€)' },
    { key: 'post_reel', label: 'Post / Reel (€)' },
  ],
  'TikTok':    [{ key: 'video', label: 'Video TikTok (€)' }],
  'Twitch':    [{ key: 'logo_schermo', label: 'Logo Schermo + CTA (€)' }],
  // Piattaforme generiche: un solo campo fee
}

export const TIER_OPTIONS = [
  { value: 'NANO',      label: 'NANO (5-10K)' },
  { value: 'MICRO',     label: 'MICRO (10-50K)' },
  { value: 'MID',       label: 'MID TIER (50-300K)' },
  { value: 'CELEBRITY', label: 'CELEBRITY (3M+)' },
]