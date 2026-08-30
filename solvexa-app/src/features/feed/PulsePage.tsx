import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { dataStore } from '../../services/store/dataStore';
import type { Post, SignalType } from '../../types/post.types';
import type { MomentWithAuthor } from '../../types/moment.types';
import { Avatar } from '../../components/common/Avatar';
import { SignalChip } from '../../components/common/SignalChip';
import { ContextShareModal } from '../../components/posts/ContextShareModal';
import { MediaViewer, type MediaViewerItem } from '../../components/common/MediaViewer';
import { uploadMediaFile } from '../../services/storage/mediaUpload';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { formatRelativeTime } from '../../lib/firestoreUtils';


export default function PulsePage() {
  const { solvexaUser, dataMode, exitDemoMode } = useAuth();
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [moments, setMoments] = useState<MomentWithAuthor[]>([]);
  const [feedFilter, setFeedFilter] = useState<'for_you' | 'following' | 'trending' | 'spaces'>('for_you');
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  // Quick Composer states
  const [newContent, setNewContent] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customTags, setCustomTags] = useState('');

  // Native media upload state for post
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'video'; name: string } | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Post More (...) Menu
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);

  // Edit Post State
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTopics, setEditTopics] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Post Confirmation State
  const [deletingPost, setDeletingPost] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Moments Creation Modal
  const [isCreateMomentOpen, setIsCreateMomentOpen] = useState(false);
  const [momentFile, setMomentFile] = useState<{ url: string; type: 'image' | 'video'; name: string } | null>(null);
  const [momentCaption, setMomentCaption] = useState('');
  const momentFileInputRef = useRef<HTMLInputElement>(null);

  // Active Lightbox viewer
  const [lightboxMedia, setLightboxMedia] = useState<MediaViewerItem | null>(null);

  // Active Context Share post
  const [shareModalPost, setShareModalPost] = useState<Post | null>(null);

  // Comments drawer states
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    setIsLoadingFeed(true);
    const syncData = () => {
      setPosts(dataStore.getPosts());
      setMoments(dataStore.getMoments());
      setIsLoadingFeed(false);
    };
    syncData();
    const unsub = dataStore.subscribe(syncData);
    return () => unsub();
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleDocumentClick = () => setActiveMenuPostId(null);
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const [mediaUploadProgress, setMediaUploadProgress] = useState(0);
  const [mediaUploadError, setMediaUploadError] = useState<string | null>(null);
  const [mediaLocalPreviewUrl, setMediaLocalPreviewUrl] = useState<string | null>(null);
  const [selectedFileForPost, setSelectedFileForPost] = useState<File | null>(null);

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileForPost(file);
    const preview = URL.createObjectURL(file);
    setMediaLocalPreviewUrl(preview);
    setMediaUploadError(null);

    try {
      setIsUploadingMedia(true);
      setMediaUploadProgress(10);
      const uploaded = await uploadMediaFile(file, 'posts', (pct) => {
        setMediaUploadProgress(pct);
      });
      setSelectedMedia(uploaded);
      setIsUploadingMedia(false);
      setMediaUploadProgress(100);
    } catch (err: unknown) {
      const e = err as Error;
      setMediaUploadError(e.message || 'Media upload error. Please retry.');
      showToast(e.message || 'Media upload error');
      setIsUploadingMedia(false);
    }
  };

  const handleRetryMediaUpload = async () => {
    if (!selectedFileForPost) return;
    try {
      setIsUploadingMedia(true);
      setMediaUploadError(null);
      setMediaUploadProgress(10);
      const uploaded = await uploadMediaFile(selectedFileForPost, 'posts', (pct) => {
        setMediaUploadProgress(pct);
      });
      setSelectedMedia(uploaded);
      setIsUploadingMedia(false);
      setMediaUploadProgress(100);
    } catch (err: unknown) {
      const e = err as Error;
      setMediaUploadError(e.message || 'Media upload error. Please retry.');
      showToast(e.message || 'Media upload error');
      setIsUploadingMedia(false);
    }
  };

  const handleClearPostMedia = () => {
    if (mediaLocalPreviewUrl) URL.revokeObjectURL(mediaLocalPreviewUrl);
    setMediaLocalPreviewUrl(null);
    setSelectedMedia(null);
    setSelectedFileForPost(null);
    setMediaUploadError(null);
    setMediaUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreatePost = (e: FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() && !selectedMedia && !showPollBuilder) return;

    setIsPublishing(true);

    let formattedPoll = null;
    if (showPollBuilder && pollOptions.filter((o) => o.trim()).length >= 2) {
      formattedPoll = pollOptions
        .filter((o) => o.trim())
        .map((text, idx) => ({ id: `opt_${idx + 1}`, text, voteCount: 0, votedUserIds: [] }));
    }

    const space = dataStore.getSpaces().find((s) => s.id === selectedSpaceId);
    const extractedTags = newContent.match(/#[a-zA-Z0-9_]+/g)?.map((t) => t.slice(1)) || [];
    const manualTags = customTags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
    const combinedTopics = Array.from(new Set([...extractedTags, ...manualTags]));

    try {
      dataStore.createPost({
        content: newContent.trim(),
        media: selectedMedia ? [{ url: selectedMedia.url, type: selectedMedia.type }] : [],
        postType: formattedPoll ? 'poll' : selectedMedia ? selectedMedia.type : 'text',
        spaceId: selectedSpaceId || null,
        spaceName: space?.name,
        topics: combinedTopics.length > 0 ? combinedTopics : ['SignalFlow'],
        pollOptions: formattedPoll,
      });

      setNewContent('');
      handleClearPostMedia();
      setShowPollBuilder(false);
      setPollOptions(['', '']);
      setCustomTags('');
      setIsPublishing(false);
      showToast('Broadcast published to the mesh.');
    } catch (err: unknown) {
      const e = err as Error;
      setIsPublishing(false);
      showToast(e.message || 'Failed to create post. Please try again.');
    }
  };

  // --- EDIT POST ---
  const handleOpenEdit = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuPostId(null);
    setEditingPost(post);
    setEditContent(post.content);
    setEditTopics(post.topics ? post.topics.join(', ') : '');
    setEditError(null);
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    try {
      setIsSavingEdit(true);
      setEditError(null);

      const parsedTopics = editTopics
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      await dataStore.editPost(editingPost.postId, {
        content: editContent.trim(),
        topics: parsedTopics.length > 0 ? parsedTopics : editingPost.topics,
      });

      setIsSavingEdit(false);
      setEditingPost(null);
      showToast('Broadcast updated successfully.');
    } catch (err: unknown) {
      const e = err as Error;
      setIsSavingEdit(false);
      setEditError(e.message || 'Failed to update post. Please try again.');
    }
  };

  // --- DELETE POST ---
  const handleOpenDelete = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuPostId(null);
    setDeletingPost(post);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPost) return;

    try {
      setIsDeleting(true);
      await dataStore.deletePost(deletingPost.postId);
      setIsDeleting(false);
      setDeletingPost(null);
      showToast('Broadcast removed from the network.');
    } catch (err: unknown) {
      const e = err as Error;
      setIsDeleting(false);
      showToast(`Delete failed: ${e.message || 'Network error'}`);
    }
  };

  // --- MOMENTS CREATION ---
  const handleMomentMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploaded = await uploadMediaFile(file, 'moments');
      setMomentFile(uploaded);
    } catch (err: unknown) {
      const e = err as Error;
      showToast(e.message || 'Moment media upload error');
    }
  };

  const handlePublishMoment = () => {
    if (!momentFile && !momentCaption.trim()) return;

    dataStore.createMoment({
      media: momentFile?.url || null,
      mediaType: momentFile?.type === 'video' ? 'video' : 'photo',
      text: momentCaption.trim() || null,
      backgroundColor: '#160a2c',
    });

    setIsCreateMomentOpen(false);
    setMomentFile(null);
    setMomentCaption('');
    showToast('24h Moment broadcasted to your orbit.');
  };

  const handleAddComment = (postId: string) => {
    if (!newCommentText.trim()) return;
    dataStore.addComment(postId, newCommentText.trim());
    setNewCommentText('');
    showToast('Insight added to discussion.');
  };

  const currentUserId = solvexaUser?.uid;

  const filteredPosts = posts.filter((post) => {
    if (feedFilter === 'spaces') return !!post.spaceId;
    if (feedFilter === 'trending') return post.signalCount > 1 || post.commentCount > 0;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl mx-auto pb-24 text-white">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl bg-zinc-900/95 border border-primary/40 text-white text-xs font-semibold shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-base">sensors</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Demo Mode Banner (only when in Demo Mode) */}
      {dataMode === 'DEMO' && (
        <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">science</span>
            <span className="text-zinc-200">
              <strong className="text-white">Demo Mode Active</strong> — Showing simulated mesh signals & creators.
            </span>
          </div>
          <button
            disabled={isSigningIn}
            onClick={() => {
              if (isSigningIn) return;
              setIsSigningIn(true);
              // Must exit Demo Mode (clears isGuest) BEFORE navigating to /login.
              // Without this, PublicOnlyRoute sees isAuthenticated=true and redirects back.
              exitDemoMode();
              navigate('/login');
            }}
            className="px-3 py-1.5 rounded-xl bg-primary/20 hover:bg-primary/40 active:scale-95 text-primary font-bold text-[11px] transition-all disabled:opacity-50 disabled:cursor-wait flex items-center gap-1.5"
          >
            {isSigningIn ? (
              <>
                <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                <span>Opening...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xs">login</span>
                <span>Sign In with Real Account</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 1. Moments / Stories Horizontal Rail (Vertical Cards) */}
      <div className="flex items-center gap-3 overflow-x-auto pb-3 custom-scrollbar">
        {/* Create Moment Vertical Card */}
        <div
          onClick={() => setIsCreateMomentOpen(true)}
          className="w-24 sm:w-28 h-36 sm:h-40 rounded-2xl bg-white/[0.03] border-2 border-dashed border-white/20 hover:border-primary/60 flex-shrink-0 flex flex-col items-center justify-between p-3 cursor-pointer group transition-all hover:scale-102 backdrop-blur-md"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7a00ff] to-[#0066ff] flex items-center justify-center text-white signal-glow group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-xl">add</span>
          </div>
          <div className="text-center">
            <span className="text-[11px] font-bold text-white block">Add Moment</span>
            <span className="text-[9px] text-zinc-500 font-medium">24h Snapshot</span>
          </div>
        </div>

        {/* Existing Moments Vertical Cards */}
        {moments.map((moment) => (
          <div
            key={moment.momentId}
            onClick={() => {
              dataStore.markMomentViewed(moment.momentId);
              navigate('/moments');
            }}
            className={`w-24 sm:w-28 h-36 sm:h-40 rounded-2xl flex-shrink-0 relative overflow-hidden cursor-pointer group transition-all hover:scale-102 border p-1 shadow-lg ${
              moment.hasViewed
                ? 'border-white/10 bg-[#141416]/90'
                : 'border-primary/50 bg-gradient-to-b from-purple-950/40 to-black signal-glow'
            }`}
          >
            {/* Background Media / Gradient */}
            <div className="absolute inset-0 w-full h-full rounded-xl overflow-hidden bg-black/80">
              {moment.media ? (
                moment.mediaType === 'video' ? (
                  <video src={moment.media} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" muted />
                ) : (
                  <img src={moment.media} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                )
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-[10px] font-bold p-2 text-center text-white/90"
                  style={{ backgroundColor: moment.backgroundColor || '#160a2c' }}
                >
                  <p className="line-clamp-4 leading-snug">{moment.text}</p>
                </div>
              )}
              {/* Bottom Gradient Scrim for readable username */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            </div>

            {/* Top Author Avatar Overlay */}
            <div className="relative z-10 p-1.5 flex items-center justify-between">
              <div className="p-0.5 rounded-full bg-black/60 backdrop-blur-md">
                <Avatar src={moment.author.photoURL} name={moment.author.displayName} size="xs" />
              </div>
              {!moment.hasViewed && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-glow" />
              )}
            </div>

            {/* Bottom Author Name */}
            <div className="absolute bottom-2 left-2 right-2 z-10">
              <span className="text-[11px] font-bold text-white truncate block drop-shadow-md">
                {moment.author.displayName.split(' ')[0]}
              </span>
              <span className="text-[9px] text-zinc-400 truncate block">
                @{moment.author.username}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Feed Filter Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        {[
          { id: 'for_you', label: 'For You', icon: 'auto_awesome' },
          { id: 'following', label: 'Following Orbit', icon: 'all_inclusive' },
          { id: 'trending', label: 'High Resonance', icon: 'trending_up' },
          { id: 'spaces', label: 'Spaces', icon: 'hub' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFeedFilter(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              feedFilter === tab.id
                ? 'bg-white/10 text-white border border-white/20 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 3. Quick Post Composer Card */}
      <div className="p-5 rounded-3xl bg-[#141416]/95 border border-white/10 shadow-2xl backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-3">
          <Avatar src={solvexaUser?.photoURL} name={solvexaUser?.displayName} size="md" />
          <input
            type="text"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleCreatePost(e);
              }
            }}
            placeholder="Broadcast research, question, or neural signal..."
            className="flex-1 bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleMediaSelect}
          accept="image/*,video/*"
          className="hidden"
        />

        {/* Uploaded Media Preview & Upload Progress */}
        {(mediaLocalPreviewUrl || selectedMedia) && (
          <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/60 max-h-[380px] flex flex-col items-center justify-center p-2">
            {selectedFileForPost?.type.startsWith('video/') || selectedMedia?.type === 'video' ? (
              <video src={mediaLocalPreviewUrl || selectedMedia?.url} controls className="max-h-[340px] w-auto h-auto rounded-xl object-contain" />
            ) : (
              <img src={mediaLocalPreviewUrl || selectedMedia?.url} alt="Upload preview" className="max-h-[340px] w-auto h-auto rounded-xl object-contain" />
            )}

            {/* Upload Progress Overlay */}
            {isUploadingMedia && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4 z-20">
                <div className="w-9 h-9 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold text-white block">Transmitting Media to Cloudinary...</span>
                  <span className="text-[11px] font-semibold text-primary">{mediaUploadProgress}%</span>
                </div>
                <div className="w-44 h-1.5 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#7a00ff] to-[#0066ff] transition-all duration-150"
                    style={{ width: `${mediaUploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload Error Banner with Retry */}
            {mediaUploadError && !isUploadingMedia && (
              <div className="absolute inset-x-3 bottom-3 p-3 rounded-xl bg-red-950/90 border border-red-500/40 backdrop-blur-md flex items-center justify-between z-20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-400 text-sm">error</span>
                  <span className="text-xs text-red-200 font-medium">{mediaUploadError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRetryMediaUpload}
                  className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all"
                >
                  Retry
                </button>
              </div>
            )}

            {!isUploadingMedia && (
              <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 rounded-xl bg-black/80 hover:bg-black text-white text-xs font-bold backdrop-blur-md border border-white/20"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleClearPostMedia}
                  className="p-1.5 rounded-full bg-black/80 hover:bg-black text-white backdrop-blur-md border border-white/20"
                  title="Remove media"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Interactive Poll Builder */}
        {showPollBuilder && (
          <div className="space-y-2 p-3.5 rounded-xl bg-black/40 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Create Live Poll
              </span>
              <button
                onClick={() => setShowPollBuilder(false)}
                className="text-zinc-500 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>
            {pollOptions.map((opt, i) => (
              <input
                key={i}
                type="text"
                value={opt}
                onChange={(e) => {
                  const copy = [...pollOptions];
                  copy[i] = e.target.value;
                  setPollOptions(copy);
                }}
                placeholder={`Option ${i + 1}`}
                className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
            ))}
            {pollOptions.length < 4 && (
              <button
                type="button"
                onClick={() => setPollOptions([...pollOptions, ''])}
                className="text-xs text-primary font-semibold hover:underline"
              >
                + Add another option
              </button>
            )}
          </div>
        )}

        {/* Collapsible Advanced Options */}
        {showAdvanced && (
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-3 animate-in fade-in duration-150">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Target Space / Community</label>
              <select
                value={selectedSpaceId}
                onChange={(e) => setSelectedSpaceId(e.target.value)}
                className="w-full bg-[#1c1b1c] border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
              >
                <option value="">Public Feed</option>
                {dataStore.getSpaces().map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Custom Topic Tags (comma separated)</label>
              <input
                type="text"
                value={customTags}
                onChange={(e) => setCustomTags(e.target.value)}
                placeholder="AI, WebGPU, Quantum"
                className="w-full bg-[#1c1b1c] border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Composer Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingMedia}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all"
            >
              <span className="material-symbols-outlined text-primary text-[18px]">photo_library</span>
              <span>{isUploadingMedia ? 'Uploading...' : 'Photo / Video'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPollBuilder(!showPollBuilder)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                showPollBuilder ? 'bg-primary/20 text-primary' : 'bg-white/5 hover:bg-white/10 text-zinc-300'
              }`}
            >
              <span className="material-symbols-outlined text-cyan-400 text-[18px]">poll</span>
              <span>Poll</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-zinc-400 hover:text-white px-2 py-1 flex items-center gap-1"
            >
              <span>Options</span>
              <span className="material-symbols-outlined text-sm">{showAdvanced ? 'expand_less' : 'expand_more'}</span>
            </button>
          </div>

          <button
            onClick={handleCreatePost}
            disabled={isPublishing || isUploadingMedia || (!newContent.trim() && !selectedMedia && !showPollBuilder)}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 transition-all shadow-lg shadow-purple-900/40 disabled:opacity-40"
          >
            {isPublishing ? 'Publishing...' : 'Broadcast'}
          </button>
        </div>
      </div>

      {/* 4. Posts Feed */}
      <div className="space-y-6">
        {isLoadingFeed ? (
          // Skeleton Loader
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-3xl bg-[#141416]/60 border border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-28 h-3.5 bg-white/10 rounded" />
                    <div className="w-20 h-2.5 bg-white/5 rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-3 bg-white/10 rounded" />
                  <div className="w-3/4 h-3 bg-white/10 rounded" />
                </div>
                <div className="h-44 bg-white/5 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <EmptyState
            variant="posts"
            onAction={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : (
          filteredPosts.map((post) => {
            const isAuthor = Boolean(currentUserId && post.authorId === currentUserId);

            return (
              <div
                key={post.postId}
                className="p-6 rounded-3xl bg-[#141416]/90 border border-white/10 hover:border-white/20 backdrop-blur-xl shadow-xl transition-all space-y-4 relative"
              >
                {/* Post Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link to={`/profile/${post.authorId || post.authorUsername || 'user'}`}>
                      <Avatar src={post.authorAvatar} name={post.authorName} size="md" hasStory />
                    </Link>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/profile/${post.authorId || post.authorUsername || 'user'}`}
                          className="text-sm font-bold text-white hover:text-primary transition-colors"
                        >
                          {post.authorName}
                        </Link>
                        <span className="material-symbols-outlined text-primary text-sm icon-filled">
                          verified
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500">
                        @{post.authorUsername} •{' '}
                        <span className="text-zinc-400">
                          {formatRelativeTime(post.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>


                  {/* Right Header Actions: Space Badge + 3-Dot More Menu */}
                  <div className="flex items-center gap-2">
                    {post.spaceName && (
                      <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        {post.spaceName}
                      </span>
                    )}

                    {/* More (...) Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuPostId(activeMenuPostId === post.postId ? null : post.postId);
                        }}
                        className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="More options"
                      >
                        <span className="material-symbols-outlined text-base">more_horiz</span>
                      </button>

                      {activeMenuPostId === post.postId && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-full mt-1.5 w-44 rounded-2xl bg-[#1c1b1c] border border-white/15 shadow-2xl p-1.5 z-40 animate-in fade-in space-y-1 text-xs"
                        >
                          {isAuthor ? (
                            <>
                              <button
                                onClick={(e) => handleOpenEdit(post, e)}
                                className="w-full px-3 py-2 rounded-xl text-left text-zinc-200 hover:bg-white/10 flex items-center gap-2"
                              >
                                <span className="material-symbols-outlined text-sm text-primary">edit</span>
                                <span>Edit Broadcast</span>
                              </button>
                              <button
                                onClick={(e) => handleOpenDelete(post, e)}
                                className="w-full px-3 py-2 rounded-xl text-left text-error hover:bg-error/10 flex items-center gap-2"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                                <span>Delete Broadcast</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  dataStore.toggleSavePost(post.postId);
                                  setActiveMenuPostId(null);
                                  showToast(post.isSaved ? 'Bookmark removed.' : 'Signal saved to your vault.');
                                }}
                                className="w-full px-3 py-2 rounded-xl text-left text-zinc-200 hover:bg-white/10 flex items-center gap-2"
                              >
                                <span className="material-symbols-outlined text-sm text-cyan-400">bookmark</span>
                                <span>{post.isSaved ? 'Unsave' : 'Save Signal'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuPostId(null);
                                  showToast('Report submitted for moderation.');
                                }}
                                className="w-full px-3 py-2 rounded-xl text-left text-error hover:bg-error/10 flex items-center gap-2"
                              >
                                <span className="material-symbols-outlined text-sm">flag</span>
                                <span>Report Broadcast</span>
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(window.location.origin + `/pulse?post=${post.postId}`);
                              setActiveMenuPostId(null);
                              showToast('Signal link copied to clipboard.');
                            }}
                            className="w-full px-3 py-2 rounded-xl text-left text-zinc-300 hover:bg-white/10 flex items-center gap-2 border-t border-white/5 pt-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">link</span>
                            <span>Copy Link</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content text */}
                <p className="text-sm text-zinc-200 whitespace-pre-line leading-relaxed">
                  {post.content}
                </p>

                {/* Media Image / Video rendering with Lightbox Click */}
                {post.media && post.media.length > 0 && (
                  <div
                    onClick={() =>
                      setLightboxMedia({
                        url: post.media![0].url,
                        type: post.media![0].type as any,
                        postId: post.postId,
                        authorName: post.authorName,
                        authorUsername: post.authorUsername,
                        authorAvatar: post.authorAvatar,
                        caption: post.content,
                        createdAt: post.createdAt,
                        topics: post.topics,
                        signalCount: post.signalCount,
                        commentCount: post.commentCount,
                        mySignal: post.mySignal,
                        isSaved: post.isSaved,
                      })
                    }
                    className="rounded-2xl overflow-hidden max-h-[460px] border border-white/10 bg-black/60 flex items-center justify-center cursor-pointer group relative"
                  >
                    {post.media[0].type === 'video' ? (
                      <video
                        src={post.media[0].url}
                        controls
                        className="w-full max-h-[460px] object-contain"
                      />
                    ) : (
                      <img
                        src={post.media[0].url}
                        alt="Post visual"
                        className="w-full max-h-[460px] object-contain group-hover:scale-[1.01] transition-transform duration-200"
                      />
                    )}
                    <div className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-sm">fullscreen</span>
                    </div>
                  </div>
                )}

                {/* Interactive Polls */}
                {post.pollOptions && (
                  <div className="space-y-2 p-4 rounded-2xl bg-black/40 border border-white/10">
                    {post.pollOptions.map((opt) => {
                      const totalVotes = post.pollOptions!.reduce((acc, o) => acc + o.voteCount, 0) || 1;
                      const pct = Math.round((opt.voteCount / totalVotes) * 100);
                      const isVoted = opt.votedUserIds?.includes(currentUserId || '');

                      return (
                        <button
                          key={opt.id}
                          onClick={() => dataStore.votePoll(post.postId, opt.id)}
                          className={`relative w-full p-3 rounded-xl border text-left overflow-hidden transition-all ${
                            isVoted
                              ? 'border-primary bg-primary/10'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          <div
                            className="absolute inset-0 bg-primary/20 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                          <div className="relative z-10 flex items-center justify-between text-xs font-bold text-white">
                            <span>{opt.text}</span>
                            <span>{pct}% ({opt.voteCount})</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Topic tags */}
                {post.topics && post.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {post.topics.map((t, idx) => (
                      <span
                        key={idx}
                        onClick={() => navigate(`/explore?q=${t}`)}
                        className="text-[11px] font-semibold text-primary/80 hover:text-primary cursor-pointer"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Post Interaction Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  {/* 6 Reaction Signal System */}
                  <SignalChip
                    activeSignal={post.mySignal}
                    count={post.signalCount}
                    onSelectSignal={(type: SignalType) => dataStore.toggleSignal(post.postId, type)}
                  />

                  <div className="flex items-center gap-2">
                    {/* Comments */}
                    <button
                      onClick={() =>
                        setOpenCommentsPostId(openCommentsPostId === post.postId ? null : post.postId)
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                      <span>{post.commentCount}</span>
                    </button>

                    {/* Context Share */}
                    <button
                      onClick={() => setShareModalPost(post)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
                      title="Context Share"
                    >
                      <span className="material-symbols-outlined text-[16px]">share</span>
                      <span>Share</span>
                    </button>

                    {/* Bookmark Save */}
                    <button
                      onClick={() => dataStore.toggleSavePost(post.postId)}
                      className={`p-2 rounded-full transition-colors ${
                        post.isSaved ? 'text-primary bg-primary/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                      title="Save Bookmark"
                    >
                      <span className={`material-symbols-outlined text-[18px] ${post.isSaved ? 'icon-filled' : ''}`}>
                        bookmark
                      </span>
                    </button>
                  </div>
                </div>

                {/* Inline Comments Thread Drawer */}
                {openCommentsPostId === post.postId && (
                  <div className="pt-4 border-t border-white/10 space-y-3 animate-in fade-in duration-200">
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                      {dataStore.getComments(post.postId).map((c) => (
                        <div
                          key={c.commentId}
                          className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3"
                        >
                          <Avatar src={c.authorAvatar} name={c.authorName} size="xs" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{c.authorName}</span>
                              <span className="text-[10px] text-zinc-500">@{c.authorUsername}</span>
                            </div>
                            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{c.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* New Comment Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(post.postId);
                        }}
                        placeholder="Add an insight or reflection..."
                        className="flex-1 bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                      <button
                        onClick={() => handleAddComment(post.postId)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-container transition-all"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* --- EDIT POST MODAL --- */}
      <Modal isOpen={!!editingPost} onClose={() => setEditingPost(null)} title="Edit Broadcast">
        {editingPost && (
          <form onSubmit={handleSaveEdit} className="space-y-4 py-2 text-white">
            {editError && (
              <div className="p-3.5 rounded-xl bg-error/15 border border-error/30 text-error text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
                <span>{editError}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                Broadcast Content
              </label>
              <textarea
                rows={5}
                required
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
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
                placeholder="AI, SpatialUI, SignalMesh"
                className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingEdit || !editContent.trim()}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] shadow-md disabled:opacity-40"
              >
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <Modal isOpen={!!deletingPost} onClose={() => setDeletingPost(null)} title="Delete Broadcast">
        <div className="space-y-4 py-2 text-white">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-error/10 border border-error/20">
            <span className="material-symbols-outlined text-error text-2xl flex-shrink-0">warning</span>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Permanently delete this signal?</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This action cannot be undone. Your broadcast and its associated reactions will be removed from the mesh.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setDeletingPost(null)}
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
              {isDeleting ? 'Deleting...' : 'Delete Broadcast'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Create Moment (24h Story) with Native File Picker */}
      <Modal isOpen={isCreateMomentOpen} onClose={() => setIsCreateMomentOpen(false)} title="Create Moment (24h Story)">
        <div className="space-y-4 py-2 text-white">
          <input
            type="file"
            ref={momentFileInputRef}
            onChange={handleMomentMediaSelect}
            accept="image/*,video/*"
            className="hidden"
          />

          {momentFile ? (
            <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/60 max-h-[300px] flex items-center justify-center p-2">
              {momentFile.type === 'video' ? (
                <video src={momentFile.url} controls className="max-h-[280px] w-auto h-auto rounded-xl object-contain" />
              ) : (
                <img src={momentFile.url} alt="Moment Preview" className="max-h-[280px] w-auto h-auto rounded-xl object-contain" />
              )}
              <button
                type="button"
                onClick={() => setMomentFile(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/80 text-white backdrop-blur-md"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => momentFileInputRef.current?.click()}
              className="p-8 rounded-2xl border-2 border-dashed border-white/20 hover:border-primary/60 bg-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
              </div>
              <span className="text-xs font-bold text-white">Upload Photo or Video</span>
              <span className="text-[10px] text-zinc-400">Select file from your phone gallery or computer</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Moment Caption / Thought</label>
            <textarea
              rows={3}
              value={momentCaption}
              onChange={(e) => setMomentCaption(e.target.value)}
              placeholder="What's happening in your orbit right now?"
              className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsCreateMomentOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePublishMoment}
              disabled={!momentFile && !momentCaption.trim()}
              className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-md disabled:opacity-40"
            >
              Share Moment
            </button>
          </div>
        </div>
      </Modal>

      {/* Shared Lightbox Media Viewer */}
      <MediaViewer
        isOpen={!!lightboxMedia}
        onClose={() => setLightboxMedia(null)}
        media={lightboxMedia}
      />

      {/* Context Share Modal */}
      {shareModalPost && (
        <ContextShareModal
          isOpen={!!shareModalPost}
          onClose={() => setShareModalPost(null)}
          post={shareModalPost}
        />
      )}
    </div>
  );
}
