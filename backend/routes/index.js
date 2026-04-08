import express from "express";
import authRoutes from "./authRoutes.js";
import appointmentRoutes from "./appointmentRoutes.js";
import userRoutes from "./userRoutes.js";
import recordingRoutes from "./recordingRoutes.js";
import livekitRoutes from "./livekitRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/users", userRoutes);
router.use("/recordings", recordingRoutes);
router.use("/", livekitRoutes);

export default router;
