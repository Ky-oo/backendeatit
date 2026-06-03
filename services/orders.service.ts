import type { PrismaClient } from "../generated/prisma/client.js";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../common/exceptions.js";
import { notifyRestaurant, notifyUser } from "./websocket.service.js";
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

type GetOrdersInput = {
  limit: number;
  offset: number;
  status?: OrderStatus;
};

const orderInclude = {
  items: {
    include: {
      dish: true,
    },
  },
  user: {
    select: {
      id: true,
      email: true,
      firstname: true,
      lastname: true,
      picture: true,
    },
  },
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
      include: orderInclude,
    });

    notifyRestaurant(input.restaurantId, "new-order", {
      orderId: order.id,
      totalPrice: order.total,
      itemCount: order.items.length,
      createdAt: order.createdAt,
    });
    notifyUser(input.userId, "order-created", order);

    return { data: order };
  };

  getUserOrders = async (userId: string, input?: GetOrdersInput) => {
    const limit = input?.limit ?? 20;
    const offset = input?.offset ?? 0;
    const where = {
      userId,
      ...(input?.status ? { status: input.status } : {}),
    };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { date: "desc" },
        skip: offset,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      pagination: { total, limit, offset },
    };
  };

  getOrderById = async (id: string, actor: Actor) => {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { ...orderInclude, restaurant: true },
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

    return { data: order };
  };

  getRestaurantOwnerOrders = async (ownerId: string) => {
    const orders = await this.prisma.order.findMany({
      where: {
        restaurant: {
          userId: ownerId,
        },
      },
      include: orderInclude,
      orderBy: { date: "desc" },
    });

    return { data: orders };
  };

  getRestaurantOrders = async (restaurantId: string, actor: Actor) => {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    const isRestaurantOwner = restaurant.userId === actor.id;
    const isAdmin = actor.role === "ADMIN";

    if (!isRestaurantOwner && !isAdmin) {
      throw new ForbiddenError("You do not have access to this restaurant");
    }

    const orders = await this.prisma.order.findMany({
      where: { restaurantId },
      include: orderInclude,
      orderBy: { date: "desc" },
    });

    return { data: orders };
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

    if (order.status === input.status) {
      const currentOrder = await this.prisma.order.findUnique({
        where: { id },
        include: orderInclude,
      });

      if (!currentOrder) {
        throw new NotFoundError("Order not found");
      }

      notifyRestaurant(order.restaurantId, "order-updated", currentOrder);
      notifyUser(currentOrder.userId, "order-updated", currentOrder);

      return { data: currentOrder };
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
      include: orderInclude,
    });

    notifyRestaurant(order.restaurantId, "order-updated", updated);
    notifyUser(updated.userId, "order-updated", updated);

    return { data: updated };
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

    await this.prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    const payload = { orderId: id };
    notifyRestaurant(order.restaurantId, "order-cancelled", payload);
    notifyUser(order.userId, "order-cancelled", payload);
  };
}
