import { initializeFirebase } from './firebase.js';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { SESSION_COOKIE, verifySessionToken, parseCookies } from './backend/utils/sessionToken.js';
import { getSharedSnippet } from './backend/controllers/sharedSnippets.js';

// ─── Firebase init ────────────────────────────────────────────────────────────
const db = initializeFirebase();

function getDb() {
  // initializeFirebase() caches its instance internally, so re-invoking is
  // cheap and idempotent. This also covers the case where env vars are loaded
  // asynchronously AFTER this module is imported (server.js loads .env after
  // imports) — the first call at request time then initializes successfully.
  if (db) return db;
  const fresh = initializeFirebase();
  if (fresh) return fresh;
  throw new Error('Firestore not available. Check FIREBASE_* env vars.');
}

// ─── Auth helpers ──────────────────────────────────────────────────────────
async function getUser(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return await verifySessionToken(cookies[SESSION_COOKIE]);
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (req.body && typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1024 * 1024) throw new Error('Request body is too large.');
  }
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// ─── Battle constants ─────────────────────────────────────────────────────────
const BATTLES = 'battles';
const PROBLEMS = 'problems';
const USERS = 'users';
const BATTLE_DURATION_MS = 300 * 1000;
const XP_BY_DIFFICULTY = { Easy: 50, Medium: 100, Hard: 150 };

export const battleCache = new Map();
const CACHE_TTL = 1000; // 1 second for active/waiting
const FINAL_CACHE_TTL = 10 * 60 * 1000; // 10 minutes for completed/expired

// ─── Route handlers ───────────────────────────────────────────────────────────

// POST /api/battles — create battle
async function createBattle(req, res, user) {
  const { opponentEmail, difficulty = 'Medium', sharedId } = req.body || {};

  if (!opponentEmail) {
    return res.status(400).json({ error: 'opponentEmail is required' });
  }

  const validDifficulties = ['Easy', 'Medium', 'Hard'];
  if (!validDifficulties.includes(difficulty)) {
    return res.status(400).json({ error: 'difficulty must be Easy, Medium, or Hard' });
  }

  const firestore = getDb();

  // Look up opponent by email
  const opponentSnap = await firestore
    .collection(USERS)
    .where('email', '==', opponentEmail.toLowerCase().trim())
    .limit(1)
    .get();

  if (opponentSnap.empty) {
    return res.status(404).json({ error: `No account found with email "${opponentEmail}"` });
  }

  const opponentId = opponentSnap.docs[0].id;

  if (opponentId === user.sub) {
    return res.status(400).json({ error: 'You cannot challenge yourself' });
  }

  // Resolve the battle problem. When a sharedId is supplied (the "Share a DSA
  // Insight → Challenge a Friend" flow) the shared snippet IS the battle
  // problem — both players fork and race on that exact code. Otherwise fall
  // back to a random catalog problem at the requested difficulty.
  const problemData = await resolveBattleProblem(firestore, difficulty, sharedId);
  if (problemData.error) {
    return res.status(problemData.status).json({ error: problemData.error });
  }

  const battleRef = firestore.collection(BATTLES).doc();

  await battleRef.set({
    player1: user.sub,
    player2: opponentId,
    participants: [user.sub, opponentId],
    status: 'pending',
    difficulty,
    ...problemData,
    submissions: {},
    winner: null,
    xpAwarded: 0,
    createdAt: FieldValue.serverTimestamp(),
    startedAt: null,
    expiresAt: null,
  });

  battleCache.delete(battleRef.id);
  return res.status(201).json({ battleId: battleRef.id });
}

