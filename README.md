# 🎯 CRM Application

Sistema CRM completo per la gestione di Brand, Creator e Collaborazioni.

## 🚀 Tecnologie

- **React 18** + **Vite** - Framework frontend
- **React Router** - Navigazione
- **Tailwind CSS** - Styling
- **Supabase** - Backend (Auth + Database)
- **Lucide React** - Icone

## 📋 Prerequisiti

- Node.js 18+
- Account Supabase

## 🛠️ Setup Iniziale

### 1. Installazione dipendenze

```bash
npm install
```

### 2. Configurazione Supabase

1. Crea un progetto su [supabase.com](https://supabase.com)
2. Copia l'URL e l'Anon Key del progetto
3. Crea il file `.env` nella root del progetto:

```bash
cp .env.example .env
```

4. Inserisci le credenziali nel file `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Setup Database Supabase

Esegui questi comandi SQL nel SQL Editor di Supabase:

#### Creazione Tabelle

Copia e incolla questo codice SQL completo:

```sql
-- Tabella Users
CREATE TABLE users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Tabella Brands
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

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON brands
  FOR ALL USING (auth.role() = 'authenticated');

-- Tabella Creators
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
  tipo_instagram TEXT,
  tipo_youtube TEXT,
  tipo_tiktok TEXT,
  tipo_twitch TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON creators
  FOR ALL USING (auth.role() = 'authenticated');

-- Tabella Collaborations
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

ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON collaborations
  FOR ALL USING (auth.role() = 'authenticated');

-- Tabella Brand Contattati
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

ALTER TABLE brand_contattati ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON brand_contattati
  FOR ALL USING (auth.role() = 'authenticated');
```

### 4. Creazione Utente Admin

1. Vai su Authentication > Users in Supabase
2. Clicca "Add user" > "Create new user"
3. Inserisci:
   - Email: `admin@admin.com`
   - Password: `admin`
   - Auto Confirm User: ✅ ON

4. Esegui questo SQL:

```sql
INSERT INTO users (id, email, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@admin.com'),
  'admin@admin.com',
  'admin'
);
```

## 🏃‍♂️ Avvio Applicazione

```bash
npm run dev
```

Vai su `http://localhost:5173`

**Credenziali:**
- Email: `admin@admin.com`
- Password: `admin`

## 📁 Struttura

```
src/
├── components/      # Componenti React
├── contexts/        # Context API
├── pages/           # Pagine
├── lib/             # Configurazioni
└── App.jsx          # Router principale
```

## ✨ Funzionalità

- ✅ Autenticazione
- ✅ Dashboard con KPI
- ✅ Gestione Brand
- ✅ Gestione Creator
- 🚧 Dettagli e form
- 🚧 Collaborazioni
- 🚧 Finance

## 🚀 Deploy su GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
```

Poi usa Vercel o Netlify per il deploy automatico.
