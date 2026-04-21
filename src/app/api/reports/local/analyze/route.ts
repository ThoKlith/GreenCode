import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { project_name, source_code } = payload;

    if (!project_name || !source_code || source_code.length < 10) {
      return NextResponse.json(
        { error: "Dati mancanti: servono project_name e source_code." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chiave API Gemini non configurata sul server." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `Agisci come esperto di Eco-Computing e ottimizzazione del software sostenibile.
Ti fornirò un bundle contenente il listato di file di un vero progetto locale chiamato: "${project_name}".

Il tuo compito è analizzare **QUESTO SPECIFICO CODICE REALE** per scovare vere inefficienze energetiche (come cicli CPU pesanti non ottimizzati, chiamate API senza memo/cache, re-render continui nei framework Web, font o import non messi correttamente, dipendenze pesanti inutilizzate, ecc.).

[SOURCE_CODE]
${source_code}
[/SOURCE_CODE]

Basati ESCLUSIVAMENTE sui difetti che trovi in questo preciso sorgente fornito in alto.
NON INVENTARE FILES e preleva gli snippet da righe vere del codice.

Devi restituire SOLO un oggetto JSON valido con la seguente struttura esatta:
{
  "energy_class": "lettera da A a G (A è super green, G è un colabrodo energetico)",
  "co2_estimate": numero (in kg, stima basata sulla complessità e inefficienze del codice analizzato),
  "efficiency_score": numero (da 0 a 100),
  "ai_optimization_score": numero (da 0 a 100),
  "snippets": [
    {
      "id": "vuln-1",
      "filename": "nome ESATTO del vero file tratto da [SOURCE_CODE]",
      "description": "Una breve descrizione concreta dell'anti-pattern riscontrato per l'energia",
      "code": "le esatte righe di codice incriminate lette tra il sorgente inviato (no mock)"
    }
  ]
}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        temperature: 0.2,
      }
    });

    const responseText = result.response.text();
    const cleanedText = responseText.replace(/```json\n?|\n?```/g, "").trim();

    let analysisInfo;
    try {
      analysisInfo = JSON.parse(cleanedText);
    } catch (parseError: any) {
      console.error("JSON Parse Error. Raw:", responseText);
      return NextResponse.json(
        { error: `Risposta AI non valida: ${parseError.message}` },
        { status: 500 }
      );
    }

    // Salva in Supabase
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('local_reports')
      .insert({
        project_name,
        energy_class: analysisInfo.energy_class,
        co2_estimate: analysisInfo.co2_estimate,
        efficiency_score: analysisInfo.efficiency_score,
        ai_optimization_score: analysisInfo.ai_optimization_score,
        snippets: analysisInfo.snippets || []
      })
      .select('id')
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get("origin") || 'http://localhost:3000';

    return NextResponse.json({
      success: true,
      id: data.id,
      url: `${baseUrl}/report/${data.id}`,
      // Restituisci anche i dati grezzi così la CLI può stampare il sommario
      energy_class: analysisInfo.energy_class,
      co2_estimate: analysisInfo.co2_estimate,
      efficiency_score: analysisInfo.efficiency_score,
      ai_optimization_score: analysisInfo.ai_optimization_score,
      snippet_count: analysisInfo.snippets?.length || 0
    });

  } catch (error: any) {
    console.error("API /reports/local/analyze error:", error);
    return NextResponse.json(
      { error: error.message || "Errore interno server" },
      { status: 500 }
    );
  }
}
