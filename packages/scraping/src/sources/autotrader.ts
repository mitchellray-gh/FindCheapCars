import * as cheerio from 'cheerio';
import type { ScrapedListing, ScraperOptions } from '../types';
import { withPage, createStealthContext } from '../utils/browser';
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

function parseListingFromCard($: cheerio.CheerioAPI, card: cheerio.Element): ScrapedListing | null {
  try {
    const $card = $(card);

    const linkEl = $card.find('a[data-cmp="inventoryCard"]').first();
    if (!linkEl.length) {
      const altLink = $card.find('a[href*="/cars-for-sale/"]').first();
      if (!altLink.length) return null;
    }

    const link = $card.find('a[href*="/cars-for-sale/"]').first();
    const href = link.attr('href') ?? '';
    const listingUrl = href.startsWith('http') ? href : `https://www.autotrader.com${href}`;

    const vinMatch = listingUrl.match(/VIN[:=]([A-HJ-NPR-Z0-9]{17})/i) ?? href.match(/\/(\d{17})/);
    const vin = vinMatch?.[1] ?? null;

    const externalIdMatch = listingUrl.match(/\/(\d+)$/);
    const externalId = externalIdMatch?.[1] ?? vin ?? null;
    if (!externalId) return null;

    const titleEl = $card.find('h2, [data-cmp="subheading"], [class*="vehicle-title"]').first();
    const rawTitle = titleEl.text().trim();
    if (!rawTitle) return null;

    const yearMatch = rawTitle.match(/^(\d{4})\s+/);
    const modelYear = yearMatch ? parseInt(yearMatch[1], 10) : 0;

    const priceEl = $card.find('[data-cmp="firstPrice"], [class*="price"], .first-price').first();
    const rawPrice = priceEl.text().replace(/[^0-9.]/g, '');
    const price = parseFloat(rawPrice) || 0;

    if (!modelYear || !price) return null;

    const mileageEl = $card.find('[data-cmp="mileage"], [class*="mileage"], .mileage').first();
    const rawMileage = mileageEl.text().replace(/[^0-9]/g, '');
    const mileage = rawMileage ? parseInt(rawMileage, 10) : null;

    const dealerEl = $card.find('[data-cmp="dealerName"], [class*="dealer-name"], .dealership-name').first();
    const dealerName = dealerEl.text().trim() || null;

    const locationEl = $card.find('[data-cmp="dealerLocation"], [class*="location"], .dealer-location').first();
    const locationText = locationEl.text().trim();
    const locationParts = locationText.split(',').map((s: string) => s.trim());
    const dealerCity = locationParts[0] ?? null;
    const dealerState = locationParts.length > 1 ? locationParts[locationParts.length - 1] : null;

    const imgEl = $card.find('img').first();
    const imageUrl = imgEl.attr('src') ?? imgEl.attr('data-src') ?? null;

    const cleanedTitle = rawTitle.replace(/^\d{4}\s+/, '').trim();
    const parts = cleanedTitle.split(/\s+/);

    let make = '';
    let model = '';
    let trim = '';

    if (parts.length >= 2) {
      make = parts[0];
      model = parts[1];
      trim = parts.slice(2).join(' ');
    } else if (parts.length === 1) {
      make = parts[0];
    }

    return {
      source: 'autotrader',
      externalId,
      vin,
      make,
      model,
      modelYear,
      trim: trim || null,
      bodyStyle: null,
      exteriorColor: null,
      interiorColor: null,
      mileage,
      price,
      titleStatus: null,
      transmission: null,
      engine: null,
      drivetrain: null,
      fuelType: null,
      mpgCity: null,
      mpgHighway: null,
      dealerName,
      dealerCity,
      dealerState,
      dealerZip: null,
      listingUrl,
      imageUrl,
      daysOnMarket: null,
    };
  } catch {
    return null;
  }
}

export class AutotraderScraper {
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

        if (listings.length === 0) {
          break;
        }

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

      await pw.waitForSelector(
        '[data-cmp="inventoryCard"], .inventory-listing, .result-card, [class*="inventory-card"]',
        { timeout: 15000 },
      ).catch(() => {});

      await pw.waitForTimeout(3000);

      const html = await pw.content();
      const $ = cheerio.load(html);

      const cards = $('[data-cmp="inventoryCard"], .inventory-listing, .result-card, [class*="inventory-card"]').toArray();

      const results: ScrapedListing[] = [];
      for (const card of cards) {
        const parsed = parseListingFromCard($, card);
        if (parsed) {
          results.push(parsed);
        }
      }

      return results;
    }, () => Promise.resolve(context));
  }
}
