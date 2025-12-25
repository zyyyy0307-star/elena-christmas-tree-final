import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';

// --- SHADERS FOR THE HELIX LIGHTS ---
const vertexShader = `
  uniform float uTime;
  uniform float uExpansion;
  
  attribute vec3 aRandomPos;
  attribute float aSize;
  attribute float aAlpha;
  
  varying float vAlpha;

  void main() {
    vAlpha = aAlpha;
    
    vec3 stablePos = position;
    
    // Expansion Logic: Explode from spiral to random chaos
    vec3 finalPos = mix(stablePos, aRandomPos, uExpansion);

    // Subtle breathing animation when assembled
    if (uExpansion < 0.1) {
      float breathe = sin(uTime * 2.0 + position.y) * 0.02; 
      finalPos.x += finalPos.x * breathe;
      finalPos.z += finalPos.z * breathe;
    }

    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    
    // Size attenuation
    gl_PointSize = aSize * (200.0 / -mvPosition.z); 
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying float vAlpha;

  void main() {
    // Sharp circular particle with glow
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;

    // Golden Glow Gradient - DIMMED
    vec3 colorGold = vec3(0.5, 0.35, 0.05); 
    vec3 colorWhite = vec3(0.7, 0.7, 0.6);
    
    float glow = 1.0 - (r * 2.0); // 0 to 1
    glow = pow(glow, 2.5); // sharper falloff

    vec3 finalColor = mix(colorGold, colorWhite, glow * 0.7);

    // Reduced overall alpha
    gl_FragColor = vec4(finalColor, vAlpha * 0.6);
  }
`;

const TreeParticles: React.FC = () => {
  const meshRef = useRef<THREE.Points>(null);
  const expansionTarget = useStore((state) => state.expansion);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uExpansion: { value: 0 }
  }), []);

  // Generate The Helix Spiral
  const { positions, randomPositions, sizes, alphas } = useMemo(() => {
    const count = 1200; 
    const positions = new Float32Array(count * 3);
    const randomPositions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);

    const height = 14;
    const loops = 8;
    const maxRadius = 5;

    for (let i = 0; i < count; i++) {
      // Normalized height (0 bottom to 1 top)
      const t = i / count; 
      
      // Spiral Math
      const angle = t * loops * Math.PI * 2;
      const radius = (1.0 - t) * maxRadius; 
      
      // TIGHT SPREAD
      const spread = 0.05; 
      const randomOffset = () => (Math.random() - 0.5) * spread;

      const x = Math.cos(angle) * radius + randomOffset();
      const y = (t * height) - (height / 2) - 1; 
      const z = Math.sin(angle) * radius + randomOffset();

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Random Chaos Positions (Explosion state)
      const rDist = 12 + Math.random() * 8;
      const rTheta = Math.random() * Math.PI * 2;
      const rPhi = Math.acos((Math.random() * 2) - 1);
      
      randomPositions[i * 3] = rDist * Math.sin(rPhi) * Math.cos(rTheta);
      randomPositions[i * 3 + 1] = rDist * Math.sin(rPhi) * Math.sin(rTheta);
      randomPositions[i * 3 + 2] = rDist * Math.cos(rPhi);

      // Visual Props - FINE DUST SIZE
      // Previous: 4.0 + Math.random() * 4.0
      // New: 1.5 + Math.random() * 2.5 (Much finer, sand-like texture)
      sizes[i] = 1.5 + Math.random() * 2.5; 
      alphas[i] = 0.6 + Math.random() * 0.4; 
    }

    return { positions, randomPositions, sizes, alphas };
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      uniforms.uTime.value += delta;
      
      // Smooth interpolation for gesture
      uniforms.uExpansion.value = THREE.MathUtils.damp(
        uniforms.uExpansion.value, 
        expansionTarget, 
        2.5, 
        delta
      );
      
      // Rotate the entire tree slowly
      if (uniforms.uExpansion.value < 0.8) {
         meshRef.current.rotation.y -= delta * 0.15 * (1.0 - uniforms.uExpansion.value);
      }
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandomPos"
          count={randomPositions.length / 3}
          array={randomPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aAlpha"
          count={alphas.length}
          array={alphas}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
      />
    </points>
  );
};

export default TreeParticles;