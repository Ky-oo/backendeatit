import fp from "fastify-plugin";
import type { FastifyInstance, FastifyError } from "fastify";
import { AppError } from "../common/exceptions.js";

export const errorHandlerPlugin = fp(async (app: FastifyInstance) => {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      const problemDetail = error.problemDetail;
      problemDetail.instance = request.url;
      return reply.status(error.statusCode).send(problemDetail);
    }

    const fastifyError = error as FastifyError;

    if (fastifyError.code === "FST_ERR_CTP_INVALID_JSON_BODY") {
      return reply.status(400).send({
        type: "urn:app:error:invalid-json",
        title: "Invalid JSON",
        status: 400,
        detail: "Request body must be valid JSON",
        instance: request.url,
      });
    }

    if (fastifyError.code === "FST_ERR_VALIDATION") {
      return reply.status(400).send({
        type: "urn:app:error:validation",
        title: "Validation Error",
        status: 400,
        detail: fastifyError.message,
        instance: request.url,
      });
    }

    app.log.error({ err: error, url: request.url, method: request.method });
    return reply.status(500).send({
      type: "urn:app:error:internal",
      title: "Internal Server Error",
      status: 500,
      detail: "An unexpected error occurred",
      instance: request.url,
    });
  });
});
