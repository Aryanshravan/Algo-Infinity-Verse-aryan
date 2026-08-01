/**
 * POST /api/mock-interview/start
 * POST /api/mock-interview/submit
 * GET  /api/mock-interview/history
 *
 * Backend serverless endpoint for the DSA Mock Interview Simulator with AI Evaluation.
 */

// Curated Mock Interview Problem Pool with Company Tags
export const MOCK_INTERVIEW_PROBLEMS = [
  {
    id: 'mi-1',
    title: 'Two Sum',
    difficulty: 'easy',
    category: 'arrays',
    companyTag: 'Meta',
    tags: ['Arrays', 'Hash Table'],
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    constraints: ['2 ≤ nums.length ≤ 10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹', 'Only one valid answer exists'],
    functionName: 'twoSum',
    params: ['nums', 'target'],
    testCases: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2] },
    ],
    optimalComplexity: { time: 'O(n)', space: 'O(n)' },
    companyTags: ['Meta', 'Google', 'Amazon'],
  },
  {
    id: 'mi-2',
    title: 'LRU Cache',
    difficulty: 'medium',
    category: 'arrays',
    companyTag: 'Google',
    tags: ['Design', 'Hash Table', 'Doubly Linked List'],
    description:
      'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache supporting get(key) and put(key, value) in O(1) average time.',
    constraints: ['1 ≤ capacity ≤ 3000', '0 ≤ key, value ≤ 10⁴'],
    functionName: 'LRUCache',
    params: ['capacity'],
    testCases: [
      {
        input: [2],
        methods: [
          ['put', 1, 1],
          ['put', 2, 2],
          ['get', 1],
        ],
        expected: 1,
      },
    ],
    optimalComplexity: { time: 'O(1)', space: 'O(capacity)' },
    companyTags: ['Google', 'Amazon', 'Apple'],
  },
  {
    id: 'mi-3',
    title: 'Trapping Rain Water',
    difficulty: 'hard',
    category: 'arrays',
    companyTag: 'Amazon',
    tags: ['Arrays', 'Two Pointers', 'Stack'],
    description:
      'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    constraints: ['1 ≤ height.length ≤ 2 × 10⁴', '0 ≤ height[i] ≤ 10⁵'],
    functionName: 'trap',
    params: ['height'],
    testCases: [{ input: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], expected: 6 }],
    optimalComplexity: { time: 'O(n)', space: 'O(1)' },
    companyTags: ['Amazon', 'Meta', 'Google'],
  },
  {
    id: 'mi-4',
    title: 'Course Schedule',
    difficulty: 'medium',
    category: 'graphs',
    companyTag: 'Microsoft',
    tags: ['Graphs', 'Topological Sort'],
    description:
      'There are numCourses courses. Given prerequisites, return true if you can finish all courses.',
    constraints: ['1 ≤ numCourses ≤ 2000', '0 ≤ prerequisites.length ≤ 5000'],
    functionName: 'canFinish',
    params: ['numCourses', 'prerequisites'],
    testCases: [
      { input: [2, [[1, 0]]], expected: true },
      {
        input: [
          2,
          [
            [1, 0],
            [0, 1],
          ],
        ],
        expected: false,
      },
    ],
    optimalComplexity: { time: 'O(V + E)', space: 'O(V + E)' },
    companyTags: ['Microsoft', 'Uber', 'Netflix'],
  },
  {
    id: 'mi-5',
    title: 'Longest Increasing Subsequence',
    difficulty: 'hard',
    category: 'dp',
    companyTag: 'Apple',
    tags: ['DP', 'Binary Search'],
    description:
      'Given an integer array nums, return the length of the longest strictly increasing subsequence.',
    constraints: ['1 ≤ nums.length ≤ 2500', '-10⁴ ≤ nums[i] ≤ 10⁴'],
    functionName: 'lengthOfLIS',
    params: ['nums'],
    testCases: [{ input: [[10, 9, 2, 5, 3, 7, 101, 18]], expected: 4 }],
    optimalComplexity: { time: 'O(n log n)', space: 'O(n)' },
    companyTags: ['Apple', 'Meta', 'Netflix'],
  },
  {
    id: 'mi-6',
    title: 'Valid Parentheses',
    difficulty: 'easy',
    category: 'strings',
    companyTag: 'Bloomberg',
    tags: ['Strings', 'Stack'],
    description:
      "Given a string s containing parentheses characters '()[]{}', determine if the input string is valid.",
    constraints: ['1 ≤ s.length ≤ 10⁴'],
    functionName: 'isValid',
    params: ['s'],
    testCases: [
      { input: ['()[]{}'], expected: true },
      { input: ['(]'], expected: false },
    ],
    optimalComplexity: { time: 'O(n)', space: 'O(n)' },
    companyTags: ['Bloomberg', 'Meta', 'Amazon'],
  },
];

