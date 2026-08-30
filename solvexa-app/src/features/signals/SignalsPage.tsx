import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dataStore } from '../../services/store/dataStore';
import { useAuth } from '../auth/AuthContext';
import type { Signal } from '../../types/signal.types';
import { Avatar } from '../../components/common/Avatar';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { uploadMediaFile, getSignalThumbnail, getCloudinaryVideoThumbnail } from '../../services/storage/mediaUpload';

export default function SignalsPage() {
  const { solvexaUser, dataMode } = useAuth();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Upload Signal Modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoCaption, setVideoCaption] = useState('');
  const [videoTopics, setVideoTopics] = useState('AI, WebGPU, SignalFlow');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Edit Signal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const [editTopics, setEditTopics] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Signal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  // Load and subscribe to dataStore signals
  useEffect(() => {
    const syncSignals = () => {
      setSignals(dataStore.getSignals());
    };
    syncSignals();
    const unsub = dataStore.subscribe(syncSignals);
    return () => unsub();
  }, []);

  const currentSignal = signals[currentIndex];
  const currentUserId = solvexaUser?.uid;
  const isAuthor = Boolean(currentUserId && currentSignal && currentSignal.authorId === currentUserId);

  useEffect(() => {
    if (videoPlayerRef.current) {
      if (isPlaying) {
        videoPlayerRef.current.play().catch(() => {});
      } else {
        videoPlayerRef.current.pause();
      }
    }
  }, [isPlaying, currentIndex]);

  const showToast = (msg: string) => {
    setShareToast(msg);
    setTimeout(() => setShareToast(null), 3000);
  };

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying((prev) => !prev);
  };

  const handleNext = () => {
    if (currentIndex < signals.length - 1) {
      setCurrentIndex((i) => i + 1);
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setIsPlaying(true);
    }
  };

  const handleToggleResonate = () => {
    if (!currentSignal) return;
    dataStore.toggleResonateSignal(currentSignal.id);
  };

  const handleToggleBookmark = () => {
    if (!currentSignal) return;
    dataStore.toggleBookmarkSignal(currentSignal.id);
    showToast(currentSignal.isBookmarked ? 'Signal removed from vault.' : 'Signal saved to your vault.');
  };

  const handleToggleFollow = () => {
    if (!currentSignal) return;
    dataStore.toggleFollowUser(currentSignal.authorId);
  };

  const handleMessageCreator = () => {
    if (!currentSignal) return;
    if (isAuthor) {
      showToast('This is your own signal broadcast.');
      return;
    }

    const conv = dataStore.getOrCreateConversation({
      uid: currentSignal.authorId,
      displayName: currentSignal.authorName,
      username: currentSignal.authorUsername,
      photoURL: currentSignal.authorAvatar,
    });

    navigate(`/messages?id=${conv.conversationId}`);
  };

  const handleShareSignal = () => {
    if (!currentSignal) return;
    navigator.clipboard?.writeText(window.location.origin + `/signals?id=${currentSignal.id}`);
    showToast('Signal link copied to clipboard.');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentSignal) return;
    currentSignal.commentCount += 1;
    setNewComment('');
    setCommentsOpen(false);
    showToast('Insight comment posted.');
  };

  // --- EDIT SIGNAL ---
  const handleOpenEdit = () => {
    if (!currentSignal) return;
    setEditCaption(currentSignal.caption);
    setEditTopics(currentSignal.topics ? currentSignal.topics.join(', ') : '');
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSignal) return;

    try {
      setIsSavingEdit(true);
      setEditError(null);

      const parsedTopics = editTopics
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      await dataStore.editSignal(currentSignal.id, {
        caption: editCaption.trim(),
        topics: parsedTopics.length > 0 ? parsedTopics : currentSignal.topics,
      });

      setIsSavingEdit(false);
      setIsEditOpen(false);
      showToast('Signal updated successfully.');
    } catch (err: unknown) {
      const e = err as Error;
      setIsSavingEdit(false);
      setEditError(e.message || 'Failed to update signal.');
    }
  };

  // --- DELETE SIGNAL ---
  const handleOpenDelete = () => {
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentSignal) return;

    try {
      setIsDeleting(true);
      await dataStore.deleteSignal(currentSignal.id);
      setIsDeleting(false);
      setIsDeleteOpen(false);
      if (currentIndex > 0) {
        setCurrentIndex((i) => i - 1);
      }
      showToast('Signal removed from the network.');
    } catch (err: unknown) {
      const e = err as Error;
      setIsDeleting(false);
      showToast(`Delete failed: ${e.message || 'Network error'}`);
    }
  };

  // --- UPLOAD SIGNAL ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) {
      setUploadError('Please select a valid media file (MP4, WebM, PNG, JPEG, WebP).');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setUploadError('Media file size exceeds the 100MB limit.');
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveMedia = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a media file.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(10);

      const uploaded = await uploadMediaFile(selectedFile, 'signals', (progress) => {
        setUploadProgress(progress);
      });

      // ── Validate the uploaded URL is a real https:// URL ──────────────────
      // The upload may return a blob: or data: URL in dev (Cloudinary not configured).
      // We allow data: URLs in dev but never undefined/empty.
      if (!uploaded.url || typeof uploaded.url !== 'string' || uploaded.url.trim() === '') {
        throw new Error('Upload did not return a valid media URL. Please try again.');
      }

      const mediaType = uploaded.type; // 'image' | 'video'

      // ── Derive a proper static thumbnail URL ──────────────────────────────
      // For VIDEO uploads: thumbnailUrl should be a JPEG poster, NOT the .mp4 URL.
      //   Cloudinary's transformation converts /video/upload/ → /image/upload/ + .jpg
      //   This avoids browser broken-image when thumbnailUrl is used in <img src>.
      // For IMAGE uploads: thumbnailUrl === uploaded.url (the image itself).
      let thumbnailUrl: string;
      if (mediaType === 'video') {
        const derived = getCloudinaryVideoThumbnail(uploaded.url);
        // Fall back to the video URL itself only if we can't derive a poster
        // (e.g. dev mode data: URL). In that case ProfilePage's onError handles it.
        thumbnailUrl = derived || uploaded.url;
      } else {
        thumbnailUrl = uploaded.url;
      }

      const parsedTopics = videoTopics
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const newSignal: Signal = {
        id: `sig_${Date.now()}`,
        authorId: solvexaUser?.uid || 'user_anonymous',
        authorName: solvexaUser?.displayName || 'Solvexa Pioneer',
        authorUsername: solvexaUser?.username || 'pioneer',
        authorAvatar: solvexaUser?.photoURL || null,
        videoUrl: uploaded.url,       // The actual Cloudinary media URL (mp4 / jpg)
        thumbnailUrl,                 // Always a static image URL for <img src> use
        mediaType,                    // 'image' | 'video' — self-describing signal type
        caption: videoCaption.trim() || 'New mesh signal broadcast.',
        topics: parsedTopics.length > 0 ? parsedTopics : ['SignalFlow'],
        soundTitle: 'Original Audio',
        soundAuthor: solvexaUser?.displayName || 'Solvexa Pioneer',
        resonanceCount: 0,
        commentCount: 0,
        shareCount: 0,
        isResonated: false,
        isBookmarked: false,
        aspectRatio: '9:16',
        createdAt: new Date().toISOString(),
      };

      dataStore.addSignal(newSignal);
      setIsUploadOpen(false);
      handleRemoveMedia();
      setVideoCaption('');
      setVideoTopics('');
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentIndex(0);
      showToast('Signal broadcasted to the mesh.');
    } catch (err: unknown) {
      const e = err as Error;
      setUploadError(e.message || 'Upload failed. Please check your connection.');
      setIsUploading(false);
    }
  };

  // ─── UPLOAD SIGNAL MODAL ───────────────────────────────────────────────────
  // Rendered here (outside both returns) so it is always mounted regardless of
  // whether the feed is empty or has signals. Previously it only appeared inside
  // the main return (with signals), so clicking "Upload Signal" in the empty
  // state set isUploadOpen=true but the modal was never in the DOM.
  const uploadModal = (
    <Modal isOpen={isUploadOpen} onClose={() => { setIsUploadOpen(false); handleRemoveMedia(); }} title="Upload Signal (Short Video)" maxWidth="xl">
      <form onSubmit={handleUploadSubmit} className="space-y-6 py-2 text-white min-w-0">
        {uploadError && (
          <div className="p-3.5 rounded-xl bg-error/15 border border-error/30 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
            <span>{uploadError}</span>
          </div>
        )}

        <input
          type="file"
          ref={videoInputRef}
          onChange={handleFileChange}
          accept="video/mp4,video/webm,video/quicktime,video/*,image/png,image/jpeg,image/webp,image/*"
          className="hidden"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
          {/* Left Col: Upload Area */}
          <div className="space-y-2 min-w-0">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Signal Media Asset (MP4 / WebM / Image ≤ 100MB)
            </label>

            {previewUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-black/90 aspect-[9/14] max-h-[380px] flex items-center justify-center p-2 group shadow-2xl mx-auto">
                {selectedFile?.type.startsWith('video/') ? (
                  <video src={previewUrl} controls className="w-full h-full rounded-xl object-contain" />
                ) : (
                  <img src={previewUrl} alt="Preview" className="w-full h-full rounded-xl object-contain" />
                )}
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/80 hover:bg-black text-white backdrop-blur-md border border-white/20 transition-transform group-hover:scale-105"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => videoInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') videoInputRef.current?.click(); }}
                className="rounded-2xl border-2 border-dashed border-white/20 hover:border-primary/60 bg-white/5 aspect-[9/14] max-h-[380px] flex flex-col items-center justify-center gap-3 p-6 text-center cursor-pointer transition-all hover:bg-white/[0.08] group mx-auto"
              >
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform signal-glow">
                  <span className="material-symbols-outlined text-3xl">upload_file</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Select Signal Media</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Vertical format (9:16) recommended</div>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {isUploading && (
              <div className="space-y-1.5 pt-2 animate-in fade-in">
                <div className="flex justify-between text-[11px] font-bold text-zinc-300">
                  <span>Encoding & Uploading to Cloudinary...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 signal-glow"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Col: Metadata */}
          <div className="space-y-4 min-w-0">
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Caption / Thesis
              </label>
              <textarea
                rows={4}
                value={videoCaption}
                onChange={(e) => setVideoCaption(e.target.value)}
                placeholder="Explain the neural pattern, pipeline, or spatial demo..."
                className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Topic Tags (comma-separated)
              </label>
              <input
                type="text"
                value={videoTopics}
                onChange={(e) => setVideoTopics(e.target.value)}
                placeholder="e.g. QuantumFlow, SpatialUI, WebGPU"
                className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => { setIsUploadOpen(false); handleRemoveMedia(); }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUploading || !selectedFile}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 shadow-lg shadow-purple-900/40 disabled:opacity-40 transition-all flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                <span>Broadcasting ({uploadProgress}%)...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">send</span>
                <span>Broadcast Signal</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );

  if (!currentSignal) {
    return (
      <>
        <div className="w-full min-h-[calc(100vh-4rem)] md:min-h-screen bg-[#070709] flex items-center justify-center p-6 text-white">
          <EmptyState
            variant="signals"
            onAction={() => setIsUploadOpen(true)}
          />
        </div>
        {/* Modal must render here too — otherwise isUploadOpen=true has no effect in empty state */}
        {uploadModal}
      </>
    );
  }

  return (
    <div className="relative w-full min-w-0 min-h-[calc(100vh-4rem)] md:min-h-screen bg-[#070709] flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden select-none">
      {/* Toast */}
      {shareToast && (
        <div className="fixed top-5 z-50 px-4 py-2.5 rounded-2xl bg-zinc-900/95 border border-primary/40 text-white text-xs font-semibold shadow-2xl backdrop-blur-xl animate-in fade-in flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">sensors</span>
          <span>{shareToast}</span>
        </div>
      )}

      {/* Top Floating Controls */}
      <div className="absolute top-4 z-30 flex items-center gap-3">
        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-xl border border-white/15 flex items-center gap-1.5 transition-all shadow-lg hover:scale-105"
        >
          <span className="material-symbols-outlined text-sm text-primary">videocam</span>
          <span>Broadcast Signal</span>
        </button>

        {dataMode === 'DEMO' && (
          <span className="px-3 py-1 rounded-xl bg-primary/10 border border-primary/25 text-primary text-[11px] font-bold">
            Demo Mode
          </span>
        )}
      </div>

      {/* Navigation Arrow Left / Prev */}
      <div className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-20 flex-col gap-3">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 disabled:opacity-20 text-white backdrop-blur-md border border-white/15 flex items-center justify-center transition-all hover:scale-110"
          title="Previous Signal (Up)"
          aria-label="Previous Signal"
        >
          <span className="material-symbols-outlined text-xl">expand_less</span>
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === signals.length - 1}
          className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 disabled:opacity-20 text-white backdrop-blur-md border border-white/15 flex items-center justify-center transition-all hover:scale-110"
          title="Next Signal (Down)"
          aria-label="Next Signal"
        >
          <span className="material-symbols-outlined text-xl">expand_more</span>
        </button>
      </div>

      {/* Main Responsive Vertical Video Container */}
      <div
        key={currentSignal.id}
        className="relative w-full max-w-[430px] h-[calc(100dvh-5.5rem)] md:h-[820px] max-h-[88vh] rounded-3xl overflow-hidden bg-zinc-950 border border-white/15 shadow-2xl flex flex-col justify-between"
        style={{ aspectRatio: '9 / 16' }}
      >
        {/* 1. Video / Media Layer */}
        <div
          onClick={handleTogglePlay}
          className="absolute inset-0 w-full h-full cursor-pointer z-0"
        >
          {currentSignal.mediaType === 'image' || /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(currentSignal.videoUrl) ? (
            <img
              src={currentSignal.videoUrl}
              alt={currentSignal.caption}
              className="w-full h-full object-cover pointer-events-none"
            />
          ) : (
            <video
              ref={videoPlayerRef}
              src={currentSignal.videoUrl}
              poster={getSignalThumbnail(currentSignal.thumbnailUrl, currentSignal.videoUrl) || undefined}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover pointer-events-none"
            />
          )}

          <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/80 via-black/35 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-black/65 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-2xl">
                <span className="material-symbols-outlined text-3xl ml-0.5">play_arrow</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Top-Left Overlay (Creator Identity + Caption + Sound Audio) */}
        <div className="relative z-10 p-4 sm:p-5 pr-14 space-y-2 pointer-events-none">
          <div className="flex items-center gap-2.5 pointer-events-auto">
            <Link to={`/profile/${currentSignal.authorUsername}`} className="hover:opacity-90 transition-opacity">
              <Avatar src={currentSignal.authorAvatar} name={currentSignal.authorName} size="sm" hasStory />
            </Link>
            <div className="min-w-0">
              <Link
                to={`/profile/${currentSignal.authorUsername}`}
                className="text-xs sm:text-sm font-bold text-white hover:underline truncate block"
              >
                {currentSignal.authorName}
              </Link>
              <span className="text-[10px] sm:text-xs text-zinc-400 font-medium block">
                @{currentSignal.authorUsername}
              </span>
            </div>
          </div>

          <div className="pointer-events-auto">
            <p className="text-xs sm:text-[13px] text-zinc-200 leading-snug line-clamp-3 font-normal drop-shadow-md">
              {currentSignal.caption}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-300/90 pointer-events-auto">
            <span className="material-symbols-outlined text-xs text-primary">audiotrack</span>
            <span className="truncate max-w-[210px]">{currentSignal.soundTitle} • {currentSignal.soundAuthor}</span>
          </div>
        </div>

        {/* 3. Audio Mute Toggle Button in Top Right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(!isMuted);
          }}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 flex items-center justify-center transition-all"
          title={isMuted ? 'Unmute video' : 'Mute video'}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        >
          <span className="material-symbols-outlined text-base">
            {isMuted ? 'volume_off' : 'volume_up'}
          </span>
        </button>

        {/* 4. Compact Right Action Rail */}
        <div className="absolute right-3 bottom-5 z-20 flex flex-col items-center gap-2.5 w-12 text-white">
          {/* Creator Avatar / Follow */}
          <div className="relative mb-0.5">
            <Link to={`/profile/${currentSignal.authorUsername}`} title={currentSignal.authorName}>
              <Avatar src={currentSignal.authorAvatar} name={currentSignal.authorName} size="sm" />
            </Link>
            {!isAuthor && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFollow();
                }}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white text-[10px] font-bold shadow-md hover:scale-110 transition-transform"
                title="Follow"
                aria-label="Follow author"
              >
                +
              </button>
            )}
          </div>

          {/* Resonate */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleResonate();
            }}
            className="flex flex-col items-center gap-0.5 group"
            title="Resonate"
            aria-label="Resonate"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                currentSignal.isResonated
                  ? 'bg-primary text-black signal-glow scale-105'
                  : 'bg-black/50 hover:bg-black/80 text-white border border-white/10 group-hover:scale-105'
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${currentSignal.isResonated ? 'icon-filled' : ''}`}>
                sensors
              </span>
            </div>
            <span className="text-[10px] font-bold text-zinc-300">{currentSignal.resonanceCount}</span>
          </button>

          {/* Comments */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCommentsOpen(true);
            }}
            className="flex flex-col items-center gap-0.5 group"
            title="Comments"
            aria-label="Comments"
          >
            <div className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/10 flex items-center justify-center backdrop-blur-md transition-all group-hover:scale-105">
              <span className="material-symbols-outlined text-lg">chat_bubble</span>
            </div>
            <span className="text-[10px] font-bold text-zinc-300">{currentSignal.commentCount}</span>
          </button>

          {/* Message Creator (or Author Edit if own signal) */}
          {isAuthor ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEdit();
              }}
              className="flex flex-col items-center gap-0.5 group"
              title="Edit Signal"
              aria-label="Edit Signal"
            >
              <div className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-primary border border-primary/30 flex items-center justify-center backdrop-blur-md transition-all group-hover:scale-105">
                <span className="material-symbols-outlined text-lg">edit</span>
              </div>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMessageCreator();
              }}
              className="flex flex-col items-center gap-0.5 group"
              title="Message Creator"
              aria-label="Message Creator"
            >
              <div className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/10 flex items-center justify-center backdrop-blur-md transition-all group-hover:scale-105">
                <span className="material-symbols-outlined text-lg text-primary">mail</span>
              </div>
            </button>
          )}

          {/* Delete Button (if own signal) or Bookmark */}
          {isAuthor ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDelete();
              }}
              className="flex flex-col items-center gap-0.5 group"
              title="Delete Signal"
              aria-label="Delete Signal"
            >
              <div className="w-10 h-10 rounded-full bg-black/50 hover:bg-error/20 text-error border border-error/30 flex items-center justify-center backdrop-blur-md transition-all group-hover:scale-105">
                <span className="material-symbols-outlined text-lg">delete</span>
              </div>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleBookmark();
              }}
              className="flex flex-col items-center gap-0.5 group"
              title="Save Signal"
              aria-label="Save Signal"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/10 ${
                  currentSignal.isBookmarked
                    ? 'bg-secondary text-black'
                    : 'bg-black/50 hover:bg-black/80 text-white group-hover:scale-105'
                }`}
              >
                <span className={`material-symbols-outlined text-lg ${currentSignal.isBookmarked ? 'icon-filled' : ''}`}>
                  bookmark
                </span>
              </div>
            </button>
          )}

          {/* Share */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShareSignal();
            }}
            className="flex flex-col items-center gap-0.5 group"
            title="Share Signal"
            aria-label="Share Signal"
          >
            <div className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/10 flex items-center justify-center backdrop-blur-md transition-all group-hover:scale-105">
              <span className="material-symbols-outlined text-lg">share</span>
            </div>
          </button>
        </div>
      </div>

      {/* --- EDIT SIGNAL MODAL --- */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Video Signal">
        <form onSubmit={handleSaveEdit} className="space-y-4 py-2 text-white">
          {editError && (
            <div className="p-3.5 rounded-xl bg-error/15 border border-error/30 text-error text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
              <span>{editError}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
              Signal Caption
            </label>
            <textarea
              rows={4}
              required
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
              Topic Tags (comma-separated)
            </label>
            <input
              type="text"
              value={editTopics}
              onChange={(e) => setEditTopics(e.target.value)}
              placeholder="AI, SpatialComputing, WebGPU"
              className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingEdit || !editCaption.trim()}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] shadow-md disabled:opacity-40"
            >
              {isSavingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- DELETE SIGNAL CONFIRMATION MODAL --- */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Video Signal">
        <div className="space-y-4 py-2 text-white">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-error/10 border border-error/20">
            <span className="material-symbols-outlined text-error text-2xl flex-shrink-0">warning</span>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Permanently delete this video signal?</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This action cannot be undone and will permanently remove your signal from the network feed.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-error hover:bg-red-700 shadow-md transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Signal'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Comments Drawer Modal */}
      <Modal isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} title="Signal Insights & Discussion" maxWidth="md">
        <div className="space-y-4 py-2 text-white">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="text-xs font-bold text-white">{currentSignal.authorName}</div>
            <p className="text-xs text-zinc-300">{currentSignal.caption}</p>
          </div>

          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Contribute your insight..."
              className="flex-1 bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold disabled:opacity-40"
            >
              Post
            </button>
          </form>
        </div>
      </Modal>

      {/* Upload Signal Modal — shared variable, also rendered in the empty-state path above */}
      {uploadModal}
    </div>
  );
}
