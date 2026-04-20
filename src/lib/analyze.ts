import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

export async function analyzeRepository(url: string) {
  if (!url || !url.includes('github.com')) {
    throw new Error("URL GitHub non valido.");
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    throw new Error("Chiave API Gemini non configurata.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Utilizziamo gemini-flash-latest poiché i nuovi account non hanno più accesso alla 1.5
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

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

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { 
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
        temperature: 0.7,
      }
    });

    const responseText = result.response.text();
    
    // Pulisce l'eventuale formattazione markdown (```json ... ```) se Gemini la include per sbaglio
    const cleanedText = responseText.replace(/```json\n?|\n?```/g, "").trim();
    
    let analysisInfo;
    try {
      analysisInfo = JSON.parse(cleanedText);
    } catch (parseError: any) {
      console.error("JSON Parse Error. Raw string was:", responseText);
      throw new Error(`Il formato della risposta AI non era valido. Dettagli: ${parseError.message}`);
    }

    // Salva nello storico in modo non bloccante
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

    return { ...analysisInfo, repo_name };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error("Analyze error details:", errorMsg);
    
    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      throw new Error("Limite richieste API raggiunto. Attendi un minuto e riprova.");
    } else if (errorMsg.includes("timeout") || errorMsg.includes("fetch failed")) {
      throw new Error("L'analisi ha impiegato troppo tempo o c'è un problema di rete (Timeout).");
    }
    
    // Pass the real error forward so we can see what it actually is!
    throw new Error(`Errore AI: ${errorMsg}`);
  }
}
