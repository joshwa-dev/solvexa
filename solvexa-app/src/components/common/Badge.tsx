import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'cyan' | 'outline' | 'glass';
  icon?: string;
  className?: string;
  onClick?: () => void;
}

export function Badge({
  children,
  variant = 'glass',
  icon,
  className = '',
  onClick,
}: BadgeProps) {
  const variantStyles = {
    primary: 'bg-primary/15 text-primary border-primary/25',
    secondary: 'bg-secondary/15 text-secondary border-secondary/25',
    cyan: 'bg-tertiary/15 text-tertiary border-tertiary/25',
    outline: 'bg-transparent text-on-surface-variant border-white/15 hover:border-white/30',
    glass: 'bg-white/5 text-on-surface border-white/10 backdrop-blur-md hover:bg-white/10',
  }[variant];

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
        onClick ? 'cursor-pointer' : ''
      } ${variantStyles} ${className}`}
    >
      {icon && <span className="material-symbols-outlined text-[14px]">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
