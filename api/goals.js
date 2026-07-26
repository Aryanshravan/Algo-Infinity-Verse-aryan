import { initializeFirebase } from '../firebase.js';
import { SESSION_COOKIE, verifySessionToken, parseCookies } from '../backend/utils/sessionToken.js';

const db = initializeFirebase();
const useFirestore = !!db;

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
      return res.status(200).json({
        success: true,
        dailyGoals: {
          targetProblems: 3,
          targetMinutes: 30,
          targetQuizzes: 1,
          completedProblems: 0,
          completedMinutes: 0,
          completedQuizzes: 0,
        },
        weeklyGoals: {
          targetProblems: 15,
          targetMinutes: 150,
          targetQuizzes: 3,
          completedProblems: 0,
          completedMinutes: 0,
          completedQuizzes: 0,
        },
      });
    }

    try {
      const doc = await db.collection('users').doc(session.sub).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'User not found.' });
      }
      const data = doc.data() || {};
      return res.status(200).json({
        success: true,
        dailyGoals: data.dailyGoals || {
          targetProblems: 3,
          targetMinutes: 30,
          targetQuizzes: 1,
          completedProblems: 0,
          completedMinutes: 0,
          completedQuizzes: 0,
        },
        weeklyGoals: data.weeklyGoals || {
          targetProblems: 15,
          targetMinutes: 150,
          targetQuizzes: 3,
          completedProblems: 0,
          completedMinutes: 0,
          completedQuizzes: 0,
        },
      });
    } catch (err) {
      console.error('[api/goals] GET error:', err);
      return res.status(500).json({ error: 'Failed to fetch goal data.' });
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

      if (body.dailyGoals && typeof body.dailyGoals === 'object') {
        updates.dailyGoals = { ...(userData.dailyGoals || {}), ...body.dailyGoals };
      }

      if (body.weeklyGoals && typeof body.weeklyGoals === 'object') {
        updates.weeklyGoals = { ...(userData.weeklyGoals || {}), ...body.weeklyGoals };
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date().toISOString();
        await userRef.update(updates);
      }

      const finalData = { ...userData, ...updates };

      return res.status(200).json({
        success: true,
        dailyGoals: finalData.dailyGoals,
        weeklyGoals: finalData.weeklyGoals,
      });
    } catch (err) {
      console.error('[api/goals] PUT/POST error:', err);
      return res.status(500).json({ error: 'Failed to update goal data.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
