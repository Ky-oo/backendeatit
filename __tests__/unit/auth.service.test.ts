import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  register,
  login,
  createRefreshToken,
  rotateRefreshToken,
} from "../../services/auth.service.js";
import { ConflictError, UnauthorizedError } from "../../common/exceptions.js";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";

describe("Auth Service - Unit Tests", () => {
  let prisma: any;

  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    vi.clearAllMocks();

    // Créer un mock de Prisma
    prisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      refreshToken: {
        create: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
    };
  });

  describe("register", () => {
    it("devrait enregistrer un nouvel utilisateur avec un email valide", async () => {
      const input = {
        email: "newuser@example.com",
        password: "password123",
        firstname: "Test",
        lastname: "User",
        city: "Paris",
        cp: "75001",
        address: "1 Rue de Rivoli",
      };

      //pas d'utilisateur existant
      prisma.user.findUnique.mockResolvedValue(null);

      // resultat de la creation du user
      prisma.user.create.mockResolvedValue({
        id: "user-123",
        email: input.email,
        password: expect.any(String), // N'importe quel string (le hash)
        role: "USER",
      });

      //appel de la fonction de register avec les infos user
      const result = await register(prisma, input);

      //verifier le resultat
      expect(result).toEqual({
        id: "user-123",
        email: "newuser@example.com",
        role: "USER",
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: input.email },
      });
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it("devrait lancer une ConflictError si l'email existe déjà", async () => {
      // ARRANGE
      const input = {
        email: "existing@example.com",
        password: "password123",
        firstname: "Test",
        lastname: "User",
        city: "Paris",
        cp: "75001",
        address: "1 Rue de Rivoli",
      };

      // Mock findUnique pour retourner un utilisateur existant
      prisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        email: input.email,
        password: await hash(input.password, 10),
        role: "USER",
      });

      // ACT & ASSERT
      // Vérifier que register() lance une ConflictError
      await expect(register(prisma, input)).rejects.toThrow(ConflictError);

      // Vérifier que create() n'a pas été appelé
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });
  describe("login", () => {
    it("devrait loguer un utilisateur avec des identifiants valides", async () => {
      // ARRANGE
      const input = {
        email: "user@example.com",
        password: "password123",
      };

      // TODO : Créer un vrai hash du mot de passe avec bcryptjs
      const hashedPassword = await hash(input.password, 10);

      // TODO : Mock findUnique pour retourner un utilisateur avec le bon hash
      prisma.user.findUnique.mockResolvedValue({
        id: "user-456",
        email: "user@example.com",
        password: hashedPassword,
        role: "USER",
      });

      // ACT
      // TODO : Appeler login()
      const result = await login(prisma, input);
      // ASSERT
      expect(result).toEqual({
        id: "user-456",
        email: "user@example.com",
        role: "USER",
      });
    });

    it("devrait lancer une UnauthorizedError si l'utilisateur n'existe pas", async () => {
      // 1️⃣ ARRANGE
      const input = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      // TODO : Mock findUnique pour retourner null
      prisma.user.findUnique.mockResolvedValue(null);

      // TODO : Vérifier que login() lance une UnauthorizedError
      await expect(login(prisma, input)).rejects.toThrow(UnauthorizedError);
    });

    it("devrait lancer une UnauthorizedError si le mot de passe est incorrect", async () => {
      // 1️⃣ ARRANGE
      const input = {
        email: "user@example.com",
        password: "wrongpassword",
      };

      // TODO : Mock findUnique avec un utilisateur ayant un autre hash
      prisma.user.findUnique.mockResolvedValue({
        id: "user-789",
        email: "user@example.com",
        password: "$2a$10$fakehashedpassword123456789",
        role: "USER",
      });

      // TODO : Vérifier que login() lance une UnauthorizedError
      await expect(login(prisma, input)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("createRefreshToken", () => {
    it("devrait créer un refresh token et le persister en base", async () => {
      prisma.refreshToken.create.mockResolvedValue({ id: "token-1" });

      const result = await createRefreshToken(prisma, "user-123");

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
      expect(prisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-123",
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
          }),
        }),
      );
    });

    it("devrait stocker un hash (pas le token brut) en base", async () => {
      prisma.refreshToken.create.mockResolvedValue({ id: "token-1" });

      const token = await createRefreshToken(prisma, "user-123");
      const storedHash =
        prisma.refreshToken.create.mock.calls[0][0].data.tokenHash;

      // Le hash doit être différent du token brut
      expect(storedHash).not.toBe(token);
      // Le hash doit commencer par $2b$ (bcrypt)
      expect(storedHash).toMatch(/^\$2[ab]\$/);
    });
  });

  describe("rotateRefreshToken", () => {
    it("devrait retourner un nouveau token si le refresh token est valide", async () => {
      const plainToken = randomBytes(48).toString("base64url");
      const tokenHash = await hash(plainToken, 10);

      prisma.refreshToken.findMany.mockResolvedValue([
        {
          id: "token-1",
          userId: "user-123",
          tokenHash,
          user: {
            id: "user-123",
            email: "user@example.com",
            role: "USER",
            firstname: "John",
            lastname: "Doe",
            city: "Paris",
            cp: "75001",
            address: "1 rue de la Paix",
            picture: null,
            phoneNumber: null,
            details: null,
          },
        },
      ]);
      prisma.refreshToken.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({ id: "token-2" });

      const result = await rotateRefreshToken(prisma, plainToken);

      expect(result.id).toBe("user-123");
      expect(result.email).toBe("user@example.com");
      expect(typeof result.refreshToken).toBe("string");
      // L'ancien token doit être révoqué
      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { revokedAt: expect.any(Date) },
        }),
      );
      // Un nouveau token doit être créé
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    it("devrait lancer une UnauthorizedError si le refresh token est invalide", async () => {
      prisma.refreshToken.findMany.mockResolvedValue([]);

      await expect(rotateRefreshToken(prisma, "invalid-token")).rejects.toThrow(
        UnauthorizedError,
      );
    });
  });
});
