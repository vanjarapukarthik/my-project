import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Recording from "../models/Recording.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "recordings");

export const uploadRecording = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No video file uploaded" });
    }
    const { doctorId, patientId, roomId, durationSeconds } = req.body;
    if (!doctorId) {
      return res.status(400).json({ success: false, message: "doctorId is required" });
    }

    const filename = req.file.filename;
    const filePath = req.file.path;

    const recording = await Recording.create({
      doctorId,
      patientId: patientId || undefined,
      roomId: roomId || undefined,
      filename,
      filePath,
      mimeType: req.file.mimetype || "video/webm",
      durationSeconds: durationSeconds ? Number(durationSeconds) : 0,
    });

    res.status(201).json({
      success: true,
      data: {
        id: recording._id,
        filename: recording.filename,
        durationSeconds: recording.durationSeconds,
        createdAt: recording.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const listRecordings = async (req, res, next) => {
  try {
    const { doctorId, patientId } = req.query;
    const filter = {};
    if (doctorId) filter.doctorId = doctorId;
    if (patientId) filter.patientId = patientId;
    const recordings = await Recording.find(filter)
      .populate("doctorId", "name email")
      .populate("patientId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const data = recordings.map((r) => ({
      id: r._id,
      doctorId: r.doctorId,
      patientId: r.patientId,
      roomId: r.roomId,
      filename: r.filename,
      mimeType: r.mimeType,
      durationSeconds: r.durationSeconds,
      startedAt: r.startedAt,
      createdAt: r.createdAt,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getRecording = async (req, res, next) => {
  try {
    const recording = await Recording.findById(req.params.id)
      .populate("doctorId", "name email")
      .populate("patientId", "name email");
    if (!recording) {
      return res.status(404).json({ success: false, message: "Recording not found" });
    }
    res.json({ success: true, data: recording });
  } catch (err) {
    next(err);
  }
};

export const getRecordingFile = async (req, res, next) => {
  try {
    const recording = await Recording.findById(req.params.id);
    if (!recording) {
      return res.status(404).json({ success: false, message: "Recording not found" });
    }
    if (!fs.existsSync(recording.filePath)) {
      return res.status(404).json({ success: false, message: "File not found" });
    }
    res.setHeader("Content-Type", recording.mimeType || "video/webm");
    res.sendFile(path.resolve(recording.filePath));
  } catch (err) {
    next(err);
  }
};
