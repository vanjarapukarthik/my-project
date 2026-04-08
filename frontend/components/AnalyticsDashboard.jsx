const metricCards = [
  { label: "Total Patients", value: "2,156", change: "+15%", trend: "up", icon: "chart-bar" },
  { label: "Today's Visits", value: "231", change: "+15%", trend: "up", icon: "chart-line" },
  { label: "Predicted Revenue", value: "$45,730", change: "↓ 5-8%", trend: "down", icon: "chart-bar" },
];

const appointmentDemand = [
  { specialty: "Cardiologist", count: 84, change: "+18%" },
  { specialty: "Dermatologist", count: 67, change: "+48%" },
  { specialty: "Pediatrician", count: 52, change: "+45%" },
];

// Simple bar heights for revenue (percentage of max)
const revenueBars = [65, 78, 45, 82, 70, 88, 72];

function MetricCard({ label, value, change, trend, icon }) {
  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-sm font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
          {change}
        </span>
        {trend === "up" && (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        )}
        {trend === "down" && (
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )}
      </div>
      <div className="mt-3 h-8 flex items-end gap-1">
        {[40, 65, 35, 70, 55].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-medical-200 min-h-[4px]"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Analytics Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {metricCards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Revenue (last 7 days)</h3>
          <div className="h-40 flex items-end gap-2">
            {revenueBars.map((pct, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-medical-500 min-h-[4px] transition"
                  style={{ height: `${pct}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Mon</span>
            <span>Sun</span>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Appointment demand by specialty</h3>
          <ul className="space-y-3">
            {appointmentDemand.map((item) => (
              <li key={item.specialty} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="font-medium text-gray-800">{item.specialty}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{item.count} appointments</span>
                  <span className="text-sm font-medium text-green-600">{item.change}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Patient statistics</h3>
        <div className="flex gap-4 items-center flex-wrap">
          <div
            className="w-32 h-32 rounded-full border-8 border-gray-100 flex-shrink-0"
            style={{
              background: `conic-gradient(
                #3b82f6 0% 45%,
                #60a5fa 45% 70%,
                #93c5fd 70% 90%,
                #dbeafe 90% 100%
              )`,
            }}
          />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-medical-500" />
              <span className="text-sm text-gray-700">New patients (45%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-medical-400" />
              <span className="text-sm text-gray-700">Follow-ups (25%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-medical-300" />
              <span className="text-sm text-gray-700">Consultations (20%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-medical-200" />
              <span className="text-sm text-gray-700">Other (10%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
