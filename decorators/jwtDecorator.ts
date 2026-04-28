import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import { UnauthorizedError, ForbiddenError } from "../common/exceptions.js";

export default fp(async function (fastify: FastifyInstance, options = {}) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is required");
  }

  await fastify.register(fastifyJwt, {
    secret: jwtSecret,
  });

  fastify.decorate(
    "authenticate",
    async (req: FastifyRequest, res: FastifyReply) => {
      try {
        const payload = await req.jwtVerify<{
          id: string;
        }>();

        const foundUser = await fastify.prisma.user.findUnique({
          where: {
            id: payload.id,
          },
          omit: {
            password: true,
          },
        });

        if (!foundUser) {
          throw new UnauthorizedError("Utilisateur non trouvé");
        }

        req.user = foundUser;
      } catch (err) {
        throw new UnauthorizedError();
      }
    },
  );

  fastify.decorate("authorize", (allowedRoles: string[]) => {
    return async (req: FastifyRequest, res: FastifyReply) => {
      await fastify.authenticate(req, res);

      if (!allowedRoles.includes(req.user.role) && req.user.role !== "ADMIN") {
        throw new ForbiddenError("No Allowed.");
      }
    };
  });
});
