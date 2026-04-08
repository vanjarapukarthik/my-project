import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Recording from "../models/Recording.js";

const normalizeObjectId = (value) => {
  if (!value) return null;
  const cleaned = String(value).trim();
  if (!cleaned || cleaned === "undefined" || cleaned === "null") return null;
  return mongoose.Types.ObjectId.isValid(cleaned) ? cleaned : null;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "recordings");

export const uploadRecording = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No video file uploaded" });
    }
    const { doctorId, patientId, roomId, durationSeconds } = req.body;
    const safeDoctorId = normalizeObjectId(doctorId);
    const safePatientId = normalizeObjectId(patientId);
    if (!safeDoctorId) {
      return res.status(400).json({ success: false, message: "doctorId is required" });
    }

    const filename = req.file.filename;
    const filePath = req.file.path;

    const recording = await Recording.create({
      doctorId: safeDoctorId,
      patientId: safePatientId || undefined,
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
    const safeDoctorId = normalizeObjectId(doctorId);
    const safePatientId = normalizeObjectId(patientId);
    if (safeDoctorId) filter.doctorId = safeDoctorId;
    if (safePatientId) filter.patientId = safePatientId;
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
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }
    const recording = await Recording.findById(req.params.id);
    if (!recording) {
      return res.status(404).json({ success: false, message: "Recording not found" });
    }
    const uid = user._id.toString();
    const role = user.role;
    let allowed = false;
    if (role === "admin") {
      allowed = true;
    } else if (role === "doctor") {
      allowed = recording.doctorId?.toString() === uid;
    } else if (role === "patient") {
      allowed =
        recording.patientId && recording.patientId.toString() === uid;
    }
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    if (!fs.existsSync(recording.filePath)) {
      return res.status(404).json({ success: false, message: "File not found" });
    }
    res.setHeader("Content-Type", recording.mimeType || "video/webm");
    res.setHeader("Accept-Ranges", "bytes");
    res.sendFile(path.resolve(recording.filePath));
  } catch (err) {
    next(err);
  }
};
