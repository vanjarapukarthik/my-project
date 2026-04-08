import express from "express";
import {
  uploadRecording,
  listRecordings,
  getRecording,
  getRecordingFile,
} from "../controllers/recordingController.js";
import { uploadRecordingMiddleware } from "../middleware/uploadRecording.js";

const router = express.Router();

router.post("/upload", uploadRecordingMiddleware, uploadRecording);
router.get("/", listRecordings);
router.get("/:id", getRecording);
router.get("/:id/file", getRecordingFile);

export default router;
