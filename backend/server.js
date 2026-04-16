import express from "express";
import { Server } from "socket.io";
import cors from "cors";
import { env } from "./config/env.js";
import connectDB from "./config/db.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API is working 🚀",
  });
});

app.use("/api", routes);

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

app.use(notFound);
app.use(errorHandler);

// --- Video call signaling (WebRTC) ---
const roomPeers = new Map();

function getRoomPeers(roomId) {
  if (!roomPeers.has(roomId)) roomPeers.set(roomId, new Map());
  return roomPeers.get(roomId);
}

function startServer() {
  const PORT = process.env.PORT || 5000;

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend running on port ${PORT}`);
  });

  const io = new Server(server, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
    path: env.WS_PATH,
  });

  io.on("connection", (socket) => {
    socket.on("join-room", ({ roomId, userId, userName, role }) => {
      const peers = getRoomPeers(roomId);
      peers.set(socket.id, { userId, userName, role });
      socket.join(roomId);
      socket.roomId = roomId;
      const peerList = Array.from(peers.entries()).map(([id, data]) => ({ socketId: id, ...data }));
      socket.to(roomId).emit("user-joined", { socketId: socket.id, userId, userName, role });
      socket.emit("room-state", { peerList, you: socket.id });
    });

    socket.on("offer", ({ to, offer }) => {
      socket.to(to).emit("offer", { from: socket.id, offer });
    });

  socket.on("answer", ({ to, answer }) => {
    socket.to(to).emit("answer", { from: socket.id, answer });
  });

    socket.on("ice-candidate", ({ to, candidate }) => {
      socket.to(to).emit("ice-candidate", { from: socket.id, candidate });
    });

    socket.on("leave-room", () => {
      if (socket.roomId) {
        const peers = getRoomPeers(socket.roomId);
        peers.delete(socket.id);
        socket.to(socket.roomId).emit("user-left", { socketId: socket.id });
        if (peers.size === 0) roomPeers.delete(socket.roomId);
        socket.roomId = null;
      }
    });

    socket.on("disconnect", () => {
      if (socket.roomId) {
        const peers = getRoomPeers(socket.roomId);
        peers.delete(socket.id);
        socket.to(socket.roomId).emit("user-left", { socketId: socket.id });
        if (peers.size === 0) roomPeers.delete(socket.roomId);
      }
    });
  });
}
if (env.MONGODB_URI) {
  connectDB()
    .then(startServer)
    .catch((err) => {
      console.error("Failed to start server:", err);
      process.exit(1);
    });
} else {
  console.warn("MONGODB_URI not set. REST API will not persist data.");
  startServer();
}
