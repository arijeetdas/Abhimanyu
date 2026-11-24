import { AuthError } from './types';

const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'That email and password do not match an account',
  'auth/wrong-password': 'That email and password do not match an account',
  'auth/user-not-found': 'That email and password do not match an account',
  'auth/invalid-email': 'Enter a valid email address',
  'auth/email-already-in-use': 'An account with this email already exists. Log in instead',
  'auth/weak-password': 'Choose a stronger password: at least 8 characters with letters and numbers',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes, or reset your password',
  'auth/network-request-failed': 'Could not reach the server. Check your connection and try again',
  'auth/user-disabled': 'This account has been disabled. Contact the team',
  'auth/operation-not-allowed': 'Email sign-in is not enabled for this Firebase project yet',
  'auth/missing-password': 'Enter your password',
  'auth/configuration-not-found': 'Firebase Authentication is not set up for this project yet',
  'auth/invalid-api-key': 'The Firebase API key is not valid. Check frontend/.env.local',
};

export function friendlyAuthError(e: unknown): string {
  const code = e instanceof AuthError ? e.code : (e as { code?: string })?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  if (e instanceof AuthError) return e.message;
  return 'Something went wrong. Please try again';
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/** Password policy: 8+ characters, at least one letter and one number. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return 'Use at least 8 characters';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Use both letters and numbers';
  return null;
}

/** 0 to 3: weak, fair, good, strong. */
export function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  if (passwordProblem(pw)) return Math.min(score, 1) as 0 | 1;
  return Math.min(3, Math.max(1, score - 1)) as 1 | 2 | 3;
}
