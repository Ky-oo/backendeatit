import { Type, Static } from "@sinclair/typebox";

export const DishSchema = Type.Object({
  id: Type.String(),
  restaurantId: Type.String(),
  name: Type.String(),
  description: Type.String(),
  price: Type.Number(),
  image: Type.Optional(Type.String()),
});

export const CreateDishSchema = Type.Object({
  restaurantId: Type.String({ minLength: 1 }),
  name: Type.String({ minLength: 1 }),
  description: Type.String({ minLength: 1 }),
  price: Type.Number({ minimum: 0 }),
  image: Type.Optional(Type.String({ minLength: 1 })),
});

export const CreateDishResponseSchema = Type.Object({
  data: DishSchema,
});

export const UpdateDishSchema = Type.Partial(
  Type.Object({
    name: Type.String({ minLength: 1 }),
    description: Type.String({ minLength: 1 }),
    price: Type.Number({ minimum: 0 }),
    image: Type.String({ minLength: 1 }),
  }),
);

export const UpdateDishResponseSchema = Type.Object({
  data: DishSchema,
});

export const DishListResponseSchema = Type.Object({
  data: Type.Array(DishSchema),
});

export type Dish = Static<typeof DishSchema>;
export type CreateDishRequest = Static<typeof CreateDishSchema>;
export type CreateDishResponse = Static<typeof CreateDishResponseSchema>;
export type UpdateDishRequest = Static<typeof UpdateDishSchema>;
export type UpdateDishResponse = Static<typeof UpdateDishResponseSchema>;
export type DishListResponse = Static<typeof DishListResponseSchema>;

export const DishQuerySchema = Type.Object({
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  offset: Type.Optional(Type.Integer({ minimum: 0 })),
  minPrice: Type.Optional(Type.Number({ minimum: 0 })),
  maxPrice: Type.Optional(Type.Number({ minimum: 0 })),
});

export const PaginatedDishesResponseSchema = Type.Object({
  data: Type.Array(DishSchema),
  pagination: Type.Object({
    total: Type.Integer(),
    limit: Type.Integer(),
    offset: Type.Integer(),
  }),
});

export type DishQuery = Static<typeof DishQuerySchema>;
