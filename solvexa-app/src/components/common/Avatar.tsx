import { useState, useEffect } from 'react';
import type { SolvexaUser } from '../../types/user.types';

export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  hasStory?: boolean;
  hasStoryUnviewed?: boolean;
  isOnline?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Resolves avatar source following priority order:
 * 1. Firebase user's photoURL if available
 * 2. Firestore user's photoURL / avatarUrl / profileImage / avatar field
 * 3. Fallback to null (which triggers initials avatar)
 */
export function resolveAvatarSrc(
  user?: Partial<SolvexaUser> | { photoURL?: string | null; avatarUrl?: string | null; profileImage?: string | null; avatar?: string | null } | null,
  firebaseUser?: { photoURL?: string | null } | null
): string | null {
  if (firebaseUser?.photoURL && typeof firebaseUser.photoURL === 'string' && firebaseUser.photoURL.trim()) {
    const val = firebaseUser.photoURL.trim();
    if (val !== 'null' && val !== 'undefined') return val;
  }

  if (user) {
    const candidate =
      user.photoURL ||
      (user as any).avatarUrl ||
      (user as any).profileImage ||
      (user as any).avatar;
    if (candidate && typeof candidate === 'string' && candidate.trim()) {
      const val = candidate.trim();
      if (val !== 'null' && val !== 'undefined') return val;
    }
  }

  return null;
}

export function Avatar({
  src,
  name = 'User',
  size = 'md',
  hasStory = false,
  hasStoryUnviewed = false,
  isOnline,
  className = '',
  onClick,
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error when src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-24 h-24 text-2xl',
  };

  const ringPadding = {
    xs: 'p-0.5',
    sm: 'p-0.5',
    md: 'p-[2px]',
    lg: 'p-[3px]',
    xl: 'p-1',
    '2xl': 'p-1.5',
  }[size];

  const cleanName = (name || 'User').trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : (parts[0]?.[0] || 'U').toUpperCase();

  const validUrl =
    typeof src === 'string' &&
    src.trim().length > 0 &&
    src.trim() !== 'null' &&
    src.trim() !== 'undefined'
      ? src.trim()
      : null;

  const showFallback = !validUrl || hasError;

  const avatarContent = showFallback ? (
    <div className="w-full h-full rounded-full bg-gradient-to-tr from-purple-900/70 via-indigo-900/60 to-cyan-900/60 flex items-center justify-center font-bold text-white border border-white/10 select-none">
      {initials}
    </div>
  ) : (
    <img
      src={validUrl}
      alt={cleanName}
      className="w-full h-full object-cover rounded-full select-none bg-surface-container"
      onError={() => setHasError(true)}
    />
  );

  return (
    <div
      className={`relative inline-flex flex-shrink-0 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {hasStory ? (
        <div
          className={`rounded-full ${ringPadding} ${
            hasStoryUnviewed
              ? 'bg-gradient-to-tr from-tertiary via-primary-container to-secondary-container signal-glow'
              : 'bg-white/20'
          }`}
        >
          <div className={`${sizeMap[size]} rounded-full bg-[#0A0A0B] p-[1.5px]`}>
            {avatarContent}
          </div>
        </div>
      ) : (
        <div className={`${sizeMap[size]} rounded-full overflow-hidden`}>
          {avatarContent}
        </div>
      )}

      {isOnline !== undefined && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 ring-[#0A0A0B] ${
            size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
          } ${isOnline ? 'bg-emerald-400 signal-glow' : 'bg-zinc-500'}`}
        />
      )}
    </div>
  );
}

