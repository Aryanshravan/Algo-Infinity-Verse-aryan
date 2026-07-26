import { explainCode } from '../backend/services/codeExplainer.service.js';

const MAX_CODE_LENGTH = 20000;

export default async function handler(req, res) {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON request payload.' });
      }
    }

    const { code, language = 'javascript' } = body || {};

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'Field "code" is required and cannot be empty.' });
    }

    if (code.length > MAX_CODE_LENGTH) {
      return res.status(400).json({
        error: `Code length exceeds maximum allowed limit of ${MAX_CODE_LENGTH} characters.`,
      });
    }

    const explanation = await explainCode({
      code,
      language: typeof language === 'string' ? language : 'javascript',
    });

    return res.status(200).json(explanation);
  } catch (error) {
    console.error('[API explain-code] Error handling request:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate code explanation.',
    });
  }
}
