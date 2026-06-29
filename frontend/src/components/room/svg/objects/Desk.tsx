import React from 'react';

/**
 * Desk SVG component
 * Renders the foundational desk surface, foreground edge, and the lower wall gradient
 */
export function Desk() {
  return (
    <g id="desk-group">
      {/* Lower wall shading behind desk to anchor it */}
      <rect x="0" y="450" width="1920" height="200" fill="var(--sf-room-wall-warm)" opacity="0.6" />
      
      {/* Main Desk Surface (slanted perspective) */}
      <polygon 
        points="-100,1150 200,600 1720,600 2020,1150" 
        fill="var(--sf-room-desk)" 
      />
      
      {/* Desk surface subtle highlights (to simulate wood grain or light spill) */}
      <polygon 
        points="400,1150 500,600 1200,600 1300,1150" 
        fill="var(--sf-room-desk-highlight)" 
        opacity="0.15" 
      />
      <polygon 
        points="900,1150 800,600 1500,600 1600,1150" 
        fill="var(--sf-room-desk-highlight)" 
        opacity="0.1" 
      />
      
      {/* Foreground Desk Edge (adds volume to the desk) */}
      <polygon 
        points="-100,1150 2020,1150 2020,1200 -100,1200" 
        fill="var(--sf-room-desk-edge)" 
      />
    </g>
  );
}
