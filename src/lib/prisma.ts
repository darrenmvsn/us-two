import { PrismaClient } from '@prisma/client';

/**
 * One client, and so one connection pool, per process. Kept on `globalThis`
 * in every environment: dev reloads re-run this module, and a production
 * build may bundle it into more than one server chunk. The pool's size comes
 * from `DATABASE_URL` (`connection_limit`; README § Database connections).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = (globalForPrisma.prisma ??= new PrismaClient());

export type Db = PrismaClient;
