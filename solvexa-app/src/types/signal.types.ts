export interface SignalVideo {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string | null;
  /** The primary media URL — an .mp4 for video signals, an image URL for image signals */
  videoUrl: string;
  /** A static JPEG/image URL suitable for <img src> and <video poster>. Never use videoUrl here for video signals. */
  thumbnailUrl?: string;
  /** Whether this signal contains a 'video' or 'image' asset */
  mediaType?: 'image' | 'video';
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
