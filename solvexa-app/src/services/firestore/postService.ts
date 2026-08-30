import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import type { Post } from '../../types/post.types';
import { mapFirestoreError } from '../../lib/errors';

import { sanitizeForFirestore } from '../../lib/firestoreUtils';

const POSTS_COLLECTION = 'posts';

/**
 * Creates a new post in Firestore under posts/{postId}
 * Enforces authorId === auth.currentUser.uid and sanitizes against undefined fields
 */
export async function createPostInFirestore(post: Post): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required to create a post.');
  }

  try {
    const postRef = doc(db, POSTS_COLLECTION, post.postId);
    const rawData = {
      ...post,
      authorId: currentUser.uid,
      authorName: post.authorName || currentUser.displayName || 'Solvexa Pioneer',
      authorUsername: post.authorUsername || currentUser.displayName?.toLowerCase().replace(/\s+/g, '_') || 'pioneer',
      authorAvatar: post.authorAvatar || currentUser.photoURL || null,
      createdAt: post.createdAt || new Date().toISOString(),
      updatedAt: serverTimestamp(),
    };

    const sanitizedData = sanitizeForFirestore(rawData);
    await setDoc(postRef, sanitizedData);
  } catch (error: unknown) {
    console.error('[postService] createPost error:', error);
    const firestoreError = error as { code?: string; message?: string };
    throw new Error(mapFirestoreError(firestoreError));
  }
}

/**
 * Fetches recent posts from Firestore
 */
export async function getPostsFromFirestore(maxCount: number = 50): Promise<Post[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return [];
  }

  try {
    const q = query(
      collection(db, POSTS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(maxCount)
    );

    const snapshot = await getDocs(q);
    const posts: Post[] = [];

    snapshot.forEach((docSnap) => {
      posts.push(docSnap.data() as Post);
    });

    return posts;
  } catch (error: unknown) {
    console.warn('[postService] getPosts warning:', error);
    return [];
  }
}

/**
 * Updates an existing post in Firestore
 * Enforces that only the author can update their post content
 */
export async function updatePostInFirestore(
  postId: string,
  updates: Partial<Post>
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required to update a post.');
  }

  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const snapshot = await getDoc(postRef);

    if (!snapshot.exists()) {
      throw new Error('Post does not exist.');
    }

    const postData = snapshot.data() as Post;
    if (postData.authorId !== currentUser.uid) {
      throw new Error('You do not have permission to edit this post.');
    }

    const sanitizedUpdates = sanitizeForFirestore({
      ...updates,
      updatedAt: serverTimestamp(),
    });

    await updateDoc(postRef, sanitizedUpdates);
  } catch (error: unknown) {
    console.error('[postService] updatePost error:', error);
    const firestoreError = error as { code?: string; message?: string };
    throw new Error(mapFirestoreError(firestoreError));
  }
}

/**
 * Deletes a post from Firestore
 * Enforces that only the author can delete their post
 */
export async function deletePostInFirestore(postId: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required to delete a post.');
  }

  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const snapshot = await getDoc(postRef);

    if (snapshot.exists()) {
      const postData = snapshot.data() as Post;
      if (postData.authorId !== currentUser.uid) {
        throw new Error('You do not have permission to delete this post.');
      }
    }

    await deleteDoc(postRef);
  } catch (error: unknown) {
    console.error('[postService] deletePost error:', error);
    const firestoreError = error as { code?: string; message?: string };
    throw new Error(mapFirestoreError(firestoreError));
  }
}
