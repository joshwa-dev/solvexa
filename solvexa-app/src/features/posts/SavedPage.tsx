import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataStore } from '../../services/store/dataStore';
import type { Post } from '../../types/post.types';
import type { SignalVideo } from '../../types/signal.types';
import { Avatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import { getSignalThumbnail } from '../../services/storage/mediaUpload';

export default function SavedPage() {
  const navigate = useNavigate();
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [savedSignals, setSavedSignals] = useState<SignalVideo[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'signals'>('all');

  useEffect(() => {
    const sync = () => {
      setSavedPosts(dataStore.getPosts().filter((p) => p.isSaved));
      setSavedSignals(dataStore.getSignals().filter((s) => s.isBookmarked));
    };
    sync();
    return dataStore.subscribe(sync);
  }, []);

  const totalSavedCount = savedPosts.length + savedSignals.length;

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-4 sm:p-6 md:p-10 text-white max-w-4xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center signal-glow">
            <span className="material-symbols-outlined text-white text-2xl">bookmark</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Saved Signal Nodes</h1>
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
              Bookmarks, Papers & Saved Discussions ({totalSavedCount})
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        {totalSavedCount > 0 && (
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'all' ? 'bg-primary text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({totalSavedCount})
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'posts' ? 'bg-primary text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Broadcasts ({savedPosts.length})
            </button>
            <button
              onClick={() => setActiveTab('signals')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'signals' ? 'bg-primary text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Signals ({savedSignals.length})
            </button>
          </div>
        )}
      </div>

      {totalSavedCount === 0 ? (
        <EmptyState
          variant="saved"
          title="Your vault is empty"
          description="Save broadcasts, video signals, and discussions to quickly access them here."
          actionLabel="Explore Pulse Feed"
          onAction={() => navigate('/pulse')}
        />
      ) : (
        <div className="space-y-4">
          {/* 1. Saved Broadcast Posts */}
          {(activeTab === 'all' || activeTab === 'posts') &&
            savedPosts.map((post) => (
              <div
                key={post.postId}
                onClick={() => navigate(`/post/${post.postId}`)}
                className="p-6 rounded-2xl bg-[#141416]/80 border border-white/10 hover:border-primary/40 hover:bg-[#18181c] transition-all space-y-3 cursor-pointer group shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${post.authorId || post.authorUsername}`);
                    }}

                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <Avatar src={post.authorAvatar} name={post.authorName} size="sm" />
                    <div>
                      <span className="text-sm font-bold text-white block group-hover:text-primary transition-colors">
                        {post.authorName}
                      </span>
                      <span className="text-xs text-zinc-500">@{post.authorUsername}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dataStore.toggleSavePost(post.postId);
                    }}
                    className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-all text-xs flex items-center gap-1 font-bold"
                    title="Remove from saved vault"
                  >
                    <span className="material-symbols-outlined text-base icon-filled">bookmark_remove</span>
                    <span>Remove</span>
                  </button>
                </div>

                <p className="text-sm text-zinc-300 line-clamp-3 leading-relaxed">{post.content}</p>

                {post.media && post.media.length > 0 && (
                  <div className="rounded-xl overflow-hidden max-h-64 border border-white/10">
                    <img src={post.media[0].url} alt="Media" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-xs text-zinc-500 font-medium border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-primary">sensors</span>
                      <span>{post.signalCount} resonances</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">chat_bubble</span>
                      <span>{post.commentCount} discussions</span>
                    </span>
                  </div>
                  <span className="text-primary font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    <span>Open Post</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </span>
                </div>
              </div>
            ))}

          {/* 2. Saved Video Signals */}
          {(activeTab === 'all' || activeTab === 'signals') &&
            savedSignals.map((sig) => {
              const thumb = getSignalThumbnail(sig.thumbnailUrl, sig.videoUrl);
              return (
                <div
                  key={sig.id}
                  onClick={() => navigate(`/signal/${sig.id}`)}
                  className="p-5 rounded-2xl bg-[#141416]/80 border border-white/10 hover:border-primary/40 hover:bg-[#18181c] transition-all cursor-pointer group shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-4"
                >
                  {/* Video Thumbnail */}
                  <div className="relative w-full sm:w-32 aspect-[9/14] sm:h-28 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 flex-shrink-0">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={sig.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-zinc-900 text-zinc-500">
                        <span className="material-symbols-outlined text-2xl">videocam</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                        <span className="material-symbols-outlined text-base">play_arrow</span>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/profile/${sig.authorId || sig.authorUsername}`);
                        }}

                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                      >
                        <Avatar src={sig.authorAvatar} name={sig.authorName} size="xs" />
                        <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">
                          {sig.authorName}
                        </span>
                        <span className="text-[10px] text-zinc-500">@{sig.authorUsername}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dataStore.toggleBookmarkSignal(sig.id);
                        }}
                        className="p-1.5 rounded-xl text-primary hover:bg-primary/10 transition-all text-xs flex items-center gap-1 font-bold"
                        title="Remove bookmark"
                      >
                        <span className="material-symbols-outlined text-base icon-filled">bookmark_remove</span>
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 leading-relaxed">{sig.caption}</p>

                    <div className="flex items-center justify-between text-xs text-zinc-500 font-medium pt-1 border-t border-white/5">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-primary">sensors</span>
                        <span>{sig.resonanceCount} resonances</span>
                      </span>
                      <span className="text-primary font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                        <span>Play Signal</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
