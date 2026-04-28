import type { PrismaClient, User } from "../generated/prisma/client.js";
import { ConflictError, UnauthorizedError } from "../common/exceptions.js";
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
  restaurant: Restaurant;
};

type GetAllRestaurantResponse = {
  restaurants: Restaurant[];
};

type GetRestaurantByIdResponse = {
  restaurant: Restaurant | null;
};

type GetMyRestaurantResponse = {
  restaurants: Restaurant[];
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
      restaurant: {
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
      },
    };
  };

  getAllRestaurants = async (): Promise<GetAllRestaurantResponse> => {
    const restaurants = await this.prisma.restaurant.findMany();
    return {
      restaurants,
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
      restaurant,
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
      restaurants,
    };
  };

  updateRestaurant = async (
    id: string,
    userId: string,
    updateData: Partial<CreateRestaurantInput>,
    user: { role: string },
  ): Promise<Restaurant> => {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: {
        id,
      },
    });
    if (!restaurant) {
      throw new UnauthorizedError("Restaurant not found");
    }
    if (restaurant.userId !== userId && user.role !== "ADMIN") {
      throw new UnauthorizedError(
        "You are not authorized to update this restaurant",
      );
    }
    const updatedRestaurant = await this.prisma.restaurant.update({
      where: {
        id,
      },
      data: updateData,
    });
    return updatedRestaurant;
  };
}
