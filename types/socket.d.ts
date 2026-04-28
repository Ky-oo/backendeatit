import type { User } from "../generated/prisma/client.js";
import type { WebSocket } from "@fastify/websocket";

export interface AuthenticatedWebSocket {
  user: User;
  restaurantId: string;
  socket: WebSocket;
}
