import type { AuthenticatedWebSocket } from "../types/socket.js";

// Map pour stocker les connexions WebSocket par restaurantId
const restaurantConnections = new Map<string, Set<AuthenticatedWebSocket>>();
const userConnections = new Map<string, Set<AuthenticatedWebSocket>>();

const sendToConnections = (
  connections: Set<AuthenticatedWebSocket> | undefined,
  event: string,
  data: unknown,
) => {
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
      console.error(`Failed to send WS message for event ${event}:`, err);
    }
  }
};

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

export const registerUserConnection = (
  userId: string,
  socket: AuthenticatedWebSocket,
) => {
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  userConnections.get(userId)!.add(socket);
};

export const unregisterUserConnection = (
  userId: string,
  socket: AuthenticatedWebSocket,
) => {
  const connections = userConnections.get(userId);
  if (!connections) return;
  connections.delete(socket);
  if (connections.size === 0) {
    userConnections.delete(userId);
  }
};

export const notifyRestaurant = (
  restaurantId: string,
  event: string,
  data: unknown,
) => {
  sendToConnections(restaurantConnections.get(restaurantId), event, data);
};

export const notifyUser = (userId: string, event: string, data: unknown) => {
  sendToConnections(userConnections.get(userId), event, data);
};
