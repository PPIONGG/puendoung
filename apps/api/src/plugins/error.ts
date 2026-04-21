import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    if (error instanceof ZodError) {
      return reply.status(422).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request",
          details: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
      });
    }

    if ((error as any).statusCode === 429) {
      return reply.status(429).send({
        error: { code: "RATE_LIMITED", message: "Too many requests" },
      });
    }

    const statusCode = (error as any).statusCode || 500;
    const message = statusCode >= 500 ? "Internal server error" : error.message || "Error";

    return reply.status(statusCode).send({
      error: { code: "INTERNAL_ERROR", message },
    });
  });
}
