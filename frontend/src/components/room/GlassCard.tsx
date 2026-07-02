/**
 * Room-specific GlassCard — uses `.room-glass` CSS classes.
 * NOT the same as `@/components/ui/GlassCard` which uses `.glass-panel`.
 * This variant supports hover lift, glow, and room-specific glassmorphism.
 */
import clsx from 'clsx';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  /** Additional inline styles (e.g. animation delays) */
  style?: React.CSSProperties;
  /** Enable hover lift + glow effect. Default: true */
  hover?: boolean;
  /** CSS color value for a custom border glow on hover, e.g. 'var(--sf-room-accent-mint)' */
  glow?: string;
}

export default function GlassCard({
  children,
  className,
  style,
  hover = true,
  glow,
}: GlassCardProps) {
  const mergedStyle: React.CSSProperties = {
    ...style,
    ...(glow ? { '--glass-card-glow': glow } as React.CSSProperties : {}),
  };

  return (
    <div
      className={clsx('room-glass', hover && 'room-glass-card', className)}
      style={mergedStyle}
    >
      {children}
    </div>
  );
}
