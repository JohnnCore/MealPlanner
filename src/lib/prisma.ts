import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { DATABASE_URL } from './config';

declare global {
  // allow global 'var' across module reloads in development
  var prisma: PrismaClient | undefined;
}

const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = global.prisma || new PrismaClient({ adapter });
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;
