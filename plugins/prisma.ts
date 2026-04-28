import fp from "fastify-plugin";
import { PrismaClient } from "../generated/prisma/client.js";
import type { FastifyInstance } from "fastify";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { prisma } from "./prismaInstance.js";

export const prismaPlugin = fp(async (app: FastifyInstance) => {
  app.decorate("prisma", prisma);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
});
