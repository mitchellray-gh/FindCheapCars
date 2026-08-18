import { getDb, saveDb } from './client';
import { carListings, carScores, carfaxReports } from './schema';
import { eq, and, gt, lt, gte, lte, like, sql, desc, asc, count } from 'drizzle-orm';

export interface ListingFilters {
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  minScore?: number;
  tier?: string;
  bodyStyle?: string;
  titleStatus?: string;
  drivetrain?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export async function getListings(filters: ListingFilters) {
  const db = getDb();
  const page = filters.page || 1;
  const limit = filters.limit || 25;
  const offset = (page - 1) * limit;

  const conditions = [eq(carListings.isActive, true)];

  if (filters.make) conditions.push(sql`LOWER(${carListings.make}) = LOWER(${filters.make})`);
  if (filters.model) conditions.push(sql`LOWER(${carListings.model}) = LOWER(${filters.model})`);
  if (filters.yearMin) conditions.push(gte(carListings.modelYear, filters.yearMin));
  if (filters.yearMax) conditions.push(lte(carListings.modelYear, filters.yearMax));
  if (filters.priceMin) conditions.push(gte(carListings.totalCost, filters.priceMin));
  if (filters.priceMax) conditions.push(lte(carListings.totalCost, filters.priceMax));
  if (filters.mileageMax) conditions.push(lte(carListings.mileage, filters.mileageMax));
  if (filters.bodyStyle) conditions.push(sql`LOWER(${carListings.bodyStyle}) = LOWER(${filters.bodyStyle})`);
  if (filters.titleStatus) conditions.push(sql`LOWER(${carListings.titleStatus}) = LOWER(${filters.titleStatus})`);
  if (filters.drivetrain) conditions.push(sql`LOWER(${carListings.drivetrain}) = LOWER(${filters.drivetrain})`);
  if (filters.minScore) conditions.push(gte(carScores.compositeScore, filters.minScore));
  if (filters.tier) conditions.push(eq(carScores.tier, filters.tier));

  const sortField = getSortColumn(filters.sortBy || 'composite_score');
  const sortDir = filters.sortOrder === 'asc' ? asc : desc;
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db.select({ listing: carListings, score: carScores })
    .from(carListings)
    .leftJoin(carScores, eq(carListings.id, carScores.listingId))
    .where(whereClause)
    .orderBy(sortDir(sortField))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db.select({ total: count() })
    .from(carListings)
    .leftJoin(carScores, eq(carListings.id, carScores.listingId))
    .where(whereClause);

  const listingsWithScores = await Promise.all(
    results.map(async (row) => {
      let carfax = null;
      if (row.listing.vin) {
        const [cf] = await db.select().from(carfaxReports).where(eq(carfaxReports.vin, row.listing.vin)).limit(1);
        carfax = cf || null;
      }
      return {
        ...mapListing(row.listing),
        score: row.score ? mapScore(row.score) : null,
        carfax: carfax ? mapCarfax(carfax) : null,
      };
    })
  );

  return { data: listingsWithScores, total, page, limit, totalPages: Math.ceil(total / limit) };
}

function getSortColumn(sortBy: string) {
  switch (sortBy) {
    case 'price': return carListings.totalCost;
    case 'mileage': return carListings.mileage;
    case 'model_year': return carListings.modelYear;
    case 'reliability_score': return carScores.reliabilityScore;
    case 'composite_score':
    default: return carScores.compositeScore;
  }
}

function mapListing(row: any) {
  return {
    id: row.id, sourceId: row.sourceId, externalId: row.externalId, vin: row.vin,
    make: row.make, model: row.model, modelYear: row.modelYear, trim: row.trim,
    bodyStyle: row.bodyStyle, exteriorColor: row.exteriorColor, interiorColor: row.interiorColor,
    mileage: row.mileage, price: Number(row.price), estimatedFees: Number(row.estimatedFees || 0),
    totalCost: Number(row.totalCost || row.price), titleStatus: row.titleStatus,
    transmission: row.transmission, engine: row.engine, drivetrain: row.drivetrain,
    fuelType: row.fuelType, mpgCity: row.mpgCity ? Number(row.mpgCity) : null,
    mpgHighway: row.mpgHighway ? Number(row.mpgHighway) : null,
    dealerName: row.dealerName, dealerCity: row.dealerCity, dealerState: row.dealerState,
    dealerZip: row.dealerZip, listingUrl: row.listingUrl, imageUrl: row.imageUrl,
    daysOnMarket: row.daysOnMarket, scrapedAt: row.scrapedAt, isActive: row.isActive,
  };
}

function mapScore(row: any) {
  return {
    id: row.id, listingId: row.listingId,
    reliabilityScore: Number(row.reliabilityScore), valueScore: Number(row.valueScore),
    compositeScore: Number(row.compositeScore), tier: row.tier,
    scoreBreakdown: row.scoreBreakdown ? (typeof row.scoreBreakdown === 'string' ? JSON.parse(row.scoreBreakdown) : row.scoreBreakdown) : null,
    scoredAt: row.scoredAt,
  };
}

function mapCarfax(row: any) {
  return {
    id: row.id, vin: row.vin, numOwners: row.numOwners,
    accidentCount: row.accidentCount || 0, accidentSeverity: row.accidentSeverity,
    serviceRecords: row.serviceRecords ? (typeof row.serviceRecords === 'string' ? JSON.parse(row.serviceRecords) : row.serviceRecords) : [],
    serviceRecordsCount: row.serviceRecordsCount || 0,
    lastReportedMileage: row.lastReportedMileage, lastReportedDate: row.lastReportedDate,
    fetchedAt: row.fetchedAt,
  };
}

export async function getListingById(id: number) {
  const db = getDb();
  const [result] = await db.select({ listing: carListings, score: carScores })
    .from(carListings)
    .leftJoin(carScores, eq(carListings.id, carScores.listingId))
    .where(eq(carListings.id, id))
    .limit(1);
  if (!result) return null;

  let carfax = null;
  if (result.listing.vin) {
    const [cf] = await db.select().from(carfaxReports).where(eq(carfaxReports.vin, result.listing.vin)).limit(1);
    carfax = cf || null;
  }
  const mapped = mapListing(result.listing);
  const scoreData = result.score ? mapScore(result.score) : null;
  return {
    ...mapped,
    compositeScore: scoreData?.compositeScore ?? 0,
    tier: scoreData?.tier ?? 'proceed_with_caution',
    reliabilityScore: scoreData?.reliabilityScore ?? 0,
    valueScore: scoreData?.valueScore ?? 0,
    reliabilityBreakdown: scoreData?.scoreBreakdown?.reliability ?? null,
    valueBreakdown: scoreData?.scoreBreakdown?.value ?? null,
    sourceUrl: mapped.listingUrl,
    city: mapped.dealerCity,
    state: mapped.dealerState,
    carfaxOwners: carfax?.numOwners ?? null,
    carfaxAccidents: carfax?.accidentCount ?? null,
    carfaxServiceRecords: (carfax?.serviceRecordsCount ?? 0) > 0,
  };
}

export async function upsertListing(scraped: any, sourceId: number) {
  const db = getDb();
  const totalCost = scraped.price + (scraped.estimatedFees || 0);
  const existing = await db.select({ id: carListings.id }).from(carListings)
    .where(and(eq(carListings.sourceId, sourceId), eq(carListings.externalId, scraped.externalId))).limit(1);

  if (existing.length > 0) {
    await db.update(carListings).set({
      vin: scraped.vin, mileage: scraped.mileage, price: scraped.price,
      estimatedFees: scraped.estimatedFees || 0, totalCost,
      titleStatus: scraped.titleStatus, dealerName: scraped.dealerName,
      dealerCity: scraped.dealerCity, dealerState: scraped.dealerState,
      dealerZip: scraped.dealerZip, imageUrl: scraped.imageUrl, daysOnMarket: scraped.daysOnMarket,
    }).where(eq(carListings.id, existing[0].id));
    saveDb();
    return existing[0].id;
  }

  const [inserted] = await db.insert(carListings).values({
    sourceId, externalId: scraped.externalId, vin: scraped.vin,
    make: scraped.make, model: scraped.model, modelYear: scraped.modelYear,
    trim: scraped.trim, bodyStyle: scraped.bodyStyle,
    exteriorColor: scraped.exteriorColor, interiorColor: scraped.interiorColor,
    mileage: scraped.mileage, price: scraped.price, estimatedFees: scraped.estimatedFees || 0,
    totalCost, titleStatus: scraped.titleStatus, transmission: scraped.transmission,
    engine: scraped.engine, drivetrain: scraped.drivetrain, fuelType: scraped.fuelType,
    mpgCity: scraped.mpgCity, mpgHighway: scraped.mpgHighway,
    dealerName: scraped.dealerName, dealerCity: scraped.dealerCity,
    dealerState: scraped.dealerState, dealerZip: scraped.dealerZip,
    listingUrl: scraped.listingUrl, imageUrl: scraped.imageUrl,
    daysOnMarket: scraped.daysOnMarket, isActive: true,
  }).returning({ id: carListings.id });

  saveDb();
  return inserted.id;
}

export async function getDistinctMakes() {
  const db = getDb();
  return db.select({ make: carListings.make, count: count() })
    .from(carListings).where(eq(carListings.isActive, true))
    .groupBy(carListings.make).orderBy(desc(count()));
}

export async function getModelsByMake(make: string) {
  const db = getDb();
  return db.select({ model: carListings.model, count: count() })
    .from(carListings)
    .where(and(eq(carListings.isActive, true), sql`LOWER(${carListings.make}) = LOWER(${make})`))
    .groupBy(carListings.model).orderBy(desc(count()));
}
