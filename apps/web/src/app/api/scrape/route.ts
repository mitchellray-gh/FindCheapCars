import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDb } from '@/lib/db/client';
import { scrapeLogs } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { runScrapeJob } from '@/lib/db/scrape-service';

export const runtime = 'nodejs';
export const maxDuration = 60;

let dbReady = false;

export async function POST(request: NextRequest) {
  if (!dbReady) { await initDatabase(); dbReady = true; }

  const body = await request.json();
  const { source, zipCode, maxPages, maxPrice } = body;

  if (!source || !zipCode) {
    return NextResponse.json({ error: 'source and zipCode are required' }, { status: 400 });
  }

  const ALL_SOURCES = ['cargurus', 'cars.com', 'autotrader', 'carmax'];

  if (![...ALL_SOURCES, 'all'].includes(source)) {
    return NextResponse.json({ error: 'Invalid source. Must be: cargurus, cars.com, autotrader, carmax, or all' }, { status: 400 });
  }

  try {
    const sourcesToRun = source === 'all' ? ALL_SOURCES : [source];
    const perSource: Record<string, unknown> = {};
    const totals = { found: 0, new: 0, updated: 0, scored: 0 };

    for (const src of sourcesToRun) {
      try {
        const result = await runScrapeJob({
          source: src,
          zipCode,
          maxPages: maxPages || 5,
          maxPrice: maxPrice || 15000,
        });
        perSource[src] = result;
        totals.found += result.found;
        totals.new += result.new;
        totals.updated += result.updated;
        totals.scored += result.scored;
      } catch (e: unknown) {
        perSource[src] = { error: e instanceof Error ? e.message : String(e) };
      }
    }

    if (source !== 'all') {
      const only = perSource[source];
      if (only && typeof only === 'object' && 'error' in only) {
        throw new Error(String((only as { error: string }).error));
      }
      return NextResponse.json({ status: 'completed', ...(only as object) });
    }

    return NextResponse.json({ status: 'completed', ...totals, perSource });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('[/api/scrape] Error:', msg, stack);
    return NextResponse.json({ error: msg, stack }, { status: 500 });
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
