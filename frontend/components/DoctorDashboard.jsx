import { Link } from "react-router-dom";
import { FiVideo, FiClock } from "react-icons/fi";

const waitingPatients = [
  { id: 1, name: "R Krishna", waitTime: "3 min" },
  { id: 2, name: "K Rahul", waitTime: "5 min" },
  { id: 3, name: "S Anita", waitTime: "3 min" },
  { id: 4, name: "David M", waitTime: "3 min" },
  { id: 5, name: "L Sarah", waitTime: "8 min" },
];

export default function DoctorDashboard() {
  return (
    <main className="page-container">
      <div className="page-header">
        <h1 className="page-title">Doctor dashboard</h1>
        <p className="page-subtitle">Patient waiting list and quick actions.</p>
      </div>

      <div className="dashboard-card max-w-2xl">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Patients waiting</h2>
          <span className="text-sm text-slate-500">{waitingPatients.length} in queue</span>
        </div>
        <div className="p-6 lg:p-8">
          <p className="text-sm text-slate-600 mb-4">Click &quot;Join call&quot; to start a consultation with the patient.</p>
          <ul className="space-y-3">
            {waitingPatients.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                    {p.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <FiClock className="w-3.5 h-3.5" />
                      {p.waitTime} wait
                    </p>
                  </div>
                </div>
                <Link
                  to="/video-consultation"
                  className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                >
                  <FiVideo className="w-4 h-4" />
                  Join call
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
