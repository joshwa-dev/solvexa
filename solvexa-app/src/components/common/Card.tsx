import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'glass' | 'surface' | 'glow' | 'interactive';
  className?: string;
}

export function Card({
  children,
  variant = 'glass',
  className = '',
  ...props
}: CardProps) {
  const variantStyles = {
    glass: 'bg-[#141416]/80 backdrop-blur-xl border border-white/[0.08] shadow-xl',
    surface: 'bg-[#141416] border border-outline-variant/30',
    glow: 'bg-[#141416]/90 border border-primary/30 shadow-[0_0_24px_rgba(160,120,255,0.15)]',
    interactive: 'bg-[#141416]/80 backdrop-blur-xl border border-white/[0.08] hover:border-primary/40 transition-all duration-300 hover:shadow-[0_4px_24px_rgba(122,0,255,0.12)] cursor-pointer',
  }[variant];

  return (
    <div
      className={`rounded-2xl overflow-hidden ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
