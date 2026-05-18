import fastify, { FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import "./plugins/dotenvx.js";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { registerPlugins } from "./plugins/index.js";
import { registerRoutes } from "./routes/index.js";
import { registerGraphQL } from "./graphql/index.js";
import { AppError } from "./common/exceptions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = fastify({
  logger: true,
});

server.get("/health", async () => {
  return { status: "ok" };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const host = "0.0.0.0";

    await server.register(cors, {});

    await server.register(rateLimit, {
      global: true,
      max: 100,
      timeWindow: "1 minute",
      errorResponseBuilder: (_request, context) => ({
        statusCode: 429,
        error: "Too Many Requests",
        message: `Rate limit exceeded, retry in ${context.after}`,
      }),
    });

    await server.register(swagger, {
      openapi: {
        openapi: "3.0.0",
        info: {
          title: "EatIt API",
          description: "API REST pour la plateforme de livraison EatIt",
          version: "1.0.0",
        },
        servers: [{ url: "http://localhost:3000" }],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
    });

    await server.register(swaggerUi, {
      routePrefix: "/docs",
      uiConfig: {
        docExpansion: "list",
        deepLinking: true,
      },
    });

    await registerPlugins(server);
    await registerGraphQL(server);
    await registerRoutes(server);

    await server.ready();

    await server.listen({ port, host });
    server.log.info(`Server running on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
