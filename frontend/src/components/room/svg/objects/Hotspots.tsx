import React from 'react';

/**
 * Hotspots SVG component
 * Defines interactive areas (rects) that trigger zoom transitions to respective modules.
 * These `<rect>` elements should remain transparent, capturing pointer events.
 */
export function Hotspots() {
  return (
    <g id="hotspots-layer" style={{ pointerEvents: 'all' }}>
      {/* Notebook -> /notes */}
      <rect
        id="hotspot-notes"
        className="room-hotspot"
        x="980"
        y="650"
        width="220"
        height="180"
        fill="transparent"
        style={{ cursor: 'pointer' }}
        data-route="/notes"
      />
      {/* Clock -> /focus */}
      <rect
        id="hotspot-focus"
        className="room-hotspot"
        x="1350"
        y="300"
        width="150"
        height="150"
        fill="transparent"
        style={{ cursor: 'pointer' }}
        data-route="/focus"
      />
      {/* Corkboard -> /tasks */}
      <rect
        id="hotspot-planner"
        className="room-hotspot"
        x="1200"
        y="250"
        width="400"
        height="280"
        fill="transparent"
        style={{ cursor: 'pointer' }}
        data-route="/tasks"
      />
      {/* Laptop -> /canvas */}
      <rect
        id="hotspot-canvas"
        className="room-hotspot"
        x="700"
        y="550"
        width="450"
        height="280"
        fill="transparent"
        style={{ cursor: 'pointer' }}
        data-route="/canvas"
      />
      {/* Bookshelf -> /insights */}
      <rect
        id="hotspot-insights"
        className="room-hotspot"
        x="100"
        y="150"
        width="380"
        height="700"
        fill="transparent"
        style={{ cursor: 'pointer' }}
        data-route="/insights"
      />
    </g>
  );
}
