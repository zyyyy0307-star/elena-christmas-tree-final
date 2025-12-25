import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';

const TopStar: React.FC = () => {
  const meshRef = useRef<THREE.Group>(null);
  const expansion = useStore((state) => state.expansion);

  // Create a 5-pointed Star Shape
  const starGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.8;
    const innerRadius = 0.35; // Tighter inner radius for sharper points
    
    // Start from top point (rotated -PI/2 conceptually in shape space, handled by loop)
    for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - (Math.PI / 2); // Start at top
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
    }
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.05,
      bevelSegments: 2
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
        const t = state.clock.getElapsedTime();
        // Hover vertically
        meshRef.current.position.y = 6.8 + Math.sin(t * 1.5) * 0.15;
        // Spin slowly
        meshRef.current.rotation.y = t * 0.5;
        
        // Hide during chaos gesture
        const targetScale = expansion > 0.5 ? 0 : 1;
        meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <group ref={meshRef} position={[0, 6.5, 0]}>
        {/* The Star Mesh */}
        <mesh geometry={starGeometry}>
            <meshStandardMaterial 
                color="#FFD700" 
                emissive="#FFD700"
                emissiveIntensity={2.0}
                toneMapped={false}
                roughness={0.1}
                metalness={1.0}
            />
        </mesh>

        {/* Trail Effect - Anchored to center */}
        <Trail 
            width={2} 
            length={8} 
            color={new THREE.Color("#FFD700")} 
            attenuation={(t) => t * t}
        >
            <mesh visible={false}>
                <boxGeometry args={[0.1, 0.1, 0.1]} />
            </mesh>
        </Trail>
        
        {/* Core Glow Light */}
        <pointLight distance={15} intensity={3} color="#FFD700" decay={2} />
    </group>
  );
};

export default TopStar;