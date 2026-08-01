/**
 * pages/tools/code-explainer/code-explainer.js
 * AI Code Explainer Client Logic & Interactive Line Highlighting
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const codeEditorInput = document.getElementById('codeEditorInput');
  const lineNumbersGutter = document.getElementById('lineNumbersGutter');
  const languageSelect = document.getElementById('languageSelect');
  const sampleCodeSelect = document.getElementById('sampleCodeSelect');
  const clearEditorBtn = document.getElementById('clearEditorBtn');
  const explainSubmitBtn = document.getElementById('explainSubmitBtn');

  const lineCountDisplay = document.getElementById('lineCountDisplay');
  const charCountDisplay = document.getElementById('charCountDisplay');

  const emptyExplanationState = document.getElementById('emptyExplanationState');
  const loadingExplanationState = document.getElementById('loadingExplanationState');
  const activeExplanationOutput = document.getElementById('activeExplanationOutput');

  const algorithmSummaryText = document.getElementById('algorithmSummaryText');
  const timeComplexityVal = document.getElementById('timeComplexityVal');
  const spaceComplexityVal = document.getElementById('spaceComplexityVal');
  const lineExplanationList = document.getElementById('lineExplanationList');
  const aiBadge = document.getElementById('aiBadge');

  let currentExplanations = [];

  // Preset Sample Algorithms
  const SAMPLES = {
    binary_search: {
      lang: 'javascript',
      code: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) {
      return mid; // Target found
    }
    if (arr[mid] < target) {
      left = mid + 1; // Search right half
    } else {
      right = mid - 1; // Search left half
    }
  }

  return -1; // Target not found
}`,
    },
    quick_sort: {
      lang: 'python',
      code: `def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
            
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1`,
    },
    two_sum: {
      lang: 'java',
      code: `public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();
    
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (map.containsKey(complement)) {
            return new int[] { map.get(complement), i };
        }
        map.put(nums[i], i);
    }
    
    return new int[] {};
}`,
    },
    lru_cache: {
      lang: 'cpp',
      code: `struct Node {
    int key, value;
    Node* prev;
    Node* next;
    Node(int k, int v) : key(k), value(v), prev(nullptr), next(nullptr) {}
};`,
    },
  };

  // Update Line Numbers Gutter & Stats
  function updateEditorMetrics() {
    const text = codeEditorInput.value;
    const lines = text.split('\n');
    const lineCount = lines.length;

    // Render Line Numbers
    let gutterHTML = '';
    for (let i = 1; i <= lineCount; i++) {
      gutterHTML += `<div class="line-number-item" data-line="${i}">${i}</div>`;
    }
    lineNumbersGutter.innerHTML = gutterHTML;

    // Update Counters
    lineCountDisplay.innerHTML = `<i class="fas fa-bars"></i> ${lineCount} Line${lineCount !== 1 ? 's' : ''}`;
    charCountDisplay.innerHTML = `<i class="fas fa-font"></i> ${text.length} Char${text.length !== 1 ? 's' : ''}`;
  }

  // Sync Scrolling between Textarea & Gutter
  codeEditorInput.addEventListener('scroll', () => {
    lineNumbersGutter.scrollTop = codeEditorInput.scrollTop;
  });

  // Event Listeners for Editor
  codeEditorInput.addEventListener('input', updateEditorMetrics);

  languageSelect.addEventListener('change', () => {
    sampleCodeSelect.value = '';
  });

  sampleCodeSelect.addEventListener('change', () => {
    const key = sampleCodeSelect.value;
    if (key && SAMPLES[key]) {
      const sample = SAMPLES[key];
      languageSelect.value = sample.lang;
      codeEditorInput.value = sample.code;
      updateEditorMetrics();
    }
  });

  clearEditorBtn.addEventListener('click', () => {
    codeEditorInput.value = '';
    sampleCodeSelect.value = '';
    updateEditorMetrics();
    showState('empty');
  });

  // Highlight Lines in Editor Gutter
  function highlightEditorLines(startLine, endLine) {
    const lineItems = lineNumbersGutter.querySelectorAll('.line-number-item');
    lineItems.forEach((item) => {
      const lineNum = parseInt(item.getAttribute('data-line'), 10);
      if (lineNum >= startLine && lineNum <= endLine) {
        item.classList.add('line-highlight-active');
      } else {
        item.classList.remove('line-highlight-active');
      }
    });
  }

  function clearLineHighlights() {
    const lineItems = lineNumbersGutter.querySelectorAll('.line-number-item');
    lineItems.forEach((item) => item.classList.remove('line-highlight-active'));
  }

  // Highlight Card in Explanation Pane
  function highlightExplanationCard(cardId) {
    const cards = lineExplanationList.querySelectorAll('.explanation-card-block');
    cards.forEach((card) => {
      if (card.getAttribute('data-card-id') === cardId) {
        card.classList.add('card-highlight-active');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        card.classList.remove('card-highlight-active');
      }
    });
  }

  function clearCardHighlights() {
    const cards = lineExplanationList.querySelectorAll('.explanation-card-block');
    cards.forEach((card) => card.classList.remove('card-highlight-active'));
  }

  // Bind Gutter Click Handler
  lineNumbersGutter.addEventListener('click', (e) => {
    const item = e.target.closest('.line-number-item');
    if (!item) return;

    const lineNum = parseInt(item.getAttribute('data-line'), 10);
    // Find explanation block containing lineNum
    const matched = currentExplanations.find((b) => lineNum >= b.startLine && lineNum <= b.endLine);

    if (matched) {
      highlightEditorLines(matched.startLine, matched.endLine);
      highlightExplanationCard(matched.id);
    }
  });

  // Switch UI Pane States
  function showState(state) {
    emptyExplanationState.style.display = state === 'empty' ? 'flex' : 'none';
    loadingExplanationState.style.display = state === 'loading' ? 'flex' : 'none';
    activeExplanationOutput.style.display = state === 'active' ? 'block' : 'none';
  }

  // Handle Explain Submit
  async function handleExplainCode() {
    const code = codeEditorInput.value.trim();
    const language = languageSelect.value;

    if (!code) {
      alert('Please paste or write some code to explain.');
      return;
    }

    explainSubmitBtn.disabled = true;
    showState('loading');

    try {
      const response = await fetch('/api/explain-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      renderExplanations(data);
      showState('active');
    } catch (err) {
      console.error('Explanation request failed:', err);
      alert('Failed to generate code explanation: ' + err.message);
      showState('empty');
    } finally {
      explainSubmitBtn.disabled = false;
    }
  }

  // Render Explanation Results
  function renderExplanations(data) {
    algorithmSummaryText.textContent = data.summary || 'Code logic summary.';
    timeComplexityVal.textContent = data.timeComplexity || 'O(N)';
    spaceComplexityVal.textContent = data.spaceComplexity || 'O(1)';

    if (data.isAI === false) {
      aiBadge.innerHTML = `<i class="fas fa-bolt"></i> Heuristic Mode`;
      aiBadge.style.color = '#f59e0b';
      aiBadge.style.background = 'rgba(245, 158, 11, 0.15)';
    } else {
      aiBadge.innerHTML = `<i class="fas fa-microchip"></i> AI Powered`;
      aiBadge.style.color = '#a78bfa';
      aiBadge.style.background = 'rgba(139, 92, 246, 0.15)';
    }

    currentExplanations = data.lineExplanations || [];
    lineExplanationList.innerHTML = '';

    currentExplanations.forEach((block) => {
      const card = document.createElement('div');
      card.className = 'explanation-card-block';
      card.setAttribute('data-card-id', block.id);

      const lineText =
        block.startLine === block.endLine
          ? `Line ${block.startLine}`
          : `Lines ${block.startLine} - ${block.endLine}`;

      const tagsHTML = (block.keyConcepts || [])
        .map((tag) => `<span class="concept-chip">${tag}</span>`)
        .join('');

      card.innerHTML = `
        <div class="block-header">
          <span class="line-range-badge"><i class="fas fa-code-commit"></i> ${lineText}</span>
        </div>
        <div class="block-title">${escapeHTML(block.title)}</div>
        <div class="block-explanation">${escapeHTML(block.explanation)}</div>
        ${tagsHTML ? `<div class="concept-tags">${tagsHTML}</div>` : ''}
      `;

      // Card hover/click interactions
      card.addEventListener('mouseenter', () => {
        highlightEditorLines(block.startLine, block.endLine);
        highlightExplanationCard(block.id);
      });

      card.addEventListener('mouseleave', () => {
        clearLineHighlights();
        clearCardHighlights();
      });

      card.addEventListener('click', () => {
        highlightEditorLines(block.startLine, block.endLine);
        highlightExplanationCard(block.id);
      });

      lineExplanationList.appendChild(card);
    });
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  explainSubmitBtn.addEventListener('click', handleExplainCode);

  // Check for auto-load payload from Code Playground or URL
  function checkAutoLoadPayload() {
    try {
      const stored = localStorage.getItem('explain_code_data');
      if (stored) {
        localStorage.removeItem('explain_code_data');
        const parsed = JSON.parse(stored);
        if (parsed && parsed.code) {
          codeEditorInput.value = parsed.code;
          if (
            parsed.lang &&
            ['javascript', 'python', 'java', 'cpp', 'go', 'rust'].includes(
              parsed.lang.toLowerCase()
            )
          ) {
            languageSelect.value = parsed.lang.toLowerCase();
          }
          updateEditorMetrics();
          handleExplainCode();
          return;
        }
      }

      // Check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const codeParam = urlParams.get('code');
      const langParam = urlParams.get('lang');

      if (codeParam) {
        codeEditorInput.value = codeParam;
        if (langParam) languageSelect.value = langParam;
        updateEditorMetrics();
        handleExplainCode();
        return;
      }
    } catch (e) {
      console.warn('Auto load payload error:', e);
    }

    // Default sample if empty
    codeEditorInput.value = SAMPLES.binary_search.code;
    updateEditorMetrics();
  }

  // Initialize page
  checkAutoLoadPayload();
});
