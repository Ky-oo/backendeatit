import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ErrorResponseSchema } from "../../schemas/error.schema.js";
import OrderService from "../../services/orders.service.js";
import {
  CreateOrderSchema,
  CreateOrderResponseSchema,
  type CreateOrderRequest,
} from "../../schemas/orders.schema.js";

export const ordersRoutes = async (app: FastifyInstance) => {
  const orderService = new OrderService(app.prisma);

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
};
