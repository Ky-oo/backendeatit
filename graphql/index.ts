import { FastifyInstance } from "fastify";
import mercurius from "mercurius";
import { restaurantSchema } from "./restaurant.schema.js";
import { createRestaurantResolvers } from "./restaurant.resolvers.js";

export const registerGraphQL = async (app: FastifyInstance) => {
  const resolvers = createRestaurantResolvers(app);

  await app.register(mercurius, {
    schema: restaurantSchema,
    resolvers,
    graphiql: process.env.NODE_ENV === "development",
  });
};
