// src/lib/database.ts
// Prisma 6 singleton with Neon serverless driver (HTTP-based, no TCP pool):
// - @prisma/adapter-neon replaces the default TCP connection pool with
//   Neon's HTTP driver, which multiplexes through PgBouncer server-side.
//   No more direct Postgres connections — every query is a lightweight HTTP call.
// - Automatic retry (3 attempts) on transient Neon errors (P1001, P1002, P1017, P2024)
// - Process-level graceful disconnect on SIGTERM/SIGINT
// - Suppressed "Closed" connection noise (harmless PgBouncer idle-timeout messages)
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma error codes that represent transient Neon connection issues:
// P1001 — can't reach database server
// P1002 — server closed the connection (Neon auto-suspend / PgBouncer idle timeout)
// P1017 — server closed the connection (Neon cold start wake)
// P2024 — timed out fetching a new connection from the pool
const RETRY_CODES = new Set(["P1001", "P1002", "P1017", "P2024"]);
const MAX_RETRIES = 3;

function createPrismaClient(): PrismaClient {
  // PrismaNeon accepts a connection string directly and creates its own
  // HTTP-based pool internally — no TCP connections, no pool limits.
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });

  const base = new PrismaClient({
    adapter,
    log: [
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
    ],
  });

  // Filter log output: suppress Neon/PgBouncer "Closed" noise.
  base.$on("error", (e: any) => {
    const msg: string = e?.message ?? e?.target ?? "";
    if (msg.includes("Closed")) return;
    console.error("[prisma]", msg);
  });
  base.$on("warn", (e: any) => {
    console.warn("[prisma]", e?.message ?? e);
  });

  return base.$extends({
    query: {
      $allOperations: async ({ model, operation, args, query }) => {
        let lastError: unknown;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            return await query(args);
          } catch (error: any) {
            lastError = error;
            const code: string | undefined = error?.code;

            if (attempt < MAX_RETRIES && code && RETRY_CODES.has(code)) {
              const label = model ? `${model}.${operation}` : operation;
              console.warn(
                `[prisma] Retrying ${label} (attempt ${attempt}/${MAX_RETRIES}) after ${code}`,
              );

              // Exponential backoff: 150ms, 300ms, 450ms
              await new Promise((r) => setTimeout(r, 150 * attempt));
              continue;
            }

            throw error;
          }
        }
        throw lastError;
      },
    },
  }) as unknown as PrismaClient;
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown — disconnect on process exit so Neon doesn't hold
// idle connections after the process terminates.
if (typeof process !== "undefined") {
  const cleanup = async () => {
    if (globalForPrisma.prisma) {
      await globalForPrisma.prisma.$disconnect();
    }
  };
  process.once("SIGTERM", cleanup);
  process.once("SIGINT", cleanup);
}
