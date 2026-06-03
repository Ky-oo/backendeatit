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

export const TokenResponseSchema = Type.Object({
  data: Type.Object({
    token: Type.String(),
    refreshToken: Type.String(),
  }),
});

export const RefreshTokenSchema = Type.Object({
  refreshToken: Type.String({ minLength: 1 }),
});

export const UserResponseSchema = Type.Object({
  data: Type.Object({
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
  }),
});
export const AuthMeResponseSchema = Type.Object({
  data: Type.Object({
    id: Type.String({ description: "User ID" }),
    email: Type.String({ format: "email", description: "User email" }),
    role: Type.String({ description: "User role: USER, RESTAURANT or ADMIN" }),
  }),
});
export type AuthMeResponse = Static<typeof AuthMeResponseSchema>;
