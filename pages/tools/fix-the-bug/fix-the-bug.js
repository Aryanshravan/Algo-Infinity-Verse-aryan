/* ============================================================
   Fix the Bug — Debugging Challenge Tool
   Core logic: snippet loading, filtering, code display,
   line selection, answer checking, XP/streak/stats tracking.
   ============================================================ */

const FixTheBug = (() => {
  'use strict';

  // ─── Constants ──────────────────────────────────────────────
  const STORAGE_KEY = 'fixTheBug_progress';
  const DIFFICULTY_NAMES = ['', 'Beginner', 'Easy', 'Medium', 'Hard', 'Advanced'];
  const BUG_TYPE_LABELS = {
    'off-by-one': 'Off-by-One',
    'null-reference': 'Null Reference',
    'infinite-loop': 'Infinite Loop',
    'wrong-operator': 'Wrong Operator',
    'logic-error': 'Logic Error',
    'type-error': 'Type Error',
    'uninitialized-variable': 'Uninitialized Var',
    'edge-case': 'Edge Case',
    'mutation-bug': 'Mutation Bug',
    'async-bug': 'Async Bug',
    'integer-overflow': 'Integer Overflow',
    'memory-leak': 'Memory Leak'
  };
  const LANGUAGE_LABELS = {
    javascript: 'JavaScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++'
  };
  const XP_PER_DIFFICULTY = [0, 10, 15, 25, 40, 60];

  // ─── State ──────────────────────────────────────────────────
  let state = {
    snippets: [],
    filteredSnippets: [],
    currentIndex: 0,
    selectedLine: -1,
    streak: 0,
    bestStreak: 0,
    totalAttempts: 0,
    correctCount: 0,
    xpEarned: 0,
    solvedIds: [],
    hinted: false,
    answered: false,
    lastActiveDate: ''
  };

  // Language breakdown stats
  let langStats = {};
  let bugTypeStats = {};
  let difficultyStats = {};

  // DOM refs (cached)
  let els = {};

  // ─── Initialization ─────────────────────────────────────────
  function init() {
    // Guard: don't init twice
    if (init._done) return;
    init._done = true;

    cacheElements();
    if (!els.container) return; // Not on the right page

    loadState();
    loadSnippets();
    bindEvents();
    applyFilters();
    renderCurrentChallenge();
    renderStats();
    renderBreakdowns();
  }

  function cacheElements() {
    els = {
      container: document.getElementById('ftb-main'),
      codeViewport: document.getElementById('ftbCodeViewport'),
      submitBtn: document.getElementById('ftbSubmitBtn'),
      hintBtn: document.getElementById('ftbHintBtn'),
      skipBtn: document.getElementById('ftbSkipBtn'),
      nextBtn: document.getElementById('ftbNextBtn'),
      challengeTitle: document.getElementById('ftbChallengeTitle'),
      challengeLabel: document.getElementById('ftbChallengeLabel'),
      diffBadge: document.getElementById('ftbDiffBadge'),
      langTag: document.getElementById('ftbLangTag'),
      bugTypeTag: document.getElementById('ftbBugTypeTag'),
      challengeActive: document.getElementById('ftbChallengeActive'),
      resultPanel: document.getElementById('ftbResultPanel'),
      emptyState: document.getElementById('ftbEmptyState'),
      resultIcon: document.getElementById('ftbResultIcon'),
      resultTitle: document.getElementById('ftbResultTitle'),
      resultExplanation: document.getElementById('ftbResultExplanation'),
      fixCode: document.getElementById('ftbFixCode'),
      resultXP: document.getElementById('ftbResultXP'),
      resultCorrectCount: document.getElementById('ftbResultCorrectCount'),
      mcSection: document.getElementById('ftbMcSection'),
      mcOptions: document.getElementById('ftbMcOptions'),
      showMcBtn: document.getElementById('ftbShowMcBtn'),
      filterLang: document.getElementById('ftbFilterLang'),
      filterBugType: document.getElementById('ftbFilterBugType'),
      filterDiff: document.getElementById('ftbFilterDiff'),
      resetFilters: document.getElementById('ftbResetFilters'),
      emptyReset: document.getElementById('ftbEmptyReset'),
      // Stat values
      streakValue: document.getElementById('ftbStreakValue'),
      accuracyValue: document.getElementById('ftbAccuracyValue'),
      xpValue: document.getElementById('ftbXPValue'),
      solvedValue: document.getElementById('ftbSolvedValue'),
      totalAttempts: document.getElementById('ftbTotalAttempts'),
      totalCorrect: document.getElementById('ftbTotalCorrect'),
      bestStreak: document.getElementById('ftbBestStreak'),
      difficultyBreakdown: document.getElementById('ftbDifficultyBreakdown'),
      langBreakdown: document.getElementById('ftbLangBreakdown'),
      bugTypeBreakdown: document.getElementById('ftbBugTypeBreakdown')
    };
  }

  // ─── State Persistence ──────────────────────────────────────
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Restore main state (excluding volatile UI fields)
        const mainState = parsed.state || parsed;
        Object.assign(state, mainState);
        // Restore breakdown stats if saved
        if (parsed.langStats) langStats = parsed.langStats;
        if (parsed.bugTypeStats) bugTypeStats = parsed.bugTypeStats;
        if (parsed.difficultyStats) difficultyStats = parsed.difficultyStats;
        // Reset streak if inactive for > 1 day
        if (state.lastActiveDate) {
          const lastDate = new Date(state.lastActiveDate);
          const today = new Date();
          const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
          if (diffDays > 1) {
            state.streak = 0;
          }
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
  }

  function saveState() {
    try {
      state.lastActiveDate = new Date().toISOString().split('T')[0];
      // Persist main state + breakdown stats — exclude volatile/reconstructable arrays
      const persisted = {
        state: { ...state, snippets: [], filteredSnippets: [] },
        langStats: langStats,
        bugTypeStats: bugTypeStats,
        difficultyStats: difficultyStats
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch (e) {
      // Ignore storage errors
    }
  }

  // ─── Snippet Loading & Filtering ────────────────────────────
  function loadSnippets() {
    if (typeof BUGGY_SNIPPETS !== 'undefined' && Array.isArray(BUGGY_SNIPPETS)) {
      state.snippets = BUGGY_SNIPPETS;
    } else {
      state.snippets = [];
    }
  }

  function applyFilters() {
    const lang = els.filterLang ? els.filterLang.value : 'all';
    const bugType = els.filterBugType ? els.filterBugType.value : 'all';
    const diff = els.filterDiff ? parseInt(els.filterDiff.value, 10) : 0;

    state.filteredSnippets = state.snippets.filter(s => {
      if (lang !== 'all' && s.language !== lang) return false;
      if (bugType !== 'all' && s.bugType !== bugType) return false;
      if (diff > 0 && s.difficulty !== diff) return false;
      return true;
    });

    // Reset index if needed
    if (state.currentIndex >= state.filteredSnippets.length) {
      state.currentIndex = 0;
    }
    if (state.filteredSnippets.length === 0) {
      state.currentIndex = -1;
    }

    renderCurrentChallenge();
  }

  // ─── Challenge Rendering ────────────────────────────────────
  function renderCurrentChallenge() {
    // Reset UI state for new challenge
    state.selectedLine = -1;
    state.answered = false;
    state.hinted = false;

    if (els.resultPanel) els.resultPanel.classList.add('hidden');
    if (els.mcSection) els.mcSection.style.display = 'none';
    if (els.showMcBtn) els.showMcBtn.style.display = 'inline-flex';

    if (!els.challengeActive || !els.emptyState) return;

    if (state.filteredSnippets.length === 0) {
      els.challengeActive.style.display = 'none';
      els.emptyState.classList.remove('hidden');
      updateStatsUI();
      return;
    }

    els.challengeActive.style.display = 'block';
    els.emptyState.classList.add('hidden');

    const snippet = state.filteredSnippets[state.currentIndex];
    if (!snippet) return;

    renderSnippet(snippet);
    renderMultipleChoice(snippet);
    updateStatsUI();
  }

  function renderSnippet(snippet) {
    const label = `Challenge #${state.currentIndex + 1} of ${state.filteredSnippets.length}`;
    if (els.challengeLabel) els.challengeLabel.textContent = label;
    if (els.challengeTitle) els.challengeTitle.textContent = snippet.title;

    // Difficulty badge
    const diffName = DIFFICULTY_NAMES[snippet.difficulty] || 'Unknown';
    if (els.diffBadge) {
      els.diffBadge.textContent = diffName;
      els.diffBadge.setAttribute('data-level', String(snippet.difficulty));
    }

    // Tags
    const langLabel = LANGUAGE_LABELS[snippet.language] || snippet.language;
    const bugLabel = BUG_TYPE_LABELS[snippet.bugType] || snippet.bugType;
    if (els.langTag) els.langTag.textContent = langLabel;
    if (els.bugTypeTag) els.bugTypeTag.textContent = bugLabel;

    // Code lines
    if (els.codeViewport) {
      els.codeViewport.innerHTML = '';
      const lines = snippet.code || [];
      lines.forEach((lineContent, idx) => {
        const lineEl = document.createElement('div');
        lineEl.className = 'ftb-code-line';
        lineEl.dataset.lineIndex = idx;
        lineEl.setAttribute('role', 'button');
        lineEl.setAttribute('tabindex', '0');
        lineEl.setAttribute('aria-label', `Line ${idx + 1}: ${lineContent || 'blank'}`);

        const numEl = document.createElement('span');
        numEl.className = 'ftb-line-number';
        numEl.textContent = String(idx + 1).padStart(2, ' ');
        numEl.setAttribute('aria-hidden', 'true');

        const contentEl = document.createElement('span');
        contentEl.className = 'ftb-line-content';
        contentEl.textContent = lineContent || ' ';

        lineEl.appendChild(numEl);
        lineEl.appendChild(contentEl);
        lineEl.style.animationDelay = `${idx * 30}ms`;
        els.codeViewport.appendChild(lineEl);
      });
    }

    // Reset submit button
    if (els.submitBtn) {
      els.submitBtn.disabled = true;
      els.submitBtn.innerHTML = '<i class="fas fa-check"></i> Submit Answer';
    }
    // Enable hint button
    if (els.hintBtn) {
      els.hintBtn.disabled = false;
      els.hintBtn.innerHTML = '<i class="fas fa-lightbulb"></i> Hint <span class="ftb-hint-cost">(-5 XP)</span>';
    }
  }

  function renderMultipleChoice(snippet) {
    if (!els.mcOptions || !snippet.multipleChoice) return;
    els.mcOptions.innerHTML = '';

    snippet.multipleChoice.forEach((choice, idx) => {
      const optionEl = document.createElement('div');
      optionEl.className = 'ftb-mc-option';
      optionEl.dataset.mcIndex = idx;

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'ftb-mc';
      radio.value = String(idx);
      radio.id = `ftb-mc-${idx}`;
      radio.setAttribute('aria-label', `Option ${idx + 1}: ${choice}`);

      const label = document.createElement('label');
      label.htmlFor = `ftb-mc-${idx}`;
      label.textContent = choice;

      optionEl.appendChild(radio);
      optionEl.appendChild(label);
      els.mcOptions.appendChild(optionEl);
    });
  }

  // ─── Line Selection ─────────────────────────────────────────
  function selectLine(index) {
    if (state.answered) return;

    state.selectedLine = index;
    const lines = els.codeViewport ? els.codeViewport.querySelectorAll('.ftb-code-line') : [];

    lines.forEach((line, idx) => {
      line.classList.toggle('selected', idx === index);
      line.setAttribute('aria-selected', idx === index ? 'true' : 'false');
    });

    if (els.submitBtn) {
      els.submitBtn.disabled = false;
    }
  }

  // ─── Answer Submission ──────────────────────────────────────
  function submitAnswer() {
    if (state.answered) return;

    const snippet = state.filteredSnippets[state.currentIndex];
    if (!snippet) return;

    const isMcMode = els.mcSection && els.mcSection.style.display !== 'none';

    if (isMcMode) {
      // MC mode: check the radio button selection independently
      const selectedRadio = els.mcOptions
        ? els.mcOptions.querySelector('input[type="radio"]:checked')
        : null;
      if (!selectedRadio) {
        showToast('Please select an answer first.', 'info');
        return;
      }
      const mcIdx = parseInt(selectedRadio.value, 10);
      const mcCorrect = mcIdx === snippet.correctChoice;
      processAnswer(mcCorrect, snippet);
      return;
    }

    // Line selection mode
    if (state.selectedLine < 0) {
      showToast('Click a line to select the bug.', 'info');
      return;
    }

    const isCorrect = state.selectedLine === snippet.buggyLine;
    processAnswer(isCorrect, snippet);
  }

  function processAnswer(isCorrect, snippet) {
    state.answered = true;
    state.totalAttempts++;

    if (isCorrect) {
      state.streak++;
      state.correctCount++;
      if (state.streak > state.bestStreak) {
        state.bestStreak = state.streak;
      }
      const baseXP = XP_PER_DIFFICULTY[snippet.difficulty] || 10;
      const streakBonus = Math.min(state.streak * 2, 20);
      const earnedXP = baseXP + (state.hinted ? 0 : streakBonus);
      state.xpEarned += earnedXP;

      // Track solved
      if (!state.solvedIds.includes(snippet.id)) {
        state.solvedIds.push(snippet.id);
      }

      // Language stats
      if (!langStats[snippet.language]) langStats[snippet.language] = { correct: 0, total: 0 };
      langStats[snippet.language].correct++;
      langStats[snippet.language].total++;

      // Bug type stats
      if (!bugTypeStats[snippet.bugType]) bugTypeStats[snippet.bugType] = { correct: 0, total: 0 };
      bugTypeStats[snippet.bugType].correct++;
      bugTypeStats[snippet.bugType].total++;

      // Difficulty stats
      if (!difficultyStats[snippet.difficulty]) difficultyStats[snippet.difficulty] = { correct: 0, total: 0 };
      difficultyStats[snippet.difficulty].correct++;
      difficultyStats[snippet.difficulty].total++;

      showResult(true, snippet, earnedXP);
    } else {
      state.streak = 0;

      // Track attempts even if wrong
      if (!langStats[snippet.language]) langStats[snippet.language] = { correct: 0, total: 0 };
      langStats[snippet.language].total++;
      if (!bugTypeStats[snippet.bugType]) bugTypeStats[snippet.bugType] = { correct: 0, total: 0 };
      bugTypeStats[snippet.bugType].total++;
      if (!difficultyStats[snippet.difficulty]) difficultyStats[snippet.difficulty] = { correct: 0, total: 0 };
      difficultyStats[snippet.difficulty].total++;

      showResult(false, snippet, 0);
    }

    highlightBugLines(snippet);
    updateStatsUI();
    saveState();
  }

  function highlightBugLines(snippet) {
    const lines = els.codeViewport ? els.codeViewport.querySelectorAll('.ftb-code-line') : [];

    lines.forEach((line, idx) => {
      line.classList.remove('selected', 'correct-highlight', 'wrong-highlight', 'bug-highlight');
      line.removeAttribute('aria-selected');

      if (idx === snippet.buggyLine) {
        line.classList.add('bug-highlight');
      }

      if (idx === state.selectedLine) {
        if (state.selectedLine === snippet.buggyLine) {
          line.classList.add('correct-highlight');
        } else {
          line.classList.add('wrong-highlight');
        }
      }
    });
  }

  // ─── Result Display ─────────────────────────────────────────
  function showResult(isCorrect, snippet, earnedXP) {
    if (!els.resultPanel || !els.challengeActive) return;

    if (els.resultIcon) {
      els.resultIcon.className = 'ftb-result-icon ' + (isCorrect ? 'correct' : 'wrong');
      els.resultIcon.innerHTML = isCorrect
        ? '<i class="fas fa-check-circle"></i>'
        : '<i class="fas fa-times-circle"></i>';
    }
    if (els.resultTitle) {
      els.resultTitle.textContent = isCorrect ? 'Correct!' : 'Not quite';
    }
    if (els.resultExplanation) {
      els.resultExplanation.textContent = snippet.explanation;
    }
    if (els.fixCode) {
      els.fixCode.textContent = snippet.fixCode;
    }
    if (els.resultXP) {
      const xpText = isCorrect ? `+${earnedXP} XP` : '+0 XP';
      els.resultXP.textContent = xpText;
    }
    if (els.resultCorrectCount) {
      els.resultCorrectCount.textContent = `${state.streak} in a row`;
    }

    els.resultPanel.classList.remove('hidden');
    els.resultPanel.classList.add(isCorrect ? 'ftb-result-correct' : 'ftb-result-wrong');

    if (els.submitBtn) els.submitBtn.disabled = true;
    if (els.hintBtn) els.hintBtn.disabled = true;

    // Highlight correct MC option
    if (els.mcSection && els.mcSection.style.display !== 'none') {
      const options = els.mcOptions ? els.mcOptions.querySelectorAll('.ftb-mc-option') : [];
      options.forEach((opt, idx) => {
        opt.classList.remove('selected', 'correct-mc', 'wrong-mc');
        if (idx === snippet.correctChoice) {
          opt.classList.add('correct-mc');
        }
        const radio = opt.querySelector('input[type="radio"]');
        if (radio && radio.checked && idx !== snippet.correctChoice) {
          opt.classList.add('wrong-mc');
        }
        if (radio) radio.disabled = true;
      });
    }

    // Float XP animation
    if (isCorrect && earnedXP > 0) {
      showXPFloat(earnedXP);
    }
  }

  function showXPFloat(amount) {
    const el = document.createElement('div');
    el.className = 'ftb-xp-float';
    el.textContent = `+${amount} XP`;
    el.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'DM Serif Display', serif;
      font-size: 2rem;
      font-weight: 700;
      color: var(--ftb-sage);
      pointer-events: none;
      z-index: 9999;
      animation: ftbXPFloat 1.2s ease-out forwards;
    `;
    document.body.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1300);
  }

  // ─── Hint ───────────────────────────────────────────────────
  function showHint() {
    if (state.answered || state.hinted) return;

    const snippet = state.filteredSnippets[state.currentIndex];
    if (!snippet) return;

    state.hinted = true;
    state.xpEarned = Math.max(0, state.xpEarned - 5);

    showToast(`💡 Hint: ${snippet.hint}`, 'info');

    if (els.hintBtn) {
      els.hintBtn.disabled = true;
      els.hintBtn.innerHTML = '<i class="fas fa-lightbulb"></i> Hint used';
    }

    // Highlight the buggy line with a subtle pulse
    const lines = els.codeViewport ? els.codeViewport.querySelectorAll('.ftb-code-line') : [];
    if (lines[snippet.buggyLine]) {
      lines[snippet.buggyLine].style.animation = 'ftbPulse 1s ease-in-out 2';
      setTimeout(() => {
        lines[snippet.buggyLine].style.animation = '';
      }, 2000);
    }

    updateStatsUI();
    saveState();
  }

  // ─── Navigation ─────────────────────────────────────────────
  function nextChallenge() {
    state.currentIndex++;
    if (state.currentIndex >= state.filteredSnippets.length) {
      state.currentIndex = 0;
    }
    renderCurrentChallenge();
    updateStatsUI();
    saveState();
  }

  function skipChallenge() {
    // Show the multiple choice section
    if (els.mcSection) {
      els.mcSection.style.display = 'block';
    }
    if (els.showMcBtn) {
      els.showMcBtn.style.display = 'none';
    }
    showToast('Select from the options below, or click a line in the code.', 'info');
  }

  // ─── Stats UI Update ────────────────────────────────────────
  function updateStatsUI() {
    const accuracy = state.totalAttempts > 0
      ? Math.round((state.correctCount / state.totalAttempts) * 100)
      : 0;
    const solvedCount = state.solvedIds.length;

    if (els.streakValue) els.streakValue.textContent = state.streak;
    if (els.accuracyValue) els.accuracyValue.textContent = `${accuracy}%`;
    if (els.xpValue) els.xpValue.textContent = state.xpEarned;
    if (els.solvedValue) els.solvedValue.textContent = solvedCount;
    if (els.totalAttempts) els.totalAttempts.textContent = state.totalAttempts;
    if (els.totalCorrect) els.totalCorrect.textContent = state.correctCount;
    if (els.bestStreak) els.bestStreak.textContent = state.bestStreak;
    if (els.difficultyBreakdown) {
      const highestDiff = state.solvedIds.length > 0 ? getHighestDifficulty() : 0;
      els.difficultyBreakdown.textContent = highestDiff > 0 ? DIFFICULTY_NAMES[highestDiff] : '—';
    }
  }

  function getHighestDifficulty() {
    let highest = 0;
    state.solvedIds.forEach(id => {
      const snippet = state.snippets.find(s => s.id === id);
      if (snippet && snippet.difficulty > highest) {
        highest = snippet.difficulty;
      }
    });
    return highest;
  }

  function renderStats() {
    updateStatsUI();
  }

  function renderBreakdowns() {
    // Language breakdown
    if (els.langBreakdown) {
      const langs = Object.keys(langStats);
      if (langs.length === 0) {
        els.langBreakdown.innerHTML = '<span class="ftb-breakdown-empty">Solve some challenges to see breakdown</span>';
      } else {
        const html = langs.map(lang => {
          const stat = langStats[lang];
          const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
          const label = LANGUAGE_LABELS[lang] || lang;
          return `<span class="ftb-breakdown-tag">${label}: ${stat.correct}/${stat.total} (${pct}%)</span>`;
        }).join('');
        els.langBreakdown.innerHTML = html;
      }
    }

    // Bug type breakdown
    if (els.bugTypeBreakdown) {
      const types = Object.keys(bugTypeStats);
      if (types.length === 0) {
        els.bugTypeBreakdown.innerHTML = '<span class="ftb-breakdown-empty">Solve some challenges to see breakdown</span>';
      } else {
        const html = types.map(type => {
          const stat = bugTypeStats[type];
          const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
          const label = BUG_TYPE_LABELS[type] || type;
          return `<span class="ftb-breakdown-tag">${label}: ${stat.correct}/${stat.total} (${pct}%)</span>`;
        }).join('');
        els.bugTypeBreakdown.innerHTML = html;
      }
    }
  }

  // ─── Toast Notification ─────────────────────────────────────
  function showToast(message, type) {
    // Try using the global notification system first
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type || 'info');
      return;
    }

    // Fallback inline toast
    const existingToast = document.querySelector('.ftb-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'ftb-toast';
    toast.setAttribute('role', 'alert');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(0);
      background: var(--ftb-surface);
      border: 1px solid var(--ftb-border);
      border-radius: 12px;
      padding: 0.75rem 1.25rem;
      font-size: 0.88rem;
      color: var(--ftb-text);
      box-shadow: var(--ftb-shadow-lg);
      z-index: 9999;
      max-width: 480px;
      text-align: center;
      animation: ftbSlideUp 0.3s ease-out;
      backdrop-filter: blur(8px);
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(8px)';
        toast.style.transition = 'opacity 0.3s, transform 0.3s';
        setTimeout(() => {
          if (toast.parentNode) toast.remove();
        }, 300);
      }
    }, 3000);
  }

  // ─── Event Binding ──────────────────────────────────────────
  function bindEvents() {
    // Line click (delegated)
    if (els.codeViewport) {
      els.codeViewport.addEventListener('click', (e) => {
        const lineEl = e.target.closest('.ftb-code-line');
        if (!lineEl) return;
        const index = parseInt(lineEl.dataset.lineIndex, 10);
        if (!isNaN(index)) selectLine(index);
      });

      // Keyboard nav for lines
      els.codeViewport.addEventListener('keydown', (e) => {
        const lineEl = e.target.closest('.ftb-code-line');
        if (!lineEl) return;

        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const index = parseInt(lineEl.dataset.lineIndex, 10);
          if (!isNaN(index)) selectLine(index);
        }
      });
    }

    // Submit
    if (els.submitBtn) {
      els.submitBtn.addEventListener('click', submitAnswer);
    }

    // Hint
    if (els.hintBtn) {
      els.hintBtn.addEventListener('click', showHint);
    }

    // Skip → show MC
    if (els.skipBtn) {
      els.skipBtn.addEventListener('click', skipChallenge);
    }

    // Show MC toggle
    if (els.showMcBtn) {
      els.showMcBtn.addEventListener('click', () => {
        if (els.mcSection) els.mcSection.style.display = 'block';
        if (els.showMcBtn) els.showMcBtn.style.display = 'none';
      });
    }

    // Next
    if (els.nextBtn) {
      els.nextBtn.addEventListener('click', nextChallenge);
    }

    // Filters
    if (els.filterLang) els.filterLang.addEventListener('change', applyFilters);
    if (els.filterBugType) els.filterBugType.addEventListener('change', applyFilters);
    if (els.filterDiff) els.filterDiff.addEventListener('change', applyFilters);

    // Reset filters
    if (els.resetFilters) {
      els.resetFilters.addEventListener('click', () => {
        if (els.filterLang) els.filterLang.value = 'all';
        if (els.filterBugType) els.filterBugType.value = 'all';
        if (els.filterDiff) els.filterDiff.value = '0';
        applyFilters();
      });
    }

    // Empty state reset
    if (els.emptyReset) {
      els.emptyReset.addEventListener('click', () => {
        if (els.filterLang) els.filterLang.value = 'all';
        if (els.filterBugType) els.filterBugType.value = 'all';
        if (els.filterDiff) els.filterDiff.value = '0';
        applyFilters();
      });
    }

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Don't handle if focus is in an input/select
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
      if (e.target.closest('.ftb-mc-section')) return;

      switch (e.key) {
        case 'Enter':
          if (!state.answered && state.selectedLine >= 0) {
            e.preventDefault();
            submitAnswer();
          } else if (state.answered) {
            e.preventDefault();
            nextChallenge();
          }
          break;
        case 'h':
        case 'H':
          if (!state.answered && !state.hinted) {
            e.preventDefault();
            showHint();
          }
          break;
        case 'n':
        case 'N':
          if (state.answered) {
            e.preventDefault();
            nextChallenge();
          }
          break;
      }
    });

    // MC option click (delegated)
    if (els.mcOptions) {
      els.mcOptions.addEventListener('click', (e) => {
        const optionEl = e.target.closest('.ftb-mc-option');
        if (!optionEl) return;
        const radio = optionEl.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          // Enable submit button
          if (els.submitBtn) els.submitBtn.disabled = false;
        }
      });
    }
  }

  // ─── Public API ─────────────────────────────────────────────
  return {
    init,
    nextChallenge,
    submitAnswer,
    skipChallenge,
    showHint,
    applyFilters,
    resetState: () => {
      state.streak = 0;
      state.totalAttempts = 0;
      state.correctCount = 0;
      state.xpEarned = 0;
      state.solvedIds = [];
      state.bestStreak = 0;
      langStats = {};
      bugTypeStats = {};
      difficultyStats = {};
      saveState();
      updateStatsUI();
      renderBreakdowns();
      showToast('Progress has been reset.', 'info');
    }
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof FixTheBug !== 'undefined' && FixTheBug.init) {
      setTimeout(FixTheBug.init, 100);
    }
  });
} else {
  setTimeout(() => {
    if (typeof FixTheBug !== 'undefined' && FixTheBug.init) {
      FixTheBug.init();
    }
  }, 100);
}
