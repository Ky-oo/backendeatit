import type { AuthenticatedWebSocket } from "../types/socket.js";

// Map pour stocker les connexions WebSocket par restaurantId
const restaurantConnections = new Map<string, Set<AuthenticatedWebSocket>>();

export const registerRestaurantConnection = (
  restaurantId: string,
  socket: AuthenticatedWebSocket,
) => {
  if (!restaurantConnections.has(restaurantId)) {
    restaurantConnections.set(restaurantId, new Set());
  }
  restaurantConnections.get(restaurantId)!.add(socket);
};

export const unregisterRestaurantConnection = (
  restaurantId: string,
  socket: AuthenticatedWebSocket,
) => {
  const connections = restaurantConnections.get(restaurantId);
  if (!connections) return;
  connections.delete(socket);
  if (connections.size === 0) {
    restaurantConnections.delete(restaurantId);
  }
};

export const notifyRestaurant = (
  restaurantId: string,
  event: string,
  data: unknown,
) => {
  const connections = restaurantConnections.get(restaurantId);
  if (!connections) return;

  const message = JSON.stringify({
    event,
    data,
    timestamp: new Date().toISOString(),
  });

  for (const authSocket of connections) {
    try {
      authSocket.socket.send(message);
    } catch (err) {
      console.error(
        `Failed to send WS message to restaurant ${restaurantId}:`,
        err,
      );
    }
  }
};
