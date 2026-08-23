/**
 * Seeds reference data that the app expects to already exist.
 *
 * This script runs outside the Next.js app (via `npx prisma db seed`), before any
 * request lifecycle exists, so it is the one sanctioned place that talks to Prisma
 * without going through `src/server/<domain>/`. It is self-contained on purpose —
 * `@/` path aliases are not resolvable when Node runs this file directly.
 *
 * Idempotent: safe to re-run at any time.
 */
import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

/** The eight major allergens surfaced in the profile's allergy picker. */
const DEFAULT_ALLERGIES = [
  'Dairy',
  'Eggs',
  'Fish',
  'Shellfish',
  'Tree Nuts',
  'Peanuts',
  'Wheat',
  'Soy',
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    await prisma.allergy.createMany({
      data: DEFAULT_ALLERGIES.map(name => ({ name })),
      skipDuplicates: true,
    });

    const count = await prisma.allergy.count();
    process.stdout.write(`Seeded allergies — ${count} total in database.\n`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

await main();
