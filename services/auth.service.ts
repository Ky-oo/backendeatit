import type { PrismaClient } from "../generated/prisma/client.js";
import { hash, compare } from "bcryptjs";
import { ConflictError, UnauthorizedError } from "../common/exceptions.js";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  picture?: string;
  phoneNumber?: string;
  city: string;
  cp: string;
  address: string;
  details?: string;
}

export interface AuthResponse {
  id: string;
  email: string;
  role: string;
  firstname: string;
  lastname: string;
  picture?: string;
  phoneNumber?: string;
  city: string;
  cp: string;
  address: string;
  details?: string;
}

export default class AuthService {
  private prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  register = async (input: RegisterInput): Promise<AuthResponse> => {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: input.email,
      },
    });

    if (existingUser) {
      throw new ConflictError("Email already in use");
    }

    const hashedPassword = await hash(input.password, 10);
    const newUser = await this.prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        firstname: input.firstname,
        lastname: input.lastname,
        picture: input.picture,
        phoneNumber: input.phoneNumber,
        role: "USER",
        city: input.city,
        cp: input.cp,
        address: input.address,
        details: input.details,
      },
    });
    return {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      picture: newUser.picture ?? undefined,
      phoneNumber: newUser.phoneNumber ?? undefined,
      city: newUser.city,
      cp: newUser.cp,
      address: newUser.address,
      details: newUser.details ?? undefined,
    };
  };

  login = async (input: LoginInput): Promise<AuthResponse> => {
    const user = await this.prisma.user.findUnique({
      where: {
        email: input.email,
      },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await compare(input.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstname: user.firstname,
      lastname: user.lastname,
      picture: user.picture ?? undefined,
      phoneNumber: user.phoneNumber ?? undefined,
      city: user.city,
      cp: user.cp,
      address: user.address,
      details: user.details ?? undefined,
    };
  };
}

// Exports nommés pour les tests unitaires
export const register = (prisma: PrismaClient, input: RegisterInput) =>
  new AuthService(prisma).register(input);

export const login = (prisma: PrismaClient, input: LoginInput) =>
  new AuthService(prisma).login(input);
