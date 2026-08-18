// ── Car Listing ──────────────────────────────────────────
export interface CarListing {
  id: number;
  sourceId: number;
  externalId: string;
  vin: string | null;
  make: string;
  model: string;
  modelYear: number;
  trim: string | null;
  bodyStyle: string | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  mileage: number | null;
  price: number;
  estimatedFees: number;
  totalCost: number;
  titleStatus: string | null;
  transmission: string | null;
  engine: string | null;
  drivetrain: string | null;
  fuelType: string | null;
  mpgCity: number | null;
  mpgHighway: number | null;
  dealerName: string | null;
  dealerCity: string | null;
  dealerState: string | null;
  dealerZip: string | null;
  listingUrl: string;
  imageUrl: string | null;
  daysOnMarket: number | null;
  scrapedAt: Date;
  isActive: boolean;
}

// ── Car Score ────────────────────────────────────────────
export interface CarScore {
  id: number;
  listingId: number;
  reliabilityScore: number;
  valueScore: number;
  compositeScore: number;
  tier: ScoreTier;
  scoreBreakdown: ScoreBreakdown;
  scoredAt: Date;
}

export type ScoreTier = 'top_pick' | 'great_value' | 'worth_considering' | 'proceed_with_caution';

export interface ScoreBreakdown {
  reliability: {
    baseReliability: number;
    mileageScore: number;
    titleScore: number;
    ownershipScore: number;
    accidentScore: number;
  };
  value: {
    marketComparison: number;
    priceReliabilityRatio: number;
    maintenanceScore: number;
    daysOnMarketScore: number;
  };
}

// ── Carfax Report ────────────────────────────────────────
export interface CarfaxReport {
  id: number;
  vin: string;
  numOwners: number | null;
  accidentCount: number;
  accidentSeverity: string | null;
  serviceRecords: ServiceRecord[];
  serviceRecordsCount: number;
  lastReportedMileage: number | null;
  lastReportedDate: string | null;
  fetchedAt: Date;
}

export interface ServiceRecord {
  date: string;
  mileage: number;
  description: string;
}

// ── Source ───────────────────────────────────────────────
export interface Source {
  id: number;
  name: string;
  baseUrl: string;
  scrapeMethod: string;
  isActive: boolean;
  rateLimitMs: number;
}

// ── Reliability Rating ───────────────────────────────────
export interface ReliabilityRating {
  id: number;
  make: string;
  model: string;
  yearStart: number;
  yearEnd: number;
  baseScore: number;
  source: string;
}

// ── Market Price ─────────────────────────────────────────
export interface MarketPrice {
  id: number;
  make: string;
  model: string;
  year: number;
  trim: string | null;
  mileageBucket: string;
  avgPrice: number;
  sampleCount: number;
  computedAt: Date;
}

// ── Scrape Log ───────────────────────────────────────────
export interface ScrapeLog {
  id: number;
  sourceId: number;
  region: string;
  status: 'running' | 'completed' | 'failed';
  listingsFound: number;
  listingsNew: number;
  listingsUpdated: number;
  errorMessage: string | null;
  durationMs: number | null;
  startedAt: Date;
  completedAt: Date | null;
}

// ── API Query Params ─────────────────────────────────────
export interface ListingsQuery {
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMax?: number;
  priceMin?: number;
  mileageMax?: number;
  minScore?: number;
  tier?: ScoreTier;
  bodyStyle?: string;
  titleStatus?: string;
  drivetrain?: string;
  sortBy?: 'composite_score' | 'price' | 'mileage' | 'model_year' | 'reliability_score';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ── API Responses ────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListingWithScore extends CarListing {
  score: CarScore | null;
  carfax: CarfaxReport | null;
}

export interface DashboardStats {
  totalListings: number;
  avgCompositeScore: number;
  tierDistribution: Record<ScoreTier, number>;
  topMakes: Array<{ make: string; count: number; avgScore: number }>;
  priceRange: { min: number; max: number; avg: number };
}

// ── Scraping ─────────────────────────────────────────────
export interface ScrapedListing {
  source: string;
  externalId: string;
  vin: string | null;
  make: string;
  model: string;
  modelYear: number;
  trim: string | null;
  bodyStyle: string | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  mileage: number | null;
  price: number;
  titleStatus: string | null;
  transmission: string | null;
  engine: string | null;
  drivetrain: string | null;
  fuelType: string | null;
  mpgCity: number | null;
  mpgHighway: number | null;
  dealerName: string | null;
  dealerCity: string | null;
  dealerState: string | null;
  dealerZip: string | null;
  listingUrl: string;
  imageUrl: string | null;
  daysOnMarket: number | null;
}

export interface ScrapeJobConfig {
  source: string;
  region: string;
  zipCode: string;
  radius: number;
  maxPages: number;
  maxPrice: number;
}
