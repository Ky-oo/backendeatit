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

  app.post<{ Body: CreateOrderRequest }>(
    "/",
    {
      schema: {
        body: CreateOrderSchema,
        response: {
          201: CreateOrderResponseSchema,
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
        body: UpdateOrderSchema,
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
        response: {
          204: Type.Null(),
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
      await orderService.deleteOrder(request.params.id, request.user);
      return reply.status(204).send();
    },
  );
};
