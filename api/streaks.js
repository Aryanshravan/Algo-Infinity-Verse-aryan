import { initializeFirebase } from '../firebase.js';
import { SESSION_COOKIE, verifySessionToken, parseCookies } from '../backend/utils/sessionToken.js';

const db = initializeFirebase();
const useFirestore = !!db;

function getStreakMultiplier(streakCount = 0) {
  if (streakCount >= 100) return 2.0;
  if (streakCount >= 30) return 1.5;
  if (streakCount >= 7) return 1.2;
  return 1.0;
}

export default async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  const sessionToken = cookies[SESSION_COOKIE];
  let session = null;
  if (sessionToken) {
    try {
      session = verifySessionToken(sessionToken);
    } catch {
      session = null;
    }
  }

  if (req.method === 'GET') {
    if (!session || !useFirestore) {
      // Fallback for unauthenticated/demo state
      return res.status(200).json({
        success: true,
        streak: 0,
        longestStreak: 0,
        freezes: 0,
        freezeHistory: [],
        activityData: {},
        multiplier: 1.0,
        milestones: { 7: false, 30: false, 100: false },
      });
    }

    try {
      const doc = await db.collection('users').doc(session.sub).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'User not found.' });
      }
      const data = doc.data() || {};
      const streak = Number(data.streak || 0);
      const longestStreak = Number(data.longestStreak || streak);
      const freezes = Number(data.freezes || 0);
      const freezeHistory = Array.isArray(data.freezeHistory) ? data.freezeHistory : [];
      const activityData = data.activityData || {};
      const multiplier = getStreakMultiplier(streak);

      return res.status(200).json({
        success: true,
        streak,
        longestStreak,
        freezes,
        freezeHistory,
        activityData,
        lastActive: data.lastActive || null,
        multiplier,
        milestones: {
          7: streak >= 7,
          30: streak >= 30,
          100: streak >= 100,
        },
      });
    } catch (err) {
      console.error('[api/streaks] GET error:', err);
      return res.status(500).json({ error: 'Failed to fetch streak data.' });
    }
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    if (!session || !useFirestore) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    try {
      let body;
      try {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
      } catch {
        body = req.body || {};
      }

      const userRef = db.collection('users').doc(session.sub);
      const doc = await userRef.get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const userData = doc.data() || {};
      const updates = {};

      if (body.useFreeze === true) {
        let freezes = Number(userData.freezes || 0);
        if (freezes <= 0) {
          return res.status(400).json({ error: 'No streak freezes available.' });
        }
        updates.freezes = freezes - 1;
        const history = Array.isArray(userData.freezeHistory) ? [...userData.freezeHistory] : [];
        history.push({
          date: new Date().toISOString(),
          reason: body.reason || 'Streak freeze protection activated',
        });
        updates.freezeHistory = history;
      }

      if (typeof body.streak === 'number') {
        updates.streak = Math.max(0, body.streak);
        const currentLongest = Number(userData.longestStreak || 0);
        if (updates.streak > currentLongest) {
          updates.longestStreak = updates.streak;
        }
      }

      if (body.activityData && typeof body.activityData === 'object') {
        updates.activityData = { ...(userData.activityData || {}), ...body.activityData };
      }

      if (body.lastActive) {
        updates.lastActive = body.lastActive;
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date().toISOString();
        await userRef.update(updates);
      }

      const finalData = { ...userData, ...updates };
      const currentStreak = Number(finalData.streak || 0);

      return res.status(200).json({
        success: true,
        streak: currentStreak,
        longestStreak: Number(finalData.longestStreak || currentStreak),
        freezes: Number(finalData.freezes || 0),
        freezeHistory: finalData.freezeHistory || [],
        activityData: finalData.activityData || {},
        multiplier: getStreakMultiplier(currentStreak),
      });
    } catch (err) {
      console.error('[api/streaks] PUT/POST error:', err);
      return res.status(500).json({ error: 'Failed to update streak data.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
