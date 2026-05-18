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
  status: Type.Union([
    Type.Literal("EN_COURS"),
    Type.Literal("LIVREE"),
    Type.Literal("ANNULEE"),
  ]),
});

export const OrderItemSchema = Type.Object({
  id: Type.String(),
  dishId: Type.String(),
  quantity: Type.Integer(),
  price: Type.Number(),
});

export const OrderSchema = Type.Object({
  id: Type.String(),
  userId: Type.String(),
  restaurantId: Type.String(),
  date: Type.String(),
  total: Type.Number(),
  status: Type.String(),
  items: Type.Array(OrderItemSchema),
});

export const CreateOrderResponseSchema = Type.Object({
  order: OrderSchema,
});

export const GetOrdersResponseSchema = Type.Object({
  orders: Type.Array(OrderSchema),
});

export type CreateOrderRequest = Static<typeof CreateOrderSchema>;
export type UpdateOrderRequest = Static<typeof UpdateOrderSchema>;
export type OrderItemInput = Static<typeof OrderItemInputSchema>;
