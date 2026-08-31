import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  limit,
  serverTimestamp,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import type { SolvexaUser, IdentityCard } from '../../types/user.types';
import { normalizeUsername } from '../../lib/validators';
import { mapFirestoreError } from '../../lib/errors';
import { sanitizeForFirestore } from '../../lib/firestoreUtils';

/**
 * Resolves avatar URL from any supported user schema field:
 * avatar, avatarUrl, avatarURL, profileImage, photoURL
 */
function extractAvatar(data: any): string | null {
  if (!data) return null;
  const candidate =
    data.avatar ||
    data.avatarUrl ||
    data.avatarURL ||
    data.profileImage ||
    data.photoURL;
  if (typeof candidate === 'string' && candidate.trim()) {
    const val = candidate.trim();
    if (val !== 'null' && val !== 'undefined') return val;
  }
  return null;
}

/**
 * Resolves cover photo URL from any supported user schema field:
 * coverPhotoURL, coverUrl, coverImage
 */
function extractCover(data: any): string | null {
  if (!data) return null;
  const candidate =
    data.coverPhotoURL ||
    data.coverUrl ||
    data.coverImage;
  if (typeof candidate === 'string' && candidate.trim()) {
    const val = candidate.trim();
    if (val !== 'null' && val !== 'undefined') return val;
  }
  return null;
}

/**
 * Reads user profile document from users/{uid}
 */
