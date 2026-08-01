import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

import { sendJson, readJsonBody, DATA_DIR } from '../utils/helpers.js';
import { getSession } from '../utils/sessionToken.js';
import { API_ROUTES } from './routeConstants.js';

const LEARNING_SESSIONS_FILE = path.join(DATA_DIR, 'learning_sessions.json');
const LEARNING_EVENTS_FILE = path.join(DATA_DIR, 'learning_session_events.json');
const SUPPORTED_LEARNING_EVENT_TYPES = [
  'session_started',
  'session_ended',
  'video_started',
  'video_paused',
  'video_ended',
  'problem_attempted',
  'problem_solved',
  'quiz_attempted',
  'quiz_completed',
  'xp_earned',
  'badge_unlocked',
  'topic_visited',
  'code_playground_used',
];
const MAX_TOPIC_KEY_LENGTH = 150;
const SESSION_IDLE_WINDOW_MS = 30 * 60 * 1000;

async function ensureFile(filePath, initial) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, initial);
  }
}

async function readArray(filePath) {
  await ensureFile(filePath, '[]\n');
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw || '[]');
  return Array.isArray(parsed) ? parsed : [];
}

async function writeArray(filePath, arr) {
  await ensureFile(filePath, '[]\n');
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(arr, null, 2)}\n`);
  await fs.rename(tmp, filePath);
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeEventPayload(payload) {
  if (!payload || typeof payload !== 'object') return {};

  const safe = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    safe[key] = typeof value === 'string' && value.length > 2000 ? value.slice(0, 2000) : value;
  }
  return safe;
}

async function ensureActiveSession({ userId, eventType }) {
  const sessions = await readArray(LEARNING_SESSIONS_FILE);
  const events = await readArray(LEARNING_EVENTS_FILE);

  const lastEvent = events
    .filter((event) => event.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

  const lastSession = sessions
    .filter((session) => session.userId === userId && session.endedAt == null)
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))[0];

  if (lastSession) {
    const lastTs = lastEvent ? new Date(lastEvent.timestamp).getTime() : new Date(lastSession.startedAt).getTime();
    const idleMs = Date.now() - lastTs;

    if (idleMs <= SESSION_IDLE_WINDOW_MS) {
      return lastSession;
    }

    const ended = sessions.map((session) =>
      session.id === lastSession.id ? { ...session, endedAt: nowIso(), endedReason: 'idle_timeout' } : session
    );
    await writeArray(LEARNING_SESSIONS_FILE, ended);
  }

  const newSession = {
    id: `sess_${uuidv4()}`,
    userId,
    startedAt: nowIso(),
    endedAt: null,
    startedBy: eventType,
    createdAt: nowIso(),
    lastEventAt: nowIso(),
    stats: {
      problemAttempts: 0,
      problemsSolved: 0,
      quizAttempts: 0,
      xpEarned: 0,
      badgesUnlocked: 0,
      topicVisits: 0,
      codePlaygroundUses: 0,
    },
  };

  sessions.push(newSession);
  await writeArray(LEARNING_SESSIONS_FILE, sessions);
  return newSession;
}

function bumpStats(stats, type, payload) {
  const next = { ...stats };
  const eventType = String(type);
  const amount = Number(payload?.amount || 0) || 0;

  if (eventType === 'problem_attempted') next.problemAttempts += 1;
  if (eventType === 'problem_solved') {
    next.problemAttempts += 1;
    next.problemsSolved += 1;
  }
  if (eventType === 'quiz_attempted') next.quizAttempts += 1;
  if (eventType === 'xp_earned') next.xpEarned += amount;
  if (eventType === 'badge_unlocked') next.badgesUnlocked += 1;
  if (eventType === 'topic_visited') next.topicVisits += 1;
  if (eventType === 'code_playground_used') next.codePlaygroundUses += 1;

  return next;
}

export async function setupLearningSessionRoutes(req, res, pathname) {
  if (pathname === API_ROUTES.LEARNING_SESSIONS && req.method === 'GET') {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Authentication required.' });

    const limit = Math.min(
      parseInt(new URL(req.url, `http://${req.headers.host}`).searchParams.get('limit') || '20', 10),
      50
    );
    const sessions = await readArray(LEARNING_SESSIONS_FILE);
    const filtered = sessions
      .filter((item) => item.userId === session.sub)
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, limit);

    return sendJson(res, 200, { success: true, sessions: filtered });
  }

  const timelinePrefix = `${API_ROUTES.LEARNING_SESSIONS}/`;
  if (pathname.startsWith(timelinePrefix) && req.method === 'GET') {
    const sessionUser = getSession(req);
    if (!sessionUser) return sendJson(res, 401, { error: 'Authentication required.' });

    const sessionId = pathname.slice(timelinePrefix.length);
    if (!sessionId || sessionId.trim() === '') {
      return sendJson(res, 400, { error: 'Session identifier cannot be empty or contain only whitespace.' });
    }

    if (!/^sess_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(sessionId)) {
      return sendJson(res, 400, {
        error: 'Invalid session identifier format. Must start with "sess_" and follow the expected UUID format.',
      });
    }

    const sessions = await readArray(LEARNING_SESSIONS_FILE);
    const events = await readArray(LEARNING_EVENTS_FILE);

    const sess = sessions.find((item) => item.id === sessionId && item.userId === sessionUser.sub);
    if (!sess) return sendJson(res, 404, { error: 'Session not found.' });

    const timeline = events
      .filter((event) => event.sessionId === sessionId && event.userId === sessionUser.sub)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return sendJson(res, 200, { success: true, session: sess, timeline });
  }

  if (pathname === API_ROUTES.LEARNING_SESSIONS_ENSURE && req.method === 'POST') {
    const sessionUser = getSession(req);
    if (!sessionUser) return sendJson(res, 401, { error: 'Authentication required.' });

    const payload = await readJsonBody(req);
    const eventType = String(payload?.eventType || 'session_started');

    const sess = await ensureActiveSession({ userId: sessionUser.sub, eventType });
    return sendJson(res, 200, {
      success: true,
      session: { id: sess.id, startedAt: sess.startedAt, endedAt: sess.endedAt },
    });
  }

  if (pathname === API_ROUTES.LEARNING_SESSIONS_EVENTS && req.method === 'POST') {
    const sessionUser = getSession(req);
    if (!sessionUser) return sendJson(res, 401, { error: 'Authentication required.' });

    const payload = await readJsonBody(req);
    const type = String(payload?.type || payload?.eventType || '');
const SUPPORTED_LEARNING_EVENT_TYPES = [
  'problem_attempted',
  'problem_solved',
  'quiz_attempted',
  'xp_earned',
  'badge_unlocked',
  'topic_visited',
  'code_playground_used',
  'session_started',
];
    if (!type || !SUPPORTED_LEARNING_EVENT_TYPES.includes(type)) {
      return sendJson(res, 400, {
        success: false,
        error: `Invalid learning event type: "${type}". Supported types are: ${SUPPORTED_LEARNING_EVENT_TYPES.join(', ')}.`,
      });
    }

    const rawTopicKey = payload?.topicKey ?? payload?.topic ?? null;
    let validatedTopicKey = null;

    if (rawTopicKey !== null) {
      if (typeof rawTopicKey !== 'string') {
        return sendJson(res, 400, { success: false, error: 'topicKey must be a string if provided.' });
      }

      const trimmedTopicKey = rawTopicKey.trim();
      if (trimmedTopicKey.length === 0) {
        return sendJson(res, 400, { success: false, error: 'topicKey cannot be empty or contain only whitespace.' });
      }
      if (trimmedTopicKey.length > MAX_TOPIC_KEY_LENGTH) {
        return sendJson(res, 400, { success: false, error: `topicKey cannot exceed ${MAX_TOPIC_KEY_LENGTH} characters.` });
      }
      if (!/^[a-zA-Z0-9 _-]+$/.test(trimmedTopicKey)) {
        return sendJson(res, 400, {
          success: false,
          error: 'Invalid topicKey format. Only letters, numbers, spaces, hyphens, and underscores are allowed.',
        });
      }
      validatedTopicKey = trimmedTopicKey;
    }

    const event = {
      id: `evt_${uuidv4()}`,
      userId: sessionUser.sub,
      sessionId: null,
      type,
      timestamp: nowIso(),
      topicKey: validatedTopicKey,
      payload: normalizeEventPayload(payload?.payload || payload?.data || {}),
    };

    const sess = await ensureActiveSession({ userId: sessionUser.sub, eventType: type });
    event.sessionId = sess.id;

    const events = await readArray(LEARNING_EVENTS_FILE);
    events.push(event);

    const MAX_EVENTS = 20000;
    if (events.length > MAX_EVENTS) {
      events.splice(0, events.length - MAX_EVENTS);
    }

    await writeArray(LEARNING_EVENTS_FILE, events);

    const sessions = await readArray(LEARNING_SESSIONS_FILE);
    const nextSessions = sessions.map((session) => {
      if (session.id !== sess.id) return session;

      const stats = session.stats || {
        problemAttempts: 0,
        problemsSolved: 0,
        quizAttempts: 0,
        xpEarned: 0,
        badgesUnlocked: 0,
        topicVisits: 0,
        codePlaygroundUses: 0,
      };

      return {
        ...session,
        lastEventAt: event.timestamp,
        stats: bumpStats(stats, type, event.payload),
      };
    });

    await writeArray(LEARNING_SESSIONS_FILE, nextSessions);
    return sendJson(res, 201, { success: true, eventId: event.id });
  }

  return null;
}