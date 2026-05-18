import type { IResolvers, MercuriusContext } from "mercurius";
import type { FastifyInstance } from "fastify";
import { NotFoundError, UnauthorizedError } from "../common/exceptions.js";

declare module "mercurius" {
  interface MercuriusContext {
    auth: { id: string } | null;
  }
}

export const createRestaurantResolvers = (
  app: FastifyInstance,
): IResolvers => ({
  Query: {
    restaurants: async () => {
      const restaurants = await app.prisma.restaurant.findMany();
      return restaurants;
    },

    restaurant: async (_parent, { id }: { id: string }) => {
      const restaurant = await app.prisma.restaurant.findUnique({
        where: { id },
      });
      if (!restaurant) {
        throw new NotFoundError(`Restaurant ${id} not found`);
      }
      return restaurant;
    },

    restaurantDishes: async (
      _parent,
      { restaurantId }: { restaurantId: string },
    ) => {
      const restaurant = await app.prisma.restaurant.findUnique({
        where: { id: restaurantId },
      });
      if (!restaurant) {
        throw new NotFoundError(`Restaurant ${restaurantId} not found`);
      }
      return app.prisma.dish.findMany({ where: { restaurantId } });
    },

    dishes: async () => {
      return app.prisma.dish.findMany();
    },

    orders: async (_parent, _args, context) => {
      const userId = context.auth?.id;
      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }
      return app.prisma.order.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { date: "desc" },
      });
    },

    me: async (_parent, _args, context) => {
      const userId = context.auth?.id;
      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }
      return app.prisma.user.findUnique({ where: { id: userId } });
    },
  },

  Restaurant: {
    dishes: async (parent: { id: string }) => {
      return app.prisma.dish.findMany({
        where: { restaurantId: parent.id },
      });
    },
  },
});
