import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { mapFirebaseAuthError } from '../../lib/errors';

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export async function signInWithGoogle(): Promise<UserCredential | null> {
  try {
    if (isMobileDevice()) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    } else {
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    }
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    throw new Error(mapFirebaseAuthError(firebaseError));
  }
}

export async function getGoogleRedirectResult(): Promise<UserCredential | null> {
  try {
    const result = await getRedirectResult(auth);
    return result;
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    throw new Error(mapFirebaseAuthError(firebaseError));
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    return credential;
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    throw new Error(mapFirebaseAuthError(firebaseError));
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    throw new Error(mapFirebaseAuthError(firebaseError));
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    throw new Error(mapFirebaseAuthError(firebaseError));
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    throw new Error(mapFirebaseAuthError(firebaseError));
  }
}

export async function updateAuthProfile(
  user: User,
  updates: { displayName?: string; photoURL?: string }
): Promise<void> {
  try {
    await updateProfile(user, updates);
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    throw new Error(mapFirebaseAuthError(firebaseError));
  }
}

export async function changeUserPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('No active authenticated user session found.');
  }

  const isGoogleOnly =
    user.providerData.some((p) => p.providerId === 'google.com') &&
    !user.providerData.some((p) => p.providerId === 'password');

  if (isGoogleOnly) {
    throw new Error('This account uses Google sign-in. Password management is handled by Google.');
  }

  try {
    // 1. Re-authenticate user with current credentials
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // 2. Update to new password
    await updatePassword(user, newPassword);
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    throw new Error(mapFirebaseAuthError(firebaseError));
  }
}

export async function deleteCurrentUser(user: User): Promise<void> {
  try {
    await deleteUser(user);
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    throw new Error(mapFirebaseAuthError(firebaseError));
  }
}
