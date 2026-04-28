import fastify, { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import "./plugins/dotenvx.js";
import swagger from "@fastify/swagger";
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
    // Todo: Enregistrer Swagger uniquement en développement
    // Todo: Register Swagger-ui uniquement en développement
    await registerPlugins(server);
    await registerGraphQL(server);
    await registerRoutes(server);

    await server.ready();
    if (process.env.NODE_ENV === "development") {
      //server.swagger();
    }

    await server.listen({ port, host });
    server.log.info(`Server running on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
