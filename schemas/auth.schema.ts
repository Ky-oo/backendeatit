import { Type, Static } from "@sinclair/typebox";

export const LoginSchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 1 }),
});

export const RegisterSchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 8 }),
  firstname: Type.String({ minLength: 2 }),
  lastname: Type.String({ minLength: 2 }),
  picture: Type.Optional(Type.String({ format: "uri" })),
  phoneNumber: Type.Optional(Type.String({ minLength: 2 })),
  city: Type.String({ minLength: 2 }),
  cp: Type.String({ minLength: 2 }),
  address: Type.String({ minLength: 2 }),
  details: Type.Optional(Type.String({ minLength: 2 })),
});

export const UserResponseSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  role: Type.String(),
  firstname: Type.String(),
  lastname: Type.String(),
  picture: Type.Optional(Type.String({ format: "uri" })),
  phoneNumber: Type.Optional(Type.String()),
  city: Type.String(),
  cp: Type.String(),
  address: Type.String(),
  details: Type.Optional(Type.String()),
});

export const TokenResponseSchema = Type.Object({
  token: Type.String(),
});

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({
    statusCode: Type.Number(),
    message: Type.String(),
  }),
});

export type LoginRequest = Static<typeof LoginSchema>;
export type RegisterRequest = Static<typeof RegisterSchema>;
export type UserResponse = Static<typeof UserResponseSchema>;
export type TokenResponse = Static<typeof TokenResponseSchema>;
