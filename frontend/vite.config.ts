import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Forwards /api requests to the backend during dev, so the
      // frontend can call fetch("/api/...") without hardcoding
      // http://localhost:4000 everywhere or fighting CORS in dev.
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      // Socket.IO needs its own proxy entry with ws: true, since
      // WebSocket upgrade requests are handled differently than
      // regular HTTP proxying.
      "/socket.io": {
        target: "http://localhost:4000",
        ws: true,
      },
    },
  },
});