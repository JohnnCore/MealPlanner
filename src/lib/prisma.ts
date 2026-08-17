import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

import { DATABASE_URL } from './config';

declare global {
  // allow global 'var' across module reloads in development
  var prisma: PrismaClient | undefined;
  var pgPool: Pool | undefined;
}

// Pool configuration: tune via environment variables to avoid
// connection exhaustion in production (defaults are safe for small apps).
const poolOptions = {
  max: Number(process.env.PG_MAX_POOL_SIZE ?? process.env.PG_POOL_MAX ?? 10),
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS ?? 30000),
  connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS ?? 2000),
};

const pool = global.pgPool ?? new Pool({ connectionString: DATABASE_URL, ...poolOptions });
const adapter = new PrismaPg(pool);
const prisma = global.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  global.pgPool = pool;
  global.prisma = prisma;
}

export default prisma;
