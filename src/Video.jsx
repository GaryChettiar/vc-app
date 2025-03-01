import React, { useEffect, useRef } from "react";
import socket from "./socket";

const Video = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);

  useEffect(() => {
    const getUserMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        console.log("Local Stream:", stream); // ✅ Debug log

        localVideoRef.current.srcObject = stream; // 🛑 This line was missing
        localVideoRef.current.muted = true; // Optional to avoid echo

        peerConnection.current = new RTCPeerConnection();

        stream.getTracks().forEach((track) =>
          peerConnection.current.addTrack(track, stream)
        );

        peerConnection.current.ontrack = (event) => {
          console.log("Remote Stream:", event.streams[0]); // ✅ Debug log
          remoteVideoRef.current.srcObject = event.streams[0]; // 🛑 This is the remote video
        };

        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("candidate", event.candidate);
          }
        };

        socket.on("offer", async (offer) => {
          console.log("Offer Received");
          await peerConnection.current.setRemoteDescription(offer);
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          socket.emit("answer", answer);
        });

        socket.on("answer", (answer) => {
          console.log("Answer Received");
          peerConnection.current.setRemoteDescription(answer);
        });

        socket.on("candidate", (candidate) => {
          console.log("ICE Candidate Received");
          peerConnection.current.addIceCandidate(candidate);
        });

        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        socket.emit("offer", offer);
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    };

    getUserMedia();
  }, []);

  return (
    <div style={{ display: "flex", gap: "20px" }}>
      <div>
        <h2>📸 You</h2>
        <video ref={localVideoRef} autoPlay playsInline width="300" />
      </div>
      <div>
        <h2>👤 Remote</h2>
        <video ref={remoteVideoRef} autoPlay playsInline width="300" />
      </div>
    </div>
  );
};

export default Video;
