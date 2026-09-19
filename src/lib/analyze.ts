import { createClient } from '@/lib/supabase/server';
import { getAiConfig } from '@/lib/ai';

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
    'User-Agent': 'GreenCode-App'
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  // 1. Prendi il ramo principale
  const repoRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}`, { headers });
  if (!repoRes.ok) {
    throw new Error(`Repository not found. It may be private or you may have exceeded the Rate Limit (60 req/h without a token).`);
  }
  const repoInfo = (await repoRes.json()) as RepoInfo;
  const defaultBranch = repoInfo.default_branch;

  // 2. Naviga l'albero
  const treeUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${defaultBranch}?recursive=1`;
  const treeRes = await fetch(treeUrl, { headers });
  if (!treeRes.ok) throw new Error("Unable to read the file tree from the repository.");
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
    throw new Error("Invalid GitHub URL.");
  }

  const decodedUrl = decodeURIComponent(url);
  
  let parts;
  try {
    parts = new URL(decodedUrl).pathname.split('/').filter(Boolean);
  } catch {
    parts = decodedUrl.replace('https://github.com/', '').split('/').filter(Boolean);
  }

  if (parts.length < 2) {
    throw new Error("Invalid repository format. Use owner/repo.");
  }

  const repoOwner = parts[0];
  // Rimuovi il suffisso .git se presente (es. repo.git -> repo)
  const repoNameInfo = parts[1].replace(/\.git$/, '');
  const repo_name = `${repoOwner}/${repoNameInfo}`;

  const ai = getAiConfig();
  if (!ai.apiKey) {
    throw new Error("No AI provider configured (set OPENAI_API_KEY or NVIDIA_API_KEY).");
  }

  // Preleva il vero codice sorgente limitato
  const githubToken = process.env.GITHUB_TOKEN || '';
  const sourceCodeBundle = await fetchGithubFiles(repoOwner, repoNameInfo, githubToken);

  if (!sourceCodeBundle || sourceCodeBundle.length < 10) {
    throw new Error("No valid source code found. The repository is empty or only contains unparsed languages.");
  }

  const prompt = `Act as an expert in Eco-Computing and sustainable software optimization.
I will give you a bundle containing the file listing of a real repository: "${repo_name}".

Your task is to analyze **THIS SPECIFIC REAL CODE** to find genuine energy inefficiencies (such as heavy uninterrupted CPU loops, API calls without memoization/caching, continuous re-renders in web frameworks, badly placed fonts or imports, etc.).

[SOURCE_CODE]
${sourceCodeBundle}
[/SOURCE_CODE]

Base your analysis EXCLUSIVELY on the flaws you find in this exact source provided above.
DO NOT INVENT FILES and take snippets from real lines of the code.

IMPORTANT: write ALL text fields (especially "description") in ENGLISH.

IMPORTANT: the values below are ONLY format placeholders. Compute the REAL values by analyzing the provided code — DO NOT copy the placeholders. Code with nested O(n^2) loops, string concatenation in loops, or repeated redundant work is inefficient (class E-G, low efficiency_score). Clean and optimized code is class A-B with a high score.

Return ONLY a valid JSON object with this structure (replace EACH placeholder with the real computed value):
{
  "energy_class": "<a single letter A-G based on the real efficiency of the code>",
  "co2_estimate": <number: real gCO2e estimate>,
  "efficiency_score": <integer 0-100, real>,
  "ai_optimization_score": <integer 0-100, real>,
  "snippets": [
    {
      "id": "vuln-1",
      "filename": "<EXACT name of the real file where the problem is>",
      "description": "<the real energy problem found in that code, in English>",
      "code": "<the exact offending lines, copied from the source>"
    }
  ]
}`;

  try {
    // Motore AI: NVIDIA NIM con fallback automatico tra modelli.
    // Primario: gemma-4-31b-it (modello instruct che restituisce JSON DIRETTO senza
    // ragionamento in prosa — i modelli reasoning Nemotron sprecano token "pensando"
    // e su repo grandi non arrivano mai a produrre il JSON, causando errori di parsing).
    // I reasoning restano come fallback: funzionano su input piccoli.
    const models = ai.models;
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
    for (const model of models) {
      try {
        const res = await fetch(`${ai.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${ai.apiKey}`,
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
        if (!text) { lastErr = `Empty response (${model})`; continue; }
        const parsed = extractJson(text);
        if (parsed && parsed.energy_class) { analysisInfo = parsed; break; }
        lastErr = `Invalid or incomplete JSON (${model})`;
      } catch (e) {
        lastErr = (e instanceof Error ? e.message : String(e)) + ` (${model})`;
      }
    }
    if (!analysisInfo) {
      throw new Error(`The AI response format was invalid or the engine is unavailable. Details: ${lastErr}`);
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
      throw new Error("The analysis took too long or there's a network problem (Timeout).");
    }
    
    throw new Error(`Errore AI: ${errorMsg}`);
  }
}
