import { initDatabase } from './client';

/**
 * Reference-data seeding now happens automatically inside initDatabase()
 * (schema + sources + reliability ratings, defined in ./bootstrap). This CLI
 * just triggers it for local setups / CI. Run with: npm run seed
 */
async function seed() {
  try {
    await initDatabase();
    console.log('Database ready: schema ensured and reference data seeded.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
