import { FastifyInstance } from 'fastify';
import { getDb, scrapeLogs } from '@auto-find/db';
import { desc } from 'drizzle-orm';
import { runScrapeJob } from '../services/scrape-service';

export default async function scrapeRoutes(app: FastifyInstance) {
  app.post('/api/scrape', async (request, reply) => {
    const body = request.body as {
      source: string;
      zipCode: string;
      maxPages?: number;
      maxPrice?: number;
    };

    if (!body.source || !body.zipCode) {
      return reply.code(400).send({ error: 'source and zipCode are required' });
    }

    if (!['cargurus', 'cars.com', 'autotrader'].includes(body.source)) {
      return reply.code(400).send({ error: 'Invalid source. Must be: cargurus, cars.com, or autotrader' });
    }

    try {
      const result = await runScrapeJob({
        source: body.source,
        zipCode: body.zipCode,
        maxPages: body.maxPages || 5,
        maxPrice: body.maxPrice || 15000,
      });

      return { status: 'completed', ...result };
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  app.get('/api/scrape/logs', async () => {
    const db = getDb();
    const logs = await db
      .select()
      .from(scrapeLogs)
      .orderBy(desc(scrapeLogs.startedAt))
      .limit(20);
    return logs;
  });
}
