import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import type { SolvexaUser, IdentityCard } from '../../types/user.types';
import { normalizeUsername } from '../../lib/validators';
import { mapFirestoreError } from '../../lib/errors';

/**
 * Reads user profile document from users/{uid}
 */
export async function getUserProfile(uid: string): Promise<SolvexaUser | null> {
  if (!uid || uid === 'user_anonymous') return null;

  try {
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);
    if (!snapshot.exists()) return null;
    return snapshot.data() as SolvexaUser;
  } catch (error: unknown) {
    console.error('[profileService] getUserProfile error:', error);
    throw error;
  }
}

/**
 * Creates or initializes a new user profile at users/{uid}
 */
export async function createUserProfile(
  uid: string,
  data: {
    displayName: string;
    email: string;
    photoURL: string | null;
  }
): Promise<void> {
  if (!uid || uid === 'user_anonymous') return;

  try {
    const userRef = doc(db, 'users', uid);

    const defaultProfile: Partial<SolvexaUser> = {
      uid,
      displayName: data.displayName || 'Solvexa Pioneer',
      username: (data.displayName || data.email?.split('@')[0] || `user_${uid.slice(0, 5)}`)
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_'),
      email: data.email || '',
      photoURL: data.photoURL || null,
      coverPhotoURL: null,
      bio: '',
      location: '',
      website: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      followerCount: 0,
      followingCount: 0,
      signalCount: 0,
      spaceCount: 0,
      resonanceScore: 0,
      isPrivate: false,
      onboardingComplete: true,
      privacySettings: {
        whoCanMessage: 'everyone',
        whoCanMention: 'everyone',
        whoCanComment: 'everyone',
        activityVisible: true,
      },
      notificationPrefs: {
        signals: true,
        comments: true,
        follows: true,
        mentions: true,
        messages: true,
        spaceActivity: true,
        momentReplies: true,
      },
      identityCards: [
        { id: '1', label: 'Signal Pioneer', icon: 'sensors', order: 1, category: 'role' },
      ],
    };

    await setDoc(userRef, sanitizeForFirestore(defaultProfile), { merge: true });
  } catch (err) {
    console.error('[profileService] createUserProfile error:', err);
    throw err;
  }
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const normalized = normalizeUsername(username);
    const usernameRef = doc(db, 'usernames', normalized);
    const snapshot = await getDoc(usernameRef);
    return !snapshot.exists();
  } catch {
    return true;
  }
}

export async function claimUsername(uid: string, username: string): Promise<void> {
  try {
    const normalized = normalizeUsername(username);
    const usernameRef = doc(db, 'usernames', normalized);
    const userRef = doc(db, 'users', uid);

    await runTransaction(db, async (transaction) => {
      const usernameDoc = await transaction.get(usernameRef);
      
      if (usernameDoc.exists() && usernameDoc.data()?.uid !== uid) {
        throw new Error('Username is already taken. Please choose another.');
      }

      transaction.set(usernameRef, { uid });
      transaction.set(userRef, {
        username: normalized,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
  } catch (err: unknown) {
    const e = err as Error;
    throw new Error(e.message || 'Failed to claim username');
  }
}

import { sanitizeForFirestore } from '../../lib/firestoreUtils';

/**
 * Updates an authenticated user's profile at users/{uid}
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<SolvexaUser>
): Promise<void> {
  if (!uid || uid === 'user_anonymous') {
    throw new Error('Authentication required to update profile.');
  }

  // Ensure current user matches UID
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser || currentAuthUser.uid !== uid) {
    throw new Error('You do not have permission to modify another user\'s profile.');
  }

  try {
    const userRef = doc(db, 'users', uid);
    const sanitizedUpdates = sanitizeForFirestore({
      ...updates,
      updatedAt: serverTimestamp(),
    });
    await setDoc(userRef, sanitizedUpdates, { merge: true });
  } catch (error: unknown) {
    console.error('[profileService] updateUserProfile error:', error);
    const firestoreError = error as { code?: string; message?: string };
    throw new Error(mapFirestoreError(firestoreError));
  }
}

export async function completeOnboarding(uid: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      onboardingComplete: true,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('[profileService] completeOnboarding error:', err);
  }
}

export async function getUserByUsername(username: string): Promise<SolvexaUser | null> {
  try {
    const normalized = normalizeUsername(username);
    const usernameRef = doc(db, 'usernames', normalized);
    const usernameDoc = await getDoc(usernameRef);
    
    if (!usernameDoc.exists()) return null;
    
    const uid = usernameDoc.data()?.uid;
    if (!uid) return null;
    
    return getUserProfile(uid);
  } catch {
    return null;
  }
}

export async function updateIdentityCards(uid: string, cards: IdentityCard[]): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      identityCards: cards,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('[profileService] updateIdentityCards error:', err);
  }
}

export async function deleteUserData(uid: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', uid);
    batch.delete(userRef);
    await batch.commit();
  } catch (error: unknown) {
    console.error('[profileService] deleteUserData error:', error);
  }
}
