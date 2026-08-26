export interface Space {
  id: string;
  name: string;
  handle: string;
  description: string;
  bannerUrl: string;
  iconUrl: string;
  memberCount: number;
  postCount: number;
  category: 'AI & Engineering' | 'Creative Flow' | 'Quantum & Future' | 'Architecture' | 'Signal Research' | 'General';
  createdBy: string;
  createdAt: any;
  isPrivate: boolean;
  rules: string[];
  isJoined?: boolean;
}

export interface SpaceMember {
  spaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: any;
}
