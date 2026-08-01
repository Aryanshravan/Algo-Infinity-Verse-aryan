/**
 * pages/practice/editor.js
 * Main entry point for the global code editor page.
 * Handles Monaco Editor initialization, problem loading, code execution, and results rendering.
 *
 * URL params: ?problemId=<id>&lang=<language>
 */

import { loadMonaco, getMonacoLanguage, preloadMonaco, setMonacoTheme } from '../../modules/monaco-loader.js';
import { getProblem, waitForData, migrateLegacyDraft } from '../../modules/problem-store.js';
import { getStarterCode, buildHarness, parseTestResults, getProblemSignature } from '../../modules/problem-templates.js';
import { executeProblem, getSupportedLanguages, saveDraft, clearDraft, saveExecution } from '../../modules/execution-client.js';
import { areKeyboardShortcutsEnabled } from '../../modules/shortcut-guard.js';

// ─── State ───
const state = {
  problem: null,
  editor: null,
  monaco: null,
  lang: 'javascript',
  running: false,
  submitted: false,
  theme: localStorage.getItem('editorMonacoTheme') || 'vs-dark',
  results: null,
  currentTab: 'description',
};

// ─── DOM refs (populated on DOMContentLoaded) ───
const $ = (id) => document.getElementById(id);
const dom = {};

function cacheDOM() {
  dom.loadingScreen = $('editorLoadingScreen');
  dom.app = $('editorApp');
  dom.monacoContainer = $('monacoEditor');
  dom.problemTitle = $('editorProblemTitle');
  dom.problemDifficulty = $('editorProblemDifficulty');
  dom.languageSelect = $('editorLanguageSelect');
  dom.runBtn = $('editorRunBtn');
  dom.submitBtn = $('editorSubmitBtn');
  dom.resetBtn = $('editorResetBtn');
  dom.themeBtn = $('editorThemeBtn');
  dom.backBtn = $('editorBackBtn');
  dom.cursorStatus = $('editorCursorStatus');
  dom.langStatus = $('editorLangStatus');
  dom.resizer = $('panelResizer');
  dom.resultsPanel = $('resultsPanel');
  dom.editorPanel = $('editorPanel');
  dom.tabDescription = $('resultsTabDescription');
  dom.tabTestcases = $('resultsTabTestcases');
  dom.tabOutput = $('resultsTabOutput');
  dom.contentDescription = $('resultsDescription');
  dom.contentTestCases = $('resultsTestCases');
  dom.contentOutput = $('resultsOutput');
  dom.testCasesContainer = $('testCasesContainer');
  dom.testCasesPassed = $('testCasesPassed');
  dom.testCasesTotal = $('testCasesTotal');
  dom.testCasesSummary = $('testCasesSummary');
  dom.outputContent = $('outputContent');
  dom.outputMetrics = $('outputMetrics');
  dom.cpuTime = $('cpuTime');
  dom.memUsage = $('memUsage');
  dom.metricsMemory = $('metricsMemory');
  dom.outputClearBtn = $('outputClearBtn');
  dom.outputBadge = $('outputBadge');
  dom.runningIndicator = $('runningIndicator');
  dom.runningIndicatorText = $('runningIndicatorText');
  dom.toastContainer = $('toastContainer');
  dom.resetModal = $('resetModal');
  dom.resetModalCancel = $('resetModalCancel');
  dom.resetModalConfirm = $('resetModalConfirm');
  dom.problemDescTitle = $('problemDescTitle');
  dom.problemTopicBadge = $('problemTopicBadge');
  dom.problemDifficultyBadge = $('problemDifficultyBadge');
  dom.problemAcceptance = $('problemAcceptance');
  dom.problemDescription = $('problemDescription');
  dom.problemConstraints = $('problemConstraints');
  dom.constraintsList = $('constraintsList');
  dom.examplesContent = $('examplesContent');
  dom.problemFollowup = $('problemFollowup');
  dom.followupContent = $('followupContent');
  dom.loadingSub = $('editorLoadingSub');
}

