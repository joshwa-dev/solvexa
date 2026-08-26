import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import type { MomentWithAuthor } from '../../types/moment.types';
import { mapFirestoreError } from '../../lib/errors';

const STORIES_COLLECTION = 'stories';

/**
 * Creates a new 24-hour story in Firestore
 */
export async function createStoryInFirestore(storyData: {
  mediaUrl: string | null;
  mediaType: 'image' | 'video' | 'photo';
  text: string | null;
  backgroundColor?: string;
}): Promise<MomentWithAuthor> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required to create a story.');
  }

  try {
    const storyId = `story_${Date.now()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const storyDoc = {
      momentId: storyId,
      authorId: currentUser.uid,
      media: storyData.mediaUrl,
      mediaType: storyData.mediaType,
      text: storyData.text,
      backgroundColor: storyData.backgroundColor || '#141416',
      visibility: 'public',
      createdAt: now.toISOString(),
      expiresAt,
      viewCount: 1,
      signalCount: 0,
      hasViewed: false,
      author: {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Solvexa Pioneer',
        username: (currentUser.displayName || currentUser.email?.split('@')[0] || `user_${currentUser.uid.slice(0, 5)}`)
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_'),
        photoURL: currentUser.photoURL || null,
      },
      updatedAt: serverTimestamp(),
    };

    const storyRef = doc(db, STORIES_COLLECTION, storyId);
    await setDoc(storyRef, storyDoc);

    return storyDoc as MomentWithAuthor;
  } catch (error: unknown) {
    console.error('[storyService] createStory error:', error);
    const firestoreError = error as { code?: string; message?: string };
    throw new Error(mapFirestoreError(firestoreError));
  }
}

/**
 * Fetches active (non-expired) stories from Firestore
 */
export async function getActiveStoriesFromFirestore(): Promise<MomentWithAuthor[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return [];
  }

  try {
    const nowIso = new Date().toISOString();
    const q = query(
      collection(db, STORIES_COLLECTION),
      where('expiresAt', '>', nowIso),
      orderBy('expiresAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const stories: MomentWithAuthor[] = [];

    snapshot.forEach((docSnap) => {
      stories.push(docSnap.data() as MomentWithAuthor);
    });

    return stories;
  } catch (error: unknown) {
    console.warn('[storyService] getActiveStories warning:', error);
    return [];
  }
}

/**
 * Deletes a story by ID
 */
export async function deleteStoryInFirestore(storyId: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  try {
    const storyRef = doc(db, STORIES_COLLECTION, storyId);
    await deleteDoc(storyRef);
  } catch (error: unknown) {
    console.error('[storyService] deleteStory error:', error);
    const firestoreError = error as { code?: string; message?: string };
    throw new Error(mapFirestoreError(firestoreError));
  }
}
