import { Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import AuthService from "../../services/auth.service.js";
import {
  LoginSchema,
  RefreshTokenSchema,
  RegisterSchema,
  TokenResponseSchema,
  UserResponseSchema,
  type LoginRequest,
  type RefreshTokenRequest,
  type RegisterRequest,
} from "../../schemas/auth.schema.js";
import { ErrorResponseSchema } from "../../schemas/error.schema.js";
import { User } from "../../generated/prisma/client.js";

export const authRoutes = async (app: FastifyInstance) => {
  const authService = new AuthService(app.prisma);
  app.post<{ Body: RegisterRequest }>(
    "/register",
    {
      schema: {
        body: RegisterSchema,
        response: {
          201: UserResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: RegisterRequest }>,
      reply: FastifyReply,
    ) => {
      const user = await authService.register(request.body);
      return reply.status(201).send(user);
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
      app.log.info({ email: request.body.email }, "Login attempt");
      const user = await authService.login(request.body);
      const token = app.jwt.sign({ id: user.id }, { expiresIn: "1s" });
      const refreshToken = await authService.createRefreshToken(user.id);
      app.log.info("New access token generated for user:" + user);
      return reply.status(200).send({ token, refreshToken });
    },
  );

  app.post<{ Body: RefreshTokenRequest }>(
    "/refresh",
    {
      schema: {
        body: RefreshTokenSchema,
        response: {
          200: TokenResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: RefreshTokenRequest }>,
      reply: FastifyReply,
    ) => {
      const user = await authService.rotateRefreshToken(
        request.body.refreshToken,
      );
      const token = app.jwt.sign({ id: user.id }, { expiresIn: "1s" });
      return reply.status(200).send({
        token,
        refreshToken: user.refreshToken,
      });
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
