import { Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ErrorResponseSchema } from "../../schemas/error.schema.js";
import UserService from "../../services/users.service.js";
import {
  UserProfileSchema,
  UpdateUserSchema,
  UpdateUserResponseSchema,
  type UpdateUserRequest,
} from "../../schemas/users.schema.js";

export const usersRoutes = async (app: FastifyInstance) => {
  const userService = new UserService(app.prisma);

  app.get(
    "/me",
    {
      schema: {
        response: {
          200: UserProfileSchema,
          401: ErrorResponseSchema,
        },
      },
      onRequest: [app.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(200).send(request.user);
    },
  );

  app.patch<{ Body: UpdateUserRequest }>(
    "/me",
    {
      schema: {
        body: UpdateUserSchema,
        response: {
          200: UpdateUserResponseSchema,
          401: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
      onRequest: [app.authenticate],
    },
    async (
      request: FastifyRequest<{ Body: UpdateUserRequest }>,
      reply: FastifyReply,
    ) => {
      const result = await userService.updateUser(
        request.user.id,
        request.body,
      );
      return reply.status(200).send(result);
    },
  );

  app.delete(
    "/me",
    {
      schema: {
        response: {
          204: Type.Null(),
          401: ErrorResponseSchema,
        },
      },
      onRequest: [app.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await userService.deleteUser(request.user.id);
      return reply.status(204).send();
    },
  );
};
