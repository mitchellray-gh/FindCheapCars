import { getDb, saveDb } from './client';
import { marketPrices, carListings } from './schema';
import { eq, and, sql, gte } from 'drizzle-orm';

export async function computeMarketPrices(): Promise<{ updated: number }> {
  const db = getDb();
  const buckets = [
    { min: 0, max: 20000, label: '0-20000' },
    { min: 20001, max: 40000, label: '20001-40000' },
    { min: 40001, max: 60000, label: '40001-60000' },
    { min: 60001, max: 80000, label: '60001-80000' },
    { min: 80001, max: 100000, label: '80001-100000' },
    { min: 100001, max: 999999, label: '100001+' },
  ];

  let updated = 0;
  for (const bucket of buckets) {
    const results = await db.select({
      make: carListings.make, model: carListings.model, year: carListings.modelYear,
      trim: carListings.trim,
      avgPrice: sql<number>`ROUND(AVG(${carListings.totalCost}), 2)`,
      sampleCount: sql<number>`COUNT(*)`,
    }).from(carListings)
      .where(and(eq(carListings.isActive, true), gte(carListings.mileage, bucket.min), sql`${carListings.mileage} <= ${bucket.max}`))
      .groupBy(carListings.make, carListings.model, carListings.modelYear, carListings.trim);

    for (const row of results) {
      await db.insert(marketPrices).values({
        make: row.make, model: row.model, year: row.year, trim: row.trim,
        mileageBucket: bucket.label, avgPrice: row.avgPrice, sampleCount: row.sampleCount,
      }).onConflictDoUpdate({
        target: [marketPrices.make, marketPrices.model, marketPrices.year, marketPrices.trim, marketPrices.mileageBucket],
        set: { avgPrice: row.avgPrice, sampleCount: row.sampleCount },
      });
      updated++;
    }
  }
  saveDb();
  return { updated };
}

export async function getMarketAvgPrice(make: string, model: string, year: number, mileage: number | null): Promise<number | null> {
  if (!mileage) return null;
  const db = getDb();
  let bucket: string;
  if (mileage <= 20000) bucket = '0-20000';
  else if (mileage <= 40000) bucket = '20001-40000';
  else if (mileage <= 60000) bucket = '40001-60000';
  else if (mileage <= 80000) bucket = '60001-80000';
  else if (mileage <= 100000) bucket = '80001-100000';
  else bucket = '100001+';

  const [result] = await db.select({ avgPrice: marketPrices.avgPrice }).from(marketPrices)
    .where(and(eq(marketPrices.make, make), eq(marketPrices.model, model), eq(marketPrices.year, year), eq(marketPrices.mileageBucket, bucket)))
    .limit(1);
  return result ? result.avgPrice : null;
}
