import express from "express";
import {
  uploadRecording,
  listRecordings,
  getRecording,
  getRecordingFile,
} from "../controllers/recordingController.js";
import { uploadRecordingMiddleware } from "../middleware/uploadRecording.js";
import { protectBearerOrQuery } from "../middleware/auth.js";

const router = express.Router();

router.post("/upload", uploadRecordingMiddleware, uploadRecording);
router.get("/", listRecordings);
router.get("/:id/file", protectBearerOrQuery, getRecordingFile);
router.get("/:id", getRecording);

export default router;
