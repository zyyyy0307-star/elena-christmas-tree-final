import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';

const Ornaments: React.FC = () => {
  const boxRef = useRef<THREE.InstancedMesh>(null);
  const starRef = useRef<THREE.InstancedMesh>(null);
  const expansion = useStore((state) => state.expansion);
  
  const { boxData, starData } = useMemo(() => {
    const boxCount = 25;
    const starCount = 35;
    
    const generateSpiralPoints = (count: number, offsetPhase: number) => {
        const data = [];
        const height = 14;
        const loops = 8;
        const maxRadius = 5;

        for (let i = 0; i < count; i++) {
            const t = (i / count);
            // Add phase offset so boxes and stars aren't on top of each other
            const angle = (t * loops * Math.PI * 2) + offsetPhase; 
            const radius = (1.0 - t) * maxRadius;
            
            const x = Math.cos(angle) * radius;
            const y = (t * height) - (height / 2) - 1;
            const z = Math.sin(angle) * radius;
            
            // Random scatter position for chaos mode
            const rX = (Math.random() - 0.5) * 20;
            const rY = (Math.random() - 0.5) * 20;
            const rZ = (Math.random() - 0.5) * 20;

            data.push({ 
                pos: new THREE.Vector3(x, y, z), 
                scatter: new THREE.Vector3(rX, rY, rZ),
                rot: new THREE.Euler(Math.random(), Math.random(), Math.random()),
                scale: Math.random() * 0.3 + 0.2
            });
        }
        return data;
    };

    return { 
        boxData: generateSpiralPoints(boxCount, 0), 
        starData: generateSpiralPoints(starCount, Math.PI) 
    };
  }, []);

  const dummy = new THREE.Object3D();

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const currentExpansion = THREE.MathUtils.lerp(0, 1, expansion);

    // Update Boxes (Gifts)
    if (boxRef.current) {
        boxData.forEach((data, i) => {
            const { pos, scatter, rot, scale } = data;
            
            // Mix between spiral pos and scatter pos
            dummy.position.lerpVectors(pos, scatter, currentExpansion);
            
            // Bobbing animation
            dummy.position.y += Math.sin(time * 2 + i) * 0.1 * (1 - currentExpansion);

            dummy.rotation.copy(rot);
            dummy.rotation.y += time * 0.5;
            dummy.rotation.x += time * 0.2;
            
            dummy.scale.setScalar(scale);
            dummy.updateMatrix();
            boxRef.current!.setMatrixAt(i, dummy.matrix);
        });
        boxRef.current.rotation.y -= delta * 0.15 * (1.0 - currentExpansion);
        boxRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update Stars (Snowflakes)
    if (starRef.current) {
        starData.forEach((data, i) => {
            const { pos, scatter, rot, scale } = data;
            
            dummy.position.lerpVectors(pos, scatter, currentExpansion);
            dummy.position.y += Math.sin(time * 3 + i) * 0.05 * (1 - currentExpansion);

            dummy.rotation.copy(rot);
            dummy.rotation.z += time;
            
            dummy.scale.setScalar(scale * 0.8);
            dummy.updateMatrix();
            starRef.current!.setMatrixAt(i, dummy.matrix);
        });
        starRef.current.rotation.y -= delta * 0.15 * (1.0 - currentExpansion);
        starRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Gift Boxes: Metallic Gold */}
      <instancedMesh ref={boxRef} args={[undefined, undefined, boxData.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
            color="#D4AF37" 
            metalness={0.9} 
            roughness={0.2} 
            emissive="#8A6C1E"
            emissiveIntensity={0.5}
        />
      </instancedMesh>

      {/* Snowflakes: Glowing White/Blue tint */}
      <instancedMesh ref={starRef} args={[undefined, undefined, starData.length]}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>
    </group>
  );
};

export default Ornaments;