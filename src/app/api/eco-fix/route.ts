import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { code, filename } = await request.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const responseText = result.response.text();
    const data = JSON.parse(responseText);

    return NextResponse.json({ fixedCode: data.fixedCode });
  } catch (error) {
    console.error("Eco-fix error:", error);
    return NextResponse.json({ error: "Errore durante l'eco-fix con Gemini." }, { status: 500 });
  }
}
