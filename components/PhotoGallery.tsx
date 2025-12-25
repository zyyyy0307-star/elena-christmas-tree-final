import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';

const PHOTO_URLS = [
  "https://raw.githubusercontent.com/zyyyy0307-star/christmas-music/main/p1.jpg",
  "https://raw.githubusercontent.com/zyyyy0307-star/christmas-music/main/p2.jpg",
  "https://raw.githubusercontent.com/zyyyy0307-star/christmas-music/main/p3.jpg",
  "https://raw.githubusercontent.com/zyyyy0307-star/christmas-music/main/p4.jpg",
  "https://raw.githubusercontent.com/zyyyy0307-star/christmas-music/main/p5.jpg",
  "https://raw.githubusercontent.com/zyyyy0307-star/christmas-music/main/p6.jpg",
  "https://raw.githubusercontent.com/zyyyy0307-star/christmas-music/main/p7.jpg",
  "https://raw.githubusercontent.com/zyyyy0307-star/christmas-music/main/p8.jpg",
  "https://raw.githubusercontent.com/zyyyy0307-star/christmas-music/main/p9.jpg",
  "https://raw.githubusercontent.com/zyyyy0307-star/christmas-music/main/p10.jpg"
];

// Chaos Logic: Map ALL URLs to CENTERED positions
const PHOTOS = PHOTO_URLS.map((url, i) => {
    // New Centered Scatter Logic
    // X: -6 to +6
    const x = (Math.random() - 0.5) * 12;
    // Y: -4 to +8
    const y = (Math.random() * 12) - 4;
    // Z: -5 to +5
    const z = (Math.random() - 0.5) * 10;
    
    return {
        id: (i + 1).toString(),
        url: url,
        pos: [x, y, z] as [number, number, number]
    };
});

interface PolaroidProps {
  id: string;
  url: string;
  position: [number, number, number];
  onClick: () => void;
  shouldShow: boolean;
}

const Polaroid: React.FC<PolaroidProps> = ({ id, url, position, onClick, shouldShow }) => {
  const groupRef = useRef<THREE.Group>(null);
  const frameMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const imageRef = useRef<any>(null);
  
  const [hovered, setHovered] = useState(false);
  
  // Opacity state
  const currentOpacity = useRef(0);
  
  // Random Drift parameters for Floating Animation
  const driftSpeed = useMemo(() => 0.5 + Math.random() * 0.5, []);
  const driftOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state, delta) => {
    // 1. Handle Opacity
    const targetOpacity = shouldShow ? 1 : 0;
    currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, targetOpacity, delta * 3);
    const isVisible = currentOpacity.current > 0.01;

    // Apply Opacity
    if (frameMatRef.current) {
        frameMatRef.current.opacity = currentOpacity.current;
        frameMatRef.current.visible = isVisible;
    }
    if (imageRef.current && imageRef.current.material) {
        imageRef.current.material.opacity = currentOpacity.current;
        imageRef.current.visible = isVisible;
    }

    // 2. Position, Orientation & Floating Animation
    if (groupRef.current) {
      groupRef.current.lookAt(state.camera.position);
      
      // FLOATING EFFECT: Bob up and down using Sine wave
      const t = state.clock.getElapsedTime();
      const floatY = Math.sin(t * driftSpeed + driftOffset) * 0.5; // +/- 0.5 units
      groupRef.current.position.y = position[1] + floatY;

      // Scale Interaction - dependent on opacity to prevent interacting with invisible items
      const isInteractable = currentOpacity.current > 0.5;
      const targetScale = (isInteractable && hovered) ? 1.3 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      
      // Cull invisible objects
      groupRef.current.visible = isVisible;
    }
  });

  return (
    <group 
      ref={groupRef} 
      position={position} 
      onClick={(e) => { 
        // CRITICAL LOGIC: If hand is not open (shouldShow is false), return immediately.
        // Also check actual opacity to prevent clicking fading out items.
        if (!shouldShow || currentOpacity.current < 0.5) return;
        
        e.stopPropagation(); 
        onClick(); 
      }}
      onPointerOver={() => {
          if (shouldShow && currentOpacity.current > 0.5) {
              setHovered(true);
              document.body.style.cursor = 'pointer';
          }
      }}
      onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
      }}
    >
      {/* Polaroid Frame - Using MeshBasicMaterial to ensure it stays white in dark scene */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.2, 1.5]} />
        <meshBasicMaterial 
            ref={frameMatRef}
            color="#ffffff" 
            transparent={true}
            opacity={0}
        />
      </mesh>
      
      {/* Photo Texture */}
      <Image 
        ref={imageRef}
        url={url} 
        position={[0, 0.1, 0]} 
        scale={[1, 1]} 
        transparent={true}
        opacity={0}
      />
    </group>
  );
};

const PhotoGallery: React.FC = () => {
  const setFocusedPhotoId = useStore((state) => state.setFocusedPhotoId);
  const setFocusedPhotoUrl = useStore((state) => state.setFocusedPhotoUrl);
  const focusedPhotoId = useStore((state) => state.focusedPhotoId);
  
  const visitedPhotoIds = useStore((state) => state.visitedPhotoIds);
  const addVisitedPhotoId = useStore((state) => state.addVisitedPhotoId);
  const setFinalePending = useStore((state) => state.setFinalePending);
  
  const expansion = useStore((state) => state.expansion);
  const [shouldShow, setShouldShow] = useState(false);

  // Hysteresis Logic for Stability
  useFrame(() => {
      if (!shouldShow && expansion > 0.7) {
          setShouldShow(true);
      } else if (shouldShow && expansion < 0.4) {
          setShouldShow(false);
      }
  });

  const handlePhotoClick = (id: string, url: string) => {
    if (focusedPhotoId === id) return;
    setFocusedPhotoId(id);
    setFocusedPhotoUrl(url);

    // FINALE LOGIC: Track clicks
    if (!visitedPhotoIds.includes(id)) {
        addVisitedPhotoId(id);
        // Check if this was the last photo needed (length + 1 because the state update is pending)
        // If it is the last one, mark finale as PENDING. It will trigger when closed.
        if (visitedPhotoIds.length + 1 === PHOTOS.length) {
            setFinalePending(true);
        }
    }
  };

  return (
    <group>
      {PHOTOS.map((photo) => (
        <Polaroid
          key={photo.id}
          id={photo.id}
          url={photo.url}
          position={photo.pos}
          onClick={() => handlePhotoClick(photo.id, photo.url)}
          shouldShow={shouldShow}
        />
      ))}
    </group>
  );
};

export default PhotoGallery;