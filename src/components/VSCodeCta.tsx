import { Code2, Sparkles } from "lucide-react";

export function VSCodeCta() {
  return (
    <section className="mt-10 rounded-2xl border border-emerald-400/25 bg-gradient-to-r from-emerald-500/10 via-card/70 to-teal-500/10 p-6 backdrop-blur">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-emerald-300 mb-2">
            <Code2 className="w-4 h-4" />
            Programma in tempo reale
          </div>
          <h3 className="text-xl md:text-2xl font-bold mb-2">Mantieni la Classe A mentre scrivi</h3>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Installa l&apos;estensione VS Code di EcoCode: evidenzia sprechi energetici in diretta e applica Eco-Fix AI dalla lampadina, senza aspettare il report finale.
          </p>
        </div>

        <a
          href="https://marketplace.visualstudio.com/items?itemName=ecocode.ecocode"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-4 h-4" />
          Aggiungi a VS Code
        </a>
      </div>
    </section>
  );
}
