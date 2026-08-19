import { NextResponse } from 'next/server';
import { initDatabase, getDb } from '@/lib/db/client';
import { carListings, carScores } from '@/lib/db/schema';
import { eq, sql, count, avg, desc } from 'drizzle-orm';

let dbReady = false;

export async function GET() {
  if (!dbReady) { await initDatabase(); dbReady = true; }
  const db = getDb();

  const [{ total }] = await db.select({ total: count() }).from(carListings).where(eq(carListings.isActive, true));
  const [avgResult] = await db.select({ avg: avg(carScores.compositeScore) }).from(carScores);

  const tiers = await db.select({ tier: carScores.tier, count: count() }).from(carScores).groupBy(carScores.tier);
  const tierDistribution: Record<string, number> = { top_pick: 0, great_value: 0, worth_considering: 0, proceed_with_caution: 0 };
  tiers.forEach((t: { tier: string | null; count: number }) => { if (t.tier) tierDistribution[t.tier] = t.count; });

  const topMakesResults = await db.select({
    make: carListings.make, count: count(),
    avgScore: sql<number>`ROUND(AVG(${carScores.compositeScore}), 1)`,
  }).from(carListings)
    .leftJoin(carScores, eq(carListings.id, carScores.listingId))
    .where(sql`${carListings.isActive} = 1 AND ${carScores.compositeScore} IS NOT NULL`)
    .groupBy(carListings.make).orderBy(desc(count())).limit(10);

  const [priceRange] = await db.select({
    minPrice: sql<number>`MIN(${carListings.totalCost})`,
    maxPrice: sql<number>`MAX(${carListings.totalCost})`,
    avgPrice: sql<number>`ROUND(AVG(${carListings.totalCost}), 2)`,
  }).from(carListings).where(eq(carListings.isActive, true));

  return NextResponse.json({
    totalListings: total,
    avgCompositeScore: avgResult?.avg ? Number(avgResult.avg) : 0,
    tierDistribution,
    topMakes: topMakesResults,
    priceRange: {
      min: priceRange?.minPrice ? Number(priceRange.minPrice) : 0,
      max: priceRange?.maxPrice ? Number(priceRange.maxPrice) : 0,
      avg: priceRange?.avgPrice ? Number(priceRange.avgPrice) : 0,
    },
  });
}
