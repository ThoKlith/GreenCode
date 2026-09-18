# GreenCode - Demo Guide (2 minutes)

Goal: show in 2 minutes that GreenCode **measures** the energy impact of code, grades it **A-G**, and **fixes it with NVIDIA AI**.

## Before recording/presenting

1. Start the app (Docker):
   ```
   docker start gc-web      # or the run command in HACKATHON.md the first time
   ```
   Open **http://localhost:4321** and wait for the home to load (first access ~30s).
2. **Warm up the cache** (essential - makes the demo instant):
   ```
   bash scripts/warm-demo.sh
   ```
   Wait for it to finish (~2-4 min, once). After that, the demo repos open instantly.

## Demo repos (A -> C -> G contrast)

| Repo | Expected class | What it shows |
|---|---|---|
| `sindresorhus/is-plain-obj` | **A** | clean code -> green, "great job" |
| `ThoKlith/GreenCode` | **C** | finds real inefficiencies (sequential batch-loop) |
| `felixge/node-memory-leak-tutorial` | **G** | catches the critical **memory leak** |

## Script (2 min)

**0:00 - The hook (15s)**
> "Every 'green' tool just asks an AI to *guess* how much your code consumes. GreenCode **measures** it instead - it counts real CPU cycles, converts them to energy and CO2 - and gives you an **A-G energy class**, like an appliance."

**0:15 - Clean code -> A (20s)**
Paste `is-plain-obj`. Show the green **A** badge, "no inefficiencies: great job".
> "Clean code: class A."

**0:35 - Bad code -> G (35s)**
Paste `node-memory-leak-tutorial`. Show the red **G** badge and the finding.
> "This one is full of waste - class G. And look: GreenCode spotted the exact **memory leak**, with the offending code."

**1:10 - The punch: AI Eco-Fix (35s)**
Click **"Optimize with AI"** on a finding. Show the rewritten code.
> "One click, and an **NVIDIA Nemotron/Gemma** model rewrites the optimized code, preserving behavior."

**1:45 - Closing (15s)**
Open the **Methodology** page. Show the transparent formula.
> "All transparent: the CPU->energy->CO2 formula is public. Web app, CLI and VS Code extension. GreenCode: it measures, it doesn't guess."

## Honesty note (if a judge asks)
The **CLI** actually runs and measures the code locally (privacy). The **web app**, where arbitrary code can't be safely executed, uses an NVIDIA model that **estimates** the class grounded on real complexity signals. Two modes, one philosophy: transparency.
