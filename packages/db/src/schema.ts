import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

// ── Sources ──────────────────────────────────────────────
export const sources = sqliteTable('sources', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').unique().notNull(),
  baseUrl: text('base_url'),
  scrapeMethod: text('scrape_method'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  rateLimitMs: integer('rate_limit_ms').default(3000),
  createdAt: text('created_at').default('(datetime(\'now\'))'),
});

// ── Reliability Ratings ──────────────────────────────────
export const reliabilityRatings = sqliteTable('reliability_ratings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  make: text('make').notNull(),
  model: text('model').notNull(),
  yearStart: integer('year_start').notNull(),
  yearEnd: integer('year_end').notNull(),
  baseScore: real('base_score').notNull(),
  source: text('source'),
  updatedAt: text('updated_at').default('(datetime(\'now\'))'),
}, (t) => [
  uniqueIndex('reliability_make_model_years').on(t.make, t.model, t.yearStart, t.yearEnd),
]);

// ── Market Prices ────────────────────────────────────────
export const marketPrices = sqliteTable('market_prices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  trim: text('trim'),
  mileageBucket: text('mileage_bucket').notNull(),
  avgPrice: real('avg_price'),
  sampleCount: integer('sample_count').default(0),
  computedAt: text('computed_at').default('(datetime(\'now\'))'),
}, (t) => [
  uniqueIndex('market_make_model_year_trim_mileage').on(t.make, t.model, t.year, t.trim, t.mileageBucket),
]);

// ── Car Listings ─────────────────────────────────────────
export const carListings = sqliteTable('car_listings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sourceId: integer('source_id').references(() => sources.id),
  externalId: text('external_id'),
  vin: text('vin'),
  make: text('make').notNull(),
  model: text('model').notNull(),
  modelYear: integer('model_year').notNull(),
  trim: text('trim'),
  bodyStyle: text('body_style'),
  exteriorColor: text('exterior_color'),
  interiorColor: text('interior_color'),
  mileage: integer('mileage'),
  price: real('price').notNull(),
  estimatedFees: real('estimated_fees').default(0),
  totalCost: real('total_cost'),
  titleStatus: text('title_status'),
  transmission: text('transmission'),
  engine: text('engine'),
  drivetrain: text('drivetrain'),
  fuelType: text('fuel_type'),
  mpgCity: real('mpg_city'),
  mpgHighway: real('mpg_highway'),
  dealerName: text('dealer_name'),
  dealerCity: text('dealer_city'),
  dealerState: text('dealer_state'),
  dealerZip: text('dealer_zip'),
  listingUrl: text('listing_url').notNull(),
  imageUrl: text('image_url'),
  daysOnMarket: integer('days_on_market'),
  scrapedAt: text('scraped_at').default('(datetime(\'now\'))'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
}, (t) => [
  uniqueIndex('listings_source_external').on(t.sourceId, t.externalId),
  index('listings_make_model').on(t.make, t.model),
  index('listings_total_cost').on(t.totalCost),
  index('listings_active').on(t.isActive),
  index('listings_vin').on(t.vin),
]);

// ── Carfax Reports ───────────────────────────────────────
export const carfaxReports = sqliteTable('carfax_reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vin: text('vin').unique().notNull(),
  numOwners: integer('num_owners'),
  accidentCount: integer('accident_count').default(0),
  accidentSeverity: text('accident_severity'),
  serviceRecords: text('service_records'), // JSON string
  serviceRecordsCount: integer('service_records_count').default(0),
  titleIssues: text('title_issues'), // JSON string
  lastReportedMileage: integer('last_reported_mileage'),
  lastReportedDate: text('last_reported_date'),
  rawData: text('raw_data'), // JSON string
  fetchedAt: text('fetched_at').default('(datetime(\'now\'))'),
});

// ── Car Scores ───────────────────────────────────────────
export const carScores = sqliteTable('car_scores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  listingId: integer('listing_id').references(() => carListings.id).unique(),
  reliabilityScore: real('reliability_score').notNull(),
  valueScore: real('value_score').notNull(),
  compositeScore: real('composite_score').notNull(),
  tier: text('tier'),
  scoreBreakdown: text('score_breakdown'), // JSON string
  scoredAt: text('scored_at').default('(datetime(\'now\'))'),
}, (t) => [
  index('scores_composite').on(t.compositeScore),
  index('scores_tier').on(t.tier),
]);

// ── Scrape Logs ──────────────────────────────────────────
export const scrapeLogs = sqliteTable('scrape_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sourceId: integer('source_id').references(() => sources.id),
  region: text('region'),
  status: text('status').notNull(),
  listingsFound: integer('listings_found').default(0),
  listingsNew: integer('listings_new').default(0),
  listingsUpdated: integer('listings_updated').default(0),
  errorMessage: text('error_message'),
  durationMs: integer('duration_ms'),
  startedAt: text('started_at').default('(datetime(\'now\'))'),
  completedAt: text('completed_at'),
});
