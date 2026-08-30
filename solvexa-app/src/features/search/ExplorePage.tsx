import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { dataStore } from '../../services/store/dataStore';
import { MOCK_TRENDING_TOPICS } from '../../lib/mockData';
import { Avatar } from '../../components/common/Avatar';
import { SignalChip } from '../../components/common/SignalChip';
import type { SolvexaUser } from '../../types/user.types';
import type { Post } from '../../types/post.types';
import { EmptyState } from '../../components/common/EmptyState';
import { getSignalThumbnail } from '../../services/storage/mediaUpload';


export default function ExplorePage() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const navigate = useNavigate();

  const [query, setQuery] = useState(initialQuery);
  const [searchFilter, setSearchFilter] = useState<'all' | 'posts' | 'people' | 'signals' | 'spaces'>('all');

  const allPosts = dataStore.getPosts();
  const allUsers: SolvexaUser[] = dataStore.getUsers();
  const allSignals = dataStore.getSignals();
  const allSpaces = dataStore.getSpaces();

  // Deduplicate items by their stable unique IDs
  const uniqueSignals = useMemo(() => {
    return Array.from(new Map(allSignals.map((s) => [s.id, s])).values());
  }, [allSignals]);

  const uniqueUsers = useMemo(() => {
    return Array.from(new Map(allUsers.map((u) => [u.uid, u])).values());
  }, [allUsers]);

  // Exclude posts that represent the same media/content as an existing signal
  const uniqueNonDuplicatePosts = useMemo(() => {
    const signalIds = new Set(uniqueSignals.map((s) => s.id));
    const signalMedia = new Set(
      uniqueSignals.flatMap((s) => [s.videoUrl, s.thumbnailUrl].filter(Boolean) as string[])
    );
    const signalAuthorContent = new Set(
      uniqueSignals.map((s) => `${s.authorId || s.authorUsername}_${(s.caption || '').trim().toLowerCase()}`)
    );

    const postMap = new Map<string, Post>();
    allPosts.forEach((p) => {
      // Deduplicate by postId
      if (postMap.has(p.postId)) return;

      // Filter out if post represents a signal already displayed
      if (
        signalIds.has(p.postId) ||
        signalIds.has(`sig_${p.postId}`) ||
        uniqueSignals.some((s) => s.id.replace('sig_', '') === p.postId.replace('post_', ''))
      ) {
        return;
      }
      if (p.media?.some((m) => m.url && signalMedia.has(m.url))) {
        return;
      }
      const key = `${p.authorId || p.authorUsername}_${(p.content || '').trim().toLowerCase()}`;
      if (signalAuthorContent.has(key)) {
        return;
      }

      postMap.set(p.postId, p);
    });

    return Array.from(postMap.values());
  }, [allPosts, uniqueSignals]);

  const searchResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return {
        posts: uniqueNonDuplicatePosts.slice(0, 4),
        users: uniqueUsers.slice(0, 4),
        signals: uniqueSignals.slice(0, 4),
        spaces: allSpaces.slice(0, 4),
      };
    }

    return {
      posts: uniqueNonDuplicatePosts.filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          p.topics.some((t: string) => t.toLowerCase().includes(q)) ||
          p.authorName?.toLowerCase().includes(q)
      ),
      users: uniqueUsers.filter(
        (u: SolvexaUser) =>
          u.displayName.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.bio.toLowerCase().includes(q)
      ),
      signals: uniqueSignals.filter(
        (s) =>
          s.caption.toLowerCase().includes(q) ||
          s.topics.some((t: string) => t.toLowerCase().includes(q)) ||
          s.authorName.toLowerCase().includes(q)
      ),
      spaces: allSpaces.filter(
        (sp) =>
          sp.name.toLowerCase().includes(q) ||
          sp.description.toLowerCase().includes(q) ||
          sp.category.toLowerCase().includes(q)
      ),
    };

  }, [query, uniqueNonDuplicatePosts, uniqueUsers, uniqueSignals, allSpaces]);

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-6 md:p-10 text-white max-w-5xl mx-auto space-y-8 pb-24">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center signal-glow">
            <span className="material-symbols-outlined text-white text-2xl">explore</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">Explore & Signal Mesh</h1>
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
              Search Topics, Nodes, Spaces & High-Frequency Signals
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xl">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords, #topics, researchers, or spaces..."
            className="w-full bg-[#141416] border border-white/10 focus:border-primary rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xl transition-all"
          />
        </div>
      </div>

      {/* Trending Topics Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-cyan-400 text-base">trending_up</span>
          <span>Trending Frequency Topics</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {MOCK_TRENDING_TOPICS.map((topic, i) => (
            <div
              key={i}
              onClick={() => setQuery(topic.tag.replace('#', ''))}
              className="p-4 rounded-xl bg-[#141416]/80 border border-white/5 hover:border-primary/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                  {topic.tag}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  {topic.growth}
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">{topic.postsCount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'All Results' },
          { id: 'people', label: 'Pioneers & Nodes' },
          { id: 'signals', label: 'Video Signals' },
          { id: 'posts', label: 'Broadcasts' },
          { id: 'spaces', label: 'Spaces' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSearchFilter(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              searchFilter === tab.id
                ? 'bg-gradient-to-r from-[#7a00ff] to-[#0066ff] text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results Sections */}
      <div className="space-y-8">
        {/* Pioneers / People */}
        {(searchFilter === 'all' || searchFilter === 'people') && searchResults.users.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Pioneers & Researchers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.users.map((user: SolvexaUser) => (
                <div
                  key={user.uid}
                  onClick={() => navigate(`/profile/${user.uid}`)}
                  className="p-4 rounded-xl bg-[#141416]/80 border border-white/10 hover:border-primary/40 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={user.photoURL} name={user.displayName} size="md" hasStory />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">{user.displayName}</h4>
                      <p className="text-xs text-zinc-400 truncate">@{user.username} • {(user.followerCount || 0).toLocaleString()} resonators</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-zinc-500 group-hover:text-primary transition-colors">chevron_right</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Signals Grid */}
        {(searchFilter === 'all' || searchFilter === 'signals') && searchResults.signals.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Video Signals</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {searchResults.signals.map((sig) => (
                <div
                  key={sig.id}
                  onClick={() => navigate(`/signal/${sig.id}`)}
                  className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-white/10 cursor-pointer group hover:border-primary/40 transition-all shadow-lg"
                >
                  {(() => {
                    const thumb = getSignalThumbnail(sig.thumbnailUrl, sig.videoUrl);
                    return thumb ? (
                      <img
                        src={thumb}
                        alt={sig.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-zinc-900">
                        <span className="material-symbols-outlined text-2xl text-zinc-600">videocam</span>
                      </div>
                    );
                  })()}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 pointer-events-none">
                    <div className="flex items-center gap-1 text-xs font-bold text-white">
                      <span className="material-symbols-outlined text-primary text-sm">sensors</span>
                      <span>{sig.resonanceCount}</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 line-clamp-2 mt-1">{sig.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Distinct Broadcast Posts (Only non-duplicate posts) */}
        {(searchFilter === 'all' || searchFilter === 'posts') && searchResults.posts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Broadcast Signals</h3>
            <div className="space-y-4">
              {searchResults.posts.map((post) => (
                <div
                  key={post.postId}
                  onClick={() => navigate(`/post/${post.postId}`)}
                  className="p-6 rounded-2xl bg-[#141416]/80 border border-white/10 hover:border-white/20 transition-all space-y-3 cursor-pointer group shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${post.authorId || post.authorUsername}`);
                      }}
                      className="flex items-center gap-3 hover:opacity-85 transition-opacity"
                    >
                      <Avatar src={post.authorAvatar} name={post.authorName} size="sm" />
                      <div>
                        <span className="text-sm font-bold text-white group-hover:text-primary transition-colors block">{post.authorName}</span>
                        <span className="text-xs text-zinc-500">@{post.authorUsername}</span>
                      </div>
                    </div>
                    {post.spaceName && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        {post.spaceName}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-300 line-clamp-3 leading-relaxed">{post.content}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <SignalChip
                      activeSignal={post.mySignal}
                      count={post.signalCount}
                      onSelectSignal={(type) => dataStore.toggleSignal(post.postId, type)}
                    />
                    <span className="text-xs text-zinc-500">{post.commentCount} discussions</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* No results state when searching */}
      {query.trim() &&
        searchResults.posts.length === 0 &&
        searchResults.users.length === 0 &&
        searchResults.signals.length === 0 &&
        searchResults.spaces.length === 0 && (
          <EmptyState
            variant="search"
            title="No results found"
            description={`Nothing matched "${query}". Try different keywords or explore the Pulse feed.`}
            actionLabel="Browse Pulse"
            onAction={() => navigate('/pulse')}
          />
        )}
    </div>
  );

}
