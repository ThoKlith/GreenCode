# 🌱 EcoCode - Intelligent Code Sustainability

EcoCode è un ecosistema composto da Web App, CLI e Estensione VS Code per analizzare automaticamente la sostenibilità, le performance energetiche e l'impatto di un progetto software. Identifica i colli di bottiglia energetici, ottimizza le query ed evidenzia componenti UI lenti che fanno sprecare batteria ai dispositivi dei tuoi utenti.

## Modalità d'uso

Hai tre modi (estremamente fighi) per usare EcoCode a seconda delle tue esigenze:

### 1. 🌐 Web App (Per Repo Pubbliche)
Hai un repository GitHub pubblico? Apri la pagina della Web App, inserisci l'URL del tuo progetto GitHub, e lascia che il nostro motore di analisi cloud calcoli l'Energy Score e ti offra consigli di refactoring visivi direttamente nella nostra dashboard premium.

### 2. 💻 CLI Locale (Per Repo Private)
Stai lavorando su codice aziendale off-limits per il web o repo privati?
Puoi usare la nostra **EcoCode CLI** Node.js. Il calcolo avviene in locale tramite analisi statica AST: il codice non viene inviato al backend.

#### Installazione Utente Finale (consigliata)

Apri la cartella del tuo progetto e lancia:

```bash
npx ecocode@latest analyze
```

Opzioni utili:

```bash
# usa un host diverso (es. staging o locale)
npx ecocode@latest analyze --host http://localhost:3000

# limita i file analizzati
npx ecocode@latest analyze --max-files 50

# esegue e profila dinamicamente un file locale (CPU -> mWh -> CO2)
npx ecocode@latest profile ./dist/index.js
```

#### Sviluppo locale della CLI (per contributor)

Assicurati di aver clonato lo split-repo e di trovarti nella cartella `cli`.

1. Installa i pacchetti per la CLI:
```bash
cd cli
npm install
```

2. Collega il comando `ecocode` globalmente sul tuo terminale locale per sviluppo:
```bash
npm link
```
*(Da questo momento in poi puoi lanciare `ecocode` in qualunque cartella del tuo PC)*

3. Analizza una cartella sorgente locale:
Vai nel tuo progetto fiammante e scrivi:
```bash
ecocode analyze
```

#### Publish npm (maintainer)

Per rendere disponibile la CLI a tutti via `npx ecocode@latest analyze`:

1. Crea il secret `NPM_TOKEN` su GitHub (Settings > Secrets and variables > Actions).
2. Incrementa la versione in `cli/package.json` (es. `npm version patch` dentro `cli`).
3. Crea e pusha un tag release:

```bash
git tag ecocode-v1.0.1
git push origin ecocode-v1.0.1
```

Il workflow `.github/workflows/publish-cli.yml` pubblichera automaticamente su npm.

#### Cosa fa la CLI in background?
- Scansiona JS/TS/React e calcola l'Energy Score al 100% in locale tramite parsing AST.
- Rileva inefficienze (Frontend Bloat, Inefficienza DB, Spreco AI) direttamente sul PC dell'utente.
- Invia al backend solo metadati del report (punteggi, filename, linea, categoria) per la dashboard visiva.
- Nessuna riga di codice sorgente viene inviata al server.

#### Eco-Fix (Web + locale)
- Nella Web App pubblica non viene richiesto agli utenti di inserire API key personali.
- Il pulsante Eco-Fix usa la chiave server-side configurata su deploy (es. `OPENROUTER_API_KEY`).
- Se self-hosti in locale, imposta la stessa variabile in `.env.local` e avvia l'app.
- Per privacy, il report locale salva solo metadati: quando apri Eco-Fix incolli manualmente il blocco di codice da ottimizzare.

### 3. 🧩 Estensione VS Code (Programmazione in tempo reale)
Vuoi mantenere Energy Score alto (Classe A) mentre scrivi codice, senza cambiare flusso?
Con l'estensione VS Code di EcoCode hai lint energetico in tempo reale, hover con spiegazioni chiare e Quick Fix AI direttamente dalla lampadina dell'editor.

Per l'Eco-Fix AI, l'estensione legge in automatico la chiave dal file `.env` della cartella aperta:
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

Se la chiave non e presente, riceverai una notifica gentile con link rapido per crearla.

Marketplace: https://marketplace.visualstudio.com/items?itemName=klith.ecocode-energy-lint-klith

--- 

## Sviluppo Interno

1. Assicurati di impostare la variabile di ambiente in `.env.local` con i tuoi accessi `NEXT_PUBLIC_SUPABASE_URL` e chiavi Gemini se lavori alla parte Web.
2. Esegui il dump `schema.sql` all'interno del progetto editor Supabase. In questo modo attivi la memorizzazione dei report `local_reports` e le RLS aperte per il CLI.

© 2026 EcoCode. Made with 💚.
