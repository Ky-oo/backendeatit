import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ErrorResponseSchema } from "../../schemas/error.schema.js";
import OrderService from "../../services/orders.service.js";
import {
  CreateOrderSchema,
  CreateOrderResponseSchema,
  GetOrdersResponseSchema,
  UpdateOrderSchema,
  type CreateOrderRequest,
  type UpdateOrderRequest,
} from "../../schemas/orders.schema.js";
import { Type } from "@sinclair/typebox";

export const ordersRoutes = async (app: FastifyInstance) => {
  const orderService = new OrderService(app.prisma);

  app.get(
    "/mine",
    {
      schema: {
        description: "Get all orders of the authenticated user",
        response: {
          200: GetOrdersResponseSchema,
          401: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize(["USER"])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const result = await orderService.getUserOrders(request.user.id);
      return reply.status(200).send(result);
    },
  );

  app.get(
    "/restaurant",
    {
      schema: {
        description:
          "Get all orders for restaurants owned by the authenticated user",
        response: {
          200: GetOrdersResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize(["RESTAURANT"])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const result = await orderService.getRestaurantOwnerOrders(
        request.user.id,
      );
      return reply.status(200).send(result);
    },
  );

  app.get<{ Params: { restaurantId: string } }>(
    "/restaurant/:restaurantId",
    {
      schema: {
        description:
          "Get all orders for a single restaurant owned by the authenticated user",
        params: Type.Object({
          restaurantId: Type.String({ description: "Restaurant ID" }),
        }),
        response: {
          200: GetOrdersResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize(["RESTAURANT"])],
    },
    async (
      request: FastifyRequest<{ Params: { restaurantId: string } }>,
      reply: FastifyReply,
    ) => {
      const result = await orderService.getRestaurantOrders(
        request.params.restaurantId,
        request.user,
      );
      return reply.status(200).send(result);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id",
    {
      schema: {
        description:
          "Get a single order by ID (USER: own orders only — RESTAURANT: orders of their restaurants)",
        params: Type.Object({ id: Type.String({ description: "Order ID" }) }),
        response: {
          200: CreateOrderResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
      onRequest: [app.authenticate],
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const result = await orderService.getOrderById(
        request.params.id,
        request.user,
      );
      return reply.status(200).send(result);
    },
  );

  app.post<{ Body: CreateOrderRequest }>(
    "/",
    {
      schema: {
        description: "Create a new order",
        body: CreateOrderSchema,
        response: {
          201: CreateOrderResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
      onRequest: [app.authenticate],
    },
    async (
      request: FastifyRequest<{ Body: CreateOrderRequest }>,
      reply: FastifyReply,
    ) => {
      const result = await orderService.createOrder({
        userId: request.user.id,
        restaurantId: request.body.restaurantId,
        items: request.body.items,
      });
      return reply.status(201).send(result);
    },
  );

  app.patch<{ Body: UpdateOrderRequest; Params: { id: string } }>(
    "/:id",
    {
      schema: {
        description: "Update order status",
        params: Type.Object({ id: Type.String({ description: "Order ID" }) }),
        body: UpdateOrderSchema,
        response: {
          200: CreateOrderResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
      onRequest: [app.authenticate],
    },
    async (
      request: FastifyRequest<{
        Body: UpdateOrderRequest;
        Params: { id: string };
      }>,
      reply: FastifyReply,
    ) => {
      const result = await orderService.updateOrder(
        request.params.id,
        request.body,
        request.user,
      );
      return reply.status(200).send(result);
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/:id",
    {
      schema: {
        description: "Cancel an order (only if status is PENDING)",
        params: Type.Object({ id: Type.String({ description: "Order ID" }) }),
        response: {
          204: Type.Null(),
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
      onRequest: [app.authenticate],
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      await orderService.deleteOrder(request.params.id, request.user);
      return reply.status(204).send();
    },
  );
};
