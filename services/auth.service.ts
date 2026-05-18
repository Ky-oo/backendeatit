import type { PrismaClient } from "../generated/prisma/client.js";
import { hash, compare } from "bcryptjs";
import { randomBytes } from "crypto";
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
  private refreshTokenTtlDays = 30;

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
    console.log("New access token generated for user:", user);

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

  createRefreshToken = async (userId: string): Promise<string> => {
    const refreshToken = randomBytes(48).toString("base64url");
    const tokenHash = await hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenTtlDays);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return refreshToken;
  };

  rotateRefreshToken = async (
    refreshToken: string,
  ): Promise<
    AuthResponse & {
      refreshToken: string;
    }
  > => {
    const storedTokens = await this.prisma.refreshToken.findMany({
      where: {
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    for (const storedToken of storedTokens) {
      const isValid = await compare(refreshToken, storedToken.tokenHash);

      if (!isValid) {
        continue;
      }

      await this.prisma.refreshToken.update({
        where: {
          id: storedToken.id,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      const newRefreshToken = await this.createRefreshToken(storedToken.userId);

      return {
        id: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role,
        firstname: storedToken.user.firstname,
        lastname: storedToken.user.lastname,
        picture: storedToken.user.picture ?? undefined,
        phoneNumber: storedToken.user.phoneNumber ?? undefined,
        city: storedToken.user.city,
        cp: storedToken.user.cp,
        address: storedToken.user.address,
        details: storedToken.user.details ?? undefined,
        refreshToken: newRefreshToken,
      };
    }

    throw new UnauthorizedError("Invalid refresh token");
  };
}

// Exports nommés pour les tests unitaires
export const register = (prisma: PrismaClient, input: RegisterInput) =>
  new AuthService(prisma).register(input);

export const login = (prisma: PrismaClient, input: LoginInput) =>
  new AuthService(prisma).login(input);

export const createRefreshToken = (prisma: PrismaClient, userId: string) =>
  new AuthService(prisma).createRefreshToken(userId);

export const rotateRefreshToken = (
  prisma: PrismaClient,
  refreshToken: string,
) => new AuthService(prisma).rotateRefreshToken(refreshToken);
