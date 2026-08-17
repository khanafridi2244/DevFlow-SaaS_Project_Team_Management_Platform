const { Server } = require("socket.io");
const { verifyAccessToken } = require("../utils/jwt");
const { env } = require("./env");

let io;

// Maps a userId to their currently connected socket IDs. A user could
// have multiple tabs/devices open, so this is userId -> Set of socketIds,
// not a 1:1 mapping.
const userSockets = new Map();

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  // Auth middleware for socket connections — runs once per connection,
  // before any events are allowed. Reads the same access token cookie
  // used for regular HTTP requests, so no separate socket-auth flow
  // is needed on the frontend.
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const cookies = Object.fromEntries(
        cookieHeader.split(";").map((c) => {
          const [key, ...v] = c.trim().split("=");
          return [key, decodeURIComponent(v.join("="))];
        })
      );

      const token = cookies[env.cookies.accessTokenName];
      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = verifyAccessToken(token);
      socket.userId = decoded.sub;
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId } = socket;

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    socket.on("disconnect", () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSockets.delete(userId);
      }
    });
  });

  return io;
}

// Pushes an event to every open connection a specific user has (all
// their tabs/devices). Safe to call even if the user isn't currently
// connected — it just does nothing in that case.
function emitToUser(userId, event, payload) {
  if (!io) return; // Socket.IO not initialized (e.g. in tests) — no-op
  const socketIds = userSockets.get(userId);
  if (!socketIds || socketIds.size === 0) return;

  for (const socketId of socketIds) {
    io.to(socketId).emit(event, payload);
  }
}

function getIo() {
  if (!io) throw new Error("Socket.IO has not been initialized yet");
  return io;
}

module.exports = { initSocket, emitToUser, getIo };
