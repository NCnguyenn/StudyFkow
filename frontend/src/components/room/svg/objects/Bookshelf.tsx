import React from 'react';

/**
 * Bookshelf SVG component
 * Renders the bookshelf on the left side of the room, including books and a trailing plant.
 */
export function Bookshelf() {
  return (
    <g id="bookshelf-group">
      {/* Shelf Backing */}
      <rect x="80" y="100" width="400" height="750" fill="var(--sf-room-wall-warm)" />
      
      {/* Main Frame */}
      <path
        d="M80,100 L480,100 L480,850 L80,850 Z"
        fill="none"
        stroke="var(--sf-room-bookshelf)"
        strokeWidth="16"
      />
      
      {/* Shelves */}
      <line x1="80" y1="350" x2="480" y2="350" stroke="var(--sf-room-bookshelf)" strokeWidth="12" />
      <line x1="80" y1="600" x2="480" y2="600" stroke="var(--sf-room-bookshelf)" strokeWidth="12" />
      
      {/* Books - Top Shelf */}
      <g id="books-top">
        <rect x="120" y="180" width="30" height="170" fill="var(--sf-room-book-warm)" rx="4" />
        <rect x="155" y="210" width="25" height="140" fill="var(--sf-room-book-cool)" rx="4" />
        <rect x="185" y="150" width="40" height="200" fill="var(--sf-room-desk-edge)" rx="4" />
        {/* Leaning book */}
        <path d="M250,350 L230,190 L260,185 L280,350 Z" fill="var(--sf-room-book-cool)" />
      </g>
      
      {/* Books - Middle Shelf */}
      <g id="books-mid">
        <rect x="350" y="420" width="35" height="180" fill="var(--sf-room-book-warm)" rx="4" />
        <rect x="390" y="450" width="45" height="150" fill="var(--sf-room-book-cool)" rx="4" />
      </g>
      
      {/* Trailing Plant - Middle Shelf Left */}
      <g id="plant-bookshelf">
        <ellipse cx="140" cy="580" rx="30" ry="25" fill="var(--sf-room-desk-highlight)" />
        {/* Vines hanging down */}
        <path d="M120,590 Q100,650 130,700" fill="none" stroke="var(--sf-room-plant)" strokeWidth="4" />
        <path d="M150,590 Q170,680 140,750" fill="none" stroke="var(--sf-room-plant-light)" strokeWidth="3" />
        
        {/* Leaves */}
        <circle cx="110" cy="620" r="12" fill="var(--sf-room-plant-light)" />
        <circle cx="125" cy="680" r="10" fill="var(--sf-room-plant)" />
        <circle cx="160" cy="650" r="15" fill="var(--sf-room-plant)" />
        <circle cx="145" cy="720" r="10" fill="var(--sf-room-plant-light)" />
      </g>
    </g>
  );
}
