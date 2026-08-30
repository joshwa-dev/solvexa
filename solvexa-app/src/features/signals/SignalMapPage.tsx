import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  getSignalMapData,
  type SignalNode,
  type SignalMapData,
} from '../../services/firestore/signalMapService';
import { dataStore } from '../../services/store/dataStore';
import { Avatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import { getSignalThumbnail } from '../../services/storage/mediaUpload';

export default function SignalMapPage() {
  const { dataMode } = useAuth();
  const navigate = useNavigate();

  const [mapData, setMapData] = useState<SignalMapData>({
    nodes: [],
    links: [],
    totalResonance: 0,
    activeFrequency: '432.8 MHz • Mesh Radar',
  });

  const [selectedNode, setSelectedNode] = useState<SignalNode | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Sync with dataStore
  useEffect(() => {
    const sync = () => {
      const data = getSignalMapData();
      setMapData(data);
      if (data.nodes.length > 0) {
        setSelectedNode((prev) => {
          if (!prev) return data.nodes[0];
          const exists = data.nodes.find((n) => n.id === prev.id);
          return exists || data.nodes[0];
        });
      } else {
        setSelectedNode(null);
      }
    };
    sync();
    return dataStore.subscribe(sync);
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    mapData.nodes.forEach((n) => set.add(n.category));
    return ['all', ...Array.from(set)];
  }, [mapData.nodes]);

  const filteredNodes = useMemo(() => {
    return mapData.nodes.filter((n) => {
      if (activeCategory !== 'all' && n.category !== activeCategory) return false;
      return true;
    });
  }, [mapData.nodes, activeCategory]);

  // Pan interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleOpenOriginal = (node: SignalNode) => {
    if (node.type === 'signal') {
      const sigId = node.id.replace('sig_', '');
      navigate(`/signal/${sigId}`);
    } else if (node.type === 'post') {
      const postId = node.id.replace('post_', '');
      navigate(`/post/${postId}`);
    } else {
      navigate(`/profile/${node.authorUsername}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-3 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center signal-glow shadow-lg shadow-purple-900/30">
            <span className="material-symbols-outlined text-white text-2xl">insights</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Signal Map Topology</h1>
              {dataMode === 'DEMO' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                  DEMO MODE
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 font-medium">
              Spatial mesh visualization of active signals, broadcasts, and creator telemetry.
            </p>
          </div>
        </div>

        {/* Global Topology Stats */}
        <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 px-4 py-2 rounded-2xl text-xs backdrop-blur-md">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">Active Nodes</span>
            <span className="font-bold text-white text-sm">{filteredNodes.length} Signals</span>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">Mesh Frequency</span>
            <span className="font-bold text-cyan-400 text-sm">{mapData.totalResonance} Energy</span>
          </div>
        </div>
      </div>

      {/* Category Filter Chips & Map Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-[#7a00ff] to-[#0066ff] text-white shadow-md shadow-purple-900/40'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10'
              }`}
            >
              {cat === 'all' ? 'All Mesh Signals' : cat}
            </button>
          ))}
        </div>

        {/* Compact Zoom and Pan Controls */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setZoom((z) => Math.min(2, +(z + 0.2).toFixed(1)))}
            className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white transition-all"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <span className="material-symbols-outlined text-base">zoom_in</span>
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))}
            className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white transition-all"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <span className="material-symbols-outlined text-base">zoom_out</span>
          </button>
          <div className="w-px h-4 bg-white/10 mx-0.5" />
          <button
            onClick={handleResetView}
            className="px-2.5 py-1 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-all"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Map & Information Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Left 2 Columns: Interactive Canvas Map */}
        <div className="lg:col-span-2 relative h-[480px] sm:h-[580px] rounded-3xl bg-[#0D0D10] border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl">
          {/* Subtle Dot Grid Background Pattern */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          {/* Minimal Centered Coordinate Guide Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[420px] h-[420px] rounded-full border border-white/[0.03]" />
            <div className="w-[240px] h-[240px] rounded-full border border-primary/[0.06]" />
            <div className="w-[100px] h-[100px] rounded-full border border-cyan-400/[0.08]" />
          </div>

          {/* Interactive Panning Viewport */}
          <div
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-full h-full relative cursor-grab active:cursor-grabbing flex items-center justify-center transition-transform duration-75"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            {filteredNodes.length === 0 ? (
              <div className="pointer-events-auto">
                <EmptyState
                  variant="signal_map"
                  title="No signals mapped in this category"
                  description="Active broadcasts and creator nodes will illuminate the spatial map."
                  actionLabel="View All Signals"
                  onAction={() => setActiveCategory('all')}
                />
              </div>
            ) : (
              <>
                {/* SVG Connecting Links */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                  {mapData.links.map((link) => {
                    const source = filteredNodes.find((n) => n.id === link.sourceId);
                    const target = filteredNodes.find((n) => n.id === link.targetId);
                    if (!source || !target) return null;

                    const x1 = `calc(50% + ${source.x * 2.6}px)`;
                    const y1 = `calc(50% + ${source.y * 2.6}px)`;
                    const x2 = `calc(50% + ${target.x * 2.6}px)`;
                    const y2 = `calc(50% + ${target.y * 2.6}px)`;

                    return (
                      <line
                        key={link.id}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={link.active ? 'rgba(160, 120, 255, 0.45)' : 'rgba(255, 255, 255, 0.08)'}
                        strokeWidth={link.active ? 1.5 : 1}
                        strokeDasharray={link.active ? '4,4' : undefined}
                      />
                    );
                  })}
                </svg>

                {/* Spatial Signal Nodes */}
                {filteredNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isResonating = node.status === 'resonating';

                  return (
                    <div
                      key={node.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode(node);
                      }}
                      style={{
                        transform: `translate(${node.x * 2.6}px, ${node.y * 2.6}px)`,
                      }}
                      className={`absolute flex flex-col items-center cursor-pointer transition-all duration-200 ${
                        isSelected ? 'z-30 scale-110' : isResonating ? 'z-20 hover:scale-110' : 'z-10 hover:scale-110'
                      }`}
                    >
                      {/* Node Circle */}
                      <div
                        className={`rounded-full flex items-center justify-center transition-all relative overflow-hidden ${
                          isSelected
                            ? 'w-11 h-11 bg-gradient-to-tr from-[#7a00ff] to-[#0066ff] text-white ring-4 ring-primary/40 shadow-xl shadow-purple-900/60'
                            : isResonating
                            ? 'w-9 h-9 bg-gradient-to-tr from-cyan-500/80 to-purple-600/80 text-white border border-cyan-400/50 shadow-md shadow-cyan-900/30'
                            : 'w-8 h-8 bg-[#18181c] text-zinc-300 hover:text-white border border-white/20 hover:border-white/40'
                        }`}
                      >
                        {node.thumbnailUrl ? (
                          <img
                            src={node.thumbnailUrl}
                            alt={node.title}
                            className="absolute inset-0 w-full h-full rounded-full object-cover p-0.5"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : null}
                        <span className="material-symbols-outlined text-sm select-none">
                          {node.type === 'signal' || node.mediaType === 'video'
                            ? 'videocam'
                            : node.mediaType === 'image'
                            ? 'image'
                            : 'sensors'}
                        </span>
                      </div>

                      {/* Clean Floating Node Label */}
                      <span
                        className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold max-w-[85px] truncate border backdrop-blur-md shadow-md text-center ${
                          isSelected
                            ? 'bg-primary text-black border-primary font-bold'
                            : 'bg-black/85 text-zinc-300 border-white/10'
                        }`}
                      >
                        {node.authorName.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Bottom Overlay Legend */}
          <div className="absolute bottom-4 left-4 z-30 flex items-center gap-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Resonating</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Active Signal</span>
            </div>
          </div>
        </div>

        {/* 2. Right Column: Selected Node Details Card */}
        <div className="space-y-4">
          {selectedNode ? (
            <div className="p-6 rounded-3xl bg-[#141416]/95 border border-white/10 shadow-2xl backdrop-blur-xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                  {selectedNode.type === 'signal' ? 'Video Signal' : 'Broadcast'}
                </span>
                <span className="text-xs text-zinc-500">
                  {new Date(selectedNode.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Author Row */}
              <div
                onClick={() => navigate(`/profile/${selectedNode.authorId || selectedNode.authorUsername}`)}
                className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-opacity"
              >
                <Avatar src={selectedNode.authorAvatar} name={selectedNode.authorName} size="md" hasStory />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{selectedNode.authorName}</h3>
                  <p className="text-xs text-zinc-400 truncate">@{selectedNode.authorUsername}</p>
                </div>
              </div>


              {/* Media Thumbnail Preview (for video signals / posts with media) */}
              {(() => {
                const thumb = getSignalThumbnail(selectedNode.thumbnailUrl, selectedNode.mediaUrl);
                if (thumb) {
                  return (
                    <div
                      onClick={() => handleOpenOriginal(selectedNode)}
                      className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/80 border border-white/10 group cursor-pointer shadow-lg"
                    >
                      <img
                        src={thumb}
                        alt={selectedNode.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xl group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-xl">
                            {selectedNode.type === 'signal' ? 'play_arrow' : 'open_in_new'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Node Title & Description */}
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white leading-snug">{selectedNode.title}</h4>
                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">{selectedNode.caption}</p>
              </div>

              {/* Location Tag if available */}
              {selectedNode.locationName && (
                <div className="flex items-center gap-1.5 text-xs text-cyan-300 bg-cyan-950/40 px-3 py-1.5 rounded-xl border border-cyan-500/20">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  <span>{selectedNode.locationName}</span>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <span className="text-base font-extrabold text-primary block">{selectedNode.resonanceCount}</span>
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase">Resonances</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <span className="text-base font-extrabold text-cyan-300 block">{selectedNode.commentCount}</span>
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase">Discussions</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleOpenOriginal(selectedNode)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-95 active:scale-98 text-white text-xs font-bold shadow-lg shadow-purple-900/40 transition-all flex items-center justify-center gap-2"
              >
                <span>Open {selectedNode.type === 'signal' ? 'Video Signal' : 'Broadcast'}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-[#141416]/70 border border-white/10 text-center space-y-3">
              <span className="material-symbols-outlined text-3xl text-zinc-600">touch_app</span>
              <p className="text-xs text-zinc-400">Select any node on the mesh map to inspect telemetry details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