export async function getUserProfile(uid: string): Promise<SolvexaUser | null> {
  if (!uid || uid === 'user_anonymous' || uid.startsWith('guest_')) return null;

  try {
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);
    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    const photoURL = extractAvatar(data);
    const coverPhotoURL = extractCover(data);

    return {
      ...data,
      uid: snapshot.id,
      displayName: data.displayName || 'Solvexa Pioneer',
      username: data.username || `user_${snapshot.id.slice(0, 5)}`,
      photoURL,
      avatarUrl: photoURL,
      avatar: photoURL,
      profileImage: photoURL,
      coverPhotoURL,
    } as unknown as SolvexaUser;
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
  if (!uid || uid === 'user_anonymous' || uid.startsWith('guest_')) return;

  try {
    const userRef = doc(db, 'users', uid);
    const rawUsername = (data.displayName || data.email?.split('@')[0] || `user_${uid.slice(0, 5)}`)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');
    const normalizedUsername = normalizeUsername(rawUsername);

    const defaultProfile: Partial<SolvexaUser> = {
      uid,
      displayName: data.displayName || 'Solvexa Pioneer',
      username: normalizedUsername,
      email: data.email || '',
      photoURL: data.photoURL || null,
      avatarUrl: data.photoURL || null,
      profileImage: data.photoURL || null,
      avatar: data.photoURL || null,
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

    try {
      const usernameRef = doc(db, 'usernames', normalizedUsername);
      await setDoc(usernameRef, { uid }, { merge: true });
    } catch {
      // Non-fatal if usernames index write is restricted
    }
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

  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser || currentAuthUser.uid !== uid) {
    throw new Error('You do not have permission to modify another user\'s profile.');
  }

  try {
    const userRef = doc(db, 'users', uid);

    const fullUpdates = { ...updates };
    if (updates.photoURL !== undefined) {
      (fullUpdates as any).avatarUrl = updates.photoURL;
      (fullUpdates as any).avatarURL = updates.photoURL;
      (fullUpdates as any).avatar = updates.photoURL;
      (fullUpdates as any).profileImage = updates.photoURL;
    }
    if (updates.coverPhotoURL !== undefined) {
      (fullUpdates as any).coverUrl = updates.coverPhotoURL;
      (fullUpdates as any).coverImage = updates.coverPhotoURL;
    }

    const sanitizedUpdates = sanitizeForFirestore({
      ...fullUpdates,
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

/**
 * Finds user by username:
 * 1. usernames/{normalized} doc mapping
 * 2. users collection query where username == normalized
 * 3. users scan for case-insensitive match
 */
export async function getUserByUsername(username: string): Promise<SolvexaUser | null> {
  if (!username) return null;
  const clean = username.trim().replace(/^@/, '');
  const normalized = normalizeUsername(clean);

  try {
    // 1. usernames index document
    const usernameRef = doc(db, 'usernames', normalized);
    const usernameDoc = await getDoc(usernameRef);
    if (usernameDoc.exists()) {
      const uid = usernameDoc.data()?.uid;
      if (uid) {
        const p = await getUserProfile(uid);
        if (p) return p;
      }
    }

    // 2. Direct query on users collection where username == normalized
    const q = query(collection(db, 'users'), where('username', '==', normalized), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      const data = docSnap.data();
      const photoURL = extractAvatar(data);
      const coverPhotoURL = extractCover(data);
      return {
        ...data,
        uid: docSnap.id,
        displayName: data.displayName || 'Solvexa Pioneer',
        username: data.username || normalized,
        photoURL,
        avatarUrl: photoURL,
        avatar: photoURL,
        profileImage: photoURL,
        coverPhotoURL,
      } as unknown as SolvexaUser;
    }

    // 3. Fallback scan of recent users for case-insensitive match
    const qRecent = query(collection(db, 'users'), limit(50));
    const snapRecent = await getDocs(qRecent);
    for (const docSnap of snapRecent.docs) {
      const data = docSnap.data();
      if (
        data.username?.toLowerCase() === clean.toLowerCase() ||
        data.username?.toLowerCase() === normalized.toLowerCase()
      ) {
        const photoURL = extractAvatar(data);
        const coverPhotoURL = extractCover(data);
        return {
          ...data,
          uid: docSnap.id,
          displayName: data.displayName || 'Solvexa Pioneer',
          username: data.username || normalized,
          photoURL,
          avatarUrl: photoURL,
          avatar: photoURL,
          profileImage: photoURL,
          coverPhotoURL,
        } as unknown as SolvexaUser;
      }
    }

    return null;
  } catch (err) {
    console.warn('[profileService] getUserByUsername notice:', err);
    return null;
  }
}

/**
 * Searches real registered Firestore users by username, displayName, or email.
 * Strips '@' symbol, performs case-insensitive matching, and deduplicates by user.uid.
 */
export async function searchUsersInFirestore(rawQuery: string): Promise<SolvexaUser[]> {
  const clean = rawQuery.trim().replace(/^@/, '').toLowerCase();
  if (!clean) return [];

  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const userMap = new Map<string, SolvexaUser>();

  const addUser = (data: any, id: string) => {
    if (!id || id.startsWith('guest_') || id.startsWith('user_anonymous')) return;
    const photoURL = extractAvatar(data);
    const coverPhotoURL = extractCover(data);

    userMap.set(id, {
      ...data,
      uid: id,
      displayName: data.displayName || 'Solvexa Pioneer',
      username: data.username || `user_${id.slice(0, 5)}`,
      email: data.email || '',
      photoURL,
      avatarUrl: photoURL,
      avatar: photoURL,
      profileImage: photoURL,
      coverPhotoURL,
      followerCount: data.followerCount || 0,
      followingCount: data.followingCount || 0,
      signalCount: data.signalCount || 0,
      spaceCount: data.spaceCount || 0,
      bio: data.bio || '',
      location: data.location || '',
      website: data.website || '',
    } as unknown as SolvexaUser);
  };

  try {
    // 1. Direct match by username in usernames or users collection
    const exactUser = await getUserByUsername(clean);
    if (exactUser) {
      userMap.set(exactUser.uid, exactUser);
    }

    // 2. Prefix query on username in users collection
    try {
      const qPrefix = query(
        collection(db, 'users'),
        where('username', '>=', clean),
        where('username', '<=', clean + '\uf8ff'),
        limit(25)
      );
      const prefixSnap = await getDocs(qPrefix);
      prefixSnap.forEach((docSnap) => {
        addUser(docSnap.data(), docSnap.id);
      });
    } catch (prefixErr) {
      console.warn('[profileService] searchUsers prefix query notice:', prefixErr);
    }

    // 3. Scan recent active users in users collection to support fuzzy/substring matching across displayName, username, and email
    try {
      const qAll = query(collection(db, 'users'), limit(100));
      const allSnap = await getDocs(qAll);
      allSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const uName = (data.username || '').toLowerCase();
        const dName = (data.displayName || '').toLowerCase();
        const email = (data.email || '').toLowerCase();

        if (
          uName.includes(clean) ||
          dName.includes(clean) ||
          email.includes(clean)
        ) {
          addUser(data, docSnap.id);
        }
      });
    } catch (allErr) {
      console.warn('[profileService] searchUsers general query notice:', allErr);
    }

    return Array.from(userMap.values());
  } catch (error) {
    console.error('[profileService] searchUsersInFirestore error:', error);
    return Array.from(userMap.values());
  }
}

/**
 * Fetches recent/active real users from Firestore for the default Explore view.
 */
export async function getRecentUsersFromFirestore(maxCount: number = 20): Promise<SolvexaUser[]> {
  try {
    const q = query(collection(db, 'users'), limit(maxCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const photoURL = extractAvatar(data);
      const coverPhotoURL = extractCover(data);

      return {
        ...data,
        uid: docSnap.id,
        displayName: data.displayName || 'Solvexa Pioneer',
        username: data.username || `user_${docSnap.id.slice(0, 5)}`,
        email: data.email || '',
        photoURL,
        avatarUrl: photoURL,
        avatar: photoURL,
        profileImage: photoURL,
        coverPhotoURL,
        followerCount: data.followerCount || 0,
        followingCount: data.followingCount || 0,
        signalCount: data.signalCount || 0,
        spaceCount: data.spaceCount || 0,
        bio: data.bio || '',
      } as unknown as SolvexaUser;
    });
  } catch (err) {
    console.warn('[profileService] getRecentUsersFromFirestore notice:', err);
    return [];
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
