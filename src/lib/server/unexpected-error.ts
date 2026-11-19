import { Prisma } from '@prisma/client';
import { errorResponse } from '@/lib/http/responses';

/** Prisma's codes for "the database cannot be reached right now" (connect, timeout, pool). */
const UNREACHABLE_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024']);

function databaseUnreachable(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientInitializationError ||
    (error instanceof Prisma.PrismaClientKnownRequestError && UNREACHABLE_CODES.has(error.code))
  );
}

/**
 * The API's answer to an error nobody planned for: a 503 while the database
 * is unreachable (the phone may simply try again), a 500 otherwise, both in
 * the usual `{ error, message }` shape and never with the error's details.
 */
export function unexpectedErrorResponse(error: unknown): Response {
  console.error(error);
  return databaseUnreachable(error)
    ? errorResponse(503, 'unavailable', 'We could not reach your game just now. Try again in a moment.')
    : errorResponse(500, 'server_error', 'Something went wrong on our side. Try again in a moment.');
}

/** Wraps a route handler so a thrown error becomes `unexpectedErrorResponse`, not an empty 500. */
export function guardRoute<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>): (...args: Args) => Promise<Response> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return unexpectedErrorResponse(error);
    }
  };
}
