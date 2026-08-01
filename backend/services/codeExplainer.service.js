/**
 * backend/services/codeExplainer.service.js
 * AI-Powered Line-by-Line Code Explainer Service using Gemini API
 */

/**
 * Explains solution/algorithm code line-by-line using Gemini API with heuristic fallback.
 *
 * @param {Object} params
 * @param {string} params.code - The code snippet to be explained
 * @param {string} params.language - Programming language (javascript, python, java, cpp, go, rust, etc.)
 * @returns {Promise<Object>} Explanation object containing summary, timeComplexity, spaceComplexity, and lineExplanations array.
 */
export async function explainCode({ code, language = 'javascript' }) {
  if (!code || typeof code !== 'string' || !code.trim()) {
    throw new Error('Code is required and cannot be empty.');
  }

  const cleanCode = code.trim();
  const normalizedLang = (language || 'javascript').toLowerCase().trim();
  const lines = cleanCode.split('\n');

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `You are a world-class Data Structures & Algorithms mentor and expert code reviewer.
Analyze the following ${normalizedLang} code and provide a comprehensive, line-by-line / block-by-block natural language explanation.

CODE TO EXPLAIN (${lines.length} lines):
\`\`\`${normalizedLang}
${cleanCode}
\`\`\`

CRITICAL INSTRUCTION: Respond strictly with VALID JSON using the exact schema below. Do not wrap in extra markdown text outside the JSON block.

Schema:
{
  "summary": "Clear 2-3 sentence overview of what the code achieves, the algorithm technique used, and why it works.",
  "timeComplexity": "Big-O notation with detailed mathematical rationale (e.g., O(N log N) because sorting array of length N requires N log N operations).",
  "spaceComplexity": "Big-O notation with detailed memory allocation rationale (e.g., O(1) auxiliary space as it uses constant extra variables).",
  "lineExplanations": [
    {
      "startLine": 1,
      "endLine": 3,
      "title": "Short title describing this section",
      "explanation": "Clear, plain English breakdown of what these exact lines do, step-by-step logic, and why it's necessary.",
      "keyConcepts": ["Concept 1", "Concept 2"]
    }
  ]
}

REQUIREMENTS:
1. "startLine" and "endLine" must be valid 1-indexed integers corresponding to line numbers in the input code (1 to ${lines.length}).
2. Every non-empty line of code should be covered by at least one explanation block.
3. Group logical blocks together (e.g. loops, helper checks, return values) rather than explaining isolated single brackets or blank lines.
4. Keep explanations educational, engaging, and mentor-like.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2500,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (rawText) {
          let parsed;
          try {
            // Strip markdown code fence if model includes it despite responseMimeType
            const cleanedJsonText = rawText
              .replace(/^```json\s*/i, '')
              .replace(/\s*```$/, '')
              .trim();
            parsed = JSON.parse(cleanedJsonText);
          } catch (e) {
            console.warn(
              '[CodeExplainer] JSON parse warning, attempting sanitized parse:',
              e.message
            );
          }

          if (parsed && parsed.summary && Array.isArray(parsed.lineExplanations)) {
            return validateAndNormalizeExplanation(parsed, lines.length);
          }
        }
      } else {
        console.warn(`[CodeExplainer] Gemini API returned status ${response.status}`);
      }
    } catch (err) {
      console.error('[CodeExplainer] Gemini API call error:', err.message);
    }
  }

  // Fallback heuristic explanation when API key is missing or call fails
  return generateHeuristicExplanation(lines, normalizedLang);
}

/**
 * Validates line ranges and structures returned by AI to ensure strict range compliance.
 */
function validateAndNormalizeExplanation(data, totalLines) {
  const normalizedBlocks = data.lineExplanations.map((item, index) => {
    let startLine = parseInt(item.startLine, 10);
    let endLine = parseInt(item.endLine, 10);

    if (isNaN(startLine) || startLine < 1) startLine = 1;
    if (isNaN(endLine) || endLine > totalLines) endLine = totalLines;
    if (startLine > endLine) {
      const temp = startLine;
      startLine = endLine;
      endLine = temp;
    }

    return {
      id: `block-${index + 1}`,
      startLine,
      endLine,
      title: item.title || `Lines ${startLine}-${endLine}`,
      explanation: item.explanation || 'No detailed explanation provided for this section.',
      keyConcepts: Array.isArray(item.keyConcepts) ? item.keyConcepts : [],
    };
  });

  return {
    summary: data.summary || 'Code analysis and algorithm explanation.',
    timeComplexity: data.timeComplexity || 'O(N) - Depends on problem input bounds.',
    spaceComplexity: data.spaceComplexity || 'O(1) - Memory allocation analysis.',
    lineExplanations: normalizedBlocks,
    isAI: true,
  };
}

/**
 * Generates a heuristic line-by-line explanation for offline / fallback mode.
 */
function generateHeuristicExplanation(lines, language) {
  const blocks = [];

  // Process code in chunks of 2-5 lines
  const chunkSize = Math.max(2, Math.ceil(lines.length / 5));

  for (let i = 0; i < lines.length; i += chunkSize) {
    const end = Math.min(lines.length, i + chunkSize);
    const chunkLines = lines.slice(i, end);
    const chunkText = chunkLines.join('\n');

    let title = `Lines ${i + 1} to ${end}: Code Execution Block`;
    let explanation = `Executes lines ${i + 1} through ${end}. `;
    const concepts = [];

    if (/function|def|public|class|fn\s+/i.test(chunkText)) {
      title = `Lines ${i + 1}-${end}: Subroutine & Signature Declaration`;
      explanation += `Defines the function entry point and formal parameters in ${language.toUpperCase()}.`;
      concepts.push('Function Scope', 'Parameters');
    } else if (/if|else|switch|case/i.test(chunkText)) {
      title = `Lines ${i + 1}-${end}: Conditional Decision Branching`;
      explanation += `Evaluates boolean condition(s) and routes program control flow based on truthiness or boundary checks.`;
      concepts.push('Branching', 'Conditionals');
    } else if (/for|while|loop|foreach/i.test(chunkText)) {
      title = `Lines ${i + 1}-${end}: Iterative Control Loop`;
      explanation += `Repeatedly processes data sequence or state until loop termination condition is satisfied.`;
      concepts.push('Iteration', 'Loop Invariant');
    } else if (/return|yield/i.test(chunkText)) {
      title = `Lines ${i + 1}-${end}: Result Return & Stack Unwinding`;
      explanation += `Finalizes computation, passes result back to caller, and releases local stack frame.`;
      concepts.push('Return Value', 'Control Flow');
    } else {
      explanation += `Performs local variable assignments, computation operations, or memory reference updates.`;
      concepts.push('State Mutation');
    }

    blocks.push({
      id: `block-${blocks.length + 1}`,
      startLine: i + 1,
      endLine: end,
      title,
      explanation,
      keyConcepts: concepts,
    });
  }

  return {
    summary: `Heuristic Code Explanation: This ${language.toUpperCase()} script consists of ${lines.length} line(s) performing conditional logic, state updates, and algorithmic computation.`,
    timeComplexity: `O(N) — Linear time bound (Heuristic Estimate).`,
    spaceComplexity: `O(1) — Auxiliary space bound (Heuristic Estimate).`,
    lineExplanations: blocks,
    isAI: false,
  };
}
