/**
 * api/execute/problem.js
 * Vercel serverless function: proxies code execution requests to Judge0 CE.
 * Handles C++, Java, C, Swift, and other compiled languages that can't run in-browser.
 *
 * Route: POST /api/execute/problem
 *
 * Request body: { problemId: string, language: string, sourceCode: string, originalCode?: string }
 * Response: { success: boolean, data?: { output, stderr, memory, cpuTime, status }, message?: string }
 */

import { judge0Execute, getLanguageId } from '../../backend/lib/judge0-client.js';

// Execution timeout in milliseconds (Vercel Hobby plan function timeout is 10s)
const EXECUTION_TIMEOUT_MS = 10000;

// Maximum source code length
const MAX_CODE_LENGTH = 100000; // 100KB

/**
 * Language ID mapping for languages that need server-side execution.
 * Browser-executable languages (JS, Python) are handled client-side.
 */
const SERVER_LANGUAGES = {
  cpp: true,
  'c++': true,
  c: true,
  java: true,
  swift: true,
  go: true,
  rust: true,
  ruby: true,
  dart: true,
  kotlin: true,
  haskell: true,
};

export const config = {
  maxDuration: 30, // Vercel function timeout (max 30s on Pro, 10s on Hobby)
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { problemId, language, sourceCode, originalCode } = req.body;

    // Validate required fields
    if (!problemId) {
      return res.status(400).json({ success: false, message: 'Missing required field: problemId' });
    }
    if (!language || typeof language !== 'string') {
      return res.status(400).json({ success: false, message: 'Missing required field: language' });
    }
    if (!sourceCode || typeof sourceCode !== 'string') {
      return res.status(400).json({ success: false, message: 'Missing required field: sourceCode' });
    }

    // Validate code length
    if (sourceCode.length > MAX_CODE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Source code exceeds maximum length of ${MAX_CODE_LENGTH} characters.`,
      });
    }

    const normalLang = language.toLowerCase();

    // Check if this language requires server-side execution
    if (!SERVER_LANGUAGES[normalLang]) {
      // JS and Python should be executed client-side
      return res.status(400).json({
        success: false,
        message: `Language "${language}" is supported in-browser. Use client-side execution instead.`,
      });
    }

    // Map to Judge0 language ID
    const languageId = getLanguageId(normalLang);
    if (!languageId) {
      return res.status(400).json({
        success: false,
        message: `Unsupported language for server execution: ${language}`,
      });
    }

    // Execute via Judge0
    const result = await judge0Execute({
      source_code: sourceCode,
      language_id: languageId,
      stdin: '',
      timeoutMs: EXECUTION_TIMEOUT_MS,
    });

    // Normalize response shape
    return res.status(200).json({
      success: true,
      data: {
        output: result.stdout || '',
        stderr: result.stderr || result.compile_output || '',
        memory: result.memory || null,
        cpuTime: result.time || null,
        status: result.status?.description || 'Unknown',
        exitCode: result.exitCode,
      },
    });
  } catch (err) {
    console.error('[api/execute/problem] Error:', err.message);

    // Distinguish timeout errors
    if (err.message.includes('timed out') || err.message.includes('Timeout')) {
      return res.status(504).json({
        success: false,
        message: 'Execution timed out. Your code may contain an infinite loop or be too complex.',
      });
    }

    // Judge0 submission/poll errors
    if (err.message.includes('Judge0')) {
      return res.status(502).json({
        success: false,
        message: 'Code execution service temporarily unavailable. Please try again later.',
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error during code execution.',
    });
  }
}
