import type { ScrapedListing, ScraperOptions } from '../types';
import { getLimiter, randomDelay } from '../utils/throttle';

const DOMAIN = 'www.autotrader.com';
const BASE_URL = 'https://www.autotrader.com/cars-for-sale/used-cars';

function buildUrl(opts: ScraperOptions, page: number): string {
  const zip = opts.zipCode;
  const params = new URLSearchParams({
    zip,
    maxPrice: String(opts.maxPrice ?? 15000),
    radius: String(opts.radius ?? 50),
    start: String((page - 1) * 25),
    page: String(page),
  });

  return `${BASE_URL}/${zip}/radius?${params.toString()}`;
}

interface AutoTraderInventoryItem {
  id?: number;
  vin?: string;
  year?: number;
  makeCode?: string;
  modelCode?: string;
  atTrim?: string;
  title?: string;
  mileage?: { label?: string; value?: string } | number;
  pricingDetail?: {
    displayPrice?: number;
    salePrice?: number;
  };
  ownerName?: string;
  ownerId?: number;
  images?: {
    primary?: number;
    sources?: Array<{ src?: string; alt?: string }>;
  };
  bodyStyles?: Array<{ code?: string; name?: string }> | string[];
  doors?: string | number;
  mpgCity?: number;
  mpgHighway?: number;
  color?: { exteriorColor?: string; exteriorColorSimple?: string; interiorColor?: string; interiorColorSimple?: string } | string;
  engine?: { code?: string; name?: string } | string;
  fuelType?: { code?: string; group?: string; name?: string } | string;
  transmission?: { code?: string; description?: string; group?: string; name?: string } | string;
  driveType?: { description?: string; name?: string } | string;
  daysOnSite?: number;
  specifications?: Record<string, { label?: string; value?: string }>;
}

function extractStr(val: unknown): string | null {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    if (typeof obj.description === 'string') return obj.description;
    if (typeof obj.name === 'string') return obj.name;
    if (typeof obj.value === 'string') return obj.value;
    if (typeof obj.code === 'string') return obj.code;
  }
  return null;
}

function parseMileage(raw: unknown): number | null {
  if (typeof raw === 'number') return raw;
  if (raw && typeof raw === 'object' && 'value' in raw) {
    const val = (raw as { value: string }).value;
    if (val) return parseInt(val.replace(/[^0-9]/g, ''), 10);
  }
  return null;
}

function toScrapedListing(item: AutoTraderInventoryItem): ScrapedListing | null {
  const externalId = String(item.id ?? '').trim();
  if (!externalId) return null;

  const make = item.makeCode ?? '';
  const model = item.modelCode ?? '';
  const modelYear = item.year ?? 0;
  const trim = item.atTrim ?? null;

  const rawPrice = item.pricingDetail?.displayPrice ?? item.pricingDetail?.salePrice ?? 0;
  const price = Number(rawPrice);
  if (!modelYear || !price || price <= 0) return null;

  const mileage = parseMileage(item.mileage);

  let imageUrl: string | null = null;
  if (item.images?.sources && item.images.sources.length > 0) {
    const primaryIdx = item.images.primary ?? 0;
    imageUrl = item.images.sources[primaryIdx]?.src ?? item.images.sources[0]?.src ?? null;
  }

  const listingUrl = `https://www.autotrader.com/cars-for-sale/vehicle/${externalId}`;

  const bodyStyle = extractStr(item.bodyStyles?.[0]) ?? null;

  let exteriorColor: string | null = null;
  let interiorColor: string | null = null;
  if (item.color && typeof item.color === 'object') {
    exteriorColor = item.color.exteriorColorSimple ?? item.color.exteriorColor ?? null;
    interiorColor = item.color.interiorColorSimple ?? item.color.interiorColor ?? null;
  }

  return {
    source: 'autotrader',
    externalId,
    vin: item.vin ?? null,
    make,
    model,
    modelYear,
    trim,
    bodyStyle,
    exteriorColor,
    interiorColor,
    mileage,
    price,
    titleStatus: null,
    transmission: extractStr(item.transmission),
    engine: extractStr(item.engine),
    drivetrain: extractStr(item.driveType),
    fuelType: extractStr(item.fuelType),
    mpgCity: item.mpgCity ?? null,
    mpgHighway: item.mpgHighway ?? null,
    dealerName: item.ownerName ?? null,
    dealerCity: null,
    dealerState: null,
    dealerZip: null,
    listingUrl,
    imageUrl,
    daysOnMarket: item.daysOnSite ?? null,
  };
}

function extractNextData(html: string): AutoTraderInventoryItem[] {
  const scriptStart = '<script id="__NEXT_DATA__" type="application/json">';
  const scriptEnd = '</script>';
  const startIdx = html.indexOf(scriptStart);
  if (startIdx === -1) return [];

  const jsonStart = startIdx + scriptStart.length;
  const endIdx = html.indexOf(scriptEnd, jsonStart);
  if (endIdx === -1) return [];

  const jsonStr = html.substring(jsonStart, endIdx);

  try {
    const nextData = JSON.parse(jsonStr);
    const eggsState = nextData?.props?.pageProps?.__eggsState;
    if (!eggsState) return [];

    const inventory: Record<string, AutoTraderInventoryItem> = eggsState.inventory ?? {};
    const activeResults: number[] = eggsState.srp_results?.activeResults ?? [];

    const stockIds = activeResults.length > 0
      ? activeResults.map(String)
      : Object.keys(inventory);

    return stockIds
      .map((id) => inventory[id])
      .filter(Boolean);
  } catch {
    return [];
  }
}

export class AutotraderScraper {
  private limiter = getLimiter(DOMAIN, 1, 5000);

  async scrape(opts: ScraperOptions): Promise<ScrapedListing[]> {
    const maxPages = opts.maxPages ?? 5;
    const allListings: ScrapedListing[] = [];

    try {
      for (let page = 1; page <= maxPages; page++) {
        const listings = await this.limiter.schedule(() =>
          this.fetchPage(opts, page),
        );

        if (listings.length === 0) break;

        allListings.push(...listings);

        if (page < maxPages) {
          await randomDelay(3000, 6000);
        }
      }
    } finally {
      // No browser to close — using HTTP fetch
    }

    return allListings;
  }

  private async fetchPage(
    opts: ScraperOptions,
    page: number,
  ): Promise<ScrapedListing[]> {
    const url = buildUrl(opts, page);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
      },
    });

    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    const items = extractNextData(html);

    return items
      .map(toScrapedListing)
      .filter((l): l is ScrapedListing => l !== null);
  }
}
