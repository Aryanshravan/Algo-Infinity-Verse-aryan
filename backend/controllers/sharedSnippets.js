import crypto from 'crypto';
import { initializeFirebase, COLLECTIONS } from '../../firebase.js';
import { Timestamp } from 'firebase-admin/firestore';

// ─── Shared DSA Insight store ────────────────────────────────────────────────
// Backs the "Share a DSA Insight" flow on the Code Playground: the editor
// toolbar encodes { language, title, code } into a short link (`/shared/:id`)
// that resolves back to a read-only snippet. Snippets expire after a TTL so a
// shared URL does not live forever.
//
// Persistence strategy (mirrors the battles backend):
//   - Firestore collection `shared_snippets` when Firebase is configured.
//   - Otherwise an in-memory Map. The in-memory store is process-local, so on
//     serverless hosts it only guarantees the snippet for the lifetime of the
//     cold instance — acceptable for the local-dev fallback, and the reason the
//     link embeds an id rather than the full payload.

const SHARED_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const ID_LENGTH = 8;

// URL-safe alphabet (lowercase + digits) — keeps ids short and copy-friendly.
const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const ID_ALPHABET_BITS = Math.floor(Math.log2(ID_ALPHABET.length));
const ID_CHAR_MASK = (1 << ID_ALPHABET_BITS) - 1;

const memoryStore = new Map(); // id -> { id, language, title, code, createdAt, expiresAt }

function randomShortId() {
  const randomBytes = crypto.randomBytes(ID_LENGTH * 2);
  let id = '';
  let cursor = 0;
  for (let i = 0; i < ID_LENGTH; i++) {
    let char;
    do {
      char = ID_ALPHABET[randomBytes[cursor++] & ID_CHAR_MASK];
    } while (char === undefined);
    id += char;
  }
  return id;
}

async function generateUniqueId() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = randomShortId();
    if (!memoryStore.has(candidate) && !(await idExistsInFirestore(candidate))) {
      return candidate;
    }
  }
  throw new Error('Failed to generate a unique shared id. Please try again.');
}

let db = null;
function firestoreDb() {
  if (db === null) {
    try {
      db = initializeFirebase();
    } catch {
      db = undefined;
    }
  }
  return db;
}

async function idExistsInFirestore(id) {
  const instance = firestoreDb();
  if (!instance) return false;
  try {
    const doc = await instance.collection(COLLECTIONS.SHARED_SNIPPETS).doc(id).get();
    return doc.exists;
  } catch {
    return false;
  }
}

function pruneMemoryStore() {
  const now = Date.now();
  for (const [id, snippet] of memoryStore) {
    if (snippet.expiresAt <= now) memoryStore.delete(id);
  }
}

/**
 * Create a shared snippet.
 * @param {{language?: string, title?: string, code: string}} payload
 * @param {number} [ttlMs]
 * @returns {Promise<{id: string, language: string, title: string, createdAt: number, expiresAt: number}>}
 */
export async function createSharedSnippet(payload, ttlMs = SHARED_TTL_MS) {
  const language = typeof payload.language === 'string' ? payload.language.slice(0, 40) : 'javascript';
  const title = typeof payload.title === 'string' ? payload.title.slice(0, 120) : '';
  const code = typeof payload.code === 'string' ? payload.code : '';

  if (!code.trim()) {
    throw new Error('Nothing to share — the editor is empty.');
  }

  const id = await generateUniqueId();
  const now = Date.now();
  const snippet = {
    id,
    language,
    title,
    code,
    createdAt: now,
    expiresAt: now + ttlMs,
  };

  memoryStore.set(id, snippet);
  pruneMemoryStore();

  const instance = firestoreDb();
  if (instance) {
    try {
      await instance
        .collection(COLLECTIONS.SHARED_SNIPPETS)
        .doc(id)
        .set({
          language,
          title,
          code,
          createdAt: Timestamp.fromMillis(snippet.createdAt),
          expiresAt: Timestamp.fromMillis(snippet.expiresAt),
        });
    } catch (err) {
      // Firestore write failure is not fatal — the in-memory copy still serves
      // this process. Log and continue.
      console.error('[shared] Firestore write failed:', err.message);
    }
  }

  return snippet;
}

/**
 * Fetch a shared snippet by id. Expired or unknown ids return null.
 * @param {string} id
 * @returns {Promise<{id: string, language: string, title: string, code: string, createdAt: number, expiresAt: number} | null>}
 */
export async function getSharedSnippet(id) {
  if (!id || typeof id !== 'string' || !/^[a-z0-9_-]{4,32}$/i.test(id)) return null;

  pruneMemoryStore();
  const cached = memoryStore.get(id);
  if (cached) {
    if (cached.expiresAt <= Date.now()) {
      memoryStore.delete(id);
      return null;
    }
    return cached;
  }

  const instance = firestoreDb();
  if (!instance) return null;

  try {
    const doc = await instance.collection(COLLECTIONS.SHARED_SNIPPETS).doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data();
    const expiresAtMs = data.expiresAt?.toMillis?.() ?? data.expiresAt ?? 0;

    if (expiresAtMs <= Date.now()) {
      await instance.collection(COLLECTIONS.SHARED_SNIPPETS).doc(id).delete();
      return null;
    }

    const snippet = {
      id,
      language: data.language || 'javascript',
      title: data.title || '',
      code: data.code || '',
      createdAt: data.createdAt?.toMillis?.() ?? data.createdAt ?? 0,
      expiresAt: expiresAtMs,
    };
    memoryStore.set(id, snippet);
    return snippet;
  } catch (err) {
    console.error('[shared] Firestore read failed:', err.message);
    return null;
  }
}

export function sharedSnippetUrl(id) {
  return `/shared/${encodeURIComponent(id)}`;
}

// Test helpers — allow a test to reset the in-memory store without touching
// Firestore. Firestore snippets are idempotent by id, so a fresh memory layer
// never returns stale data for the ids a test actually creates.
export function __resetSharedSnippetMemoryForTests() {
  memoryStore.clear();
}
