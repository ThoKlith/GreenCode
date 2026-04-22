import { NextResponse } from 'next/server';

type Provider = 'gemini' | 'openai';

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

async function callOpenAI(apiKey: string, prompt: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${detail.slice(0, 200)}`);
  }

  const result = await res.json();
  const raw = result?.choices?.[0]?.message?.content;
  if (!raw) throw new Error('OpenAI response vuota.');

  return parseJsonFromModelText(raw);
}

async function callGemini(apiKey: string, prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini error: ${res.status} ${detail.slice(0, 200)}`);
  }

  const result = await res.json();
  const raw = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Gemini response vuota.');

  return parseJsonFromModelText(raw);
}

export async function POST(request: Request) {
  try {
    const { code, filename, userApiKey, provider } = await request.json();

    if (!code || !filename) {
      return NextResponse.json({ error: 'Payload non valido: code e filename sono obbligatori.' }, { status: 400 });
    }

    if (!userApiKey || typeof userApiKey !== 'string') {
      return NextResponse.json(
        { error: "API Key mancante. Inseriscila in 'Impostazioni/API Key'." },
        { status: 400 }
      );
    }

    const selectedProvider: Provider = provider === 'openai' ? 'openai' : 'gemini';
    const prompt = buildPrompt(code, filename);

    const data =
      selectedProvider === 'openai'
        ? await callOpenAI(userApiKey.trim(), prompt)
        : await callGemini(userApiKey.trim(), prompt);

    if (!data?.fixedCode || typeof data.fixedCode !== 'string') {
      throw new Error('Risposta modello non valida: fixedCode mancante.');
    }

    return NextResponse.json({ fixedCode: data.fixedCode });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore durante l\'eco-fix BYOK.';
    console.error('Eco-fix error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
