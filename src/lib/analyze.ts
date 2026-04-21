import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

async function fetchGithubFiles(repoOwner: string, repoName: string, token?: string) {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'EcoCode-App'
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  // 1. Prendi il ramo principale
  const repoRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}`, { headers });
  if (!repoRes.ok) {
    throw new Error(`Impossibile trovare la repository. Potrebbe essere privata o potresti aver esaurito il Rate Limit (60 req/h senza token).`);
  }
  const repoInfo = await repoRes.json();
  const defaultBranch = repoInfo.default_branch;

  // 2. Naviga l'albero
  const treeUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${defaultBranch}?recursive=1`;
  const treeRes = await fetch(treeUrl, { headers });
  if (!treeRes.ok) throw new Error("Impossibile leggere l'albero dei file dal repository.");
  const treeData = await treeRes.json();

  // 3. Filtra file sorgente interessanti per web e scripting
  const allowedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs', '.css', '.html', '.php'];
  let files = treeData.tree.filter((file: any) => {
    if (file.type !== 'blob') return false;
    const p = file.path.toLowerCase();
    // Escludiamo cartelle build/vendor standard
    if (p.includes('node_modules/') || p.includes('dist/') || p.includes('build/') || p.includes('.next/') || p.includes('vendor/')) {
      return false;
    }
    const ext = p.slice((Math.max(0, p.lastIndexOf(".")) || Infinity));
    return allowedExtensions.includes(ext);
  });

  // Limite ~8 file principali per limitare lo spreco di token AI ed evitare l'errore 429 (Quota Limit)
  files = files.slice(0, 8);

  let combinedCode = "";

  // 4. Scarica i file
  const BATCH_SIZE = 4;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (file: any) => {
        const contentUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${file.path}?ref=${defaultBranch}`;
        const cHeaders = { ...headers, 'Accept': 'application/vnd.github.v3.raw' };
        const rawRes = await fetch(contentUrl, { headers: cHeaders });
        if (rawRes.ok) {
          let text = await rawRes.text();
          // Tagliamo i file grandi: prendiamo massimo le prime 500 righe (~15000 char) per file
          if (text.length > 20000) {
             text = text.slice(0, 20000) + "\n...[TRUNCATED]";
          }
          return `\n--- FILE: ${file.path} ---\n${text}\n\n`;
        }
        return "";
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        combinedCode += r.value;
      }
    }
  }

  // Selezioniamo in via definitiva massimo ~60.000 caratteri complessivi da inviare al modello.
  // 60k caratteri sono circa 15k token, molto al di sotto del limite di 1M token/minuto gratuito,
  // garantendo l'immunità da blocchi 429 per l'invio troppo massivo.
  if (combinedCode.length > 80000) {
    combinedCode = combinedCode.slice(0, 80000) + "\n...[TRUNCATED BUNDLE]";
  }

  return combinedCode;
}


export async function analyzeRepository(url: string) {
  if (!url || !url.includes('github.com')) {
    throw new Error("URL GitHub non valido.");
  }

  const decodedUrl = decodeURIComponent(url);
  
  let parts;
  try {
    parts = new URL(decodedUrl).pathname.split('/').filter(Boolean);
  } catch {
    parts = decodedUrl.replace('https://github.com/', '').split('/').filter(Boolean);
  }

  if (parts.length < 2) {
    throw new Error("Formato repository invalido. Usa owner/repo.");
  }

  const repoOwner = parts[0];
  // Rimuovi il suffisso .git se presente (es. repo.git -> repo)
  const repoNameInfo = parts[1].replace(/\.git$/, '');
  const repo_name = `${repoOwner}/${repoNameInfo}`;

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chiave API OpenRouter non configurata.");
  }

  // Preleva il vero codice sorgente limitato
  const githubToken = process.env.GITHUB_TOKEN || '';
  const sourceCodeBundle = await fetchGithubFiles(repoOwner, repoNameInfo, githubToken);

  if (!sourceCodeBundle || sourceCodeBundle.length < 10) {
    throw new Error("Nessun codice sorgente valevole trovato. La repository è vuota o supporta solo linguaggi non parsati.");
  }

  const prompt = `Agisci come esperto di Eco-Computing e ottimizzazione del software sostenibile.
Ti fornirò un bundle contenente il listato di file di una vera repository: "${repo_name}". 

Il tuo compito è analizzare **QUESTO SPECIFICO CODICE REALE** per scovare vere inefficienze energetiche (come cicli CPU pesanti continui non ottimizzati, chiamate API senza memo/cache, re-render continui nei framework Web, font o import non messi correttamente ecc.).

[SOURCE_CODE]
${sourceCodeBundle}
[/SOURCE_CODE]

Basati ESCLUSIVAMENTE sui difetti che trovi in questo preciso sorgente fornito in alto. 
NON INVENTARE FILES e preleva gli snippet da righe vere del codice.

Devi restituire SOLO un oggetto JSON valido con la seguente struttura esatta (NO markdown, NO testo fuori dal JSON):
{
  "energy_class": "A",
  "co2_estimate": 0.15,
  "efficiency_score": 85,
  "ai_optimization_score": 90,
  "snippets": [
    {
      "id": "vuln-1",
      "filename": "nome ESATTO del vero file",
      "description": "Una breve descrizione",
      "code": "le esatte righe incriminate"
    }
  ]
}`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ecocode.app", 
        "X-Title": "EcoCode",
      },
      body: JSON.stringify({
        "models": [
          "meta-llama/llama-3.3-70b-instruct:free",
          "openrouter/free"
        ],
        "messages": [
          { "role": "user", "content": prompt }
        ],
        "response_format": { "type": "json_object" },
        "temperature": 0.2
      })
    });

    if (!res.ok) {
        throw new Error(`OpenRouter Error: ${res.statusText}`);
    }

    const result = await res.json();
    const responseText = result.choices[0].message.content;
    const cleanedText = responseText.replace(/```json\n?|\n?```/g, "").trim();
    
    let analysisInfo;
    try {
      analysisInfo = JSON.parse(cleanedText);
    } catch (parseError: any) {
      console.error("JSON Parse Error. Raw string was:", responseText);
      throw new Error(`Il formato della risposta AI non era valido. Dettagli: ${parseError.message}`);
    }

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
    
    throw new Error(`Errore AI: ${errorMsg}`);
  }
}
