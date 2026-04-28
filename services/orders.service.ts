import type { PrismaClient } from "../generated/prisma/client.js";
import { NotFoundError } from "../common/exceptions.js";
import { notifyRestaurant } from "./websocket.service.js";
import type { OrderItemInput } from "../schemas/orders.schema.js";

type CreateOrderInput = {
  userId: string;
  restaurantId: string;
  items: OrderItemInput[];
};

export default class OrderService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  createOrder = async (input: CreateOrderInput) => {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: input.restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    const dishIds = input.items.map((i) => i.dishId);
    const dishes = await this.prisma.dish.findMany({
      where: { id: { in: dishIds } },
    });
    console.log(dishes);

    if (dishes.length !== dishIds.length) {
      throw new NotFoundError("One or more dishes not found");
    }

    const dishMap = new Map(dishes.map((d) => [d.id, d]));

    let total = 0;
    const orderItemsData = input.items.map((item) => {
      const dish = dishMap.get(item.dishId)!;
      const linePrice = dish.price * item.quantity;
      total += linePrice;
      return {
        dishId: item.dishId,
        quantity: item.quantity,
        price: linePrice,
      };
    });

    const order = await this.prisma.order.create({
      data: {
        userId: input.userId,
        restaurantId: input.restaurantId,
        date: new Date(),
        total,
        items: {
          create: orderItemsData,
        },
      },
      include: { items: true },
    });

    notifyRestaurant(input.restaurantId, "new-order", {
      orderId: order.id,
      totalPrice: order.total,
      itemCount: order.items.length,
      createdAt: order.date.toISOString(),
    });

    return { order };
  };
}