// ─── Init ───
document.addEventListener('DOMContentLoaded', init);

async function init() {
  cacheDOM();

  // Load saved progress from localStorage into window.userProgress
  try {
    const saved = localStorage.getItem('algoInfinityVerse');
    if (saved) {
      const data = JSON.parse(saved);
      if (data && typeof data === 'object' && typeof window.userProgress === 'object') {
        Object.assign(window.userProgress, data);
      }
    }
  } catch (e) {
    // localStorage read failed, use defaults
  }

  // Parse URL params
  const params = new URLSearchParams(window.location.search);
  const problemId = params.get('problemId');
  const langParam = params.get('lang');

  if (!problemId) {
    showError('No problem selected. Please go back to <a href="/practice">the problems page</a>.');
    return;
  }

  // Validate language
  const supportedLangs = getSupportedLanguages().map((l) => l.value);
  state.lang = supportedLangs.includes(langParam) ? langParam : 'javascript';
  dom.languageSelect.value = state.lang;

  // Wait for problem data
  dom.loadingSub.textContent = 'Loading problem data...';
  try {
    await waitForData(10000);
  } catch {
    showError('Failed to load problem data. Please try refreshing the page.');
    return;
  }

  // Get problem
  const problem = getProblem(problemId);
  if (!problem) {
    showError(`Problem "${problemId}" not found. Please go back to <a href="/practice">the problems page</a>.`);
    return;
  }
  state.problem = problem;

  // Update UI meta
  updateProblemMeta(problem);

  // Preload Pyodide for Python in background
  if (state.lang === 'python') {
    preloadPyodide();
  }

  // Preload Monaco in background
  dom.loadingSub.textContent = 'Preparing Monaco Editor...';
  preloadMonaco().catch(() => {});

  // Delay slightly for UI to render
  await sleep(300);

  // Initialize Monaco
  dom.loadingSub.textContent = 'Starting editor...';
  await initMonaco(problem);

  // Wire events
  wireEvents(problem);

  // Show app, hide loading
  dom.loadingScreen.classList.add('hidden');
  dom.app.classList.remove('hidden');

  // Focus editor
  state.editor?.focus();
}

// ─── Monaco Initialization ───
async function initMonaco(problem) {
  const starterCode = getStarterCode(state.lang, problem);

  // Clear any previously saved draft so old code is never shown on page load
  clearDraft(problem.id, state.lang);
  migrateLegacyDraft(problem.id, state.lang);

  const editor = await loadMonaco(dom.monacoContainer, {
    language: getMonacoLanguage(state.lang),
    value: starterCode,
    theme: state.theme,
    fontSize: parseInt(localStorage.getItem('editorFontSize')) || 14,
    lineNumbers: 'on',
    lineNumbersMinChars: 4,
    glyphMargin: false,
    folding: true,
  });

  state.editor = editor;
  state.monaco = window.monaco;

  // Update cursor position
  editor.onDidChangeCursorPosition((e) => {
    dom.cursorStatus.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
  });

  // Auto-save draft
  let draftTimer = null;
  editor.onDidChangeModelContent(() => {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      saveDraft(problem.id, state.lang, editor.getValue());
    }, 500);
  });

  // Update lang status
  dom.langStatus.textContent = getSupportedLanguages().find((l) => l.value === state.lang)?.label || state.lang;
}

