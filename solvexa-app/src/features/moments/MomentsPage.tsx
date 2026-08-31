import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataStore } from '../../services/store/dataStore';
import { useAuth } from '../auth/AuthContext';
import type { MomentWithAuthor } from '../../types/moment.types';
import { Avatar, resolveAvatarSrc } from '../../components/common/Avatar';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { uploadMediaFile } from '../../services/storage/mediaUpload';

export default function MomentsPage() {
  const { solvexaUser } = useAuth();
  const [moments, setMoments] = useState<MomentWithAuthor[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  // Story Creation states
  const [momentFile, setMomentFile] = useState<{ url: string; type: 'image' | 'video'; name: string } | null>(null);
  const [newText, setNewText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [createError, setCreateError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isViewersModalOpen, setIsViewersModalOpen] = useState(false);
  const [videoDurationMs, setVideoDurationMs] = useState(7000);
  const viewedMomentsRef = useRef<Set<string>>(new Set());

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const navigate = useNavigate();

  // Load moments
  useEffect(() => {
    const list = dataStore.getMoments().filter((m) => {
      if (!m.expiresAt) return true;
      return new Date(m.expiresAt).getTime() > Date.now();
    });
    setMoments(list);

    const unsub = dataStore.subscribe(() => {
      const updated = dataStore.getMoments().filter((m) => {
        if (!m.expiresAt) return true;
        return new Date(m.expiresAt).getTime() > Date.now();
      });
      setMoments(updated);
    });

    return () => unsub();
  }, []);

  const currentMoment = moments[currentIndex];
  const currentUserId = solvexaUser?.uid;
  const isAuthor = Boolean(currentUserId && currentMoment && currentMoment.authorId === currentUserId);

  // Prevent duplicate view tracking on re-renders
  useEffect(() => {
    if (!currentMoment) return;
    if (!viewedMomentsRef.current.has(currentMoment.momentId)) {
      viewedMomentsRef.current.add(currentMoment.momentId);
      dataStore.markMomentViewed(currentMoment.momentId);
    }
    setProgress(0);
  }, [currentIndex, currentMoment?.momentId]);

  // Story Timer (5 seconds for photos, video duration for videos)
  useEffect(() => {
    if (isPaused || !currentMoment) return;

    const interval = 50; // ms
    const duration = currentMoment.mediaType === 'video' ? videoDurationMs : 5000;
    const step = (interval / duration) * 100;

    timerRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return Math.min(100, prev + step);
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isPaused, currentMoment, videoDurationMs]);

  // Handle story advance when progress completes
  useEffect(() => {
    if (progress >= 100) {
      if (currentIndex < moments.length - 1) {
        setCurrentIndex((c) => c + 1);
        setProgress(0);
      } else {
        navigate('/pulse');
      }
    }
  }, [progress, currentIndex, moments.length, navigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ' || e.key === 'Spacebar') {
        setIsPaused((p) => !p);
      }
      if (e.key === 'Escape') navigate('/pulse');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, moments.length]);

  const showToast = (msg: string) => {
    setToastFeedback(msg);
    setTimeout(() => setToastFeedback(null), 2500);
  };

  const handleNext = () => {
    if (currentIndex < moments.length - 1) {
      setCurrentIndex((c) => c + 1);
      setProgress(0);
    } else {
      navigate('/pulse');
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((c) => c - 1);
      setProgress(0);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 80 * 1024 * 1024) {
      setCreateError('File size exceeds the 80MB limit.');
      return;
    }

    try {
      setIsUploading(true);
      setCreateError(null);
      setUploadPercent(15);

      const uploaded = await uploadMediaFile(file, 'moments', (progress) => {
        setUploadPercent(progress);
      });

      setMomentFile(uploaded);
      setIsUploading(false);
      setUploadPercent(100);
    } catch (err: unknown) {
      const e = err as Error;
      setCreateError(e.message || 'Failed to upload media asset.');
      setIsUploading(false);
    }
  };

  const handleCreateMoment = () => {
    if (!momentFile && !newText.trim()) return;

    dataStore.createMoment({
      media: momentFile?.url || null,
      mediaType: momentFile?.type === 'video' ? 'video' : 'photo',
      text: newText.trim() || null,
      backgroundColor: '#141416',
    });

    setIsCreateOpen(false);
    setMomentFile(null);
    setNewText('');
    setCurrentIndex(0);
    showToast('24h Moment published to your orbit.');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentMoment) return;

    const conv = dataStore.getOrCreateConversation({
      uid: currentMoment.author.uid,
      displayName: currentMoment.author.displayName,
      username: currentMoment.author.username,
      photoURL: currentMoment.author.photoURL,
    });

    dataStore.sendMessage(conv.conversationId, `[Replied to Story]: ${replyText.trim()}`);
    setReplyText('');
    showToast('Reply transmitted via Nexus Direct.');
  };

  const handleReaction = (signalEmoji: string) => {
    if (!currentMoment) return;
    currentMoment.signalCount += 1;
    setMoments([...moments]);

    const conv = dataStore.getOrCreateConversation({
      uid: currentMoment.author.uid,
      displayName: currentMoment.author.displayName,
      username: currentMoment.author.username,
      photoURL: currentMoment.author.photoURL,
    });

    dataStore.sendMessage(conv.conversationId, `[Reacted to Story]: ${signalEmoji}`);
    showToast(`Signal emitted: ${signalEmoji}`);
  };

  if (!currentMoment) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] md:min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6 text-white">
        <EmptyState
          variant="stories"
          actionLabel="+ Create Moment"
          onAction={() => setIsCreateOpen(true)}
        />

        {/* Create Moment Modal */}
        <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Broadcast 24h Moment">
          <div className="space-y-4 py-2 text-white">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*"
              className="hidden"
            />

            {momentFile ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-black/90 aspect-[9/14] max-h-[300px] flex items-center justify-center mx-auto">
                {momentFile.type === 'video' ? (
                  <video src={momentFile.url} controls className="w-full h-full object-contain" />
                ) : (
                  <img src={momentFile.url} alt="Preview" className="w-full h-full object-contain" />
                )}
                <button
                  type="button"
                  onClick={() => setMomentFile(null)}
                  className="absolute top-3 right-3 p-1 rounded-full bg-black/80 text-white"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 rounded-2xl border-2 border-dashed border-white/20 hover:border-primary/60 bg-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                </div>
                <span className="text-xs font-bold text-white">Upload Visual Asset</span>
                <span className="text-[10px] text-zinc-400">Photo or short video (Expires in 24h)</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Moment Thought / Caption</label>
              <textarea
                rows={3}
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="What's unfolding in your research orbit?"
                className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateMoment}
                disabled={!momentFile && !newText.trim()}
                className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] disabled:opacity-40"
              >
                Broadcast Moment
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  const isVideo = currentMoment.mediaType === 'video' || currentMoment.media?.includes('.mp4') || currentMoment.media?.includes('video');

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] md:min-h-screen bg-[#070709] flex items-center justify-center p-2 sm:p-4 md:p-6 relative select-none overflow-hidden text-white">
      {/* Toast Feedback */}
      {toastFeedback && (
        <div className="fixed top-6 z-50 px-4 py-2.5 rounded-2xl bg-zinc-900/95 border border-primary/40 text-white text-xs font-semibold shadow-2xl backdrop-blur-xl animate-in fade-in flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">sensors</span>
          <span>{toastFeedback}</span>
        </div>
      )}

      {/* Top Left Navigation Indicator */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-3">
        <button
          onClick={() => navigate('/pulse')}
          className="p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-all flex items-center justify-center border border-white/10"
          title="Close Stories"
          aria-label="Close Stories"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md border border-white/10 flex items-center gap-1.5 transition-all"
        >
          <span className="material-symbols-outlined text-sm text-primary">add</span>
          <span>Add Moment</span>
        </button>
      </div>

      {/* Navigation Arrow Left */}
      <button
        onClick={handlePrev}
        disabled={currentIndex === 0}
        className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 disabled:opacity-20 text-white backdrop-blur-md border border-white/10 items-center justify-center transition-all hover:scale-110"
        title="Previous Moment"
      >
        <span className="material-symbols-outlined text-xl">arrow_back</span>
      </button>

      {/* Navigation Arrow Right */}
      <button
        onClick={handleNext}
        disabled={currentIndex === moments.length - 1}
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 disabled:opacity-20 text-white backdrop-blur-md border border-white/10 items-center justify-center transition-all hover:scale-110"
        title="Next Moment"
      >
        <span className="material-symbols-outlined text-xl">arrow_forward</span>
      </button>

      {/* 9:16 Vertical Story Frame */}
      <div
        className="relative w-full max-w-[420px] h-[calc(100dvh-5.5rem)] md:h-[800px] max-h-[88vh] rounded-3xl overflow-hidden bg-zinc-950 border border-white/15 shadow-2xl flex flex-col justify-between"
        style={{ aspectRatio: '9 / 16' }}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={(e) => {
          setIsPaused(true);
          touchStartXRef.current = e.touches[0].clientX;
          touchStartYRef.current = e.touches[0].clientY;
        }}
        onTouchEnd={(e) => {
          setIsPaused(false);
          if (touchStartXRef.current !== null && touchStartYRef.current !== null) {
            const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
            const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
            // Detect horizontal swipe > 45px with minimal vertical deflection
            if (Math.abs(deltaX) > 45 && Math.abs(deltaY) < 60) {
              if (deltaX < 0) {
                handleNext();
              } else {
                handlePrev();
              }
            }
          }
          touchStartXRef.current = null;
          touchStartYRef.current = null;
        }}
      >
        {/* Tap zones for quick tap navigation */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute left-0 top-16 bottom-24 w-1/3 z-20 cursor-pointer"
        />
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-0 top-16 bottom-24 w-1/3 z-20 cursor-pointer"
        />

        {/* =========================================================================
            1. TOP HEADER & PROGRESS BARS (Pinned to TOP with subtle gradient)
           ========================================================================= */}
        <div className="relative z-30 flex flex-col pt-3.5 px-4 pb-4 space-y-2 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-auto">
          {/* Multi-Segment Top Progress Indicators */}
          <div className="flex items-center gap-1.5 w-full">
            {moments.map((m, idx) => {
              let fillPct = 0;
              if (idx < currentIndex) fillPct = 100;
              else if (idx === currentIndex) fillPct = progress;

              return (
                <div key={m.momentId} className="h-1 flex-1 rounded-full bg-white/25 overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-75 ease-linear"
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Author Header & Story Controls */}
          <div className="flex items-center justify-between w-full pt-1">
            <div
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${currentMoment.author.username || currentMoment.author.uid}`);
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <Avatar src={resolveAvatarSrc(currentMoment.author)} name={currentMoment.author.displayName} size="sm" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white group-hover:text-primary transition-colors truncate max-w-[170px]">
                  {currentMoment.author.displayName}
                </div>
                <div className="text-[10px] text-zinc-300 font-medium">
                  {new Date(currentMoment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • 24h Moment
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isVideo && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  <span className="material-symbols-outlined text-sm">
                    {isMuted ? 'volume_off' : 'volume_up'}
                  </span>
                </button>
              )}

              {isAuthor && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsViewersModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-full bg-black/60 text-[10px] font-bold text-primary border border-primary/30 flex items-center gap-1 hover:bg-black/80 transition-all cursor-pointer"
                  title="Inspect Viewers"
                >
                  <span className="material-symbols-outlined text-xs">visibility</span>
                  <span>{currentMoment.viewCount || 1} Views</span>
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/pulse');
                }}
                className="p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-colors"
                title="Close Moment"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Media Presentation Layer */}
        <div className="absolute inset-0 w-full h-full z-10 flex items-center justify-center bg-black">
          {currentMoment.media ? (
            isVideo ? (
              <video
                ref={videoRef}
                src={currentMoment.media}
                autoPlay
                muted={isMuted}
                playsInline
                onLoadedMetadata={(e) => {
                  const dur = (e.currentTarget.duration || 7) * 1000;
                  setVideoDurationMs(Math.max(3000, dur));
                }}
                onEnded={() => handleNext()}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={currentMoment.media}
                alt="Story media"
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div
              className="w-full h-full flex items-center justify-center p-8 text-center"
              style={{ backgroundColor: currentMoment.backgroundColor || '#160a2c' }}
            >
              <p className="text-base sm:text-lg font-bold text-white leading-relaxed drop-shadow-lg">
                {currentMoment.text}
              </p>
            </div>
          )}
        </div>

        {/* =========================================================================
            3. BOTTOM INTERACTIVE FOOTER (Caption, Quick Reactions & Reply Form)
           ========================================================================= */}
        <div
          className="relative z-30 flex flex-col p-4 space-y-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Optional Caption Overlay */}
          {currentMoment.media && currentMoment.text && (
            <div className="text-center pointer-events-none pb-1">
              <p className="text-xs sm:text-sm font-semibold text-white bg-black/60 px-3.5 py-1.5 rounded-2xl backdrop-blur-md inline-block border border-white/10">
                {currentMoment.text}
              </p>
            </div>
          )}

          {/* Quick Reaction Bar */}
          <div className="flex items-center justify-around px-2">
            {[
              { label: 'Insight', icon: '🧠' },
              { label: 'Resonate', icon: '⚡' },
              { label: 'Spark', icon: '✨' },
              { label: 'Echo', icon: '🌊' },
              { label: 'Beacon', icon: '🔥' },
            ].map((reaction) => (
              <button
                key={reaction.label}
                type="button"
                onClick={() => handleReaction(reaction.icon)}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-sm flex items-center justify-center backdrop-blur-md border border-white/10 hover:scale-115 transition-transform"
                title={reaction.label}
              >
                {reaction.icon}
              </button>
            ))}
          </div>

          {/* Message Reply Form */}
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Transmit thought to ${currentMoment.author.displayName}...`}
              className="flex-1 bg-black/70 border border-white/15 focus:border-primary rounded-full px-4 py-2 text-xs text-white placeholder:text-zinc-500 backdrop-blur-md focus:outline-none"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="w-8 h-8 rounded-full bg-gradient-to-r from-[#7a00ff] to-[#0066ff] disabled:opacity-30 text-white flex items-center justify-center shadow-md transition-all hover:scale-105"
            >
              <span className="material-symbols-outlined text-sm ml-0.5">send</span>
            </button>
          </form>
        </div>
      </div>

      {/* Create Story Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Broadcast 24h Moment">
        <div className="space-y-4 py-2 text-white">
          {createError && (
            <div className="p-3 rounded-xl bg-error/15 border border-error/30 text-error text-xs">
              {createError}
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*"
            className="hidden"
          />

          {momentFile ? (
            <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-black/90 aspect-[9/14] max-h-[300px] flex items-center justify-center mx-auto">
              {momentFile.type === 'video' ? (
                <video src={momentFile.url} controls className="w-full h-full object-contain" />
              ) : (
                <img src={momentFile.url} alt="Preview" className="w-full h-full object-contain" />
              )}
              <button
                type="button"
                onClick={() => setMomentFile(null)}
                className="absolute top-3 right-3 p-1 rounded-full bg-black/80 text-white"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 rounded-2xl border-2 border-dashed border-white/20 hover:border-primary/60 bg-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
              </div>
              <span className="text-xs font-bold text-white">Upload Visual Asset</span>
              <span className="text-[10px] text-zinc-400">Photo or short video (Expires in 24h)</span>
            </div>
          )}

          {isUploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-zinc-300">
                <span>Uploading to Cloudinary...</span>
                <span>{uploadPercent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Moment Thought / Caption</label>
            <textarea
              rows={3}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="What's unfolding in your research orbit?"
              className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateMoment}
              disabled={isUploading || (!momentFile && !newText.trim())}
              className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] disabled:opacity-40"
            >
              Broadcast Moment
            </button>
          </div>
        </div>
      </Modal>

      {/* Story Viewers Inspection Modal */}
      <Modal
        isOpen={isViewersModalOpen}
        onClose={() => setIsViewersModalOpen(false)}
        title="Moment Viewers & Resonators"
      >
        <div className="space-y-4 py-2 text-white">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">visibility</span>
              <span className="text-xs font-bold text-white">Total Unique Views</span>
            </div>
            <span className="text-sm font-extrabold text-primary">{currentMoment?.viewCount || 1}</span>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pioneers in Orbit</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {dataStore.getUsers().slice(0, 3).map((u) => (
                <div key={u.uid} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={resolveAvatarSrc(u)} name={u.displayName} size="sm" />
                    <div>
                      <span className="text-xs font-bold text-white block">{u.displayName}</span>
                      <span className="text-[10px] text-zinc-400">@{u.username}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Viewed</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
