import { useRef, useCallback, useEffect } from "react";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function useWebRTC(localStreamRef, { onRemoteStream, onConnectionStateChange, onIceCandidate } = {}) {
  const peerConnectionRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const closePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
    }
    onRemoteStream?.(null);
    onConnectionStateChange?.("closed");
  }, [onRemoteStream, onConnectionStateChange]);

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) return peerConnectionRef.current;
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    remoteStreamRef.current = new MediaStream();

    pc.ontrack = (e) => {
      if (e.streams?.[0]) {
        e.streams[0].getTracks().forEach((t) => remoteStreamRef.current.addTrack(t));
        onRemoteStream?.(remoteStreamRef.current);
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) onIceCandidate?.(e.candidate);
    };

    pc.oniceconnectionstatechange = () => {
      onConnectionStateChange?.(pc.iceConnectionState);
      if (["disconnected", "failed", "closed"].includes(pc.iceConnectionState)) {
        closePeerConnection();
      }
    };

    const localStream = localStreamRef?.current;
    if (localStream) {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    }
    peerConnectionRef.current = pc;
    return pc;
  }, [localStreamRef, onRemoteStream, onConnectionStateChange, onIceCandidate, closePeerConnection]);

  const addLocalStreamToPeer = useCallback((pc) => {
    const localStream = localStreamRef?.current;
    if (localStream && pc) {
      pc.getSenders().length === 0 &&
        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    }
  }, [localStreamRef]);

  const createOffer = useCallback(async () => {
    const pc = createPeerConnection();
    addLocalStreamToPeer(pc);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  }, [createPeerConnection, addLocalStreamToPeer]);

  const handleOffer = useCallback(async (offer) => {
    let pc = peerConnectionRef.current;
    if (!pc) pc = createPeerConnection();
    addLocalStreamToPeer(pc);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }, [createPeerConnection, addLocalStreamToPeer]);

  const handleAnswer = useCallback(async (answer) => {
    const pc = peerConnectionRef.current;
    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }, []);

  const addIceCandidate = useCallback(async (candidate) => {
    if (!candidate) return;
    const pc = peerConnectionRef.current;
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn("addIceCandidate error", e);
      }
    }
  }, []);

  useEffect(() => {
    return () => closePeerConnection();
  }, [closePeerConnection]);

  return {
    createOffer,
    handleOffer,
    handleAnswer,
    addIceCandidate,
    closePeerConnection,
  };
}
