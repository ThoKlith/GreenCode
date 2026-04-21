import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { EnergyBadge } from "@/components/EnergyBadge";
import { MetricCard } from "@/components/MetricCard";
import { VulnerabilitySnippet } from "@/components/VulnerabilitySnippet";
import { Cloud, Cpu, Activity, AlertTriangle, Leaf } from "lucide-react";
import { createClient } from '@/lib/supabase/server';

export default async function LocalReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const p = await params;
  const { id } = p;

  if (!id) {
    notFound();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('local_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center flex-col space-y-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h1 className="text-2xl font-bold">Report non trovato</h1>
        <p className="text-muted-foreground">
          Il report locale che stai cercando potrebbe essere stato rimosso o l'ID non è valido.
        </p>
        <a href="/" className="text-primary underline mt-4">Torna alla home</a>
      </main>
    );
  }

  const isGood = ['A', 'B'].includes(data.energy_class);

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      
      {/* Background decorativo */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-destructive/10 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <header className="mb-12 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Risultati Analisi Locale</h1>
          <div className="text-muted-foreground font-mono bg-muted/50 inline-block px-3 py-1 rounded-md mt-2">
            Progetto: {data.project_name}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Colonna Sinistra (Badge & Metriche) */}
          <div className="lg:col-span-4 space-y-8">
            <EnergyBadge letter={data.energy_class} />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <MetricCard 
                title="Stima Emissioni CO2" 
                value={data.co2_estimate} 
                suffix="kg/anno" 
                icon={<Cloud className="w-full h-full" />} 
                delay={0.1}
                theme={isGood ? "success" : "danger"}
              />
              <MetricCard 
                title="Efficienza Codice" 
                value={data.efficiency_score} 
                suffix="/100" 
                icon={<Activity className="w-full h-full" />} 
                delay={0.2}
                theme={data.efficiency_score > 70 ? "success" : "neutral"}
              />
              <MetricCard 
                title="Ottimizzazione AI" 
                value={data.ai_optimization_score} 
                suffix="/100" 
                icon={<Cpu className="w-full h-full" />} 
                delay={0.3}
                theme={data.ai_optimization_score > 80 ? "success" : "danger"}
              />
            </div>
          </div>

          {/* Colonna Destra (Vulnerabilità & Code Fix) */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="bg-card/30 border border-border/50 rounded-2xl p-6 backdrop-blur flex-1">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <AlertTriangle className="w-6 h-6 mr-3 text-destructive" />
                Vulnerabilità Ecologiche ({data.snippets?.length || 0})
              </h2>
              
              <div className="space-y-6">
                {data.snippets && data.snippets.length > 0 ? (
                  data.snippets.map((snippet: any) => (
                    <VulnerabilitySnippet key={snippet.id} snippet={snippet} />
                  ))
                ) : (
                  <div className="text-center py-20 opacity-50 text-emerald-400">
                    <Leaf className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Nessuna vulnerabilità grave rilevata. Ottimo lavoro!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
