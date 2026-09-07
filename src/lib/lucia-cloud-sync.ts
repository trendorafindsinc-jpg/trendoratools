import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { useAppStore } from '../store';

const PRODUCT_ID = 'trendora-tools';
const COLLECTIONS = [
  'expenses',
  'incomes',
  'budgets',
  'savingsGoals',
  'bills',
  'debts',
  'chat',
] as const;

type CloudCollection = (typeof COLLECTIONS)[number];

type SyncableRecord = { id: string; [key: string]: unknown };

type CloudState = {
  expenses: SyncableRecord[];
  incomes: SyncableRecord[];
  budgets: SyncableRecord[];
  savingsGoals: SyncableRecord[];
  bills: SyncableRecord[];
  debts: SyncableRecord[];
  chat: SyncableRecord[];
  customCategories: string[];
};

let activeUid: string | null = null;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncing = false;
let ready = false;
let lastSnapshot = '';

function requireDb() {
  if (!db) throw new Error('Lucia Cloud is not configured for this deployment.');
  return db;
}

function productRef(uid: string) {
  return doc(requireDb(), 'users', uid, 'products', PRODUCT_ID);
}

function recordsRef(uid: string, name: CloudCollection) {
  return collection(productRef(uid), name);
}

function readLocalState(): CloudState {
  const state = useAppStore.getState();
  return {
    expenses: state.expenses as unknown as SyncableRecord[],
    incomes: state.incomes as unknown as SyncableRecord[],
    budgets: state.budgets as unknown as SyncableRecord[],
    savingsGoals: state.savingsGoals as unknown as SyncableRecord[],
    bills: state.bills as unknown as SyncableRecord[],
    debts: state.debts as unknown as SyncableRecord[],
    chat: state.chat as unknown as SyncableRecord[],
    customCategories: state.customCategories,
  };
}

function mergeById(local: SyncableRecord[], cloud: SyncableRecord[]) {
  const merged = new Map(local.map((item) => [item.id, item]));
  for (const item of cloud) merged.set(item.id, item);
  return Array.from(merged.values());
}

async function loadCloudState(uid: string): Promise<Partial<CloudState>> {
  const result: Partial<CloudState> = {};

  await Promise.all(
    COLLECTIONS.map(async (name) => {
      const snapshot = await getDocs(recordsRef(uid, name));
      result[name] = snapshot.docs.map((item) => item.data() as SyncableRecord);
    }),
  );

  const meta = await getDocs(collection(productRef(uid), '_meta'));
  const categories = meta.docs.find((item) => item.id === 'profile')?.data()?.customCategories;
  if (Array.isArray(categories)) result.customCategories = categories.filter((item): item is string => typeof item === 'string');

  return result;
}

function applyCloudState(cloud: Partial<CloudState>) {
  const local = readLocalState();
  useAppStore.setState({
    expenses: mergeById(local.expenses, cloud.expenses || []) as never,
    incomes: mergeById(local.incomes, cloud.incomes || []) as never,
    budgets: mergeById(local.budgets, cloud.budgets || []) as never,
    savingsGoals: mergeById(local.savingsGoals, cloud.savingsGoals || []) as never,
    bills: mergeById(local.bills, cloud.bills || []) as never,
    debts: mergeById(local.debts, cloud.debts || []) as never,
    chat: mergeById(local.chat, cloud.chat || []) as never,
    customCategories: Array.from(new Set([...(local.customCategories || []), ...(cloud.customCategories || [])])),
  });
}

async function syncCollection(uid: string, name: CloudCollection, records: SyncableRecord[]) {
  const ref = recordsRef(uid, name);
  const remote = await getDocs(ref);
  const localIds = new Set(records.map((item) => item.id));
  const batch = writeBatch(requireDb());
  let operations = 0;

  for (const item of records) {
    const remoteItem = remote.docs.find((candidate) => candidate.id === item.id);
    const next = { ...item, _lucia: { product: PRODUCT_ID, updatedAt: serverTimestamp() } } as DocumentData;
    if (!remoteItem || JSON.stringify(remoteItem.data()) !== JSON.stringify(item)) {
      batch.set(doc(ref, item.id), next, { merge: true });
      operations += 1;
    }
  }

  for (const remoteItem of remote.docs) {
    if (!localIds.has(remoteItem.id)) {
      batch.delete(remoteItem.ref);
      operations += 1;
    }
  }

  if (operations > 0) await batch.commit();
}

async function syncNow() {
  if (!activeUid || !ready || syncing) return;
  syncing = true;
  try {
    const state = readLocalState();
    const snapshot = JSON.stringify(state);
    if (snapshot === lastSnapshot) return;

    await Promise.all(
      COLLECTIONS.map((name) => syncCollection(activeUid!, name, state[name])),
    );

    await setDoc(
      doc(collection(productRef(activeUid), '_meta'), 'profile'),
      {
        product: PRODUCT_ID,
        customCategories: state.customCategories,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    lastSnapshot = snapshot;
  } finally {
    syncing = false;
  }
}

export function scheduleLuciaCloudSync() {
  if (!activeUid || !ready) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void syncNow();
  }, 1200);
}

export async function startLuciaCloudSync(uid: string) {
  if (!db) return;
  activeUid = uid;
  ready = false;
  lastSnapshot = '';

  const cloud = await loadCloudState(uid);
  applyCloudState(cloud);
  ready = true;
  await syncNow();
}

export function stopLuciaCloudSync() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = null;
  activeUid = null;
  ready = false;
  syncing = false;
  lastSnapshot = '';
}

export function subscribeToLuciaCloudSync() {
  return useAppStore.subscribe(() => {
    scheduleLuciaCloudSync();
  });
}
