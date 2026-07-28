import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getSession, sendJson, readJsonBody } from '../utils/helpers.js';
import { validateInterviewExperiencePayload } from '../utils/interviewValidation.js';
import { initializeFirebase } from '../../firebase.js';

const DATA_DIR = path.join(process.cwd(), 'data');

export async function handleSubmitInterviewExperience(req, res) {
  const session = getSession(req);
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON body.' });
  }

  const validationResult = validateInterviewExperiencePayload(payload);
  if (!validationResult.isValid) {
    return sendJson(res, 400, { error: validationResult.error });
  }

  const { company, role, difficulty, rating, title, content, rounds, offerStatus } = payload;
  const { normalizedTopics } = validationResult;

  const experienceData = {
    id: crypto.randomUUID(),
    userId: session ? session.sub : null,
    userName: session ? session.name : null,
    company: company.trim(),
    role: role.trim(),
    difficulty,
    rating,
    title: title.trim(),
    content: content.trim(),
    topics: normalizedTopics,
    rounds: rounds || null,
    offerStatus: offerStatus || null,
    upvotes: 0,
    createdAt: new Date().toISOString(),
  };

  try {
    const db = initializeFirebase();
    if (db) {
      const docRef = await db.collection('interviewExperiences').add(experienceData);
      experienceData.id = docRef.id;
    } else {
      const filePath = path.join(DATA_DIR, 'interview-experiences.json');
      await fs.mkdir(DATA_DIR, { recursive: true });
      let list = [];
      try {
        const raw = await fs.readFile(filePath, 'utf8');
        list = JSON.parse(raw || '[]');
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
      list.push(experienceData);
      await fs.writeFile(filePath, JSON.stringify(list, null, 2) + '\n');
    }
    return sendJson(res, 201, { success: true, experience: experienceData });
  } catch (err) {
    console.error('Error saving interview experience:', err);
    return sendJson(res, 500, {
      error: 'Failed to save interview experience.',
    });
  }
}
