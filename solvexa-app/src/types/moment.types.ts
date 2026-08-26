export type MomentType = 'photo' | 'video' | 'text' | 'poll' | 'question' | 'music';

export interface Moment {
  momentId: string;
  authorId: string;
  authorName?: string;
  authorUsername?: string;
  authorPhotoURL?: string | null;
  media: string | null;
  mediaType: MomentType;
  text: string | null;
  backgroundColor: string | null;
  createdAt: any;
  expiresAt: any;
  visibility: 'public' | 'followers';
  viewCount: number;
  signalCount: number;
  hasViewed?: boolean;
}

export interface MomentView {
  viewId: string;
  momentId: string;
  viewerId: string;
  viewedAt: any;
}

export interface MomentWithAuthor extends Moment {
  author: {
    uid: string;
    displayName: string;
    username: string;
    photoURL: string | null;
  };
  hasViewed: boolean;
}
