import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext.jsx";
import { useWebRTC } from "../lib/useWebRTC.js";
import { useCallRecording } from "../lib/useCallRecording.js";
import { recordingService } from "../lib/services.js";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiPhone,
  FiUser,
  FiCircle,
  FiSquare,
  FiClock,
  FiHash,
  FiMapPin,
} from "react-icons/fi";

const SOCKET_URL = import.meta.env.VITE_WS_URL || "";

export default function VideoConsultation() {
  const location = useLocation();
  const { user } = useAuth();
  const [roomId, setRoomId] = useState("");
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [inCall, setInCall] = useState(false);
  const autoJoinAttempted = useRef(false);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [mediaError, setMediaError] = useState(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [remoteUserName, setRemoteUserName] = useState(null);
  const [connectionState, setConnectionState] = useState("new");
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [remoteUserId, setRemoteUserId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const mySocketIdRef = useRef(null);
  const remoteSocketIdRef = useRef(null);

  const onRemoteStream = useCallback((stream) => {
    if (stream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
      setHasRemoteStream(true);
    } else {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      setHasRemoteStream(false);
    }
  }, []);

  const onIceCandidate = useCallback(
    (candidate) => {
      if (socketRef.current?.connected && remoteSocketIdRef.current) {
        socketRef.current.emit("ice-candidate", {
          to: remoteSocketIdRef.current,
          candidate,
        });
      }
    },
    []
  );

  const {
    createOffer,
    handleOffer,
    handleAnswer,
    addIceCandidate,
    closePeerConnection,
  } = useWebRTC(localStreamRef, {
    onRemoteStream,
    onConnectionStateChange: setConnectionState,
    onIceCandidate,
  });

  const getLocalStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  }, []);

  const stopLocalStream = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  }, []);

  const joinRoom = useCallback((roomIdOverride) => {
    const id = (roomIdOverride ?? roomId.trim()) || `room-${Date.now()}`;
    const socket = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;
    socket.emit("join-room", {
      roomId: id,
      userId: user?.id || "anonymous",
      userName: user?.name || "Guest",
      role: user?.role || "patient",
    });

    socket.on("room-state", ({ peerList, you }) => {
      mySocketIdRef.current = you;
      const others = peerList.filter((p) => p.socketId !== you);
      if (others.length > 0) {
        const other = others[0];
        remoteSocketIdRef.current = other.socketId;
        setRemoteUserName(other.userName);
        if (other.userId) setRemoteUserId(other.userId);
      }
    });

    socket.on("user-joined", async ({ socketId, userName, userId }) => {
      remoteSocketIdRef.current = socketId;
      setRemoteUserName(userName);
      if (userId) setRemoteUserId(userId);
      try {
        const offer = await createOffer();
        socket.emit("offer", { to: socketId, offer });
      } catch (err) {
        console.error("createOffer error", err);
      }
    });

    socket.on("offer", async ({ from, offer }) => {
      remoteSocketIdRef.current = from;
      try {
        const answer = await handleOffer(offer);
        socket.emit("answer", { to: from, answer });
      } catch (err) {
        console.error("handleOffer error", err);
      }
    });

    socket.on("answer", async ({ from, answer }) => {
      await handleAnswer(answer);
    });

    socket.on("ice-candidate", async ({ from, candidate }) => {
      await addIceCandidate(candidate);
    });

    socket.on("user-left", ({ socketId }) => {
      if (socketId === remoteSocketIdRef.current) {
        remoteSocketIdRef.current = null;
        setRemoteUserName(null);
        setRemoteUserId(null);
        setHasRemoteStream(false);
        closePeerConnection();
      }
    });

    socket.on("connect_error", (err) => {
      setMediaError("Could not connect to server. Is the backend running?");
    });

    setRoomId(id);
    setInCall(true);
  }, [roomId, user, createOffer, handleOffer, handleAnswer, addIceCandidate, closePeerConnection]);

  useEffect(() => {
    const state = location.state;
    if (state?.roomId && !autoJoinAttempted.current) {
      autoJoinAttempted.current = true;
      setAppointmentDetails({
        patientName: state.patientName,
        appointmentTime: state.appointmentTime,
        appointmentId: state.appointmentId,
        roomId: state.roomId,
      });
      setRoomId(state.roomId);
      getLocalStream()
        .then(() => joinRoom(state.roomId))
        .catch((err) => {
          setMediaError(err?.message || "Could not access camera or microphone.");
          autoJoinAttempted.current = false;
        });
    }
  }, [location.state]);

  const handleStartCall = async () => {
    setMediaError(null);
    setMediaLoading(true);
    try {
      await getLocalStream();
      joinRoom(appointmentDetails?.roomId || undefined);
    } catch (err) {
      setMediaError(
        err?.message || "Could not access camera or microphone. Please allow permissions."
      );
    } finally {
      setMediaLoading(false);
    }
  };

  const handleLeaveCall = () => {
    if (socketRef.current) {
      socketRef.current.emit("leave-room");
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    closePeerConnection();
    stopLocalStream();
    mySocketIdRef.current = null;
    remoteSocketIdRef.current = null;
    setRemoteUserName(null);
    setRemoteUserId(null);
    setHasRemoteStream(false);
    setInCall(false);
    setMuted(false);
    setCameraOn(true);
    setMediaError(null);
    setConnectionState("new");
    autoJoinAttempted.current = false;
  };

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (stream) {
      const audio = stream.getAudioTracks()[0];
      if (audio) {
        audio.enabled = muted;
        setMuted(!muted);
      }
    }
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (stream) {
      const video = stream.getVideoTracks()[0];
      if (video) {
        video.enabled = cameraOn;
        setCameraOn(!cameraOn);
      }
    }
  };

  const {
    isRecording,
    recordingError,
    startRecording,
    stopRecording,
  } = useCallRecording(localVideoRef, remoteVideoRef);

  const handleStartRecording = () => {
    startRecording();
  };

  const handleStopRecording = async () => {
    const { blob, durationSeconds } = await stopRecording();
    if (!blob || blob.size === 0) return;
    const doctorId = user?.role === "doctor" || user?.role === "admin" ? user?.id : remoteUserId;
    const patientId = user?.role === "patient" ? user?.id : remoteUserId;
    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("video", blob, "recording.webm");
      form.append("doctorId", doctorId || "");
      form.append("patientId", patientId || "");
      form.append("roomId", roomId);
      form.append("durationSeconds", String(durationSeconds));
      await recordingService.upload(form);
    } catch (err) {
      setUploadError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [inCall]);

  return (
    <main className="page-container">
      <div className="page-header">
        <h1 className="page-title">Video consultation</h1>
        <p className="page-subtitle">
          Start or join a secure video call. Share the room ID with the other participant.
        </p>
      </div>

      <div className="dashboard-card relative min-h-[340px] max-w-5xl">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <h2 className="text-base font-semibold text-slate-900">Consultation room</h2>
          {!inCall && (
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Room ID (leave empty to create new)"
              className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          )}
          {inCall && (
            <span className="text-sm text-slate-500">
              Room: <strong className="text-slate-700">{roomId}</strong>
            </span>
          )}
        </div>
        <div className="p-6 lg:p-8">
          {!inCall ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-600 bg-slate-50 rounded-xl min-h-[260px] border border-slate-100">
              {appointmentDetails && (
                <div className="w-full max-w-md mb-4 p-3 rounded-lg bg-blue-50 border border-blue-100 text-left">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Consultation details</p>
                  <p className="text-sm text-slate-800"><span className="font-medium">Patient:</span> {appointmentDetails.patientName}</p>
                  <p className="text-sm text-slate-600"><span className="font-medium">Time:</span> {appointmentDetails.appointmentTime}</p>
                  <p className="text-sm text-slate-600"><span className="font-medium">Room:</span> {appointmentDetails.roomId}</p>
                </div>
              )}
              <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <FiVideo className="w-8 h-8 text-blue-600" />
              </div>
              <p className="font-semibold text-slate-800">No active call</p>
              <p className="text-sm text-slate-500 mt-1 mb-6 text-center max-w-sm">
                {appointmentDetails
                  ? "Click below to join the consultation room for this appointment."
                  : "Enter a room ID to join an existing call, or leave empty and click below to start a new consultation. Share the room ID with the doctor or patient."}
              </p>
              {mediaError && (
                <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg mb-4 border border-red-100">
                  {mediaError}
                </p>
              )}
              <button
                onClick={handleStartCall}
                disabled={mediaLoading}
                className="btn-primary py-3 px-6 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {mediaLoading ? "Requesting camera & microphone…" : "Start / Join call"}
              </button>
            </div>
          ) : (
            <>
              {appointmentDetails && (
                <div className="mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Current consultation
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <FiUser className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Patient name</p>
                        <p className="font-semibold text-slate-900">{appointmentDetails.patientName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiClock className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Appointment time</p>
                        <p className="font-semibold text-slate-900">{appointmentDetails.appointmentTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiHash className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Appointment ID</p>
                        <p className="font-semibold text-slate-900">{appointmentDetails.appointmentId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiMapPin className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Consultation room ID</p>
                        <p className="font-semibold text-slate-900 font-mono text-sm">{appointmentDetails.roomId}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div className="relative rounded-xl bg-slate-800 aspect-video overflow-hidden">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                  />
                  {!cameraOn && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-700 z-10">
                      <FiUser className="w-12 h-12 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-400">Camera off</span>
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-xs font-medium bg-black/50 text-white">
                    You {user?.name || "Guest"}
                  </span>
                </div>
                <div className="relative rounded-xl bg-slate-800 aspect-video overflow-hidden">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!hasRemoteStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-700 z-10 pointer-events-none">
                      <FiUser className="w-12 h-12 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-400">
                        {remoteUserName ? remoteUserName : "Waiting for peer…"}
                      </span>
                    </div>
                  )}
                  {(appointmentDetails || remoteUserName) && (
                    <span className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-medium bg-black/60 text-white flex items-center gap-1.5">
                      {appointmentDetails ? (
                        <>
                          <FiUser className="w-3.5 h-3.5 text-blue-300" />
                          Patient: {appointmentDetails.patientName}
                        </>
                      ) : (
                        remoteUserName
                      )}
                    </span>
                  )}
                </div>
              </div>

              {(recordingError || uploadError) && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">
                  {recordingError || uploadError}
                </p>
              )}
              <div className="flex items-center justify-center gap-3 py-4 px-4 rounded-xl bg-slate-100 border border-slate-200 flex-wrap">
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    disabled={!hasRemoteStream || uploading}
                    className="p-3 rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 transition disabled:opacity-50"
                    title="Start recording"
                  >
                    <FiCircle className="w-5 h-5 text-red-500 fill-red-500" />
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    disabled={uploading}
                    className="p-3 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition disabled:opacity-50"
                    title="Stop and save recording"
                  >
                    <FiSquare className="w-5 h-5 fill-current" />
                  </button>
                )}
                <button
                  onClick={toggleMute}
                  className={`p-3 rounded-full transition ${
                    muted ? "bg-red-100 text-red-600" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                  title={muted ? "Unmute" : "Mute"}
                >
                  {muted ? <FiMicOff className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
                </button>
                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-full transition ${
                    !cameraOn
                      ? "bg-red-100 text-red-600"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                  title={cameraOn ? "Turn off camera" : "Turn on camera"}
                >
                  {cameraOn ? <FiVideo className="w-5 h-5" /> : <FiVideoOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleLeaveCall}
                  className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition flex items-center gap-2"
                  title="End call"
                >
                  <FiPhone className="w-4 h-4 rotate-[135deg]" />
                  End call
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
