/**
 * IndexedDB storage for the binary payloads (base64 `data:` URLs) that every
 * upload produces.
 *
 * These deliberately never go in localStorage. Its ~5MB origin quota is spent
 * by roughly two images once base64 inflates a file by a third, and once the
 * serialized state crosses that line every `setItem` throws — silently
 * dropping not just the upload but every later edit in the session, since the
 * whole state is rewritten as one blob. IndexedDB's quota is orders of
 * magnitude larger, so file payloads live here and localStorage keeps only the
 * light metadata plus a reference token per payload.
 */

const DB_NAME = "markyos-blobs";
const STORE_NAME = "blobs";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

/** Every stored payload, keyed by the token that stands in for it in localStorage. */
export async function readAllBlobs(): Promise<Map<string, string>> {
  const db = await openDb();
  return new Promise<Map<string, string>>((resolve, reject) => {
    const out = new Map<string, string>();
    const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) {
        resolve(out);
        return;
      }
      if (typeof cursor.value === "string") out.set(String(cursor.key), cursor.value);
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Writes `entries` and drops any stored payload whose key is absent from
 * `keep` — that garbage collection is what reclaims space when an asset is
 * deleted or replaced by a new version.
 */
export async function writeBlobs(entries: Map<string, string>, keep: Set<string>): Promise<void> {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (const [key, value] of entries) store.put(value, key);
    const cursorReq = store.openKeyCursor();
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (!cursor) return;
      if (!keep.has(String(cursor.key))) store.delete(cursor.key);
      cursor.continue();
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
