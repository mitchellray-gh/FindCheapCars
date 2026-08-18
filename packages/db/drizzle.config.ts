import { defineConfig } from 'drizzle-kit';
import path from 'path';

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'autofind.db'),
  },
});
