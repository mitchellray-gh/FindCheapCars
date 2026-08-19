import { initDatabase, getDb, saveDb } from './client';
import { carListings } from './schema';
import { and, eq, isNotNull, or, isNull, sql } from 'drizzle-orm';
import { decodeVin, buildEngineFromVin, buildTransmissionFromVin } from '@auto-find/scraping';

/**
 * Backfill engine + transmission (and drivetrain/fuel) for existing listings
 * that have a VIN but are missing those specs, using the free NHTSA VIN decoder.
 * Run with: npm run enrich
 */
async function enrich() {
  await initDatabase();
  const db = getDb();

  const rows = await db
    .select()
    .from(carListings)
    .where(
      and(
        isNotNull(carListings.vin),
        or(
          isNull(carListings.engine),
          eq(carListings.engine, ''),
          isNull(carListings.transmission),
          eq(carListings.transmission, ''),
        ),
      ),
    );

  console.log(`Found ${rows.length} listings needing engine/transmission enrichment.`);

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const vin = (row.vin ?? '').trim();
    if (vin.length !== 17) { skipped++; continue; }

    let decoded;
    try {
      decoded = await decodeVin(vin);
    } catch {
      skipped++;
      continue;
    }

    const engine = row.engine || buildEngineFromVin(decoded);
    const transmission = row.transmission || buildTransmissionFromVin(decoded);
    const drivetrain = row.drivetrain || decoded.driveType || null;
    const fuelType = row.fuelType || decoded.fuelTypePrimary || null;

    if (engine === row.engine && transmission === row.transmission) {
      skipped++;
      continue;
    }

    await db
      .update(carListings)
      .set({ engine, transmission, drivetrain, fuelType })
      .where(eq(carListings.id, row.id));
    updated++;

    if (updated % 25 === 0) console.log(`  …${updated} updated`);
  }

  saveDb();
  console.log(`Done. Enriched ${updated} listings, skipped ${skipped}.`);
  process.exit(0);
}

enrich().catch((err) => {
  console.error('Enrich failed:', err);
  process.exit(1);
});
