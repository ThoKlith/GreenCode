# 🌱 EcoCode - Intelligent Code Sustainability

EcoCode è un portale Web e un tool da riga di comando (CLI) studiato per analizzare automaticamente la sostenibilità, le performance energetiche e l'impatto di un progetto software. Identifica i colli di bottiglia energetici, ottimizza le query ed evidenzia componenti UI lenti che fanno sprecare batteria ai dispositivi dei tuoi utenti.

## Modalità d'uso

Hai due modi (estremamente fighi) per usare EcoCode a seconda delle tue esigenze:

### 1. 🌐 Web App (Per Repo Pubbliche)
Hai un repository GitHub pubblico? Apri la pagina della Web App, inserisci l'URL del tuo progetto GitHub, e lascia che il nostro motore di analisi cloud calcoli l'Energy Score e ti offra consigli di refactoring visivi direttamente nella nostra dashboard premium.

### 2. 💻 CLI Locale (Per Repo Private & Privacy Assoluta)
Stai lavorando su codice aziendale off-limits per il web o repo privati? 
Puoi usare la nostra **EcoCode CLI** Node.js. Installata in locale, scansionerà solo i metadati, senza mai inviare il tuo codice proprietario su cloud!

#### Installazione e Setup (In sviluppo)

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

#### Cosa fa la CLI in background?
- Stima i costi e gli sprechi di cicli del processore.
- Restituisce a terminale il punteggio A-G del tuo progetto in secondi.
- **Privacy By Design**: Manda alla WebApp solo i Metadati con un UUID anonimo, e ti restituisce un link per visualizzare in una fantastica UI i risultati.

--- 

## Sviluppo Interno

1. Assicurati di impostare la variabile di ambiente in `.env.local` con i tuoi accessi `NEXT_PUBLIC_SUPABASE_URL` e chiavi Gemini se lavori alla parte Web.
2. Esegui il dump `schema.sql` all'interno del progetto editor Supabase. In questo modo attivi la memorizzazione dei report `local_reports` e le RLS aperte per il CLI.

© 2026 EcoCode. Made with 💚.
