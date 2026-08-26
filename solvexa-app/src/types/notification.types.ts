export type NotificationType =
  | 'signal'
  | 'comment'
  | 'reply'
  | 'follow'
  | 'follow_request'
  | 'mention'
  | 'message'
  | 'space'
  | 'moment_reply'
  | 'share'
  | 'system';

export interface Notification {
  notificationId: string;
  recipientId: string;
  senderId: string;
  type: NotificationType;
  targetId: string;
  targetType: string;
  isRead: boolean;
  createdAt: any;
  senderDisplayName?: string;
  senderUsername?: string;
  senderPhotoURL?: string | null;
  contentPreview?: string;
  linkUrl?: string;
}

export interface NotificationGroup {
  type: NotificationType;
  notifications: Notification[];
  count: number;
  latestAt: any;
  isRead: boolean;
}
