import { Type, Static } from "@sinclair/typebox";

export const RestaurantSchema = Type.Object({
  id: Type.String(),
  cuisine: Type.String(),
  deliveryFee: Type.Number(),
  deliveryTime: Type.String(),
  description: Type.String(),
  distance: Type.Number(),
  image: Type.String(),
  name: Type.String(),
  rating: Type.Number(),
  userId: Type.String(),
});

export const CreateRestaurantSchema = Type.Object({
  cuisine: Type.String({ minLength: 1 }),
  deliveryFee: Type.Number({ minimum: 0 }),
  deliveryTime: Type.String({ minLength: 1 }),
  description: Type.String({ minLength: 1 }),
  distance: Type.Number({ minimum: 0 }),
  image: Type.String({ minLength: 1 }),
  name: Type.String({ minLength: 1 }),
  rating: Type.Number({ minimum: 0, maximum: 5 }),
  userId: Type.String({ minLength: 1 }),
});

export const CreateRestaurantResponseSchema = Type.Object({
  restaurant: RestaurantSchema,
});

export const UpdateRestaurantSchema = Type.Partial(CreateRestaurantSchema);

export const UpdateRestaurantResponseSchema = Type.Object({
  restaurant: RestaurantSchema,
});

export const getAllResturantsResponseSchema = Type.Object({
  restaurants: Type.Array(RestaurantSchema),
});

export type Restaurant = Static<typeof RestaurantSchema>;
export type CreateRestaurantRequest = Static<typeof CreateRestaurantSchema>;
export type CreateRestaurantResponse = Static<
  typeof CreateRestaurantResponseSchema
>;
export type UpdateRestaurantRequest = Static<typeof UpdateRestaurantSchema>;
export type UpdateRestaurantResponse = Static<
  typeof UpdateRestaurantResponseSchema
>;
