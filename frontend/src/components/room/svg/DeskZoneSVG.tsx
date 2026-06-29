import React from 'react';
import { Desk } from './objects/Desk';
import { DeskItems } from './objects/DeskItems';

/**
 * DeskZoneSVG component
 * Renders the close-up immersive desk view specifically for Focus Mode.
 * This is swapped in by the InteractiveRoomEngine when route is /focus.
 */
export function DeskZoneSVG({ className }: { className?: string }) {
  return (
    <svg 
      id="desk-zone-scene" 
      viewBox="500 400 1000 700" // Close up on the desk area
      preserveAspectRatio="xMidYMid slice"
      className={`w-full h-full object-cover ${className || ''}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background fill for close up (wall behind desk) */}
      <rect x="0" y="0" width="1920" height="1080" fill="var(--sf-room-wall)" />
      
      {/* We reuse the same components but the viewBox handles the zoom/crop */}
      <Desk />
      <DeskItems />
      
      {/* In focus mode, no hotspots are shown. It's just immersive. */}
    </svg>
  );
}