// Picks the problem a battle is played on.
//  - sharedId set  → the shared DSA insight becomes the problem, so the battle
//    client can render the code and both players solve/fork the same snippet.
//  - otherwise     → a random catalog problem at the requested difficulty.
async function resolveBattleProblem(firestore, difficulty, sharedId) {
  if (sharedId) {
    const snippet = await getSharedSnippet(sharedId);
    if (!snippet) {
      return { status: 404, error: 'Shared insight not found or has expired.' };
    }
    return {
      problemType: 'shared',
      sharedId,
      problemId: null,
      problemTitle: snippet.title || 'Shared DSA Insight',
      problemDescription:
        `Fork and race on this shared DSA insight — solve it faster than your opponent.` +
        `\n\nLanguage: ${snippet.language || 'javascript'}` +
        `\nInsight: ${snippet.title || 'Untitled snippet'}`,
      problemCode: snippet.code,
      problemLanguage: snippet.language || 'javascript',
    };
  }

  const problemSnap = await firestore
    .collection(PROBLEMS)
    .where('difficulty', '==', difficulty)
    .get();

  if (problemSnap.empty) {
    return { status: 500, error: `No problems found for difficulty "${difficulty}"` };
  }

  const candidates = problemSnap.docs;
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];

  return {
    problemType: 'catalog',
    problemId: chosen.id,
    problemTitle: chosen.data().title,
    problemDescription: chosen.data().description,
    problemCode: null,
    problemLanguage: null,
  };
}

