import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { FastifyInstance } from "fastify";
import {
  createTestServer,
  closeTestServer,
  cleanDatabase,
} from "../utils/test-setup.js";
import { prisma } from "../../plugins/prismaInstance.js";

describe("Authentication Integration Tests", () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    // Après TOUS les tests : arrêter le serveur
    await closeTestServer(server);
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Avant CHAQUE test : nettoyer la base de données dans le bon ordre (FK)
    await cleanDatabase();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user and return a valid JWT token", async () => {
      // ARRANGE
      const newUser = {
        email: "test@example.com",
        password: "password123",
        firstname: "Test",
        lastname: "User",
        city: "Paris",
        cp: "75001",
        address: "1 Rue de Rivoli",
      };

      // ACT - Envoyer une requête POST
      const response = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: newUser,
      });

      // ASSERT - Vérifier les résultats
      expect(response.statusCode).toBe(201); // 201 = Created
      expect(response.json()).toHaveProperty("token");

      // Vérifier que le token est valide
      const token = response.json().token;
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");

      // Vérifier que l'utilisateur est réellement dans la base de données
      const user = await prisma.user.findUnique({
        where: { email: "test@example.com" },
      });
      expect(user).toBeDefined();
      expect(user?.email).toBe("test@example.com");
    });

    it("should reject registration with invalid email format", async () => {
      // 1️⃣ ARRANGE
      const invalidUser = {
        email: "invalid-email", // ❌ Pas de @
        password: "password123",
        firstname: "Test",
        lastname: "User",
        city: "Paris",
        cp: "75001",
        address: "1 Rue de Rivoli",
      };

      // 2️⃣ ACT
      const response = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: invalidUser,
      });

      // 3️⃣ ASSERT
      expect(response.statusCode).toBe(400);
      const user = await prisma.user.findUnique({
        where: { email: invalidUser.email },
      });
      expect(user).toBeNull();
    });

    it("should return 409 when email already exists", async () => {
      // ARRANGE
      const userPayload = {
        email: "duplicate@example.com",
        password: "password123",
        firstname: "Test",
        lastname: "User",
        city: "Paris",
        cp: "75001",
        address: "1 Rue de Rivoli",
      };

      // Créer le premier utilisateur
      const firstResponse = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: userPayload,
      });

      // ACT - Tentative de créer un utilisateur avec le même email
      const secondResponse = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          ...userPayload,
          password: "differentpassword", // Password différent, email identique
        },
      });
      // 3️⃣ ASSERT
      expect(secondResponse.statusCode).toBe(409); // 409 = Conflict
      expect(secondResponse.json()).toHaveProperty("title", "Conflict");
      expect(secondResponse.json().type).toMatch(/conflict/i);

      const userCount = await prisma.user.count({
        where: { email: userPayload.email },
      });
      expect(userCount).toBe(1);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Avant chaque test de login, créer un utilisateur de test
      await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          email: "login@example.com",
          password: "correctpassword",
          firstname: "Test",
          lastname: "User",
          city: "Paris",
          cp: "75001",
          address: "1 Rue de Rivoli",
        },
      });
    });

    it("should login with valid credentials and return JWT token", async () => {
      // ARRANGE
      const credentials = {
        email: "login@example.com",
        password: "correctpassword",
      };

      // 2️⃣ ACT
      // TODO : Envoyer une requête POST vers /api/auth/login
      const response = await server.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: credentials,
      });

      // 3️⃣ ASSERT
      expect(response.statusCode).toBe(200);
      expect(response.json()).toHaveProperty("token");
      const token = response.json().token;
      expect(typeof token).toBe("string");
      expect(token).not.toBe("");
    });

    it("should return 401 for non-existent user", async () => {
      // ARRANGE
      const credentials = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      // 2️⃣ ACT
      const response = await server.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: credentials,
      });

      // 3️⃣ ASSERT

      expect(response.statusCode).toBe(401);
      expect(response.json()).toHaveProperty("title", "Unauthorized");
      expect(response.json().type).not.toHaveProperty("token");
      expect(response.json().type).toMatch(/unauthorized/i);
    });
  });
});
