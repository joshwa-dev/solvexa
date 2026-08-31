/**
 * firestoreUtils.ts
 *
 * Universal Firestore sanitization and safety utilities.
 * Ensures no `undefined` values ever reach Firestore SDK setDoc/updateDoc/addDoc methods.
 */

/**
 * Recursively removes all keys with `undefined` values from an object or array.
 * Preserves Date objects, FieldValues (serverTimestamp, arrayUnion, etc.), nulls, and primitives.
 */
export function sanitizeForFirestore<T = any>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === 'object' && item !== null ? sanitizeForFirestore(item) : item)) as unknown as T;
  }

  // Handle objects
  if (typeof data === 'object') {
    // Preserve Date and special Firestore FieldValues
    if (data instanceof Date) return data;
    if ((data as any).constructor && (data as any).constructor.name === 'FieldValue') return data;
    if ('_methodName' in (data as any)) return data; // Firestore sentinel

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value === undefined) {
        continue; // Strip undefined keys completely
      }
      if (value !== null && typeof value === 'object') {
        sanitized[key] = sanitizeForFirestore(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized as T;
  }

  return data;
}

/**
 * Safely parses any date representation (Firebase Timestamp, seconds/nanoseconds object,
 * Date, ISO string, timestamp number) into a valid Date object.
 * Returns null if the value cannot be parsed into a valid Date.
 */
export function parseFirestoreDate(val: any): Date | null {
  if (!val) return null;
  try {
    // 1. Firebase Timestamp instance with toDate()
    if (typeof val.toDate === 'function') {
      const d = val.toDate();
      if (d instanceof Date && !isNaN(d.getTime())) return d;
    }
    // 2. Serialized Timestamp object { seconds, nanoseconds } or { _seconds, _nanoseconds }
    if (typeof val === 'object') {
      const sec = val.seconds ?? val._seconds;
      if (typeof sec === 'number') {
        const d = new Date(sec * 1000);
        if (!isNaN(d.getTime())) return d;
      }
    }
    // 3. Date instance
    if (val instanceof Date) {
      if (!isNaN(val.getTime())) return val;
      return null;
    }
    // 4. Timestamp number
    if (typeof val === 'number') {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d;
    }
    // 5. String (ISO or date string)
    if (typeof val === 'string') {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Formats a joined date safely for user profiles.
 * Never outputs "Invalid Date".
 * Example: "Joined August 2026" or "Joined recently" as fallback.
 */
export function formatJoinedDate(val: any): string {
  const d = parseFirestoreDate(val);
  if (!d) return 'Joined recently';
  try {
    const formatted = d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    if (!formatted || formatted.toLowerCase().includes('invalid')) {
      return 'Joined recently';
    }
    return `Joined ${formatted}`;
  } catch {
    return 'Joined recently';
  }
}

/**
 * Formats a Date or ISO timestamp string into a clean relative time string
 * e.g. "Just now", "2m", "15m", "1h", "Yesterday", "3d", "Aug 12"
 */
export function formatRelativeTime(dateOrIso: string | Date | number | any): string {
  if (!dateOrIso) return 'Just now';

  try {
    const parsedDate = parseFirestoreDate(dateOrIso);
    if (!parsedDate) return 'Just now';

    const timestamp = parsedDate.getTime();
    if (isNaN(timestamp)) return 'Just now';

    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${Math.max(1, diffMin)}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d`;

    return parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Just now';
  }
}
