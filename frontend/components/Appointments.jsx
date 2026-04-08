import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiClock, FiVideo } from "react-icons/fi";

const mockAppointments = [
  { id: 1, patientName: "John Smith", date: "2026-03-10", time: "09:00 AM", type: "Video", status: "Confirmed", roomId: "room-apt-1" },
  { id: 2, patientName: "Sarah Lee", date: "2026-03-10", time: "10:30 AM", type: "Video", status: "Confirmed", roomId: "room-apt-2" },
  { id: 3, patientName: "Mike Johnson", date: "2026-03-10", time: "02:00 PM", type: "In-person", status: "Pending", roomId: "room-apt-3" },
  { id: 4, patientName: "Emily Davis", date: "2026-03-11", time: "11:00 AM", type: "Video", status: "Confirmed", roomId: "room-apt-4" },
  { id: 5, patientName: "Robert Wilson", date: "2026-03-11", time: "03:30 PM", type: "Video", status: "Pending", roomId: "room-apt-5" },
];

const statusConfig = {
  Confirmed: { class: "bg-emerald-100 text-emerald-800", label: "Confirmed" },
  Pending: { class: "bg-amber-100 text-amber-800", label: "Pending" },
  Cancelled: { class: "bg-red-100 text-red-800", label: "Cancelled" },
  Completed: { class: "bg-slate-100 text-slate-700", label: "Completed" },
};

export default function Appointments() {
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const handleJoinCall = (apt) => {
    navigate("/video-consultation", {
      state: {
        patientName: apt.patientName,
        appointmentTime: `${apt.date} ${apt.time}`,
        appointmentId: apt.id,
        roomId: apt.roomId || `room-apt-${apt.id}`,
      },
    });
  };

  const filteredAppointments =
    filter === "all"
      ? mockAppointments
      : mockAppointments.filter((a) => a.status.toLowerCase() === filter.toLowerCase());

  return (
    <main className="page-container">
      <div className="page-header">
        <h1 className="page-title">Appointments</h1>
        <p className="page-subtitle">Manage and view your upcoming consultations.</p>
      </div>

      <div className="dashboard-card">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-900">Schedule</h2>
          <div className="flex flex-wrap gap-2">
            {["all", "Confirmed", "Pending"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === f ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6 lg:p-8">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FiCalendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-medium">No appointments</p>
              <p className="text-sm mt-1">There are no appointments matching this filter.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredAppointments.map((apt) => (
                <li
                  key={apt.id}
                  className="flex flex-wrap items-center justify-between p-4 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                      {apt.patientName.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{apt.patientName}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-1">
                        <span className="flex items-center gap-1.5">
                          <FiCalendar className="w-4 h-4" />
                          {apt.date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FiClock className="w-4 h-4" />
                          {apt.time}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FiVideo className="w-4 h-4" />
                          {apt.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 sm:mt-0">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${statusConfig[apt.status]?.class || "bg-slate-100 text-slate-700"}`}>
                      {apt.status}
                    </span>
                    {apt.type === "Video" && (
                      <button
                        onClick={() => handleJoinCall(apt)}
                        className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                      >
                        <FiVideo className="w-4 h-4" />
                        Join Call
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
