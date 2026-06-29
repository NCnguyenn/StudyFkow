import React from 'react';

/**
 * WallDecor SVG component
 * Renders the wall decor including the Corkboard (Tasks) and Wall Clock (Focus)
 */
export function WallDecor() {
  return (
    <g id="wall-decor-group">
      {/* --- Corkboard (Tasks Area) --- */}
      <g id="corkboard-group">
        {/* Frame */}
        <rect x="1190" y="240" width="420" height="300" fill="var(--sf-room-bookshelf)" rx="8" />
        {/* Cork surface */}
        <rect x="1200" y="250" width="400" height="280" fill="var(--sf-room-desk-highlight)" rx="4" />
        
        {/* Sticky Notes */}
        <rect x="1230" y="280" width="60" height="60" fill="var(--sf-accent-highlight)" rx="2" transform="rotate(-5 1260 310)" />
        <rect x="1320" y="270" width="70" height="70" fill="var(--sf-accent-alert)" rx="2" transform="rotate(3 1355 305)" />
        <rect x="1250" y="380" width="80" height="60" fill="var(--sf-accent-success)" rx="2" />
        <rect x="1420" y="300" width="65" height="85" fill="var(--sf-accent-info)" rx="2" transform="rotate(-8 1452 342)" />
        <rect x="1480" y="400" width="60" height="60" fill="var(--sf-accent-primary)" rx="2" />
        
        {/* Push pins */}
        <circle cx="1260" cy="285" r="4" fill="var(--sf-room-wall)" />
        <circle cx="1355" cy="275" r="4" fill="var(--sf-room-wall)" />
        <circle cx="1290" cy="385" r="4" fill="var(--sf-room-wall)" />
        <circle cx="1452" cy="305" r="4" fill="var(--sf-room-wall)" />
        <circle cx="1510" cy="405" r="4" fill="var(--sf-room-wall)" />
      </g>

      {/* --- Wall Clock (Focus Area) --- */}
      <g id="clock-group">
        {/* Outer frame */}
        <circle cx="1425" cy="140" r="65" fill="var(--sf-room-bookshelf)" />
        {/* Clock face */}
        <circle cx="1425" cy="140" r="55" fill="var(--sf-room-paper)" />
        
        {/* Center dot */}
        <circle cx="1425" cy="140" r="4" fill="var(--sf-room-wall)" />
        
        {/* Hands */}
        {/* Hour hand (points to ~10) */}
        <line x1="1425" y1="140" x2="1395" y2="120" stroke="var(--sf-room-wall)" strokeWidth="6" strokeLinecap="round" />
        {/* Minute hand (points to ~2) */}
        <line x1="1425" y1="140" x2="1455" y2="110" stroke="var(--sf-room-wall)" strokeWidth="4" strokeLinecap="round" />
        
        {/* Subtle tick marks (3, 6, 9, 12) */}
        <line x1="1425" y1="90" x2="1425" y2="100" stroke="var(--sf-room-wall)" strokeWidth="3" />
        <line x1="1425" y1="190" x2="1425" y2="180" stroke="var(--sf-room-wall)" strokeWidth="3" />
        <line x1="1375" y1="140" x2="1385" y2="140" stroke="var(--sf-room-wall)" strokeWidth="3" />
        <line x1="1475" y1="140" x2="1465" y2="140" stroke="var(--sf-room-wall)" strokeWidth="3" />
      </g>
    </g>
  );
}
