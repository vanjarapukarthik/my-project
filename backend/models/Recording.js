import mongoose from "mongoose";

const recordingSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    roomId: { type: String, trim: true },
    filename: { type: String, required: true },
    filePath: { type: String, required: true },
    mimeType: { type: String, default: "video/webm" },
    durationSeconds: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

recordingSchema.index({ doctorId: 1, createdAt: -1 });

export default mongoose.model("Recording", recordingSchema);
