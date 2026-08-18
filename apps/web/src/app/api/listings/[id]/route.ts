import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db/client';
import { getListingById } from '@/lib/db/listing-service';

let dbReady = false;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!dbReady) { await initDatabase(); dbReady = true; }
  const { id } = await params;
  const listing = await getListingById(parseInt(id));
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(listing);
}
