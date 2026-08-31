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
import { rateLimiter } from '../security/rateLimiter';

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({ prompt: 'select_account' });

function isMobileDevice(): boolean {
  return typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export async function signInWithGoogle(): Promise<UserCredential | null> {
  const check = rateLimiter.check('login');
  if (!check.allowed) {
    throw new Error(`Too many login attempts. Please wait ${check.retryAfterSeconds} seconds.`);
  }

  try {
    // Attempt popup first (works smoothly on modern mobile Chrome/Safari and desktop without page reload)
    const result = await signInWithPopup(auth, googleProvider);
    rateLimiter.reset('login');
    return result;
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };

    // If popup was blocked by the browser or mobile restrictions, fall back to redirect
    if (
      firebaseError.code === 'auth/popup-blocked' ||
      (firebaseError.code === 'auth/cancelled-popup-request' && isMobileDevice())
    ) {
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectError) {
        const re = redirectError as { code?: string; message?: string };
        throw new Error(mapFirebaseAuthError(re));
      }
    }

    rateLimiter.recordAttempt('login');
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
  const check = rateLimiter.check('register');
  if (!check.allowed) {
    throw new Error(`Too many account registration attempts. Please wait ${check.retryAfterSeconds} seconds.`);
  }

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    rateLimiter.reset('register');
    return credential;
  } catch (error: unknown) {
    rateLimiter.recordAttempt('register');
    const firebaseError = error as { code?: string; message?: string };
    throw new Error(mapFirebaseAuthError(firebaseError));
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  const check = rateLimiter.check('login');
  if (!check.allowed) {
    throw new Error(`Too many sign-in attempts. Please wait ${check.retryAfterSeconds} seconds.`);
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    rateLimiter.reset('login');
    return cred;
  } catch (error: unknown) {
    rateLimiter.recordAttempt('login');
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
  const check = rateLimiter.check('password_reset');
  if (!check.allowed) {
    throw new Error(`Too many password reset requests. Please wait ${check.retryAfterSeconds} seconds.`);
  }

  try {
    await sendPasswordResetEmail(auth, email);
    rateLimiter.reset('password_reset');
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    // Neutral handling to prevent account enumeration
    if (firebaseError.code === 'auth/user-not-found') {
      return;
    }
    rateLimiter.recordAttempt('password_reset');
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
