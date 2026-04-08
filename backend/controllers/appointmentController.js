import Appointment from "../models/Appointment.js";

export const getAppointments = async (req, res, next) => {
  try {
    const { patientId, doctorId, status, from, to } = req.query;
    const filter = {};
    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;
    if (status) filter.status = status;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    const appointments = await Appointment.find(filter)
      .populate("patientId", "name email")
      .populate("doctorId", "name email")
      .sort({ date: 1, time: 1 });
    res.json({ success: true, data: appointments });
  } catch (err) {
    next(err);
  }
};

export const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patientId", "name email")
      .populate("doctorId", "name email");
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });
    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
};

export const createAppointment = async (req, res, next) => {
  try {
    const { patientId, doctorId, date, time, type, notes } = req.body;
    if (!patientId || !doctorId || !date || !time) {
      return res.status(400).json({ success: false, message: "patientId, doctorId, date, time required" });
    }
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date: new Date(date),
      time,
      type: type || "video",
      notes,
    });
    const populated = await Appointment.findById(appointment._id)
      .populate("patientId", "name email")
      .populate("doctorId", "name email");
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate("patientId", "name email")
      .populate("doctorId", "name email");
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });
    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
};

export const deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });
    res.json({ success: true, message: "Appointment deleted" });
  } catch (err) {
    next(err);
  }
};
