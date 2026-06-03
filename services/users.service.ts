import type { PrismaClient } from "../generated/prisma/client.js";
import { hash } from "bcryptjs";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../common/exceptions.js";
import type { UserProfile } from "../schemas/users.schema.js";

type UpdateUserInput = {
  email?: string;
  password?: string;
  firstname?: string;
  lastname?: string;
  picture?: string;
  phoneNumber?: string;
  city?: string;
  cp?: string;
  address?: string;
  details?: string;
};

export default class UserService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  getProfile = async (id: string): Promise<UserProfile> => {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return {
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstname: user.firstname,
        lastname: user.lastname,
        picture: user.picture ?? undefined,
        phoneNumber: user.phoneNumber ?? undefined,
        city: user.city,
        cp: user.cp,
        address: user.address,
        details: user.details ?? undefined,
      },
    };
  };

  updateUser = async (
    id: string,
    requesterId: string,
    input: UpdateUserInput,
  ): Promise<UserProfile> => {
    if (id !== requesterId) {
      throw new ForbiddenError("You can only update your own profile");
    }

    if (input.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existing && existing.id !== id) {
        throw new ConflictError("Email already in use");
      }
    }

    const { password, ...rest } = input;
    const data: UpdateUserInput = { ...rest };
    if (password) {
      data.password = await hash(password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    return {
      data: {
        id: updated.id,
        email: updated.email,
        role: updated.role,
        firstname: updated.firstname,
        lastname: updated.lastname,
        picture: updated.picture ?? undefined,
        phoneNumber: updated.phoneNumber ?? undefined,
        city: updated.city,
        cp: updated.cp,
        address: updated.address,
        details: updated.details ?? undefined,
      },
    };
  };

  deleteUser = async (id: string, requesterId: string): Promise<void> => {
    if (id !== requesterId) {
      throw new ForbiddenError("You can only delete your own profile");
    }

    await this.prisma.$transaction(async (tx) => {
      // Récupérer les IDs des restaurants du user
      const restaurants = await tx.restaurant.findMany({
        where: { userId: id },
        select: { id: true },
      });
      const restaurantIds = restaurants.map((r) => r.id);

      // Récupérer les IDs de toutes les commandes concernées (du user + de ses restos)
      const orders = await tx.order.findMany({
        where: {
          OR: [{ userId: id }, { restaurantId: { in: restaurantIds } }],
        },
        select: { id: true },
      });
      const orderIds = orders.map((o) => o.id);

      // 1. Supprimer les OrderItems liés à ces commandes ou aux plats des restos
      await tx.orderItem.deleteMany({
        where: {
          OR: [
            { orderId: { in: orderIds } },
            { dish: { restaurantId: { in: restaurantIds } } },
          ],
        },
      });

      // 2. Supprimer les commandes du user et de ses restos
      await tx.order.deleteMany({
        where: { id: { in: orderIds } },
      });

      // 3. Supprimer les plats des restos du user
      await tx.dish.deleteMany({
        where: { restaurantId: { in: restaurantIds } },
      });

      // 4. Supprimer les restaurants du user
      await tx.restaurant.deleteMany({
        where: { userId: id },
      });

      // 5. Supprimer le user
      await tx.user.delete({ where: { id } });
    });
  };
}
