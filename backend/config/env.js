import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Project root `.env` (recommended). Path: backend/config → ../.. */
const rootEnvPath = path.join(__dirname, "..", "..", ".env");
/** Legacy `backend/.env` (optional fallback). */
const backendEnvPath = path.join(__dirname, "..", ".env");

// Load root first, then backend `.env` overrides (so `backend/.env` wins for MONGODB_URI, etc.).
dotenv.config({ path: rootEnvPath });
dotenv.config({ path: backendEnvPath, override: true });

const rawCors = process.env.CORS_ORIGIN || "http://localhost:5173";
/** Value for `cors` / Socket.IO: string or array when CORS_ORIGIN is comma-separated. */
export const corsOrigin = rawCors.includes(",")
  ? rawCors
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : rawCors;

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  /** Bind address. Use 127.0.0.1 on EC2 when Nginx is the only public entry (recommended). Default 0.0.0.0 for local dev. */
  HOST: process.env.HOST || "0.0.0.0",
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI || "",
  LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY || "demo_key",
  LIVEKIT_SECRET: process.env.LIVEKIT_SECRET || "demo_secret",
  LIVEKIT_URL: process.env.LIVEKIT_URL || "wss://demo.livekit.cloud",
  JWT_SECRET: process.env.JWT_SECRET || "telehealth-dev-secret",
  /** Raw env string (may contain commas). Prefer `corsOrigin` for middleware. */
  CORS_ORIGIN: rawCors,
  corsOrigin,
  WS_PATH: process.env.WS_PATH || "/socket.io",
};

if (env.NODE_ENV === "development") {
  console.log(
    `[env] Loaded from root/backend .env | PORT=${env.PORT} | MONGODB_URI=${env.MONGODB_URI ? "set" : "MISSING"} | JWT_SECRET=${env.JWT_SECRET ? "set" : "MISSING"} | CORS=${rawCors}`
  );
}
