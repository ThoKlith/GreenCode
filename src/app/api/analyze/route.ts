import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || !url.includes('github.com')) {
      return NextResponse.json({ error: "URL GitHub non valido." }, { status: 400 });
    }

    // Decode the URL in case it's double-encoded
    const decodedUrl = decodeURIComponent(url);
    
    let parts;
    try {
      parts = new URL(decodedUrl).pathname.split('/').filter(Boolean);
    } catch {
      parts = decodedUrl.replace('https://github.com/', '').split('/').filter(Boolean);
    }
    const repo_name = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : decodedUrl;

    // Use Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set");
      return NextResponse.json({ error: "Chiave API Gemini non configurata." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use 1.5-flash as it has more generous free-tier limits
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analizza sinteticamente l'impatto ecologico del repository GitHub: ${repo_name}. 
Basati sulle best practice di codice (se front-end o back-end, pattern tipici).
Devi restituire SOLO un oggetto JSON valido con la seguente struttura esatta:
{
  "energy_class": "lettera da A a G",
  "co2_estimate": numero (stima fittizia realistica in kg),
  "efficiency_score": numero (da 0 a 100),
  "ai_optimization_score": numero (da 0 a 100),
  "snippets": [
    {
      "id": "identificatore univoco es. vuln-1",
      "filename": "nome file fittizio ma plausibile per il repo",
      "description": "descrizione sintetica del problema ecologico di codice in italiano",
      "code": "codice anti-pattern di esempio"
    }
  ]
}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { 
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
        temperature: 0.7,
      }
    });

    const responseText = result.response.text();
    console.log("Gemini response (first 200 chars):", responseText.substring(0, 200));
    
    const analysisInfo = JSON.parse(responseText);

    // Save to history (non-blocking, don't crash if it fails)
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('search_history').insert({
          user_id: user.id,
          github_url: decodedUrl,
          repo_name: repo_name,
          energy_class: analysisInfo.energy_class,
          co2_estimate: analysisInfo.co2_estimate,
          efficiency_score: analysisInfo.efficiency_score,
          ai_optimization_score: analysisInfo.ai_optimization_score,
        });
      }
    } catch (dbError) {
      console.error("DB insert error (non-fatal):", dbError);
    }

    return NextResponse.json({ ...analysisInfo, repo_name });
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error("Analyze error details:", errorMsg);
    
    let userMessage = "Errore sconosciuto durante l'analisi.";
    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      userMessage = "Limite richieste API raggiunto. Attendi un minuto e riprova.";
    } else if (errorMsg.includes("timeout")) {
      userMessage = "L'analisi ha impiegato troppo tempo.";
    }
    
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
