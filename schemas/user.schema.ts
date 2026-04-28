import { Type, Static } from "@sinclair/typebox";

export const UserSchema = Type.Object({
  email: Type.String({ minLength: 2, format: "email" }),
  password: Type.String({ minLength: 6 }),
});

export type UserRequest = Static<typeof UserSchema>;
