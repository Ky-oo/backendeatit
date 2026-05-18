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
  DishQuerySchema,
  PaginatedDishesResponseSchema,
  type DishQuery,
} from "../../schemas/dishes.schema.js";

export const dishesRoutes = async (app: FastifyInstance) => {
  const dishService = new DishService(app.prisma);

  app.post<{ Body: CreateDishRequest }>(
    "/",
    {
      schema: {
        description: "Create a new dish for a restaurant (RESTAURANT only)",
        body: CreateDishSchema,
        response: {
          201: CreateDishResponseSchema,
          400: ErrorResponseSchema,
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
      const result = await dishService.createDish(request.body, request.user);
      return reply.status(201).send(result);
    },
  );

  app.get<{ Params: { restaurantId: string }; Querystring: DishQuery }>(
    "/restaurant/:restaurantId",
    {
      schema: {
        description:
          "List dishes for a restaurant with optional price filters and pagination",
        params: Type.Object({
          restaurantId: Type.String({ description: "Restaurant ID" }),
        }),
        querystring: DishQuerySchema,
        response: {
          200: PaginatedDishesResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { restaurantId: string };
        Querystring: DishQuery;
      }>,
      reply: FastifyReply,
    ) => {
      const limit = request.query.limit ?? 20;
      const offset = request.query.offset ?? 0;
      const result = await dishService.getDishesByRestaurant(
        request.params.restaurantId,
        {
          limit,
          offset,
          minPrice: request.query.minPrice,
          maxPrice: request.query.maxPrice,
        },
      );
      return reply.status(200).send(result);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id",
    {
      schema: {
        description: "Get a dish by ID",
        params: Type.Object({ id: Type.String({ description: "Dish ID" }) }),
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
        description: "Update a dish (owner or ADMIN)",
        params: Type.Object({ id: Type.String({ description: "Dish ID" }) }),
        body: UpdateDishSchema,
        response: {
          200: UpdateDishResponseSchema,
          400: ErrorResponseSchema,
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
        request.user,
      );
      return reply.status(200).send(result);
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/:id",
    {
      schema: {
        description: "Delete a dish (owner or ADMIN)",
        params: Type.Object({ id: Type.String({ description: "Dish ID" }) }),
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
      await dishService.deleteDish(request.params.id, request.user);
      return reply.status(204).send();
    },
  );
};
