# Coda outreach — esportazione giornaliera su Drive

Ogni mattina, dal lunedì al venerdì, un lavoro di GitHub Actions legge dal CRM
i brand ancora da lavorare e li scrive in un file JSON su Google Drive.
Da lì li riprende l'assistente che prepara il briefing.

Il CRM resta l'unico posto dove si scrive: il file su Drive è una copia
in sola lettura, rifatta da zero a ogni giro.

## Cosa contiene il file

```json
{
  "generato_il": "2026-09-18T05:31:02.114Z",
  "fonte": "crm.c3agency.it · vista public.coda_outreach",
  "righe": 323,
  "coda": [
    {
      "id": "…",
      "cliente": "nome del creator per cui si contatta il brand, oppure null",
      "brand": "nome del brand",
      "categoria": "settore",
      "priorita": 1,
      "bundle": false,
      "chi_altro_serve": null,
      "come_si_entra": null,
      "chi_cercare": null,
      "cosa_chiedere": null,
      "vincoli": null,
      "stato": "FOLLOW_UP_1",
      "data_contatto": "2026-08-01",
      "prossimo_follow_up": "2026-08-06"
    }
  ]
}
```

Regole del contratto, concordate con chi legge il file:

- le date sono **stringhe ISO** `AAAA-MM-GG`, mai numeri seriali;
- `priorita` è **1 (urgente o alta), 2 (normale), 3 (bassa)**;
- ritardo e punteggio **non** vengono esportati: li calcola chi legge, a ogni giro;
- i campi mai compilati arrivano come `null`, non come stringa vuota;
- l'ordine è per priorità, poi per follow-up più vicino, poi per contatto più vecchio.

Entrano nella coda solo le trattative nei sette stati precedenti alla chiusura:
`RICERCA_COMPLETATA`, `ONBOARDING`, `PRIMO_CONTATTO`, `FOLLOW_UP_1`, `FOLLOW_UP_2`,
`RICONTATTO_FUTURO`, `IN_TRATTATIVA`.

`prossimo_follow_up` usa le stesse soglie della pagina "Da fare" del CRM
(7 giorni dopo il primo contatto, 5 dopo il primo follow-up, 7 dopo il secondo),
così il briefing del mattino e il CRM non dicono cose diverse.

## Preparazione, una volta sola

### 1 · Ruolo di sola lettura sul database

Nel SQL Editor di Supabase, eseguire la parte 3 di
`supabase_migrations/20260918_coda_outreach.sql` **dopo** aver sostituito
`SCEGLI_UNA_PASSWORD_LUNGA` con una password generata a caso di almeno 32 caratteri.

Quel ruolo può leggere soltanto la vista `coda_outreach`: non vede le tabelle,
non può scrivere, e le query in sola lettura gli scadono dopo 60 secondi.
Le query di verifica in fondo al file lo confermano.

Non usare mai la `service_role` key, né le credenziali admin del progetto:
valgono come la password del database intero.

### 2 · Stringa di connessione

In Supabase: **Connect** → **Session pooler** (non "Direct connection": quella
risponde solo su IPv6 e GitHub non ci arriva). Copiare la stringa e modificarla:

- utente: `coda_export.kbusfxzponecppvtrgle` (nome del ruolo, punto, id del progetto)
- password: quella scelta al punto 1

Risultato, nella forma:

```
postgresql://coda_export.kbusfxzponecppvtrgle:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

### 3 · Account di servizio Google e file su Drive

1. Nella console Google Cloud creare un progetto, attivare **Google Drive API**,
   creare un **account di servizio** e scaricarne la chiave in formato JSON.
2. Su Drive creare a mano il file `coda-outreach.json` nella cartella scelta
   (basta un file di testo vuoto rinominato).
3. Condividere quel file con l'indirizzo dell'account di servizio
   (`qualcosa@progetto.iam.gserviceaccount.com`) come **Editor**.
4. Copiare l'id del file dall'indirizzo:
   `https://drive.google.com/file/d/`**`QUESTO_PEZZO`**`/view`.

Il file va creato a mano di proposito: un account di servizio non ha spazio
proprio su Drive e la creazione fallirebbe. Lo script aggiorna il file esistente,
che resta di proprietà dell'account che l'ha creato.

### 4 · Segreti su GitHub

In *Settings → Secrets and variables → Actions*:

| Segreto | Contenuto |
|---|---|
| `CODA_OUTREACH_DB_URL` | la stringa di connessione del punto 2 |
| `CODA_OUTREACH_GOOGLE_SA` | tutto il contenuto del file JSON della chiave |
| `CODA_OUTREACH_DRIVE_FILE_ID` | l'id del file del punto 3 |
| `SUPABASE_CA_CERT` | facoltativo: il certificato della CA scaricabile da Supabase |

Senza `SUPABASE_CA_CERT` la connessione resta cifrata ma non viene verificata
l'identità del server: è il comportamento abituale con il pooler di Supabase.

### 5 · Prima prova

*Actions → Coda outreach su Drive → Run workflow*. Nel registro deve comparire
il numero di righe lette e la conferma della scrittura su Drive.

## Orari e limiti

- Il lavoro parte alle **05:30 UTC**: le 07:30 in Italia con l'ora legale,
  le 06:30 con l'ora solare. In inverno il file è pronto un'ora prima.
- GitHub non garantisce il minuto esatto: nelle ore di punta la partenza slitta.
- Se nessuno tocca il repository per **60 giorni**, GitHub sospende i lavori
  programmati e manda un avviso al proprietario: basta riattivarli da Actions.
- Se la vista restituisce zero righe lo script si ferma con errore e **non**
  tocca il file su Drive, per non svuotarlo per sbaglio.
- Quando il lavoro fallisce, GitHub manda una mail al proprietario del repository.

## Se qualcosa non va

| Messaggio | Cosa è successo |
|---|---|
| `Variabili mancanti: …` | manca uno dei segreti elencati sopra |
| `password authentication failed` | password sbagliata, o utente senza `.id-progetto` |
| `ECONNREFUSED` / `ETIMEDOUT` | è stata usata la connessione diretta invece del pooler |
| `permission denied for view coda_outreach` | manca `grant select` al ruolo |
| `Google non ha rilasciato il token` | chiave JSON incompleta o account di servizio disattivato |
| `Drive ha rifiutato l'aggiornamento` | il file non è condiviso con l'account di servizio, o l'id è sbagliato |

## File coinvolti

- `scripts/export-coda-outreach.mjs` — lo script
- `scripts/export-coda-outreach.test.mjs` — le verifiche (`npm run test`)
- `.github/workflows/export-coda-outreach.yml` — l'orario e i segreti
- `supabase_migrations/20260918_coda_outreach.sql` — campi, vista e ruolo
