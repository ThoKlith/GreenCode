import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Endpoint deprecato: la CLI EcoCode esegue analisi AST in locale e invia solo metadati a /api/reports/local.',
    },
    { status: 410 }
  );
}
