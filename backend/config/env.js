import dotenv from "dotenv";

dotenv.config();

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
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  WS_PATH: process.env.WS_PATH || "/socket.io",
};
