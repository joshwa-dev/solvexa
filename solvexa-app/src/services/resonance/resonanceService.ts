import type { Post } from '../../types/post.types';
import type { SignalVideo } from '../../types/signal.types';
import type { SolvexaUser } from '../../types/user.types';

export interface ResonanceMetrics {
  views: number;
  signals: number; // likes / resonances
  comments: number;
  shares: number;
  saves: number;
  authorResonance: number;
  ageInHours: number;
}

/**
 * Solvexa Dynamic Resonance Score Algorithm
 * Computes an authentic engagement score considering:
 * - Signal Resonances (weight: 3.0)
 * - Insight Comments (weight: 4.5)
 * - Mesh Shares (weight: 6.0)
 * - Saved Archives (weight: 5.0)
 * - Temporal decay (half-life of 48h)
 */
export function calculatePostResonance(metrics: ResonanceMetrics): number {
  const baseScore =
    metrics.signals * 3.0 +
    metrics.comments * 4.5 +
    metrics.shares * 6.0 +
    metrics.saves * 5.0;

  // Time decay factor: older posts naturally decay in current resonance
  const decay = 1 / (1 + metrics.ageInHours * 0.03);

  // Author authority modifier
  const authorMod = 1 + Math.log10(Math.max(1, metrics.authorResonance)) * 0.15;

  return Math.round(baseScore * decay * authorMod);
}

/**
 * Calculates a user's total node resonance score from their broadcast telemetry
 */
export function calculateUserResonanceScore(
  user: SolvexaUser,
  posts: Post[],
  signals: SignalVideo[]
): number {
  const userPosts = posts.filter((p) => p.authorId === user.uid);
  const userSignals = signals.filter((s) => s.authorId === user.uid);

  const postsScore = userPosts.reduce((acc, p) => {
    return acc + (p.signalCount * 3) + (p.commentCount * 4) + (p.shareCount * 5) + (p.saveCount * 4);
  }, 0);

  const signalsScore = userSignals.reduce((acc, s) => {
    return acc + (s.resonanceCount * 4) + (s.commentCount * 4) + (s.shareCount * 5);
  }, 0);

  const networkScore = (user.followerCount || 0) * 2;

  return Math.max(0, postsScore + signalsScore + networkScore);
}
