import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataStore } from '../../services/store/dataStore';
import type { Post } from '../../types/post.types';
import { Avatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/common/EmptyState';

export default function SavedPage() {
  const navigate = useNavigate();
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);

  useEffect(() => {
    const sync = () => {
      setSavedPosts(dataStore.getPosts().filter((p) => p.isSaved));
    };
    sync();
    return dataStore.subscribe(sync);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-6 md:p-10 text-white max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-3 pb-6 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center signal-glow">
          <span className="material-symbols-outlined text-white text-2xl">bookmark</span>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Saved Signal Nodes</h1>
          <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
            Bookmarks, Papers & Saved Discussions
          </p>
        </div>
      </div>

      {savedPosts.length === 0 ? (
        <EmptyState
          variant="saved"
          actionLabel="Explore Pulse Feed"
          onAction={() => navigate('/pulse')}
        />
      ) : (
        <div className="space-y-4">
          {savedPosts.map((post) => (
            <div
              key={post.postId}
              className="p-6 rounded-2xl bg-[#141416]/80 border border-white/10 hover:border-white/20 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={post.authorAvatar} name={post.authorName} size="sm" />
                  <div>
                    <span className="text-sm font-bold text-white block">{post.authorName}</span>
                    <span className="text-xs text-zinc-500">@{post.authorUsername}</span>
                  </div>
                </div>
                <button
                  onClick={() => dataStore.toggleSavePost(post.postId)}
                  className="p-2 rounded-lg text-primary hover:bg-white/5 transition-all text-xs flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base icon-filled">bookmark_remove</span>
                  <span>Remove</span>
                </button>
              </div>

              <p className="text-sm text-zinc-300 line-clamp-3 leading-relaxed">{post.content}</p>

              {post.media && post.media.length > 0 && (
                <div className="rounded-xl overflow-hidden max-h-60 border border-white/10">
                  <img src={post.media[0].url} alt="Media" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
