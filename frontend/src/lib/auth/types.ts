import type { UserProfile } from '@/lib/profile/types';

export type AuthMode = 'firebase' | 'demo';

export type AuthUser = {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: string | null;
};

export type RegisterInput = { name: string; email: string; password: string };

export interface AuthBackend {
  mode: AuthMode;
  subscribe(cb: (user: AuthUser | null) => void): () => void;
  signIn(email: string, password: string): Promise<AuthUser>;
  register(input: RegisterInput): Promise<AuthUser>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  sendVerification(): Promise<void>;
  reloadUser(): Promise<AuthUser | null>;
  /** Optional cloud copy of the profile (Firestore users/{uid}). */
  loadRemoteProfile?(uid: string): Promise<Partial<UserProfile> | null>;
  saveRemoteProfile?(uid: string, profile: UserProfile): Promise<void>;
}

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
