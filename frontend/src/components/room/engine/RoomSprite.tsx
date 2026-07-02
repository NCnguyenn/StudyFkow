'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SpriteConfig } from './SpriteManifest';

// ═══════════════════════════════════════════════════════════════════════════════
// RoomSprite — Individual transparent PNG pixel art sprite (R5.5-P2/P5)
// ═══════════════════════════════════════════════════════════════════════════════

interface RoomSpriteProps {
  sprite: SpriteConfig;
  scale: number;
  brightness?: number;
  isDaytime?: boolean;
  onSpriteClick?: (sprite: SpriteConfig) => void;
}

export default function RoomSprite({ sprite, scale, brightness = 1, isDaytime = true, onSpriteClick }: RoomSpriteProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  
  // Golden Rule #1: Every sprite has idle animation class
  const animName = sprite.animation || sprite.idleAnimation;
  const animationClass = `sprite-idle-${animName}`;

  const handleClick = () => {
    if (sprite.clickRoute) {
      if (onSpriteClick) {
        onSpriteClick(sprite);
      } else {
        router.push(sprite.clickRoute);
      }
    }
  };

  // Determine correct image source (day vs night variant)
  const imageSrc = (!isDaytime && sprite.srcNight) ? sprite.srcNight : sprite.src;

  // Outer style: Position and visual filters (parallax will modify transform directly in DOM)
  const outerStyle = useMemo((): React.CSSProperties => {
    const isInteractive = Boolean(sprite.clickRoute);
    const hoverFilter = (isInteractive && isHovered)
      ? `brightness(${brightness * 1.18}) drop-shadow(0 0 14px rgba(255, 240, 200, 0.45))`
      : `brightness(${brightness})`;

    return {
      position: 'absolute',
      left: `${sprite.x * scale}px`,
      top: `${sprite.y * scale}px`,
      width: `${sprite.width * scale}px`,
      height: `${sprite.height * scale}px`,
      zIndex: sprite.zIndex,
      transform: 'translate3d(0px, 0px, 0px)',
      willChange: 'transform',
      filter: hoverFilter,
      transition: 'filter 0.35s ease',
      cursor: isInteractive ? 'pointer' : 'default',
    };
  }, [sprite, scale, brightness, isHovered]);

  // Inner style: Idle animation duration based on depth
  const innerStyle = useMemo((): React.CSSProperties => ({
    width: '100%',
    height: '100%',
    animationDuration: `${3 + sprite.depth * 4}s`,
  }), [sprite.depth]);

  return (
    <div
      className="room-sprite"
      style={outerStyle}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-sprite-id={sprite.id}
      data-depth={sprite.depth}
    >
      <div 
        className={animationClass}
        style={innerStyle}
      >
        <img
          src={imageSrc}
          alt={sprite.label}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            imageRendering: 'pixelated',
            display: 'block',
            pointerEvents: 'none', // Ignore pointer events so clicks trigger on container div
          }}
        />
      </div>
    </div>
  );
}
