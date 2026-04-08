import { useRef, useCallback, useState, useEffect } from "react";

const FPS = 30;
const MIME = "video/webm;codecs=vp9,opus";

export function useCallRecording(localVideoRef, remoteVideoRef) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const startTimeRef = useRef(0);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        setIsRecording(false);
        resolve({ blob: null, durationSeconds: 0 });
        return;
      }
      const durationSeconds = (Date.now() - startTimeRef.current) / 1000;
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        mediaRecorderRef.current = null;
        chunksRef.current = [];
        setIsRecording(false);
        resolve({ blob, durationSeconds });
      };
      recorder.stop();
    });
  }, []);

  const startRecording = useCallback(() => {
    setRecordingError(null);
    const localVideo = localVideoRef?.current;
    const remoteVideo = remoteVideoRef?.current;
    if (!localVideo || !remoteVideo) {
      setRecordingError("Video elements not ready");
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setRecordingError("Canvas not supported");
      return null;
    }

    const drawFrame = () => {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (remoteVideo.srcObject && remoteVideo.videoWidth > 0) {
        ctx.drawImage(remoteVideo, 0, 0, canvas.width, canvas.height);
      }
      const pw = 280;
      const ph = 210;
      const margin = 16;
      if (localVideo.srcObject && localVideo.videoWidth > 0) {
        ctx.save();
        ctx.translate(canvas.width - margin - pw, canvas.height - margin - ph);
        ctx.scale(-1, 1);
        ctx.drawImage(localVideo, 0, 0, pw, ph);
        ctx.restore();
      }
      animationRef.current = requestAnimationFrame(drawFrame);
    };

    try {
      const stream = canvas.captureStream(FPS);
      streamRef.current = stream;
      const localStream = localVideo.srcObject;
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) stream.addTrack(audioTrack);
      }
      const remoteStream = remoteVideo.srcObject;
      if (remoteStream) {
        const audioTrack = remoteStream.getAudioTracks()[0];
        if (audioTrack && !stream.getAudioTracks().length) stream.addTrack(audioTrack);
      }

      const mime = MediaRecorder.isTypeSupported(MIME) ? MIME : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2500000 });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      startTimeRef.current = Date.now();
      drawFrame();
      setIsRecording(true);
      return () => stopRecording();
    } catch (err) {
      setRecordingError(err?.message || "Failed to start recording");
      return null;
    }
  }, [localVideoRef, remoteVideoRef, stopRecording]);

  useEffect(() => {
    return () => stopRecording();
  }, [stopRecording]);

  return {
    isRecording,
    recordingError,
    startRecording,
    stopRecording,
  };
}
