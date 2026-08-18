import { initDatabase, getDb, saveDb } from './client';
import { sources, reliabilityRatings } from './schema';
import { sql } from 'drizzle-orm';

async function createTables(db: any) {
  db.run(sql`
    CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      base_url TEXT,
      scrape_method TEXT,
      is_active INTEGER DEFAULT 1,
      rate_limit_ms INTEGER DEFAULT 3000,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(sql`
    CREATE TABLE IF NOT EXISTS reliability_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      year_start INTEGER NOT NULL,
      year_end INTEGER NOT NULL,
      base_score REAL NOT NULL,
      source TEXT,
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(make, model, year_start, year_end)
    )
  `);
  db.run(sql`
    CREATE TABLE IF NOT EXISTS market_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      trim TEXT,
      mileage_bucket TEXT NOT NULL,
      avg_price REAL,
      sample_count INTEGER DEFAULT 0,
      computed_at TEXT DEFAULT (datetime('now')),
      UNIQUE(make, model, year, trim, mileage_bucket)
    )
  `);
  db.run(sql`
    CREATE TABLE IF NOT EXISTS car_listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id INTEGER REFERENCES sources(id),
      external_id TEXT,
      vin TEXT,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      model_year INTEGER NOT NULL,
      trim TEXT,
      body_style TEXT,
      exterior_color TEXT,
      interior_color TEXT,
      mileage INTEGER,
      price REAL NOT NULL,
      estimated_fees REAL DEFAULT 0,
      total_cost REAL,
      title_status TEXT,
      transmission TEXT,
      engine TEXT,
      drivetrain TEXT,
      fuel_type TEXT,
      mpg_city REAL,
      mpg_highway REAL,
      dealer_name TEXT,
      dealer_city TEXT,
      dealer_state TEXT,
      dealer_zip TEXT,
      listing_url TEXT NOT NULL,
      image_url TEXT,
      days_on_market INTEGER,
      scraped_at TEXT DEFAULT (datetime('now')),
      is_active INTEGER DEFAULT 1,
      UNIQUE(source_id, external_id)
    )
  `);
  db.run(sql`CREATE INDEX IF NOT EXISTS listings_make_model ON car_listings(make, model)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS listings_total_cost ON car_listings(total_cost)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS listings_active ON car_listings(is_active)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS listings_vin ON car_listings(vin)`);
  db.run(sql`
    CREATE TABLE IF NOT EXISTS carfax_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vin TEXT UNIQUE NOT NULL,
      num_owners INTEGER,
      accident_count INTEGER DEFAULT 0,
      accident_severity TEXT,
      service_records TEXT,
      service_records_count INTEGER DEFAULT 0,
      title_issues TEXT,
      last_reported_mileage INTEGER,
      last_reported_date TEXT,
      raw_data TEXT,
      fetched_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(sql`
    CREATE TABLE IF NOT EXISTS car_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER REFERENCES car_listings(id) UNIQUE,
      reliability_score REAL NOT NULL,
      value_score REAL NOT NULL,
      composite_score REAL NOT NULL,
      tier TEXT,
      score_breakdown TEXT,
      scored_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(sql`CREATE INDEX IF NOT EXISTS scores_composite ON car_scores(composite_score)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS scores_tier ON car_scores(tier)`);
  db.run(sql`
    CREATE TABLE IF NOT EXISTS scrape_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id INTEGER REFERENCES sources(id),
      region TEXT,
      status TEXT NOT NULL,
      listings_found INTEGER DEFAULT 0,
      listings_new INTEGER DEFAULT 0,
      listings_updated INTEGER DEFAULT 0,
      error_message TEXT,
      duration_ms INTEGER,
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    )
  `);
}

const sourceData = [
  { name: 'cars.com', baseUrl: 'https://www.cars.com', scrapeMethod: 'playwright', isActive: true, rateLimitMs: 3000 },
  { name: 'cargurus', baseUrl: 'https://www.cargurus.com', scrapeMethod: 'api', isActive: true, rateLimitMs: 3000 },
  { name: 'autotrader', baseUrl: 'https://www.autotrader.com', scrapeMethod: 'playwright', isActive: true, rateLimitMs: 5000 },
];

const ratings: Array<{ make: string; model: string; yearStart: number; yearEnd: number; baseScore: number; source: string }> = [
  { make: 'Toyota', model: 'Corolla', yearStart: 2018, yearEnd: 2024, baseScore: 4.30, source: 'Consumer Reports' },
  { make: 'Toyota', model: 'Camry', yearStart: 2018, yearEnd: 2024, baseScore: 4.40, source: 'Consumer Reports' },
  { make: 'Toyota', model: 'RAV4', yearStart: 2019, yearEnd: 2024, baseScore: 4.35, source: 'Consumer Reports' },
  { make: 'Toyota', model: 'Highlander', yearStart: 2017, yearEnd: 2024, baseScore: 4.25, source: 'Consumer Reports' },
  { make: 'Toyota', model: 'Tacoma', yearStart: 2016, yearEnd: 2024, baseScore: 4.10, source: 'JD Power' },
  { make: 'Honda', model: 'Civic', yearStart: 2016, yearEnd: 2024, baseScore: 4.30, source: 'Consumer Reports' },
  { make: 'Honda', model: 'Accord', yearStart: 2018, yearEnd: 2024, baseScore: 4.35, source: 'Consumer Reports' },
  { make: 'Honda', model: 'CR-V', yearStart: 2017, yearEnd: 2024, baseScore: 4.20, source: 'Consumer Reports' },
  { make: 'Honda', model: 'HR-V', yearStart: 2016, yearEnd: 2024, baseScore: 3.90, source: 'JD Power' },
  { make: 'Honda', model: 'Pilot', yearStart: 2016, yearEnd: 2024, baseScore: 3.80, source: 'JD Power' },
  { make: 'Mazda', model: '3', yearStart: 2019, yearEnd: 2024, baseScore: 4.20, source: 'Consumer Reports' },
  { make: 'Mazda', model: 'CX-5', yearStart: 2017, yearEnd: 2024, baseScore: 4.25, source: 'Consumer Reports' },
  { make: 'Mazda', model: 'CX-30', yearStart: 2020, yearEnd: 2024, baseScore: 4.15, source: 'Consumer Reports' },
  { make: 'Subaru', model: 'Outback', yearStart: 2018, yearEnd: 2024, baseScore: 3.70, source: 'Consumer Reports' },
  { make: 'Subaru', model: 'Forester', yearStart: 2019, yearEnd: 2024, baseScore: 3.80, source: 'Consumer Reports' },
  { make: 'Subaru', model: 'Impreza', yearStart: 2017, yearEnd: 2024, baseScore: 3.60, source: 'JD Power' },
  { make: 'Hyundai', model: 'Elantra', yearStart: 2017, yearEnd: 2024, baseScore: 4.00, source: 'Consumer Reports' },
  { make: 'Hyundai', model: 'Tucson', yearStart: 2019, yearEnd: 2024, baseScore: 3.90, source: 'Consumer Reports' },
  { make: 'Hyundai', model: 'Sonata', yearStart: 2018, yearEnd: 2024, baseScore: 3.85, source: 'JD Power' },
  { make: 'Kia', model: 'Forte', yearStart: 2019, yearEnd: 2024, baseScore: 4.05, source: 'Consumer Reports' },
  { make: 'Kia', model: 'Sportage', yearStart: 2017, yearEnd: 2024, baseScore: 3.80, source: 'Consumer Reports' },
  { make: 'Kia', model: 'Sorento', yearStart: 2016, yearEnd: 2024, baseScore: 3.75, source: 'JD Power' },
  { make: 'Nissan', model: 'Altima', yearStart: 2019, yearEnd: 2024, baseScore: 3.40, source: 'Consumer Reports' },
  { make: 'Nissan', model: 'Rogue', yearStart: 2017, yearEnd: 2024, baseScore: 3.30, source: 'Consumer Reports' },
  { make: 'Nissan', model: 'Sentra', yearStart: 2020, yearEnd: 2024, baseScore: 3.50, source: 'JD Power' },
  { make: 'Ford', model: 'Fusion', yearStart: 2013, yearEnd: 2020, baseScore: 3.60, source: 'Consumer Reports' },
  { make: 'Ford', model: 'Escape', yearStart: 2017, yearEnd: 2024, baseScore: 3.20, source: 'Consumer Reports' },
  { make: 'Ford', model: 'F-150', yearStart: 2015, yearEnd: 2024, baseScore: 3.90, source: 'JD Power' },
  { make: 'Chevrolet', model: 'Cruze', yearStart: 2016, yearEnd: 2019, baseScore: 3.30, source: 'Consumer Reports' },
  { make: 'Chevrolet', model: 'Malibu', yearStart: 2016, yearEnd: 2024, baseScore: 3.40, source: 'Consumer Reports' },
  { make: 'Chevrolet', model: 'Equinox', yearStart: 2018, yearEnd: 2024, baseScore: 3.50, source: 'JD Power' },
  { make: 'BMW', model: '3 Series', yearStart: 2019, yearEnd: 2024, baseScore: 3.00, source: 'Consumer Reports' },
  { make: 'BMW', model: '5 Series', yearStart: 2017, yearEnd: 2024, baseScore: 2.90, source: 'Consumer Reports' },
  { make: 'BMW', model: 'X3', yearStart: 2018, yearEnd: 2024, baseScore: 3.10, source: 'JD Power' },
  { make: 'Mercedes-Benz', model: 'C-Class', yearStart: 2016, yearEnd: 2024, baseScore: 2.80, source: 'Consumer Reports' },
  { make: 'Mercedes-Benz', model: 'E-Class', yearStart: 2017, yearEnd: 2024, baseScore: 3.00, source: 'JD Power' },
  { make: 'Chrysler', model: '200', yearStart: 2015, yearEnd: 2017, baseScore: 2.50, source: 'Consumer Reports' },
  { make: 'Chrysler', model: '300', yearStart: 2016, yearEnd: 2023, baseScore: 3.10, source: 'JD Power' },
  { make: 'Volkswagen', model: 'Jetta', yearStart: 2019, yearEnd: 2024, baseScore: 3.60, source: 'Consumer Reports' },
  { make: 'Volkswagen', model: 'Tiguan', yearStart: 2018, yearEnd: 2024, baseScore: 3.40, source: 'Consumer Reports' },
  { make: 'Volkswagen', model: 'Golf', yearStart: 2017, yearEnd: 2021, baseScore: 3.50, source: 'JD Power' },
  { make: 'Toyota', model: 'Corolla', yearStart: 2012, yearEnd: 2017, baseScore: 4.45, source: 'Consumer Reports' },
  { make: 'Toyota', model: 'Camry', yearStart: 2012, yearEnd: 2017, baseScore: 4.50, source: 'Consumer Reports' },
  { make: 'Toyota', model: 'RAV4', yearStart: 2013, yearEnd: 2018, baseScore: 4.20, source: 'Consumer Reports' },
  { make: 'Toyota', model: 'Highlander', yearStart: 2013, yearEnd: 2016, baseScore: 4.30, source: 'Consumer Reports' },
  { make: 'Toyota', model: 'Tacoma', yearStart: 2012, yearEnd: 2015, baseScore: 4.25, source: 'JD Power' },
  { make: 'Honda', model: 'Civic', yearStart: 2012, yearEnd: 2015, baseScore: 4.10, source: 'Consumer Reports' },
  { make: 'Honda', model: 'Accord', yearStart: 2013, yearEnd: 2017, baseScore: 4.40, source: 'Consumer Reports' },
  { make: 'Honda', model: 'CR-V', yearStart: 2012, yearEnd: 2016, baseScore: 4.15, source: 'Consumer Reports' },
  { make: 'Honda', model: 'Pilot', yearStart: 2012, yearEnd: 2015, baseScore: 3.95, source: 'JD Power' },
  { make: 'Subaru', model: 'Outback', yearStart: 2013, yearEnd: 2017, baseScore: 3.50, source: 'Consumer Reports' },
  { make: 'Subaru', model: 'Forester', yearStart: 2014, yearEnd: 2018, baseScore: 3.65, source: 'Consumer Reports' },
  { make: 'Mazda', model: '3', yearStart: 2014, yearEnd: 2018, baseScore: 4.00, source: 'Consumer Reports' },
  { make: 'Mazda', model: 'CX-5', yearStart: 2013, yearEnd: 2016, baseScore: 4.05, source: 'Consumer Reports' },
  { make: 'Ford', model: 'F-150', yearStart: 2011, yearEnd: 2014, baseScore: 4.00, source: 'JD Power' },
  { make: 'Hyundai', model: 'Elantra', yearStart: 2014, yearEnd: 2016, baseScore: 3.95, source: 'Consumer Reports' },
  { make: 'Kia', model: 'Forte', yearStart: 2014, yearEnd: 2018, baseScore: 3.85, source: 'Consumer Reports' },
  { make: 'Nissan', model: 'Altima', yearStart: 2013, yearEnd: 2018, baseScore: 3.10, source: 'Consumer Reports' },
  { make: 'Chevrolet', model: 'Malibu', yearStart: 2013, yearEnd: 2015, baseScore: 2.80, source: 'Consumer Reports' },
  { make: 'Volkswagen', model: 'Jetta', yearStart: 2014, yearEnd: 2018, baseScore: 3.40, source: 'Consumer Reports' },
  { make: 'Volkswagen', model: 'Golf', yearStart: 2015, yearEnd: 2016, baseScore: 3.55, source: 'JD Power' },
  { make: 'Ford', model: 'Escape', yearStart: 2013, yearEnd: 2016, baseScore: 2.40, source: 'Consumer Reports' },
  { make: 'Chrysler', model: '200', yearStart: 2011, yearEnd: 2014, baseScore: 2.10, source: 'Consumer Reports' },
  { make: 'Nissan', model: 'Rogue', yearStart: 2014, yearEnd: 2016, baseScore: 2.60, source: 'Consumer Reports' },
  { make: 'BMW', model: '3 Series', yearStart: 2013, yearEnd: 2018, baseScore: 2.30, source: 'Consumer Reports' },
  { make: 'Mercedes-Benz', model: 'C-Class', yearStart: 2012, yearEnd: 2015, baseScore: 2.20, source: 'Consumer Reports' },
];

async function seed() {
  try {
    await initDatabase();
    const db = getDb();

    // Create tables via raw SQL on the underlying driver
    await createTables(db);

    // Seed sources
    for (const s of sourceData) {
      await db.insert(sources).values(s).onConflictDoNothing();
    }

    // Seed reliability ratings
    for (const r of ratings) {
      await db.insert(reliabilityRatings).values(r).onConflictDoUpdate({
        target: [reliabilityRatings.make, reliabilityRatings.model, reliabilityRatings.yearStart, reliabilityRatings.yearEnd],
        set: { baseScore: r.baseScore, source: r.source },
      });
    }

    saveDb();
    console.log(`Seeded ${sourceData.length} sources and ${ratings.length} reliability ratings`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
