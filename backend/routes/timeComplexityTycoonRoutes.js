import fs from 'fs/promises';
import path from 'path';
import { getSession } from '../utils/sessionToken.js';

import { DATA_DIR } from '../utils/helpers.js';
import { API_ROUTES } from './routeConstants.js';

const TYCOON_FILE = path.join(DATA_DIR, 'time_complexity_tycoon_best.json');
const MAX_ENTRIES = 5000;

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(TYCOON_FILE);
  } catch {
    await fs.writeFile(TYCOON_FILE, '{}\n');
  }
}

async function readStore() {
  await ensureFile();
  const raw = await fs.readFile(TYCOON_FILE, 'utf8');
  const parsed = JSON.parse(raw || '{}');
  return parsed && typeof parsed === 'object' ? parsed : {};
}

async function writeStoreAtomic(store) {
  const tmp = `${TYCOON_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(store, null, 2)}\n`);
  await fs.rename(tmp, TYCOON_FILE);
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

export async function setupTimeComplexityTycoonRoutes(req, res, pathname) {
  if (!pathname.startsWith(API_ROUTES.TIME_COMPLEXITY_PREFIX)) return null;

  const session = getSession(req);
  if (!session) {
    return sendJson(res, 401, { error: 'Login required.' });
  }

  if (pathname === API_ROUTES.TIME_COMPLEXITY_BEST && req.method === 'GET') {
    try {
      const store = await readStore();
      const entry = store[session.sub] || null;
      return sendJson(res, 200, {
        success: true,
        bestScore: entry?.bestScore || 0,
        levelReached: entry?.levelReached || 1,
      });
    } catch (e) {
      return sendJson(res, 500, { error: 'Failed to fetch best score.' });
    }
  }

  if (pathname === API_ROUTES.TIME_COMPLEXITY_BEST && req.method === 'POST') {
    try {
      let payload = {};
      if (req.body && typeof req.body === 'object') payload = req.body;
      else {
        // Fallback for non-parsed body
        const chunks = [];
        for await (const ch of req) chunks.push(ch);
        const raw = Buffer.concat(chunks).toString('utf8');
        payload = raw ? JSON.parse(raw) : {};
      }

      const bestScore = Number(payload.bestScore) || 0;
      const levelReached = Number(payload.levelReached) || 1;

      if (bestScore < 0) return sendJson(res, 400, { error: 'bestScore must be >= 0' });

      const store = await readStore();
      const current = store[session.sub] || { bestScore: 0, levelReached: 1, updatedAt: null };

      if (bestScore > (current.bestScore || 0)) {
        store[session.sub] = {
          bestScore,
          levelReached,
          updatedAt: new Date().toISOString(),
        };
      }

      // cap store size (optional)
      const keys = Object.keys(store);
      if (keys.length > MAX_ENTRIES) {
        // remove oldest by updatedAt
        keys.sort(
          (a, b) => new Date(store[a]?.updatedAt || 0) - new Date(store[b]?.updatedAt || 0)
        );
        const toRemove = keys.slice(0, keys.length - MAX_ENTRIES);
        toRemove.forEach((k) => delete store[k]);
      }

      await writeStoreAtomic(store);
      return sendJson(res, 200, { success: true });
    } catch (e) {
      return sendJson(res, 500, { error: 'Failed to persist best score.' });
    }
  }

  return null;
}
