import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAppStore } from '../../store/useAppStore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, ...props }) => {
  const isLiteMode = useAppStore((state) => state.isLiteMode);

  return (
    <div
      className={cn(
        isLiteMode ? 'glass-lite' : 'glass-panel',
        'rounded-2xl p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
