import { Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ErrorResponseSchema } from "../../schemas/error.schema.js";
import DishService from "../../services/dishes.service.js";
import {
  CreateDishSchema,
  CreateDishResponseSchema,
  type CreateDishRequest,
  UpdateDishSchema,
  UpdateDishResponseSchema,
  type UpdateDishRequest,
  DishListResponseSchema,
} from "../../schemas/dishes.schema.js";

export const dishesRoutes = async (app: FastifyInstance) => {
  const dishService = new DishService(app.prisma);

  app.post<{ Body: CreateDishRequest }>(
    "/",
    {
      schema: {
        body: CreateDishSchema,
        response: {
          201: CreateDishResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize(["RESTAURANT"])],
    },
    async (
      request: FastifyRequest<{ Body: CreateDishRequest }>,
      reply: FastifyReply,
    ) => {
      const result = await dishService.createDish(
        request.body,
        request.user.id,
      );
      return reply.status(201).send(result);
    },
  );

  app.get<{ Params: { restaurantId: string } }>(
    "/restaurant/:restaurantId",
    {
      schema: {
        response: {
          200: DishListResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { restaurantId: string } }>,
      reply: FastifyReply,
    ) => {
      const result = await dishService.getDishesByRestaurant(
        request.params.restaurantId,
      );
      return reply.status(200).send(result);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id",
    {
      schema: {
        response: {
          200: CreateDishResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const result = await dishService.getDishById(request.params.id);
      return reply.status(200).send(result);
    },
  );

  app.patch<{ Body: UpdateDishRequest; Params: { id: string } }>(
    "/:id",
    {
      schema: {
        body: UpdateDishSchema,
        response: {
          200: UpdateDishResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize(["RESTAURANT"])],
    },
    async (
      request: FastifyRequest<{
        Body: UpdateDishRequest;
        Params: { id: string };
      }>,
      reply: FastifyReply,
    ) => {
      const result = await dishService.updateDish(
        request.params.id,
        request.body,
        request.user.id,
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
      onRequest: [app.authorize(["RESTAURANT"])],
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      await dishService.deleteDish(request.params.id, request.user.id);
      return reply.status(204).send();
    },
  );
};
