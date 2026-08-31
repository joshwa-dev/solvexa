import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import type { SolvexaUser } from '../../types/user.types';

const FOLLOWS_COLLECTION = 'follows';
const USERS_COLLECTION = 'users';

export function getFollowDocId(followerId: string, followingId: string): string {
  return `${followerId}_${followingId}`;
}

/**
 * Checks if followerId is currently following followingId in Firestore
 */
export async function isUserFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (!followerId || !followingId || followerId === followingId) return false;

  try {
    const followRef = doc(db, FOLLOWS_COLLECTION, getFollowDocId(followerId, followingId));
    const snap = await getDoc(followRef);
    return snap.exists();
  } catch (err) {
    console.warn('[followService] isUserFollowing error:', err);
    return false;
  }
}

/**
 * Follows a user in Firestore idempotently, updating follow relationship and count metrics
 */
export async function followUser(
  followerId: string,
  followingId: string
): Promise<{ success: boolean }> {
  const currentAuth = auth.currentUser;
  if (!currentAuth || currentAuth.uid !== followerId) {
    throw new Error('Authentication required to follow.');
  }
  if (!followerId || !followingId || followerId === followingId) {
    throw new Error('Invalid follow relationship parameters.');
  }

  const followId = getFollowDocId(followerId, followingId);
  const followRef = doc(db, FOLLOWS_COLLECTION, followId);
  const followerUserRef = doc(db, USERS_COLLECTION, followerId);
  const followingUserRef = doc(db, USERS_COLLECTION, followingId);

  // Check if relationship already exists to prevent duplicate increments
  const existingSnap = await getDoc(followRef).catch(() => null);
  if (existingSnap && existingSnap.exists()) {
    return { success: true };
  }

  const now = new Date().toISOString();

  // Create relationship document
  await setDoc(followRef, {
    followerId,
    followingId,
    createdAt: now,
  });

  // Best-effort atomic increments for count metrics
  await Promise.all([
    updateDoc(followerUserRef, {
      followingCount: increment(1),
      updatedAt: now,
    }).catch((err) => console.warn('[followService] Increment followingCount notice:', err)),
    updateDoc(followingUserRef, {
      followerCount: increment(1),
      updatedAt: now,
    }).catch((err) => console.warn('[followService] Increment followerCount notice:', err)),
  ]);

  return { success: true };
}

/**
 * Unfollows a user in Firestore, removing follow relationship and safely decrementing count metrics
 */
export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<{ success: boolean }> {
  const currentAuth = auth.currentUser;
  if (!currentAuth || currentAuth.uid !== followerId) {
    throw new Error('Authentication required to unfollow.');
  }
  if (!followerId || !followingId || followerId === followingId) {
    throw new Error('Invalid unfollow parameters.');
  }

  const followId = getFollowDocId(followerId, followingId);
  const followRef = doc(db, FOLLOWS_COLLECTION, followId);
  const followerUserRef = doc(db, USERS_COLLECTION, followerId);
  const followingUserRef = doc(db, USERS_COLLECTION, followingId);

  // Check if relationship exists before decrementing
  const existingSnap = await getDoc(followRef).catch(() => null);
  if (!existingSnap || !existingSnap.exists()) {
    return { success: true };
  }

  await deleteDoc(followRef);

  const now = new Date().toISOString();

  // Best-effort decrements
  await Promise.all([
    updateDoc(followerUserRef, {
      followingCount: increment(-1),
      updatedAt: now,
    }).catch((err) => console.warn('[followService] Decrement followingCount notice:', err)),
    updateDoc(followingUserRef, {
      followerCount: increment(-1),
      updatedAt: now,
    }).catch((err) => console.warn('[followService] Decrement followerCount notice:', err)),
  ]);

  return { success: true };
}

/**
 * Retrieves the list of user IDs that the specified user is following
 */
export async function getFollowingIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const q = query(collection(db, FOLLOWS_COLLECTION), where('followerId', '==', userId));
    const snap = await getDocs(q);
    const ids: string[] = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data.followingId) ids.push(data.followingId);
    });
    return ids;
  } catch (err) {
    console.warn('[followService] getFollowingIds error:', err);
    return [];
  }
}

/**
 * Retrieves the list of user IDs that follow the specified user
 */
export async function getFollowerIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const q = query(collection(db, FOLLOWS_COLLECTION), where('followingId', '==', userId));
    const snap = await getDocs(q);
    const ids: string[] = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data.followerId) ids.push(data.followerId);
    });
    return ids;
  } catch (err) {
    console.warn('[followService] getFollowerIds error:', err);
    return [];
  }
}

/**
 * Retrieves the full user profile list of followers for a given user
 */
export async function getFollowersWithProfiles(
  userId: string,
  currentViewerUid?: string
): Promise<SolvexaUser[]> {
  if (!userId) return [];
  const followerIds = await getFollowerIds(userId);
  if (followerIds.length === 0) return [];

  const profiles: SolvexaUser[] = [];
  const followingSet = currentViewerUid
    ? new Set(await getFollowingIds(currentViewerUid))
    : new Set<string>();

  await Promise.all(
    followerIds.map(async (fId) => {
      try {
        const uDoc = await getDoc(doc(db, USERS_COLLECTION, fId));
        if (uDoc.exists()) {
          const uData = uDoc.data() as SolvexaUser;
          profiles.push({
            ...uData,
            uid: fId,
            isFollowing: followingSet.has(fId),
          });
        }
      } catch (err) {
        console.warn(`[followService] Error loading follower profile ${fId}:`, err);
      }
    })
  );

  return profiles;
}

/**
 * Retrieves the full user profile list of accounts that the specified user is following
 */
export async function getFollowingWithProfiles(
  userId: string,
  currentViewerUid?: string
): Promise<SolvexaUser[]> {
  if (!userId) return [];
  const followingIds = await getFollowingIds(userId);
  if (followingIds.length === 0) return [];

  const profiles: SolvexaUser[] = [];
  const viewerFollowingSet = currentViewerUid
    ? new Set(await getFollowingIds(currentViewerUid))
    : new Set<string>();

  await Promise.all(
    followingIds.map(async (fId) => {
      try {
        const uDoc = await getDoc(doc(db, USERS_COLLECTION, fId));
        if (uDoc.exists()) {
          const uData = uDoc.data() as SolvexaUser;
          profiles.push({
            ...uData,
            uid: fId,
            isFollowing: viewerFollowingSet.has(fId),
          });
        }
      } catch (err) {
        console.warn(`[followService] Error loading following profile ${fId}:`, err);
      }
    })
  );

  return profiles;
}
