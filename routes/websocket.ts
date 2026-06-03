import { FastifyInstance, FastifyRequest } from "fastify";
import {
  registerRestaurantConnection,
  registerUserConnection,
  unregisterRestaurantConnection,
  unregisterUserConnection,
} from "../services/websocket.service.js";
import { WebSocket } from "@fastify/websocket";
import type { AuthenticatedWebSocket } from "../types/socket.js";

enum WebSocketEvent {
  AUTHENTICATE = "authenticate",
  PING = "ping",
  PONG = "pong",
  CONNECTED = "connected",
}

interface AuthMessage {
  event: typeof WebSocketEvent.AUTHENTICATE;
  token: string;
  restaurantId?: string;
}

interface PingMessage {
  event: typeof WebSocketEvent.PING;
}

type WebSocketMessage = AuthMessage | PingMessage;

export const websocketRoutes = async (app: FastifyInstance) => {
  const authenticateSocket = async (token: string) => {
    const payload = app.jwt.verify<{ id: string }>(token);
    const user = await app.prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  };

  const sendPong = (socket: WebSocket) => {
    socket.send(
      JSON.stringify({
        event: WebSocketEvent.PONG,
        timestamp: new Date().toISOString(),
      }),
    );
  };

  app.get(
    "/ws/restaurant",
    { websocket: true },
    async (socket: WebSocket, request: FastifyRequest) => {
      let authSocket: AuthenticatedWebSocket | null = null;

      const onMessage = async (data: Buffer) => {
        let message: WebSocketMessage;

        try {
          message = JSON.parse(data.toString()) as WebSocketMessage;
        } catch {
          socket.close(1008, "Invalid JSON");
          return;
        }

        if (message.event === WebSocketEvent.AUTHENTICATE) {
          try {
            const user = await authenticateSocket(message.token);
            const isAdmin = user.role === "ADMIN";
            const isRestaurantUser = user.role === "RESTAURANT";

            if (!isAdmin && !isRestaurantUser) {
              request.log.warn(
                { userId: user.id, role: user.role },
                "WebSocket auth failed: restaurant access required",
              );
              socket.close(1008, "Forbidden: restaurant access required");
              return;
            }

            const restaurant = message.restaurantId
              ? await app.prisma.restaurant.findUnique({
                  where: { id: message.restaurantId },
                })
              : await app.prisma.restaurant.findFirst({
                  where: { userId: user.id },
                });

            if (!restaurant) {
              request.log.warn(
                { userId: user.id, restaurantId: message.restaurantId },
                "WebSocket auth failed: restaurant not found",
              );
              socket.close(1008, "Restaurant not found");
              return;
            }

            if (!isAdmin && restaurant.userId !== user.id) {
              request.log.warn(
                {
                  userId: user.id,
                  restaurantId: restaurant.id,
                  ownerId: restaurant.userId,
                },
                "WebSocket auth failed: restaurant owner mismatch",
              );
              socket.close(1008, "Forbidden: restaurant owner mismatch");
              return;
            }

            if (authSocket?.restaurantId) {
              unregisterRestaurantConnection(
                authSocket.restaurantId,
                authSocket,
              );
            }

            authSocket = { user, restaurantId: restaurant.id, socket };
            registerRestaurantConnection(restaurant.id, authSocket);

            socket.send(
              JSON.stringify({
                event: WebSocketEvent.CONNECTED,
                data: {
                  restaurantId: restaurant.id,
                  message: "Authenticated restaurant socket",
                },
                timestamp: new Date().toISOString(),
              }),
            );
          } catch (err) {
            request.log.warn({ err }, "WebSocket auth failed");
            socket.close(1008, "Authentication failed");
          }
          return;
        }

        if (message.event === WebSocketEvent.PING) {
          sendPong(socket);
        }
      };

      const onClose = () => {
        if (authSocket?.restaurantId) {
          unregisterRestaurantConnection(authSocket.restaurantId, authSocket);
          authSocket = null;
        }
      };

      const onError = (error: Error) => {
        request.log.error({ err: error }, "WebSocket error");
        if (authSocket?.restaurantId) {
          unregisterRestaurantConnection(authSocket.restaurantId, authSocket);
          authSocket = null;
        }
        try {
          socket.close(1011, "Internal server error");
        } catch {}
      };

      socket.on("message", onMessage);
      socket.on("close", onClose);
      socket.on("error", onError);
    },
  );

  app.get(
    "/ws/user",
    { websocket: true },
    async (socket: WebSocket, request: FastifyRequest) => {
      let authSocket: AuthenticatedWebSocket | null = null;

      const onMessage = async (data: Buffer) => {
        let message: WebSocketMessage;

        try {
          message = JSON.parse(data.toString()) as WebSocketMessage;
        } catch {
          socket.close(1008, "Invalid JSON");
          return;
        }

        if (message.event === WebSocketEvent.AUTHENTICATE) {
          try {
            const user = await authenticateSocket(message.token);

            if (authSocket) {
              unregisterUserConnection(authSocket.user.id, authSocket);
            }

            authSocket = { user, socket };
            registerUserConnection(user.id, authSocket);

            socket.send(
              JSON.stringify({
                event: WebSocketEvent.CONNECTED,
                data: {
                  userId: user.id,
                  message: "Authenticated user socket",
                },
                timestamp: new Date().toISOString(),
              }),
            );
          } catch (err) {
            request.log.warn({ err }, "User WebSocket auth failed");
            socket.close(1008, "Authentication failed");
          }
          return;
        }

        if (message.event === WebSocketEvent.PING) {
          sendPong(socket);
        }
      };

      const onClose = () => {
        if (authSocket) {
          unregisterUserConnection(authSocket.user.id, authSocket);
          authSocket = null;
        }
      };

      const onError = (error: Error) => {
        request.log.error({ err: error }, "User WebSocket error");
        if (authSocket) {
          unregisterUserConnection(authSocket.user.id, authSocket);
          authSocket = null;
        }
        try {
          socket.close(1011, "Internal server error");
        } catch {}
      };

      socket.on("message", onMessage);
      socket.on("close", onClose);
      socket.on("error", onError);
    },
  );
};
