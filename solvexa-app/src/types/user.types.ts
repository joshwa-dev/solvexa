export interface PrivacySettings {
  whoCanMessage: 'everyone' | 'following' | 'nobody';
  whoCanMention: 'everyone' | 'following';
  whoCanComment: 'everyone' | 'following' | 'nobody';
  activityVisible: boolean;
}

export interface NotificationPrefs {
  signals: boolean;
  comments: boolean;
  follows: boolean;
  mentions: boolean;
  messages: boolean;
  spaceActivity: boolean;
  momentReplies: boolean;
}

export interface IdentityCard {
  id: string;
  label: string;
  icon: string;
  order: number;
  category?: 'role' | 'interest' | 'achievement' | 'vibe';
}

export interface SolvexaUser {
  uid: string;
  displayName: string;
  username: string;
  email: string;
  photoURL: string | null;
  avatarUrl?: string | null;
  avatar?: string | null;
  profileImage?: string | null;
  coverPhotoURL: string | null;
  bio: string;
  location: string;
  website: string;
  createdAt: any;
  updatedAt: any;
  followerCount: number;
  followingCount: number;
  signalCount: number;
  spaceCount: number;
  resonanceScore?: number;
  isPrivate: boolean;
  onboardingComplete: boolean;
  privacySettings: PrivacySettings;
  notificationPrefs: NotificationPrefs;
  identityCards: IdentityCard[];
  isFollowing?: boolean;
}

export interface UsernameDoc {
  uid: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  photoURL: string | null;
  coverPhotoURL?: string | null;
  bio: string;
  followerCount: number;
  followingCount: number;
  signalCount: number;
  resonanceScore?: number;
  isPrivate: boolean;
  identityCards: IdentityCard[];
  isFollowing?: boolean;
}
