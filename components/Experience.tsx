import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import TreeParticles from './TreeParticles';
import PhotoGallery from './PhotoGallery';
import Effects from './Effects';
import World from './World';
import TopStar from './TopStar';
import Ornaments from './Ornaments';
import { useStore } from '../store';

const SceneContent = () => {
  const setFocusedPhotoId = useStore((state) => state.setFocusedPhotoId);
  const isFinale = useStore((state) => state.isFinale);

  return (
    <>
      {/* Background: Deep Christmas Green - Always Visible */}
      <color attach="background" args={['#0F3015']} />
      
      {/* Conditionally render the entire 3D experience based on Finale State */}
      {!isFinale && (
        <>
          {/* Lighting - Dimmed significantly for romantic atmosphere */}
          <ambientLight intensity={0.05} />
          
          {/* Main Gold Light - Reduced intensity */}
          <pointLight position={[5, 5, 5]} intensity={0.8} color="#FFD700" distance={20} decay={2} />
          
          {/* Fill Light (Warm) - Very subtle */}
          <pointLight position={[-5, 0, 5]} intensity={0.3} color="#FF8C00" distance={20} decay={2} />
          
          {/* Back Light (Cool) - Just an outline */}
          <pointLight position={[0, -5, -5]} intensity={0.2} color="#FFFFFF" distance={20} decay={2} />

          {/* The Main Attraction: Golden Helix */}
          <group position={[0, 0, 0]}>
            <TreeParticles />
            <Ornaments />
            <TopStar />
            <PhotoGallery />
          </group>

          {/* Environment */}
          <World />

          {/* Interactions */}
          <OrbitControls 
            enablePan={false} 
            minDistance={5} 
            maxDistance={20} 
            maxPolarAngle={Math.PI / 2 + 0.1} // Limit so user can't look under the floor too much
            makeDefault
          />
          
          <Effects />

          {/* Click-away handler plane */}
          <mesh 
            position={[0, 0, 0]} 
            rotation={[-Math.PI/2, 0, 0]} // Flat on floor
            visible={false} 
            onClick={() => setFocusedPhotoId(null)}
          >
            <planeGeometry args={[100, 100]} />
            <meshBasicMaterial />
          </mesh>
        </>
      )}
    </>
  );
};

const Experience: React.FC = () => {
  return (
    <Canvas
      camera={{ position: [0, 2, 14], fov: 50 }}
      dpr={[1, 2]}
      gl={{ 
        antialias: false, 
        // Global Dimming: Reduced from 0.6 to 0.35 for deep night feel
        toneMappingExposure: 0.35, 
        powerPreference: "high-performance"
      }} 
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
};

export default Experience;