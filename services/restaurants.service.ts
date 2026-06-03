import type { PrismaClient } from "../generated/prisma/client.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../common/exceptions.js";
import { Restaurant } from "../generated/prisma/client.js";

type CreateRestaurantInput = {
  cuisine: string;
  deliveryFee: number;
  deliveryTime: string;
  description: string;
  distance: number;
  image: string;
  name: string;
  rating: number;
  userId: string;
};

type CreateRestaurantResponse = {
  data: Restaurant;
};

type GetAllRestaurantsInput = {
  limit: number;
  offset: number;
  cuisine?: string;
};

type GetRestaurantByIdResponse = {
  data: Restaurant | null;
};

type GetMyRestaurantResponse = {
  data: Restaurant[];
};

export default class RestaurantService {
  private prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  createRestaurant = async (
    input: CreateRestaurantInput,
  ): Promise<CreateRestaurantResponse> => {
    const existingRestaurant = await this.prisma.restaurant.findUnique({
      where: {
        name: input.name,
      },
    });

    if (existingRestaurant) {
      throw new ConflictError("Restaurant name already in use");
    }

    const newRestaurant = await this.prisma.restaurant.create({
      data: {
        cuisine: input.cuisine,
        deliveryFee: input.deliveryFee,
        deliveryTime: input.deliveryTime.toString(),
        description: input.description,
        distance: input.distance,
        image: input.image,
        name: input.name,
        rating: input.rating,
        userId: input.userId,
      },
    });
    return {
      data: {
        id: newRestaurant.id,
        cuisine: newRestaurant.cuisine,
        deliveryFee: newRestaurant.deliveryFee,
        deliveryTime: newRestaurant.deliveryTime,
        description: newRestaurant.description,
        distance: newRestaurant.distance,
        image: newRestaurant.image,
        name: newRestaurant.name,
        rating: newRestaurant.rating,
        userId: newRestaurant.userId,
        createdAt: newRestaurant.createdAt,
        updatedAt: newRestaurant.updatedAt,
      },
    };
  };

  getAllRestaurants = async (
    input: GetAllRestaurantsInput,
  ): Promise<{
    data: Restaurant[];
    pagination: { total: number; limit: number; offset: number };
  }> => {
    const where = input.cuisine ? { cuisine: input.cuisine } : {};
    const [restaurants, total] = await this.prisma.$transaction([
      this.prisma.restaurant.findMany({
        where,
        skip: input.offset,
        take: input.limit,
      }),
      this.prisma.restaurant.count({ where }),
    ]);
    return {
      data: restaurants,
      pagination: { total, limit: input.limit, offset: input.offset },
    };
  };

  getRestaurantById = async (
    id: string,
  ): Promise<GetRestaurantByIdResponse> => {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: {
        id,
      },
    });
    return {
      data: restaurant,
    };
  };

  getMyRestaurants = async (
    userId: string,
  ): Promise<GetMyRestaurantResponse> => {
    const restaurants = await this.prisma.restaurant.findMany({
      where: {
        userId,
      },
    });
    return {
      data: restaurants,
    };
  };

  updateRestaurant = async (
    id: string,
    userId: string,
    updateData: Partial<CreateRestaurantInput>,
    user: { id: string; role: string },
  ): Promise<Restaurant> => {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: {
        id,
      },
    });
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }
    if (restaurant.userId !== userId && user.role !== "ADMIN") {
      throw new ForbiddenError(
        "You are not authorized to update this restaurant",
      );
    }
    const data = { ...updateData };

    if (user.role !== "ADMIN") {
      delete data.userId;
    }

    const updatedRestaurant = await this.prisma.restaurant.update({
      where: {
        id,
      },
      data,
    });
    return updatedRestaurant;
  };

  deleteRestaurant = async (
    id: string,
    user: { id: string; role: string },
  ): Promise<void> => {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: {
        id,
      },
    });
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }
    if (restaurant.userId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenError(
        "You are not authorized to delete this restaurant",
      );
    }
    await this.prisma.restaurant.delete({
      where: {
        id,
      },
    });
  };
}
