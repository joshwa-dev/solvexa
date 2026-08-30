import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from './Avatar';
import { SignalChip } from './SignalChip';
import { dataStore } from '../../services/store/dataStore';
import type { SignalType } from '../../types/post.types';

export interface MediaViewerItem {
  url: string;
  type?: 'image' | 'video';
  authorName?: string;
  authorUsername?: string;
  authorAvatar?: string | null;
  caption?: string;
  createdAt?: string;
  postId?: string;
  signalCount?: number;
  commentCount?: number;
  mySignal?: SignalType | null;
  isSaved?: boolean;
  topics?: string[];
}

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaViewerItem | MediaViewerItem[] | null;
  initialIndex?: number;
}

export function MediaViewer({ isOpen, onClose, media, initialIndex = 0 }: MediaViewerProps) {
  const items: MediaViewerItem[] = Array.isArray(media) ? media : media ? [media] : [];
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [currentPostSignal, setCurrentPostSignal] = useState<SignalType | null>(null);
  const [currentSignalCount, setCurrentSignalCount] = useState(0);
  const [currentIsSaved, setCurrentIsSaved] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const currentItem = items[currentIndex] || items[0];

  // Sync post data & comments if postId is provided
  useEffect(() => {
    if (currentItem?.postId) {
      const post = dataStore.getPostById(currentItem.postId);
      if (post) {
        setCurrentPostSignal(post.mySignal || null);
        setCurrentSignalCount(post.signalCount);
        setCurrentIsSaved(!!post.isSaved);
        setComments(dataStore.getComments(post.postId));
      } else {
        setComments(dataStore.getComments(currentItem.postId));
        setCurrentPostSignal(currentItem.mySignal || null);
        setCurrentSignalCount(currentItem.signalCount || 0);
        setCurrentIsSaved(!!currentItem.isSaved);
      }
    } else if (currentItem) {
      setCurrentPostSignal(currentItem.mySignal || null);
      setCurrentSignalCount(currentItem.signalCount || 0);
      setCurrentIsSaved(!!currentItem.isSaved);
      setComments([]);
    }
  }, [currentItem, isOpen]);

  // Keyboard navigation & ESC close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && items.length > 1) {
        setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft' && items.length > 1) {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, items.length]);

  if (!isOpen || !currentItem) return null;

  const isVideo = currentItem.type === 'video' || currentItem.url?.endsWith('.mp4') || currentItem.url?.endsWith('.webm');

  const handleToggleSignal = (type: SignalType) => {
    if (currentItem.postId) {
      dataStore.toggleSignal(currentItem.postId, type);
      const updated = dataStore.getPostById(currentItem.postId);
      if (updated) {
        setCurrentPostSignal(updated.mySignal || null);
        setCurrentSignalCount(updated.signalCount);
      }
    } else {
      if (currentPostSignal === type) {
        setCurrentPostSignal(null);
        setCurrentSignalCount((c) => Math.max(0, c - 1));
      } else {
        if (!currentPostSignal) setCurrentSignalCount((c) => c + 1);
        setCurrentPostSignal(type);
      }
    }
  };

  const handleToggleSave = () => {
    if (currentItem.postId) {
      const nowSaved = dataStore.toggleSavePost(currentItem.postId);
      setCurrentIsSaved(nowSaved);
    } else {
      setCurrentIsSaved(!currentIsSaved);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (currentItem.postId) {
      dataStore.addComment(currentItem.postId, commentText.trim());
      setComments(dataStore.getComments(currentItem.postId));
    } else {
      const mockComment = {
        commentId: `com_${Date.now()}`,
        authorName: 'You',
        authorUsername: 'user_me',
        authorAvatar: null,
        content: commentText.trim(),
        createdAt: new Date().toISOString(),
      };
      setComments([...comments, mockComment]);
    }

    setCommentText('');
    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShareToast('Link copied to clipboard!');
    setTimeout(() => setShareToast(null), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Media Lightbox"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Toast Notification */}
      {shareToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-[#141416]/95 border border-primary/40 text-white text-xs font-bold shadow-2xl backdrop-blur-xl animate-in fade-in flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">check_circle</span>
          <span>{shareToast}</span>
        </div>
      )}

      {/* Main Split Container: [ Left: Media Viewport ] | [ Right: Details & Discussion Panel ] */}
      <div
        className="relative w-full h-full md:max-w-6xl md:h-[88vh] bg-[#141416] md:border md:border-white/10 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:grid md:grid-cols-12 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================================
            SECTION 1: MEDIA VIEWPORT (Left 8 Cols on Desktop / Top on Mobile)
            Guarantees: object-fit: contain, min-w-0, min-h-0, zero caption overlay.
           ========================================================================= */}
        <div className="relative md:col-span-8 bg-black/80 flex items-center justify-center min-w-0 min-h-0 h-[45vh] sm:h-[55vh] md:h-full overflow-hidden p-2 sm:p-4">
          {isVideo ? (
            <video
              src={currentItem.url}
              controls
              autoPlay
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl shadow-2xl"
            />
          ) : (
            <img
              src={currentItem.url}
              alt={currentItem.caption || 'Expanded Media'}
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl shadow-2xl"
            />
          )}

          {/* Multi-item Arrow Navigation */}
          {items.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 flex items-center justify-center transition-all hover:scale-105"
                title="Previous media"
                aria-label="Previous media"
              >
                <span className="material-symbols-outlined text-xl">chevron_left</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 flex items-center justify-center transition-all hover:scale-105"
                title="Next media"
                aria-label="Next media"
              >
                <span className="material-symbols-outlined text-xl">chevron_right</span>
              </button>
            </>
          )}

          {/* Close button on Mobile view */}
          <button
            onClick={onClose}
            className="md:hidden absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 flex items-center justify-center transition-all"
            title="Close viewer"
            aria-label="Close viewer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* =========================================================================
            SECTION 2: DETAILS & DISCUSSION PANEL (Right 4 Cols on Desktop / Bottom on Mobile)
            Contains creator info, full caption, discussion thread, and reaction tools.
           ========================================================================= */}
        <div className="md:col-span-4 flex flex-col justify-between bg-[#141416] border-t md:border-t-0 md:border-l border-white/10 min-w-0 flex-1 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <Link to={`/profile/${currentItem.authorUsername || 'user'}`} onClick={onClose}>
                <Avatar src={currentItem.authorAvatar} name={currentItem.authorName || 'Creator'} size="sm" hasStory />
              </Link>
              <div className="min-w-0">
                <Link
                  to={`/profile/${currentItem.authorUsername || 'user'}`}
                  onClick={onClose}
                  className="text-xs sm:text-sm font-bold text-white hover:underline truncate block"
                >
                  {currentItem.authorName || 'Solvexa Pioneer'}
                </Link>
                <span className="text-[10px] text-zinc-400 font-medium block">
                  @{currentItem.authorUsername || 'user'}
                </span>
              </div>
            </div>

            {/* Close button on Desktop */}
            <button
              onClick={onClose}
              className="hidden md:flex w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white items-center justify-center transition-all"
              title="Close (ESC)"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Scrollable Body: Caption, Topics, and Comments Stream */}
          <div className="flex-1 min-w-0 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {/* Post Caption (Always separated cleanly from image) */}
            {currentItem.caption && (
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-line break-words">
                  {currentItem.caption}
                </p>
                {currentItem.topics && currentItem.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {currentItem.topics.map((t) => (
                      <span key={t} className="text-[10px] font-semibold text-primary">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
                {currentItem.createdAt && (
                  <span className="text-[10px] text-zinc-500 block pt-1">
                    {new Date(currentItem.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            )}

            {/* Comments Thread */}
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block px-1">
                Insights & Discussion ({comments.length})
              </span>

              {comments.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs space-y-1">
                  <span className="material-symbols-outlined text-2xl text-zinc-600 block">chat_bubble</span>
                  <p>No comments on this signal yet.</p>
                  <p className="text-[10px] text-zinc-600">Be the first to synthesize your insight.</p>
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.commentId || Math.random()} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Avatar src={c.authorAvatar} name={c.authorName} size="xs" />
                      <span className="text-xs font-bold text-white">{c.authorName}</span>
                      <span className="text-[10px] text-zinc-500">@{c.authorUsername}</span>
                    </div>
                    <p className="text-xs text-zinc-300 pl-6 leading-relaxed break-words">{c.content}</p>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>
          </div>

          {/* Action Bar & Comment Input */}
          <div className="p-3 sm:p-4 border-t border-white/10 bg-[#141416]/95 backdrop-blur-xl flex-shrink-0 space-y-3">
            {/* Interaction Buttons Row */}
            <div className="flex items-center justify-between">
              <SignalChip
                activeSignal={currentPostSignal}
                count={currentSignalCount}
                onSelectSignal={handleToggleSignal}
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleSave}
                  className={`p-2 rounded-full border transition-all ${
                    currentIsSaved
                      ? 'bg-secondary text-black border-secondary'
                      : 'bg-white/5 text-zinc-400 hover:text-white border-white/10 hover:bg-white/10'
                  }`}
                  title="Bookmark Signal"
                  aria-label="Bookmark Signal"
                >
                  <span className={`material-symbols-outlined text-lg ${currentIsSaved ? 'icon-filled' : ''}`}>
                    bookmark
                  </span>
                </button>

                <button
                  onClick={handleShare}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-all"
                  title="Share"
                  aria-label="Share"
                >
                  <span className="material-symbols-outlined text-lg">share</span>
                </button>
              </div>
            </div>

            {/* Comment Composer */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Synthesize your insight..."
                className="flex-1 min-w-0 bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 shadow-md disabled:opacity-40 transition-all flex-shrink-0"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
