import { getDb, saveDb } from './client';
import { sources, carListings, carScores, carfaxReports, reliabilityRatings, scrapeLogs } from './schema';
import { eq, and } from 'drizzle-orm';
import { CarGurusScraper, CarsComScraper, AutotraderScraper, decodeVin } from '@auto-find/scraping';
import { computeReliabilityScore } from '../scoring/reliability';
import { computeValueScore } from '../scoring/value';
import { computeCompositeScore } from '../scoring/index';
import { upsertListing } from './listing-service';
import { getMarketAvgPrice } from './market-service';

export async function runScrapeJob(config: {
  source: string;
  zipCode: string;
  radius?: number;
  maxPages?: number;
  maxPrice?: number;
}): Promise<{ found: number; new: number; updated: number; scored: number }> {
  const db = getDb();

  const [source] = await db.select().from(sources).where(eq(sources.name, config.source)).limit(1);
  if (!source) throw new Error(`Unknown source: ${config.source}`);

  const [log] = await db.insert(scrapeLogs).values({
    sourceId: source.id, region: config.zipCode, status: 'running',
  }).returning();

  const startTime = Date.now();

  try {
    const opts = { zipCode: config.zipCode, maxPrice: config.maxPrice || 15000, maxPages: config.maxPages || 5 };
    let listings: any[] = [];
    if (config.source === 'cargurus') {
      const scraper = new CarGurusScraper();
      listings = await scraper.scrape(opts);
    } else if (config.source === 'cars.com') {
      const scraper = new CarsComScraper();
      listings = await scraper.scrape(opts);
    } else if (config.source === 'autotrader') {
      const scraper = new AutotraderScraper();
      listings = await scraper.scrape(opts);
    }

    let newCount = 0, updatedCount = 0, scoredCount = 0;

    for (const scraped of listings) {
      const totalCost = scraped.price + (scraped.estimatedFees || 0);
      if (totalCost > 15000) continue;

      const existingListing = await db.select({ id: carListings.id }).from(carListings)
        .where(and(eq(carListings.sourceId, source.id), eq(carListings.externalId, scraped.externalId))).limit(1);

      const listingId = await upsertListing(scraped, source.id);
      if (existingListing.length > 0) updatedCount++;
      else newCount++;

      if (scraped.vin && scraped.vin.length === 17) {
        const existingCarfax = await db.select().from(carfaxReports).where(eq(carfaxReports.vin, scraped.vin)).limit(1);
        if (existingCarfax.length === 0) {
          try {
            const decoded = await decodeVin(scraped.vin);
            await db.insert(carfaxReports).values({
              vin: scraped.vin, numOwners: null, accidentCount: 0,
              serviceRecords: JSON.stringify([]), serviceRecordsCount: 0,
              rawData: JSON.stringify(decoded),
            }).onConflictDoNothing();
          } catch (e) { /* continue */ }
        }
      }

      const [reliabilityRow] = await db.select().from(reliabilityRatings)
        .where(and(eq(reliabilityRatings.make, scraped.make), eq(reliabilityRatings.model, scraped.model))).limit(1);

      const baseReliability = reliabilityRow ? reliabilityRow.baseScore / 5 : 0.5;

      let numOwners: number | null = null, accidentCount: number | null = null, serviceRecordsCount: number | null = null;
      if (scraped.vin) {
        const [cf] = await db.select().from(carfaxReports).where(eq(carfaxReports.vin, scraped.vin)).limit(1);
        if (cf) { numOwners = cf.numOwners; accidentCount = cf.accidentCount; serviceRecordsCount = cf.serviceRecordsCount; }
      }

      const reliability = computeReliabilityScore({
        make: scraped.make, model: scraped.model, modelYear: scraped.modelYear,
        mileage: scraped.mileage, titleStatus: scraped.titleStatus,
        numOwners, accidentCount, baseReliabilityScore: baseReliability,
      });

      const marketAvg = await getMarketAvgPrice(scraped.make, scraped.model, scraped.modelYear, scraped.mileage);

      const value = computeValueScore({
        price: scraped.price, reliabilityScore: reliability.score,
        marketAvgPrice: marketAvg, serviceRecordsCount, daysOnMarket: scraped.daysOnMarket,
      });

      const { composite, tier } = computeCompositeScore(reliability.score, value.score);

      const existingScore = await db.select().from(carScores).where(eq(carScores.listingId, listingId)).limit(1);
      const breakdown = JSON.stringify({ reliability: reliability.breakdown, value: value.breakdown });

      if (existingScore.length > 0) {
        await db.update(carScores).set({
          reliabilityScore: reliability.score, valueScore: value.score,
          compositeScore: composite, tier, scoreBreakdown: breakdown,
        }).where(eq(carScores.listingId, listingId));
      } else {
        await db.insert(carScores).values({
          listingId, reliabilityScore: reliability.score, valueScore: value.score,
          compositeScore: composite, tier, scoreBreakdown: breakdown,
        });
      }
      scoredCount++;
    }

    await db.update(scrapeLogs).set({
      status: 'completed', listingsFound: listings.length, listingsNew: newCount,
      listingsUpdated: updatedCount, durationMs: Date.now() - startTime,
      completedAt: new Date().toISOString(),
    }).where(eq(scrapeLogs.id, log.id));

    saveDb();
    return { found: listings.length, new: newCount, updated: updatedCount, scored: scoredCount };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('[scrape-service] Error:', msg, stack);
    await db.update(scrapeLogs).set({
      status: 'failed', errorMessage: msg,
      durationMs: Date.now() - startTime, completedAt: new Date().toISOString(),
    }).where(eq(scrapeLogs.id, log.id));
    saveDb();
    throw error;
  }
}
