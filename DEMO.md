# EcoCode — Guida alla Demo (2 minuti)

Obiettivo: far vedere in 2 minuti che EcoCode **misura** l'impatto energetico del codice, lo classifica **A–G**, e lo **corregge con l'AI NVIDIA**.

## Prima di registrare/presentare

1. Avvia l'app (Docker):
   ```
   docker start gc-web      # oppure il comando run in HACKATHON.md la prima volta
   ```
   Apri **http://localhost:4321** e aspetta che la home carichi (primo accesso ~30s).
2. **Pre-riscalda la cache** (fondamentale — rende la demo istantanea):
   ```
   bash scripts/warm-demo.sh
   ```
   Aspetta che finisca (~2-4 min una volta sola). Dopo, i repo della demo si aprono in un istante.

## Repo della demo (contrasto A → C → G)

| Repo | Classe attesa | Cosa mostra |
|---|---|---|
| `sindresorhus/is-plain-obj` | **A** | codice pulito → verde, "ottimo lavoro" |
| `ThoKlith/GreenCode` | **C** | trova sprechi reali (batch-loop sequenziale) |
| `felixge/node-memory-leak-tutorial` | **G** | becca la **fuga di memoria** critica |

## Copione (2 min)

**0:00 — L'aggancio (15s)**
> "Ogni tool 'green' chiede a un'AI di *indovinare* quanto consuma il tuo codice. EcoCode invece lo **misura** — conta i cicli CPU reali, li converte in energia e CO₂ — e ti dà una **classe energetica A–G**, come un elettrodomestico."

**0:15 — Codice pulito → A (20s)**
Incolla `is-plain-obj`. Mostra il badge **A** verde, "nessuna vulnerabilità: ottimo lavoro".
> "Codice pulito: classe A."

**0:35 — Codice pessimo → G (35s)**
Incolla `node-memory-leak-tutorial`. Mostra il badge **G** rosso e il finding.
> "Questo invece è pieno di sprechi — classe G. E guarda: EcoCode ha individuato la **fuga di memoria** esatta, con il codice incriminato."

**1:10 — Il colpo: Eco-Fix con AI (35s)**
Clicca **"Ottimizza con AI"** su un finding. Mostra il codice riscritto.
> "Un click, e un modello **NVIDIA Nemotron/Gemma** riscrive il codice ottimizzato, preservando il comportamento."

**1:45 — Chiusura (15s)**
Apri la pagina **Methodology**. Mostra la formula trasparente.
> "Tutto trasparente: la formula CPU→energia→CO₂ è pubblica. Web app, CLI e estensione VS Code. EcoCode: misura, non indovina."

## Nota di onestà (se un giudice chiede)
La **CLI** esegue e misura davvero il codice in locale (privacy). La **web app**, dove non si può eseguire codice arbitrario in sicurezza, usa un modello NVIDIA che **stima** la classe fondandosi su segnali di complessità reali. Due modalità, una filosofia: trasparenza.
