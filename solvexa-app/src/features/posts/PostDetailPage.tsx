import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { dataStore } from '../../services/store/dataStore';
import type { Post, SignalType } from '../../types/post.types';
import { Avatar } from '../../components/common/Avatar';
import { SignalChip } from '../../components/common/SignalChip';
import { MediaViewer, type MediaViewerItem } from '../../components/common/MediaViewer';

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState('');
  const [lightboxMedia, setLightboxMedia] = useState<MediaViewerItem | null>(null);

  useEffect(() => {
    if (postId) {
      setPost(dataStore.getPostById(postId) || null);
    }
  }, [postId]);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6 text-white text-center">
        <div>
          <p className="text-zinc-400 mb-4">Signal not found or has expired.</p>
          <button
            onClick={() => navigate('/pulse')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white"
          >
            Back to Pulse
          </button>
        </div>
      </div>
    );
  }

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    dataStore.addComment(post.postId, commentText.trim());
    setCommentText('');
    setPost({ ...dataStore.getPostById(post.postId)! });
  };

  const comments = dataStore.getComments(post.postId);

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-4 sm:p-6 md:p-10 text-white max-w-3xl mx-auto space-y-6 pb-24">
      {/* Back nav */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        <span>Back</span>
      </button>

      {/* Main post container */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#141416]/95 border border-white/10 space-y-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.authorUsername}`}>
              <Avatar src={post.authorAvatar} name={post.authorName} size="md" hasStory />
            </Link>
            <div>
              <div className="text-base font-bold text-white">{post.authorName}</div>
              <div className="text-xs text-zinc-500">@{post.authorUsername}</div>
            </div>
          </div>
          {post.spaceName && (
            <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {post.spaceName}
            </span>
          )}
        </div>

        <p className="text-sm sm:text-base text-zinc-200 leading-relaxed whitespace-pre-line">
          {post.content}
        </p>

        {/* Media with Lightbox click */}
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
            className="rounded-2xl overflow-hidden border border-white/10 bg-black/60 flex items-center justify-center cursor-pointer group relative max-h-[480px]"
          >
            <img
              src={post.media[0].url}
              alt="Media"
              className="w-full max-h-[480px] object-contain group-hover:scale-[1.01] transition-transform duration-200"
            />
            <div className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-sm">fullscreen</span>
            </div>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <SignalChip
            activeSignal={post.mySignal}
            count={post.signalCount}
            onSelectSignal={(type: SignalType) => {
              dataStore.toggleSignal(post.postId, type);
              setPost({ ...dataStore.getPostById(post.postId)! });
            }}
          />

          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span>{post.commentCount} comments</span>
            <span>•</span>
            <span>{post.shareCount} shares</span>
          </div>
        </div>

        {/* Comment thread */}
        <div className="pt-6 border-t border-white/10 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Insight & Comment Thread
          </h3>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Contribute your perspective..."
              className="flex-1 bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
            />
            <button
              onClick={handleAddComment}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-container transition-all"
            >
              Post
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {comments.map((c) => (
              <div key={c.commentId} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar src={c.authorAvatar} name={c.authorName} size="xs" />
                  <span className="text-xs font-bold text-white">{c.authorName}</span>
                  <span className="text-[10px] text-zinc-500">@{c.authorUsername}</span>
                </div>
                <p className="text-xs text-zinc-300 pl-7">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shared Lightbox Media Viewer */}
      <MediaViewer
        isOpen={!!lightboxMedia}
        onClose={() => setLightboxMedia(null)}
        media={lightboxMedia}
      />
    </div>
  );
}
