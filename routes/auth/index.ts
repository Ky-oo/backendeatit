import { Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import AuthService from "../../services/auth.service.js";
import {
  LoginSchema,
  RegisterSchema,
  TokenResponseSchema,
  type LoginRequest,
  type RegisterRequest,
} from "../../schemas/auth.schema.js";
import { ErrorResponseSchema } from "../../schemas/error.schema.js";
import { User } from "../../generated/prisma/client.js";

export const authRoutes = async (app: FastifyInstance) => {
  const authService = new AuthService(app.prisma);
  const { register, login } = authService;
  app.post<{ Body: RegisterRequest }>(
    "/register",
    {
      schema: {
        body: RegisterSchema,
        response: {
          201: TokenResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: RegisterRequest }>,
      reply: FastifyReply,
    ) => {
      const user = await register(request.body);
      console.log("User created:", user);
      const token = app.jwt.sign({ id: user.id });
      return reply.status(201).send({ token });
    },
  );

  app.post<{ Body: LoginRequest }>(
    "/login",
    {
      schema: {
        body: LoginSchema,
        response: {
          200: TokenResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: LoginRequest }>,
      reply: FastifyReply,
    ) => {
      const user = await login(request.body);
      const token = app.jwt.sign({ id: user.id });
      return reply.status(200).send({ token });
    },
  );

  app.get(
    "/me",
    {
      schema: {
        response: {
          200: Type.Unsafe<Omit<User, "password">>(),
          401: ErrorResponseSchema,
        },
      },
      onRequest: [app.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return request.user;
    },
  );
};
