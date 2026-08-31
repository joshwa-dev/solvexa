import type { MediaItem } from './post.types';

export interface MessagePreview {
  content: string;
  senderId: string;
  sentAt: any;
  type: string;
}

export interface Conversation {
  conversationId: string;
  type: 'direct' | 'group';
  participants: string[];
  participantDetails?: {
    uid: string;
    displayName: string;
    username: string;
    photoURL: string | null;
    isOnline?: boolean;
  }[];
  createdAt: any;
  updatedAt: any;
  lastMessage: MessagePreview | null;
  unreadCounts: Record<string, number>;
  groupName: string | null;
  groupAvatar: string | null;
  createdBy: string | null;
}

export type MessageType = 'text' | 'image' | 'video' | 'media' | 'shared_post' | 'shared_signal' | 'shared_moment';

export interface SharedContent {
  type: 'post' | 'signal' | 'moment';
  id: string;
  title?: string;
  preview: string;
  thumbnailUrl?: string;
  authorName?: string;
  contextNote?: string;
}

export interface Message {
  messageId: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  media?: MediaItem;
  sharedContent: SharedContent | null;
  sentAt: any;
  id?: string;
  deleted?: boolean;
  isDeleted?: boolean;
  deletedFor?: string[];
  isDeletedForEveryone?: boolean;
  deletedAt?: any;
  deletedBy?: string;
  read?: boolean;
  readAt?: any;
  readBy?: Record<string, any>;
  reactions?: Record<string, string[]>;
}

export interface ContextSharePayload {
  context: 'thought_you_like' | 'reminded_me' | 'lets_discuss' | 'check_this_out' | 'custom';
  customMessage?: string;
  sharedContent: SharedContent;
}
