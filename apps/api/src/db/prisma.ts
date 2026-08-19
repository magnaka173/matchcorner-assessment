import { PrismaClient } from "@prisma/client";

/**
 * Process-wide Prisma client.
 *
 * Reused on the global object in development so tsx/watch reloads do not
 * exhaust the database connection pool.
 */
const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
