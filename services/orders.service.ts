import type { PrismaClient } from "../generated/prisma/client.js";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../common/exceptions.js";
import { notifyRestaurant } from "./websocket.service.js";
import type { OrderItemInput, OrderStatus } from "../schemas/orders.schema.js";

type CreateOrderInput = {
  userId: string;
  restaurantId: string;
  items: OrderItemInput[];
};

type Actor = {
  id: string;
  role: string;
};

type UpdateOrderInput = {
  status: "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED";
};

/** Valid one-step forward transitions */
const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "DELIVERED",
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
      where: { id: { in: dishIds }, restaurantId: input.restaurantId },
    });

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

  getUserOrders = async (userId: string) => {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { date: "desc" },
    });

    return { orders };
  };

  getOrderById = async (id: string, actor: Actor) => {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, restaurant: true },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // USER: only their own orders — RESTAURANT: only orders for their restaurants
    const isCustomer = order.userId === actor.id;
    const isRestaurantOwner = order.restaurant.userId === actor.id;
    const isAdmin = actor.role === "ADMIN";

    if (!isCustomer && !isRestaurantOwner && !isAdmin) {
      throw new ForbiddenError("You do not have access to this order");
    }

    return { order };
  };

  getRestaurantOwnerOrders = async (ownerId: string) => {
    const orders = await this.prisma.order.findMany({
      where: {
        restaurant: {
          userId: ownerId,
        },
      },
      include: { items: true },
      orderBy: { date: "desc" },
    });

    return { orders };
  };

  updateOrder = async (id: string, input: UpdateOrderInput, actor: Actor) => {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Only the restaurant owner or an admin can change order status
    const isRestaurantOwner = order.restaurant.userId === actor.id;
    const isAdmin = actor.role === "ADMIN";
    if (!isRestaurantOwner && !isAdmin) {
      throw new ForbiddenError(
        "Only the restaurant owner can update order status",
      );
    }

    // Validate transition: must follow PENDING→CONFIRMED→PREPARING→READY→DELIVERED
    const expectedNext = VALID_TRANSITIONS[order.status as OrderStatus];
    if (!expectedNext || expectedNext !== input.status) {
      throw new ConflictError(
        `Invalid transition: ${order.status} → ${input.status}. Expected next status: ${expectedNext ?? "none (order is delivered)"}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: input.status },
      include: { items: true },
    });

    return { order: updated };
  };

  deleteOrder = async (id: string, actor: Actor): Promise<void> => {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Only the customer who placed the order (or admin) can cancel it
    const isCustomerOwner = order.userId === actor.id;
    const isAdmin = actor.role === "ADMIN";
    if (!isCustomerOwner && !isAdmin) {
      throw new ForbiddenError("Only the customer can cancel their own order");
    }

    // Can only cancel while still pending
    if (order.status !== "PENDING") {
      throw new ConflictError(
        `Order cannot be cancelled: current status is ${order.status}`,
      );
    }

    await this.prisma.order.delete({ where: { id } });
  };
}
