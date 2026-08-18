import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db/client';
import { getDistinctMakes } from '@/lib/db/listing-service';

let dbReady = false;

export async function GET() {
  if (!dbReady) { await initDatabase(); dbReady = true; }
  const makes = await getDistinctMakes();
  return NextResponse.json(makes);
}
