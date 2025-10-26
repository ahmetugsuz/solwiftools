import React from 'react';
import '../styles/GridBackground.css';

const GridBackground = () => {
  // More radial lines and concentric arcs for a denser grid
  const radialLines = 26; // Keep the same number of lines
  const concentricArcs = 12; // Keep the same number of arcs
  
  return (
    <div className="grid-background-wrapper">
      <div className="grid-background">
        <div className="grid-container">
          {/* Radial lines - covering full 180 degrees */}
          {Array.from({ length: radialLines }).map((_, i) => {
            // Distribute lines evenly across 180 degrees
            const angle = (i * (360 / (radialLines - 1))) - 240;
            return (
              <div 
                key={`radial-${i}`} 
                className="grid-line radial" 
                style={{ 
                  transform: `rotate(${angle}deg)`,
                }}
              />
            );
          })}
          
          {/* Concentric arcs - more of them for density */}
          {Array.from({ length: concentricArcs }).map((_, i) => {
            // Smaller increments for more arcs
            const size = 40 + (i * 8);
            return (
              <div 
                key={`arc-${i}`} 
                className="grid-arc" 
                style={{ 
                  height: `${size}vh`,
                  width: `${size * 1.8}vh`, // Make arcs wider
                }}
              />
            );
          })}
        </div>
        
        {/* Enhanced curved glowing line */}
        <div className="enhanced-glow">
          {/* Bright edge line */}
          <div className="glow-edge"></div>
          
          {/* Soft gradient glow */}
          <div className="glow-gradient"></div>
        </div>
      </div>
    </div>
  );
};

export default GridBackground; 