// ─── Problem Meta ───
function updateProblemMeta(problem) {
  const diff = problem.difficulty?.toLowerCase() || 'easy';

  // Navbar
  dom.problemTitle.textContent = problem.title || 'Untitled';
  dom.problemDifficulty.textContent = problem.difficulty || 'Easy';
  dom.problemDifficulty.className = `editor-problem-difficulty ${diff}`;

  // Description panel
  dom.problemDescTitle.textContent = problem.title || 'Untitled';
  dom.problemTopicBadge.textContent = (problem.tags || []).slice(0, 3).join(', ') || 'General';
  dom.problemDifficultyBadge.textContent = problem.difficulty || 'Easy';
  dom.problemDifficultyBadge.className = `problem-difficulty-badge ${diff}`;
  dom.problemAcceptance.textContent = `Acceptance: ${problem.acceptance || 'N/A'}`;

  // Description
  if (problem.description) {
    dom.problemDescription.innerHTML = `<p>${escapeHtml(problem.description)}</p>`;
  } else {
    dom.problemDescription.innerHTML = `<p>Solve the "${escapeHtml(problem.title)}" problem.</p>`;
  }

  // Constraints
  if (problem.constraints && problem.constraints.length > 0) {
    dom.problemConstraints.style.display = 'block';
    dom.constraintsList.innerHTML = problem.constraints
      .map((c) => `<li>${escapeHtml(c)}</li>`)
      .join('');
  } else {
    dom.problemConstraints.style.display = 'none';
  }

  // Examples
  dom.examplesContent.innerHTML = buildExamplesHTML(problem);

  // Follow-up
  if (problem.followUp) {
    dom.problemFollowup.style.display = 'block';
    dom.followupContent.textContent = problem.followUp;
  } else {
    dom.problemFollowup.style.display = 'none';
  }

  // Update test cases total count
  dom.testCasesTotal.textContent = problem.testCases?.length || 0;
}

function buildExamplesHTML(problem) {
  const testCases = problem.testCases || [];
  if (testCases.length === 0) {
    return '<p class="output-placeholder">No examples available.</p>';
  }

  return testCases
    .slice(0, 3)
    .map((tc, i) => {
      const inputStr = Array.isArray(tc.input)
        ? tc.input.map((v) => JSON.stringify(v)).join(', ')
        : JSON.stringify(tc.input);
      const expectedStr = JSON.stringify(tc.expected);
      return `
        <div class="example">
          <strong>Example ${i + 1}:</strong><br />
          Input: <code>${escapeHtml(inputStr)}</code><br />
          Output: <code>${escapeHtml(expectedStr)}</code>
        </div>
      `;
    })
    .join('');
}

// ─── Events ───
function wireEvents(problem) {
  // Language change
  dom.languageSelect.addEventListener('change', async () => {
    const newLang = dom.languageSelect.value;
    await switchLanguage(newLang, problem);
  });

  // Run
  dom.runBtn.addEventListener('click', () => handleRun(problem));

  // Submit
  dom.submitBtn.addEventListener('click', () => handleSubmit(problem));

  // Reset
  dom.resetBtn.addEventListener('click', async () => {
    const confirmed = await showConfirmModal('Your current code will be lost.');
    if (!confirmed) return;
    const starter = getStarterCode(state.lang, problem);
    state.editor.setValue(starter);
    clearDraft(problem.id, state.lang);
    clearResults();
    showToast('Reset to starter code', 'info');
  });

  // Theme toggle
  dom.themeBtn.addEventListener('click', () => {
    state.theme = state.theme === 'vs-dark' ? 'vs' : 'vs-dark';
    setMonacoTheme(state.theme);
    localStorage.setItem('editorMonacoTheme', state.theme);
  });

  // Back
  dom.backBtn.addEventListener('click', () => {
    clearDraft(state.problem.id, state.lang);
    if (window.history.length > 1) {
      history.back();
    } else {
      window.location.href = '/pages/practice/problems.html';
    }
  });

  // Tab switching
  document.querySelectorAll('.results-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Output clear
  dom.outputClearBtn.addEventListener('click', () => {
    dom.outputContent.innerHTML = `
      <div class="output-placeholder">
        <i class="fas fa-terminal"></i>
        <p>Run your code to see output here</p>
      </div>
    `;
    dom.outputMetrics.classList.add('hidden');
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Shortcuts rely on a physical keyboard — skip them on mobile viewports (< 768px).
    if (!areKeyboardShortcutsEnabled()) return;
    // Ctrl/Cmd + Enter → Run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun(problem);
    }
    // Ctrl/Cmd + S → Submit
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSubmit(problem);
    }
    // Escape → close toasts
    if (e.key === 'Escape') {
      dom.toastContainer.innerHTML = '';
    }
  });

  // Panel resizer
  initPanelResizer();
}

