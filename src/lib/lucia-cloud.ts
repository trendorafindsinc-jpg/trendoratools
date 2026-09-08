import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';

/** Same product id used by live sync (lucia-cloud-sync). */
const PRODUCT_ID = 'trendora-tools';

function mapCloudError(error: unknown): Error {
  if (!(error instanceof Error) && typeof error !== 'object') {
    return new Error('Cloud operation failed. Please try again.');
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

  if (code === 'permission-denied' || /permission/i.test(raw)) {
    return new Error(
      'Cloud permission denied. Deploy the latest firestore.rules from this repo to your Firebase project (Firebase Console → Firestore → Rules, or firebase deploy --only firestore:rules).'
    );
  }
  if (code === 'unavailable' || code === 'deadline-exceeded') {
    return new Error('Lucia Cloud is temporarily unavailable. Check your connection and try again.');
  }
  if (raw) return new Error(raw);
  return new Error('Cloud operation failed. Please try again.');
}

export async function backupTrendoraToLuciaCloud(data: string) {
  if (!isFirebaseConfigured || !auth?.currentUser || !db) {
    throw new Error('Sign in with your LUCIA ID before using Lucia Cloud.');
  }
  try {
    const uid = auth.currentUser.uid;
    const ref = doc(db, 'users', uid, 'products', PRODUCT_ID);
    await setDoc(
      ref,
      {
        product: PRODUCT_ID,
        cloudSync: { enabled: true, lastSyncedAt: serverTimestamp() },
        backup: {
          app: 'trendora-tools',
          version: 1,
          data,
          updatedAt: serverTimestamp()
        }
      },
      { merge: true }
    );
  } catch (error) {
    throw mapCloudError(error);
  }
}

export async function restoreTrendoraFromLuciaCloud() {
  if (!isFirebaseConfigured || !auth?.currentUser || !db) {
    throw new Error('Sign in with your LUCIA ID before using Lucia Cloud.');
  }
  try {
    const uid = auth.currentUser.uid;
    const ref = doc(db, 'users', uid, 'products', PRODUCT_ID);
    const snapshot = await getDoc(ref);
    let data = snapshot.data()?.backup?.data as string | undefined;

    // Legacy path used product id "trendora"
    if (typeof data !== 'string') {
      const legacy = await getDoc(doc(db, 'users', uid, 'products', 'trendora'));
      data = legacy.data()?.backup?.data as string | undefined;
    }

    if (typeof data !== 'string' || !data.trim()) {
      throw new Error('No Trendora Tools backup was found in Lucia Cloud. Back up once from this device first.');
    }
    return data;
  } catch (error) {
    if (error instanceof Error && error.message.includes('No Trendora Tools backup')) throw error;
    throw mapCloudError(error);
  }
}
