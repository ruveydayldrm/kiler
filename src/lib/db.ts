import "server-only";
import { PrismaClient } from "@prisma/client";

// Geliştirme ortamında HMR her seferinde yeni bağlantı açmasın diye global'de tutulur.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
