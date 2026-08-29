import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
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
    throw new Error('Lucia ID is not configured yet. Add the Firebase environment variables to this deployment.');
  }
  return { auth, db };
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
  const luciaId = existingData?.identity?.luciaId || makeLuciaId(user.uid);
  const displayName = user.displayName || [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'LUCIA User';

  await setDoc(ref, {
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
    products: existingData?.products || { trendora: { enabled: true } }
  }, { merge: true });

  return { luciaId };
}

export async function createLuciaAccount(firstName: string, lastName: string, email: string, password: string) {
  const { auth } = requireAuth();
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
  if (displayName) await updateProfile(credential.user, { displayName });
  await sendEmailVerification(credential.user);
  return ensureLuciaIdentity(credential.user, { firstName: firstName.trim(), lastName: lastName.trim() });
}

export async function signInLucia(email: string, password: string) {
  const { auth } = requireAuth();
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return ensureLuciaIdentity(credential.user);
}

export async function signInWithGoogle() {
  const { auth } = requireAuth();
  const credential = await signInWithPopup(auth, googleProvider);
  return ensureLuciaIdentity(credential.user);
}

export async function resetLuciaPassword(email: string) {
  const { auth } = requireAuth();
  await sendPasswordResetEmail(auth, email.trim());
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
