import { dataStore } from '../store/dataStore';
import type { SignalVideo } from '../../types/signal.types';
import type { Post } from '../../types/post.types';

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
  mediaType?: 'image' | 'video';
  resonanceCount: number;
  commentCount: number;
  createdAt: string;
  // Normalized 2D canvas coordinates (-100 to 100) or geo coords
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

// Sample coordinates for Demo Mode
const DEMO_GEOS = [
  { x: -35, y: -20, lat: 37.7749, lng: -122.4194, loc: 'San Francisco, CA' },
  { x: 25, y: -15, lat: 51.5074, lng: -0.1278, loc: 'London, UK' },
  { x: 55, y: 10, lat: 35.6762, lng: 139.6503, loc: 'Tokyo, JP' },
  { x: 10, y: 35, lat: 1.3521, lng: 103.8198, loc: 'Singapore, SG' },
  { x: -20, y: 40, lat: -33.8688, lng: 151.2093, loc: 'Sydney, AU' },
  { x: -50, y: 15, lat: 40.7128, lng: -74.006, loc: 'New York, NY' },
  { x: 40, y: -30, lat: 52.52, lng: 13.405, loc: 'Berlin, DE' },
];

export function getSignalMapData(): SignalMapData {
  const isDemo = dataStore.getDataMode() === 'DEMO';
  const posts: Post[] = dataStore.getPosts();
  const signals: SignalVideo[] = dataStore.getSignals();

  const nodes: SignalNode[] = [];

  // Map Signals
  signals.forEach((sig, idx) => {
    const geo = DEMO_GEOS[idx % DEMO_GEOS.length];
    nodes.push({
      id: `sig_${sig.id}`,
      type: 'signal',
      title: sig.caption ? (sig.caption.slice(0, 40) + (sig.caption.length > 40 ? '...' : '')) : 'Video Signal Node',
      caption: sig.caption || 'Active technical demonstration signal.',
      authorId: sig.authorId,
      authorName: sig.authorName,
      authorUsername: sig.authorUsername || 'creator',
      authorAvatar: sig.authorAvatar || undefined,
      mediaUrl: sig.videoUrl,
      mediaType: 'video',
      resonanceCount: sig.resonanceCount || 1,
      commentCount: sig.commentCount || 0,
      createdAt: sig.createdAt || new Date().toISOString(),
      x: isDemo ? geo.x + (idx * 3) : ((idx * 17) % 140) - 70,
      y: isDemo ? geo.y + (idx * 2) : ((idx * 23) % 120) - 60,
      lat: isDemo ? geo.lat : undefined,
      lng: isDemo ? geo.lng : undefined,
      locationName: isDemo ? geo.loc : undefined,
      category: sig.topics?.[0] || 'AI & Robotics',
      status: (sig.resonanceCount || 0) > 5 ? 'resonating' : 'active',
      isMapped: isDemo ? true : (idx % 2 === 0),
    });
  });

  // Map Posts / Broadcasts
  posts.forEach((post, idx) => {
    const geo = DEMO_GEOS[(idx + 2) % DEMO_GEOS.length];
    nodes.push({
      id: `post_${post.postId}`,
      type: 'post',
      title: post.content.slice(0, 45) + (post.content.length > 45 ? '...' : ''),
      caption: post.content,
      authorId: post.authorId,
      authorName: post.authorName || 'Pioneer',
      authorUsername: post.authorUsername || 'pioneer',
      authorAvatar: post.authorAvatar || undefined,
      mediaUrl: post.media?.[0]?.url,
      mediaType: (post.media?.[0]?.type as any) || undefined,
      resonanceCount: post.signalCount || 0,
      commentCount: post.commentCount || 0,
      createdAt: post.createdAt || new Date().toISOString(),
      x: isDemo ? geo.x - 5 : ((idx * 29) % 150) - 75,
      y: isDemo ? geo.y + 8 : ((idx * 31) % 110) - 55,
      lat: isDemo ? geo.lat : undefined,
      lng: isDemo ? geo.lng : undefined,
      locationName: isDemo ? geo.loc : undefined,
      category: post.topics?.[0] || 'Spatial UI',
      status: (post.signalCount || 0) > 3 ? 'resonating' : 'active',
      isMapped: isDemo ? true : (idx % 3 === 0),
    });
  });

  // Synthesize Mesh Links
  const links: SignalLink[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i];
      const nodeB = nodes[j];
      const dist = Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);
      if (dist < 55) {
        links.push({
          id: `link_${nodeA.id}_${nodeB.id}`,
          sourceId: nodeA.id,
          targetId: nodeB.id,
          strength: Math.max(0.2, 1 - dist / 55),
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
    activeFrequency: '432.8 MHz • Quantum Mesh',
  };
}
