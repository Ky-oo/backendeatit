import { Type, Static } from "@sinclair/typebox";

export const OrderItemInputSchema = Type.Object({
  dishId: Type.String({ minLength: 1 }),
  quantity: Type.Integer({ minimum: 1 }),
});

export const CreateOrderSchema = Type.Object({
  restaurantId: Type.String({ minLength: 1 }),
  items: Type.Array(OrderItemInputSchema, { minItems: 1 }),
});

export const UpdateOrderSchema = Type.Object({
  status: Type.Union(
    [
      Type.Literal("CONFIRMED"),
      Type.Literal("PREPARING"),
      Type.Literal("READY"),
      Type.Literal("DELIVERED"),
    ],
    {
      description:
        "New status. Transitions: PENDING→CONFIRMED→PREPARING→READY→DELIVERED",
    },
  ),
});

export const OrderQuerySchema = Type.Object({
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  offset: Type.Optional(Type.Integer({ minimum: 0 })),
  status: Type.Optional(
    Type.Union([
      Type.Literal("PENDING"),
      Type.Literal("CONFIRMED"),
      Type.Literal("PREPARING"),
      Type.Literal("READY"),
      Type.Literal("DELIVERED"),
      Type.Literal("CANCELLED"),
    ]),
  ),
});

export const OrderItemSchema = Type.Object({
  id: Type.String(),
  dishId: Type.String(),
  quantity: Type.Integer(),
  price: Type.Number(),
  dish: Type.Optional(
    Type.Object({
      id: Type.String(),
      name: Type.String(),
      description: Type.String(),
      price: Type.Number(),
      image: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    }),
  ),
});

export const OrderSchema = Type.Object({
  id: Type.String(),
  userId: Type.String(),
  restaurantId: Type.String(),
  date: Type.String(),
  total: Type.Number(),
  status: Type.String(),
  items: Type.Array(OrderItemSchema),
  user: Type.Optional(
    Type.Object({
      id: Type.String(),
      email: Type.String(),
      firstname: Type.String(),
      lastname: Type.String(),
      picture: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    }),
  ),
});

export const CreateOrderResponseSchema = Type.Object({
  data: OrderSchema,
});

export const GetOrdersResponseSchema = Type.Object({
  data: Type.Array(OrderSchema),
});

export const PaginatedOrdersResponseSchema = Type.Object({
  data: Type.Array(OrderSchema),
  pagination: Type.Object({
    total: Type.Integer(),
    limit: Type.Integer(),
    offset: Type.Integer(),
  }),
});

export type CreateOrderRequest = Static<typeof CreateOrderSchema>;
export type UpdateOrderRequest = Static<typeof UpdateOrderSchema>;
export type OrderQuery = Static<typeof OrderQuerySchema>;
export type OrderItemInput = Static<typeof OrderItemInputSchema>;

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";
