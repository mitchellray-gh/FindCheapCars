import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db/client';
import { getModelsByMake } from '@/lib/db/listing-service';

let dbReady = false;

export async function GET(request: NextRequest) {
  if (!dbReady) { await initDatabase(); dbReady = true; }
  const make = new URL(request.url).searchParams.get('make');
  if (!make) return NextResponse.json([]);
  const models = await getModelsByMake(make);
  return NextResponse.json(models);
}
