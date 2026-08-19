import type { ScrapedListing, ScraperOptions } from '../types';
import { withPage, createStealthContext } from '../utils/browser';
import { getLimiter, randomDelay } from '../utils/throttle';

const DOMAIN = 'www.cars.com';
const BASE_URL = 'https://www.cars.com/shopping/results/';

function buildUrl(opts: ScraperOptions, page: number): string {
  const params = new URLSearchParams({
    stock_type: 'used',
    makes: '',
    models: '',
    maximum_distance: 'all',
    zip: opts.zipCode,
    page: String(page),
    sort: 'best_match_desc',
  });

  if (opts.maxPrice) {
    params.set('list_price_max', String(opts.maxPrice));
  }

  if (opts.minYear) {
    params.set('year_min', String(opts.minYear));
  }

  return `${BASE_URL}?${params.toString()}`;
}

interface VehicleDetails {
  id?: string;
  listingId?: string;
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  modelYear?: number;
  trim?: string;
  bodyStyle?: string;
  mileage?: string | number;
  price?: string | number;
  dealerPrice?: string | number;
  dealerName?: string;
  dealerCity?: string;
  dealerState?: string;
  dealerZip?: string;
  exteriorColor?: string;
  interiorColor?: string;
  transmission?: string;
  engine?: string;
  drivetrain?: string;
  fuelType?: string;
  mpgCity?: number;
  mpgHighway?: number;
  titleStatus?: string;
  imageUrl?: string;
  primaryThumbnail?: string;
  pictureData?: { url?: string };
  listingUrl?: string;
  url?: string;
  slug?: string;
}

function toScrapedListing(data: VehicleDetails): ScrapedListing | null {
  const externalId = String(data.listingId ?? data.id ?? '').trim();
  if (!externalId) return null;

  const modelYear = data.year ?? data.modelYear ?? 0;
  const rawPrice = data.price ?? data.dealerPrice ?? 0;
  const price = typeof rawPrice === 'string' ? parseFloat(rawPrice.replace(/[^0-9.]/g, '')) : Number(rawPrice);

  if (!modelYear || !price || price <= 0) return null;

  const rawMileage = data.mileage;
  const mileage = typeof rawMileage === 'string'
    ? parseInt(rawMileage.replace(/[^0-9]/g, ''), 10)
    : typeof rawMileage === 'number' ? rawMileage : null;

  const imageUrl = data.imageUrl
    ?? data.primaryThumbnail
    ?? data.pictureData?.url
    ?? null;

  const listingSlug = data.slug ?? externalId;
  const listingUrl = `https://www.cars.com/vehicledetail/${listingSlug}/`;

  return {
    source: 'cars_com',
    externalId,
    vin: data.vin ?? null,
    make: data.make ?? '',
    model: data.model ?? '',
    modelYear,
    trim: data.trim ?? null,
    bodyStyle: data.bodyStyle ?? null,
    exteriorColor: data.exteriorColor ?? null,
    interiorColor: data.interiorColor ?? null,
    mileage,
    price,
    titleStatus: data.titleStatus ?? null,
    transmission: data.transmission ?? null,
    engine: data.engine ?? null,
    drivetrain: data.drivetrain ?? null,
    fuelType: data.fuelType ?? null,
    mpgCity: data.mpgCity ?? null,
    mpgHighway: data.mpgHighway ?? null,
    dealerName: data.dealerName ?? null,
    dealerCity: data.dealerCity ?? null,
    dealerState: data.dealerState ?? null,
    dealerZip: data.dealerZip ?? null,
    listingUrl,
    imageUrl,
    daysOnMarket: null,
  };
}

export class CarsComScraper {
  private limiter = getLimiter(DOMAIN, 1, 5000);

  async scrape(opts: ScraperOptions): Promise<ScrapedListing[]> {
    const maxPages = opts.maxPages ?? 5;
    const allListings: ScrapedListing[] = [];
    const context = await createStealthContext();

    try {
      for (let page = 1; page <= maxPages; page++) {
        const listings = await this.limiter.schedule(() =>
          this.fetchPage(context, opts, page),
        );

        if (listings.length === 0) break;

        allListings.push(...listings);

        if (page < maxPages) {
          await randomDelay(4000, 9000);
        }
      }
    } finally {
      await context.close().catch(() => {});
    }

    return allListings;
  }

  private async fetchPage(
    context: Awaited<ReturnType<typeof createStealthContext>>,
    opts: ScraperOptions,
    page: number,
  ): Promise<ScrapedListing[]> {
    const url = buildUrl(opts, page);

    return withPage(async (pw) => {
      await pw.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Cars.com uses <fuse-card> custom elements with a data-vehicle-details JSON attribute
      await pw.waitForSelector('fuse-card[data-vehicle-details]', { timeout: 15000 }).catch(() => {});
      await pw.waitForTimeout(2000);

      const results = await pw.evaluate(() => {
        const cards = document.querySelectorAll('fuse-card[data-vehicle-details]');
        const listings: VehicleDetails[] = [];
        cards.forEach((card) => {
          try {
            const raw = card.getAttribute('data-vehicle-details');
            if (raw) {
              listings.push(JSON.parse(raw));
            }
          } catch {}
        });
        return listings;
      });

      return results
        .map(toScrapedListing)
        .filter((l): l is ScrapedListing => l !== null);
    }, () => Promise.resolve(context));
  }
}
