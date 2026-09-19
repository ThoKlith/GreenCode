import { NextResponse } from 'next/server';
import { getAiConfig } from '@/lib/ai';

function buildPrompt(code: string, filename: string) {
  return `Act as an expert Green Software Engineer. You are given an inefficient snippet to optimize to reduce CPU compute, network and server cost, preserving EXACTLY the behavior.
Original code (file: ${filename}):
\`\`\`
${code}
\`\`\`

Return ONLY a valid JSON object (no text around it) with this structure:
{
  "fixedCode": "the rewritten, optimized code, functionally equivalent"
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

// Motore AI configurabile (OpenAI-compatibile) via getAiConfig(). Primario il modello instruct
// (JSON diretto), fallback agli altri. La validazione JSON e DENTRO il ciclo: un modello che
// risponde male fa passare al successivo.
async function callAi(prompt: string) {
  const ai = getAiConfig();
  let lastErr = '';
  for (const model of ai.models) {
    try {
      const res = await fetch(`${ai.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ai.apiKey}`,
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
      if (!raw) { lastErr = `Empty response (${model})`; continue; }
      const parsed = extractJson(raw);
      if (parsed && typeof parsed.fixedCode === 'string') return parsed;
      lastErr = `Invalid JSON (${model})`;
    } catch (e) {
      lastErr = (e instanceof Error ? e.message : String(e)) + ` (${model})`;
    }
  }
  throw new Error(`Eco-Fix: AI engine unavailable. Details: ${lastErr}`);
}

export async function POST(request: Request) {
  try {
    const { code, filename } = await request.json();

    if (!code || !filename) {
      return NextResponse.json({ error: 'Payload non valido: code e filename sono obbligatori.' }, { status: 400 });
    }

    if (!getAiConfig().apiKey) {
      return NextResponse.json(
        { error: 'No AI provider configured for Eco-Fix (set OPENAI_API_KEY or NVIDIA_API_KEY).' },
        { status: 500 }
      );
    }

    const prompt = buildPrompt(code, filename);
    const data = await callAi(prompt);

    if (!data?.fixedCode || typeof data.fixedCode !== 'string') {
      throw new Error('Invalid model response: fixedCode missing.');
    }

    return NextResponse.json({ fixedCode: data.fixedCode });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error during l\'eco-fix.';
    console.error('Eco-fix error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
