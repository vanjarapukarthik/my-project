import { useState } from "react";
import { Link } from "react-router-dom";
import { FiMoreVertical, FiVideo, FiCalendar, FiBarChart2 } from "react-icons/fi";

export default function Dashboard() {
  const [patientName, setPatientName] = useState("");

  return (
    <main className="page-container">
      <div className="page-header">
        <h1 className="page-title">Welcome back</h1>
        <p className="page-subtitle">Start a video consultation or manage your appointments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Link
          to="/video-consultation"
          className="dashboard-card p-5 flex items-center gap-4 hover:border-blue-200 transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200/80 transition">
            <FiVideo className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Video Consultation</h3>
            <p className="text-sm text-slate-500">Join or start a call</p>
          </div>
        </Link>
        <Link
          to="/appointments"
          className="dashboard-card p-5 flex items-center gap-4 hover:border-blue-200 transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200/80 transition">
            <FiCalendar className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Appointments</h3>
            <p className="text-sm text-slate-500">View schedule</p>
          </div>
        </Link>
        <Link
          to="/analytics"
          className="dashboard-card p-5 flex items-center gap-4 hover:border-blue-200 transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200/80 transition">
            <FiBarChart2 className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Analytics</h3>
            <p className="text-sm text-slate-500">Insights & reports</p>
          </div>
        </Link>
      </div>

      <div className="dashboard-card relative max-w-2xl">
        <button className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition z-10" aria-label="More options">
          <FiMoreVertical className="w-5 h-5" />
        </button>
        <div className="p-6 lg:p-8 flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900 mb-0.5">Quick start consultation</h2>
            <p className="text-sm text-slate-500 mb-4">Enter your name and join your scheduled video call.</p>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label htmlFor="patient-name" className="block text-sm font-medium text-slate-700 mb-1.5">Your name</label>
                <input
                  id="patient-name"
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-slate-800 placeholder-slate-400 text-sm"
                />
              </div>
              <Link
                to="/video-consultation"
                className="btn-primary w-full justify-center py-3"
              >
                Join consultation
              </Link>
            </form>
          </div>
          <div className="hidden sm:flex items-center justify-center flex-shrink-0 w-36">
            <img
              src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=320&h=320&fit=crop"
              alt="Doctor consultation"
              className="w-28 h-28 rounded-xl object-cover shadow-md"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
