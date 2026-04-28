import "fastify";
import { FastifyJwtNamespace } from "@fastify/jwt";
import { FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyInstance extends FastifyJwtNamespace<{
    jwtDecode: "securityJwtDecode";
    jwtSign: "securityJwtSign";
    jwtVerify: "securityJwtVerify";
  }> {
    authenticate: (req: FastifyRequest, res: FastifyReply) => Promise<void>;
    authorize: (
      allowedRoles: string[],
    ) => (req: FastifyRequest, res: FastifyReply) => Promise<void>;
    prisma: PrismaClient;
  }
}

import "@fastify/jwt";
import { PrismaClient } from "../generated/prisma/client.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: string };
    user: {
      id: string;
      email: string;
      role: string;
    };
  }
}