// ─── Language Switching ───
async function switchLanguage(newLang, problem) {
  const currentLang = state.lang;
  const newCode = getStarterCode(newLang, problem);

  clearDraft(problem.id, currentLang);
  clearDraft(problem.id, newLang);

  state.lang = newLang;
  dom.langStatus.textContent = getSupportedLanguages().find((l) => l.value === newLang)?.label || newLang;

  // Update Monaco language mode
  const model = state.editor.getModel();
  if (model && window.monaco) {
    window.monaco.editor.setModelLanguage(model, getMonacoLanguage(newLang));
  }

  state.editor.setValue(newCode);
  clearResults();

  // Preload Pyodide if switching to Python
  if (newLang === 'python') {
    preloadPyodide();
  }
}

// ─── Run ───
async function handleRun(problem) {
  if (state.running) return;

  const code = state.editor.getValue();
  if (!code.trim()) {
    showToast('Please write some code first.', 'error');
    return;
  }

  state.running = true;
  dom.runBtn.disabled = true;
  dom.submitBtn.disabled = true;

  // Show running indicator
  dom.runningIndicator.style.display = 'flex';
  dom.runningIndicatorText.textContent = 'Running code...';

  // Switch to output tab
  switchTab('output');
  dom.outputContent.innerHTML = '';
  dom.outputMetrics.classList.add('hidden');

  try {
    // Show test cases as pending
    renderTestCasesPending(problem.testCases || []);

    const result = await executeProblem({
      code,
      lang: state.lang,
      problem,
      timeoutMs: 10000,
    });

    state.results = result;

    // Render results
    renderTestResults(result);
    renderOutput(result);

    saveExecution({
      sourceCode: result.harnessCode || code,
      originalCode: code,
      language: state.lang,
      stdout: result.rawOutput || '',
      stderr: '',
      exitCode: result.allPassed ? 0 : 1,
      cpuTime: result.metrics?.cpuTime || result.metrics?.executionTime || '',
      memory: result.metrics?.memory || 0,
      error: null,
      problemId: problem.id,
    });

    if (result.allPassed) {
      showToast('<i class="fas fa-check-circle"></i> All tests passed!', 'success');
    } else {
      const failures = (result.testResults || []).filter((r) => r && !r.passed);
      showToast(`<i class="fas fa-times-circle"></i> ${failures.length} test(s) failed`, 'error');
      dom.outputBadge.classList.remove('hidden');
    }
  } catch (err) {
    dom.outputContent.innerHTML = `<pre class="output-error"><i class="fas fa-times-circle"></i> Error:\n${escapeHtml(err.message)}</pre>`;
    showToast('Execution error: ' + err.message, 'error');
  } finally {
    if (typeof window.recordDailyActivity === 'function') window.recordDailyActivity(1);
    state.running = false;
    dom.runningIndicator.style.display = 'none';
    dom.runBtn.disabled = false;
    dom.submitBtn.disabled = false;
  }
}

