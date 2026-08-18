import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDb } from '@/lib/db/client';
import { scrapeLogs } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { runScrapeJob } from '@/lib/db/scrape-service';

let dbReady = false;

export async function POST(request: NextRequest) {
  if (!dbReady) { await initDatabase(); dbReady = true; }

  const body = await request.json();
  const { source, zipCode, maxPages, maxPrice } = body;

  if (!source || !zipCode) {
    return NextResponse.json({ error: 'source and zipCode are required' }, { status: 400 });
  }

  if (!['cargurus', 'cars.com', 'autotrader'].includes(source)) {
    return NextResponse.json({ error: 'Invalid source. Must be: cargurus, cars.com, or autotrader' }, { status: 400 });
  }

  try {
    const result = await runScrapeJob({
      source,
      zipCode,
      maxPages: maxPages || 5,
      maxPrice: maxPrice || 15000,
    });

    return NextResponse.json({ status: 'completed', ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  if (!dbReady) { await initDatabase(); dbReady = true; }
  const db = getDb();
  const logs = await db
    .select()
    .from(scrapeLogs)
    .orderBy(desc(scrapeLogs.startedAt))
    .limit(20);
  return NextResponse.json(logs);
}