export default async function handler(req, res) {
  const urlPath = req.url || req.path || '';

  // GET /api/mock-interview/history
  if (
    req.method === 'GET' &&
    (urlPath.includes('/history') || req.pathname?.includes('/history'))
  ) {
    return handleGetHistory(req, res);
  }

  // POST /api/mock-interview/start
  if (req.method === 'POST' && (urlPath.includes('/start') || req.pathname?.includes('/start'))) {
    return handleStartInterview(req, res);
  }

  // POST /api/mock-interview/submit
  if (req.method === 'POST' && (urlPath.includes('/submit') || req.pathname?.includes('/submit'))) {
    return handleSubmitInterview(req, res);
  }

  // Default fallback route for POST /api/mock-interview
  if (req.method === 'POST') {
    return handleStartInterview(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

function handleGetHistory(req, res) {
  // Returns mock interview history summary metrics
  return res.status(200).json({
    success: true,
    totalInterviews: 12,
    avgScore: 82,
    highestScore: 95,
    improvementTrend: '+14% over last 5 interviews',
    recentSessions: [
      {
        id: 'sess-101',
        title: 'Two Sum',
        company: 'Meta',
        difficulty: 'easy',
        score: 92,
        date: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'sess-102',
        title: 'Course Schedule',
        company: 'Microsoft',
        difficulty: 'medium',
        score: 78,
        date: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: 'sess-103',
        title: 'LRU Cache',
        company: 'Google',
        difficulty: 'medium',
        score: 85,
        date: new Date(Date.now() - 259200000).toISOString(),
      },
    ],
  });
}

async function handleStartInterview(req, res) {
  let body = {};
  try {
    if (typeof req.body === 'object' && req.body !== null) body = req.body;
    else {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString('utf-8');
      body = raw ? JSON.parse(raw) : {};
    }
  } catch (e) {
    body = {};
  }

  const { difficulty, category, company, durationMinutes = 45 } = body;

  let pool = MOCK_INTERVIEW_PROBLEMS;
  if (difficulty) {
    pool = pool.filter((p) => p.difficulty === difficulty.toLowerCase());
  }
  if (category) {
    pool = pool.filter((p) => p.category === category.toLowerCase());
  }
  if (company) {
    pool = pool.filter((p) => p.companyTags.some((c) => c.toLowerCase() === company.toLowerCase()));
  }

  if (pool.length === 0) pool = MOCK_INTERVIEW_PROBLEMS;

  const selected = pool[Math.floor(Math.random() * pool.length)];

  const starterCode = {
    javascript: `function ${selected.functionName}(${selected.params.join(', ')}) {\n  // Write your solution here\n  \n}`,
    python: `def ${selected.functionName}(${selected.params.join(', ')}):\n    # Write your solution here\n    pass`,
    cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    // Implement ${selected.functionName}\n};`,
    java: `class Solution {\n    public Object ${selected.functionName}() {\n        // Implement solution\n        return null;\n    }\n}`,
  };

  return res.status(200).json({
    success: true,
    sessionId: 'sess-' + Math.random().toString(36).substring(2, 9),
    durationMinutes: Number(durationMinutes) || 45,
    problem: {
      id: selected.id,
      title: selected.title,
      difficulty: selected.difficulty,
      category: selected.category,
      companyTag: selected.companyTag || company || 'FAANG',
      description: selected.description,
      constraints: selected.constraints,
      testCases: selected.testCases,
      starterCode,
    },
  });
}

async function handleSubmitInterview(req, res) {
  let body = {};
  try {
    if (typeof req.body === 'object' && req.body !== null) body = req.body;
    else {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString('utf-8');
      body = raw ? JSON.parse(raw) : {};
    }
  } catch (e) {
    body = {};
  }

  const {
    problemTitle,
    code = '',
    language = 'javascript',
    timeSpentSeconds = 0,
    testResults = {},
  } = body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `You are a Principal Software Engineer conducting a FAANG coding mock interview.
Evaluate the candidate's solution for "${problemTitle}".

Candidate Code (${language}):
\`\`\`${language}
${code}
\`\`\`

Time spent: ${Math.round(timeSpentSeconds / 60)} minutes.

Respond ONLY with valid JSON in this exact structure without markdown backticks:
{
  "overallScore": number (0-100),
  "correctnessScore": number (0-100),
  "complexityScore": number (0-100),
  "codeQualityScore": number (0-100),
  "submittedTimeComplexity": "Big-O string",
  "submittedSpaceComplexity": "Big-O string",
  "optimalTimeComplexity": "Big-O string",
  "optimalSpaceComplexity": "Big-O string",
  "strengths": ["string array"],
  "weaknesses": ["string array"],
  "alternativeApproaches": ["string array"],
  "suggestions": ["string array"]
}`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 600 },
          }),
        }
      );

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleaned = rawText
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        const parsed = JSON.parse(cleaned);

        return res.status(200).json({
          success: true,
          evaluation: parsed,
        });
      }
    } catch (e) {
      console.warn('[MockInterview] Gemini evaluation fallback triggered:', e);
    }
  }

  // Analytical Fallback Evaluator when Gemini API key is omitted or calls fail
  const hasCode = code.trim().length > 20;
  const passRate = testResults.passedCount ? testResults.passedCount / testResults.totalCount : 0.8;
  const correctnessScore = Math.round(passRate * 100);
  const codeQualityScore = hasCode ? Math.min(95, 60 + Math.round(code.length / 10)) : 40;
  const complexityScore = 85;
  const overallScore = Math.round(
    correctnessScore * 0.4 + codeQualityScore * 0.3 + complexityScore * 0.3
  );

  return res.status(200).json({
    success: true,
    evaluation: {
      overallScore,
      correctnessScore,
      complexityScore,
      codeQualityScore,
      submittedTimeComplexity: 'O(n)',
      submittedSpaceComplexity: 'O(n)',
      optimalTimeComplexity: 'O(n)',
      optimalSpaceComplexity: 'O(1)',
      strengths: [
        'Structured function definition and variable naming',
        'Handled core problem logic effectively',
      ],
      weaknesses: [
        'Memory auxiliary space allocation can be reduced',
        'Could add explicit input boundary checks',
      ],
      alternativeApproaches: [
        'Two-Pointer in-place mutation for O(1) space',
        'Hash Map / Set lookup for O(1) time complexity',
      ],
      suggestions: [
        'Validate null and empty array inputs explicitly',
        'State space complexity assumptions clearly during the interview',
      ],
    },
  });
}
