"use client";

import { motion } from "framer-motion";
import { Gauge, TerminalSquare } from "lucide-react";

const benchmarkLines = [
  { text: "$ ecocode profile project --config ./ecocode.profile.json", tone: "text-emerald-400" },
  { text: "", tone: "" },
  { text: "Warning: the profile command runs the code locally.", tone: "text-yellow-300" },
  { text: "Dynamic project profiling in progress...", tone: "text-white/70" },
  { text: "", tone: "" },
  { text: "Scenarios: 3  |  Runs per scenario: 5", tone: "text-white/85" },
  { text: "CPU medio pesato:      148.20 ms", tone: "text-cyan-300" },
  { text: "Energia media pesata:  2.6764 mWh", tone: "text-emerald-300 font-semibold" },
  { text: "CO2 media pesata:      1.18e-3 gCO2e", tone: "text-yellow-200" },
];

export function BenchmarkSection() {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 pb-20 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
        className="rounded-3xl border border-border/60 bg-card/30 backdrop-blur-xl p-6 md:p-10"
      >
        <div className="flex flex-col gap-4 md:gap-5 max-w-3xl">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <Gauge className="h-3.5 w-3.5" />
            Benchmark Reale
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.06]">
            Beyond theory: Dynamic Measurement.
          </h2>

          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            While the linter guides you as you write, our CLI profiler puts your code to the test. Run real benchmarks to discover the physical impact of your software in milliwatt-hours. Solid data for extreme optimizations, on single files or entire project flows.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-8 rounded-2xl border border-white/10 bg-[oklch(0.1_0_0)] shadow-[0_0_80px_rgba(0,0,0,0.45)] overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
            <TerminalSquare className="h-4 w-4 text-emerald-300" />
            <span className="font-mono text-xs text-white/50">ecocode benchmark preview</span>
          </div>
          <div className="p-4 md:p-5 font-mono text-[13px] md:text-sm leading-relaxed">
            {benchmarkLines.map((line, index) => (
              <motion.div
                key={`${line.text}-${index}`}
                initial={{ opacity: 0, x: -6 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.24, delay: 0.05 * index }}
                className={`${line.tone} ${line.text ? "" : "h-4"}`}
              >
                {line.text}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-background/40 p-4 md:p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-emerald-300 font-semibold">Single File Profiling</p>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground list-decimal pl-4">
              <li>Build the project if the target is TypeScript (e.g. npm run build).</li>
              <li>Choose a real entrypoint (.js/.mjs/.cjs), not an isolated utility.</li>
              <li>Esegui: <span className="font-mono text-foreground">npx ecocode@latest profile ./dist/index.js</span></li>
              <li>Read CPU Time, mWh and gCO2e to compare before/after optimization.</li>
            </ol>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/40 p-4 md:p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-cyan-300 font-semibold">Scenario Project Profiling</p>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground list-decimal pl-4">
              <li>Crea <span className="font-mono text-foreground">ecocode.profile.json</span> with the real scenarios of the repo.</li>
              <li>Imposta un <span className="font-mono text-foreground">weight</span> for each scenario based on traffic/usage.</li>
              <li>Esegui: <span className="font-mono text-foreground">npx ecocode@latest profile project --config ./ecocode.profile.json --repeat 3</span></li>
              <li>Use the final weighted average as the project's energy KPI.</li>
            </ol>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100/90">
          <strong className="text-amber-200">Nota pratica:</strong> il profiler esegue codice reale in locale.
          Profilare solo file sicuri e ripetere i benchmark (3-5 run) per ridurre rumore statistico.
        </div>
      </motion.div>
    </section>
  );
}
