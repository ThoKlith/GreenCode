// GreenCode Agent v2 — analisi grounded di qualità: misura reale -> ottimizzazione AI strutturata.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].trim();
    }
  } catch {}
  return env;
}

function measure(file) {
  const out = execFileSync('node', ['cli/bin/cli.js', 'profile', file], { encoding: 'utf-8' });
  const n = (re) => { const m = out.match(re); return m ? m[1] : null; };
  return { cpuMs: n(/CPU Time Totale:\s*([\d.]+)\s*ms/), energyMWh: n(/Energia Stimata:\s*([\d.]+)\s*mWh/), co2g: n(/CO2 Stimata:\s*([\d.eE+-]+)\s*gCO2e/) };
}

function extractJson(text) {
  // rimuove eventuali tracce di ragionamento <think>...</think> e fence markdown
  let t = text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```json/gi, '').replace(/```/g, '');
  const s = t.indexOf('{'), e = t.lastIndexOf('}');
  if (s === -1 || e === -1) throw new Error('nessun JSON nella risposta');
  return JSON.parse(t.slice(s, e + 1));
}

async function analyze(env, file, m, source, model) {
  const system = `Sei un ingegnere senior specializzato in green software e performance. Analizzi codice per ridurne il consumo energetico REALE. Sei rigoroso: proponi solo refactor CORRETTI che preservano il comportamento, e stimi l'impatto con onestà. Rispondi ESCLUSIVAMENTE con un oggetto JSON valido, senza testo attorno.`;
  const user = `Un profiler ha ESEGUITO e MISURATO questo file (numeri reali, non stime):
- CPU time: ${m.cpuMs} ms  |  Energia: ${m.energyMWh} mWh  |  CO2: ${m.co2g} gCO2e

Trova i colli di bottiglia energetici REALI nel codice (complessità algoritmica, allocazioni inutili, I/O ripetuto, lavoro ridondante nei loop). Ignora micro-ottimizzazioni irrilevanti come var-vs-let.

Restituisci SOLO questo JSON:
{
  "energy_class": "A|B|C|D|E|F|G",   // A = molto efficiente, G = molto inefficiente, basato sulla gravità dei problemi
  "summary": "una frase sul profilo energetico del file",
  "findings": [
    {
      "title": "titolo breve del problema",
      "line": <numero riga approssimativo>,
      "severity": "high|medium|low",
      "problem": "cosa fa sprecare CPU/energia, riferito a questo codice preciso",
      "optimized_code": "lo snippet corretto e ottimizzato",
      "estimated_cpu_reduction": "stima onesta, es. '~90% su questa funzione (O(n^2)->O(n))'"
    }
  ]
}

FILE: ${path.basename(file)}
\`\`\`javascript
${source.slice(0, 5000)}
\`\`\``;

  const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.NVIDIA_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], max_tokens: 2000, temperature: 0.1 }),
  });
  const data = await res.json();
  if (!data.choices) throw new Error('NVIDIA: ' + JSON.stringify(data).slice(0, 200));
  return { raw: data.choices[0].message.content, model: data.model };
}

async function main() {
  const file = process.argv[2];
  const model = process.argv[3] || 'nvidia/nemotron-3-super-120b-a12b';
  if (!file) { console.error('uso: node agent/analyze.mjs <file> [model]'); process.exit(1); }
  const env = loadEnv();
  console.log(`\n🌱 GreenCode Agent v2 — ${file}  (modello: ${model})\n`);
  const m = measure(file);
  console.log(`⚙  MISURATO: CPU ${m.cpuMs}ms | ${m.energyMWh}mWh | ${m.co2g}gCO2e\n🤖 Analisi AI...\n`);
  const { raw } = await analyze(env, file, m, readFileSync(file, 'utf-8'), model);
  let j;
  try { j = extractJson(raw); } catch (e) { console.error('parse fallito:', e.message, '\n--- raw ---\n', raw.slice(0, 800)); process.exit(1); }
  console.log('┌' + '─'.repeat(58));
  console.log(`│ CLASSE ENERGETICA: ${j.energy_class}   ${j.summary || ''}`);
  console.log('└' + '─'.repeat(58));
  (j.findings || []).forEach((f, i) => {
    console.log(`\n[${i + 1}] ${(f.severity || '').toUpperCase()} — ${f.title}  (riga ~${f.line})`);
    console.log(`    Problema: ${f.problem}`);
    console.log(`    Impatto stimato: ${f.estimated_cpu_reduction}`);
    console.log(`    Fix:\n` + String(f.optimized_code || '').split('\n').map(l => '      ' + l).join('\n'));
  });
  console.log(`\n✔ ${(j.findings || []).length} problemi trovati. JSON valido.`);
}
main().catch(e => { console.error('Errore:', e.message); process.exit(1); });
