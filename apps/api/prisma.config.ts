import path from 'node:path';
import { defineConfig } from 'prisma/config';

try {
  process.loadEnvFile();
} catch {
  // .env absent or already loaded — CI / prod pass env vars directly
  console.log('Fahhh');
}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
