// GreenCode Agent — modalità SCAN: analisi statica reale + AI, a scala di repo/cartella.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';

function loadEnv() { const e={}; try { for (const l of readFileSync('.env.local','utf-8').split('\n')){ const m=l.match(/^([A-Z0-9_]+)=(.*)$/); if(m) e[m[1]]=m[2].trim(); } } catch{} return e; }

const SKIP = new Set(['node_modules','.next','.git','dist','out','build','.turbo']);
const EXT = new Set(['.js','.mjs','.cjs','.jsx','.ts','.tsx']);
function walk(dir, acc=[]) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = path.join(dir,name); const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (EXT.has(path.extname(name)) && !/\.d\.ts$/.test(name) && !/\.(test|spec)\./.test(name) && !/^(test|tests|__tests__)$/.test(path.basename(path.dirname(p))) && !/\.config\./.test(name)) acc.push(p);
  }
  return acc;
}

// SEGNALE STATICO REALE (calcolato, non stimato): profondità loop annidati + pattern costosi
function staticScore(src) {
  const lines = src.split('\n');
  let depth=0, maxDepth=0, patterns=[];
  const loopRe=/\b(for|while)\b/; 
  // stima profondità loop via bilanciamento graffe attorno ai loop (euristica)
  let brace=0, loopStack=[];
  for (const ln of lines) {
    if (loopRe.test(ln)) { loopStack.push(brace); depth=loopStack.length; maxDepth=Math.max(maxDepth,depth); }
    brace += (ln.match(/{/g)||[]).length - (ln.match(/}/g)||[]).length;
    while (loopStack.length && brace<=loopStack[loopStack.length-1]) loopStack.pop();
  }
  if (/\bfor\b[\s\S]{0,80}\bfor\b/.test(src)) patterns.push('loop annidati (possibile O(n^2))');
  if (/for[\s\S]{0,120}\+=\s*["'`]/.test(src) || /\+=\s*\w+\s*\+\s*["'`]/.test(src)) patterns.push('concatenazione stringa in loop');
  if (/for[\s\S]{0,200}JSON\.(parse|stringify)/.test(src)) patterns.push('JSON parse/stringify in loop');
  const score = maxDepth*10 + patterns.length*8 + Math.min(lines.length/50,5);
  return { loc: lines.length, maxLoopDepth: maxDepth, patterns, score:+score.toFixed(1) };
}

async function aiAnalyze(env, file, s, src, model) {
  const user = `Analisi STATICA reale del file "${path.basename(file)}" ha rilevato: profondità massima loop annidati = ${s.maxLoopDepth}, pattern costosi = [${s.patterns.join('; ')||'nessuno'}], righe = ${s.loc}.
Assegna una classe energetica A-G e trova i colli di bottiglia REALI. Ignora micro-ottimizzazioni. Rispondi SOLO con JSON: {"energy_class":"A-G","findings":[{"title","line","severity":"high|medium|low","problem","optimized_code","estimated_cpu_reduction"}]}
\`\`\`
${src.slice(0,4000)}
\`\`\``;
  const FALLBACKS=[model,'nvidia/nemotron-3-super-120b-a12b','nvidia/nemotron-3-ultra-550b-a55b'].filter((v,i,a)=>a.indexOf(v)===i);
  let lastErr='';
  for (const mdl of FALLBACKS) {
    const ctl=new AbortController(); const to=setTimeout(()=>ctl.abort(),75000);
    try {
      const res=await fetch('https://integrate.api.nvidia.com/v1/chat/completions',{method:'POST',signal:ctl.signal,headers:{'Authorization':`Bearer ${env.NVIDIA_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:mdl,messages:[{role:'user',content:user}],max_tokens:2500,temperature:0.1,response_format:{type:'json_object'}})});
      if(!res.ok){ lastErr='HTTP '+res.status+' ('+mdl+')'; continue; }
      const d=await res.json();
      if(!d.choices){ lastErr='no choices ('+mdl+')'; continue; }
      try { return extractJson(d.choices[0].message.content); }
      catch(pe){ lastErr='parse ('+mdl+'): '+pe.message; continue; }
    } catch(e){ lastErr=e.message+' ('+mdl+')'; } finally { clearTimeout(to); }
  }
  throw new Error(lastErr||'tutti i modelli falliti');
}

const CLASS_RANK={A:1,B:2,C:3,D:4,E:5,F:6,G:7}; const RANK_CLASS=Object.fromEntries(Object.entries(CLASS_RANK).map(([k,v])=>[v,k]));

function extractJson(text){
  let t=text.replace(/<think>[\s\S]*?<\/think>/g,'').replace(/```json/gi,'').replace(/```/g,'');
  // cerca tutti i blocchi { ... } bilanciati e prova a parsarli, dal piu lungo
  const cands=[]; let depth=0,start=-1;
  for(let i=0;i<t.length;i++){ const c=t[i]; if(c==='{'){ if(depth===0)start=i; depth++; } else if(c==='}'){ depth--; if(depth===0&&start>=0){ cands.push(t.slice(start,i+1)); start=-1; } } }
  cands.sort((a,b)=>b.length-a.length);
  for(const c of cands){ try{ return JSON.parse(c); }catch{} }
  throw new Error('nessun JSON valido nella risposta');
}

async function main() {
  const dir=process.argv[2]; const model=process.argv[3]||'nvidia/nemotron-3.5-lightning-30b-a3b'; const topN=+(process.argv[4]||3);
  if(!dir){console.error('uso: node agent/scan.mjs <cartella> [model] [topN]');process.exit(1);}
  const env=loadEnv();
  let target=dir;
  if (/^https?:\/\/github\.com\//i.test(dir)) {
    target=mkdtempSync(path.join(os.tmpdir(),'gc-'));
    console.log(`\n🌱 GreenCode SCAN — clono ${dir} ...`);
    execSync(`git clone --depth 1 --quiet "${dir}" "${target}"`,{stdio:'ignore'});
  }
  console.log(`\n🌱 GreenCode SCAN — ${dir}\n`);
  const files=walk(target).map(f=>({f,...staticScore(readFileSync(f,'utf-8'))})).sort((a,b)=>b.score-a.score);
  console.log(`📂 ${files.length} file analizzati staticamente. Hotspot per impatto:`);
  files.slice(0,6).forEach(x=>console.log(`   score ${String(x.score).padStart(5)} | loop-depth ${x.maxLoopDepth} | ${path.relative(target,x.f)}  ${x.patterns.length?'['+x.patterns.join(', ')+']':''}`));
  console.log(`\n🤖 Analisi AI approfondita sui ${topN} file peggiori...\n`);
  let worst=1, totalFindings=0;
  const targets=files.slice(0,topN);
  const results=await Promise.all(targets.map(async x=>{
    try { return {x, r: await aiAnalyze(env,x.f,x,readFileSync(x.f,'utf-8'),model)}; }
    catch(e){ return {x, err:e.message}; }
  }));
  for (const {x,r,err} of results) {
    if(err){ console.log(`  ── ${path.relative(target,x.f)}  → errore: ${err}`); continue; }
    const cls=(r.energy_class||'D').toUpperCase().slice(0,1);
    worst=Math.max(worst,CLASS_RANK[cls]||4); totalFindings+=(r.findings||[]).length;
    console.log(`  ── ${path.relative(target,x.f)}  → classe ${cls}  (${(r.findings||[]).length} problemi)`);
    (r.findings||[]).forEach(f=>console.log(`       [${(f.severity||'').toUpperCase()}] ${f.title} (riga ~${f.line}) — ${f.estimated_cpu_reduction||''}`));
  }
  console.log(`\n┌${'─'.repeat(46)}`);
  console.log(`│ CLASSE ENERGETICA REPO: ${RANK_CLASS[worst]}   (${totalFindings} ottimizzazioni trovate)`);
  console.log(`└${'─'.repeat(46)}`);
}
main().catch(e=>{console.error('Errore:',e.message);process.exit(1);});
