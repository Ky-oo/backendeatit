import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to initialize Prisma");
}

const adapterUrl = databaseUrl.trim().replace(/^mysql:\/\//, "mariadb://");
const adapter = new PrismaMariaDb(adapterUrl);
export const prisma = new PrismaClient({ adapter });
