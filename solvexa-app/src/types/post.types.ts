export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  votedUserIds?: string[];
}

export type PostType = 'text' | 'image' | 'multi_image' | 'video' | 'link' | 'poll' | 'question' | 'discussion';
export type PostVisibility = 'public' | 'followers' | 'private';

export interface Post {
  postId: string;
  authorId: string;
  authorName?: string;
  authorUsername?: string;
  authorAvatar?: string;
  content: string;
  media: MediaItem[];
  mediaType: 'none' | 'image' | 'video' | 'multi';
  postType: PostType;
  createdAt: any;
  updatedAt?: any;
  visibility: PostVisibility;
  spaceId: string | null;
  spaceName?: string;
  topics: string[];
  commentCount: number;
  signalCount: number;
  shareCount: number;
  saveCount: number;
  location: string | null;
  pollOptions: PollOption[] | null;
  isDeleted?: boolean;
  linkUrl?: string;
  linkPreview?: LinkPreview;
  mySignal?: SignalType | null;
  isSaved?: boolean;
}

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  imageUrl: string | null;
}

export interface Comment {
  commentId: string;
  postId: string;
  authorId: string;
  authorName?: string;
  authorUsername?: string;
  authorAvatar?: string;
  content: string;
  createdAt: any;
  updatedAt?: any;
  replyTo: string | null;
  signalCount: number;
  isDeleted?: boolean;
  replies?: Comment[];
}

export type SignalType = 'insightful' | 'interesting' | 'inspiring' | 'funny' | 'curious' | 'agree';

export interface Signal {
  signalId: string;
  userId: string;
  targetId: string;
  targetType: 'post' | 'comment' | 'signal_video' | 'moment';
  signalType: SignalType;
  createdAt: any;
}

export interface SavedItem {
  savedId: string;
  userId: string;
  contentId: string;
  contentType: 'post' | 'signal_video' | 'moment';
  collectionId: string | null;
  savedAt: any;
  post?: Post;
}

export interface Collection {
  collectionId: string;
  ownerId: string;
  name: string;
  createdAt: any;
  itemCount: number;
  coverImage?: string;
}

export const SIGNAL_TYPE_CONFIG: Record<SignalType, { label: string; icon: string; color: string; description: string }> = {
  insightful: { label: 'Insightful', icon: 'lightbulb', color: '#d0bcff', description: 'Deep tech, signal discovery & wisdom' },
  interesting: { label: 'Explore', icon: 'explore', color: '#4cd7f6', description: 'Intriguing ideas & curiosity' },
  inspiring: { label: 'Resonate', icon: 'sensors', color: '#adc6ff', description: 'High vibe & motivational waves' },
  funny: { label: 'Spark', icon: 'sentiment_very_satisfied', color: '#ffb4ab', description: 'Wit, humor & levity' },
  curious: { label: 'Prism', icon: 'psychology', color: '#a078ff', description: 'Multi-angle thinking & debate' },
  agree: { label: 'Beacon', icon: 'thumb_up', color: '#4cd7f6', description: 'Solid consensus & affirmation' },
};
