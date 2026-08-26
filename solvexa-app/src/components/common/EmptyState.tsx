import type { ReactNode } from 'react';

export type EmptyStateVariant =
  | 'posts'
  | 'signals'
  | 'stories'
  | 'messages'
  | 'notifications'
  | 'followers'
  | 'saved'
  | 'activity'
  | 'signal_map'
  | 'spaces'
  | 'search'
  | 'orbit';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionContent?: ReactNode;
  className?: string;
  /** Compact mode — less vertical padding, smaller icon, for inline use inside panels */
  compact?: boolean;
}

const VARIANT_CONFIGS: Record<
  EmptyStateVariant,
  { icon: string; title: string; description: string; actionLabel?: string; iconColor?: string }
> = {
  posts: {
    icon: 'sensors_off',
    title: 'No broadcasts yet',
    description: 'Share your first signal with the network to start the conversation.',
    actionLabel: 'Broadcast Signal',
    iconColor: 'text-primary',
  },
  signals: {
    icon: 'videocam_off',
    title: 'No video signals yet',
    description: 'Share your first short video signal with the Solvexa network.',
    actionLabel: 'Upload Signal',
    iconColor: 'text-cyan-400',
  },
  stories: {
    icon: 'timelapse',
    title: 'No active moments',
    description: 'Moments expire after 24 hours. Capture a snapshot of your research.',
    actionLabel: 'Add Moment',
    iconColor: 'text-purple-400',
  },
  messages: {
    icon: 'chat_bubble_outline',
    title: 'No conversations yet',
    description: 'Start a conversation with someone in your Solvexa network.',
    actionLabel: 'Find People',
    iconColor: 'text-secondary',
  },
  notifications: {
    icon: 'notifications_none',
    title: "You're all caught up",
    description: 'New mentions, reactions, follows, and resonances will appear here.',
    iconColor: 'text-primary',
  },
  followers: {
    icon: 'group_off',
    title: 'No connections in orbit',
    description: 'Resonate with pioneers in the network to expand your orbit.',
    iconColor: 'text-zinc-400',
  },
  saved: {
    icon: 'bookmark_border',
    title: 'Your vault is empty',
    description: 'Save signals, broadcasts, and discussions to quickly access them later.',
    actionLabel: 'Explore Pulse',
    iconColor: 'text-primary',
  },
  activity: {
    icon: 'query_stats',
    title: 'Not enough activity yet',
    description: 'Your activity insights will appear here as you interact with the Solvexa network.',
    iconColor: 'text-emerald-400',
  },
  signal_map: {
    icon: 'radar',
    title: 'No live signals yet',
    description: 'Active broadcasts and creator nodes will illuminate the spatial map in real time.',
    actionLabel: 'Broadcast Signal',
    iconColor: 'text-cyan-400',
  },
  spaces: {
    icon: 'hub',
    title: 'No spaces found',
    description: 'Join a space to connect with pioneers sharing your research interests.',
    actionLabel: 'Discover Spaces',
    iconColor: 'text-purple-400',
  },
  search: {
    icon: 'search_off',
    title: 'No results found',
    description: 'Try different keywords or browse the Pulse feed to discover content.',
    actionLabel: 'Browse Pulse',
    iconColor: 'text-zinc-400',
  },
  orbit: {
    icon: 'all_inclusive',
    title: 'Your orbit is quiet',
    description: 'Follow pioneers to see their broadcasts and build your Solvexa network.',
    actionLabel: 'Explore Network',
    iconColor: 'text-primary',
  },
};

export function EmptyState({
  variant,
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionContent,
  className = '',
  compact = false,
}: EmptyStateProps) {
  const config = variant ? VARIANT_CONFIGS[variant] : null;

  const displayIcon = icon || config?.icon || 'inbox';
  const displayTitle = title || config?.title || 'Nothing here yet';
  const displayDescription = description || config?.description || '';
  const displayActionLabel = actionLabel || config?.actionLabel;
  const iconColorClass = config?.iconColor || 'text-primary';

  const verticalPadding = compact ? 'py-10 px-6' : 'py-14 px-8 sm:py-16 sm:px-12';
  const iconSize = compact ? 'w-12 h-12 text-xl' : 'w-14 h-14 text-2xl';

  return (
    <div
      className={`
        w-full
        ${verticalPadding}
        rounded-3xl
        bg-[#141416]/70
        border border-white/[0.08]
        backdrop-blur-xl
        flex items-center justify-center
        animate-in fade-in duration-300
        ${className}
      `}
      style={{ minHeight: compact ? 220 : 280 }}
    >
      {/*
        CRITICAL: This inner content wrapper has:
        - width: 100%
        - max-width: 420px
        - text-align: center
        - margin: auto
        These properties MUST be preserved to prevent word-by-word text wrapping.
      */}
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          margin: '0 auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: compact ? 12 : 16,
        }}
      >
        {/* Icon Container */}
        <div
          className={`
            ${iconSize}
            rounded-2xl
            bg-white/[0.05]
            border border-white/10
            flex items-center justify-center
            ${iconColorClass}
            shadow-inner
            transition-transform duration-300
            hover:scale-105
          `}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            {displayIcon}
          </span>
        </div>

        {/* Text Content */}
        <div
          style={{
            width: '100%',
            maxWidth: 400,
          }}
        >
          <h3
            style={{
              fontSize: compact ? 16 : 18,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
              marginBottom: 6,
              whiteSpace: 'normal',
              overflowWrap: 'normal',
              wordBreak: 'normal',
            }}
          >
            {displayTitle}
          </h3>

          {displayDescription && (
            <p
              style={{
                fontSize: 13,
                color: '#a1a1aa',
                lineHeight: 1.6,
                whiteSpace: 'normal',
                overflowWrap: 'normal',
                wordBreak: 'normal',
                maxWidth: 380,
                margin: '0 auto',
              }}
            >
              {displayDescription}
            </p>
          )}
        </div>

        {/* Action CTA */}
        {actionContent ? (
          <div style={{ marginTop: 4 }}>{actionContent}</div>
        ) : displayActionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="
              mt-1
              px-5 py-2.5
              rounded-xl
              bg-gradient-to-r from-[#7a00ff] to-[#0066ff]
              hover:opacity-90
              active:scale-95
              text-white text-xs font-bold
              shadow-lg shadow-purple-900/40
              transition-all duration-200
              hover:scale-105
              focus:outline-none focus:ring-2 focus:ring-primary/50
            "
          >
            {displayActionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
