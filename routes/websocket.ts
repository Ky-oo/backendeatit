import { FastifyInstance, FastifyRequest } from "fastify";
import {
  registerRestaurantConnection,
  unregisterRestaurantConnection,
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
}

interface PingMessage {
  event: typeof WebSocketEvent.PING;
}

type WebSocketMessage = AuthMessage | PingMessage;

export const websocketRoutes = async (app: FastifyInstance) => {
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
            const payload = app.jwt.verify<{ id: string }>(message.token);

            const user = await app.prisma.user.findUnique({
              where: { id: payload.id },
            });

            if (!user) {
              socket.close(1008, "User not found");
              return;
            }

            if (user.role !== "RESTAURANT") {
              socket.close(1008, "Forbidden: RESTAURANT role required");
              return;
            }

            const restaurant = await app.prisma.restaurant.findFirst({
              where: { userId: user.id },
            });
            if (!restaurant) {
              socket.close(1008, "No restaurant linked to this account");
              return;
            }

            authSocket = { user, restaurantId: restaurant.id, socket };
            registerRestaurantConnection(restaurant.id, authSocket);

            socket.send(
              JSON.stringify({
                event: WebSocketEvent.CONNECTED,
                data: {
                  restaurantId: restaurant.id,
                  message: "Connexion authentifiée avec succès",
                },
                timestamp: new Date().toISOString(),
              }),
            );
          } catch (err) {
            socket.close(1008, "Invalid token");
          }
          return;
        }

        if (message.event === WebSocketEvent.PING) {
          socket.send(
            JSON.stringify({
              event: WebSocketEvent.PONG,
              timestamp: new Date().toISOString(),
            }),
          );
          return;
        }
      };

      const onClose = () => {
        if (authSocket) {
          unregisterRestaurantConnection(authSocket.restaurantId, authSocket);
          authSocket = null;
        }
      };

      const onError = (error: Error) => {
        request.log.error({ err: error }, "WebSocket error");
        if (authSocket) {
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
};
