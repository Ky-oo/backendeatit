import type { IResolvers, MercuriusContext } from "mercurius";
import type { FastifyInstance } from "fastify";
import { NotFoundError, UnauthorizedError } from "../common/exceptions.js";
import DishService from "../services/dishes.service.js";
import OrderService from "../services/orders.service.js";
import RestaurantService from "../services/restaurants.service.js";
import UserService from "../services/users.service.js";

declare module "mercurius" {
  interface MercuriusContext {
    auth: { id: string } | null;
  }
}

export const createRestaurantResolvers = (
  app: FastifyInstance,
): IResolvers => {
  const dishService = new DishService(app.prisma);
  const orderService = new OrderService(app.prisma);
  const restaurantService = new RestaurantService(app.prisma);
  const userService = new UserService(app.prisma);

  return {
    Query: {
      restaurants: async () => {
        const { data } = await restaurantService.getAllRestaurants({
          limit: 100,
          offset: 0,
        });
        return data;
      },

      restaurant: async (_parent, { id }: { id: string }) => {
        const { data } = await restaurantService.getRestaurantById(id);
        if (!data) {
          throw new NotFoundError(`Restaurant ${id} not found`);
        }
        return data;
      },

      restaurantDishes: async (
        _parent,
        { restaurantId }: { restaurantId: string },
      ) => {
        const { data } = await dishService.getDishesByRestaurant(restaurantId, {
          limit: 100,
          offset: 0,
        });
        return data;
      },

      dishes: async () => {
        const { data } = await dishService.getAllDishes({
          limit: 100,
          offset: 0,
        });
        return data;
      },

      orders: async (_parent, _args, context) => {
        const userId = context.auth?.id;
        if (!userId) {
          throw new UnauthorizedError("Authentication required");
        }
        const { data } = await orderService.getUserOrders(userId, {
          limit: 100,
          offset: 0,
        });
        return data;
      },

      me: async (_parent, _args, context) => {
        const userId = context.auth?.id;
        if (!userId) {
          throw new UnauthorizedError("Authentication required");
        }
        const { data } = await userService.getProfile(userId);
        return data;
      },
    },

    Restaurant: {
      dishes: async (parent: { id: string }) => {
        const { data } = await dishService.getDishesByRestaurant(parent.id, {
          limit: 100,
          offset: 0,
        });
        return data;
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
      const { data } = await dishService.createDish(input, user);
      return data;
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
      const { data } = await dishService.updateDish(id, input, user);
      return data;
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
      const { data } = await orderService.createOrder({
        userId,
        restaurantId: input.restaurantId,
        items: input.items,
      });
      return data;
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
      const { data } = await orderService.updateOrder(
        id,
        { status: status as "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED" },
        user,
      );
      return data;
    },
    },
  };
};
