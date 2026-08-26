// Validation rules for Solvexa user inputs

export const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

export const RESERVED_USERNAMES = [
  'admin', 'administrator', 'solvexa', 'support', 'help', 'api',
  'official', 'moderator', 'mod', 'staff', 'team', 'root', 'system',
  'null', 'undefined', 'user', 'users', 'me', 'about', 'privacy',
  'terms', 'contact', 'pulse', 'explore', 'signals', 'moments',
  'spaces', 'nexus', 'messages', 'notifications', 'settings', 'create',
  'orbit', 'signal-map', 'saved', 'trending', 'discover',
];

export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username) {
    return { valid: false, error: 'Username is required.' };
  }
  const normalized = username.toLowerCase().trim();
  if (normalized.length < USERNAME_MIN_LENGTH) {
    return { valid: false, error: `Username must be at least ${USERNAME_MIN_LENGTH} characters.` };
  }
  if (normalized.length > USERNAME_MAX_LENGTH) {
    return { valid: false, error: `Username must be at most ${USERNAME_MAX_LENGTH} characters.` };
  }
  if (!USERNAME_REGEX.test(normalized)) {
    return { valid: false, error: 'Username may only contain lowercase letters, numbers, and underscores.' };
  }
  if (RESERVED_USERNAMES.includes(normalized)) {
    return { valid: false, error: 'This username is reserved. Please choose another.' };
  }
  return { valid: true };
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return { valid: false, error: 'Email is required.' };
  }
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Password is required.' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters.' };
  }
  if (!/[A-Z]/.test(password) && !/[0-9]/.test(password)) {
    return { valid: false, error: 'Password should include at least one number or uppercase letter.' };
  }
  return { valid: true };
}

export function validatePostContent(content: string): { valid: boolean; error?: string } {
  if (!content?.trim()) {
    return { valid: false, error: 'Post content cannot be empty.' };
  }
  if (content.length > 5000) {
    return { valid: false, error: 'Post is too long (max 5000 characters).' };
  }
  return { valid: true };
}

export function validateDisplayName(name: string): { valid: boolean; error?: string } {
  if (!name?.trim()) {
    return { valid: false, error: 'Display name is required.' };
  }
  if (name.length > 50) {
    return { valid: false, error: 'Display name must be 50 characters or less.' };
  }
  return { valid: true };
}

export function normalizeUsername(username: string): string {
  return username.toLowerCase().trim();
}
