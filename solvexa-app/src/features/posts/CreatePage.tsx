import { useState, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataStore } from '../../services/store/dataStore';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from '../../components/common/Avatar';
import { uploadMediaFile } from '../../services/storage/mediaUpload';

export default function CreatePage() {
  const { solvexaUser } = useAuth();
  const navigate = useNavigate();

  const [content, setContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'video'; name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [spaceId, setSpaceId] = useState('');
  const [topics, setTopics] = useState('');
  const [postType, setPostType] = useState<'text' | 'image' | 'poll' | 'discussion'>('text');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const spaces = dataStore.getSpaces();

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const uploaded = await uploadMediaFile(file, 'posts');
      setSelectedMedia(uploaded);
      setPostType(uploaded.type === 'video' ? 'text' : 'image');
      setIsUploading(false);
    } catch (err: unknown) {
      const e = err as Error;
      alert(e.message || 'Media upload error');
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedMedia && postType !== 'poll') return;

    setIsSubmitting(true);

    let formattedPoll = null;
    if (postType === 'poll' && pollOptions.filter((o) => o.trim()).length >= 2) {
      formattedPoll = pollOptions
        .filter((o) => o.trim())
        .map((text, idx) => ({ id: `opt_${idx + 1}`, text, voteCount: 0, votedUserIds: [] }));
    }

    const space = spaces.find((s) => s.id === spaceId);
    const parsedTopics = topics
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    dataStore.createPost({
      content: content.trim(),
      media: selectedMedia ? [{ url: selectedMedia.url, type: selectedMedia.type }] : [],
      postType: formattedPoll ? 'poll' : selectedMedia ? selectedMedia.type : 'text',
      spaceId: spaceId || null,
      spaceName: space?.name,
      topics: parsedTopics.length > 0 ? parsedTopics : ['SignalFlow'],
      pollOptions: formattedPoll,
    });

    setIsSubmitting(false);
    navigate('/pulse');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-4 sm:p-6 md:p-10 text-white max-w-3xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#7a00ff] to-[#0066ff] flex items-center justify-center signal-glow shadow-lg shadow-purple-900/30">
            <span className="material-symbols-outlined text-white text-2xl">add_circle</span>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Create Broadcast</h1>
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
              Share Research, Questions or Media to the Network
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-[#141416]/95 border border-white/10 space-y-6 shadow-2xl backdrop-blur-xl">
        {/* User preview */}
        <div className="flex items-center gap-3">
          <Avatar src={solvexaUser?.photoURL} name={solvexaUser?.displayName} size="md" />
          <div>
            <div className="text-sm font-bold text-white">{solvexaUser?.displayName}</div>
            <div className="text-xs text-zinc-500">@{solvexaUser?.username}</div>
          </div>
        </div>

        {/* Content Body */}
        <div>
          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What do you want to share with the network?"
            className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-2xl p-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"
          />
        </div>

        {/* Native File Input (hidden) */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleMediaSelect}
          accept="image/*,video/*"
          className="hidden"
        />

        {/* Selected Media Preview */}
        {selectedMedia && (
          <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/60 max-h-[380px] flex items-center justify-center p-2 group">
            {selectedMedia.type === 'video' ? (
              <video
                src={selectedMedia.url}
                controls
                className="max-h-[360px] w-auto h-auto rounded-xl object-contain"
              />
            ) : (
              <img
                src={selectedMedia.url}
                alt="Upload preview"
                className="max-h-[360px] w-auto h-auto rounded-xl object-contain"
              />
            )}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 rounded-xl bg-black/80 hover:bg-black text-white text-xs font-bold backdrop-blur-md border border-white/20"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                className="p-1.5 rounded-full bg-black/80 hover:bg-black text-white backdrop-blur-md border border-white/20"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Media Buttons & Poll Trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-primary text-lg">photo_library</span>
            <span>{isUploading ? 'Uploading...' : 'Photo / Video'}</span>
          </button>

          <button
            type="button"
            onClick={() => setPostType(postType === 'poll' ? 'text' : 'poll')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
              postType === 'poll'
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-cyan-400 text-lg">poll</span>
            <span>Live Poll</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="ml-auto text-xs text-zinc-400 hover:text-white flex items-center gap-1"
          >
            <span>Advanced options</span>
            <span className="material-symbols-outlined text-sm">{showAdvanced ? 'expand_less' : 'expand_more'}</span>
          </button>
        </div>

        {/* Poll Options Builder */}
        {postType === 'poll' && (
          <div className="space-y-3 p-4 rounded-2xl bg-black/40 border border-white/10 animate-in fade-in">
            <span className="text-xs font-bold text-primary uppercase tracking-wider block">
              Consensus Poll Choices
            </span>
            {pollOptions.map((opt, idx) => (
              <input
                key={idx}
                type="text"
                value={opt}
                onChange={(e) => {
                  const copy = [...pollOptions];
                  copy[idx] = e.target.value;
                  setPollOptions(copy);
                }}
                placeholder={`Option ${idx + 1}`}
                className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            ))}
            {pollOptions.length < 4 && (
              <button
                type="button"
                onClick={() => setPollOptions([...pollOptions, ''])}
                className="text-xs text-primary font-semibold hover:underline"
              >
                + Add Option
              </button>
            )}
          </div>
        )}

        {/* Collapsible Advanced Options */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10 animate-in fade-in">
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Target Community / Space
              </label>
              <select
                value={spaceId}
                onChange={(e) => setSpaceId(e.target.value)}
                className="w-full bg-[#1c1b1c] border border-white/10 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none"
              >
                <option value="">Public Home Feed</option>
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Topic Tags (comma-separated)
              </label>
              <input
                type="text"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder="e.g. AI, Quantum, SpatialUI"
                className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => navigate('/pulse')}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isUploading || (!content.trim() && !selectedMedia && postType !== 'poll')}
            className="px-8 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 shadow-lg shadow-purple-900/40 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? 'Transmitting...' : 'Post Broadcast'}
          </button>
        </div>
      </form>
    </div>
  );
}
