import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { recordingService } from "../lib/services.js";
import { FiVideo, FiClock, FiUser, FiPlay } from "react-icons/fi";

function formatDate(d) {
  return new Date(d).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Recordings() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [videoError, setVideoError] = useState(null);

  const isDoctor = user?.role === "doctor" || user?.role === "admin";

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      setError(null);
      try {
        const userId = user?.id || user?._id;
        if (!userId) {
          setList([]);
          setError("User session not ready. Please login again.");
          return;
        }
        const params = isDoctor ? { doctorId: userId } : { patientId: userId };
        const res = await recordingService.list(params);
        setList(res.data || []);
      } catch (err) {
        setError(err?.message || "Failed to load recordings");
        setList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [isDoctor, user?.id, user?._id]);

  const fileUrl = (id) => recordingService.getFileUrl(id);

  return (
    <main className="page-container">
      <div className="page-header">
        <h1 className="page-title">Recordings</h1>
        <p className="page-subtitle">
          {isDoctor
            ? "View and play previous consultation recordings."
            : "Your consultation recordings."}
        </p>
      </div>

      <div className="dashboard-card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Video recordings</h2>
        </div>
        <div className="p-6 lg:p-8">
          {loading && (
            <div className="text-center py-12 text-slate-500">Loading recordings…</div>
          )}
          {error && (
            <div className="text-center py-8 text-red-600 bg-red-50 rounded-xl border border-red-100">
              {error}
            </div>
          )}
          {!loading && !error && list.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <FiVideo className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-medium">No recordings yet</p>
              <p className="text-sm mt-1">
                Recordings from video consultations will appear here.
              </p>
            </div>
          )}
          {!loading && !error && list.length > 0 && (
            <ul className="space-y-4">
              {list.map((rec) => (
                <li
                  key={rec.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                      <FiClock className="w-4 h-4 flex-shrink-0" />
                      {formatDate(rec.createdAt)}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {rec.doctorId?.name && (
                        <span className="flex items-center gap-1">
                          <FiUser className="w-4 h-4" />
                          Dr. {rec.doctorId.name}
                        </span>
                      )}
                      {rec.patientId?.name && (
                        <span className="flex items-center gap-1 text-slate-600">
                          Patient: {rec.patientId.name}
                        </span>
                      )}
                      {rec.durationSeconds > 0 && (
                        <span className="text-slate-500">
                          {formatDuration(rec.durationSeconds)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setVideoError(null);
                        setPlayingId(playingId === rec.id ? null : rec.id);
                      }}
                      className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                    >
                      <FiPlay className="w-4 h-4" />
                      {playingId === rec.id ? "Hide" : "Play"}
                    </button>
                  </div>
                  {playingId === rec.id && (
                    <div className="w-full sm:col-span-2 rounded-xl overflow-hidden bg-slate-900">
                      {videoError && (
                        <p className="text-sm text-amber-200 px-3 py-2 bg-black/40">{videoError}</p>
                      )}
                      <video
                        key={rec.id}
                        src={fileUrl(rec.id)}
                        controls
                        playsInline
                        className="w-full max-h-[400px]"
                        onEnded={() => setPlayingId(null)}
                        onError={() =>
                          setVideoError(
                            "Could not load video. Ensure backend is running, you are logged in, and VITE_API_URL points to your API when using S3/CloudFront."
                          )
                        }
                        onLoadedData={() => setVideoError(null)}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
