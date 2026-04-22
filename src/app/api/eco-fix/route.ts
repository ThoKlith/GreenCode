import { NextResponse } from 'next/server';

function buildPrompt(code: string, filename: string) {
  return `Agisci come un esperto Green Software Engineer. Ti viene fornito uno snippet inefficiente da ottimizzare per ridurre calcolo CPU, rete e costo server.
Codice originale (file: ${filename}):
\`\`\`
${code}
\`\`\`

Restituisci SOLO un oggetto JSON valido con la seguente struttura:
{
  "fixedCode": "codice riscritto e ottimizzato"
}`;
}

function parseJsonFromModelText(raw: string) {
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleaned);
}

async function callOpenRouter(apiKey: string, prompt: string) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ecocode.app',
      'X-Title': 'EcoCode',
    },
    body: JSON.stringify({
      models: [
        'meta-llama/llama-3.3-70b-instruct:free',
        'openrouter/free'
      ],
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenRouter error: ${res.status} ${detail.slice(0, 200)}`);
  }

  const result = await res.json();
  const raw = result?.choices?.[0]?.message?.content;
  if (!raw) throw new Error('OpenRouter response vuota.');

  return parseJsonFromModelText(raw);
}

export async function POST(request: Request) {
  try {
    const { code, filename } = await request.json();

    if (!code || !filename) {
      return NextResponse.json({ error: 'Payload non valido: code e filename sono obbligatori.' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chiave API server non configurata per Eco-Fix.' },
        { status: 500 }
      );
    }

    const prompt = buildPrompt(code, filename);
    const data = await callOpenRouter(apiKey, prompt);

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
