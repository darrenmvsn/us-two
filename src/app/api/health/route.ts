import { prisma } from '@/lib/prisma';

/** Liveness and database reachability for the container healthcheck. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: 'ok' });
  } catch {
    return Response.json({ status: 'database_unreachable' }, { status: 503 });
  }
}
