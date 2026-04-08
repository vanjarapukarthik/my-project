import express from "express";
import { AccessToken } from "livekit-server-sdk";
import fs from "fs";
import { env } from "../config/env.js";

const router = express.Router();

router.get("/token", (req, res) => {
  try {
    const { name, room, role } = req.query;
    const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_SECRET, { identity: name || "user" });
    at.addGrant({ roomJoin: true, room: room || "consultation" });
    if (process.env.NODE_ENV !== "test") {
      fs.appendFileSync("audit.log", JSON.stringify({ event: "JOIN", name, room, role, ts: new Date() }) + "\n");
    }
    res.json({ token: at.toJwt(), url: env.LIVEKIT_URL });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/audit", (req, res) => {
  try {
    if (process.env.NODE_ENV !== "test") {
      fs.appendFileSync("audit.log", JSON.stringify(req.body) + "\n");
    }
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
