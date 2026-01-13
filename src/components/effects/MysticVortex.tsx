import React from 'react';

const MysticVortex = () => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
      <div className="vortex-container">
        <div className="vortex-shape vortex-1"></div>
        <div className="vortex-shape vortex-2"></div>
      </div>

      <svg width="0" height="0">
        <filter id="vortex-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01 0.01"
            numOctaves="2"
            result="turbulence"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="turbulence"
            scale="150"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
    </div>
  );
};

export default MysticVortex;

    