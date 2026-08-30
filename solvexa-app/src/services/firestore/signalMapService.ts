import { dataStore } from '../store/dataStore';
import type { SignalVideo } from '../../types/signal.types';
import type { Post } from '../../types/post.types';
import { getSignalThumbnail } from '../storage/mediaUpload';

export interface SignalNode {
  id: string;
  type: 'signal' | 'post' | 'creator';
  title: string;
  caption: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  mediaType?: 'image' | 'video';
  resonanceCount: number;
  commentCount: number;
  createdAt: string;
  // Normalized 2D canvas coordinates (-100 to 100)
  x: number;
  y: number;
  lat?: number;
  lng?: number;
  locationName?: string;
  category: string;
  status: 'active' | 'resonating' | 'pulse';
  isMapped: boolean;
}

export interface SignalLink {
  id: string;
  sourceId: string;
  targetId: string;
  strength: number; // 0.1 to 1.0
  active: boolean;
}

export interface SignalMapData {
  nodes: SignalNode[];
  links: SignalLink[];
  totalResonance: number;
  activeFrequency: string;
}

// Sample geographic hubs for Demo Mode telemetry
const DEMO_GEOS = [
  { lat: 37.7749, lng: -122.4194, loc: 'San Francisco, CA' },
  { lat: 51.5074, lng: -0.1278, loc: 'London, UK' },
  { lat: 35.6762, lng: 139.6503, loc: 'Tokyo, JP' },
  { lat: 1.3521, lng: 103.8198, loc: 'Singapore, SG' },
  { lat: -33.8688, lng: 151.2093, loc: 'Sydney, AU' },
  { lat: 40.7128, lng: -74.006, loc: 'New York, NY' },
  { lat: 52.52, lng: 13.405, loc: 'Berlin, DE' },
];

