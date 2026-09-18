import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Deprecated endpoint: the GreenCode CLI runs AST analysis locally and only sends metadata to /api/reports/local.',
    },
    { status: 410 }
  );
}
