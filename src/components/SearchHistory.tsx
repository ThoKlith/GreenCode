import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock } from "lucide-react";
import Link from "next/link";

type HistoryItem = {
  id: string;
  github_url: string;
  repo_name: string;
  energy_class: string;
  efficiency_score: number;
  created_at: string;
};

export default async function SearchHistory() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: history, error: historyError } = await supabase
    .from("search_history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (historyError) {
    console.error("SearchHistory error:", historyError);
    return null;
  }

  if (!history || history.length === 0) {
    return (
      <div className="mt-16 w-full max-w-4xl opacity-50 text-center text-sm">
        Nessuna ricerca passata trovata.
      </div>
    );
  }

  // Helper per colori badge
  const getBadgeColor = (energyClass: string) => {
    switch (energyClass) {
      case 'A': return "bg-green-500 hover:bg-green-600";
      case 'B': return "bg-lime-500 hover:bg-lime-600";
      case 'C': return "bg-yellow-500 hover:bg-yellow-600";
      case 'D': return "bg-orange-500 hover:bg-orange-600";
      default: return "bg-red-500 hover:bg-red-600";
    }
  };

  return (
    <div className="mt-20 w-full max-w-4xl space-y-4">
      <div className="flex items-center space-x-2 text-primary font-medium px-2">
        <Activity className="w-5 h-5" />
        <h2>Le tue ultime analisi</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(history as HistoryItem[]).map((item) => (
          <Link key={item.id} href={`/results?repo=${encodeURIComponent(item.github_url)}`}>
            <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all hover:bg-card/80 group overflow-hidden relative cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1 overflow-hidden">
                  <p className="font-medium truncate" title={item.repo_name}>{item.repo_name}</p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(item.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                <div className="flex items-center space-x-3 ml-4 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Efficienza</p>
                    <p className="font-mono font-medium text-sm">{item.efficiency_score}/100</p>
                  </div>
                  <Badge className={`${getBadgeColor(item.energy_class)} text-white font-bold text-lg px-2 shadow-sm`}>
                    {item.energy_class}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
