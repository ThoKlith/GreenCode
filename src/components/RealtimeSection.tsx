"use client";

import { motion } from "framer-motion";
import { Bolt, MousePointer2, Sparkles } from "lucide-react";

const editorLines = [
  { code: "for (const user of users) {", tone: "normal" },
  { code: "  await db.orders.findMany({ where: { userId: user.id } });", tone: "warn" },
  { code: "}", tone: "normal" },
  { code: "", tone: "normal" },
  { code: "const items = products.map((p) => <Card product={p} />);", tone: "good" },
];

export function RealtimeSection() {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 mt-24">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
          <Bolt className="w-4 h-4" />
          Programma in Tempo Reale
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
          EcoCode ora vive
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#4ADE80] to-[#2DD4BF]"> dentro VS Code</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Non aspettare di aver finito. EcoCode ti assiste mentre scrivi, evidenziando gli sprechi energetici come un correttore ortografico.
          Ottimizza il tuo codice prima ancora di salvarlo.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <motion.div
          initial={{ opacity: 0, x: -36 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.15 }}
          className="relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/25 via-emerald-500/20 to-lime-400/20 rounded-2xl blur-lg opacity-80" />
          <div className="relative rounded-2xl border border-white/10 bg-[oklch(0.11_0_0)] overflow-hidden shadow-2xl">
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 text-xs text-white/60">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              <span className="ml-2 uppercase tracking-[0.12em]">ecocode-extension.tsx</span>
            </div>

            <div className="font-mono text-sm text-white/80 p-5 space-y-2 relative min-h-[280px]">
              {editorLines.map((line, index) => (
                <div
                  key={`${line.code}-${index}`}
                  className={line.tone === "warn" ? "underline decoration-yellow-300 decoration-wavy underline-offset-4" : line.tone === "good" ? "underline decoration-emerald-300 decoration-wavy underline-offset-4" : ""}
                >
                  {line.code || <span className="opacity-0">.</span>}
                </div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.55, duration: 0.35 }}
                className="absolute right-4 top-24 w-[260px] rounded-xl border border-emerald-400/30 bg-[oklch(0.16_0.02_160)]/95 p-3 shadow-xl"
              >
                <p className="text-emerald-300 text-xs font-semibold mb-1">EcoCode Insight</p>
                <p className="text-white/80 text-xs leading-relaxed">
                  Questo loop puo rallentare il server e consumare batteria inutile. Vuoi applicare una Eco-Fix automatica?
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 36 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.2 }}
          className="space-y-4"
        >
          <div className="rounded-xl border border-border/50 bg-card/30 p-5 backdrop-blur">
            <div className="flex items-start gap-3">
              <MousePointer2 className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold text-lg">Feedback immediato, stress zero</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Sottolineature verdi e gialle mostrano solo i pattern che contano, senza rumore e senza interrompere il flusso.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/30 p-5 backdrop-blur">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold text-lg">Quick Fix con AI</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Un click sulla lampadina e EcoCode propone un refactoring energeticamente migliore, rispettando il tuo contesto locale.
                </p>
              </div>
            </div>
          </div>

          <a
            href="https://marketplace.visualstudio.com/items?itemName=ecocode.ecocode"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_10px_40px_rgba(16,185,129,0.25)]"
          >
            Aggiungi a VS Code
          </a>
        </motion.div>
      </div>
    </section>
  );
}
