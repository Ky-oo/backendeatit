import { Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import AuthService from "../../services/auth.service.js";
import {
  LoginSchema,
  RefreshTokenSchema,
  RegisterSchema,
  TokenResponseSchema,
  UserResponseSchema,
  AuthMeResponseSchema,
} from "../../schemas/auth.schema.js";
import { ErrorResponseSchema } from "../../schemas/error.schema.js";

export const authRoutes = async (app: FastifyInstance) => {
  const authService = new AuthService(app.prisma);
  app.post(
    "/register",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
      schema: {
        description: "Register a new user account",
        body: RegisterSchema,
        response: {
          201: UserResponseSchema,
          400: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await authService.register(request.body as any);
      app.log.info(
        { userRegisterResponse: user },
        "Register response structure",
      );
      return reply.status(201).send({ data: user.data });
    },
  );

  app.post(
    "/login",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
      schema: {
        description: "Login and receive JWT access + refresh tokens",
        body: LoginSchema,
        response: {
          200: TokenResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as any;
      const user = await authService.login(body);
      const token = app.jwt.sign({ id: user.data.id }, { expiresIn: "15m" });
      const refreshToken = await authService.createRefreshToken(user.data.id);
      return reply.status(200).send({ data: { token, refreshToken } });
    },
  );

  app.post(
    "/refresh",
    {
      schema: {
        description: "Rotate refresh token and get a new access token",
        body: RefreshTokenSchema,
        response: {
          200: TokenResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as any;
      const user = await authService.rotateRefreshToken(body.refreshToken);
      const token = app.jwt.sign({ id: user.data.id }, { expiresIn: "15m" });
      return reply
        .status(200)
        .send({ data: { token, refreshToken: user.refreshToken } });
    },
  );

  app.get(
    "/me",
    {
      schema: {
        description: "Get the currently authenticated user (from JWT)",
        response: {
          200: AuthMeResponseSchema,
          401: ErrorResponseSchema,
        },
      },
      onRequest: [app.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(200).send({ data: request.user });
    },
  );
};
