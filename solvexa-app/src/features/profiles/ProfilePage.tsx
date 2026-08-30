import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dataStore } from '../../services/store/dataStore';
import { useAuth } from '../auth/AuthContext';
import type { SolvexaUser } from '../../types/user.types';
import type { Post } from '../../types/post.types';
import type { SignalVideo } from '../../types/signal.types';
import type { MomentWithAuthor } from '../../types/moment.types';
import { Avatar } from '../../components/common/Avatar';
import { SignalChip } from '../../components/common/SignalChip';
import { Modal } from '../../components/common/Modal';
import { MediaViewer, type MediaViewerItem } from '../../components/common/MediaViewer';
import { uploadMediaFile, getSignalThumbnail } from '../../services/storage/mediaUpload';
import { updateUserProfile, getUserProfile, getUserByUsername } from '../../services/auth/profileService';
import { EmptyState } from '../../components/common/EmptyState';
import { formatRelativeTime } from '../../lib/firestoreUtils';


export default function ProfilePage() {
  const { username } = useParams<{ username?: string }>();
  const { solvexaUser, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState<SolvexaUser | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'signals' | 'moments' | 'orbit' | 'saved'>('posts');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Modals for Followers / Following lists
  const [connectionModalType, setConnectionModalType] = useState<'followers' | 'following' | null>(null);
  const [isResonanceModalOpen, setIsResonanceModalOpen] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [newInterestInput, setNewInterestInput] = useState('');

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Orbit Radar Tier State
  const [orbitTier, setOrbitTier] = useState<'all' | 'inner' | 'extended'>('all');

  // Lightbox Media Viewer
  const [lightboxMedia, setLightboxMedia] = useState<MediaViewerItem | null>(null);

  // Post Edit/Delete States for My Orbit
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostTopics, setEditPostTopics] = useState('');
  const [isSavingPostEdit, setIsSavingPostEdit] = useState(false);
  const [editPostError, setEditPostError] = useState<string | null>(null);
  const [deletingPost, setDeletingPost] = useState<Post | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  // Signal Edit/Delete States for My Orbit
  const [activeMenuSignalId, setActiveMenuSignalId] = useState<string | null>(null);
  const [editingSignal, setEditingSignal] = useState<SignalVideo | null>(null);
  const [editSignalCaption, setEditSignalCaption] = useState('');
  const [editSignalTopics, setEditSignalTopics] = useState('');
  const [isSavingSignalEdit, setIsSavingSignalEdit] = useState(false);
  const [editSignalError, setEditSignalError] = useState<string | null>(null);
  const [deletingSignal, setDeletingSignal] = useState<SignalVideo | null>(null);
  const [isDeletingSignal, setIsDeletingSignal] = useState(false);

  const targetIdentifier = username?.trim() || '';
  const isOwnProfile =
    !targetIdentifier ||
    (Boolean(solvexaUser?.uid) && targetIdentifier === solvexaUser?.uid) ||
    (Boolean(solvexaUser?.username) && targetIdentifier.toLowerCase() === solvexaUser?.username.toLowerCase());

  useEffect(() => {
    let isMounted = true;

    const syncProfile = () => {
      if (isOwnProfile) {
        const me = solvexaUser || dataStore.getCurrentUser();
        if (me) {
          setUser(me);
          setEditName(me.displayName || '');
          setEditUsername(me.username || '');
          setEditBio(me.bio || '');
          setEditLocation(me.location || '');
          setEditWebsite(me.website || '');
          setEditAvatarUrl(me.photoURL || '');
          setEditCoverUrl(me.coverPhotoURL || '');
          setEditInterests(
            me.identityCards?.map((c) => c.label) || ['AI & ML', 'Spatial UI', 'Quantum Mesh', 'Product Design']
          );
        }
      } else {
        const found = dataStore.getUsers().find(
          (u) => u.uid === targetIdentifier || (u.username && u.username.toLowerCase() === targetIdentifier.toLowerCase())
        );
        if (found) {
          setUser(found);
        }

        if (targetIdentifier) {
          setIsLoadingProfile(true);
          // Try loading by UID first, then by normalized username
          getUserProfile(targetIdentifier)
            .then((docUser) => {
              if (!isMounted) return;
              if (docUser) {
                setUser(docUser);
                setIsLoadingProfile(false);
              } else {
                return getUserByUsername(targetIdentifier);
              }
            })
            .then((byUsername) => {
              if (!isMounted) return;
              if (byUsername) {
                setUser(byUsername);
              } else if (!found) {
                // If in DEMO mode, allow mock fallback; in REAL mode, don't fabricate fake users
                const alt = dataStore.getDataMode() === 'DEMO' ? dataStore.getUser(targetIdentifier) : null;
                setUser(alt || null);
              }
            })
            .catch((err) => {
              if (!isMounted) return;
              console.warn('[ProfilePage] Failed to fetch Firestore user:', err);
              if (!found) setUser(null);
            })
            .finally(() => {
              if (isMounted) setIsLoadingProfile(false);
            });
        }
      }
    };

    syncProfile();
    const unsub = dataStore.subscribe(syncProfile);
    return () => {
      isMounted = false;
      unsub();
    };
  }, [targetIdentifier, isOwnProfile, solvexaUser]);


  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6 pb-24 animate-pulse">
        <div className="h-44 sm:h-56 rounded-3xl bg-white/5 border border-white/10" />
        <div className="p-6 rounded-3xl bg-[#141416]/90 border border-white/10 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/10" />
            <div className="space-y-2 flex-1">
              <div className="w-40 h-5 rounded-lg bg-white/10" />
              <div className="w-24 h-3 rounded-lg bg-white/5" />
            </div>
          </div>
          <div className="w-full h-12 rounded-xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6 text-white select-none">
        <EmptyState
          icon="person_off"
          title="Node identity not found"
          description="This profile does not exist or is currently offline from the mesh."
          actionLabel="Back to Pulse"
          onAction={() => navigate('/pulse')}
        />
      </div>
    );
  }

  const userPosts = dataStore.getPosts().filter((p) => p.authorId === user.uid || (user.username && p.authorUsername?.toLowerCase() === user.username.toLowerCase()));
  const userSignals: SignalVideo[] = dataStore.getSignals().filter((s) => s.authorId === user.uid || (user.username && s.authorUsername?.toLowerCase() === user.username.toLowerCase()));
  const userMoments: MomentWithAuthor[] = dataStore.getMoments().filter((m) => m.author.uid === user.uid || (user.username && m.author.username?.toLowerCase() === user.username.toLowerCase()));
  const savedPosts: Post[] = isOwnProfile ? dataStore.getSavedPosts() : [];


  // Orbit Radar Nodes
  const networkUsers = dataStore.getUsers().filter((u) => u.uid !== user.uid);
  const filteredNodes =
    orbitTier === 'inner'
      ? networkUsers.slice(0, 2)
      : orbitTier === 'extended'
      ? networkUsers.slice(2)
      : networkUsers;

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      setSaveError(null);
      const uploaded = await uploadMediaFile(file, 'avatars');
      setEditAvatarUrl(uploaded.url);
      setIsUploadingAvatar(false);
    } catch (err: unknown) {
      const e = err as Error;
      setSaveError(e.message || 'Avatar upload error');
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCover(true);
      setSaveError(null);
      const uploaded = await uploadMediaFile(file, 'covers');
      setEditCoverUrl(uploaded.url);
      setIsUploadingCover(false);
    } catch (err: unknown) {
      const e = err as Error;
      setSaveError(e.message || 'Cover photo upload error');
      setIsUploadingCover(false);
    }
  };

  const handleAddInterest = () => {
    if (!newInterestInput.trim()) return;
    const item = newInterestInput.trim().replace(/^#/, '');
    if (!editInterests.includes(item)) {
      setEditInterests([...editInterests, item]);
    }
    setNewInterestInput('');
  };

  const handleRemoveInterest = (item: string) => {
    setEditInterests(editInterests.filter((i) => i !== item));
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      setSaveError(null);

      const updates: Partial<SolvexaUser> = {
        displayName: editName.trim() || user.displayName,
        username: editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') || user.username,
        bio: editBio.trim(),
        location: editLocation.trim(),
        website: editWebsite.trim(),
        photoURL: editAvatarUrl || null,
        coverPhotoURL: editCoverUrl || null,
        identityCards: editInterests.map((label, idx) => ({
          id: `card_${idx}`,
          label,
          icon: 'sensors',
          order: idx,
          category: 'role' as const,
        })),
      };

      let firestoreFailed = false;
      let firestoreErrorMsg = '';

      // 1. Persist to Firestore for real authenticated Firebase users
      // Guest sessions (uid starts with 'guest_') and anonymous sessions are local-only.
      const isRealFirebaseUser = user.uid &&
        !user.uid.startsWith('guest_') &&
        !user.uid.startsWith('user_anonymous') &&
        user.uid.length > 10;

      if (isRealFirebaseUser) {
        try {
          await updateUserProfile(user.uid, updates);
        } catch (err: unknown) {
          firestoreFailed = true;
          firestoreErrorMsg = (err as Error).message || 'Failed to save to cloud';
          console.error('[ProfilePage] Firestore profile update failed:', firestoreErrorMsg);
        }
      }

      // 2. Update local state
      dataStore.updateCurrentUser(updates);
      await refreshProfile();
      setIsSavingProfile(false);
      setIsEditOpen(false);

      if (firestoreFailed) {
        setSaveError(`Cloud save failed: ${firestoreErrorMsg}`);
      } else {
        setShareToast('Profile updated successfully.');
      }
      setTimeout(() => setShareToast(null), 4000);
    } catch (err: unknown) {
      const e = err as Error;
      console.error('[ProfilePage] Profile save exception:', e);
      setIsSavingProfile(false);
      setSaveError(e.message || 'Unable to update profile.');
    }
  };

  const handleShareProfile = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.displayName} (@${user.username}) on Solvexa`,
          text: user.bio || `Connect with ${user.displayName} on Solvexa.`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    navigator.clipboard?.writeText(url);
    setShareToast('Profile link copied to clipboard!');
    setTimeout(() => setShareToast(null), 2500);
  };

  const handleFollowToggle = () => {
    if (!user) return;
    dataStore.toggleFollowUser(user.uid);
  };

  const handleDirectMessage = () => {
    if (!user) return;
    const conv = dataStore.getOrCreateConversation({
      uid: user.uid,
      displayName: user.displayName,
      username: user.username,
      photoURL: user.photoURL,
    });
    navigate(`/messages?id=${conv.conversationId}`);
  };

  // --- POST EDIT/DELETE HANDLERS FOR MY ORBIT ---
  const handleOpenEditPost = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuPostId(null);
    setEditingPost(post);
    setEditPostContent(post.content);
    setEditPostTopics(post.topics ? post.topics.join(', ') : '');
    setEditPostError(null);
  };

  const handleSavePostEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    try {
      setIsSavingPostEdit(true);
      setEditPostError(null);
      const parsed = editPostTopics.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
      await dataStore.editPost(editingPost.postId, {
        content: editPostContent.trim(),
        topics: parsed.length > 0 ? parsed : editingPost.topics,
      });
      setIsSavingPostEdit(false);
      setEditingPost(null);
      setShareToast('Broadcast updated successfully.');
      setTimeout(() => setShareToast(null), 3000);
    } catch (err: unknown) {
      const e = err as Error;
      setIsSavingPostEdit(false);
      setEditPostError(e.message || 'Failed to update post.');
    }
  };

  const handleOpenDeletePost = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuPostId(null);
    setDeletingPost(post);
  };

  const handleConfirmDeletePost = async () => {
    if (!deletingPost) return;
    try {
      setIsDeletingPost(true);
      await dataStore.deletePost(deletingPost.postId);
      setIsDeletingPost(false);
      setDeletingPost(null);
      setShareToast('Broadcast deleted from the mesh.');
      setTimeout(() => setShareToast(null), 3000);
    } catch (err: unknown) {
      const e = err as Error;
      setIsDeletingPost(false);
      setShareToast(e.message || 'Delete failed.');
      setTimeout(() => setShareToast(null), 3000);
    }
  };

  // --- SIGNAL EDIT/DELETE HANDLERS FOR MY ORBIT ---
  const handleOpenEditSignal = (sig: SignalVideo, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuSignalId(null);
    setEditingSignal(sig);
    setEditSignalCaption(sig.caption);
    setEditSignalTopics(sig.topics ? sig.topics.join(', ') : '');
    setEditSignalError(null);
  };

  const handleSaveSignalEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSignal) return;
    try {
      setIsSavingSignalEdit(true);
      setEditSignalError(null);
      const parsed = editSignalTopics.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
      await dataStore.editSignal(editingSignal.id, {
        caption: editSignalCaption.trim(),
        topics: parsed.length > 0 ? parsed : editingSignal.topics,
      });
      setIsSavingSignalEdit(false);
      setEditingSignal(null);
      setShareToast('Signal updated successfully.');
      setTimeout(() => setShareToast(null), 3000);
    } catch (err: unknown) {
      const e = err as Error;
      setIsSavingSignalEdit(false);
      setEditSignalError(e.message || 'Failed to update signal.');
    }
  };

  const handleOpenDeleteSignal = (sig: SignalVideo, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuSignalId(null);
    setDeletingSignal(sig);
  };

  const handleConfirmDeleteSignal = async () => {
    if (!deletingSignal) return;
    try {
      setIsDeletingSignal(true);
      await dataStore.deleteSignal(deletingSignal.id);
      setIsDeletingSignal(false);
      setDeletingSignal(null);
      setShareToast('Signal deleted from the mesh.');
      setTimeout(() => setShareToast(null), 3000);
    } catch (err: unknown) {
      const e = err as Error;
      setIsDeletingSignal(false);
      setShareToast(e.message || 'Delete failed.');
      setTimeout(() => setShareToast(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-3 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6 pb-24 select-none">
      {/* Toast Feedback */}
      {shareToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-[#141416]/95 border border-primary/40 text-white text-xs font-bold shadow-2xl backdrop-blur-xl animate-in fade-in flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">check_circle</span>
          <span>{shareToast}</span>
        </div>
      )}

      {/* =========================================================================
          PREMIUM PROFILE HERO CARD (Cover, Avatar, Bio, Chips, Stats, Actions)
         ========================================================================= */}
      <div className="relative rounded-3xl bg-[#141416]/90 border border-white/10 overflow-hidden shadow-2xl">
        {/* 1. Cover Banner (Cosmic Mesh Gradient or Custom Cover Photo) */}
        <div className="relative h-40 sm:h-52 w-full overflow-hidden bg-[#18181b]">
          {user.coverPhotoURL ? (
            <img
              src={user.coverPhotoURL}
              alt="Cover banner"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (

            <div
              className="w-full h-full"
              style={{
                background: 'linear-gradient(135deg, #1f0d3d 0%, #0d1e3d 50%, #06283d 100%)',
              }}
            >
              {/* Subtle Cosmic Noise / Starfield Overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/40 via-transparent to-transparent" />
            </div>
          )}

          {/* Edit Cover Trigger if Own Profile */}
          {isOwnProfile && (
            <button
              onClick={() => {
                setIsEditOpen(true);
                setTimeout(() => coverInputRef.current?.click(), 100);
              }}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-[11px] font-bold backdrop-blur-md border border-white/15 transition-all flex items-center gap-1.5 shadow-lg"
            >
              <span className="material-symbols-outlined text-sm">photo_camera</span>
              <span className="hidden sm:inline">Change Cover</span>
            </button>
          )}
        </div>

        {/* 2. Hero Content Body */}
        <div className="relative px-6 sm:px-8 pb-6 sm:pb-8 pt-0">
          {/* Avatar + Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            {/* Avatar with Gradient Ring & Online Status */}
            <div className="relative flex-shrink-0 self-center sm:self-start">
              <div
                onClick={() => {
                  if (user.photoURL) {
                    setLightboxMedia({
                      url: user.photoURL,
                      type: 'image',
                      authorName: user.displayName,
                      authorUsername: user.username,
                      caption: `${user.displayName}'s Profile Avatar`,
                    });
                  }
                }}
                className="p-1 rounded-full bg-gradient-to-tr from-purple-500 via-blue-500 to-cyan-400 shadow-2xl cursor-pointer group transition-transform hover:scale-105"
              >
                <div className="p-0.5 rounded-full bg-[#141416]">
                  <Avatar
                    src={user.photoURL}
                    name={user.displayName}
                    size="2xl"
                    hasStory={userMoments.length > 0}
                  />
                </div>
              </div>

              {/* Online Indicator */}
              <div
                className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#141416] shadow-md"
                title="Node Active on Mesh"
              />
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-center sm:justify-end gap-2.5 flex-wrap">
              {isOwnProfile ? (
                <>
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 transition-all shadow-lg shadow-purple-900/40 flex items-center gap-1.5 hover:scale-105"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={handleShareProfile}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5"
                    title="Share Profile"
                  >
                    <span className="material-symbols-outlined text-sm">share</span>
                    <span className="hidden sm:inline">Share</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleFollowToggle}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
                      user.isFollowing
                        ? 'bg-white/10 text-white hover:bg-error/20 hover:text-error border border-white/15'
                        : 'bg-gradient-to-r from-[#7a00ff] to-[#0066ff] text-white hover:opacity-90 shadow-purple-900/40'
                    }`}
                  >
                    {user.isFollowing ? 'Resonating (Following)' : 'Resonate (Follow)'}
                  </button>

                  <button
                    onClick={handleDirectMessage}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">mail</span>
                    <span>Message</span>
                  </button>
                </>
              )}

              {/* 3-Dot More Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center"
                  title="More actions"
                >
                  <span className="material-symbols-outlined text-base">more_horiz</span>
                </button>

                {isMoreMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#1c1b1c] border border-white/15 shadow-2xl p-1.5 z-40 animate-in fade-in space-y-1 text-xs">
                    <button
                      onClick={() => {
                        handleShareProfile();
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-zinc-200 hover:bg-white/10 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">link</span>
                      <span>Copy Profile Link</span>
                    </button>

                    {isOwnProfile ? (
                      <button
                        onClick={() => {
                          navigate('/settings');
                          setIsMoreMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-zinc-200 hover:bg-white/10 flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">settings</span>
                        <span>Account Settings</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShareToast('User report submitted for review.');
                          setIsMoreMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-error hover:bg-error/10 flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">flag</span>
                        <span>Report Node</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Name & Bio Section */}
          <div className="space-y-3 text-center sm:text-left">
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {user.displayName}
                </h1>
                <span className="material-symbols-outlined text-primary text-xl icon-filled" title="Verified Pioneer">
                  verified
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-primary/30 text-cyan-300 uppercase tracking-wider">
                  Early Pioneer
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 font-semibold mt-0.5">@{user.username}</p>
            </div>

            {/* Bio */}
            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed max-w-2xl w-full break-words whitespace-pre-wrap">
              {user.bio || (isOwnProfile ? 'Add a bio to let other pioneers know your focus areas, active research, and projects...' : 'Pioneer exploring the decentralized Solvexa signal mesh.')}
            </p>

            {/* Topic & Interest Chips */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              {(user.identityCards?.map((c) => c.label) || ['AI & ML', 'Spatial UI', 'Quantum Mesh']).map((chip, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-xl text-[11px] font-semibold bg-white/5 border border-white/10 text-zinc-300 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-xs text-primary">tag</span>
                  <span>{chip}</span>
                </span>
              ))}
              {isOwnProfile && (
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-primary hover:text-white bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">add</span>
                  <span>Add Topic</span>
                </button>
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-zinc-400 pt-2">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <span className="material-symbols-outlined text-sm text-zinc-500">calendar_month</span>
                <span>Joined {new Date(user.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
              </div>
              {user.location && (
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                  <span>{user.location}</span>
                </div>
              )}
              {user.website && (
                <a
                  href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-cyan-400 hover:underline"
                >
                  <span className="material-symbols-outlined text-sm">link</span>
                  <span>{user.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
            </div>

            {/* 4 Independent Statistics Cards (Desktop: 4 cols; Tablet/Mobile: 2x2 grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-5 border-t border-white/10 w-full">
              <button
                type="button"
                onClick={() => setConnectionModalType('followers')}
                className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] hover:bg-white/5 border border-white/5 hover:border-white/15 transition-all text-center group min-w-0"
              >
                <div className="text-xl sm:text-2xl font-extrabold text-white group-hover:text-primary transition-colors tracking-tight">
                  {user.followerCount || 0}
                </div>
                <div className="text-xs font-semibold text-zinc-400 mt-1 truncate w-full">Followers</div>
              </button>

              <button
                type="button"
                onClick={() => setConnectionModalType('following')}
                className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] hover:bg-white/5 border border-white/5 hover:border-white/15 transition-all text-center group min-w-0"
              >
                <div className="text-xl sm:text-2xl font-extrabold text-white group-hover:text-primary transition-colors tracking-tight">
                  {user.followingCount || 0}
                </div>
                <div className="text-xs font-semibold text-zinc-400 mt-1 truncate w-full">Following</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] hover:bg-white/5 border border-white/5 hover:border-white/15 transition-all text-center group min-w-0"
              >
                <div className="text-xl sm:text-2xl font-extrabold text-white group-hover:text-primary transition-colors tracking-tight">
                  {userPosts.length + userSignals.length}
                </div>
                <div className="text-xs font-semibold text-zinc-400 mt-1 truncate w-full">Signals & Posts</div>
              </button>

              <button
                type="button"
                onClick={() => setIsResonanceModalOpen(true)}
                className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] hover:bg-white/5 border border-white/5 hover:border-white/15 transition-all text-center group min-w-0"
              >
                <div className="text-xl sm:text-2xl font-extrabold text-cyan-300 group-hover:text-cyan-200 transition-colors tracking-tight">
                  {user.resonanceScore || 0}
                </div>
                <div className="text-xs font-semibold text-zinc-400 mt-1 truncate w-full">Resonance Score</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PROFILE TABS NAVIGATION (Broadcasts, Signals, Moments, Orbit Radar, Saved)
         ========================================================================= */}
      <div className="flex items-center justify-around sm:justify-start gap-2 sm:gap-6 border-b border-white/10 pb-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'posts', label: 'Broadcasts', icon: 'feed', count: userPosts.length },
          { id: 'signals', label: 'Signals (Videos)', icon: 'play_circle', count: userSignals.length },
          { id: 'moments', label: 'Moments', icon: 'timelapse', count: userMoments.length },
          { id: 'orbit', label: 'Orbit Radar', icon: 'all_inclusive', count: networkUsers.length },
          ...(isOwnProfile ? [{ id: 'saved', label: 'Saved', icon: 'bookmark', count: savedPosts.length }] : []),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-bold transition-all border-b-2 -mb-1 flex-shrink-0 ${
              activeTab === tab.id
                ? 'border-primary text-white text-shadow'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/10 text-zinc-300">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* =========================================================================
          TAB CONTENT VIEWS
         ========================================================================= */}
      <div>
        {/* Tab 1: Broadcasts */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {userPosts.length === 0 ? (
              <EmptyState
                variant="posts"
                onAction={isOwnProfile ? () => navigate('/create') : undefined}
                actionLabel={isOwnProfile ? 'Broadcast First Signal' : undefined}
              />
            ) : (
              userPosts.map((post) => (
                <div key={post.postId} className="p-5 rounded-3xl bg-[#141416]/90 border border-white/10 space-y-3 shadow-xl">
                  {/* Post Author Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar src={user.photoURL} name={user.displayName} size="md" />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{user.displayName}</span>
                          <span className="text-[10px] text-zinc-400 font-normal">@{user.username}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {formatRelativeTime(post.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Author Edit/Delete Menu — verified strictly against authenticated UID */}
                    {Boolean(solvexaUser?.uid && (post.authorId === solvexaUser.uid || (isOwnProfile && post.authorId === user.uid))) && (
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
                            <button
                              onClick={(e) => handleOpenEditPost(post, e)}
                              className="w-full px-3 py-2 rounded-xl text-left text-zinc-200 hover:bg-white/10 flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-sm text-primary">edit</span>
                              <span>Edit Broadcast</span>
                            </button>
                            <button
                              onClick={(e) => handleOpenDeletePost(post, e)}
                              className="w-full px-3 py-2 rounded-xl text-left text-error hover:bg-error/10 flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                              <span>Delete Broadcast</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Post Content */}
                  <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-line">{post.content}</p>

                  {/* Post Media Attachment */}
                  {post.media && post.media.length > 0 && (
                    <div
                      onClick={() =>
                        setLightboxMedia({
                          url: post.media![0].url,
                          type: post.media![0].type as any,
                          postId: post.postId,
                          authorName: user.displayName,
                          authorUsername: user.username,
                          authorAvatar: user.photoURL || null,

                          caption: post.content,
                          createdAt: post.createdAt,
                          topics: post.topics,
                          signalCount: post.signalCount,
                          commentCount: post.commentCount,
                          mySignal: post.mySignal,
                          isSaved: post.isSaved,
                        })
                      }
                      className="rounded-2xl overflow-hidden max-h-96 border border-white/10 bg-black/60 flex items-center justify-center cursor-pointer group relative"
                    >
                      <img src={post.media[0].url} alt="Media" className="max-h-96 w-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  )}

                  {/* Post Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <SignalChip
                      activeSignal={post.mySignal}
                      count={post.signalCount}
                      onSelectSignal={(type) => dataStore.toggleSignal(post.postId, type)}
                    />
                    <div className="flex items-center gap-4 text-zinc-400 text-xs">
                      <span>{post.commentCount} comments</span>
                      <span>•</span>
                      <span>{post.shareCount} shares</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Signals Videos */}
        {activeTab === 'signals' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {userSignals.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  variant="signals"
                  onAction={isOwnProfile ? () => navigate('/signals') : undefined}
                />
              </div>
            ) : (
              userSignals.map((sig) => (
                <div
                  key={sig.id}
                  className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-white/10 group bg-zinc-950"
                >
                  {(() => {
                    const thumb = getSignalThumbnail(sig.thumbnailUrl, sig.videoUrl);
                    return thumb ? (
                      <img
                        src={thumb}
                        alt={sig.caption}
                        onClick={() => navigate('/signals')}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onError={(e) => {
                          // Hide broken image and show a clean video placeholder
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const placeholder = target.nextElementSibling as HTMLElement | null;
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                    ) : null;
                  })()}
                  {/* Clean fallback shown when img fails — never shows broken icon or caption */}
                  <div
                    style={{ display: getSignalThumbnail(sig.thumbnailUrl, sig.videoUrl) ? 'none' : 'flex' }}
                    onClick={() => navigate('/signals')}
                    className="w-full h-full flex flex-col items-center justify-center gap-2 bg-zinc-900 cursor-pointer group-hover:bg-zinc-800 transition-colors"
                  >
                    <span className="material-symbols-outlined text-3xl text-zinc-600">play_circle</span>
                    <span className="text-[10px] text-zinc-500 font-medium text-center px-2 line-clamp-2">Video Signal</span>
                  </div>

                  {/* Top Right More Menu for Author — verified strictly against authenticated UID */}
                  {Boolean(solvexaUser?.uid && (sig.authorId === solvexaUser.uid || (isOwnProfile && sig.authorId === user.uid))) && (
                    <div className="absolute top-2.5 right-2.5 z-20">

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuSignalId(activeMenuSignalId === sig.id ? null : sig.id);
                        }}
                        className="p-1.5 rounded-full bg-black/70 hover:bg-black text-white backdrop-blur-md border border-white/20 transition-all shadow-md"
                        title="Signal options"
                      >
                        <span className="material-symbols-outlined text-sm">more_vert</span>
                      </button>

                      {activeMenuSignalId === sig.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-full mt-1.5 w-40 rounded-2xl bg-[#1c1b1c] border border-white/15 shadow-2xl p-1.5 z-30 animate-in fade-in space-y-1 text-xs"
                        >
                          <button
                            onClick={(e) => handleOpenEditSignal(sig, e)}
                            className="w-full px-3 py-2 rounded-xl text-left text-zinc-200 hover:bg-white/10 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm text-primary">edit</span>
                            <span>Edit Signal</span>
                          </button>
                          <button
                            onClick={(e) => handleOpenDeleteSignal(sig, e)}
                            className="w-full px-3 py-2 rounded-xl text-left text-error hover:bg-error/10 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            <span>Delete Signal</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    onClick={() => navigate('/signals')}
                    className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-3 cursor-pointer pointer-events-auto"
                  >
                    <div className="flex items-center gap-1 text-xs font-bold text-white">
                      <span className="material-symbols-outlined text-sm text-primary">sensors</span>
                      <span>{sig.resonanceCount}</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 line-clamp-2 mt-1">{sig.caption}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Moments */}
        {activeTab === 'moments' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {userMoments.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  variant="stories"
                  onAction={isOwnProfile ? () => navigate('/moments') : undefined}
                />
              </div>
            ) : (
              userMoments.map((mom) => (
                <div
                  key={mom.momentId}
                  onClick={() => navigate('/moments')}
                  className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-white/10 cursor-pointer group"
                >
                  <img src={mom.media || ''} alt="Moment" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex flex-col justify-end">
                    <p className="text-xs text-white line-clamp-2">{mom.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Orbit Radar Topology */}
        {activeTab === 'orbit' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Mesh Frequency Topology
              </span>
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                {(['all', 'inner', 'extended'] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setOrbitTier(tier)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                      orbitTier === tier
                        ? 'bg-gradient-to-r from-[#7a00ff] to-[#0066ff] text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tier === 'all' ? 'Full Radar' : `${tier} Orbit`}
                  </button>
                ))}
              </div>
            </div>

            {/* Radar Canvas */}
            <div className="relative h-80 rounded-3xl bg-[#141416]/90 border border-white/10 overflow-hidden flex items-center justify-center p-6 backdrop-blur-xl">
              <div className="absolute w-[460px] h-[460px] rounded-full border border-white/[0.04] pointer-events-none animate-pulse" />
              <div className="absolute w-[320px] h-[320px] rounded-full border border-primary/15 pointer-events-none" />
              <div className="absolute w-[180px] h-[180px] rounded-full border border-cyan-400/20 pointer-events-none" />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-1/2 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/30 to-primary origin-left animate-spin" style={{ animationDuration: '8s' }} />
              </div>

              {/* Center Node */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="p-1 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600 signal-glow">
                  <Avatar src={user.photoURL} name={user.displayName} size="lg" />
                </div>
                <span className="mt-2 text-xs font-bold text-white bg-black/70 px-2.5 py-0.5 rounded-full border border-white/10">
                  You ({user.displayName})
                </span>
              </div>

              {/* Orbit Satellites */}
              {filteredNodes.map((node, idx) => {
                const angles = [45, 135, 225, 315];
                const radius = idx % 2 === 0 ? 100 : 160;
                const angle = angles[idx % angles.length] * (Math.PI / 180);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                  <div
                    key={node.uid}
                    onClick={() => navigate(`/profile/${node.username}`)}
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                    className="absolute z-20 flex flex-col items-center cursor-pointer group hover:scale-110 transition-transform"
                  >
                    <div className="p-0.5 rounded-full bg-white/20 group-hover:bg-primary signal-glow">
                      <Avatar src={node.photoURL} name={node.displayName} size="md" />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-300 group-hover:text-primary mt-1 bg-black/80 px-2 py-0.5 rounded-md border border-white/10">
                      {node.displayName.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Orbit Node Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredNodes.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState
                    variant="orbit"
                    onAction={() => navigate('/explore')}
                    actionLabel="Explore Network"
                  />
                </div>
              ) : (
                filteredNodes.map((node) => (
                  <div
                    key={node.uid}
                    className="p-4 rounded-2xl bg-[#141416]/80 border border-white/10 hover:border-primary/40 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0" onClick={() => navigate(`/profile/${node.username}`)}>
                      <Avatar src={node.photoURL} name={node.displayName} size="md" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{node.displayName}</div>
                        <div className="text-[10px] text-zinc-400 truncate">@{node.username}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const conv = dataStore.getOrCreateConversation({
                          uid: node.uid,
                          displayName: node.displayName,
                          username: node.username,
                          photoURL: node.photoURL,
                        });
                        navigate(`/messages?id=${conv.conversationId}`);
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs"
                      title="Direct Message"
                    >
                      <span className="material-symbols-outlined text-sm">mail</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Saved */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            {savedPosts.length === 0 ? (
              <EmptyState variant="saved" />
            ) : (
              savedPosts.map((post) => (
                <div key={post.postId} className="p-5 rounded-2xl bg-[#141416]/80 border border-white/10 space-y-2">
                  <div className="text-xs text-primary font-semibold">Saved Broadcast • {post.authorName}</div>
                  <p className="text-sm text-zinc-300">{post.content}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          EDIT PROFILE MODAL (Avatar, Cover, Name, Username, Bio, Chips, Links)
         ========================================================================= */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Nexus Profile" maxWidth="lg">
        <div className="space-y-5 py-2 text-white min-w-0">
          {saveError && (
            <div className="p-3.5 rounded-xl bg-error/15 border border-error/30 text-error text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
              <span>{saveError}</span>
            </div>
          )}

          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarFileSelect}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={coverInputRef}
            onChange={handleCoverFileSelect}
            accept="image/*"
            className="hidden"
          />

          {/* Media Pickers (Avatar & Cover) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Avatar Picker */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <Avatar src={editAvatarUrl} name={editName} size="xl" />
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all shadow-md"
                >
                  {isUploadingAvatar ? 'Uploading...' : 'Change Photo'}
                </button>
                <span className="text-[10px] text-zinc-400 block">PNG, JPG, WEBP</span>
              </div>
            </div>

            {/* Cover Picker */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="w-16 h-12 rounded-xl bg-zinc-800 border border-white/10 overflow-hidden flex-shrink-0">
                {editCoverUrl ? (
                  <img src={editCoverUrl} alt="Cover preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-purple-900 to-blue-900" />
                )}
              </div>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={isUploadingCover}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all shadow-md"
                >
                  {isUploadingCover ? 'Uploading...' : 'Change Cover'}
                </button>
                <span className="text-[10px] text-zinc-400 block">Cosmic banner</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Bio / Focus
            </label>
            <textarea
              rows={3}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="What are your areas of research, engineering, and focus?"
              className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
            />
          </div>

          {/* Interests / Topics Chips Editor */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Interest & Domain Chips
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {editInterests.map((chip) => (
                <span
                  key={chip}
                  className="px-2.5 py-1 rounded-xl text-xs bg-white/5 border border-white/10 text-white flex items-center gap-1.5"
                >
                  <span>{chip}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInterest(chip)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newInterestInput}
                onChange={(e) => setNewInterestInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInterest();
                  }
                }}
                placeholder="Add topic (e.g. LLMs, Cryptography)..."
                className="flex-1 bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddInterest}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15"
              >
                Add
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Website / Portal
              </label>
              <input
                type="text"
                value={editWebsite}
                onChange={(e) => setEditWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 shadow-lg shadow-purple-900/40 disabled:opacity-40"
            >
              {isSavingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* =========================================================================
          FOLLOWERS / FOLLOWING MODAL
         ========================================================================= */}
      <Modal
        isOpen={!!connectionModalType}
        onClose={() => setConnectionModalType(null)}
        title={connectionModalType === 'followers' ? 'Orbit Followers' : 'Orbit Following'}
      >
        <div className="space-y-3 py-2 text-white max-h-96 overflow-y-auto custom-scrollbar">
          {networkUsers.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">
              No connections found in this frequency tier.
            </div>
          ) : (
            networkUsers.map((conn) => (
              <div
                key={conn.uid}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer min-w-0"
                  onClick={() => {
                    setConnectionModalType(null);
                    navigate(`/profile/${conn.username}`);
                  }}
                >
                  <Avatar src={conn.photoURL} name={conn.displayName} size="md" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{conn.displayName}</div>
                    <div className="text-[10px] text-zinc-400 truncate">@{conn.username}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => dataStore.toggleFollowUser(conn.uid)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    conn.isFollowing
                      ? 'bg-white/10 text-zinc-300 hover:bg-error/20 hover:text-error border border-white/15'
                      : 'bg-primary/20 text-primary border border-primary/30'
                  }`}
                >
                  {conn.isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* =========================================================================
          RESONANCE SCORE BREAKDOWN MODAL
         ========================================================================= */}
      <Modal
        isOpen={isResonanceModalOpen}
        onClose={() => setIsResonanceModalOpen(false)}
        title="Node Resonance Score Telemetry"
      >
        <div className="space-y-4 py-2 text-white text-xs">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-primary/30 text-center space-y-1">
            <div className="text-3xl font-extrabold text-cyan-300">{user.resonanceScore || 0}</div>
            <div className="text-xs font-bold text-white">Cumulative Mesh Resonance</div>
            <p className="text-[11px] text-zinc-400">Calculated via signal responses, quality comments, and telemetry propagation.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
              <span className="text-zinc-300">Broadcast Signals Weight</span>
              <span className="font-bold text-white">+3 pts per signal</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
              <span className="text-zinc-300">Insight Discussions Weight</span>
              <span className="font-bold text-white">+4.5 pts per comment</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
              <span className="text-zinc-300">Mesh Propagation (Shares)</span>
              <span className="font-bold text-white">+6 pts per share</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Broadcast Post Modal */}
      <Modal
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        title="Edit Broadcast"
      >
        <form onSubmit={handleSavePostEdit} className="space-y-4 py-2">
          {editPostError && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs">
              {editPostError}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Broadcast Content
            </label>
            <textarea
              rows={4}
              value={editPostContent}
              onChange={(e) => setEditPostContent(e.target.value)}
              placeholder="Update your broadcast transmission..."
              className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none resize-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Topics & Focus Tags (comma-separated)
            </label>
            <input
              type="text"
              value={editPostTopics}
              onChange={(e) => setEditPostTopics(e.target.value)}
              placeholder="e.g. QuantumFlow, SpatialUI, AI"
              className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setEditingPost(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingPostEdit || !editPostContent.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 disabled:opacity-40 transition-all"
            >
              {isSavingPostEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Broadcast Post Modal */}
      <Modal
        isOpen={!!deletingPost}
        onClose={() => setDeletingPost(null)}
        title="Delete Broadcast"
      >
        <div className="space-y-4 py-2 text-white">
          <p className="text-xs text-zinc-300 leading-relaxed">
            Are you sure you want to delete this broadcast? This action will permanently remove the post from the Solvexa mesh.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setDeletingPost(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDeletePost}
              disabled={isDeletingPost}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-error text-white hover:bg-error/90 disabled:opacity-40 transition-all"
            >
              {isDeletingPost ? 'Deleting...' : 'Delete Broadcast'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Signal Modal */}
      <Modal
        isOpen={!!editingSignal}
        onClose={() => setEditingSignal(null)}
        title="Edit Signal"
      >
        <form onSubmit={handleSaveSignalEdit} className="space-y-4 py-2">
          {editSignalError && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs">
              {editSignalError}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Signal Caption
            </label>
            <textarea
              rows={3}
              value={editSignalCaption}
              onChange={(e) => setEditSignalCaption(e.target.value)}
              placeholder="Update signal caption..."
              className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none resize-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Topic Tags (comma-separated)
            </label>
            <input
              type="text"
              value={editSignalTopics}
              onChange={(e) => setEditSignalTopics(e.target.value)}
              placeholder="e.g. WebGPU, NeuralMesh"
              className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setEditingSignal(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingSignalEdit || !editSignalCaption.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 disabled:opacity-40 transition-all"
            >
              {isSavingSignalEdit ? 'Saving...' : 'Save Signal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Signal Modal */}
      <Modal
        isOpen={!!deletingSignal}
        onClose={() => setDeletingSignal(null)}
        title="Delete Signal"
      >
        <div className="space-y-4 py-2 text-white">
          <p className="text-xs text-zinc-300 leading-relaxed">
            Are you sure you want to delete this signal video? This action will permanently remove the signal from your orbit and the mesh feed.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setDeletingSignal(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteSignal}
              disabled={isDeletingSignal}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-error text-white hover:bg-error/90 disabled:opacity-40 transition-all"
            >
              {isDeletingSignal ? 'Deleting...' : 'Delete Signal'}
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
    </div>
  );
}
