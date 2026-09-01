import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

// Connects once, reused across the whole app. withCredentials sends
// the same HTTP-only access-token cookie the backend's socket auth
// middleware (config/socket.js) reads during the handshake — no
// separate token/login step needed on the client side.
export function connectSocket() {
  if (socket?.connected) return socket;

  socket = io("/", {
    withCredentials: true,
    // In dev, Vite's proxy (vite.config.ts) forwards /socket.io to
    // localhost:4000 with ws: true — same pattern as the /api proxy.
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket() {
  return socket;
}