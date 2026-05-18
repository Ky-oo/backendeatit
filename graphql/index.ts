import { FastifyInstance, FastifyRequest } from "fastify";
import mercurius from "mercurius";
import { restaurantSchema } from "./restaurant.schema.js";
import { createRestaurantResolvers } from "./restaurant.resolvers.js";

export const registerGraphQL = async (app: FastifyInstance) => {
  const resolvers = createRestaurantResolvers(app);

  await app.register(mercurius, {
    schema: restaurantSchema,
    resolvers,
    graphiql: true,
    context: (request: FastifyRequest) => {
      try {
        const auth = app.jwt.verify<{ id: string }>(
          request.headers.authorization?.replace("Bearer ", "") ?? "",
        );
        return { auth };
      } catch {
        return { auth: null };
      }
    },
  });
};
