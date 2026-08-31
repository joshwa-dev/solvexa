/**
 * Solvexa Rate Limiter & Abuse Protection Utility
 * 
 * Provides client-side UX rate limiting and cooldown enforcement to prevent
 * accidental duplicate submissions, spamming, and credential stuffing.
 * 
 * NOTE: Server-side enforcement is handled by Firebase Authentication
 * (IP & account rate limiting) and Firestore Security Rules.
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  cooldownMs: number;
}

const ACTION_CONFIGS: Record<string, RateLimitConfig> = {
  login: { maxAttempts: 5, windowMs: 60000, cooldownMs: 30000 },
  register: { maxAttempts: 3, windowMs: 60000, cooldownMs: 60000 },
  password_reset: { maxAttempts: 3, windowMs: 120000, cooldownMs: 60000 },
  post_create: { maxAttempts: 5, windowMs: 30000, cooldownMs: 15000 },
  signal_create: { maxAttempts: 3, windowMs: 60000, cooldownMs: 30000 },
  message_send: { maxAttempts: 15, windowMs: 30000, cooldownMs: 10000 },
};

interface AttemptRecord {
  timestamps: number[];
  blockedUntil: number;
}

class RateLimiter {
  private records = new Map<string, AttemptRecord>();

  private getStorageKey(action: string): string {
    return `solvexa_rl_${action}`;
  }

  private getRecord(action: string): AttemptRecord {
    if (this.records.has(action)) {
      return this.records.get(action)!;
    }

    try {
      const stored = sessionStorage.getItem(this.getStorageKey(action));
      if (stored) {
        const parsed = JSON.parse(stored);
        this.records.set(action, parsed);
        return parsed;
      }
    } catch {
      // Session storage unavailable, proceed in-memory
    }

    const initial: AttemptRecord = { timestamps: [], blockedUntil: 0 };
    this.records.set(action, initial);
    return initial;
  }

  private saveRecord(action: string, record: AttemptRecord): void {
    this.records.set(action, record);
    try {
      sessionStorage.setItem(this.getStorageKey(action), JSON.stringify(record));
    } catch {
      // Ignore sessionStorage errors
    }
  }

  /**
   * Checks if an action is currently allowed.
   * Returns { allowed: true } or { allowed: false, retryAfterSeconds: number }
   */
  public check(action: string): { allowed: boolean; retryAfterSeconds: number } {
    const config = ACTION_CONFIGS[action] || { maxAttempts: 10, windowMs: 60000, cooldownMs: 30000 };
    const record = this.getRecord(action);
    const now = Date.now();

    // Check if under active cooldown
    if (record.blockedUntil > now) {
      const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      return { allowed: false, retryAfterSeconds };
    }

    // Filter timestamps within the rolling window
    const recentTimestamps = record.timestamps.filter((ts) => now - ts < config.windowMs);
    record.timestamps = recentTimestamps;

    if (recentTimestamps.length >= config.maxAttempts) {
      record.blockedUntil = now + config.cooldownMs;
      this.saveRecord(action, record);
      return { allowed: false, retryAfterSeconds: Math.ceil(config.cooldownMs / 1000) };
    }

    return { allowed: true, retryAfterSeconds: 0 };
  }

  /**
   * Records an attempt for the specified action.
   */
  public recordAttempt(action: string): void {
    const record = this.getRecord(action);
    const now = Date.now();
    record.timestamps.push(now);
    this.saveRecord(action, record);
  }

  /**
   * Resets rate limit for an action upon successful authentication.
   */
  public reset(action: string): void {
    this.records.delete(action);
    try {
      sessionStorage.removeItem(this.getStorageKey(action));
    } catch {
      // Ignore
    }
  }
}

export const rateLimiter = new RateLimiter();