// ─── Submit ───
async function handleSubmit(problem) {
  if (state.running) return;

  const code = state.editor.getValue();
  if (!code.trim()) {
    showToast('Please write some code before submitting.', 'error');
    return;
  }

  // Check if already completed
  if (window.userProgress?.completedProblems?.includes(problem.id)) {
    showToast('You have already solved this problem!', 'info');
    return;
  }

  state.running = true;
  dom.submitBtn.disabled = true;
  dom.runBtn.disabled = true;

  dom.runningIndicator.style.display = 'flex';
  dom.runningIndicatorText.textContent = 'Running tests...';

  switchTab('output');
  dom.outputContent.innerHTML = '';
  dom.outputMetrics.classList.add('hidden');

  try {
    renderTestCasesPending(problem.testCases || []);

    const result = await executeProblem({
      code,
      lang: state.lang,
      problem,
      timeoutMs: 10000,
    });

    state.results = result;
    renderTestResults(result);
    renderOutput(result);

    saveExecution({
      sourceCode: result.harnessCode || code,
      originalCode: code,
      language: state.lang,
      stdout: result.rawOutput || '',
      stderr: '',
      exitCode: result.allPassed ? 0 : 1,
      cpuTime: result.metrics?.cpuTime || result.metrics?.executionTime || '',
      memory: result.metrics?.memory || 0,
      error: null,
      problemId: problem.id,
    });

    if (result.allPassed) {
      // Record completion
      if (typeof window.addXP === 'function') {
        const xpMap = { easy: 100, medium: 250, hard: 500 };
        const xp = xpMap[problem.difficulty?.toLowerCase()] || 100;
        window.addXP(xp);
      }
      if (typeof window.updateStreak === 'function') window.updateStreak();

      if (window.userProgress) {
        if (!window.userProgress.completedProblems) window.userProgress.completedProblems = [];
        if (!window.userProgress.completedProblems.includes(problem.id)) {
          window.userProgress.completedProblems.push(problem.id);
        }
        if (!window.userProgress.submittedSolutions) window.userProgress.submittedSolutions = {};
        window.userProgress.submittedSolutions[problem.id] = {
          code,
          lang: state.lang,
          date: new Date().toISOString(),
        };
      }

      if (typeof window.saveUserData === 'function') window.saveUserData();

      showToast('<i class="fas fa-star"></i> Problem solved! XP earned.', 'success');
    } else {
      const failures = (result.testResults || []).filter((r) => r && !r.passed);
      showToast(`<i class="fas fa-times-circle"></i> ${failures.length} test(s) failed. Keep trying!`, 'error');
      dom.outputBadge.classList.remove('hidden');
    }
    if (typeof window.recordDailyActivity === 'function') window.recordDailyActivity(1);
  } catch (err) {
    dom.outputContent.innerHTML = `<pre class="output-error"><i class="fas fa-times-circle"></i> Error:\n${escapeHtml(err.message)}</pre>`;
    showToast('Submission error: ' + err.message, 'error');
  } finally {
    state.running = false;
    dom.runningIndicator.style.display = 'none';
    dom.submitBtn.disabled = false;
    dom.runBtn.disabled = false;
  }
}

// ─── Results Rendering ───
function renderTestCasesPending(testCases) {
  if (!testCases || testCases.length === 0) {
    dom.testCasesContainer.innerHTML = '<p class="testcases-placeholder">No test cases for this problem.</p>';
    return;
  }

  dom.testCasesPassed.textContent = '0';
  dom.testCasesTotal.textContent = testCases.length;
  dom.testCasesSummary.textContent = '0/' + testCases.length + ' passed';

  dom.testCasesContainer.innerHTML = testCases
    .map(
      (tc, i) => `
        <div class="test-case" id="tc-${i}">
          <div class="test-case-header">
            <span class="test-case-name">Test ${i + 1}</span>
            <span class="test-case-status pending"><i class="fas fa-hourglass-half"></i> Pending</span>
          </div>
          <div class="test-case-details">
            <div>Input: <code>${formatInput(tc.input)}</code></div>
            <div>Expected: <code>${JSON.stringify(tc.expected)}</code></div>
          </div>
        </div>
      `
    )
    .join('');
}

