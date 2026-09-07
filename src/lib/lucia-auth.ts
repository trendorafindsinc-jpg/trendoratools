import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type User
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from './firebase';

export type LuciaIdentity = {
  luciaId: string;
  email: string;
  emailVerified: boolean;
  createdAt?: unknown;
  lastLoginAt?: unknown;
};

function requireAuth() {
  if (!auth || !db || !isFirebaseConfigured) {
    throw new Error(
      'LUCIA ID is not configured on this deployment. Add the VITE_FIREBASE_* environment variables (same project as the LUCIA site), then redeploy.'
    );
  }
  return { auth, db };
}

/** Map Firebase Auth error codes to readable messages. */
export function mapAuthError(error: unknown): Error {
  if (!(error instanceof Error) && typeof error !== 'object') {
    return new Error('Something went wrong. Please try again.');
  }
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: string }).code || '')
      : '';
  const raw =
    error instanceof Error
      ? error.message
      : error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: string }).message || '')
        : '';

  switch (code) {
    case 'auth/popup-blocked':
      return new Error('The sign-in popup was blocked. Allow popups for this site, or try again — we will use a full-page redirect.');
    case 'auth/popup-closed-by-user':
      return new Error('Google sign-in was closed before finishing. Try again.');
    case 'auth/cancelled-popup-request':
      return new Error('Another sign-in is already in progress. Wait a moment and try again.');
    case 'auth/unauthorized-domain':
      return new Error(
        'This website domain is not authorized in Firebase Authentication. Add it under Authentication → Settings → Authorized domains.'
      );
    case 'auth/operation-not-allowed':
      return new Error(
        'Google sign-in is not enabled for this Firebase project. Enable the Google provider under Authentication → Sign-in method.'
      );
    case 'auth/account-exists-with-different-credential':
      return new Error('An account already exists with this email using a different sign-in method. Sign in with email/password, or use the original provider.');
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return new Error('Email or password is incorrect.');
    case 'auth/email-already-in-use':
      return new Error('That email already has a LUCIA ID. Sign in instead, or reset your password.');
    case 'auth/weak-password':
      return new Error('Password is too weak. Use at least 6 characters.');
    case 'auth/too-many-requests':
      return new Error('Too many attempts. Wait a few minutes and try again.');
    case 'auth/network-request-failed':
      return new Error('Network error. Check your connection and try again.');
    case 'auth/configuration-not-found':
      return new Error('Firebase Auth is not fully configured for this project. Check the Google provider and authorized domains.');
    default:
      if (raw.includes('not configured')) return new Error(raw);
      return new Error(raw || 'Something went wrong. Please try again.');
  }
}

function makeLuciaId(uid: string) {
  const compact = uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  return `LUCIA-${compact.padEnd(8, '0')}`;
}

export async function ensureLuciaIdentity(user: User, profile?: { firstName?: string; lastName?: string }) {
  const { db } = requireAuth();
  const ref = doc(db, 'users', user.uid);
  const existing = await getDoc(ref);
  const existingData = existing.data();
  const luciaId = existingData?.id || existingData?.identity?.luciaId || makeLuciaId(user.uid);
  const displayName = user.displayName || [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'LUCIA User';

  await setDoc(
    ref,
    {
      id: luciaId,
      firebaseUid: user.uid,
      displayName,
      email: user.email || '',
      photoURL: user.photoURL || existingData?.photoURL || '',
      emailVerified: user.emailVerified,
      accountStatus: existingData?.accountStatus || 'active',
      updatedAt: serverTimestamp(),
      identity: {
        luciaId,
        email: user.email || '',
        emailVerified: user.emailVerified,
        lastLoginAt: serverTimestamp(),
        ...(existingData?.identity?.createdAt ? {} : { createdAt: serverTimestamp() })
      },
      profile: {
        ...(existingData?.profile || {}),
        displayName,
        ...(profile?.firstName ? { firstName: profile.firstName } : {}),
        ...(profile?.lastName ? { lastName: profile.lastName } : {}),
        photoURL: user.photoURL || existingData?.profile?.photoURL || ''
      },
      preferences: existingData?.preferences || { language: 'en', theme: 'system', notifications: true },
      privacy: existingData?.privacy || { profileVisibility: 'private', analytics: false, personalization: false },
      products: {
        ...(existingData?.products || {}),
        trendora: { ...(existingData?.products?.trendora || {}), enabled: true }
      }
    },
    { merge: true }
  );

  return { luciaId };
}

export async function createLuciaAccount(firstName: string, lastName: string, email: string, password: string) {
  try {
    const { auth } = requireAuth();
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (displayName) await updateProfile(credential.user, { displayName });
    await sendEmailVerification(credential.user);
    return ensureLuciaIdentity(credential.user, { firstName: firstName.trim(), lastName: lastName.trim() });
  } catch (error) {
    throw mapAuthError(error);
  }
}

export async function signInLucia(email: string, password: string) {
  try {
    const { auth } = requireAuth();
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return ensureLuciaIdentity(credential.user);
  } catch (error) {
    throw mapAuthError(error);
  }
}

/**
 * Google sign-in: try popup first (desktop), fall back to redirect when popups are blocked
 * or unsupported (common on mobile / in-app browsers / strict COOP).
 */
export async function signInWithGoogle(): Promise<{ luciaId: string } | void> {
  const { auth } = requireAuth();
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    return ensureLuciaIdentity(credential.user);
  } catch (error: unknown) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code?: string }).code || '')
        : '';

    const shouldRedirect =
      code === 'auth/popup-blocked' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/operation-not-supported-in-this-environment' ||
      code === 'auth/popup-closed-by-user';

    // popup-closed-by-user: user dismissed — don't force redirect
    if (code === 'auth/popup-closed-by-user') {
      throw mapAuthError(error);
    }

    if (shouldRedirect || code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      try {
        await signInWithRedirect(auth, googleProvider);
        // Navigation away; caller should not treat as failure
        return;
      } catch (redirectError) {
        throw mapAuthError(redirectError);
      }
    }

    throw mapAuthError(error);
  }
}

/** Call once on startup to finish Google redirect sign-in. */
export async function completeGoogleRedirectIfAny(): Promise<User | null> {
  if (!auth || !isFirebaseConfigured) return null;
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      await ensureLuciaIdentity(result.user);
      return result.user;
    }
  } catch (error) {
    // Surface via console; UI still gets auth state from onAuthStateChanged when possible
    console.warn('[lucia-auth] Google redirect result:', mapAuthError(error).message);
  }
  return null;
}

export async function resetLuciaPassword(email: string) {
  try {
    const { auth } = requireAuth();
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    throw mapAuthError(error);
  }
}

export async function signOutLucia() {
  if (auth) await signOut(auth);
}

export function subscribeToLuciaAuth(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, callback);
}

export { isFirebaseConfigured };
