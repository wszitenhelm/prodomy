import { PrismaClient } from "@prisma/client";

import { env } from "@/shared/env";

declare global {
  var __prisma__: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient();
}

export const prisma: PrismaClient = globalThis.__prisma__ ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalThis.__prisma__ = prisma;
}
