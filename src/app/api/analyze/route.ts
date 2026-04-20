import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function deterministicMock(url: string) {
  // Generazione deterministica dal nome dell'url
  const hash = url.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const classes = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const energyClass = classes[hash % classes.length];
  
  // Se è verde (A,B), meno emissioni, alta efficienza.
  const isGood = ['A', 'B'].includes(energyClass);
  const co2_estimate = isGood ? (hash % 50) / 10 + 1 : (hash % 500) / 10 + 50;
  const efficiency_score = isGood ? 85 + (hash % 15) : 30 + (hash % 40);
  const ai_optimization_score = isGood ? 90 + (hash % 10) : 40 + (hash % 40);

  const snippets = [
    {
      id: "vuln-1",
      filename: "src/utils/dataFetcher.ts",
      description: "Chiamata ridondante in ciclo: Fetch di dati non ottimizzato che aumenta il carico server e consumo CPU.",
      code: `for (let item of items) {\n  const data = await fetch(\`https://api.example.com/data/\${item.id}\`);\n  results.push(await data.json());\n}`
    },
    {
      id: "vuln-2",
      filename: "src/services/aiService.ts",
      description: "Prompt LLM inefficiente: Invocazione ripetuta di ChatGPT senza batching, enorme spreco di compute.",
      code: `async function translateTexts(texts: string[]) {\n  return Promise.all(texts.map(t => openai.chat.completions.create({\n    model: "gpt-4",\n    messages: [{role: "user", content: \`Traduci: \${t}\`}]\n  })));\n}`
    }
  ];

  return {
    energy_class: energyClass,
    co2_estimate: parseFloat(co2_estimate.toFixed(2)),
    efficiency_score,
    ai_optimization_score,
    snippets: isGood ? snippets.slice(0, 1) : snippets,
  };
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || !url.includes('github.com')) {
      return NextResponse.json({ error: "URL GitHub non valido." }, { status: 400 });
    }

    // Estrai il repo_name dall'url
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    const repo_name = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : url;

    // Genera mock
    const analysisInfo = deterministicMock(url);

    // Salva nel db se utente loggato
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
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json({ error: "Errore durante l'analisi." }, { status: 500 });
  }
}
