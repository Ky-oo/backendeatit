import { Type, Static } from "@sinclair/typebox";

export const UserProfileSchema = Type.Object({
  id: Type.String(),
  email: Type.String({ format: "email" }),
  role: Type.String(),
  firstname: Type.String(),
  lastname: Type.String(),
  picture: Type.Optional(Type.String()),
  phoneNumber: Type.Optional(Type.String()),
  city: Type.String(),
  cp: Type.String(),
  address: Type.String(),
  details: Type.Optional(Type.String()),
});

export const UpdateUserSchema = Type.Partial(
  Type.Object({
    email: Type.String({ format: "email" }),
    firstname: Type.String({ minLength: 1 }),
    lastname: Type.String({ minLength: 1 }),
    picture: Type.String(),
    phoneNumber: Type.String(),
    city: Type.String({ minLength: 1 }),
    cp: Type.String({ minLength: 1 }),
    address: Type.String({ minLength: 1 }),
    details: Type.String(),
  }),
);

export const UpdateUserResponseSchema = Type.Object({
  user: UserProfileSchema,
});

export type UserProfile = Static<typeof UserProfileSchema>;
export type UpdateUserRequest = Static<typeof UpdateUserSchema>;
export type UpdateUserResponse = Static<typeof UpdateUserResponseSchema>;
