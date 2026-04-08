import { useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";

const revenueChartData = [
  { name: "Mon", value: 180 },
  { name: "Tue", value: 320 },
  { name: "Wed", value: 280 },
  { name: "Thu", value: 420 },
  { name: "Fri", value: 380 },
  { name: "Sat", value: 450 },
  { name: "Sun", value: 520 },
];

const appointmentPieData = [
  { name: "Follow-up", value: 40, color: "#10b981" },
  { name: "New", value: 26, color: "#3b82f6" },
  { name: "Consultation", value: 34, color: "#1e40af" },
];

const chartTimeframes = ["1 Month", "3 Months", "6 Months", "1 Year", "All Time"];

export default function Analytics() {
  const [chartTimeframe, setChartTimeframe] = useState("1 Month");

  return (
    <main className="page-container">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Revenue and appointment insights.</p>
      </div>

      <div className="dashboard-card">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-900">Overview</h2>
          <div className="flex flex-wrap gap-1">
            {chartTimeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setChartTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  chartTimeframe === tf ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6 lg:p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Visits</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">120</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">RVU</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">35</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Denials</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">5</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Predicted revenue</p>
              <p className="text-xl font-bold text-blue-900 mt-0.5">$45,200</p>
            </div>
          </div>
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Revenue trend</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 600]} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}
                      formatter={(value) => [`$${value}`, "Revenue"]}
                    />
                    <Bar dataKey="value" fill="#60a5fa" radius={[4, 4, 0, 0]} name="Revenue" />
                    <Area type="monotone" dataKey="value" stroke="#1e40af" strokeWidth={2} fill="url(#colorRevenue)" name="Trend" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Appointment distribution</h3>
              <div className="h-52 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={appointmentPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={64}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {appointmentPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
