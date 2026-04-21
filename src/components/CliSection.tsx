"use client";

import { Terminal, Shield, ArrowRight, Copy, Check } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const terminalLines = [
  { text: "$ npx ecocode@latest analyze", color: "text-emerald-400", delay: 0 },
  { text: "", color: "", delay: 0.3 },
  { text: "🌱 EcoCode CLI - Analisi Reale del Codice Sorgente", color: "text-emerald-300 font-bold", delay: 0.5 },
  { text: "", color: "", delay: 0.7 },
  { text: "✓ Trovati 47 file sorgenti nel progetto: my-app", color: "text-green-400", delay: 1.0 },
  { text: "✓ Analisi architetturale completata.", color: "text-green-400", delay: 1.5 },
  { text: "✓ Pattern energetici calcolati.", color: "text-green-400", delay: 2.0 },
  { text: "", color: "", delay: 2.3 },
  { text: "┌──────────────────────────────────────────┐", color: "text-white/60", delay: 2.5 },
  { text: "│        📊 RISULTATI ANALISI REALE        │", color: "text-white font-bold", delay: 2.6 },
  { text: "├──────────────────────────────────────────┤", color: "text-white/60", delay: 2.7 },
  { text: "  Classe Energetica:     B", color: "text-emerald-400", delay: 2.9 },
  { text: "  CO2 Stimata:           0.32 kg/anno", color: "text-white/80", delay: 3.1 },
  { text: "  Efficienza Codice:     82/100", color: "text-cyan-400", delay: 3.3 },
  { text: "  Vulnerabilità trovate: 3", color: "text-yellow-400", delay: 3.5 },
  { text: "└──────────────────────────────────────────┘", color: "text-white/60", delay: 3.7 },
  { text: "", color: "", delay: 3.9 },
  { text: "🌍 Report completo:", color: "text-white font-bold", delay: 4.1 },
  { text: "   https://ecocode.app/report/a1b2c3d4", color: "text-blue-400 underline", delay: 4.3 },
];

export function CliSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("npx ecocode@latest analyze");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="w-full max-w-6xl mx-auto mt-24 mb-16 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
          <Shield className="w-4 h-4" />
          Privacy-First
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
          Repo privata?{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#4ADE80] to-[#2DD4BF]">
            Analizzala in locale.
          </span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Con la CLI analizzi il progetto dalla tua macchina e ottieni un report completo in pochi secondi.
          Per generare i suggerimenti AI, viene inviato al server un bundle limitato di file sorgente selezionati.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Terminale Animato */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-emerald-500/20 to-teal-500/30 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-[oklch(0.10_0_0)] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Barra del terminale */}
            <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs text-white/40 font-mono">ecocode — terminal</span>
            </div>

            {/* Contenuto terminale */}
            <div className="p-5 font-mono text-sm leading-relaxed min-h-[420px] overflow-hidden">
              {terminalLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: line.delay }}
                  className={`${line.color} ${!line.text ? "h-4" : ""}`}
                >
                  {line.text}
                </motion.div>
              ))}
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 4.5 }}
                className="inline-block w-2.5 h-5 bg-emerald-400 animate-pulse mt-2"
              />
            </div>
          </div>
        </motion.div>

        {/* Card Istruzioni */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="space-y-6"
        >
          {/* Step 1 */}
          <div className="bg-card/30 border border-border/50 rounded-xl p-5 backdrop-blur hover:border-primary/30 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
                1
              </div>
              <h3 className="font-semibold text-lg">Installa ed esegui</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Un solo comando. Richiede Node.js 18+ e connessione Internet.
            </p>
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-between bg-[oklch(0.10_0_0)] border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-emerald-400 hover:border-primary/40 transition-all duration-200 cursor-pointer group"
            >
              <span>$ npx ecocode@latest analyze</span>
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
              )}
            </button>
          </div>

          {/* Step 2 */}
          <div className="bg-card/30 border border-border/50 rounded-xl p-5 backdrop-blur hover:border-primary/30 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
                2
              </div>
              <h3 className="font-semibold text-lg">Analisi in locale</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              La CLI scansiona il progetto localmente, seleziona i file rilevanti e invia un bundle limitato al motore di analisi.
              <strong className="text-foreground"> Il report viene poi salvato e mostrato nella dashboard web con link dedicato.</strong>
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-card/30 border border-border/50 rounded-xl p-5 backdrop-blur hover:border-primary/30 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
                3
              </div>
              <h3 className="font-semibold text-lg">Report visivo premium</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Ricevi un link univoco alla tua dashboard personale con classe energetica, 
              vulnerabilità ecologiche e suggerimenti di refactoring AI — la stessa esperienza della Web App.
            </p>
          </div>

          {/* Privacy Badge */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
            <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-300/80">
              <strong className="text-emerald-400">Privacy by Design</strong> — La scansione avviene in locale e al server viene inviato solo il bundle necessario all'analisi, non l'intero repository.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
