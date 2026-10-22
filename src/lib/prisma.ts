import { PrismaClient } from '@prisma/client';

/** One client per process; Next's dev reloads would otherwise open a pool per edit. */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export type Db = PrismaClient;
