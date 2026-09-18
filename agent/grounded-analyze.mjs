// GreenCode Agent — analisi "grounded": misura VERA (via CLI) -> ottimizzazione AI (NVIDIA)
// Nuovo modulo costruito per l'hackathon. Ancora l'AI ai numeri misurati, non a una stima a occhio.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

function loadEnv() {
  const env = {};
  try {
    const raw = readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].trim();
    }
  } catch {}
  return env;
}

// 1) MISURA REALE: lancia la CLI esistente e parsa i numeri veri
function measure(file) {
  const out = execFileSync('node', ['cli/bin/cli.js', 'profile', file], { encoding: 'utf-8' });
  const num = (re) => { const m = out.match(re); return m ? m[1] : null; };
  return {
    cpuMs: num(/CPU Time Totale:\s*([\d.]+)\s*ms/),
    energyMWh: num(/Energia Stimata:\s*([\d.]+)\s*mWh/),
    co2g: num(/CO2 Stimata:\s*([\d.eE+-]+)\s*gCO2e/),
  };
}

// 2) OTTIMIZZAZIONE AI fondata sulla misura
async function optimize(env, file, m, source) {
  const prompt = `Sei un esperto di software sostenibile. Un profiler REALE ha ESEGUITO questo file e MISURATO:
- CPU time: ${m.cpuMs} ms
- Energia: ${m.energyMWh} mWh
- CO2: ${m.co2g} gCO2e

Questi sono numeri MISURATI, non stime. Analizza il codice qui sotto e proponi 1-3 ottimizzazioni CONCRETE che ridurrebbero il tempo CPU (e quindi energia/CO2). Per ognuna: cita la riga, spiega perché consuma, e dai il codice ottimizzato. Sii specifico e conciso.

FILE: ${file}
\`\`\`
${source.slice(0, 4000)}
\`\`\``;

  const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.NVIDIA_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mistralai/mistral-nemotron',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800, temperature: 0.2,
    }),
  });
  const data = await res.json();
  if (!data.choices) throw new Error('NVIDIA: ' + JSON.stringify(data).slice(0, 200));
  return data.choices[0].message.content;
}

async function main() {
  const file = process.argv[2];
  if (!file) { console.error('uso: node agent/grounded-analyze.mjs <file.js>'); process.exit(1); }
  const env = loadEnv();
  console.log(`\n🌱 GreenCode Agent — analisi grounded di ${file}\n`);
  console.log('⚙  Misurazione reale (CLI)...');
  const m = measure(file);
  console.log(`   CPU ${m.cpuMs} ms | Energia ${m.energyMWh} mWh | CO2 ${m.co2g} gCO2e\n`);
  console.log('🤖 Ottimizzazione AI (NVIDIA Nemotron) fondata sui numeri misurati...\n');
  const src = readFileSync(file, 'utf-8');
  const suggestions = await optimize(env, file, m, src);
  console.log('─'.repeat(60));
  console.log(suggestions);
  console.log('─'.repeat(60));
}
main().catch(e => { console.error('Errore:', e.message); process.exit(1); });
