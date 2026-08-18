import * as cheerio from 'cheerio';
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

  if (opts.maxMileage) {
    params.set('maximum_distance', String(opts.maxMileage));
  }

  return `${BASE_URL}?${params.toString()}`;
}

function parseListingFromCard($: cheerio.CheerioAPI, card: cheerio.Element): ScrapedListing | null {
  try {
    const $card = $(card);

    const linkEl = $card.find('a.inventory-card-main-link, a[href*="/vehicles/"]').first();
    const href = linkEl.attr('href') ?? '';
    const listingUrl = href.startsWith('http') ? href : `https://www.cars.com${href}`;

    const externalIdMatch = listingUrl.match(/\/vehicles?\/(\d+)/);
    const externalId = externalIdMatch?.[1] ?? null;
    if (!externalId) return null;

    const titleEl = $card.find('h2, .title, [class*="title"]').first();
    const rawTitle = titleEl.text().trim();
    if (!rawTitle) return null;

    const yearMatch = rawTitle.match(/^(\d{4})\s+/);
    const modelYear = yearMatch ? parseInt(yearMatch[1], 10) : 0;

    const priceEl = $card.find('[class*="price"], .primary-price').first();
    const rawPrice = priceEl.text().replace(/[^0-9.]/g, '');
    const price = parseFloat(rawPrice) || 0;

    if (!modelYear || !price) return null;

    const mileageEl = $card.find('[class*="mileage"], .mileage').first();
    const rawMileage = mileageEl.text().replace(/[^0-9]/g, '');
    const mileage = rawMileage ? parseInt(rawMileage, 10) : null;

    const dealerEl = $card.find('[class*="dealer"], .dealer-name, .dealer-info').first();
    const dealerName = dealerEl.text().trim() || null;

    const locationEl = $card.find('[class*="location"], .dealer-location, .vehicle-location').first();
    const locationText = locationEl.text().trim();
    const locationParts = locationText.split(',').map((s: string) => s.trim());
    const dealerCity = locationParts[0] ?? null;
    const dealerState = locationParts.length > 1 ? locationParts[locationParts.length - 1] : null;

    const imgEl = $card.find('img').first();
    const imageUrl = imgEl.attr('src') ?? imgEl.attr('data-src') ?? null;

    const cleanedTitle = rawTitle
      .replace(/^\d{4}\s+/, '')
      .trim();

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
      source: 'cars_com',
      externalId,
      vin: null,
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
        'div.inventory-card, [data-qa="vehicle-card"], .shop-results-list .vehicle-card, article.vehicle-card',
        { timeout: 15000 },
      ).catch(() => {});

      await pw.waitForTimeout(2000);

      const html = await pw.content();
      const $ = cheerio.load(html);

      const cards = $('div.inventory-card, [data-qa="vehicle-card"], .shop-results-list .vehicle-card, article.vehicle-card').toArray();

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
