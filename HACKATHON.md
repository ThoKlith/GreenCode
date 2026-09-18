# GreenCode - Project Overview

> **The first tool that *measures* your code's energy footprint instead of *guessing* it - and fixes it with an AI agent on NVIDIA models.**

Most "green" tools just ask an LLM to eyeball a score. GreenCode is different: it **runs the code, counts real CPU cycles**, converts them to energy (mWh) and CO2 (gCO2e) with a transparent physics formula, and then feeds those **measured numbers** to an NVIDIA model that proposes concrete optimizations - returned as an **A-G energy label**, like an appliance.

## The innovation: grounded on measurement, not on guessing

| | GreenCode |
|---|---|
| **Measure** | Real dynamic profiling (CLI): runs the code, measures CPU -> mWh -> gCO2e (formula public on the Methodology page) |
| **Reason** | An NVIDIA model receives the *measured* profile + source and returns specific, line-level optimizations |
| **Classify** | An intuitive **A-G energy class**, per file and per repository |
| **Act** | **Eco-Fix** with one click: the AI rewrites the inefficient snippet, preserving behavior |

Measurement is the honest core; the AI is grounded on it. The Methodology page publishes the exact conversion (`Energy_mWh = CPU_Time_ms x CPU_Wattage / 3600`, grid intensity 442 gCO2e/kWh): transparency, not smoke.

## AI engine

All AI inference runs on **NVIDIA NIM** (`https://integrate.api.nvidia.com`). Primary model: **`google/gemma-4-31b-it`** for direct, structured JSON analysis; automatic fallback to **`nvidia/nemotron-3-super-120b`** and **`nemotron-3-ultra-550b`**. Every model call has robust JSON extraction and cross-model fallback, so an unstable response never breaks the flow.

## Architecture

- **Web app** (Next.js 16 + Turbopack): paste a GitHub URL -> energy class, CO2 estimate, efficiency score, and the AI-found inefficiencies with Eco-Fix.
- **CLI** (`npx ecocode@latest`): real dynamic profiling locally (privacy - code never leaves the machine).
- **VS Code extension**: in-editor energy linting.
- **Agent** (`/agent`): the grounded measure -> optimize pipeline over any repo.

## How to run it

```bash
# API key: create a free NVIDIA account at build.nvidia.com (no card), put the key in .env.local:
#   NVIDIA_API_KEY=nvapi-...

# Web app (Docker - recommended, avoids environment issues):
docker run -d --name gc-web -p 4321:3000 \
  -v "$(pwd):/app" -v gc-node-modules:/app/node_modules -v gc-next:/app/.next \
  -w /app node:20 sh -c "npm install && npm run dev -- -p 3000 -H 0.0.0.0"
# -> http://localhost:4321

# Agent (real measurement -> NVIDIA optimization):
node agent/analyze.mjs <file.js>                     # single file, real measurement
node agent/scan.mjs https://github.com/owner/repo    # whole repo, energy class
```

## Honesty note

The CPU->energy->CO2 conversion uses transparent, documented coefficients (a Software-Carbon-Intensity-style estimate, not a lab calibration) - stated openly on the Methodology page. For repositories analyzed via the web app (where arbitrary code can't be safely executed) the energy class is an NVIDIA-model estimate grounded on real complexity signals; the CLI provides the real dynamic measurement for code you run locally.
