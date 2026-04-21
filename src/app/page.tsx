import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import SearchHistory from "@/components/SearchHistory";
import { CliSection } from "@/components/CliSection";
import { ShieldAlert, Zap, Cpu } from "lucide-react";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Sfondo dinamico astratto */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[oklch(0.6_0.2_210)]/20 rounded-full blur-[100px] mix-blend-screen opacity-30" />
      </div>

      <Navbar />

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-20 text-center relative z-10 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          Scopri l'impatto <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#4ADE80] to-[#2DD4BF] drop-shadow-lg">
            ecologico del codice
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10">
          Incolla l'URL di una repository GitHub per analizzare l'efficienza energetica, le stime di CO2 e ottenere refactoring eco-sostenibili guidati dall'IA.
        </p>

        <SearchBar />

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl w-full text-left text-muted-foreground">
          <div className="flex items-start space-x-3">
            <Zap className="w-6 h-6 text-primary shrink-0 drop-shadow-[0_0_8px_rgba(20,250,150,0.5)]" />
            <div>
              <h3 className="font-semibold text-foreground">Classe Energetica</h3>
              <p className="text-sm mt-1">Valuta l'impronta strutturale e l'efficienza computazionale del codice.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Cpu className="w-6 h-6 text-primary shrink-0 drop-shadow-[0_0_8px_rgba(20,250,150,0.5)]" />
            <div>
              <h3 className="font-semibold text-foreground">Ottimizzazione AI</h3>
              <p className="text-sm mt-1">Identifica chiamate ridondanti ai modelli LLM per diminuire l'uso GPU server-side.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <ShieldAlert className="w-6 h-6 text-primary shrink-0 drop-shadow-[0_0_8px_rgba(20,250,150,0.5)]" />
            <div>
              <h3 className="font-semibold text-foreground">Eco-Fix Snippets</h3>
              <p className="text-sm mt-1">Rileva "code smells" dispendiosi e propone alternative ad alte prestazioni.</p>
            </div>
          </div>
        </div>

        {/* Server component per history (richiede Auth) */}
        <Suspense fallback={<div className="mt-16 text-muted-foreground text-sm">Caricamento storico...</div>}>
          <SearchHistory />
        </Suspense>
      </div>

      {/* Sezione CLI Locale */}
      <div className="relative z-10">
        <CliSection />
      </div>
    </main>
  );
}
