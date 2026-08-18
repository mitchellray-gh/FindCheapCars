import type { ScrapedListing, ScraperOptions } from '../types';
import { getLimiter, randomDelay } from '../utils/throttle';

const DOMAIN = 'www.cargurus.com';
const BASE_URL = 'https://www.cargurus.com/Cars/searchResults.action';

function buildSearchParams(opts: ScraperOptions, offset: number): URLSearchParams {
  const params = new URLSearchParams({
    zip: opts.zipCode,
    inventorySearchWidgetType: 'AUTO',
    sortDir: 'ASC',
    sortType: 'DEAL_SCORE',
    offset: String(offset),
    maxResults: '25',
    filtersModified: 'true',
    carType: 'USED',
  });

  if (opts.maxPrice) {
    params.set('priceMax', String(opts.maxPrice));
  }

  return params;
}

function parseListing(raw: Record<string, unknown>): ScrapedListing | null {
  try {
    const listing = raw as {
      id?: number;
      listingId?: number;
      title?: string;
      price?: number;
      mileage?: number;
      carYear?: number;
      year?: number;
      makeName?: string;
      make?: string;
      modelName?: string;
      model?: string;
      trimName?: string;
      trim?: string;
      vin?: string;
      pictureData?: { url?: string };
      photos?: Array<{ url: string }>;
      daysOnMarket?: number;
      bodyTypeName?: string;
      bodyType?: string;
      localizedDriveTrain?: string;
      drivetrain?: string;
      localizedTransmission?: string;
      transmission?: string;
      engine?: string;
      localizedExteriorColor?: string;
      exteriorColorName?: string;
      localizedInteriorColor?: string;
      dealerName?: string;
      sellerCity?: string;
      sellerRegion?: string;
      sellerPostalCode?: string;
      dealer?: { name?: string; city?: string; state?: string; zip?: string };
    };

    const make = listing.makeName ?? listing.make;
    const model = listing.modelName ?? listing.model;
    const year = listing.carYear ?? listing.year;
    if (!make || !model || !year || !listing.price) {
      return null;
    }

    const externalId = String(listing.id ?? listing.listingId);
    if (!externalId || externalId === 'undefined') return null;

    return {
      source: 'cargurus',
      externalId,
      vin: listing.vin ?? null,
      make,
      model,
      modelYear: year,
      trim: listing.trimName ?? listing.trim ?? null,
      bodyStyle: listing.bodyTypeName ?? listing.bodyType ?? null,
      exteriorColor: listing.localizedExteriorColor ?? listing.exteriorColorName ?? null,
      interiorColor: listing.localizedInteriorColor ?? null,
      mileage: listing.mileage ?? null,
      price: listing.price,
      titleStatus: null,
      transmission: listing.localizedTransmission ?? listing.transmission ?? null,
      engine: listing.engine ?? null,
      drivetrain: listing.localizedDriveTrain ?? listing.drivetrain ?? null,
      fuelType: null,
      mpgCity: null,
      mpgHighway: null,
      dealerName: listing.dealerName ?? listing.dealer?.name ?? null,
      dealerCity: listing.sellerCity ?? listing.dealer?.city ?? null,
      dealerState: listing.sellerRegion ?? listing.dealer?.state ?? null,
      dealerZip: listing.sellerPostalCode ?? listing.dealer?.zip ?? null,
      listingUrl: `https://www.cargurus.com/Cars/l-${externalId}`,
      imageUrl: listing.pictureData?.url ?? listing.photos?.[0]?.url ?? null,
      daysOnMarket: listing.daysOnMarket ?? null,
    };
  } catch {
    return null;
  }
}

export class CarGurusScraper {
  private limiter = getLimiter(DOMAIN, 1, 4000);

  async scrape(opts: ScraperOptions): Promise<ScrapedListing[]> {
    const maxPages = opts.maxPages ?? 5;
    const allListings: ScrapedListing[] = [];

    for (let page = 0; page < maxPages; page++) {
      const offset = page * 25;

      const listings = await this.limiter.schedule(() => this.fetchPage(opts, offset));

      if (listings.length === 0) {
        break;
      }

      allListings.push(...listings);

      if (page < maxPages - 1) {
        await randomDelay(3000, 7000);
      }
    }

    return allListings;
  }

  private async fetchPage(opts: ScraperOptions, offset: number): Promise<ScrapedListing[]> {
    const params = buildSearchParams(opts, offset);
    const url = `${BASE_URL}?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://www.cargurus.com/',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!response.ok) {
      throw new Error(`CarGurus API returned ${response.status} for offset ${offset}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    let data: Record<string, unknown>;

    if (contentType.includes('json')) {
      data = (await response.json()) as Record<string, unknown>;
    } else {
      const text = await response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse CarGurus response as JSON');
      }
      data = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    }

    const rawListings = (Array.isArray(data) ? data : (data.listings as Record<string, unknown>[])) ?? [];

    const results: ScrapedListing[] = [];
    for (const raw of rawListings) {
      const parsed = parseListing(raw);
      if (parsed) {
        results.push(parsed);
      }
    }

    return results;
  }
}