export function getSignalMapData(): SignalMapData {
  const isDemo = dataStore.getDataMode() === 'DEMO';
  const posts: Post[] = dataStore.getPosts();
  const signals: SignalVideo[] = dataStore.getSignals();

  // 1. Deduplicate signals by stable unique key: signal.id
  const uniqueSignals = Array.from(
    new Map(signals.map((signal) => [signal.id, signal])).values()
  );

  // 2. Collect signatures from unique signals to prevent duplicate post nodes
  const signalIds = new Set(uniqueSignals.map((s) => s.id));
  const signalMedia = new Set(
    uniqueSignals.flatMap((s) => [s.videoUrl, s.thumbnailUrl].filter(Boolean) as string[])
  );
  const signalAuthorTopicSet = new Set(
    uniqueSignals.map((s) => `${s.authorId || s.authorUsername}_${(s.caption || '').trim().toLowerCase()}`)
  );

  // 3. Filter out any posts that duplicate an existing signal
  const nonDuplicatePosts = Array.from(
    new Map(posts.map((p) => [p.postId, p])).values()
  ).filter((p) => {
    if (
      signalIds.has(p.postId) ||
      signalIds.has(`sig_${p.postId}`) ||
      uniqueSignals.some((s) => s.id.replace('sig_', '') === p.postId.replace('post_', ''))
    ) {
      return false;
    }
    if (p.media?.some((m) => m.url && signalMedia.has(m.url))) {
      return false;
    }
    const authorKey = `${p.authorId || p.authorUsername}_${(p.content || '').trim().toLowerCase()}`;
    if (signalAuthorTopicSet.has(authorKey)) {
      return false;
    }
    return true;
  });

  const nodes: SignalNode[] = [];
  const totalItems = uniqueSignals.length + nonDuplicatePosts.length;

  // Golden ratio angle (approx 137.5 degrees in radians) for balanced spatial packing
  const GOLDEN_ANGLE = 2.399963229728653;

  // Helper to compute organic polar canvas coordinates (-70 to 70)
  const getNodeCoord = (index: number, total: number) => {
    if (total <= 1) return { x: 0, y: 0 };
    // Distribute nodes evenly in concentric organic orbital tracks
    const angle = index * GOLDEN_ANGLE;
    const radius = Math.min(65, 20 + Math.sqrt(index + 0.5) * 18);
    return {
      x: Math.round(Math.cos(angle) * radius),
      y: Math.round(Math.sin(angle) * radius * 0.85), // slight vertical compression for widescreen
    };
  };

  let globalIndex = 0;

  // Map Video Signals (Exactly one node per unique signal)
  uniqueSignals.forEach((sig) => {
    const geo = DEMO_GEOS[globalIndex % DEMO_GEOS.length];
    const coords = getNodeCoord(globalIndex, totalItems);
    const thumb = getSignalThumbnail(sig.thumbnailUrl, sig.videoUrl) || sig.thumbnailUrl || undefined;

    nodes.push({
      id: sig.id,
      type: 'signal',
      title: sig.caption ? (sig.caption.slice(0, 40) + (sig.caption.length > 40 ? '...' : '')) : 'Video Signal Node',
      caption: sig.caption || 'Active technical demonstration signal.',
      authorId: sig.authorId,
      authorName: sig.authorName,
      authorUsername: sig.authorUsername || 'creator',
      authorAvatar: sig.authorAvatar || undefined,
      mediaUrl: sig.videoUrl,
      thumbnailUrl: thumb,
      mediaType: sig.mediaType || 'video',
      resonanceCount: sig.resonanceCount || 1,
      commentCount: sig.commentCount || 0,
      createdAt: sig.createdAt || new Date().toISOString(),
      x: coords.x,
      y: coords.y,
      lat: isDemo ? geo.lat : undefined,
      lng: isDemo ? geo.lng : undefined,
      locationName: isDemo ? geo.loc : undefined,
      category: sig.topics?.[0] || 'AI & Neural Systems',
      status: (sig.resonanceCount || 0) > 5 ? 'resonating' : 'active',
      isMapped: true,
    });
    globalIndex++;
  });

  // Map Non-duplicate Broadcasts
  nonDuplicatePosts.forEach((post) => {
    const geo = DEMO_GEOS[globalIndex % DEMO_GEOS.length];
    const coords = getNodeCoord(globalIndex, totalItems);

    nodes.push({
      id: post.postId,
      type: 'post',
      title: post.content.slice(0, 45) + (post.content.length > 45 ? '...' : ''),
      caption: post.content,
      authorId: post.authorId,
      authorName: post.authorName || 'Pioneer',
      authorUsername: post.authorUsername || 'pioneer',
      authorAvatar: post.authorAvatar || undefined,
      mediaUrl: post.media?.[0]?.url,
      thumbnailUrl: post.media?.[0]?.url,
      mediaType: (post.media?.[0]?.type as any) || undefined,
      resonanceCount: post.signalCount || 0,
      commentCount: post.commentCount || 0,
      createdAt: post.createdAt || new Date().toISOString(),
      x: coords.x,
      y: coords.y,
      lat: isDemo ? geo.lat : undefined,
      lng: isDemo ? geo.lng : undefined,
      locationName: isDemo ? geo.loc : undefined,

      category: post.topics?.[0] || 'Spatial Computing',
      status: (post.signalCount || 0) > 3 ? 'resonating' : 'active',
      isMapped: true,
    });
    globalIndex++;
  });

  // Synthesize Mesh Links
  const links: SignalLink[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i];
      const nodeB = nodes[j];
      const dist = Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);
      const sameCategory = nodeA.category === nodeB.category;
      const maxLinkDist = sameCategory ? 50 : 35;

      if (dist < maxLinkDist && links.length < 24) {
        links.push({
          id: `link_${nodeA.id}_${nodeB.id}`,
          sourceId: nodeA.id,
          targetId: nodeB.id,
          strength: Math.max(0.2, 1 - dist / maxLinkDist),
          active: nodeA.status === 'resonating' || nodeB.status === 'resonating',
        });
      }
    }
  }

  const totalResonance = nodes.reduce((acc, n) => acc + n.resonanceCount, 0);

  return {
    nodes,
    links,
    totalResonance,
    activeFrequency: '432.8 MHz • Mesh Radar',
  };
}
