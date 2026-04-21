import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { 
      project_name, 
      energy_class, 
      co2_estimate, 
      efficiency_score, 
      ai_optimization_score, 
      snippets 
    } = payload;

    if (!project_name || !energy_class) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Inseriamo in local_reports in modo anonimo (tramite l'RLS aperto)
    const { data, error } = await supabase
      .from('local_reports')
      .insert({
        project_name,
        energy_class,
        co2_estimate,
        efficiency_score,
        ai_optimization_score,
        snippets: snippets || []
      })
      .select('id')
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Ricava l'URL di base dinamicamente se possibile, altrimenti http://localhost:3000
    const requestOrigin = new URL(request.url).origin;
    const origin = request.headers.get("origin");
    const baseUrl = requestOrigin || origin || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    return NextResponse.json({ 
      success: true, 
      id: data.id,
      url: `${baseUrl}/report/${data.id}`
    });

  } catch (error: any) {
    console.error("API /reports/local error:", error);
    return NextResponse.json({ error: error.message || "Errore interno server" }, { status: 500 });
  }
}
