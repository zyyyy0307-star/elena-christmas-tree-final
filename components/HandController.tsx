import React, { useEffect, useRef } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useStore } from '../store';

const HandController: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { setExpansion, setIsTracking } = useStore();
  const lastVideoTime = useRef(-1);
  const requestRef = useRef<number>(0);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);

  useEffect(() => {
    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        startWebcam();
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
      }
    };

    const startWebcam = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 320, height: 240, facingMode: "user" } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.addEventListener("loadeddata", predictWebcam);
            }
        }
    };

    initMediaPipe();

    return () => {
        cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const predictWebcam = () => {
    if (!handLandmarkerRef.current || !videoRef.current) return;

    if (videoRef.current.currentTime !== lastVideoTime.current) {
      lastVideoTime.current = videoRef.current.currentTime;
      const startTimeMs = performance.now();
      
      const result = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

      if (result.landmarks && result.landmarks.length > 0) {
        setIsTracking(true);
        const landmarks = result.landmarks[0];
        
        // --- EXPANSION (OPEN HAND) LOGIC ---
        // Calculate average distance of fingertips from wrist to determine if hand is open
        const wrist = landmarks[0];
        const tips = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky tips
        let totalDist = 0;

        tips.forEach(tipIdx => {
           const tip = landmarks[tipIdx];
           const dx = tip.x - wrist.x;
           const dy = tip.y - wrist.y;
           const dz = tip.z - wrist.z;
           totalDist += Math.sqrt(dx*dx + dy*dy + dz*dz);
        });
        
        const avgDist = totalDist / 5;
        const minClosed = 0.15;
        const maxOpen = 0.35;
        
        let openness = (avgDist - minClosed) / (maxOpen - minClosed);
        openness = Math.max(0, Math.min(1, openness));
        setExpansion(openness);

      } else {
        setIsTracking(false);
        setExpansion(0);
      }
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="absolute top-4 left-4 z-50 opacity-0 pointer-events-none">
       {/* Hidden video element for processing */}
      <video ref={videoRef} autoPlay playsInline muted className="w-32 h-24" />
    </div>
  );
};

export default HandController;