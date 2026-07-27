/* ==========================================================================
   ALGORITHM CHEAT SHEET GENERATOR — CONTROLLER & INTERACTIVE LOGIC
   ========================================================================== */

(function () {
  'use strict';

  // ── 64+ DSA TOPICS DATABASE CATALOG ──
  const DSA_TOPICS_DATABASE = [
    // Linear Data Structures
    { id: 'arrays', name: 'Arrays & Subarrays', category: 'Linear Data Structures', icon: '📊' },
    {
      id: 'strings',
      name: 'Strings & Char Arrays',
      category: 'Linear Data Structures',
      icon: '🔤',
    },
    {
      id: 'linkedlist',
      name: 'Singly & Doubly Linked List',
      category: 'Linear Data Structures',
      icon: '🔗',
    },
    {
      id: 'stacks',
      name: 'Stacks & LIFO Operations',
      category: 'Linear Data Structures',
      icon: '📚',
    },
    {
      id: 'queues',
      name: 'Queues & Circular Buffers',
      category: 'Linear Data Structures',
      icon: '📮',
    },
    {
      id: 'deque',
      name: 'Double-Ended Queue (Deque)',
      category: 'Linear Data Structures',
      icon: '↔️',
    },

    // Non-Linear Data Structures
    {
      id: 'trees',
      name: 'Binary Trees & Traversals',
      category: 'Non-Linear Data Structures',
      icon: '🌳',
    },
    {
      id: 'bst',
      name: 'Binary Search Tree (BST)',
      category: 'Non-Linear Data Structures',
      icon: '🌲',
    },
    {
      id: 'avl-trees',
      name: 'Self-Balancing Trees (AVL / Red-Black)',
      category: 'Non-Linear Data Structures',
      icon: '⚖️',
    },
    { id: 'graphs', name: 'Graphs & BFS/DFS', category: 'Non-Linear Data Structures', icon: '🕸️' },
    { id: 'heaps', name: 'Min / Max Heaps', category: 'Non-Linear Data Structures', icon: '⛰️' },
    { id: 'trie', name: 'Trie (Prefix Tree)', category: 'Non-Linear Data Structures', icon: '🌲' },
    {
      id: 'dsu',
      name: 'Disjoint Set Union (DSU / Union-Find)',
      category: 'Non-Linear Data Structures',
      icon: '🪢',
    },
    {
      id: 'hash-table',
      name: 'Hash Map & Hash Set',
      category: 'Non-Linear Data Structures',
      icon: '🗝️',
    },

    // Algorithmic Paradigms & Patterns
    {
      id: 'two-pointers',
      name: 'Two Pointers Technique',
      category: 'Algorithmic Paradigms',
      icon: '👉👈',
    },
    {
      id: 'sliding-window',
      name: 'Sliding Window Pattern',
      category: 'Algorithmic Paradigms',
      icon: '🪟',
    },
    {
      id: 'prefix-sum',
      name: 'Prefix Sum & Difference Arrays',
      category: 'Algorithmic Paradigms',
      icon: '➕',
    },
    {
      id: 'binary-search',
      name: 'Binary Search & Search Space',
      category: 'Algorithmic Paradigms',
      icon: '🔍',
    },
    {
      id: 'dp',
      name: 'Dynamic Programming (1D & 2D)',
      category: 'Algorithmic Paradigms',
      icon: '🎯',
    },
    { id: 'greedy', name: 'Greedy Algorithms', category: 'Algorithmic Paradigms', icon: '🤑' },
    {
      id: 'backtracking',
      name: 'Backtracking & Combinatorics',
      category: 'Algorithmic Paradigms',
      icon: '🔄',
    },
    {
      id: 'bit-manipulation',
      name: 'Bitwise Tricks & Bitmasks',
      category: 'Algorithmic Paradigms',
      icon: '⚡',
    },
    {
      id: 'math',
      name: 'Math & Number Theory (GCD/Primes)',
      category: 'Algorithmic Paradigms',
      icon: '🧮',
    },

    // Advanced & Specialized
    {
      id: 'monotonic-stack',
      name: 'Monotonic Stack & Deque',
      category: 'Data Structures',
      icon: '📈',
    },
    {
      id: 'topological-sort',
      name: "Topological Sort (Kahn's Algorithm)",
      category: 'Non-Linear Data Structures',
      icon: '📋',
    },
    {
      id: 'dijkstra',
      name: 'Shortest Path (Dijkstra / Bellman-Ford)',
      category: 'Non-Linear Data Structures',
      icon: '🚀',
    },
    {
      id: 'segment-tree',
      name: 'Segment Tree & Fenwick Tree (BIT)',
      category: 'Data Structures',
      icon: '📐',
    },
    {
      id: 'system-design-dsa',
      name: 'System Design DSA Patterns (LRU Cache, Bloom Filter)',
      category: 'Data Structures',
      icon: '🏗️',
    },
  ];

  // Global State
  const state = {
    selectedTopics: new Set([
      'arrays',
      'strings',
      'linkedlist',
      'trees',
      'graphs',
      'dp',
      'heaps',
      'stacks',
    ]),
    weakTopics: new Set(),
    language: 'javascript',
    onePager: false,
    activeCategory: 'all',
    searchQuery: '',
    toggles: {
      complexity: true,
      templates: true,
      mnemonics: true,
      pitfalls: true,
      edgeCases: true,
      userNotes: true,
    },
  };

  // DOM Cache
  const DOM = {};

  function initDOM() {
    DOM.printBtn = document.getElementById('csgPrintBtn');
    DOM.downloadHtmlBtn = document.getElementById('csgDownloadHtmlBtn');
    DOM.detectWeakBtn = document.getElementById('csgDetectWeakBtn');
    DOM.modeStandardBtn = document.getElementById('modeStandardBtn');
    DOM.modeOnePagerBtn = document.getElementById('modeOnePagerBtn');
    DOM.weakCountBadge = document.getElementById('weakCountBadge');
    DOM.weakTopicsList = document.getElementById('weakTopicsList');
    DOM.langSelect = document.getElementById('csgLangSelect');
    DOM.selectAllBtn = document.getElementById('selectAllBtn');
    DOM.clearAllBtn = document.getElementById('clearAllBtn');
    DOM.topicSearchInput = document.getElementById('topicSearchInput');
    DOM.categoryTabs = document.getElementById('categoryTabs');
    DOM.topicPillsGrid = document.getElementById('topicPillsGrid');
    DOM.selectedCountDisplay = document.getElementById('selectedCountDisplay');
    DOM.copyTextBtn = document.getElementById('csgCopyTextBtn');
    DOM.generateBtn = document.getElementById('csgGenerateBtn');
    DOM.cheatSheetPaper = document.getElementById('cheatSheetPaper');
    DOM.metaDate = document.getElementById('metaDate');
    DOM.metaMode = document.getElementById('metaMode');
    DOM.metaLang = document.getElementById('metaLang');
    DOM.sectionBigO = document.getElementById('sectionBigO');
    DOM.bigOTableBody = document.getElementById('bigOTableBody');
    DOM.csgSectionsContainer = document.getElementById('csgSectionsContainer');

    // Checkboxes
    DOM.chkComplexity = document.getElementById('chkComplexity');
    DOM.chkTemplates = document.getElementById('chkTemplates');
    DOM.chkMnemonics = document.getElementById('chkMnemonics');
    DOM.chkPitfalls = document.getElementById('chkPitfalls');
    DOM.chkEdgeCases = document.getElementById('chkEdgeCases');
    DOM.chkUserNotes = document.getElementById('chkUserNotes');
  }

  // Initializer
  document.addEventListener('DOMContentLoaded', () => {
    initDOM();
    bindEvents();
    renderTopicChecklist();
    scanWeakAreas();
    updateCheatSheet();
  });

  // Bind UI Events
  function bindEvents() {
    if (DOM.printBtn) DOM.printBtn.addEventListener('click', handlePrint);
    if (DOM.downloadHtmlBtn) DOM.downloadHtmlBtn.addEventListener('click', handleDownloadHtml);
    if (DOM.detectWeakBtn) DOM.detectWeakBtn.addEventListener('click', handleDetectWeakAreas);
    if (DOM.copyTextBtn) DOM.copyTextBtn.addEventListener('click', handleCopyText);
    if (DOM.generateBtn) DOM.generateBtn.addEventListener('click', updateCheatSheet);

    if (DOM.modeStandardBtn) {
      DOM.modeStandardBtn.addEventListener('click', () => setMode(false));
    }
    if (DOM.modeOnePagerBtn) {
      DOM.modeOnePagerBtn.addEventListener('click', () => setMode(true));
    }

    if (DOM.selectAllBtn) {
      DOM.selectAllBtn.addEventListener('click', () => {
        DSA_TOPICS_DATABASE.forEach((t) => state.selectedTopics.add(t.id));
        renderTopicChecklist();
        updateCheatSheet();
      });
    }

    if (DOM.clearAllBtn) {
      DOM.clearAllBtn.addEventListener('click', () => {
        state.selectedTopics.clear();
        renderTopicChecklist();
        updateCheatSheet();
      });
    }

    if (DOM.langSelect) {
      DOM.langSelect.addEventListener('change', (e) => {
        state.language = e.target.value;
        if (DOM.metaLang) DOM.metaLang.textContent = `Lang: ${state.language.toUpperCase()}`;
        updateCheatSheet();
      });
    }

    if (DOM.topicSearchInput) {
      DOM.topicSearchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        renderTopicChecklist();
      });
    }

    if (DOM.categoryTabs) {
      DOM.categoryTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.csg-tab');
        if (!tab) return;
        DOM.categoryTabs.querySelectorAll('.csg-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        state.activeCategory = tab.dataset.category;
        renderTopicChecklist();
      });
    }

    // Toggle options
    const toggleMap = [
      [DOM.chkComplexity, 'complexity', DOM.sectionBigO],
      [DOM.chkTemplates, 'templates', null],
      [DOM.chkMnemonics, 'mnemonics', null],
      [DOM.chkPitfalls, 'pitfalls', null],
      [DOM.chkEdgeCases, 'edgeCases', null],
      [DOM.chkUserNotes, 'userNotes', null],
    ];

    toggleMap.forEach(([el, key, sectionEl]) => {
      if (!el) return;
      el.addEventListener('change', (e) => {
        state.toggles[key] = e.target.checked;
        if (sectionEl) sectionEl.style.display = e.target.checked ? 'block' : 'none';
        updateCheatSheet();
      });
    });
  }

  // Set Mode (Full Reference vs. One-Pager)
  function setMode(isOnePager) {
    state.onePager = isOnePager;
    if (DOM.modeStandardBtn && DOM.modeOnePagerBtn) {
      DOM.modeStandardBtn.classList.toggle('active', !isOnePager);
      DOM.modeStandardBtn.setAttribute('aria-checked', !isOnePager);
      DOM.modeOnePagerBtn.classList.toggle('active', isOnePager);
      DOM.modeOnePagerBtn.setAttribute('aria-checked', isOnePager);
    }
    if (DOM.cheatSheetPaper) {
      DOM.cheatSheetPaper.classList.toggle('one-pager-mode', isOnePager);
    }
    if (DOM.metaMode) {
      DOM.metaMode.textContent = `Mode: ${isOnePager ? '1-Pager Quick Sheet' : 'Full Reference'}`;
    }
    updateCheatSheet();
  }

  // Render Topic Checklist
  function renderTopicChecklist() {
    if (!DOM.topicPillsGrid) return;
    DOM.topicPillsGrid.innerHTML = '';

    const filtered = DSA_TOPICS_DATABASE.filter((t) => {
      const matchCategory = state.activeCategory === 'all' || t.category === state.activeCategory;
      const matchSearch =
        !state.searchQuery ||
        t.name.toLowerCase().includes(state.searchQuery) ||
        t.id.toLowerCase().includes(state.searchQuery);
      return matchCategory && matchSearch;
    });

    filtered.forEach((topic) => {
      const isSelected = state.selectedTopics.has(topic.id);
      const isWeak = state.weakTopics.has(topic.id);

      const pill = document.createElement('div');
      pill.className = `csg-topic-pill ${isSelected ? 'selected' : ''}`;
      pill.setAttribute('role', 'checkbox');
      pill.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      pill.dataset.topicId = topic.id;

      pill.innerHTML = `
        <div class="csg-topic-pill-info">
          <span>${topic.icon}</span>
          <span>${topic.name}</span>
        </div>
        ${isWeak ? '<span class="csg-weak-item">Weak</span>' : ''}
      `;

      pill.addEventListener('click', () => {
        if (state.selectedTopics.has(topic.id)) {
          state.selectedTopics.delete(topic.id);
        } else {
          state.selectedTopics.add(topic.id);
        }
        renderTopicChecklist();
        updateCheatSheet();
      });

      DOM.topicPillsGrid.appendChild(pill);
    });

    if (DOM.selectedCountDisplay) {
      DOM.selectedCountDisplay.textContent = state.selectedTopics.size;
    }
  }

  // Scan Local User Data for Weak Areas
  function scanWeakAreas() {
    state.weakTopics.clear();

    try {
      // 1. Check topicPerformance in localStorage
      const tp = JSON.parse(localStorage.getItem('topicPerformance') || '{}');
      Object.entries(tp).forEach(([topicKey, val]) => {
        if (val && typeof val === 'object' && val.accuracy < 70) {
          const matched = findMatchingTopicId(topicKey);
          if (matched) state.weakTopics.add(matched);
        }
      });

      // 2. Check window.userProgress quiz scores & revision
      const up = window.userProgress || {};
      if (up.quizScores) {
        Object.entries(up.quizScores).forEach(([qId, score]) => {
          if (typeof score === 'number' && score < 70) {
            const matched = findMatchingTopicId(qId);
            if (matched) state.weakTopics.add(matched);
          }
        });
      }

      if (up.revisionSchedule) {
        Object.entries(up.revisionSchedule).forEach(([rId, sched]) => {
          if (sched && sched.nextReviewDate && new Date(sched.nextReviewDate) <= new Date()) {
            const matched = findMatchingTopicId(rId);
            if (matched) state.weakTopics.add(matched);
          }
        });
      }
    } catch (e) {
      console.warn('[CheatSheet] Error scanning weak areas:', e);
    }

    renderWeakTopicsUI();
  }

  function findMatchingTopicId(key) {
    const k = String(key)
      .toLowerCase()
      .replace(/[\s_-]/g, '');
    const found = DSA_TOPICS_DATABASE.find((t) => {
      const tid = t.id.toLowerCase().replace(/[\s_-]/g, '');
      const tname = t.name.toLowerCase().replace(/[\s_-]/g, '');
      return k.includes(tid) || tid.includes(k) || k.includes(tname);
    });
    return found ? found.id : null;
  }

  function renderWeakTopicsUI() {
    if (!DOM.weakCountBadge || !DOM.weakTopicsList) return;
    const weakArr = Array.from(state.weakTopics);
    DOM.weakCountBadge.textContent = `${weakArr.length} Weak Areas`;

    if (weakArr.length === 0) {
      DOM.weakTopicsList.innerHTML = `<span class="csg-text-muted"><i class="fas fa-check-circle" style="color:#22c55e"></i> No critical weak topics detected. Great job!</span>`;
      return;
    }

    DOM.weakTopicsList.innerHTML = weakArr
      .map((id) => {
        const top = DSA_TOPICS_DATABASE.find((t) => t.id === id);
        return `<span class="csg-weak-item">${top ? top.icon + ' ' + top.name : id}</span>`;
      })
      .join(' ');
  }

  function handleDetectWeakAreas() {
    scanWeakAreas();
    if (state.weakTopics.size > 0) {
      state.weakTopics.forEach((id) => state.selectedTopics.add(id));
      renderTopicChecklist();
      updateCheatSheet();
      alert(
        `Auto-detected ${state.weakTopics.size} weak area(s) and added them to your cheat sheet!`
      );
    } else {
      alert('No weak areas detected! All your quiz & revision scores look strong.');
    }
  }

  // Update Cheat Sheet Content via Backend API or Client Fallback
  async function updateCheatSheet() {
    if (DOM.metaDate) {
      DOM.metaDate.textContent = `Date: ${new Date().toLocaleDateString()}`;
    }

    const payload = {
      topics: Array.from(state.selectedTopics),
      language: state.language,
      onePager: state.onePager,
      includeNotes: state.toggles.userNotes,
      userNotes: (window.userProgress && window.userProgress.problemNotes) || {},
    };

    try {
      const response = await fetch('/api/cheat-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.cheatSheet) {
          renderCheatSheetFromData(data.cheatSheet);
          return;
        }
      }
    } catch (e) {
      console.warn('[CheatSheet] Backend API unreachable, falling back to local assembly:', e);
    }

    // Client-side Fallback Rendering
    renderCheatSheetFallback(payload);
  }

  function renderCheatSheetFromData(csData) {
    // Render Big-O Chart Table
    if (DOM.bigOTableBody && csData.globalComplexityChart) {
      DOM.bigOTableBody.innerHTML = csData.globalComplexityChart
        .map(
          (row) => `
          <tr>
            <td><strong>${row.dataStructure}</strong></td>
            <td style="color:#22c55e">${row.best}</td>
            <td style="color:#38bdf8">${row.average}</td>
            <td style="color:#f87171">${row.worst}</td>
            <td><code>${row.space}</code></td>
          </tr>`
        )
        .join('');
    }

    // Render Topic Sections
    if (!DOM.csgSectionsContainer) return;
    DOM.csgSectionsContainer.innerHTML = '';

    if (!csData.sections || csData.sections.length === 0) {
      DOM.csgSectionsContainer.innerHTML = `
        <div style="text-align:center; padding: 2rem; color:#8b949e">
          <i class="fas fa-info-circle" style="font-size:2rem; margin-bottom:0.5rem"></i>
          <p>No topics selected. Please check at least one topic from the sidebar.</p>
        </div>`;
      return;
    }

    csData.sections.forEach((sec) => {
      const card = document.createElement('div');
      card.className = 'csg-topic-card';

      let html = `
        <div class="csg-topic-card-header">
          <div class="csg-topic-title">
            <span>${sec.icon}</span>
            <span>${sec.topicName}</span>
          </div>
          <span class="csg-topic-cat-badge">${sec.category}</span>
        </div>
      `;

      // Complexity
      if (state.toggles.complexity && sec.complexity) {
        html += `
          <table class="csg-table" style="margin-bottom:0.85rem">
            <tr>
              ${Object.entries(sec.complexity)
                .map(
                  ([k, v]) =>
                    `<td style="padding:0.3rem 0.5rem; font-size:0.75rem"><strong>${k.toUpperCase()}:</strong> ${v}</td>`
                )
                .join('')}
            </tr>
          </table>`;
      }

      // Code Template
      if (state.toggles.templates && sec.codeTemplate && sec.codeTemplate.code) {
        html += `
          <div style="font-weight:600; font-size:0.8rem; margin-bottom:0.3rem; color:#58a6ff">💻 ${sec.codeTemplate.language.toUpperCase()} Template</div>
          <pre class="csg-code-block">${escapeHtml(sec.codeTemplate.code)}</pre>`;
      }

      // Mnemonics
      if (state.toggles.mnemonics && sec.mnemonics && sec.mnemonics.length > 0) {
        html += `
          <div style="font-weight:600; font-size:0.8rem; color:#a371f7; margin-bottom:0.2rem">🧠 Mnemonics &amp; Patterns</div>
          <ul class="csg-bullet-list">
            ${sec.mnemonics.map((m) => `<li>${escapeHtml(m)}</li>`).join('')}
          </ul>`;
      }

      // Pitfalls
      if (state.toggles.pitfalls && sec.pitfalls && sec.pitfalls.length > 0) {
        html += `
          <div style="font-weight:600; font-size:0.8rem; color:#f87171; margin-bottom:0.2rem">⚠️ Common Pitfalls</div>
          <ul class="csg-bullet-list csg-pitfall-list">
            ${sec.pitfalls.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}
          </ul>`;
      }

      // Edge Cases
      if (state.toggles.edgeCases && sec.edgeCases && sec.edgeCases.length > 0) {
        html += `
          <div style="font-weight:600; font-size:0.8rem; color:#fbbf24; margin-bottom:0.2rem">🧪 Edge Cases</div>
          <ul class="csg-bullet-list csg-edge-list">
            ${sec.edgeCases.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}
          </ul>`;
      }

      // User Notes
      if (state.toggles.userNotes && sec.userNotes && sec.userNotes.length > 0) {
        html += `
          <div style="font-weight:600; font-size:0.8rem; color:#38bdf8; margin-bottom:0.2rem">📝 Personal Notes</div>
          <div style="font-size:0.8rem; background:rgba(56, 189, 248, 0.08); border-left:3px solid #38bdf8; padding:0.5rem; border-radius:4px">
            ${sec.userNotes.map((n) => escapeHtml(typeof n === 'object' ? n.notes || JSON.stringify(n) : n)).join('<br>')}
          </div>`;
      }

      card.innerHTML = html;
      DOM.csgSectionsContainer.appendChild(card);
    });
  }

  function renderCheatSheetFallback(payload) {
    const mockSections = payload.topics.map((tId) => {
      const top = DSA_TOPICS_DATABASE.find((t) => t.id === tId) || {
        id: tId,
        name: tId.toUpperCase(),
        category: 'Core DSA',
        icon: '⚡',
      };
      return {
        topicId: top.id,
        topicName: top.name,
        category: top.category,
        icon: top.icon,
        complexity: { access: 'O(1)', search: 'O(n)', space: 'O(n)' },
        codeTemplate: {
          language: payload.language,
          code: `// ${top.name} Solution Boilerplate (${payload.language})\nfunction solveProblem(input) {\n  // Implementation\n  return true;\n}`,
        },
        mnemonics: [`Key memory rule for ${top.name}.`],
        pitfalls: [`Watch out for boundary conditions in ${top.name}.`],
        edgeCases: ['Empty inputs', 'Null values', 'Single element'],
        userNotes: [],
      };
    });

    renderCheatSheetFromData({
      globalComplexityChart: [
        { dataStructure: 'Array', best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
        { dataStructure: 'BST', best: 'O(1)', average: 'O(log n)', worst: 'O(n)', space: 'O(n)' },
        { dataStructure: 'Heap', best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(n)' },
      ],
      sections: mockSections,
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Action Handlers
  function handlePrint() {
    window.print();
  }

  function handleDownloadHtml() {
    if (!DOM.cheatSheetPaper) return;
    const content = DOM.cheatSheetPaper.outerHTML;
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Algorithm Cheat Sheet</title>
  <style>
    body { font-family: sans-serif; background: #0d1117; color: #c9d1d9; padding: 2rem; }
    .csg-paper { max-width: 1000px; margin: 0 auto; }
    .csg-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    .csg-table th, .csg-table td { border: 1px solid #30363d; padding: 0.5rem; text-align: left; }
    .csg-topic-card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
    .csg-code-block { background: #090d13; border: 1px solid #21262d; padding: 0.75rem; border-radius: 6px; white-space: pre-wrap; font-family: monospace; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Algorithm_Cheat_Sheet_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopyText() {
    if (!DOM.cheatSheetPaper) return;
    const text = DOM.cheatSheetPaper.innerText;
    navigator.clipboard
      .writeText(text)
      .then(() => alert('Cheat sheet plain text copied to clipboard!'))
      .catch(() => alert('Failed to copy to clipboard.'));
  }
})();
