export interface SignalVideo {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string | null;
  videoUrl: string;
  thumbnailUrl?: string;
  caption: string;
  topics: string[];
  soundTitle: string;
  soundAuthor: string;
  resonanceCount: number;
  commentCount: number;
  shareCount: number;
  isResonated?: boolean;
  isBookmarked?: boolean;
  aspectRatio?: '9:16' | '1:1' | '16:9';
  createdAt: any;
}

export type Signal = SignalVideo;
