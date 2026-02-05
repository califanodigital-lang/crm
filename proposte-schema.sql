-- ============================================================================
-- PROPOSTE BRAND - DATABASE SCHEMA
-- ============================================================================
-- Esegui questo script nel SQL Editor di Supabase
-- ============================================================================

CREATE TABLE proposte_brand (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_nome TEXT NOT NULL,
  settore TEXT,
  priorita TEXT DEFAULT 'NORMALE',
  stato TEXT DEFAULT 'DA_CONTATTARE',
  agente TEXT,
  creator_suggeriti TEXT,
  note_strategiche TEXT,
  riferimento TEXT,
  contatto_mail TEXT,
  telefono TEXT,
  link TEXT,
  data_contatto DATE,
  data_ultima_azione DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX idx_proposte_agente ON proposte_brand(agente);
CREATE INDEX idx_proposte_stato ON proposte_brand(stato);
CREATE INDEX idx_proposte_priorita ON proposte_brand(priorita);

-- RLS
ALTER TABLE proposte_brand ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON proposte_brand
  FOR ALL USING (auth.role() = 'authenticated');

-- Trigger aggiornamento
CREATE TRIGGER update_proposte_brand_updated_at
  BEFORE UPDATE ON proposte_brand
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
