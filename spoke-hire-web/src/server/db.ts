import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

import { env } from "~/env";

const createPrismaClient = () => {
  if (!env.DATABASE_URL) {
    // Return a mock client when no database URL is provided
    return {} as ReturnType<typeof createAcceleratedClient>;
  }
  
  return createAcceleratedClient();
};

function createAcceleratedClient() {
  const prisma = new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
  
  // Always extend with Accelerate (it's a no-op for direct connections)
  // But it provides the cacheStrategy types
  return prisma.$extends(withAccelerate());
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createAcceleratedClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
