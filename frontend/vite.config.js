import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://3.109.60.91:3000",
      "/socket.io": { target: "http://3.109.60.91:3000", ws: true },
      "/token": "http://3.109.60.91:3000",
      "/audit": "http://3.109.60.91:3000",
      "/health": "http://3.109.60.91:3000",
    },
  },
});
