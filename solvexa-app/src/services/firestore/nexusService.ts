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
 * Deduplicates messages strictly by canonical message ID.
 * Preserves message content and order while ensuring no duplicates exist in state.
 */
export function dedupeMessages(messages: Message[]): Message[] {
  const map = new Map<string, Message>();
  for (const msg of messages) {
    const key = msg.id || msg.messageId;
    if (key) {
      const isDel = Boolean(
        msg.deleted ||
          msg.isDeleted ||
          msg.isDeletedForEveryone ||
          msg.content === 'This message was deleted' ||
          msg.text === 'This message was deleted'
      );
      map.set(key, {
        ...msg,
        id: key,
        messageId: key,
        content: isDel ? 'This message was deleted' : msg.content || msg.text || '',
        text: isDel ? '' : msg.text || msg.content || '',
        sentAt: msg.sentAt || msg.createdAt || new Date().toISOString(),
        createdAt: msg.createdAt || msg.sentAt || new Date().toISOString(),
        deleted: isDel,
        isDeleted: isDel,
        isDeletedForEveryone: Boolean(msg.isDeletedForEveryone || isDel),
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.sentAt || a.createdAt || 0).getTime() - new Date(b.sentAt || b.createdAt || 0).getTime()
  );
}

/**
 * Subscribes to real-time messages for a specific conversation
 */
export function subscribeToConversationMessages(
  conversationId: string,
  onUpdate: (messages: Message[]) => void
): Unsubscribe {
  if (!conversationId || conversationId === 'undefined' || !conversationId.trim()) {
    return () => {};
  }

  try {
    const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, 'messages');
    const q = query(messagesRef, orderBy('sentAt', 'asc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const rawMsgs: Message[] = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as Message;
          const id = docSnap.id;
          rawMsgs.push({
            ...data,
            id,
            messageId: id,
          });
        });
        onUpdate(dedupeMessages(rawMsgs));
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
  targetUser: { uid: string; displayName?: string; username?: string; photoURL?: string | null },
  viewerUser?: { uid: string; displayName?: string; username?: string; photoURL?: string | null }
): Promise<Conversation> {
  const currentUid = viewerUser?.uid || auth.currentUser?.uid;
  if (!currentUid) {
    throw new Error('Authentication required to initialize conversation.');
  }

  if (!targetUser?.uid) {
    throw new Error('Target user UID is required to initialize conversation.');
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
  } catch (err) {
    console.warn('[nexusService] Safe conversation existence probe notice:', err);
  }

  const now = new Date().toISOString();
  const currentDisplayName = viewerUser?.displayName || auth.currentUser?.displayName || 'Solvexa Pioneer';
  const currentUsername = viewerUser?.username || (auth.currentUser?.email?.split('@')[0] || `user_${currentUid.slice(0, 5)}`);
  const currentPhoto = viewerUser?.photoURL || auth.currentUser?.photoURL || null;

  const targetDisplayName = targetUser.displayName || 'Solvexa Pioneer';
  const targetUsername = targetUser.username || 'pioneer';
  const targetPhoto = targetUser.photoURL || null;

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
        isOnline: true,
      },
      {
        uid: targetUser.uid,
        displayName: targetDisplayName,
        username: targetUsername,
        photoURL: targetPhoto,
        isOnline: false,
      },
    ],
    createdAt: now,
    updatedAt: now,
    lastMessage: null,
    unreadCounts: {
      [currentUid]: 0,
      [targetUser.uid]: 0,
    },
    groupName: null,
    groupAvatar: null,
    createdBy: currentUid,
  };

  try {
    await setDoc(convRef, sanitizeForFirestore(newConv), { merge: true });
    return newConv;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[Solvexa Nexus]', {
        conversationId,
        currentUserId: currentUid,
        otherUserId: targetUser.uid,
        firestorePath: `conversations/${conversationId}`,
        error: err,
      });
    }
    throw err;
  }
}

/**
 * Sends a message in Firestore with canonical Firestore document ID
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

  if (!conversationId || conversationId === 'undefined' || !conversationId.trim()) {
    throw new Error('Valid conversationId is required to transmit message.');
  }

  try {
    const messagesColl = collection(db, CONVERSATIONS_COLLECTION, conversationId, 'messages');
    const msgRef = clientMessageId ? doc(messagesColl, clientMessageId) : doc(messagesColl);
    const messageId = msgRef.id;
    const now = new Date().toISOString();

    const newMsg: Message = {
      id: messageId,
      messageId,
      conversationId,
      senderId: currentUser.uid,
      content,
      text: content,
      type: payload?.type || 'text',
      media: payload?.media,
      sharedContent: payload?.sharedContent || null,
      sentAt: now,
      createdAt: now,
      deletedFor: [],
      deleted: false,
      isDeleted: false,
      isDeletedForEveryone: false,
    };

    const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const sanitizedMsg = sanitizeForFirestore(newMsg);
    const sanitizedConvUpdate = sanitizeForFirestore({
      lastMessage: {
        content: content || 'Shared an item',
        text: content || 'Shared an item',
        senderId: currentUser.uid,
        sentAt: now,
        createdAt: now,
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
 * Soft deletes message for a specific user (idempotent)
 */
export async function deleteMessageForMeInFirestore(
  conversationId: string,
  messageId: string
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !conversationId || !messageId) return;

  try {
    const msgRef = doc(db, CONVERSATIONS_COLLECTION, conversationId, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;

    const data = snap.data() as Message;
    const deletedFor = data.deletedFor || [];
    if (deletedFor.includes(currentUser.uid)) {
      return; // Already deleted for me
    }

    deletedFor.push(currentUser.uid);
    await updateDoc(msgRef, { deletedFor });
  } catch (err) {
    console.warn('[nexusService] deleteMessageForMe warning:', err);
  }
}

/**
 * Deletes message for everyone in place (idempotent, updates existing document)
 */
export async function deleteMessageForEveryoneInFirestore(
  conversationId: string,
  messageId: string
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !conversationId || !messageId) return;

  try {
    const msgRef = doc(db, CONVERSATIONS_COLLECTION, conversationId, 'messages', messageId);
    const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;

    const data = snap.data() as Message;
    if (data.senderId !== currentUser.uid) {
      throw new Error('You can only delete your own transmissions for everyone.');
    }

    // Idempotency: if already deleted, do nothing
    if (data.isDeleted || data.isDeletedForEveryone || (data as any).deleted) {
      return;
    }

    const now = new Date().toISOString();

    await updateDoc(msgRef, {
      content: 'This message was deleted',
      text: '',
      deleted: true,
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
        (convData.lastMessage.sentAt === data.sentAt ||
          convData.lastMessage.content === data.content ||
          (convData.lastMessage as any).text === data.content)
      ) {
        await updateDoc(convRef, {
          'lastMessage.content': 'This message was deleted',
          'lastMessage.text': 'This message was deleted',
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
