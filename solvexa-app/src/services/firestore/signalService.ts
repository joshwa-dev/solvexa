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
import type { SignalVideo } from '../../types/signal.types';
import { mapFirestoreError } from '../../lib/errors';

const SIGNALS_COLLECTION = 'signals';

/**
 * Creates a new signal in Firestore under signals/{signalId}
 * Enforces authorId === auth.currentUser.uid
 */
export async function createSignalInFirestore(signal: SignalVideo): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required to upload a signal.');
  }

  try {
    const signalRef = doc(db, SIGNALS_COLLECTION, signal.id);
    const signalData = {
      ...signal,
      authorId: currentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(signalRef, signalData);
  } catch (error: unknown) {
    console.error('[signalService] createSignal error:', error);
    const firestoreError = error as { code?: string; message?: string };
    throw new Error(mapFirestoreError(firestoreError));
  }
}

/**
 * Fetches recent video signals from Firestore
 */
export async function getSignalsFromFirestore(maxCount: number = 30): Promise<SignalVideo[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return [];
  }

  try {
    const q = query(
      collection(db, SIGNALS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(maxCount)
    );

    const snapshot = await getDocs(q);
    const signals: SignalVideo[] = [];

    snapshot.forEach((docSnap) => {
      signals.push(docSnap.data() as SignalVideo);
    });

    return signals;
  } catch (error: unknown) {
    console.warn('[signalService] getSignals warning:', error);
    return [];
  }
}

/**
 * Updates an existing signal in Firestore
 * Enforces that only the author can update their signal
 */
export async function updateSignalInFirestore(
  signalId: string,
  updates: Partial<SignalVideo>
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required to update a signal.');
  }

  try {
    const signalRef = doc(db, SIGNALS_COLLECTION, signalId);
    const snapshot = await getDoc(signalRef);

    if (!snapshot.exists()) {
      throw new Error('Signal does not exist.');
    }

    const signalData = snapshot.data() as SignalVideo;
    if (signalData.authorId !== currentUser.uid) {
      throw new Error('You do not have permission to edit this signal.');
    }

    await updateDoc(signalRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error: unknown) {
    console.error('[signalService] updateSignal error:', error);
    const firestoreError = error as { code?: string; message?: string };
    throw new Error(mapFirestoreError(firestoreError));
  }
}

/**
 * Deletes a signal from Firestore
 * Enforces that only the author can delete their signal
 */
export async function deleteSignalInFirestore(signalId: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required to delete a signal.');
  }

  try {
    const signalRef = doc(db, SIGNALS_COLLECTION, signalId);
    const snapshot = await getDoc(signalRef);

    if (snapshot.exists()) {
      const signalData = snapshot.data() as SignalVideo;
      if (signalData.authorId !== currentUser.uid) {
        throw new Error('You do not have permission to delete this signal.');
      }
    }

    await deleteDoc(signalRef);
  } catch (error: unknown) {
    console.error('[signalService] deleteSignal error:', error);
    const firestoreError = error as { code?: string; message?: string };
    throw new Error(mapFirestoreError(firestoreError));
  }
}
