import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { initDatabase } from '@auto-find/db';
import listingsRoutes from './routes/listings';
import statsRoutes from './routes/stats';
import scrapeRoutes from './routes/scrape';

async function main() {
  // Initialize SQLite database first
  await initDatabase();
  console.log('Database initialized');

  const app = Fastify({ logger: true });

  await app.register(cors, { origin: 'http://localhost:3000' });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  await app.register(listingsRoutes);
  await app.register(statsRoutes);
  await app.register(scrapeRoutes);

  const port = parseInt(process.env.API_PORT || '3001');
  await app.listen({ port, host: '0.0.0.0' });

  app.log.info(`API server listening on http://0.0.0.0:${port}`);

  const shutdown = async () => {
    app.log.info('Shutting down...');
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