function renderTestResults(result) {
  const testResults = result.testResults || [];
  const testCases = state.problem?.testCases || [];

  if (testResults.length === 0) {
    dom.testCasesContainer.innerHTML = '<p class="testcases-placeholder">No test results returned.</p>';
    return;
  }

  let passed = 0;
  testResults.forEach((r) => {
    if (r && r.passed) passed++;
  });

  dom.testCasesPassed.textContent = passed;
  dom.testCasesTotal.textContent = testResults.length;
  dom.testCasesSummary.textContent = `${passed}/${testResults.length} passed`;

  dom.testCasesContainer.innerHTML = testResults
    .map((r, i) => {
      if (!r) return '';
      const hasError = r.error && !r.ran;
      const statusClass = hasError ? 'error' : (r.passed ? 'passed' : 'failed');
      const icon = r.passed ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';
      const label = r.passed ? 'PASS' : (hasError ? 'ERROR' : 'FAIL');
      const tc = testCases[i] || {};
      const actualStr =
        r.actual !== undefined && r.actual !== null ? JSON.stringify(r.actual) : '';
      const errorStr = r.error || '';

      return `
        <div class="test-case ${r.ran ? statusClass : 'error'}" id="tc-${i}">
          <div class="test-case-header">
            <span class="test-case-name">Test ${i + 1}</span>
            <span class="test-case-status ${r.ran ? statusClass : 'error'}">
              ${r.ran ? `${icon} ${label}` : `<i class="fas fa-exclamation-triangle"></i> ${label}`}
            </span>
          </div>
          <div class="test-case-details">
            <div>Input: <code>${formatInput(tc.input)}</code></div>
            <div>Expected: <code>${JSON.stringify(tc.expected !== undefined ? tc.expected : '')}</code></div>
            ${(r.ran || hasError) && r.passed !== undefined
              ? `<div class="test-case-actual error">Actual: <code>${actualStr || errorStr || 'N/A'}</code></div>`
              : ''}
          </div>
        </div>
      `;
    })
    .join('');
}

function renderOutput(result) {
  const rawOutput = result.rawOutput || '';
  const allPassed = result.allPassed;

  if (allPassed) {
    dom.outputContent.innerHTML = `<pre class="output-success"><i class="fas fa-check-circle"></i> All tests passed!${rawOutput ? '\n\nConsole output:\n' + escapeHtml(rawOutput) : ''}</pre>`;
  } else if (rawOutput) {
    dom.outputContent.innerHTML = `<pre>${escapeHtml(rawOutput)}</pre>`;
  } else {
    dom.outputContent.innerHTML = '<pre class="output-error"><i class="fas fa-times-circle"></i> Tests failed. Check the Test Cases tab for details.</pre>';
  }

  // Metrics
  const metrics = result.metrics || {};
  if (metrics.cpuTime || metrics.memory || metrics.executionTime) {
    dom.outputMetrics.classList.remove('hidden');
    if (metrics.cpuTime) {
      dom.cpuTime.textContent = metrics.cpuTime + 's';
    } else if (metrics.executionTime) {
      dom.cpuTime.textContent = (parseFloat(metrics.executionTime) / 1000).toFixed(2) + 's';
    } else {
      dom.cpuTime.textContent = '-';
    }
    if (metrics.memory) {
      dom.memUsage.textContent = metrics.memory + ' KB';
      dom.metricsMemory.style.display = '';
    } else {
      dom.metricsMemory.style.display = 'none';
    }
  } else {
    dom.outputMetrics.classList.add('hidden');
  }
}

// ─── Tab Switching ───
const TAB_IDS = {
  description: 'resultsDescription',
  testcases: 'resultsTestCases',
  output: 'resultsOutput',
};

function switchTab(tab) {
  state.currentTab = tab;
  const targetId = TAB_IDS[tab];
  if (!targetId) return;

  document.querySelectorAll('.results-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.querySelectorAll('.results-tab-content').forEach((c) => {
    c.classList.toggle('active', c.id === targetId);
  });

  // Hide badge when viewing output
  if (tab === 'output') {
    dom.outputBadge.classList.add('hidden');
  }
}

