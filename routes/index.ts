import type { FastifyInstance } from "fastify";
import { authRoutes } from "./auth/index.js";
import { RestaurantsRoutes } from "./restaurants/index.js";
import { dishesRoutes } from "./dishes/index.js";
import { usersRoutes } from "./users/me.js";
import { ordersRoutes } from "./orders/index.js";
import { websocketRoutes } from "./websocket.js";

export const registerRoutes = async (app: FastifyInstance) => {
  await app.register(websocketRoutes);

  await app.register(
    async (fastify) => {
      await fastify.register(authRoutes, { prefix: "/auth" });
      await fastify.register(RestaurantsRoutes, { prefix: "/restaurants" });
      await fastify.register(dishesRoutes, { prefix: "/dishes" });
      await fastify.register(usersRoutes, { prefix: "/users" });
      await fastify.register(ordersRoutes, { prefix: "/orders" });
    },
    { prefix: "/api" },
  );
};
