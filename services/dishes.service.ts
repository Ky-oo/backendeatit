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

export default class DishService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  createDish = async (
    input: CreateDishInput,
    userId: string,
  ): Promise<{ dish: Dish }> => {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: input.restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    if (restaurant.userId !== userId) {
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
  ): Promise<{ dishes: Dish[] }> => {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    const dishes = await this.prisma.dish.findMany({
      where: { restaurantId },
    });

    return { dishes };
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
    userId: string,
  ): Promise<{ dish: Dish }> => {
    const dish = await this.prisma.dish.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!dish) {
      throw new NotFoundError("Dish not found");
    }

    if (dish.restaurant.userId !== userId) {
      throw new ForbiddenError("You are not the owner of this restaurant");
    }

    const updated = await this.prisma.dish.update({
      where: { id },
      data: updateData,
    });

    return { dish: updated };
  };

  deleteDish = async (id: string, userId: string): Promise<void> => {
    const dish = await this.prisma.dish.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!dish) {
      throw new NotFoundError("Dish not found");
    }

    if (dish.restaurant.userId !== userId) {
      throw new ForbiddenError("You are not the owner of this restaurant");
    }

    await this.prisma.dish.delete({ where: { id } });
  };
}
