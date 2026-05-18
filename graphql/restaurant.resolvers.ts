import type { IResolvers, MercuriusContext } from "mercurius";
import type { FastifyInstance } from "fastify";
import { NotFoundError, UnauthorizedError } from "../common/exceptions.js";
import DishService from "../services/dishes.service.js";
import OrderService from "../services/orders.service.js";

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

  Mutation: {
    createDish: async (
      _parent,
      {
        input,
      }: {
        input: {
          restaurantId: string;
          name: string;
          description: string;
          price: number;
          image?: string;
        };
      },
      context,
    ) => {
      const userId = context.auth?.id;
      if (!userId) throw new UnauthorizedError("Authentication required");
      const user = await app.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });
      if (!user) throw new UnauthorizedError("User not found");
      const dishService = new DishService(app.prisma);
      const { dish } = await dishService.createDish(input, user);
      return dish;
    },

    updateDish: async (
      _parent,
      {
        id,
        input,
      }: {
        id: string;
        input: {
          name?: string;
          description?: string;
          price?: number;
          image?: string;
        };
      },
      context,
    ) => {
      const userId = context.auth?.id;
      if (!userId) throw new UnauthorizedError("Authentication required");
      const user = await app.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });
      if (!user) throw new UnauthorizedError("User not found");
      const dishService = new DishService(app.prisma);
      const { dish } = await dishService.updateDish(id, input, user);
      return dish;
    },

    createOrder: async (
      _parent,
      {
        input,
      }: {
        input: {
          restaurantId: string;
          items: { dishId: string; quantity: number }[];
        };
      },
      context,
    ) => {
      const userId = context.auth?.id;
      if (!userId) throw new UnauthorizedError("Authentication required");
      const orderService = new OrderService(app.prisma);
      const { order } = await orderService.createOrder({
        userId,
        restaurantId: input.restaurantId,
        items: input.items,
      });
      return order;
    },

    updateOrderStatus: async (
      _parent,
      { id, status }: { id: string; status: string },
      context,
    ) => {
      const userId = context.auth?.id;
      if (!userId) throw new UnauthorizedError("Authentication required");
      const user = await app.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });
      if (!user) throw new UnauthorizedError("User not found");
      const validStatuses = [
        "CONFIRMED",
        "PREPARING",
        "READY",
        "DELIVERED",
      ] as const;
      if (!validStatuses.includes(status as (typeof validStatuses)[number])) {
        throw new Error(`Invalid status. Allowed: ${validStatuses.join(", ")}`);
      }
      const orderService = new OrderService(app.prisma);
      const { order } = await orderService.updateOrder(
        id,
        { status: status as "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED" },
        user,
      );
      return order;
    },
  },
});
