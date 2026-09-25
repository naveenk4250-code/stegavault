// apps/web/src/lib/storage.ts
// Robust IndexedDB storage for StegaVault local files & stego carriers
// Bypasses the 5MB browser localStorage limit so multi-MB stego PNGs never get dropped!

const DB_NAME = 'stegavault_db';
const DB_VERSION = 1;
const STORE_NAME = 'vault_files';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbSaveUserFiles(email: string, files: any[]): Promise<void> {
  const safeId = (email || 'anonymous').toLowerCase().trim().replace(/[^a-z0-9_.-]/g, '_');
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(files, `files_${safeId}`);
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(undefined);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save note:', err);
  }

  // Also save lightweight metadata-only version to localStorage as instant fallback
  try {
    const lightweight = files.map((f) => {
      const copy = { ...f };
      delete copy.stegoDataUrl;
      delete copy.dataUrl;
      delete copy.encryptedBytesBase64;
      return copy;
    });
    localStorage.setItem(`stegavault_files_${safeId}`, JSON.stringify(lightweight));
  } catch {}
}

export async function idbLoadUserFiles(email: string): Promise<any[]> {
  const safeId = (email || 'anonymous').toLowerCase().trim().replace(/[^a-z0-9_.-]/g, '_');
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(`files_${safeId}`);
    const files = await new Promise<any[]>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    if (Array.isArray(files) && files.length > 0) {
      return files;
    }
  } catch (err) {
    console.warn('IndexedDB load note:', err);
  }

  // Fallback to localStorage metadata
  try {
    const stored = localStorage.getItem(`stegavault_files_${safeId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  return [];
}
