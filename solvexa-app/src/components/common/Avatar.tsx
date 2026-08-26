interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  hasStory?: boolean;
  hasStoryUnviewed?: boolean;
  isOnline?: boolean;
  className?: string;
  onClick?: () => void;
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

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const avatarContent = src ? (
    <img
      src={src}
      alt={name}
      className={`w-full h-full object-cover rounded-full select-none bg-surface-container`}
      onError={(e) => {
        // Fallback to initials if image fails
        e.currentTarget.style.display = 'none';
      }}
    />
  ) : (
    <div className="w-full h-full rounded-full bg-gradient-to-tr from-primary-container/40 to-secondary-container/40 flex items-center justify-center font-bold text-on-surface border border-white/10">
      {initials}
    </div>
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
