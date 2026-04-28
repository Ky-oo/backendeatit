import type { IResolvers } from "mercurius";
import type { FastifyInstance } from "fastify";
import { NotFoundError } from "../common/exceptions.js";

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
  },

  Restaurant: {
    dishes: async (parent: { id: string }) => {
      return app.prisma.dish.findMany({
        where: { restaurantId: parent.id },
      });
    },
  },
});
