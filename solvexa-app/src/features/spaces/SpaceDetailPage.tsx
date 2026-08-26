import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dataStore } from '../../services/store/dataStore';
import type { Space } from '../../types/space.types';
import type { Post, SignalType } from '../../types/post.types';
import { Avatar } from '../../components/common/Avatar';
import { SignalChip } from '../../components/common/SignalChip';

export default function SpaceDetailPage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();

  const [space, setSpace] = useState<Space | null>(null);
  const [spacePosts, setSpacePosts] = useState<Post[]>([]);
  const [composerContent, setComposerContent] = useState('');

  useEffect(() => {
    if (spaceId) {
      const sp = dataStore.getSpaceById(spaceId);
      setSpace(sp || null);
      const posts = dataStore.getPosts().filter((p) => p.spaceId === spaceId || (sp && p.spaceName === sp.name));
      setSpacePosts(posts);
    }
  }, [spaceId]);

  if (!space) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6 text-white text-center">
        <div>
          <p className="text-zinc-400 mb-4">Space not found.</p>
          <button onClick={() => navigate('/spaces')} className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold">
            Back to Spaces
          </button>
        </div>
      </div>
    );
  }

  const handleToggleJoin = () => {
    dataStore.toggleJoinSpace(space.id);
    setSpace({ ...dataStore.getSpaceById(space.id)! });
  };

  const handlePostInSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerContent.trim()) return;

    dataStore.createPost({
      content: composerContent.trim(),
      spaceId: space.id,
      spaceName: space.name,
      topics: [space.category.replace(/[^a-zA-Z]/g, '')],
    });

    setComposerContent('');
    setSpacePosts(dataStore.getPosts().filter((p) => p.spaceId === space.id || p.spaceName === space.name));
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pb-24 space-y-6">
      {/* Banner */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden bg-surface-container">
        <img src={space.bannerUrl} alt={space.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-black/50 to-transparent" />
      </div>

      {/* Main Space Container */}
      <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-10 space-y-8">
        {/* Header Info */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-end gap-5">
            <div className="w-20 h-20 rounded-2xl bg-black/80 border border-white/20 flex items-center justify-center text-primary text-3xl shadow-2xl signal-glow flex-shrink-0">
              <span className="material-symbols-outlined text-4xl">{space.iconUrl}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white">{space.name}</h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  {space.category}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {space.memberCount.toLocaleString()} members • {spacePosts.length} active discussions
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleJoin}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
              space.isJoined
                ? 'bg-white/10 text-white border border-white/20'
                : 'bg-gradient-to-r from-[#7a00ff] to-[#0066ff] text-white shadow-purple-900/40'
            }`}
          >
            {space.isJoined ? 'Joined (Member)' : 'Join Space'}
          </button>
        </div>

        {/* Space Description & Rules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">About this Space</h2>
            <p className="text-sm text-zinc-300 leading-relaxed">{space.description}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">gavel</span>
              <span>Space Protocol</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-zinc-400 list-disc list-inside">
              {space.rules?.map((rule, idx) => (
                <li key={idx} className="leading-relaxed">{rule}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Space Composer */}
        <form onSubmit={handlePostInSpace} className="p-5 rounded-2xl bg-[#141416]/90 border border-white/10 space-y-4">
          <textarea
            rows={3}
            value={composerContent}
            onChange={(e) => setComposerContent(e.target.value)}
            placeholder={`Share an insight or research inquiry in ${space.name}...`}
            className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!composerContent.trim()}
              className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 shadow-md disabled:opacity-40"
            >
              Post in Space
            </button>
          </div>
        </form>

        {/* Space Posts Feed */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Discussions & Broadcasts
          </h3>

          {spacePosts.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              No broadcasts yet in this space. Be the first to ignite the discussion!
            </div>
          ) : (
            spacePosts.map((post) => (
              <div key={post.postId} className="p-6 rounded-2xl bg-[#141416]/80 border border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar src={post.authorAvatar} name={post.authorName} size="sm" />
                  <div>
                    <span className="text-sm font-bold text-white block">{post.authorName}</span>
                    <span className="text-xs text-zinc-500">@{post.authorUsername}</span>
                  </div>
                </div>

                <p className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed">{post.content}</p>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <SignalChip
                    activeSignal={post.mySignal}
                    count={post.signalCount}
                    onSelectSignal={(type: SignalType) => {
                      dataStore.toggleSignal(post.postId, type);
                      setSpacePosts([...dataStore.getPosts().filter((p) => p.spaceId === space.id || p.spaceName === space.name)]);
                    }}
                  />
                  <div className="text-xs text-zinc-500">{post.commentCount} comments</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
