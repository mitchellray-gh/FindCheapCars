import type { ScrapedListing, ScraperOptions } from '../types';
import { getLimiter, randomDelay } from '../utils/throttle';

const DOMAIN = 'www.carmax.com';
const BASE_URL = 'https://www.carmax.com/cars/api/search/run';
const PAGE_SIZE = 24;

interface CarMaxItem {
  stockNumber?: number | string;
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  body?: string;
  basePrice?: number;
  mileage?: number;
  transmission?: string;
  engineType?: string;
  engineSize?: string;
  cylinders?: number | string;
  driveTrain?: string;
  fuelType?: string;
  mpgCity?: number;
  mpgHighway?: number;
  exteriorColor?: string;
  interiorColor?: string;
  storeCity?: string;
  state?: string;
  stateAbbreviation?: string;
  storeName?: string;
  heroImageUrl?: string;
  heroThumbnailImageUrl?: string;
}

function buildEngine(item: CarMaxItem): string | null {
  const parts = [
    item.engineSize,
    item.cylinders ? `${item.cylinders}-Cyl` : null,
    item.engineType && item.engineType !== 'Gas' ? item.engineType : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}

function toScrapedListing(item: CarMaxItem): ScrapedListing | null {
  const externalId = String(item.stockNumber ?? '').trim();
  if (!externalId) return null;

  const make = item.make;
  const model = item.model;
  const modelYear = item.year ?? 0;
  const price = Number(item.basePrice ?? 0);
  if (!make || !model || !modelYear || !price || price <= 0) return null;

  return {
    source: 'carmax',
    externalId,
    vin: item.vin ?? null,
    make,
    model,
    modelYear,
    trim: item.trim ?? null,
    bodyStyle: item.body ?? null,
    exteriorColor: item.exteriorColor ?? null,
    interiorColor: item.interiorColor ?? null,
    mileage: item.mileage ?? null,
    price,
    titleStatus: null,
    transmission: item.transmission ?? null,
    engine: buildEngine(item),
    drivetrain: item.driveTrain ?? null,
    fuelType: item.fuelType || item.engineType || null,
    mpgCity: item.mpgCity ?? null,
    mpgHighway: item.mpgHighway ?? null,
    dealerName: item.storeName ? `CarMax ${item.storeName}` : 'CarMax',
    dealerCity: item.storeCity ?? null,
    dealerState: item.stateAbbreviation ?? item.state ?? null,
    dealerZip: null,
    listingUrl: `https://www.carmax.com/car/${externalId}`,
    imageUrl: item.heroImageUrl ?? item.heroThumbnailImageUrl ?? null,
    daysOnMarket: null,
  };
}

export class CarMaxScraper {
  private limiter = getLimiter(DOMAIN, 1, 4000);

  async scrape(opts: ScraperOptions): Promise<ScrapedListing[]> {
    const maxPages = opts.maxPages ?? 5;
    const maxPrice = opts.maxPrice ?? 15000;
    const allListings: ScrapedListing[] = [];

    for (let page = 0; page < maxPages; page++) {
      const skip = page * PAGE_SIZE;
      const listings = await this.limiter.schedule(() => this.fetchPage(opts, skip));

      if (listings.length === 0) break;

      // Only keep listings within budget (CarMax's API doesn't reliably price-filter)
      allListings.push(...listings.filter((l) => l.price <= maxPrice));

      if (page < maxPages - 1) {
        await randomDelay(2500, 5500);
      }
    }

    return allListings;
  }

  private async fetchPage(opts: ScraperOptions, skip: number): Promise<ScrapedListing[]> {
    const maxPrice = opts.maxPrice ?? 15000;
    const params = new URLSearchParams({
      uri: `/cars?price=1000-${maxPrice}`,
      skip: String(skip),
      take: String(PAGE_SIZE),
      zipCode: opts.zipCode,
      radius: `radius-${opts.radius ?? 50}`,
      sort: 'price-lowtohigh',
    });

    const url = `${BASE_URL}?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://www.carmax.com/cars',
      },
    });

    if (!response.ok) {
      throw new Error(`CarMax API returned ${response.status} for skip ${skip}`);
    }

    const data = (await response.json()) as { items?: CarMaxItem[] };
    const rawItems = data.items ?? [];

    const results: ScrapedListing[] = [];
    for (const raw of rawItems) {
      const parsed = toScrapedListing(raw);
      if (parsed) results.push(parsed);
    }

    return results;
  }
}
