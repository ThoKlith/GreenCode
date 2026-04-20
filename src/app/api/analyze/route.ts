import { NextResponse } from 'next/server';
import { analyzeRepository } from '@/lib/analyze';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    const data = await analyzeRepository(url);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API /analyze error:", error);
    return NextResponse.json({ error: error.message || "Errore sconosciuto" }, { status: 500 });
  }
}
