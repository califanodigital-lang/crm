-- ============================================================================
-- CRM APPLICATION - DATABASE SETUP
-- ============================================================================
-- Esegui questo script nel SQL Editor di Supabase dopo aver creato il progetto
-- ============================================================================

-- ============================================================================
-- 1. TABELLA USERS (per autenticazione e gestione ruoli)
-- ============================================================================

CREATE TABLE users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abilita Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: gli utenti possono vedere solo i propri dati
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- ============================================================================
-- 2. TABELLA BRANDS (aziende clienti)
-- ============================================================================

CREATE TABLE brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  settore TEXT,
  target_dem TEXT,
  topic_target TEXT,
  data_contatto DATE,
  categoria TEXT,
  risposta TEXT,
  contattato_per TEXT,
  referenti TEXT,
  email TEXT,
  telefono TEXT,
  agente TEXT,
  sito_web TEXT,
  note TEXT,
  categoria_adv TEXT,
  creator_suggeriti TEXT,
  priorita TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS per brands
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Policy: utenti autenticati possono fare tutto
CREATE POLICY "Enable all for authenticated users" ON brands
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- 3. TABELLA CREATORS (content creator)
-- ============================================================================

CREATE TABLE creators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  nome_completo TEXT,
  ricontattare DATE,
  stato TEXT,
  inizio_collaborazione DATE,
  scadenza_contratto DATE,
  tipo_contratto TEXT,
  proviggioni DECIMAL,
  topic TEXT,
  tier TEXT,
  cellulare TEXT,
  email TEXT,
  note TEXT,
  mediakit TEXT,
  ultimo_aggiornamento_mediakit DATE,
  strategia TEXT,
  -- Fee per tipologia di contenuto
  integrazione_video_youtube DECIMAL,
  video_short_form DECIMAL,
  story_set DECIMAL,
  logo_schermo_twitch DECIMAL,
  collaborazioni_lunghe DECIMAL,
  fiere_eventi DECIMAL,
  obiettivo TEXT,
  insight TEXT,
  preferenza_collaborazioni TEXT,
  data_firma_contratto DATE,
  sales TEXT,
  categoria_adv TEXT,
  -- Tipologia social
  tipo_instagram TEXT,
  tipo_youtube TEXT,
  tipo_tiktok TEXT,
  tipo_twitch TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS per creators
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON creators
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- 4. TABELLA COLLABORATIONS (collaborazioni tra creator e brand)
-- ============================================================================

CREATE TABLE collaborations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  brand_nome TEXT NOT NULL,
  pagamento DECIMAL,
  fee_management DECIMAL,
  data_firma DATE,
  adv TEXT,
  agente TEXT,
  sales TEXT,
  stato TEXT,
  pagato BOOLEAN DEFAULT false,
  contatto TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS per collaborations
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON collaborations
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- 5. TABELLA BRAND_CONTATTATI (brand contattati per ogni creator)
-- ============================================================================

CREATE TABLE brand_contattati (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  brand_nome TEXT NOT NULL,
  settore TEXT,
  target_dem TEXT,
  topic_target TEXT,
  data_contatto DATE,
  risposta TEXT,
  contattato_per TEXT,
  referenti TEXT,
  email TEXT,
  telefono TEXT,
  agente TEXT,
  sito_web TEXT,
  note TEXT,
  contratto_chiuso BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS per brand_contattati
ALTER TABLE brand_contattati ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON brand_contattati
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- 6. TRIGGER PER AGGIORNAMENTO AUTOMATICO updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applica il trigger a tutte le tabelle
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creators_updated_at
  BEFORE UPDATE ON creators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaborations_updated_at
  BEFORE UPDATE ON collaborations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_contattati_updated_at
  BEFORE UPDATE ON brand_contattati
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SETUP COMPLETATO!
-- ============================================================================
-- Prossimi passi:
-- 1. Crea l'utente admin in Authentication > Users:
--    Email: admin@admin.com
--    Password: admin
--    Auto Confirm: ON
--
-- 2. Esegui questo comando per assegnare il ruolo admin:
--    INSERT INTO users (id, email, role)
--    VALUES (
--      (SELECT id FROM auth.users WHERE email = 'admin@admin.com'),
--      'admin@admin.com',
--      'admin'
--    );
-- ============================================================================

-- Aggiungi colonna 'stato' alla tabella brands
ALTER TABLE brands ADD COLUMN stato TEXT DEFAULT 'DA_CONTATTARE';

-- Aggiorna eventuali record esistenti
UPDATE brands SET stato = 'DA_CONTATTARE' WHERE stato IS NULL;