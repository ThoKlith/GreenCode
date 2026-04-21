import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { code, filename } = await request.json();

    const prompt = `Agisci come un esperto Green Software Engineer. Ti viene fornito uno pseudo-codice inefficiente da ottimizzare per ridurre calcolo CPU, rete o consumo server.
Codice originale (file: ${filename}):
\`\`\`
${code}
\`\`\`

Fornisci la versione rifattorizzata del codice per essere molto più ecosostenibile.
Devi restituire SOLO un oggetto JSON valido con la seguente struttura esatta:
{
  "fixedCode": "il codice riscritto con commenti che spiegano l'ottimizzazione"
}`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ecocode.app",
        "X-Title": "EcoCode"
      },
      body: JSON.stringify({
        "models": [
          "meta-llama/llama-3.3-70b-instruct:free",
          "openrouter/free"
        ],
        "messages": [{ "role": "user", "content": prompt }],
        "response_format": { "type": "json_object" }
      })
    });

    if (!res.ok) throw new Error("OpenRouter fetch failed");
    
    const result = await res.json();
    const responseText = result.choices[0].message.content;
    const data = JSON.parse(responseText);

    return NextResponse.json({ fixedCode: data.fixedCode });
  } catch (error) {
    console.error("Eco-fix error:", error);
    return NextResponse.json({ error: "Errore durante l'eco-fix con Gemini." }, { status: 500 });
  }
}
