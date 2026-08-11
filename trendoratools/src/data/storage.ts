export interface StorageAdapter {
  load(key: string): string | null;
  save(key: string, value: string): void;
  remove(key: string): void;
}

export class LocalStorageAdapter implements StorageAdapter {
 load(key: string): string | null {
   try {
     return window.localStorage.getItem(key);
   } catch {
     return null;
   }
 }

    save(key: string, value: string): void {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Storage may be unavailable or full. The app continues in memory.
      }
    }

    remove(key: string): void {

        try {
          window.localStorage.removeItem(key);
        } catch {
          // Ignore storage errors.
        }
    }
}

export class MemoryStorageAdapter implements StorageAdapter {
 private memory = new Map<string, string>();

    load(key: string): string | null {
      return this.memory.get(key) ?? null;
    }

    save(key: string, value: string): void {
      this.memory.set(key, value);
    }

    remove(key: string): void {
      this.memory.delete(key);
    }
}

export function createStorage(): StorageAdapter {
  try {
    const testKey = '__trendoratools_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return new LocalStorageAdapter();
  } catch {
    return new MemoryStorageAdapter();
  }
}
