import { Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ErrorResponseSchema } from "../../schemas/error.schema.js";
import RestaurantService from "../../services/restaurants.service.js";
import {
  CreateRestaurantSchema,
  CreateRestaurantResponseSchema,
  type CreateRestaurantRequest,
  UpdateRestaurantSchema,
  UpdateRestaurantResponseSchema,
  getAllResturantsResponseSchema,
  type UpdateRestaurantRequest,
  RestaurantQuerySchema,
  PaginatedRestaurantsResponseSchema,
  type RestaurantQuery,
} from "../../schemas/restaurants.schema.js";

export const RestaurantsRoutes = async (app: FastifyInstance) => {
  const restaurantService = new RestaurantService(app.prisma);

  app.get<{ Querystring: RestaurantQuery }>(
    "/",
    {
      schema: {
        description:
          "List all restaurants with optional pagination and cuisine filter",
        querystring: RestaurantQuerySchema,
        response: {
          200: PaginatedRestaurantsResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: RestaurantQuery }>,
      reply: FastifyReply,
    ) => {
      const limit = request.query.limit ?? 20;
      const offset = request.query.offset ?? 0;
      const restaurants = await restaurantService.getAllRestaurants({
        limit,
        offset,
        cuisine: request.query.cuisine,
      });
      return reply.status(200).send(restaurants);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/mine",
    {
      schema: {
        description: "Get all restaurants owned by the authenticated user",
        response: {
          200: getAllResturantsResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize(["RESTAURANT"])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const restaurants = await restaurantService.getMyRestaurants(
        request.user.id,
      );
      return reply.status(200).send(restaurants);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id",
    {
      schema: {
        description: "Get a restaurant by ID",
        params: Type.Object({
          id: Type.String({ description: "Restaurant ID" }),
        }),
        response: {
          200: CreateRestaurantResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const restaurant = await restaurantService.getRestaurantById(
        request.params.id,
      );
      if (!restaurant.restaurant) {
        return reply.status(404).send({ error: "Restaurant not found" });
      }
      return reply.status(200).send(restaurant);
    },
  );

  app.post<{ Body: CreateRestaurantRequest }>(
    "/",
    {
      schema: {
        description: "Create a new restaurant (ADMIN or RESTAURANT only)",
        body: CreateRestaurantSchema,
        response: {
          201: CreateRestaurantResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize(["ADMIN", "RESTAURANT"])],
    },
    async (
      request: FastifyRequest<{ Body: CreateRestaurantRequest }>,
      reply: FastifyReply,
    ) => {
      const restaurant = await restaurantService.createRestaurant(request.body);
      return reply.status(201).send(restaurant);
    },
  );

  app.patch<{ Body: UpdateRestaurantRequest; Params: { id: string } }>(
    "/:id",
    {
      schema: {
        description: "Update a restaurant (owner or ADMIN)",
        params: Type.Object({
          id: Type.String({ description: "Restaurant ID" }),
        }),
        body: UpdateRestaurantSchema,
        response: {
          200: UpdateRestaurantResponseSchema,
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
        Body: UpdateRestaurantRequest;
        Params: { id: string };
      }>,
      reply: FastifyReply,
    ) => {
      const restaurant = await restaurantService.updateRestaurant(
        request.params.id,
        request.user.id,
        request.body,
        request.user,
      );
      return reply.status(200).send({ restaurant });
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/:id",
    {
      schema: {
        description: "Delete a restaurant (owner or ADMIN)",
        params: Type.Object({
          id: Type.String({ description: "Restaurant ID" }),
        }),
        response: {
          204: Type.Null(),
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
      onRequest: [app.authorize(["RESTAURANT", "ADMIN"])],
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      await restaurantService.deleteRestaurant(request.params.id, request.user);
      return reply.status(204).send();
    },
  );
};
