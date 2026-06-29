import React, { forwardRef } from 'react';
import { WallDecor } from './objects/WallDecor';
import { Window } from './objects/Window';
import { Bookshelf } from './objects/Bookshelf';
import { Desk } from './objects/Desk';
import { DeskItems } from './objects/DeskItems';
import { Hotspots } from './objects/Hotspots';

interface StudyRoomSVGProps {
  className?: string;
}

/**
 * StudyRoomSVG component
 * Renders the full room scene composed of modular SVG elements.
 * Uses forwardRef so GSAP can target the SVG element for zoom animations.
 */
export const StudyRoomSVG = forwardRef<SVGSVGElement, StudyRoomSVGProps>(
  ({ className }, ref) => {
    return (
      <svg
        ref={ref}
        id="room-scene"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        className={`w-full h-full object-cover ${className || ''}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Base Wall (Background) */}
        <rect x="0" y="0" width="1920" height="1080" fill="var(--sf-room-wall)" />
        
        {/* Render room objects in painter's algorithm order (back to front) */}
        <WallDecor />
        <Window />
        <Bookshelf />
        <Desk />
        <DeskItems />
        
        {/* Interactive Hotspots Layer */}
        <Hotspots />
      </svg>
    );
  }
);

StudyRoomSVG.displayName = 'StudyRoomSVG';
