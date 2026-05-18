import fastify, { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
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

server.setErrorHandler((error, request, reply) => {
  server.log.error({
    err: error,
    url: request.url,
    method: request.method,
  });

  if (error instanceof AppError) {
    const problemDetail = error.problemDetail;
    problemDetail.instance = request.url;
    return reply.status(error.statusCode).send(problemDetail);
  }

  const validationError = error as FastifyError;
  if (validationError.code === "FST_ERR_CTP_INVALID_JSON_BODY") {
    return reply.status(400).send({
      type: "urn:app:error:invalid-json",
      title: "Invalid JSON",
      status: 400,
      detail: "Request body must be valid JSON",
      instance: request.url,
    });
  }

  if (validationError.code === "FST_ERR_VALIDATION") {
    return reply.status(400).send({
      type: "urn:app:error:validation",
      title: "Validation Error",
      status: 400,
      detail: validationError.message,
      instance: request.url,
    });
  }

  reply.status(500).send({
    type: "urn:app:error:internal",
    title: "Internal Server Error",
    status: 500,
    detail: "An unexpected error occurred",
    instance: request.url,
  });
});

server.get("/health", async () => {
  return { status: "ok" };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const host = "0.0.0.0";

    await server.register(cors, {});

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
