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

export default function SignalMapPage() {
  const { dataMode } = useAuth();
  const navigate = useNavigate();

  const [mapData, setMapData] = useState<SignalMapData>({
    nodes: [],
    links: [],
    totalResonance: 0,
    activeFrequency: '432.8 MHz',
  });

  const [selectedNode, setSelectedNode] = useState<SignalNode | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showUnmapped, setShowUnmapped] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Sync with dataStore
  useEffect(() => {
    const sync = () => {
      const data = getSignalMapData();
      setMapData(data);
      if (!selectedNode && data.nodes.length > 0) {
        setSelectedNode(data.nodes[0]);
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

  const mappedNodes = useMemo(() => filteredNodes.filter((n) => n.isMapped), [filteredNodes]);
  const unmappedNodes = useMemo(() => filteredNodes.filter((n) => !n.isMapped), [filteredNodes]);

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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center signal-glow">
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
        <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 px-4 py-2 rounded-2xl text-xs">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">Active Nodes</span>
            <span className="font-bold text-white text-sm">{mappedNodes.length} Mapped</span>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">Resonance</span>
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
                  ? 'bg-gradient-to-r from-[#7a00ff] to-[#0066ff] text-white shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10'
              }`}
            >
              {cat === 'all' ? 'All Mesh Signals' : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all"
            title="Zoom In"
          >
            <span className="material-symbols-outlined text-sm">zoom_in</span>
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all"
            title="Zoom Out"
          >
            <span className="material-symbols-outlined text-sm">zoom_out</span>
          </button>
          <button
            onClick={handleResetView}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white border border-white/10 transition-all"
          >
            Reset
          </button>
          {unmappedNodes.length > 0 && (
            <button
              onClick={() => setShowUnmapped(!showUnmapped)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                showUnmapped
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'
              }`}
            >
              <span className="material-symbols-outlined text-xs">tune</span>
              <span>Unmapped ({unmappedNodes.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Map & Information Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Left 2 Columns: Interactive Canvas Map */}
        <div className="lg:col-span-2 relative h-[480px] sm:h-[560px] rounded-3xl bg-[#141416]/90 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl">
          {/* Subtle Grid Background Pattern */}
          <div
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Compass Radar Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[500px] h-[500px] rounded-full border border-white/[0.03]" />
            <div className="w-[340px] h-[340px] rounded-full border border-primary/10" />
            <div className="w-[180px] h-[180px] rounded-full border border-cyan-400/15" />
          </div>

          {/* Interactive Panning Viewport */}
          <div
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`w-full h-full relative cursor-grab active:cursor-grabbing flex items-center justify-center transition-transform duration-75`}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            {mappedNodes.length === 0 ? (
              <div className="pointer-events-auto">
                <EmptyState
                  variant="signal_map"
                  title="No signals mapped yet"
                  description="Active broadcasts and creator nodes will illuminate the spatial map in real time."
                  actionLabel="Explore Signals"
                  onAction={() => navigate('/signals')}
                />
              </div>
            ) : (
              <>
                {/* SVG Connecting Links */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                  {mapData.links.map((link) => {
                    const source = mappedNodes.find((n) => n.id === link.sourceId);
                    const target = mappedNodes.find((n) => n.id === link.targetId);
                    if (!source || !target) return null;

                    // Center offset calculation
                    const x1 = `calc(50% + ${source.x * 2.8}px)`;
                    const y1 = `calc(50% + ${source.y * 2.8}px)`;
                    const x2 = `calc(50% + ${target.x * 2.8}px)`;
                    const y2 = `calc(50% + ${target.y * 2.8}px)`;

                    return (
                      <line
                        key={link.id}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={link.active ? 'rgba(160, 120, 255, 0.4)' : 'rgba(255, 255, 255, 0.08)'}
                        strokeWidth={link.active ? 1.5 : 1}
                        strokeDasharray={link.active ? '4,4' : undefined}
                      />
                    );
                  })}
                </svg>

                {/* Signal Nodes */}
                {mappedNodes.map((node) => {
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
                        transform: `translate(${node.x * 2.8}px, ${node.y * 2.8}px)`,
                      }}
                      className="absolute z-20 flex flex-col items-center cursor-pointer group hover:scale-125 transition-transform duration-200"
                    >
                      {/* Outer Pulse Ring */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-primary text-black ring-4 ring-primary/40 shadow-lg shadow-purple-900/60 scale-110'
                            : isResonating
                            ? 'bg-gradient-to-tr from-cyan-400 to-purple-600 text-white signal-glow'
                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">
                          {node.type === 'signal' ? 'videocam' : 'sensors'}
                        </span>
                      </div>

                      {/* Floating Node Label */}
                      <span
                        className={`mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold max-w-[100px] truncate border backdrop-blur-md shadow-md ${
                          isSelected
                            ? 'bg-primary text-black border-primary'
                            : 'bg-black/80 text-zinc-300 border-white/10 group-hover:text-white'
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
          <div className="absolute bottom-4 left-4 z-30 flex items-center gap-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] text-zinc-400">
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

        {/* 2. Right Column: Selected Node Details & Unmapped Tray */}
        <div className="space-y-6">
          {selectedNode ? (
            <div className="p-6 rounded-3xl bg-[#141416]/90 border border-white/10 shadow-2xl backdrop-blur-xl space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                  {selectedNode.type === 'signal' ? 'Video Signal' : 'Broadcast Signal'}
                </span>
                <span className="text-xs text-zinc-500">
                  {new Date(selectedNode.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Author Row */}
              <div className="flex items-center gap-3">
                <Avatar src={selectedNode.authorAvatar} name={selectedNode.authorName} size="md" hasStory />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{selectedNode.authorName}</h3>
                  <p className="text-xs text-zinc-400 truncate">@{selectedNode.authorUsername}</p>
                </div>
              </div>

              {/* Node Title & Description */}
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-white leading-snug">{selectedNode.title}</h4>
                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-4">{selectedNode.caption}</p>
              </div>

              {/* Location Tag if available */}
              {selectedNode.locationName && (
                <div className="flex items-center gap-1.5 text-xs text-cyan-300 bg-cyan-950/40 p-2 rounded-xl border border-cyan-500/20">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  <span>{selectedNode.locationName}</span>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
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
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 active:scale-98 text-white text-xs font-bold shadow-lg shadow-purple-900/40 transition-all flex items-center justify-center gap-2"
              >
                <span>Open {selectedNode.type === 'signal' ? 'Video Signal' : 'Broadcast'}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-[#141416]/70 border border-white/10 text-center space-y-3">
              <span className="material-symbols-outlined text-3xl text-zinc-600">touch_app</span>
              <p className="text-xs text-zinc-400">Select any node on the mesh map to inspect telemetry details.</p>
            </div>
          )}

          {/* Unmapped Signals List (if toggled) */}
          {showUnmapped && unmappedNodes.length > 0 && (
            <div className="p-5 rounded-3xl bg-[#141416]/90 border border-white/10 space-y-3 animate-in fade-in">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Unmapped Signals Tray</span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">{unmappedNodes.length}</span>
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {unmappedNodes.map((node) => (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/30 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar src={node.authorAvatar} name={node.authorName} size="sm" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{node.title}</div>
                        <div className="text-[10px] text-zinc-400 truncate">@{node.authorUsername}</div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-sm text-zinc-500">chevron_right</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
