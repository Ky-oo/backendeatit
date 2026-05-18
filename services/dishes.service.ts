import type { PrismaClient, Dish } from "../generated/prisma/client.js";
import { NotFoundError, ForbiddenError } from "../common/exceptions.js";

type CreateDishInput = {
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
};

type UpdateDishInput = Partial<Omit<CreateDishInput, "restaurantId">>;
type GetDishesInput = {
  limit: number;
  offset: number;
  minPrice?: number;
  maxPrice?: number;
};
type Actor = {
  id: string;
  role: string;
};

export default class DishService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  createDish = async (
    input: CreateDishInput,
    actor: Actor,
  ): Promise<{ dish: Dish }> => {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: input.restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    if (restaurant.userId !== actor.id && actor.role !== "ADMIN") {
      throw new ForbiddenError("You are not the owner of this restaurant");
    }

    const dish = await this.prisma.dish.create({
      data: {
        restaurantId: input.restaurantId,
        name: input.name,
        description: input.description,
        price: input.price,
        image: input.image,
      },
    });

    return { dish };
  };

  getDishesByRestaurant = async (
    restaurantId: string,
    input: GetDishesInput,
  ): Promise<{
    data: Dish[];
    pagination: { total: number; limit: number; offset: number };
  }> => {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    const where: {
      restaurantId: string;
      price?: { gte?: number; lte?: number };
    } = { restaurantId };
    if (input.minPrice !== undefined || input.maxPrice !== undefined) {
      where.price = {};
      if (input.minPrice !== undefined) where.price.gte = input.minPrice;
      if (input.maxPrice !== undefined) where.price.lte = input.maxPrice;
    }

    const [dishes, total] = await this.prisma.$transaction([
      this.prisma.dish.findMany({
        where,
        skip: input.offset,
        take: input.limit,
      }),
      this.prisma.dish.count({ where }),
    ]);

    return {
      data: dishes,
      pagination: { total, limit: input.limit, offset: input.offset },
    };
  };

  getDishById = async (id: string): Promise<{ dish: Dish }> => {
    const dish = await this.prisma.dish.findUnique({
      where: { id },
    });

    if (!dish) {
      throw new NotFoundError("Dish not found");
    }

    return { dish };
  };

  updateDish = async (
    id: string,
    updateData: UpdateDishInput,
    actor: Actor,
  ): Promise<{ dish: Dish }> => {
    const dish = await this.prisma.dish.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!dish) {
      throw new NotFoundError("Dish not found");
    }

    if (dish.restaurant.userId !== actor.id && actor.role !== "ADMIN") {
      throw new ForbiddenError("You are not the owner of this restaurant");
    }

    const updated = await this.prisma.dish.update({
      where: { id },
      data: updateData,
    });

    return { dish: updated };
  };

  deleteDish = async (id: string, actor: Actor): Promise<void> => {
    const dish = await this.prisma.dish.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!dish) {
      throw new NotFoundError("Dish not found");
    }

    if (dish.restaurant.userId !== actor.id && actor.role !== "ADMIN") {
      throw new ForbiddenError("You are not the owner of this restaurant");
    }

    await this.prisma.dish.delete({ where: { id } });
  };
}
