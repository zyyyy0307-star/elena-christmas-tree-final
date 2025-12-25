import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- WAVY FLOOR SHADERS ---
const floorVertexShader = `
  uniform float uTime;
  varying float vElevation;

  void main() {
    vec3 pos = position;
    
    // Sine wave calculation for "Ocean" effect
    float frequency = 0.2;
    float amplitude = 0.8;
    
    float elevation = sin(pos.x * frequency + uTime * 0.5) * sin(pos.z * frequency + uTime * 0.3) * amplitude;
    
    pos.y += elevation;
    vElevation = elevation;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 2.0 * (50.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const floorFragmentShader = `
  varying float vElevation;

  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;

    // Darker gold base to prevent bloom blowout
    // Dimmed values:
    vec3 deepGold = vec3(0.1, 0.05, 0.0);
    vec3 brightGold = vec3(0.4, 0.3, 0.05);
    
    vec3 color = mix(deepGold, brightGold, (vElevation + 0.5));
    float alpha = 0.4 - (r * 1.0); // Reduced alpha

    gl_FragColor = vec4(color, alpha);
  }
`;

// --- SNOW SHADERS (Gentle Flurry) ---
const snowVertexShader = `
  uniform float uTime;
  attribute float aSpeed;
  attribute float aOffset;
  attribute float aSize;
  
  void main() {
    vec3 pos = position;
    
    // Fall down calculation
    float fall = mod(uTime * aSpeed + aOffset, 30.0); 
    pos.y = 15.0 - fall; // Start high, fall to -15

    // Sway
    pos.x += sin(uTime * 0.5 + aOffset) * 0.5;
    pos.z += cos(uTime * 0.3 + aOffset) * 0.5;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Size attenuation
    gl_PointSize = aSize * (300.0 / -mvPosition.z); 
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const snowFragmentShader = `
  void main() {
    // Soft Flake
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    
    float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
    
    // Dimmed snow
    gl_FragColor = vec4(0.8, 0.8, 0.9, alpha * 0.5);
  }
`;

const World: React.FC = () => {
  const floorRef = useRef<THREE.Points>(null);
  const snowRef = useRef<THREE.Points>(null);
  
  const floorUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const snowUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  // Wavy Floor Data
  const floorData = useMemo(() => {
    const size = 60; 
    const count = size * size;
    const positions = new Float32Array(count * 3);
    const scale = 2; 
    
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const idx = (i * size + j) * 3;
            positions[idx] = (i - size/2) * scale;
            positions[idx+1] = -8; 
            positions[idx+2] = (j - size/2) * scale;
        }
    }
    return positions;
  }, []);

  // Snow Data
  const { snowPos, snowSpeed, snowOffset, snowSize } = useMemo(() => {
    const count = 60; 
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const offsets = new Float32Array(count);
    const sizes = new Float32Array(count);
    
    for(let i=0; i<count; i++) {
        positions[i*3] = (Math.random() - 0.5) * 40;
        positions[i*3+1] = 0; 
        positions[i*3+2] = (Math.random() - 0.5) * 30; 
        
        speeds[i] = 1.5 + Math.random() * 2.0; 
        offsets[i] = Math.random() * 30.0;
        // GENTLE FLURRY SIZE
        // Previous: 6.0 to 12.0
        // New: 2.0 to 4.0 (Small, subtle flakes)
        sizes[i] = 2.0 + Math.random() * 2.0; 
    }
    return { snowPos: positions, snowSpeed: speeds, snowOffset: offsets, snowSize: sizes };
  }, []);

  useFrame((state, delta) => {
    floorUniforms.uTime.value += delta;
    snowUniforms.uTime.value += delta;
  });

  return (
    <group>
        {/* Wavy Floor */}
        <points ref={floorRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={floorData.length/3} array={floorData} itemSize={3} />
            </bufferGeometry>
            <shaderMaterial 
                vertexShader={floorVertexShader}
                fragmentShader={floorFragmentShader}
                uniforms={floorUniforms}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>

        {/* Big Snow Flakes */}
        <points ref={snowRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={snowPos.length/3} array={snowPos} itemSize={3} />
                <bufferAttribute attach="attributes-aSpeed" count={snowSpeed.length} array={snowSpeed} itemSize={1} />
                <bufferAttribute attach="attributes-aOffset" count={snowOffset.length} array={snowOffset} itemSize={1} />
                <bufferAttribute attach="attributes-aSize" count={snowSize.length} array={snowSize} itemSize={1} />
            </bufferGeometry>
            <shaderMaterial 
                vertexShader={snowVertexShader}
                fragmentShader={snowFragmentShader}
                uniforms={snowUniforms}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    </group>
  );
};

export default World;