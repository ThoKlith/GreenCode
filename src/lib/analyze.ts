import { createClient } from '@/lib/supabase/server';

type RepoInfo = {
  default_branch: string;
};

type TreeNode = {
  type: string;
  path: string;
  size?: number;
};

type TreeResponse = {
  tree: TreeNode[];
};

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
  const repoInfo = (await repoRes.json()) as RepoInfo;
  const defaultBranch = repoInfo.default_branch;

  // 2. Naviga l'albero
  const treeUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${defaultBranch}?recursive=1`;
  const treeRes = await fetch(treeUrl, { headers });
  if (!treeRes.ok) throw new Error("Impossibile leggere l'albero dei file dal repository.");
  const treeData = (await treeRes.json()) as TreeResponse;

  // 3. Filtra file sorgente con LOGICA (dove vivono gli sprechi energetici).
  // Rimossi .css/.html: contano poco per l'energia computazionale.
  const allowedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs', '.php'];
  let files = treeData.tree.filter((file) => {
    if (file.type !== 'blob') return false;
    const p = file.path.toLowerCase();
    // Escludi build/vendor
    if (/(^|\/)(node_modules|dist|build|\.next|out|vendor|coverage)\//.test(p)) return false;
    // Escludi rumore: type-defs, test, config, generati/minificati, lockfile
    if (/\.d\.ts$|\.(test|spec)\.|\.config\.|\.min\.|-lock\.|\.stories\./.test(p)) return false;
    const base = p.split('/').pop() || '';
    if (['next.config.ts', 'next.config.js', 'tailwind.config.ts', 'postcss.config.mjs', 'eslint.config.mjs', 'next-env.d.ts'].includes(base)) return false;
    const ext = p.slice((Math.max(0, p.lastIndexOf(".")) || Infinity));
    return allowedExtensions.includes(ext);
  });

  // Punteggio di RILEVANZA: preferisci i file dove è più probabile ci sia logica pesante
  // (cartelle sorgente + dimensione media/grande), penalizza indici e barrel file banali.
  const relevance = (f: TreeNode) => {
    const p = f.path.toLowerCase();
    let s = Math.min(f.size || 0, 30000) / 1000; // dimensione (kB, cappata)
    if (/(^|\/)(src|lib|app|components|pages|api|routes|utils|services|hooks|core|engine)\//.test(p)) s += 20;
    if (/index\.(ts|js|tsx|jsx)$|constants?\.|types?\./.test(p)) s -= 8; // indici/costanti = poca logica
    return s;
  };
  files.sort((a, b) => relevance(b) - relevance(a));

  // Prendiamo i ~6 file PIÙ rilevanti (non i primi a caso dell'albero).
  files = files.slice(0, 6);

  let combinedCode = "";

  // 4. Scarica i file
  const BATCH_SIZE = 4;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (file) => {
        const contentUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${file.path}?ref=${defaultBranch}`;
        const cHeaders = { ...headers, 'Accept': 'application/vnd.github.v3.raw' };
        const rawRes = await fetch(contentUrl, { headers: cHeaders });
        if (rawRes.ok) {
          let text = await rawRes.text();
          // Tagliamo i file grandi: prendiamo massimo le prime 500 righe (~15000 char) per file
          if (text.length > 12000) {
             text = text.slice(0, 12000) + "\n...[TRUNCATED]";
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
  if (combinedCode.length > 45000) {
    combinedCode = combinedCode.slice(0, 45000) + "\n...[TRUNCATED BUNDLE]";
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

  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (!nvidiaKey) {
    throw new Error("Chiave API NVIDIA non configurata (NVIDIA_API_KEY).");
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

IMPORTANTE: i valori qui sotto sono SOLO placeholder di formato. Calcola i valori REALI analizzando il codice fornito — NON copiare i placeholder. Un codice con loop annidati O(n^2), concatenazioni di stringhe in loop, o lavoro ridondante ripetuto è inefficiente (classe E-G, efficiency_score basso). Un codice pulito e ottimizzato è classe A-B con score alto.

Restituisci SOLO un oggetto JSON valido con questa struttura (sostituisci OGNI placeholder con il valore reale calcolato):
{
  "energy_class": "<lettera A-G basata sulla reale efficienza del codice>",
  "co2_estimate": <numero: stima gCO2e reale>,
  "efficiency_score": <intero 0-100 reale>,
  "ai_optimization_score": <intero 0-100 reale>,
  "snippets": [
    {
      "id": "vuln-1",
      "filename": "<nome ESATTO del vero file dove sta il problema>",
      "description": "<il problema energetico reale trovato in quel codice>",
      "code": "<le esatte righe incriminate, copiate dal sorgente>"
    }
  ]
}`;

  try {
    // Motore AI: NVIDIA NIM con fallback automatico tra modelli.
    // Primario: gemma-4-31b-it (modello instruct che restituisce JSON DIRETTO senza
    // ragionamento in prosa — i modelli reasoning Nemotron sprecano token "pensando"
    // e su repo grandi non arrivano mai a produrre il JSON, causando errori di parsing).
    // I reasoning restano come fallback: funzionano su input piccoli.
    const NVIDIA_MODELS = [
      "google/gemma-4-31b-it",
      "nvidia/nemotron-3-super-120b-a12b",
      "nvidia/nemotron-3-ultra-550b-a55b",
    ];
    // Estrazione JSON robusta: i modelli reasoning avvolgono il JSON in testo/ragionamento.
    // Cerca il blocco { } bilanciato piu grande che parsa correttamente.
    const extractJson = (text: string): any => {
      const t = text
        .replace(/<think>[\s\S]*?<\/think>/g, "")
        .replace(/```json/gi, "")
        .replace(/```/g, "");
      const candidates: string[] = [];
      let depth = 0, start = -1;
      for (let i = 0; i < t.length; i++) {
        const c = t[i];
        if (c === "{") { if (depth === 0) start = i; depth++; }
        else if (c === "}") { depth--; if (depth === 0 && start >= 0) { candidates.push(t.slice(start, i + 1)); start = -1; } }
      }
      candidates.sort((a, b) => b.length - a.length);
      for (const c of candidates) { try { return JSON.parse(c); } catch { /* prova il prossimo candidato */ } }
      return null;
    };

    // Ciclo con fallback: la validazione JSON e DENTRO il ciclo, cosi un modello
    // che restituisce JSON sporco fa passare al modello successivo invece di fallire.
    let analysisInfo: any = null;
    let lastErr = "";
    for (const model of NVIDIA_MODELS) {
      try {
        const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${nvidiaKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.2,
            max_tokens: 4000,
          }),
        });
        if (!res.ok) { lastErr = `NVIDIA HTTP ${res.status} (${model})`; continue; }
        const result = await res.json();
        const text = result?.choices?.[0]?.message?.content;
        if (!text) { lastErr = `Risposta vuota (${model})`; continue; }
        const parsed = extractJson(text);
        if (parsed && parsed.energy_class) { analysisInfo = parsed; break; }
        lastErr = `JSON non valido o incompleto (${model})`;
      } catch (e) {
        lastErr = (e instanceof Error ? e.message : String(e)) + ` (${model})`;
      }
    }
    if (!analysisInfo) {
      throw new Error(`Il formato della risposta AI non era valido o motore non disponibile. Dettagli: ${lastErr}`);
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
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Analyze error details:", errorMsg);
    
    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      throw new Error("Limite richieste API raggiunto. Attendi un minuto e riprova.");
    } else if (errorMsg.includes("timeout") || errorMsg.includes("fetch failed")) {
      throw new Error("L'analisi ha impiegato troppo tempo o c'è un problema di rete (Timeout).");
    }
    
    throw new Error(`Errore AI: ${errorMsg}`);
  }
}
