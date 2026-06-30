import React from 'react';

/**
 * DeskItems SVG component
 * Renders the items resting on the desk (Laptop, Notebook, Coffee Mug, Lamp, small plant)
 */
export function DeskItems() {
  return (
    <g id="desk-items-group">
      
      {/* --- Small Potted Plant (Left) --- */}
      <g id="plant-desk-group">
        {/* Pot */}
        <path d="M 400,600 Q 420,660 440,660 L 480,660 Q 500,660 520,600 Z" fill="var(--sf-room-bookshelf)" />
        {/* Leaves */}
        <circle cx="430" cy="560" r="30" fill="var(--sf-room-plant)" />
        <circle cx="490" cy="570" r="25" fill="var(--sf-room-plant-light)" />
        <circle cx="460" cy="530" r="35" fill="var(--sf-room-plant)" />
        <circle cx="410" cy="590" r="20" fill="var(--sf-room-plant-light)" />
      </g>

      {/* --- Laptop (Canvas Area) --- */}
      <g id="laptop-group">
        {/* Shadow */}
        <polygon points="680,840 1170,840 1190,810 700,810" fill="rgba(0,0,0,0.3)" />
        {/* Screen Bezel */}
        <polygon points="720,550 1130,550 1150,780 700,780" fill="var(--sf-room-wall)" />
        {/* Screen (Glowing) */}
        <polygon points="735,565 1115,565 1132,760 718,760" fill="var(--sf-room-canvas)" />
        {/* Base/Keyboard */}
        <polygon points="700,780 1150,780 1170,820 680,820" fill="var(--sf-room-desk-edge)" />
        {/* Trackpad */}
        <polygon points="880,790 970,790 975,810 875,810" fill="var(--sf-room-wall-warm)" opacity="0.5" />
      </g>

      {/* --- Coffee Mug (Front Left) --- */}
      <g id="mug-group">
        {/* Shadow */}
        <ellipse cx="600" cy="850" rx="45" ry="15" fill="rgba(0,0,0,0.3)" />
        {/* Body */}
        <path d="M 560,780 L 570,850 Q 600,865 630,850 L 640,780 Z" fill="var(--sf-room-mug)" />
        {/* Handle */}
        <path d="M 635,800 C 665,790 665,830 635,840" fill="none" stroke="var(--sf-room-mug)" strokeWidth="10" />
        {/* Coffee Liquid inside */}
        <ellipse cx="600" cy="780" rx="40" ry="12" fill="var(--sf-room-desk)" />
        
        {/* Steam (To be animated with CSS) */}
        <g id="steam-group" opacity="0.6">
          <path d="M 590,760 Q 580,730 600,700 T 590,650" fill="none" stroke="var(--sf-room-paper)" strokeWidth="3" strokeLinecap="round" />
          <path d="M 610,750 Q 620,720 600,690 T 610,640" fill="none" stroke="var(--sf-room-paper)" strokeWidth="2" strokeLinecap="round" />
          <path d="M 600,755 Q 610,725 595,695 T 605,645" fill="none" stroke="var(--sf-room-paper)" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </g>

      {/* --- Notebook (Notes Area) --- */}
      <g id="notebook-group">
        {/* Shadow */}
        <polygon points="980,840 1200,800 1230,820 1010,870" fill="rgba(0,0,0,0.3)" />
        {/* Pages */}
        <polygon points="990,830 1195,795 1220,810 1015,850" fill="var(--sf-room-paper)" />
        <polygon points="985,835 1190,800 1215,815 1010,855" fill="var(--sf-room-paper)" />
        {/* Cover Edge */}
        <polygon points="980,840 1185,805 1210,820 1005,860" fill="var(--sf-room-book-cool)" />
        {/* Bookmark ribbon */}
        <polygon points="1060,850 1080,846 1090,880 1070,880" fill="var(--sf-room-book-warm)" />
      </g>

      {/* --- Desk Lamp (Right Side) --- */}
      <g id="lamp-group">
        {/* Base */}
        <ellipse cx="1400" cy="800" rx="60" ry="25" fill="var(--sf-room-wall-warm)" />
        <path d="M 1370,780 L 1430,780 L 1445,800 L 1355,800 Z" fill="var(--sf-room-desk-edge)" />
        
        {/* Arm segments */}
        <line x1="1400" y1="780" x2="1350" y2="550" stroke="var(--sf-room-window-frame)" strokeWidth="12" strokeLinecap="round" />
        <line x1="1350" y1="550" x2="1480" y2="450" stroke="var(--sf-room-window-frame)" strokeWidth="10" strokeLinecap="round" />
        
        {/* Lamp Shade */}
        <path d="M 1480,450 L 1420,530 Q 1480,560 1540,530 Z" fill="var(--sf-room-wall-warm)" />
        
        {/* Light Glow */}
        <g id="lamp-glow">
          {/* Bulb center */}
          <ellipse cx="1480" cy="540" rx="30" ry="10" fill="var(--sf-room-lamp)" />
          {/* Light cone projecting downward */}
          <polygon points="1480,540 1100,1000 1800,1000" fill="var(--sf-room-lamp-halo)" style={{ mixBlendMode: 'screen' }} />
        </g>
      </g>
      
    </g>
  );
}
