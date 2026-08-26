import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glow';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-lg',
    md: 'text-sm px-4 py-2 gap-2 rounded-xl',
    lg: 'text-base px-6 py-3 gap-2.5 rounded-xl font-semibold',
    icon: 'p-2 rounded-xl aspect-square',
  }[size];

  const variantClasses = {
    primary: 'bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 text-white shadow-lg shadow-purple-900/30 border border-white/10',
    secondary: 'bg-[#201f20] hover:bg-[#2a2a2b] text-on-surface border border-white/10 hover:border-white/20',
    outline: 'bg-transparent border border-outline hover:border-primary hover:text-primary text-on-surface',
    ghost: 'bg-transparent hover:bg-white/5 text-on-surface-variant hover:text-on-surface',
    danger: 'bg-error/15 hover:bg-error/25 text-error border border-error/30',
    glow: 'bg-primary-container text-on-primary-container signal-glow font-semibold',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
      ) : (
        <>
          {leftIcon && <span className="material-symbols-outlined text-[18px]">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="material-symbols-outlined text-[18px]">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
