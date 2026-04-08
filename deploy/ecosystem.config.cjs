/**
 * PM2 — Telehealth backend (single Node app behind Nginx).
 * From repo root:  pm2 start deploy/ecosystem.config.cjs
 */
const path = require("path");

module.exports = {
  apps: [
    {
      name: "telehealth-api",
      cwd: path.join(__dirname, "..", "backend"),
      script: "server.js",
      instances: 1,
      autorestart: true,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        HOST: "127.0.0.1",
        PORT: 5000,
      },
    },
  ],
};
