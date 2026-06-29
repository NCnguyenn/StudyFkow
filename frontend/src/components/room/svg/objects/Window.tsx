import React from 'react';

/**
 * Window SVG component
 * Renders the window frame and glasspanes showing the sky backdrop.
 */
export function Window() {
  return (
    <g id="window-group">
      {/* Sky backdrop */}
      <rect
        x="600"
        y="100"
        width="500"
        height="450"
        fill="var(--sf-room-wall-warm)" // Serves as base for sky gradients if needed later
      />
      
      {/* Window Frame (Outer) */}
      <path
        d="M590,90 L1110,90 L1110,560 L590,560 Z"
        fill="none"
        stroke="var(--sf-room-window-frame)"
        strokeWidth="20"
      />
      
      {/* Window Frame (Inner dividers) */}
      <line x1="850" y1="90" x2="850" y2="560" stroke="var(--sf-room-window-frame)" strokeWidth="10" />
      <line x1="590" y1="325" x2="1110" y2="325" stroke="var(--sf-room-window-frame)" strokeWidth="10" />
      
      {/* Glass reflections */}
      <polygon points="620,110 680,110 640,300 580,300" fill="rgba(255,255,255,0.05)" />
      <polygon points="870,110 930,110 890,300 830,300" fill="rgba(255,255,255,0.05)" />
    </g>
  );
}
