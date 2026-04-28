import "../../plugins/dotenvx.js";
import fastify, { FastifyInstance } from "fastify";
import { registerPlugins } from "../../plugins/index.js";
import { registerRoutes } from "../../routes/index.js";
import { prisma } from "../../plugins/prismaInstance.js";

export const createTestServer = async (): Promise<FastifyInstance> => {
  const app = fastify({ logger: false });

  await registerPlugins(app);
  await registerRoutes(app);
  await app.ready();

  return app;
};

export const closeTestServer = async (app: FastifyInstance): Promise<void> => {
  await app.close();
};

/** Nettoie toutes les tables dans le bon ordre (FK) */
export const cleanDatabase = async (): Promise<void> => {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();
};
