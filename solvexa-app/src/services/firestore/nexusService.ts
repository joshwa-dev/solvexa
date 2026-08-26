import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  arrayUnion,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import type { Conversation, Message } from '../../types/message.types';
import { mapFirestoreError } from '../../lib/errors';

const CONVERSATIONS_COLLECTION = 'conversations';

/**
 * Subscribes to real-time conversations for the current authenticated user
 */
export function subscribeToUserConversations(
  uid: string,
  onUpdate: (conversations: Conversation[]) => void
): Unsubscribe {
  try {
    const q = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where('participants', 'array-contains', uid),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const convs: Conversation[] = [];
        snapshot.forEach((docSnap) => {
          convs.push(docSnap.data() as Conversation);
        });
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
 * Creates or gets existing conversation
 */
export async function getOrCreateFirestoreConversation(
  targetUser: {
    uid: string;
    displayName: string;
    username: string;
    photoURL?: string | null;
  }
): Promise<Conversation> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required.');
  }

  const currentUid = currentUser.uid;

  try {
    // Check if conversation exists
    const q = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where('participants', 'array-contains', currentUid)
    );
    const snapshot = await getDocs(q);
    let existing: Conversation | null = null;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Conversation;
      if (data.type === 'direct' && data.participants.includes(targetUser.uid)) {
        existing = data;
      }
    });

    if (existing) {
      return existing;
    }

    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const newConv: Conversation = {
      conversationId,
      type: 'direct',
      participants: [currentUid, targetUser.uid],
      participantDetails: [
        {
          uid: currentUid,
          displayName: currentUser.displayName || 'Solvexa Pioneer',
          username: (currentUser.displayName || currentUser.email?.split('@')[0] || `user_${currentUid.slice(0, 5)}`)
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_'),
          photoURL: currentUser.photoURL || null,
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

    const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    await setDoc(convRef, newConv);

    return newConv;
  } catch (error: unknown) {
    console.error('[nexusService] createConversation error:', error);
    const firestoreError = error as { code?: string; message?: string };
    throw new Error(mapFirestoreError(firestoreError));
  }
}

/**
 * Sends a message in Firestore
 */
export async function sendMessageInFirestore(
  conversationId: string,
  content: string,
  payload?: Partial<Message>
): Promise<Message> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required to transmit message.');
  }

  try {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
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
    };

    const msgRef = doc(db, CONVERSATIONS_COLLECTION, conversationId, 'messages', messageId);
    const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);

    await Promise.all([
      setDoc(msgRef, newMsg),
      updateDoc(convRef, {
        lastMessage: {
          content: content || 'Shared an item',
          senderId: currentUser.uid,
          sentAt: now,
          type: newMsg.type,
        },
        updatedAt: now,
      }),
    ]);

    return newMsg;
  } catch (error: unknown) {
    console.error('[nexusService] sendMessage error:', error);
    const firestoreError = error as { code?: string; message?: string };
    throw new Error(mapFirestoreError(firestoreError));
  }
}

/**
 * WhatsApp-Style: Delete message for ME
 * Appends current user UID to deletedFor array without affecting other participants
 */
export async function deleteMessageForMeInFirestore(
  conversationId: string,
  messageId: string
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  try {
    const msgRef = doc(db, CONVERSATIONS_COLLECTION, conversationId, 'messages', messageId);
    await updateDoc(msgRef, {
      deletedFor: arrayUnion(currentUser.uid),
      updatedAt: serverTimestamp(),
    });
  } catch (error: unknown) {
    console.error('[nexusService] deleteMessageForMe error:', error);
    const firestoreError = error as { code?: string; message?: string };
    throw new Error(mapFirestoreError(firestoreError));
  }
}

/**
 * WhatsApp-Style: Delete message for EVERYONE
 * Sender replaces message content with "This message was deleted" and sets isDeletedForEveryone: true
 */
export async function deleteMessageForEveryoneInFirestore(
  conversationId: string,
  messageId: string
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  try {
    const msgRef = doc(db, CONVERSATIONS_COLLECTION, conversationId, 'messages', messageId);
    await updateDoc(msgRef, {
      content: 'This message was deleted',
      isDeletedForEveryone: true,
      media: null,
      sharedContent: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error: unknown) {
    console.error('[nexusService] deleteMessageForEveryone error:', error);
    const firestoreError = error as { code?: string; message?: string };
    throw new Error(mapFirestoreError(firestoreError));
  }
}
