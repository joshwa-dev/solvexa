import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataStore } from '../../services/store/dataStore';
import type { Space } from '../../types/space.types';
import { Modal } from '../../components/common/Modal';

export default function SpacesPage() {
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState<Space[]>(() => dataStore.getSpaces());
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Space state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Space['category']>('AI & Engineering');
  const [icon] = useState('smart_toy');

  const categories = [
    'All',
    'AI & Engineering',
    'Creative Flow',
    'Quantum & Future',
    'Architecture',
  ];

  const handleToggleJoin = (spaceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dataStore.toggleJoinSpace(spaceId);
    setSpaces([...dataStore.getSpaces()]);
  };

  const handleCreateSpace = () => {
    if (!name.trim()) return;
    const newSpace = dataStore.createSpace({
      name: name.trim(),
      description: description.trim(),
      category,
      iconUrl: icon,
    });
    setSpaces([...dataStore.getSpaces()]);
    setIsCreateOpen(false);
    navigate(`/spaces/${newSpace.id}`);
  };

  const filteredSpaces = spaces.filter((s) => {
    if (activeCategory === 'All') return true;
    return s.category === activeCategory;
  });

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-6 md:p-10 text-white max-w-5xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center signal-glow">
              <span className="material-symbols-outlined text-white text-2xl">hub</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">Solvexa Spaces</h1>
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                Decentralized Technical Hubs & Communities
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 transition-all shadow-lg shadow-purple-900/40 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>Create Space</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-primary/20 text-primary border border-primary/30 shadow-md'
                : 'bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Spaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSpaces.map((space) => (
          <div
            key={space.id}
            onClick={() => navigate(`/spaces/${space.id}`)}
            className="p-6 rounded-2xl bg-[#141416]/90 border border-white/10 hover:border-primary/40 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
          >
            {/* Banner preview snippet */}
            <div className="relative h-28 rounded-xl overflow-hidden border border-white/10">
              <img
                src={space.bannerUrl}
                alt={space.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-black/70 backdrop-blur-md flex items-center justify-center text-primary border border-white/15">
                  <span className="material-symbols-outlined text-lg">{space.iconUrl}</span>
                </div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {space.category}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-1.5 flex-1">
              <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                {space.name}
              </h3>
              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                {space.description}
              </p>
            </div>

            {/* Footer metrics & Join toggle */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
              <div className="flex items-center gap-3 text-zinc-400">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-primary">group</span>
                  {space.memberCount.toLocaleString()} members
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-cyan-400">sensors</span>
                  {space.postCount} broadcasts
                </span>
              </div>

              <button
                onClick={(e) => handleToggleJoin(space.id, e)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  space.isJoined
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-gradient-to-r from-[#7a00ff] to-[#0066ff] text-white shadow-md'
                }`}
              >
                {space.isJoined ? 'Joined' : 'Join Space'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Space Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Initialize New Space">
        <div className="space-y-4 py-2 text-white">
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Space Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Neuromorphic Engineering"
              className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-[#1c1b1c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
            >
              <option value="AI & Engineering">AI & Engineering</option>
              <option value="Creative Flow">Creative Flow</option>
              <option value="Quantum & Future">Quantum & Future</option>
              <option value="Architecture">Architecture</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Description & Focus Area
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What core problems does this space tackle?"
              className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateSpace}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 shadow-lg shadow-purple-900/40"
            >
              Create Space
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
