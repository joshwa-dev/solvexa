import { auth, db } from './config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
// NOTE: Firebase Storage diagnostic intentionally removed.
// Project runs on Firebase Spark (free) plan — Storage is not available.
// Media uploads are handled by Cloudinary.

export interface FirebaseDiagnosticReport {
  projectId: string;
  authenticated: boolean;
  uid: string | null;
  email: string | null;
  profilePath: string | null;
  firestoreRead: 'PENDING' | 'SUCCESS' | 'PERMISSION_DENIED' | 'FAILED';
  firestoreWrite: 'PENDING' | 'SUCCESS' | 'PERMISSION_DENIED' | 'FAILED';
  errorDetails?: string;
}

/**
 * Runs a safe diagnostic check on Auth and Firestore only.
 * Firebase Storage is intentionally excluded (Spark free plan).
 */
export async function runFirebaseDiagnostic(): Promise<FirebaseDiagnosticReport> {
  const user = auth.currentUser;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'unknown';

  const report: FirebaseDiagnosticReport = {
    projectId,
    authenticated: !!user,
    uid: user?.uid || null,
    email: user?.email || null,
    profilePath: user ? `users/${user.uid}` : null,
    firestoreRead: 'PENDING',
    firestoreWrite: 'PENDING',
  };

  if (!user) {
    if (import.meta.env.DEV) {
      console.warn('[Firebase Diagnostic] User is not authenticated. Skipping database tests.');
    }
    return report;
  }

  // 1. Test Firestore Read
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await getDoc(userDocRef);
    report.firestoreRead = 'SUCCESS';
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code === 'permission-denied' || e.message?.includes('permissions')) {
      report.firestoreRead = 'PERMISSION_DENIED';
    } else {
      report.firestoreRead = 'FAILED';
    }
    report.errorDetails = e.message;
  }

  // 2. Test Firestore Write
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(
      userDocRef,
      {
        uid: user.uid,
        email: user.email || '',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    report.firestoreWrite = 'SUCCESS';
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code === 'permission-denied' || e.message?.includes('permissions')) {
      report.firestoreWrite = 'PERMISSION_DENIED';
    } else {
      report.firestoreWrite = 'FAILED';
    }
  }

  if (import.meta.env.DEV) {
    console.log('[Firebase Diagnostic Result]', {
      projectId: report.projectId,
      authenticated: report.authenticated,
      uid: report.uid,
      profilePath: report.profilePath,
      firestoreRead: report.firestoreRead,
      firestoreWrite: report.firestoreWrite,
    });
  }

  return report;
}


