import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import type { Conversation, Message } from '../../types/message.types';
import { mapFirestoreError } from '../../lib/errors';
import { sanitizeForFirestore } from '../../lib/firestoreUtils';

const CONVERSATIONS_COLLECTION = 'conversations';

/**
 * Generates a deterministic direct conversation ID from two user UIDs
 */
export function getDirectConversationId(uid1: string, uid2: string): string {
  const sorted = [uid1, uid2].sort();
  return `direct_${sorted[0]}_${sorted[1]}`;
}

/**
 * Subscribes to real-time conversations for the current authenticated user.
 * Avoids Firestore multi-field composite index errors by sorting in-memory.
 */
export function subscribeToUserConversations(
  uid: string,
  onUpdate: (conversations: Conversation[]) => void
): Unsubscribe {
  try {
    const q = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where('participants', 'array-contains', uid)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const convs: Conversation[] = [];
        snapshot.forEach((docSnap) => {
          convs.push(docSnap.data() as Conversation);
        });
        convs.sort(
          (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
        );
        onUpdate(convs);
      },
      (error) => {
        console.warn('[nexusService] conversations snapshot notice:', error);
      }
    );
  } catch (err) {
    console.warn('[nexusService] conversations query warning:', err);
    return () => {};
  }
}

/**
 * Subscribes to real-time messages for a specific conversation
 */
export function subscribeToConversationMessages(
  conversationId: string,
  onUpdate: (messages: Message[]) => void
): Unsubscribe {
  try {
    const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, 'messages');
    const q = query(messagesRef, orderBy('sentAt', 'asc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const msgs: Message[] = [];
        snapshot.forEach((docSnap) => {
          msgs.push(docSnap.data() as Message);
        });
        onUpdate(msgs);
      },
      (error) => {
        console.warn('[nexusService] messages snapshot notice:', error);
      }
    );
  } catch (err) {
    console.warn('[nexusService] messages query warning:', err);
    return () => {};
  }
}

/**
 * Creates or gets existing conversation with deterministic conversation ID
 */
export async function getOrCreateFirestoreConversation(
  targetUser: {
    uid: string;
    displayName: string;
    username: string;
    photoURL?: string | null;
  },
  viewerUser?: {
    uid: string;
    displayName?: string;
    username?: string;
    photoURL?: string | null;
  }
): Promise<Conversation> {
  const currentUid = viewerUser?.uid || auth.currentUser?.uid;
  if (!currentUid || currentUid === 'user_anonymous' || currentUid.startsWith('guest_')) {
    throw new Error('Authentication required to message.');
  }

  if (currentUid === targetUser.uid) {
    throw new Error('Cannot start a conversation with yourself.');
  }

  const conversationId = getDirectConversationId(currentUid, targetUser.uid);
  const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);

  try {
    const snap = await getDoc(convRef).catch(() => null);
    if (snap && snap.exists()) {
      return snap.data() as Conversation;
    }

    const now = new Date().toISOString();
    const currentDisplayName =
      viewerUser?.displayName || auth.currentUser?.displayName || 'Solvexa Pioneer';
    const currentUsername =
      viewerUser?.username ||
      (auth.currentUser?.email?.split('@')[0] || `user_${currentUid.slice(0, 5)}`)
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_');
    const currentPhoto = viewerUser?.photoURL || auth.currentUser?.photoURL || null;

    const newConv: Conversation = {
      conversationId,
      type: 'direct',
      participants: [currentUid, targetUser.uid],
      participantDetails: [
        {
          uid: currentUid,
          displayName: currentDisplayName,
          username: currentUsername,
          photoURL: currentPhoto,
        },
        {
          uid: targetUser.uid,
          displayName: targetUser.displayName,
          username: targetUser.username,
          photoURL: targetUser.photoURL || null,
        },
      ],
      createdAt: now,
      updatedAt: now,
      lastMessage: null,
      unreadCounts: { [currentUid]: 0, [targetUser.uid]: 0 },
      groupName: null,
      groupAvatar: null,
      createdBy: currentUid,
    };

    await setDoc(convRef, sanitizeForFirestore(newConv), { merge: true });
    return newConv;
  } catch (error: unknown) {
    console.error('[nexusService] getOrCreateFirestoreConversation error:', error);
    const firestoreError = error as { code?: string; message?: string };
    throw new Error(mapFirestoreError(firestoreError));
  }
}

