import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export async function backupTrendoraToLuciaCloud(data: string) {
  if (!auth?.currentUser || !db) throw new Error('Sign in with your LUCIA ID before using Lucia Cloud.');
  await setDoc(doc(db, 'users', auth.currentUser.uid, 'products', 'trendora'), {
    cloudSync: { enabled: true, lastSyncedAt: serverTimestamp() },
    backup: { app: 'trendora-tools', version: 1, data }
  }, { merge: true });
}

export async function restoreTrendoraFromLuciaCloud() {
  if (!auth?.currentUser || !db) throw new Error('Sign in with your LUCIA ID before using Lucia Cloud.');
  const snapshot = await getDoc(doc(db, 'users', auth.currentUser.uid, 'products', 'trendora'));
  const data = snapshot.data()?.backup?.data;
  if (typeof data !== 'string') throw new Error('No Trendora Tools backup was found in Lucia Cloud.');
  return data;
}