function clearResults() {
  state.results = null;
  dom.testCasesContainer.innerHTML = `
    <div class="testcases-placeholder">
      <i class="fas fa-flask"></i>
      <p>Run your code to see test results</p>
    </div>
  `;
  dom.outputContent.innerHTML = `
    <div class="output-placeholder">
      <i class="fas fa-terminal"></i>
      <p>Run your code to see output here</p>
    </div>
  `;
  dom.outputMetrics.classList.add('hidden');
  dom.testCasesPassed.textContent = '0';
  dom.testCasesTotal.textContent = state.problem?.testCases?.length || '0';
  dom.testCasesSummary.textContent = `0/${state.problem?.testCases?.length || 0} passed`;
}

// ─── Panel Resizer ───
function initPanelResizer() {
  let isResizing = false;
  let startX, startWidth;

  dom.resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startWidth = dom.resultsPanel.getBoundingClientRect().width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const delta = startX - e.clientX;
    const newWidth = Math.max(280, Math.min(800, startWidth + delta));
    dom.resultsPanel.style.width = newWidth + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
}

// ─── Pyodide Preload ───
let pyodidePreloaded = false;

function preloadPyodide() {
  if (pyodidePreloaded) return;
  pyodidePreloaded = true;
  // Trigger background load of Pyodide worker
  const workerScript = `
    importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.3/full/pyodide.js");
    self.onmessage = async () => {
      await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.3/full/" });
      self.postMessage({ ready: true });
    };
  `;
  try {
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    worker.postMessage({});
    // Allow worker to live; it will be GC'd when not referenced
    setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(url);
    }, 60000);
  } catch {
    // Pyodide preload failure is non-critical
  }
}

// ─── Confirm Modal ───
function showConfirmModal(message) {
  return new Promise((resolve) => {
    const overlay = dom.resetModal;
    const msgEl = overlay.querySelector('.editor-modal-msg');
    msgEl.textContent = message;

    overlay.hidden = false;

    const onCancel = () => { cleanup(); resolve(false); };
    const onConfirm = () => { cleanup(); resolve(true); };
    const onKeydown = (e) => { if (e.key === 'Escape') onCancel(); };
    const onOverlay = (e) => { if (e.target === overlay) onCancel(); };

    const cleanup = () => {
      overlay.hidden = true;
      dom.resetModalCancel.removeEventListener('click', onCancel);
      dom.resetModalConfirm.removeEventListener('click', onConfirm);
      overlay.removeEventListener('click', onOverlay);
      document.removeEventListener('keydown', onKeydown);
    };

    dom.resetModalCancel.addEventListener('click', onCancel);
    dom.resetModalConfirm.addEventListener('click', onConfirm);
    overlay.addEventListener('click', onOverlay);
    document.addEventListener('keydown', onKeydown);
  });
}

// ─── Toast Notifications ───
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = message;
  dom.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

// ─── Error Screen ───
function showError(message) {
  dom.loadingScreen.querySelector('.editor-loading-content').innerHTML = `
    <i class="fas fa-exclamation-triangle" style="font-size:3rem;color:var(--editor-error);margin-bottom:16px;"></i>
    <p style="font-size:1rem;">${message}</p>
    <button onclick="location.href='/practice'" style="margin-top:16px;padding:8px 20px;border-radius:8px;border:1px solid var(--editor-border);background:var(--editor-accent);color:var(--editor-run-text);cursor:pointer;font-size:0.9rem;font-family:inherit;">
      <i class="fas fa-arrow-left"></i> Back to Problems
    </button>
  `;
}

// ─── Utilities ───
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function escapeHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function formatInput(input) {
  if (input === undefined || input === null) return '';
  if (Array.isArray(input)) {
    return input.map((v) => JSON.stringify(v)).join(', ');
  }
  return JSON.stringify(input);
}
