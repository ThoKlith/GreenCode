import { Navbar } from "@/components/Navbar";
import { Cpu, FlaskConical, Leaf, Sigma } from "lucide-react";

export const metadata = {
  title: "Methodology | GreenCode",
  description: "GreenCode's static and dynamic approach to estimate software energy efficiency and carbon impact.",
};

export default function MethodologyPage() {
  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-primary/20 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-cyan-500/15 blur-[120px]" />
      </div>

      <Navbar />

      <section className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-8 pt-16 pb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          <FlaskConical className="h-3.5 w-3.5" />
          Scientific Method
        </div>
        <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
          Metodo GreenCode: trasparenza prima di tutto.
        </h1>
        <p className="mt-5 max-w-3xl text-muted-foreground text-base md:text-lg leading-relaxed">
          GreenCode non inventa voti. Traduce pattern computazionali in metriche verificabili,
          combinando scoring statico e profilazione dinamica per stimare impatto energetico e carbonico.
        </p>
      </section>

      <section className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-8 pb-10">
        <article className="rounded-3xl border border-border/50 bg-card/35 backdrop-blur-xl p-6 md:p-8">
          <div className="flex items-center gap-2 text-primary font-semibold uppercase tracking-[0.12em] text-xs">
            <Leaf className="h-4 w-4" />
            Energy Score (Statico)
          </div>

          <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">
            Proxy Metrics e classi energetiche da A a G
          </h2>

          <p className="mt-4 text-muted-foreground leading-relaxed">
            The static phase analyzes code with AST rules and weights each anti-pattern by its potential impact on CPU, memory and battery, especially in mobile scenarios. Examples: N+1 queries in loops, redundant API/LLM calls, heavy frontend dependencies, inefficient React rendering.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/50 bg-background/45 p-4">
              <h3 className="font-semibold flex items-center gap-2"><Cpu className="h-4 w-4 text-primary" /> Computing the score</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Ogni finding riduce lo score con una penalita proporzionale alla severita energetica stimata.
                Lo score finale viene mappato su classe A-G per rendere immediata la lettura del rischio energetico.
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/45 p-4">
              <h3 className="font-semibold flex items-center gap-2"><Sigma className="h-4 w-4 text-primary" /> Interpretazione</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Una classe bassa non e un giudizio estetico: indica probabilita piu alta di spreco computazionale,
                maggiore uso di batteria e costi cloud superiori in produzione.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border/60 bg-background/45 p-4">
            <h3 className="font-semibold">Static analysis commands</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc pl-4">
              <li><code className="px-1 py-0.5 rounded bg-white/10">ecocode analyze</code>: local AST parsing on JS/TS/React with energy findings and A-G score.</li>
              <li><code className="px-1 py-0.5 rounded bg-white/10">ecocode analyze --max-files N</code>: limits the analysis scope.</li>
              <li><code className="px-1 py-0.5 rounded bg-white/10">ecocode analyze --host URL</code>: sends report metadata to a specific dashboard endpoint.</li>
            </ul>
          </div>
        </article>
      </section>

      <section className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-8 pb-20">
        <article className="rounded-3xl border border-border/50 bg-card/35 backdrop-blur-xl p-6 md:p-8">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold uppercase tracking-[0.12em] text-xs">
            <FlaskConical className="h-4 w-4" />
            Software Physics (Dynamic)
          </div>

          <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">
            Dal tempo CPU a Joule, Watt e CO2
          </h2>

          <p className="mt-4 text-muted-foreground leading-relaxed">
            The CLI command <code className="px-1.5 py-0.5 rounded bg-white/10">ecocode profile &lt;file&gt;</code>
            esegue il file localmente e misura il tempo CPU user/system con moduli nativi Node.js.
            Per analisi piu rappresentative su repository reali, <code className="px-1.5 py-0.5 rounded bg-white/10">ecocode profile project</code>
            esegue piu scenari da config, ripete i benchmark e produce una media pesata.
            Da queste misure stimiamo l&apos;energia in mWh con il modello:
          </p>

          <pre className="mt-4 rounded-xl border border-border/60 bg-[oklch(0.1_0_0)] p-4 text-sm text-emerald-300 overflow-x-auto">
{`Energia_mWh = (CPU_Time_ms * Standard_CPU_Wattage) / 3600
CO2_g = (Energia_mWh / 1_000_000) * Carbon_Intensity_gCO2e_per_kWh`}
          </pre>

          <p className="mt-5 text-muted-foreground leading-relaxed">
            Questa e una stima ingegneristica, non una misura da laboratorio. Tuttavia segue logiche di
            efficienza computazionale coerenti con i principi promossi dalla Green Software Foundation:
            usare dati osservabili, esplicitare assunzioni e ottimizzare dove il consumo reale e dimostrabile.
          </p>

          <div className="mt-6 rounded-2xl border border-border/60 bg-background/45 p-4">
            <h3 className="font-semibold">Dynamic scenario config (project)</h3>
            <pre className="mt-3 rounded-xl border border-border/60 bg-[oklch(0.1_0_0)] p-4 text-xs md:text-sm text-cyan-200 overflow-x-auto">
{`{
  "repeat": 3,
  "scenarios": [
    { "name": "API startup", "file": "./dist/server.js", "weight": 3 },
    { "name": "Batch nightly", "file": "./dist/jobs/nightly.js", "weight": 1 }
  ]
}`}
            </pre>
            <p className="mt-3 text-sm text-muted-foreground">
              In questo modo GreenCode combina l&apos;analisi statica globale con benchmark dinamici di flussi reali,
              riducendo il rischio di metriche scollegate dalla produzione.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <h3 className="font-semibold text-emerald-300">Single File Profiling</h3>
              <ol className="mt-3 list-decimal pl-4 space-y-2 text-sm text-muted-foreground">
                <li>Build the project if the target is TypeScript: <code className="px-1 py-0.5 rounded bg-white/10">npm run build</code></li>
                <li>Esegui: <code className="px-1 py-0.5 rounded bg-white/10">npx ecocode@latest profile ./dist/index.js</code></li>
                <li>Compare CPU/mWh/gCO2e before and after a change.</li>
              </ol>
            </div>
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
              <h3 className="font-semibold text-cyan-300">Scenario Project Profiling</h3>
              <ol className="mt-3 list-decimal pl-4 space-y-2 text-sm text-muted-foreground">
                <li>Create the config file: <code className="px-1 py-0.5 rounded bg-white/10">ecocode.profile.json</code></li>
                <li>Esegui: <code className="px-1 py-0.5 rounded bg-white/10">npx ecocode@latest profile project --config ./ecocode.profile.json --repeat 3</code></li>
                <li>Use the weighted average as the repository's energy baseline.</li>
              </ol>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border/60 bg-background/45 p-4">
            <h3 className="font-semibold">GreenCode functional coverage</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc pl-4">
              <li><strong className="text-foreground">Static analysis:</strong> detects energy anti-patterns and generates an A-G Energy Score.</li>
              <li><strong className="text-foreground">Profiling file:</strong> measures real CPU consumption on a script/entrypoint.</li>
              <li><strong className="text-foreground">Project profiling:</strong> aggregates multiple real scenarios with weights and repeated runs.</li>
              <li><strong className="text-foreground">Report dashboard:</strong> visualizes energy KPIs and optimization priorities.</li>
            </ul>
          </div>
        </article>
      </section>
    </main>
  );
}
