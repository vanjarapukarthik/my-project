import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    type: { type: String, enum: ["video", "in-person"], default: "video" },
    status: { type: String, enum: ["scheduled", "confirmed", "completed", "cancelled", "no-show"], default: "scheduled" },
    roomName: { type: String, trim: true },
    notes: { type: String },
  },
  { timestamps: true }
);

appointmentSchema.index({ patientId: 1, date: 1 });
appointmentSchema.index({ doctorId: 1, date: 1 });

export default mongoose.model("Appointment", appointmentSchema);
