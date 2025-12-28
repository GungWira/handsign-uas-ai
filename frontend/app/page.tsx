"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [prediction, setPrediction] = useState<string>("—");
  const [confidence, setConfidence] = useState<string>("—");

  // 3️⃣ Jepret & kirim ke backends
  const captureAndSend = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx?.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      formData.append("file", blob, "capture.jpg");

      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setPrediction(data.prediction);
      setConfidence(data.confidence);
    }, "image/jpeg");
  };

  // 1️⃣ Aktifkan kamera
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });

    // 2️⃣ Listen tombol spasi
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        captureAndSend();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <main style={styles.container}>
      <h1>Hand Sign Recognition</h1>

      {/* Kamera */}
      <div style={styles.cameraWrapper}>
        <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
      </div>

      {/* Hasil */}
      <div style={styles.resultBox}>
        Detected Letter: <strong>{prediction}</strong>
        <br />
        Confidence : {confidence}
      </div>

      {/* Canvas tersembunyi */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <p style={{ marginTop: 20 }}>
        Tekan <b>SPACE</b> untuk mengambil gambar
      </p>
    </main>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  cameraWrapper: {
    width: 320,
    height: 240,
    borderRadius: 12,
    overflow: "hidden",
    border: "3px solid #333",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    transform: "scaleX(-1)", // MIRROR EFFECT
  },
  resultBox: {
    width: 320,
    padding: 16,
    textAlign: "center" as const,
    border: "2px dashed #555",
    borderRadius: 10,
    fontSize: 20,
  },
};