// GET /api/battles/history — battle history for current user
async function getHistory(req, res, user) {
  const firestore = getDb();

  const limitStr = (req.query && req.query.limit) || 20;
  const cursorStr = (req.query && req.query.cursor) || null;
  const limit = Math.min(parseInt(limitStr, 10) || 20, 50);

  let query = firestore
    .collection(BATTLES)
    .where('participants', 'array-contains', user.sub)
    .where('status', 'in', ['completed', 'expired'])
    .orderBy('createdAt', 'desc')
    .limit(limit);

  if (cursorStr) {
    const cursorDoc = await firestore.collection(BATTLES).doc(cursorStr).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snap = await query.get();
  const history = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return res.status(200).json({
    history,
    nextCursor: history.length === limit ? history[history.length - 1].id : null,
  });
}

// GET /api/battles/:id — get single battle
async function getBattle(req, res, user, battleId) {
  const now = Date.now();
  const cached = battleCache.get(battleId);
  if (cached) {
    const isExpired = now - cached.timestamp > cached.ttl;
    if (!isExpired) {
      const timeRemainingMs = cached.data.expiresAt
        ? Math.max(0, cached.data.expiresAt.toMillis() - now)
        : null;
      return res.status(200).json({ ...cached.data, id: battleId, timeRemainingMs });
    }
  }

  const firestore = getDb();
  const doc = await firestore.collection(BATTLES).doc(battleId).get();

  if (!doc.exists) return res.status(404).json({ error: 'Battle not found' });

  const battle = doc.data();

  // Lazy expiry — resolve on read, no cron needed
  if (
    battle.status === 'active' &&
    battle.expiresAt &&
    Timestamp.now().toMillis() > battle.expiresAt.toMillis()
  ) {
    await firestore.collection(BATTLES).doc(battleId).update({ status: 'expired' });
    battle.status = 'expired';
  }

  const timeRemainingMs = battle.expiresAt ? Math.max(0, battle.expiresAt.toMillis() - now) : null;

  const resolved = { id: doc.id, ...battle, timeRemainingMs };

  const isFinal = battle.status === 'completed' || battle.status === 'expired';
  const ttl = isFinal ? FINAL_CACHE_TTL : CACHE_TTL;
  battleCache.set(battleId, {
    data: { ...battle, expiresAt: battle.expiresAt },
    timestamp: now,
    ttl,
  });

  return res.status(200).json(resolved);
}

// POST /api/battles/:id/join — join a pending battle
async function joinBattle(req, res, user, battleId) {
  const firestore = getDb();
  const battleRef = firestore.collection(BATTLES).doc(battleId);

  try {
    const result = await firestore.runTransaction(async (tx) => {
      const doc = await tx.get(battleRef);
      if (!doc.exists) throw new Error('Battle not found');

      const battle = doc.data();

      if (battle.status !== 'pending') {
        throw new Error('This battle is no longer open to join');
      }
      if (battle.player2 !== user.sub) {
        throw new Error('You were not invited to this battle');
      }

      const startedAt = Timestamp.now();
      const expiresAt = Timestamp.fromMillis(startedAt.toMillis() + BATTLE_DURATION_MS);

      tx.update(battleRef, { status: 'active', startedAt, expiresAt });

      return {
        problemTitle: battle.problemTitle,
        problemDescription: battle.problemDescription,
        problemCode: battle.problemCode || null,
        problemLanguage: battle.problemLanguage || null,
        problemType: battle.problemType || 'catalog',
      };
    });

    battleCache.delete(battleId);
    return res.status(200).json({ joined: true, ...result });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// POST /api/battles/:id/submit — submit solution
async function submitSolution(req, res, user, battleId) {
  const { code } = req.body || {};
  if (!code?.trim()) {
    return res.status(400).json({ error: 'code is required' });
  }

  const firestore = getDb();
  const battleRef = firestore.collection(BATTLES).doc(battleId);

  try {
    const result = await firestore.runTransaction(async (tx) => {
      const doc = await tx.get(battleRef);
      if (!doc.exists) throw new Error('Battle not found');

      const battle = doc.data();

      if (battle.status === 'completed' || battle.winner) {
        throw new Error('Battle already finished — opponent submitted first');
      }
      if (battle.status !== 'active') {
        throw new Error('Battle is not active');
      }
      if (![battle.player1, battle.player2].includes(user.sub)) {
        throw new Error('You are not a participant in this battle');
      }
      if (battle.submissions?.[user.sub]) {
        throw new Error('You have already submitted');
      }

      const now = Timestamp.now();
      if (battle.expiresAt && now.toMillis() > battle.expiresAt.toMillis()) {
        tx.update(battleRef, { status: 'expired' });
        throw new Error('Time is up — battle expired');
      }

      const xp = XP_BY_DIFFICULTY[battle.difficulty] ?? 50;

      tx.update(battleRef, {
        [`submissions.${user.sub}`]: { code, submittedAt: now },
        status: 'completed',
        winner: user.sub,
        xpAwarded: xp,
      });

      tx.update(firestore.collection(USERS).doc(user.sub), {
        totalXp: FieldValue.increment(xp),
      });

      return { winner: user.sub, xpAwarded: xp };
    });

    battleCache.delete(battleId);

    // Trigger leaderboard update in the background
    (async () => {
      try {
        const userDoc = await firestore.collection(USERS).doc(user.sub).get();
        if (userDoc.exists) {
          const userXp = Number(userDoc.data().totalXp || userDoc.data().xp || 0);
          const { enqueueLeaderboardUpdate } = await import('../backend/jobs/queue.js');
          await enqueueLeaderboardUpdate(user.sub, userXp);
        }
      } catch (e) {
        console.error('[LEADERBOARD] Failed to update user XP in Redis:', e);
      }
    })();

    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// ─── Route helpers ────────────────────────────────────────────────────────────
async function handleGetRoutes(req, res, user, url) {
  if (/^\/api\/battles\/history/.test(url)) {
    return await getHistory(req, res, user);
  }
  const getMatch = url.match(/^\/api\/battles\/([^/]+)\/?$/);
  if (getMatch) {
    return await getBattle(req, res, user, getMatch[1]);
  }
  return null;
}

async function handlePostRoutes(req, res, user, url) {
  if (/^\/api\/battles\/?$/.test(url)) {
    return await createBattle(req, res, user);
  }
  const joinMatch = url.match(/^\/api\/battles\/([^/]+)\/join\/?$/);
  if (joinMatch) {
    return await joinBattle(req, res, user, joinMatch[1]);
  }
  const submitMatch = url.match(/^\/api\/battles\/([^/]+)\/submit\/?$/);
  if (submitMatch) {
    return await submitSolution(req, res, user, submitMatch[1]);
  }
  return null;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Auth check — every battle route requires a valid session
  const user = await getUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized — please log in' });
  }

  // Parse body for POST requests (express route body, raw stream, or string)
  if (req.method === 'POST') {
    try {
      req.body = await readBody(req);
    } catch {
      req.body = {};
    }
  }

  // Content-Type guard — all responses are JSON
  res.setHeader('Content-Type', 'application/json');

  const url = req.url || '';
  const method = req.method;

  try {
    let result = null;

    if (method === 'GET') {
      result = await handleGetRoutes(req, res, user, url);
    } else if (method === 'POST') {
      result = await handlePostRoutes(req, res, user, url);
    }

    if (result) return result;

    return res.status(404).json({ error: 'Route not found' });
  } catch (err) {
    console.error('Battle API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
