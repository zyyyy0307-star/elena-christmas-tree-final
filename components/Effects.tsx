import React from 'react';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

const Effects: React.FC = () => {
  return (
    <EffectComposer disableNormalPass>
      <Bloom 
        // Threshold: 0.2 means pixels with >20% brightness will bloom. 
        // Combined with low intensity, this creates a soft haze rather than a hard cutoff.
        luminanceThreshold={0.2} 
        mipmapBlur 
        // Intensity: Reduced to 0.4 to stop the "blinding" effect.
        intensity={0.4} 
        radius={0.8} 
        levels={8}
      />
    </EffectComposer>
  );
};

export default Effects;