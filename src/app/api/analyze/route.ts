import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || !url.includes('github.com')) {
      return NextResponse.json({ error: "URL GitHub non valido." }, { status: 400 });
    }

    const parts = new URL(url).pathname.split('/').filter(Boolean);
    const repo_name = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : url;

    // Use Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
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
      generationConfig: { responseMimeType: "application/json" }
    });

    const responseText = result.response.text();
    const analysisInfo = JSON.parse(responseText);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('search_history').insert({
        user_id: user.id,
        github_url: url,
        repo_name: repo_name,
        energy_class: analysisInfo.energy_class,
        co2_estimate: analysisInfo.co2_estimate,
        efficiency_score: analysisInfo.efficiency_score,
        ai_optimization_score: analysisInfo.ai_optimization_score,
      });
    }

    return NextResponse.json({ ...analysisInfo, repo_name });
  } catch (error: any) {
    console.error("Analyze error:", error);
    return NextResponse.json({ error: "Errore durante l'analisi con Gemini." }, { status: 500 });
  }
}
