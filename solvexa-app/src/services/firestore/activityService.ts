import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';

export type ActivityEventType =
  | 'login'
  | 'logout'
  | 'post_created'
  | 'signal_created'
  | 'story_created'
  | 'message_sent'
  | 'reaction'
  | 'follow'
  | 'unfollow'
  | 'saved_post'
  | 'profile_updated'
  | 'view_signal'
  | 'open_nexus'
  | 'open_signal_map';

export interface ActivityEvent {
  id: string;
  userId: string;
  type: ActivityEventType;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ActivityStats {
  todayActiveMinutes: number;
  totalSignals: number;
  totalPosts: number;
  totalMessages: number;
  totalReactions: number;
  peakHourRange: string | null;
  weeklyEngagement: { day: string; count: number; heightPercent: number }[];
  hasSufficientData: boolean;
}

const ACTIVITY_COLLECTION = 'activity';

/**
 * Logs an authentic user activity event to Firestore and local telemetry cache
 */
export async function logActivityEvent(
  type: ActivityEventType,
  metadata?: Record<string, any>
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  try {
    const eventId = `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const event: ActivityEvent = {
      id: eventId,
      userId: currentUser.uid,
      type,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
    };

    // Store in localStorage local buffer
    try {
      const stored = JSON.parse(localStorage.getItem('solvexa_activity_events') || '[]');
      stored.unshift(event);
      localStorage.setItem('solvexa_activity_events', JSON.stringify(stored.slice(0, 100)));
    } catch {
      // ignore
    }

    // Persist to Firestore
    const actRef = doc(db, ACTIVITY_COLLECTION, eventId);
    await setDoc(actRef, {
      ...event,
      createdAt: serverTimestamp(),
    });
  } catch {
    // Non-blocking telemetry
  }
}

/**
 * Computes authentic user activity statistics from Firestore and local buffer
 */
export async function getUserActivityStats(uid: string): Promise<ActivityStats> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== uid) {
    return {
      todayActiveMinutes: 0,
      totalSignals: 0,
      totalPosts: 0,
      totalMessages: 0,
      totalReactions: 0,
      peakHourRange: null,
      weeklyEngagement: [],
      hasSufficientData: false,
    };
  }

  let events: ActivityEvent[] = [];

  try {
    const q = query(
      collection(db, ACTIVITY_COLLECTION),
      where('userId', '==', uid),
      orderBy('timestamp', 'desc'),
      limit(200)
    );
    const snapshot = await getDocs(q);
    snapshot.forEach((docSnap) => {
      events.push(docSnap.data() as ActivityEvent);
    });
  } catch {
    // Fall back to local buffer if offline/indexing
    try {
      events = JSON.parse(localStorage.getItem('solvexa_activity_events') || '[]');
    } catch {
      events = [];
    }
  }

  if (events.length === 0) {
    try {
      events = JSON.parse(localStorage.getItem('solvexa_activity_events') || '[]');
    } catch {
      events = [];
    }
  }

  if (events.length === 0) {
    return {
      todayActiveMinutes: 0,
      totalSignals: 0,
      totalPosts: 0,
      totalMessages: 0,
      totalReactions: 0,
      peakHourRange: null,
      weeklyEngagement: [],
      hasSufficientData: false,
    };
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  let todayEventsCount = 0;
  let totalSignals = 0;
  let totalPosts = 0;
  let totalMessages = 0;
  let totalReactions = 0;

  const hourCounts: Record<number, number> = {};
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayCounts: Record<string, number> = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  };

  events.forEach((ev) => {
    const evDate = new Date(ev.timestamp);
    const evTime = evDate.getTime();

    if (evTime >= startOfToday) {
      todayEventsCount += 1;
    }

    if (ev.type === 'signal_created') totalSignals += 1;
    if (ev.type === 'post_created') totalPosts += 1;
    if (ev.type === 'message_sent') totalMessages += 1;
    if (ev.type === 'reaction') totalReactions += 1;

    const hour = evDate.getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;

    const dayName = dayNames[evDate.getDay()];
    if (dayCounts[dayName] !== undefined) {
      dayCounts[dayName] += 1;
    }
  });

  // Calculate realistic active time (each event represents ~2-3 mins engagement window)
  const todayActiveMinutes = Math.min(240, Math.max(5, todayEventsCount * 3));

  // Determine Peak Window
  let peakHour = 20; // default 8pm
  let maxHourCount = 0;
  Object.entries(hourCounts).forEach(([h, count]) => {
    if (count > maxHourCount) {
      maxHourCount = count;
      peakHour = parseInt(h, 10);
    }
  });

  const peakStartHour = peakHour % 12 || 12;
  const peakEndHour = (peakHour + 2) % 12 || 12;
  const ampm = peakHour >= 12 ? 'PM' : 'AM';
  const peakHourRange = `${peakStartHour}:00 ${ampm} – ${peakEndHour}:00 ${ampm}`;

  // Build weekly distribution
  const maxDayCount = Math.max(1, ...Object.values(dayCounts));
  const weeklyEngagement = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
    day,
    count: dayCounts[day] || 0,
    heightPercent: Math.max(12, Math.round(((dayCounts[day] || 0) / maxDayCount) * 100)),
  }));

  return {
    todayActiveMinutes,
    totalSignals,
    totalPosts,
    totalMessages,
    totalReactions,
    peakHourRange,
    weeklyEngagement,
    hasSufficientData: events.length >= 3,
  };
}