/**
 * Sends a message in Firestore, atomically creating/updating parent conversation
 */
export async function sendMessageInFirestore(
  conversationId: string,
  content: string,
  payload?: Partial<Message>,
  clientMessageId?: string
): Promise<Message> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required to transmit message.');
  }

  try {
    const messageId = clientMessageId || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const newMsg: Message = {
      messageId,
      conversationId,
      senderId: currentUser.uid,
      content,
      type: payload?.type || 'text',
      media: payload?.media,
      sharedContent: payload?.sharedContent || null,
      sentAt: now,
      deletedFor: [],
      isDeletedForEveryone: false,
      isDeleted: false,
    };

    const msgRef = doc(db, CONVERSATIONS_COLLECTION, conversationId, 'messages', messageId);
    const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);

    const sanitizedMsg = sanitizeForFirestore(newMsg);
    const sanitizedConvUpdate = sanitizeForFirestore({
      lastMessage: {
        content: content || 'Shared an item',
        senderId: currentUser.uid,
        sentAt: now,
        type: newMsg.type,
      },
      updatedAt: now,
    });

    await Promise.all([
      setDoc(msgRef, sanitizedMsg),
      setDoc(convRef, sanitizedConvUpdate, { merge: true }),
    ]);

    return newMsg;
  } catch (error: unknown) {
    console.error('[nexusService] sendMessage error:', error);
    const firestoreError = error as { code?: string; message?: string };
    throw new Error(mapFirestoreError(firestoreError));
  }
}

/**
 * Soft deletes message for a specific user
 */
export async function deleteMessageForMeInFirestore(
  conversationId: string,
  messageId: string
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  try {
    const msgRef = doc(db, CONVERSATIONS_COLLECTION, conversationId, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;

    const data = snap.data() as Message;
    const deletedFor = data.deletedFor || [];
    if (!deletedFor.includes(currentUser.uid)) {
      deletedFor.push(currentUser.uid);
      await updateDoc(msgRef, { deletedFor });
    }
  } catch (err) {
    console.warn('[nexusService] deleteMessageForMe warning:', err);
  }
}

/**
 * Deletes message for everyone (replaces content with deleted placeholder)
 */
export async function deleteMessageForEveryoneInFirestore(
  conversationId: string,
  messageId: string
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  try {
    const msgRef = doc(db, CONVERSATIONS_COLLECTION, conversationId, 'messages', messageId);
    const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;

    const data = snap.data() as Message;
    if (data.senderId !== currentUser.uid) {
      throw new Error('You can only delete your own transmissions for everyone.');
    }

    const now = new Date().toISOString();

    await updateDoc(msgRef, {
      content: 'This message was deleted',
      isDeleted: true,
      isDeletedForEveryone: true,
      deletedAt: now,
      deletedBy: currentUser.uid,
      media: null,
      sharedContent: null,
    });

    // Update parent conversation's lastMessage if this was the last message
    const convSnap = await getDoc(convRef).catch(() => null);
    if (convSnap && convSnap.exists()) {
      const convData = convSnap.data() as Conversation;
      if (
        convData.lastMessage &&
        (convData.lastMessage.sentAt === data.sentAt || convData.lastMessage.content === data.content)
      ) {
        await updateDoc(convRef, {
          'lastMessage.content': 'This message was deleted',
          updatedAt: now,
        }).catch((e) => console.warn('[nexusService] lastMessage update on delete error:', e));
      }
    }
  } catch (err) {
    console.warn('[nexusService] deleteMessageForEveryone warning:', err);
  }
}

/**
 * Marks conversation unread count as read for a specific user in Firestore
 */
export async function markConversationReadInFirestore(
  conversationId: string,
  uid: string
): Promise<void> {
  if (!conversationId || !uid) return;
  try {
    const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(convRef, {
      [`unreadCounts.${uid}`]: 0,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[nexusService] markConversationReadInFirestore warning:', err);
  }
}
