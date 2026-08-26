/**
 * Maps Firebase Auth errors to user-friendly messages
 */
export function mapFirebaseAuthError(error: { code?: string; message?: string }): string {
  switch (error?.code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account exists with this email address.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/requires-recent-login':
      return 'This action is sensitive and requires recent sign-in. Please log in again and retry.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before completing.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email address but different sign-in credentials.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes before trying again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Google Sign-In. Add localhost to Firebase Console.';
    case 'auth/operation-not-allowed':
      return 'This authentication method is currently not enabled in Firebase Console.';
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key':
    case 'auth/configuration-not-found':
      return 'Firebase Authentication is not properly configured. Check your environment variables.';
    default:
      return error?.message || 'An unexpected authentication error occurred. Please try again.';
  }
}

/**
 * Maps Firestore errors to user-friendly messages
 */
export function mapFirestoreError(error: { code?: string; message?: string }): string {
  switch (error?.code) {
    case 'permission-denied':
      return "Missing or insufficient permissions for this operation.";
    case 'not-found':
      return 'The requested resource was not found.';
    case 'already-exists':
      return 'This resource already exists.';
    case 'unavailable':
      return 'Database service temporarily unavailable. Please check your connection.';
    case 'resource-exhausted':
      return 'Quota exceeded. Please try again later.';
    case 'unauthenticated':
      return 'Authentication required. Please sign in again.';
    default:
      return error?.message || 'A database error occurred. Please try again.';
  }
}

/**
 * Maps Media Storage errors to user-friendly messages
 */
export function mapStorageError(error: { code?: string; message?: string }): string {
  switch (error?.code) {
    case 'storage/unauthorized':
      return 'You do not have permission to upload media.';
    case 'storage/canceled':
      return 'Upload was canceled.';
    case 'storage/unknown':
    default:
      return error?.message || 'A media upload error occurred. Please try again.';
  }
}
