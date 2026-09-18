import { NextResponse } from 'next/server';

function buildPrompt(code: string, filename: string) {
  return `Agisci come un esperto Green Software Engineer. Ti viene fornito uno snippet inefficiente da ottimizzare per ridurre calcolo CPU, rete e costo server, preservando ESATTAMENTE il comportamento.
Codice originale (file: ${filename}):
\`\`\`
${code}
\`\`\`

Restituisci SOLO un oggetto JSON valido (nessun testo attorno) con questa struttura:
{
  "fixedCode": "il codice riscritto e ottimizzato, funzionalmente equivalente"
}`;
}

// Estrazione JSON robusta: i modelli possono avvolgere il JSON in testo/ragionamento.
// Cerca il blocco { } bilanciato piu grande che parsa correttamente.
function extractJson(text: string): any {
  const t = text
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/```json/gi, '')
    .replace(/```/g, '');
  const candidates: string[] = [];
  let depth = 0, start = -1;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === '{') { if (depth === 0) start = i; depth++; }
    else if (c === '}') { depth--; if (depth === 0 && start >= 0) { candidates.push(t.slice(start, i + 1)); start = -1; } }
  }
  candidates.sort((a, b) => b.length - a.length);
  for (const c of candidates) { try { return JSON.parse(c); } catch { /* prossimo candidato */ } }
  return null;
}

// Motore AI: NVIDIA NIM. Primario gemma-4-31b-it (JSON diretto), fallback ai modelli reasoning.
// La validazione JSON e DENTRO il ciclo: un modello che risponde male fa passare al successivo.
async function callNvidia(apiKey: string, prompt: string) {
  const MODELS = [
    'google/gemma-4-31b-it',
    'nvidia/nemotron-3-super-120b-a12b',
    'nvidia/nemotron-3-ultra-550b-a55b',
  ];
  let lastErr = '';
  for (const model of MODELS) {
    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 3000,
        }),
      });
      if (!res.ok) { lastErr = `NVIDIA HTTP ${res.status} (${model})`; continue; }
      const result = await res.json();
      const raw = result?.choices?.[0]?.message?.content;
      if (!raw) { lastErr = `Risposta vuota (${model})`; continue; }
      const parsed = extractJson(raw);
      if (parsed && typeof parsed.fixedCode === 'string') return parsed;
      lastErr = `JSON non valido (${model})`;
    } catch (e) {
      lastErr = (e instanceof Error ? e.message : String(e)) + ` (${model})`;
    }
  }
  throw new Error(`Eco-Fix: motore NVIDIA non disponibile. Dettagli: ${lastErr}`);
}

export async function POST(request: Request) {
  try {
    const { code, filename } = await request.json();

    if (!code || !filename) {
      return NextResponse.json({ error: 'Payload non valido: code e filename sono obbligatori.' }, { status: 400 });
    }

    const nvidiaKey = process.env.NVIDIA_API_KEY;
    if (!nvidiaKey) {
      return NextResponse.json(
        { error: 'Chiave API NVIDIA non configurata per Eco-Fix.' },
        { status: 500 }
      );
    }

    const prompt = buildPrompt(code, filename);
    const data = await callNvidia(nvidiaKey, prompt);

    if (!data?.fixedCode || typeof data.fixedCode !== 'string') {
      throw new Error('Risposta modello non valida: fixedCode mancante.');
    }

    return NextResponse.json({ fixedCode: data.fixedCode });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore durante l\'eco-fix.';
    console.error('Eco-fix error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
