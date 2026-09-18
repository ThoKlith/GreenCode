# EcoCode — Overview del progetto

> **Il primo tool che *misura* l'impronta energetica del tuo codice invece di *indovinarla* — e la corregge con un agente AI su modelli NVIDIA.**

La maggior parte dei tool "green" chiede a un LLM di stimare a occhio un punteggio. EcoCode è diverso: **esegue il codice, conta i cicli CPU reali**, li converte in energia (mWh) e CO₂ (gCO₂e) con una formula fisica trasparente, e poi passa quei **numeri misurati** a un modello NVIDIA che propone ottimizzazioni concrete — restituite come **etichetta energetica A–G**, come un elettrodomestico.

## L'innovazione: fondato sulla misura, non sull'ipotesi

| | EcoCode |
|---|---|
| **Misura** | Profiling dinamico reale (CLI): esegue il codice, misura CPU → mWh → gCO₂e (formula pubblica nella pagina Methodology) |
| **Ragiona** | Un modello NVIDIA riceve il profilo *misurato* + il sorgente e restituisce ottimizzazioni specifiche, riga per riga |
| **Classifica** | Una **classe energetica A–G** intuitiva, per file e per repository |
| **Agisce** | **Eco-Fix** con un click: l'AI riscrive lo snippet inefficiente preservando il comportamento |

La misura è il cuore onesto; l'AI è fondata su di essa. La pagina Methodology pubblica la conversione esatta (`Energia_mWh = CPU_Time_ms × CPU_Wattage / 3600`, intensità di rete 442 gCO₂e/kWh): trasparenza, non fumo.

## Motore AI

Tutta l'inferenza AI gira su **NVIDIA NIM** (`https://integrate.api.nvidia.com`). Modello primario: **`google/gemma-4-31b-it`** per analisi JSON strutturata e diretta; fallback automatico a **`nvidia/nemotron-3-super-120b`** e **`nemotron-3-ultra-550b`**. Ogni chiamata ha estrazione JSON robusta e fallback tra modelli, così una risposta instabile non rompe mai il flusso.

## Architettura

- **Web app** (Next.js 16 + Turbopack): incolli un URL GitHub → classe energetica, stima CO₂, punteggio di efficienza, e le inefficienze trovate dall'AI con Eco-Fix.
- **CLI** (`npx ecocode@latest`): profiling dinamico reale in locale (privacy — il codice non lascia mai la macchina).
- **Estensione VS Code**: lint energetico nell'editor.
- **Agent** (`/agent`): la pipeline fondata misura→ottimizza su qualsiasi repo.

## Come girarlo

```bash
# API key: crea un account gratuito su build.nvidia.com (senza carta), metti la key in .env.local:
#   NVIDIA_API_KEY=nvapi-...

# Web app (Docker — consigliato, evita problemi di ambiente):
docker run -d --name gc-web -p 4321:3000 \
  -v "$(pwd):/app" -v gc-node-modules:/app/node_modules -v gc-next:/app/.next \
  -w /app node:20 sh -c "npm install && npm run dev -- -p 3000 -H 0.0.0.0"
# → http://localhost:4321

# Agent (misura reale → ottimizzazione NVIDIA):
node agent/analyze.mjs <file.js>                     # singolo file, misura reale
node agent/scan.mjs https://github.com/owner/repo    # repo intero, classe energetica
```

## Nota di onestà

La conversione CPU→energia→CO₂ usa coefficienti trasparenti e documentati (una stima in stile Software Carbon Intensity, non una calibrazione da laboratorio) — dichiarati apertamente nella pagina Methodology. Per i repository analizzati via web app (dove non si può eseguire codice arbitrario in sicurezza) la classe energetica è una stima del modello NVIDIA fondata su segnali di complessità reali; la CLI fornisce la misura dinamica reale per il codice che esegui in locale.
