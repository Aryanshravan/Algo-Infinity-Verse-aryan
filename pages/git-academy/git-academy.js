/**
 * git-academy.js
 * Interactive Git & GitHub Academy with inline Git simulator, quiz, and progress tracking.
 */

/* global checkAnswer */

// ─── State ───
let activeModule = 0;
let activeLesson = 0;

const STORAGE_KEY = 'gitAcademyProgress';

function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
        completedQuizzes: Array.isArray(parsed.completedQuizzes) ? parsed.completedQuizzes : [],
      };
    }
  } catch (e) {
    // ignore parse errors
  }
  return { completedLessons: [], completedQuizzes: [] };
}

let userProgress = loadProgress();

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userProgress));
  } catch (e) {
    // localStorage full or unavailable
  }

  // Optional Firebase sync — graceful degradation if Firebase is not configured
  if (typeof window !== 'undefined' && window.algoAuth && window.algoAuth.authenticated) {
    trySyncToFirebase();
  }
}

function trySyncToFirebase() {
  // Attempt Firebase sync only if the Firebase SDK and Firestore are available
  if (!window.firebase || !window.firebase.firestore) {
    return; // Firebase SDK not loaded — safe fallback to localStorage only
  }

  var userId = null;
  if (window.algoAuth && window.algoAuth.user) {
    userId = window.algoAuth.user.uid || window.algoAuth.user.id;
  }

  if (!userId) { return; }

  try {
    var db = window.firebase.firestore();
    db.collection('academyProgress').doc(userId).set({
      academy: 'git-academy',
      progress: userProgress,
      updatedAt: new Date().toISOString(),
    }, { merge: true }).catch(function () {
      // Silently ignore Firebase write failures
    });
  } catch (e) {
    // Firebase not available — localStorage is the primary storage
  }
}

// Also try to load progress from Firebase on startup
function tryLoadFromFirebase() {
  if (!window.firebase || !window.firebase.firestore || !window.algoAuth || !window.algoAuth.authenticated) {
    return Promise.resolve(null);
  }

  var userId = null;
  if (window.algoAuth && window.algoAuth.user) {
    userId = window.algoAuth.user.uid || window.algoAuth.user.id;
  }

  if (!userId) { return Promise.resolve(null); }

  try {
    var db = window.firebase.firestore();
    return db.collection('academyProgress').doc(userId).get().then(function (doc) {
      if (doc.exists && doc.data().academy === 'git-academy') {
        var remoteProgress = doc.data().progress;
        // Merge remote with local — local takes precedence for un-synced data
        if (remoteProgress) {
          if (Array.isArray(remoteProgress.completedLessons)) {
            remoteProgress.completedLessons.forEach(function (id) {
              if (userProgress.completedLessons.indexOf(id) === -1) {
                userProgress.completedLessons.push(id);
              }
            });
          }
          if (Array.isArray(remoteProgress.completedQuizzes)) {
            remoteProgress.completedQuizzes.forEach(function (id) {
              if (userProgress.completedQuizzes.indexOf(id) === -1) {
                userProgress.completedQuizzes.push(id);
              }
            });
          }
          saveProgress();
        }
      }
    }).catch(function () {
      // Silently ignore
    });
  } catch (e) {
    return Promise.resolve(null);
  }
}

// ─── Curriculum ───
// academyData is already declared globally by git-academy-data.js
// Reference it via window.gitAcademyCurriculum to avoid redeclaration
var academyData = window.gitAcademyCurriculum || [];

// ─── Git Simulator Engine ───
class GitEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.initialized = false;
    this.commits = new Map();
    this.branches = new Map();
    this.HEAD = null;
    this.workingDirectory = new Map();
    this.stagingArea = new Map();
    this.commitCounter = 0;
  }

  init() {
    if (this.initialized) {
      throw new Error('Reinitialized existing Git repository');
    }
    this.initialized = true;
    this.branches.set('main', null);
    this.HEAD = 'main';
    return 'Initialized empty Git repository';
  }

  assertInitialized() {
    if (!this.initialized) {
      throw new Error('fatal: not a git repository (or any of the parent directories): .git');
    }
  }

  _genHash() {
    return Math.random().toString(16).substring(2, 9);
  }

  _currentHash() {
    if (this.branches.has(this.HEAD)) {
      return this.branches.get(this.HEAD);
    }
    return this.HEAD;
  }

  touch(filename) {
    this.assertInitialized();
    this.workingDirectory.set(filename, 'file content');
    return '';
  }

  rm(filename) {
    this.assertInitialized();
    if (this.workingDirectory.has(filename)) {
      this.workingDirectory.delete(filename);
      if (this.stagingArea.has(filename)) {
        this.stagingArea.delete(filename);
      }
      return '';
    }
    throw new Error(`rm: cannot remove '${filename}': No such file`);
  }

  add(filename) {
    this.assertInitialized();
    if (filename === '.') {
      for (const [file, content] of this.workingDirectory.entries()) {
        this.stagingArea.set(file, content);
      }
      return '';
    }
    if (!this.workingDirectory.has(filename)) {
      throw new Error(`fatal: pathspec '${filename}' did not match any files`);
    }
    this.stagingArea.set(filename, this.workingDirectory.get(filename));
    return '';
  }

  commit(message) {
    this.assertInitialized();
    if (this.stagingArea.size === 0) {
      throw new Error('nothing to commit, working tree clean');
    }

    const hash = this._genHash();
    const parentHash = this._currentHash();

    const tree = new Map(this.stagingArea);
    if (parentHash && this.commits.has(parentHash)) {
      const parentTree = this.commits.get(parentHash).tree;
      for (const [file, content] of parentTree.entries()) {
        if (!tree.has(file)) {
          tree.set(file, content);
        }
      }
    }

    const newCommit = {
      hash: hash,
      message: message || 'empty commit',
      parents: parentHash ? [parentHash] : [],
      tree: tree,
      order: this.commitCounter++,
    };

    this.commits.set(hash, newCommit);

    if (this.branches.has(this.HEAD)) {
      this.branches.set(this.HEAD, hash);
    } else {
      this.HEAD = hash;
    }

    const branchLabel = this.branches.has(this.HEAD) ? this.HEAD : 'detached HEAD';
    return `[${branchLabel} ${hash}] ${message || 'empty commit'}`;
  }

  branch(branchName) {
    this.assertInitialized();
    if (!branchName) {
      const lines = [];
      for (const b of this.branches.keys()) {
        if (b === this.HEAD) {
          lines.push('* ' + b);
        } else {
          lines.push('  ' + b);
        }
      }
      return lines.join('\n');
    }

    if (this.branches.has(branchName)) {
      throw new Error(`fatal: A branch named '${branchName}' already exists.`);
    }

    const currentHash = this._currentHash();
    if (!currentHash && this.commitCounter > 0) {
      throw new Error('fatal: Not a valid object name: HEAD.');
    }
    this.branches.set(branchName, currentHash);
    return '';
  }

  checkout(target) {
    this.assertInitialized();
    if (this.branches.has(target)) {
      this.HEAD = target;
      this._restoreWorkingTree(this.branches.get(target));
      return `Switched to branch '${target}'`;
    }
    if (this.commits.has(target)) {
      this.HEAD = target;
      this._restoreWorkingTree(target);
      return `Note: switching to '${target}'.\nYou are in 'detached HEAD' state.`;
    }
    throw new Error(`error: pathspec '${target}' did not match any file(s) known to git`);
  }

  _restoreWorkingTree(hash) {
    this.workingDirectory.clear();
    this.stagingArea.clear();
    if (hash && this.commits.has(hash)) {
      const tree = this.commits.get(hash).tree;
      for (const [file, content] of tree.entries()) {
        this.workingDirectory.set(file, content);
        this.stagingArea.set(file, content);
      }
    }
  }

  merge(branchName) {
    this.assertInitialized();
    if (!this.branches.has(branchName)) {
      throw new Error(`merge: ${branchName} - not something we can merge`);
    }

    const targetHash = this.branches.get(branchName);
    const currentHash = this._currentHash();

    if (!currentHash) {
      throw new Error('fatal: cannot merge into unborn branch');
    }
    if (targetHash === currentHash) {
      return 'Already up to date.';
    }

    const hash = this._genHash();
    const currentCommit = this.commits.get(currentHash);
    const targetCommit = this.commits.get(targetHash);

    const newTree = new Map(currentCommit ? currentCommit.tree : []);
    if (targetCommit) {
      for (const [file, content] of targetCommit.tree.entries()) {
        newTree.set(file, content);
      }
    }

    const newCommit = {
      hash: hash,
      message: `Merge branch '${branchName}'`,
      parents: [currentHash, targetHash],
      tree: newTree,
      order: this.commitCounter++,
    };

    this.commits.set(hash, newCommit);
    if (this.branches.has(this.HEAD)) {
      this.branches.set(this.HEAD, hash);
    } else {
      this.HEAD = hash;
    }

    this._restoreWorkingTree(hash);
    return `Merge made by the 'recursive' strategy.`;
  }

  log() {
    this.assertInitialized();
    let current = this._currentHash();
    if (!current) {
      throw new Error("fatal: your current branch 'main' does not have any commits yet");
    }

    const lines = [];
    const visited = new Set();

    const traverse = function (hash, engine) {
      if (visited.has(hash)) { return; }
      visited.add(hash);
      const commit = engine.commits.get(hash);
      if (!commit) { return; }

      const refs = [];
      if (engine.HEAD === hash) {
        refs.push('HEAD');
      }
      for (const [b, h] of engine.branches.entries()) {
        if (h === hash) {
          if (engine.HEAD === b) {
            refs.push('HEAD -> ' + b);
          } else {
            refs.push(b);
          }
        }
      }
      const refsStr = refs.length > 0 ? ' (' + refs.join(', ') + ')' : '';

      lines.push('commit ' + commit.hash + refsStr);
      lines.push('    ' + commit.message);
      lines.push('');

      for (let i = commit.parents.length - 1; i >= 0; i--) {
        traverse(commit.parents[i], engine);
      }
    };

    traverse(current, this);
    return lines.join('\n');
  }

  getStatus() {
    return {
      initialized: this.initialized,
      commits: Array.from(this.commits.values()),
      branches: Array.from(this.branches.entries()).map(function (e) {
        return { name: e[0], target: e[1] };
      }),
      head: this.HEAD,
      workingDir: Array.from(this.workingDirectory.keys()),
      staging: Array.from(this.stagingArea.keys()),
    };
  }
}

const git = new GitEngine();

// ─── DOM References ───
const DOM = {
  sidebar: document.getElementById('sidebar'),
  sidebarContent: document.getElementById('sidebar-content'),
  mobileBtn: document.getElementById('mobile-menu-btn'),
  overlay: document.getElementById('sidebar-overlay'),
  progressBar: document.getElementById('progress-bar'),
  progressText: document.getElementById('progress-text'),
  lessonContent: document.getElementById('lesson-content'),
  quizContent: document.getElementById('quiz-content'),
  terminalOutput: document.getElementById('terminal-output'),
  gitInput: document.getElementById('git-input'),
  simulationOutput: document.getElementById('simulation-output'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  lessonTab: document.getElementById('lesson-tab'),
  simulatorTab: document.getElementById('simulator-tab'),
  quizTab: document.getElementById('quiz-tab'),
  runCmdBtn: document.getElementById('run-cmd-btn'),
  resetSimBtn: document.getElementById('reset-sim-btn'),
  clearTermBtn: document.getElementById('clear-term-btn'),
};

// ─── Initialization ───
function init() {
  if (academyData.length === 0) {
    DOM.lessonContent.innerHTML =
      '<div class="text-center text-gray-500 p-8">Curriculum data not loaded. Please check that git-academy-data.js is included before this script.</div>';
    return;
  }

  // Try loading progress from Firebase when the page loads
  tryLoadFromFirebase().finally(function () {
    setupEventListeners();
    renderSidebar();
    renderProgress();
    renderLesson();
    switchTab('lesson');
  });
}

function setupEventListeners() {
  // Mobile sidebar toggle
  DOM.mobileBtn.addEventListener('click', function () {
    DOM.sidebar.classList.toggle('-translate-x-full');
    DOM.overlay.classList.toggle('hidden');
  });

  DOM.overlay.addEventListener('click', function () {
    DOM.sidebar.classList.add('-translate-x-full');
    DOM.overlay.classList.add('hidden');
  });

  // Git command input
  DOM.gitInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      const cmd = DOM.gitInput.value.trim();
      DOM.gitInput.value = '';
      if (cmd) {
        processGitCommand(cmd);
      }
    }
  });

  // Run command button
  DOM.runCmdBtn.addEventListener('click', function () {
    const cmd = DOM.gitInput.value.trim();
    if (cmd) {
      processGitCommand(cmd);
      DOM.gitInput.value = '';
    }
  });

  // Reset simulator
  DOM.resetSimBtn.addEventListener('click', function () {
    if (confirm('Reset the simulated repository? All commits and files will be lost.')) {
      git.reset();
      DOM.terminalOutput.innerHTML = '';
      DOM.simulationOutput.innerHTML =
        '<div class="text-gray-500 italic">Repository reset. Type <strong>git init</strong> to start fresh.</div>';
      appendTerminalLine('Repository has been reset.', 'info-text');
      appendTerminalLine('Type git init to create a new repository.', 'info-text');
    }
  });

  // Clear terminal
  DOM.clearTermBtn.addEventListener('click', function () {
    DOM.terminalOutput.innerHTML = '';
  });

  // Allow Tab key to indent in textarea-like input (prevent focus loss)
  DOM.gitInput.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
      e.preventDefault();
    }
  });

  // Module navigation buttons
  var prevModuleBtn = document.getElementById('prev-module-btn');
  var nextModuleBtn = document.getElementById('next-module-btn');
  if (prevModuleBtn) {
    prevModuleBtn.addEventListener('click', function () {
      navigateToModule(-1);
    });
  }
  if (nextModuleBtn) {
    nextModuleBtn.addEventListener('click', function () {
      navigateToModule(1);
    });
  }

  // Tab switching with quiz rendering
  DOM.tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tab = btn.getAttribute('data-tab');
      switchTab(tab);
      if (tab === 'quiz') {
        renderQuiz();
      }
    });
  });
}

// ─── Tab Management ───
function switchTab(tabId) {
  DOM.tabBtns.forEach(function (btn) {
    var isActive = btn.getAttribute('data-tab') === tabId;
    btn.classList.toggle('active', isActive);
    if (isActive) {
      btn.classList.add('text-orange-600', 'border-b-2', 'border-orange-600');
      btn.classList.remove('text-gray-500');
    } else {
      btn.classList.remove('text-orange-600', 'border-b-2', 'border-orange-600');
      btn.classList.add('text-gray-500');
    }
  });

  DOM.tabPanes.forEach(function (pane) {
    var isActive = pane.id === tabId + '-tab';
    pane.classList.toggle('hidden', !isActive);
    pane.classList.toggle('block', isActive);
  });
}

// ─── Sidebar ───
function renderSidebar() {
  DOM.sidebarContent.innerHTML = '';

  academyData.forEach(function (mod, mIdx) {
    const moduleDiv = document.createElement('div');
    moduleDiv.className = 'sidebar-module';

    const title = document.createElement('div');
    title.className = 'sidebar-module-title';
    title.textContent = mod.title;
    moduleDiv.appendChild(title);

    mod.lessons.forEach(function (lesson, lIdx) {
      const isActive = mIdx === activeModule && lIdx === activeLesson;
      const isCompleted = userProgress.completedLessons.indexOf(lesson.id) !== -1;

      const lessonEl = document.createElement('div');
      lessonEl.className = 'sidebar-lesson' +
        (isActive ? ' active' : '') +
        (isCompleted ? ' completed' : '');
      lessonEl.textContent = (isCompleted ? '✓ ' : '') + lesson.title;
      lessonEl.setAttribute('data-module', mIdx);
      lessonEl.setAttribute('data-lesson', lIdx);
      lessonEl.setAttribute('role', 'button');
      lessonEl.setAttribute('tabindex', '0');

      lessonEl.addEventListener('click', function () {
        navigateToLesson(parseInt(this.getAttribute('data-module')), parseInt(this.getAttribute('data-lesson')));
      });

      lessonEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.click();
        }
      });

      moduleDiv.appendChild(lessonEl);
    });

    DOM.sidebarContent.appendChild(moduleDiv);
  });
}

function navigateToLesson(mIdx, lIdx) {
  if (mIdx < 0 || mIdx >= academyData.length) { return; }
  const mod = academyData[mIdx];
  if (!mod || lIdx < 0 || lIdx >= mod.lessons.length) { return; }

  activeModule = mIdx;
  activeLesson = lIdx;
  renderSidebar();
  renderLesson();
  renderProgress();
  switchTab('lesson');

  // Close sidebar on mobile
  if (window.innerWidth < 768) {
    DOM.sidebar.classList.add('-translate-x-full');
    DOM.overlay.classList.add('hidden');
  }
}

// ─── Progress ───
function renderProgress() {
  let totalItems = 0;
  academyData.forEach(function (mod) {
    totalItems += mod.lessons.length;
    if (mod.quiz && mod.quiz.length > 0) {
      totalItems += 1;
    }
  });

  if (totalItems === 0) { return; }

  const completed = userProgress.completedLessons.length + userProgress.completedQuizzes.length;
  const percent = Math.min(100, Math.round((completed / totalItems) * 100));

  DOM.progressBar.style.width = percent + '%';
  DOM.progressText.textContent = percent + '%';
}

function markLessonComplete(lessonId) {
  if (userProgress.completedLessons.indexOf(lessonId) === -1) {
    userProgress.completedLessons.push(lessonId);
    saveProgress();
    renderSidebar();
    renderProgress();
  }
}

function markQuizComplete(moduleIndex) {
  const quizId = 'quiz-' + moduleIndex;
  if (userProgress.completedQuizzes.indexOf(quizId) === -1) {
    userProgress.completedQuizzes.push(quizId);
    saveProgress();
    renderSidebar();
    renderProgress();
  }
}

// ─── Lesson Rendering ───
function renderLesson() {
  const mod = academyData[activeModule];
  if (!mod) { return; }
  const lesson = mod.lessons[activeLesson];
  if (!lesson) { return; }

  const isCompleted = userProgress.completedLessons.indexOf(lesson.id) !== -1;

  // Objectives list
  let objectivesHtml = '';
  if (lesson.objectives && lesson.objectives.length > 0) {
    objectivesHtml =
      '<div class="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">' +
      '<h3 class="text-sm font-semibold text-blue-800 uppercase tracking-wide mb-2">Learning Objectives</h3>' +
      '<ul class="space-y-1">';
    lesson.objectives.forEach(function (obj) {
      objectivesHtml += '<li class="objective-item text-sm text-blue-700">' + escapeHtml(obj) + '</li>';
    });
    objectivesHtml += '</ul></div>';
  }

  // Takeaway list
  let takeawaysHtml = '';
  if (lesson.takeaways && lesson.takeaways.length > 0) {
    takeawaysHtml =
      '<div class="mt-8 pt-6 border-t border-gray-200">' +
      '<h3 class="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Key Takeaways</h3>';
    lesson.takeaways.forEach(function (t) {
      takeawaysHtml += '<div class="takeaway-item">' + escapeHtml(t) + '</div>';
    });
    takeawaysHtml += '</div>';
  }

  // ELI5 integration
  const eli5 = window.eli5Toggle;
  let simpleContent = '';
  if (window.eli5GitData && lesson.id) {
    simpleContent = window.eli5GitData[lesson.id] || '';
  }
  const bodyHtml = eli5
    ? eli5.wrapContent(lesson.content, simpleContent)
    : lesson.content;

  // Default commands hint
  let commandsHtml = '';
  if (lesson.defaultCommands && lesson.defaultCommands.length > 0) {
    commandsHtml =
      '<div class="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">' +
      '<h4 class="text-sm font-semibold text-gray-700 mb-2">Try these commands in the Simulator:</h4>' +
      '<div class="flex flex-wrap gap-1">';
    lesson.defaultCommands.forEach(function (cmd) {
      commandsHtml += '<span class="cmd-chip" data-cmd="' + escapeHtml(cmd) + '">' + escapeHtml(cmd) + '</span>';
    });
    commandsHtml += '</div></div>';
  }

  const html =
    '<div class="eli5-container eli5-lesson-container" data-mode="technical">' +
    '<h2 class="text-2xl font-bold text-gray-900 mb-4">' + escapeHtml(lesson.title) + '</h2>' +
    objectivesHtml +
    '<div class="lesson-prose">' +
    bodyHtml +
    '</div>' +
    takeawaysHtml +
    commandsHtml +
    '<div class="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">' +
    '<div class="flex gap-2">' +
    (activeLesson > 0
      ? '<button id="prev-lesson-btn" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"><i class="fas fa-arrow-left mr-1"></i> Previous</button>'
      : '') +
    (activeLesson < academyData[activeModule].lessons.length - 1
      ? '<button id="next-lesson-btn" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors">Next <i class="fas fa-arrow-right ml-1"></i></button>'
      : '') +
    '</div>' +
    '<button id="mark-complete-btn" class="px-5 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ' +
    (isCompleted
      ? 'bg-green-100 text-green-700 cursor-default'
      : 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm') +
    '">' +
    (isCompleted
      ? '<i class="fas fa-check-circle"></i> Completed'
      : '<i class="fas fa-check"></i> Mark as Complete') +
    '</button>' +
    '</div>' +
    '</div>';

  DOM.lessonContent.innerHTML = html;

  // Initialize ELI5 toggle
  const lessonContainer = DOM.lessonContent.querySelector('.eli5-lesson-container');
  if (eli5 && lessonContainer) {
    const oldToggle = lessonContainer.querySelector('.eli5-toggle');
    if (oldToggle) { oldToggle.remove(); }
    eli5.initToggle('git', lessonContainer);
  }

  // Initialize copy-code
  if (window.copyCode) {
    window.copyCode.init(DOM.lessonContent);
  }

  // Event listeners for lesson controls
  const markBtn = document.getElementById('mark-complete-btn');
  if (markBtn && !isCompleted) {
    markBtn.addEventListener('click', function () {
      markLessonComplete(lesson.id);
      renderLesson();
    });
  }

  const prevBtn = document.getElementById('prev-lesson-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      if (activeLesson > 0) {
        navigateToLesson(activeModule, activeLesson - 1);
      }
    });
  }

  const nextBtn = document.getElementById('next-lesson-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      const mod = academyData[activeModule];
      if (activeLesson < mod.lessons.length - 1) {
        navigateToLesson(activeModule, activeLesson + 1);
      }
    });
  }

  // Clickable command chips
  DOM.lessonContent.querySelectorAll('.cmd-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      const cmd = this.getAttribute('data-cmd');
      DOM.gitInput.value = cmd;
      DOM.gitInput.focus();
      switchTab('simulator');
    });
  });

  // Update simulator with lesson's default commands
  updateSimulatorSuggestions(lesson);
}

function updateSimulatorSuggestions(lesson) {
  if (!lesson || !lesson.defaultCommands) { return; }

  const container = DOM.simulationOutput;
  if (!container) { return; }

  let html =
    '<div class="text-gray-500 mb-3 text-sm">Quick commands for this lesson — click to run:</div>' +
    '<div class="flex flex-wrap gap-1 mb-3">';
  lesson.defaultCommands.forEach(function (cmd) {
    html +=
      '<span class="cmd-chip" data-cmd="' + escapeHtml(cmd) + '">' + escapeHtml(cmd) + '</span>';
  });
  html += '</div>';

  container.innerHTML = html;

  container.querySelectorAll('.cmd-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      const cmd = this.getAttribute('data-cmd');
      processGitCommand(cmd);
    });
  });
}

// ─── Git Simulator ───
function appendTerminalLine(text, className) {
  if (!text) { return; }
  const line = document.createElement('div');
  line.className = 'terminal-line ' + (className || 'output-text');
  line.innerHTML = text.replace(/\n/g, '<br>');
  DOM.terminalOutput.appendChild(line);
  DOM.terminalOutput.scrollTop = DOM.terminalOutput.scrollHeight;
}

function processGitCommand(input) {
  appendTerminalLine('<span class="prompt-symbol">$</span> <span class="cmd-text">' + escapeHtml(input) + '</span>');

  const args = input.trim().split(/\s+/);
  const program = args[0];

  if (!program) { return; }

  try {
    let output = '';

    if (program === 'help') {
      output =
        'Available commands:\n' +
        '  git init             - Initialize repository\n' +
        '  git add .            - Add files to staging\n' +
        '  git add <file>       - Add a specific file to staging\n' +
        '  git commit -m "msg"  - Commit changes\n' +
        '  git status           - Show working tree status\n' +
        '  git config           - Get/set repository config\n' +
        '  git branch           - List branches\n' +
        '  git branch <name>    - Create a branch\n' +
        '  git checkout <name>  - Switch branches/commits\n' +
        '  git merge <name>     - Merge a branch\n' +
        '  git log              - View commit history\n' +
        '  git diff             - Show changes\n' +
        '  git remote add       - Add a remote repository\n' +
        '  git push             - Push to remote\n' +
        '  git pull             - Pull from remote\n' +
        '  git fetch            - Fetch from remote\n' +
        '  git tag -a <tag>     - Create a tag\n' +
        '  git stash            - Stash changes\n' +
        '  touch <file>         - Create a virtual file\n' +
        '  rm <file>            - Delete a virtual file\n' +
        '  ls                   - List working directory files\n' +
        '  clear                - Clear terminal\n' +
        '  help                 - Show this help';
      appendTerminalLine(output, 'info-text');
      return;
    }

    if (program === 'clear') {
      DOM.terminalOutput.innerHTML = '';
      return;
    }

    if (program === 'ls') {
      try {
        git.assertInitialized();
        const files = Array.from(git.workingDirectory.keys());
        if (files.length === 0) {
          output = '(empty)';
        } else {
          output = files.join('  ');
        }
      } catch (e) {
        output = e.message;
      }
      appendTerminalLine(output);
      updateSimulationStatus();
      return;
    }

    if (program === 'touch') {
      try {
        if (!args[1]) {
          throw new Error('touch: usage: touch <filename>');
        }
        git.touch(args[1]);
        output = '';
        appendTerminalLine(output);
        updateSimulationStatus();
      } catch (e) {
        appendTerminalLine(e.message, 'error-text');
      }
      return;
    }

    if (program === 'rm') {
      try {
        if (!args[1]) {
          throw new Error('rm: missing operand');
        }
        git.rm(args[1]);
        output = '';
        appendTerminalLine(output);
        updateSimulationStatus();
      } catch (e) {
        appendTerminalLine(e.message, 'error-text');
      }
      return;
    }

    if (program === 'git') {
      const subCmd = args[1];

      switch (subCmd) {
        case 'init':
          output = git.init();
          appendTerminalLine(output, 'success-text');
          break;

        case 'add':
          output = git.add(args[2] || '.');
          if (output) { appendTerminalLine(output); }
          break;

        case 'commit': {
          let msg = args.slice(2).join(' ');
          if (msg.startsWith('-m')) {
            msg = msg.replace('-m', '').trim();
            if ((msg.startsWith("'") && msg.endsWith("'")) || (msg.startsWith('"') && msg.endsWith('"'))) {
              msg = msg.slice(1, -1);
            }
          }
          output = git.commit(msg || 'Empty message');
          appendTerminalLine(output, 'success-text');
          break;
        }

        case 'status': {
          try {
            git.assertInitialized();
            const status = 'On branch ' + git.HEAD + '\n';
            const staged = Array.from(git.stagingArea.keys());
            const modified = Array.from(git.workingDirectory.keys()).filter(function (f) {
              return git.stagingArea.has(f) && git.stagingArea.get(f) !== git.workingDirectory.get(f);
            });
            const untracked = Array.from(git.workingDirectory.keys()).filter(function (f) {
              return !git.stagingArea.has(f);
            });

            let statusOutput = status;
            if (staged.length > 0) {
              statusOutput += '\nChanges to be committed:\n  (use "git restore --staged <file>..." to unstage)\n';
              staged.forEach(function (f) {
                statusOutput += '        new file:   ' + f + '\n';
              });
            }
            if (modified.length > 0) {
              statusOutput += '\nChanges not staged for commit:\n';
              modified.forEach(function (f) {
                statusOutput += '        modified:   ' + f + '\n';
              });
            }
            if (untracked.length > 0) {
              statusOutput += '\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n';
              untracked.forEach(function (f) {
                statusOutput += '        ' + f + '\n';
              });
            }
            if (staged.length === 0 && modified.length === 0 && untracked.length === 0) {
              statusOutput += '\nnothing to commit, working tree clean';
            }
            appendTerminalLine(statusOutput);
          } catch (e) {
            appendTerminalLine(e.message, 'error-text');
          }
          break;
        }

        case 'branch':
          output = git.branch(args[2]);
          if (output) { appendTerminalLine(output); }
          break;

        case 'checkout':
          output = git.checkout(args[2]);
          appendTerminalLine(output);
          break;

        case 'merge':
          output = git.merge(args[2]);
          appendTerminalLine(output, 'success-text');
          break;

        case 'log':
          output = git.log();
          appendTerminalLine(output);
          break;

        case 'diff':
          output = 'Diff view: Use the simulator terminal to compare states.';
          appendTerminalLine(output, 'info-text');
          break;

        case 'remote':
          if (args[2] === 'add') {
            if (!args[4]) {
              output = 'usage: git remote add <name> <url>';
              appendTerminalLine(output, 'info-text');
            } else {
              output = 'Remote "' + args[3] + '" added (' + args[4] + ').';
              appendTerminalLine(output, 'success-text');
            }
          } else if (args[2] === '-v') {
            output = 'origin\thttps://github.com/user/repo.git (fetch)\norigin\thttps://github.com/user/repo.git (push)';
            appendTerminalLine(output);
          } else {
            appendTerminalLine('usage: git remote add <name> <url>', 'info-text');
          }
          break;

        case 'config':
          if (args[2] === '--list') {
            output = 'user.name=Student\nuser.email=student@example.com\ncore.repositoryformatversion=0';
            appendTerminalLine(output);
          } else if (args[2] === '--global') {
            output = 'Global config set: ' + (args.slice(3).join(' ') || '(show config)');
            appendTerminalLine(output, 'success-text');
          } else {
            output = 'Config value: (simulated) — use git config --list to see all settings.';
            appendTerminalLine(output, 'info-text');
          }
          break;

        case 'clone':
          output = 'Cloning into \'' + (args[2] ? args[2].split('/').pop().replace('.git', '') : 'repo') + '\'...\nremote: Enumerating objects: 42, done.\nReceiving objects: 100% (42/42), done.';
          appendTerminalLine(output, 'success-text');
          break;

        case 'push':
          output = 'Everything up-to-date (simulated). In a real repo, your commits would be pushed to the remote.';
          appendTerminalLine(output, 'info-text');
          break;

        case 'pull':
          output = 'Already up to date (simulated).';
          appendTerminalLine(output, 'info-text');
          break;

        case 'fetch':
          output = 'Fetching origin (simulated).';
          appendTerminalLine(output, 'info-text');
          break;

        case 'tag': {
          const tagName = args[2];
          if (args[2] === '-l' || args[2] === '--list') {
            output = 'v1.0.0\nv1.1.0\nv2.0.0';
            appendTerminalLine(output);
          } else if (tagName && (args[3] === '-m' || args[4] === '-m')) {
            const msgIndex = args.indexOf('-m');
            const msg = msgIndex !== -1 ? args.slice(msgIndex + 1).join(' ') : '';
            output = 'Tag \'' + tagName + '\' created' + (msg ? ' with message: "' + msg + '"' : '');
            appendTerminalLine(output, 'success-text');
          } else if (tagName && tagName.startsWith('v')) {
            output = 'Tag \'' + tagName + '\' created (simulated).';
            appendTerminalLine(output, 'success-text');
          } else {
            output = 'usage: git tag -a <tagname> -m "message"';
            appendTerminalLine(output, 'info-text');
          }
          break;
        }

        case 'stash':
          if (args[2] === 'list') {
            output = git.workingDirectory.size > 0 ? 'stash@{0}: WIP on ' + git.HEAD + ': simulated stash' : 'No stash found.';
            appendTerminalLine(output);
          } else if (args[2] === 'pop') {
            output = 'Stash popped (simulated).';
            appendTerminalLine(output, 'success-text');
          } else if (args[2] === 'push' || !args[2]) {
            const msgIndex = args.indexOf('-m');
            const msg = msgIndex !== -1 ? args.slice(msgIndex + 1).join(' ') : 'WIP';
            output = 'Saved working directory and index state On ' + git.HEAD + ': ' + msg;
            appendTerminalLine(output, 'info-text');
          } else if (args[2] === 'apply' || args[2] === 'drop') {
            var stashRef = args[3] || 'latest';
            if (args[2] === 'apply') {
              output = 'Applied ' + stashRef + ' (simulated).';
              appendTerminalLine(output, 'success-text');
            } else {
              output = 'Dropped ' + stashRef + ' (simulated).';
              appendTerminalLine(output, 'success-text');
            }
          } else {
            output = 'usage: git stash [-m "message"] | git stash list | git stash pop | git stash apply | git stash drop';
            appendTerminalLine(output, 'info-text');
          }
          break;

        default:
          output = "git: '" + subCmd + "' is not a git command. See 'git --help'.";
          appendTerminalLine(output, 'error-text');
      }

      updateSimulationStatus();
      return;
    }

    // Unknown command
    appendTerminalLine('bash: ' + program + ': command not found', 'error-text');
  } catch (e) {
    appendTerminalLine(e.message, 'error-text');
  }
}

function updateSimulationStatus() {
  try {
    const state = git.getStatus();
    if (!state.initialized) {
      DOM.simulationOutput.innerHTML =
        '<div class="text-gray-500 italic">No repository initialized. Type <strong>git init</strong> to begin.</div>';
      return;
    }

    let html =
      '<div class="grid grid-cols-2 gap-4 mb-4 text-sm">' +
      '<div class="bg-gray-50 p-3 rounded-lg border border-gray-200">' +
      '<div class="font-semibold text-gray-700 mb-1"><i class="fas fa-code-branch mr-1"></i> Branch: <span class="text-orange-600">' +
      escapeHtml(state.head) +
      '</span></div>' +
      '<div class="text-gray-500">Commits: ' +
      state.commits.length +
      '</div>' +
      '</div>' +
      '<div class="bg-gray-50 p-3 rounded-lg border border-gray-200">' +
      '<div class="font-semibold text-gray-700 mb-1"><i class="fas fa-folder-open mr-1"></i> Files: <span class="text-blue-600">' +
      state.workingDir.length +
      '</span> in working dir</div>' +
      '<div class="text-gray-500">Staged: <span class="text-green-600">' +
      state.staging.length +
      '</span></div>' +
      '</div>' +
      '</div>';

    if (state.commits.length > 0) {
      html += '<div class="text-sm font-semibold text-gray-700 mb-2">Recent Commits:</div>';
      const sorted = state.commits.slice().sort(function (a, b) { return b.order - a.order; });
      const recent = sorted.slice(0, 5);
      html += '<div class="space-y-1 mb-3">';
      recent.forEach(function (c) {
        const isHead =
          state.head === c.hash ||
          state.branches.some(function (b) {
            return b.target === c.hash && state.head === b.name;
          });
        html +=
          '<div class="text-xs font-mono ' +
          (isHead ? 'text-orange-600 font-semibold' : 'text-gray-600') +
          '">' +
          (isHead ? '▶ ' : '  ') +
          '<span class="text-yellow-600">' +
          c.hash +
          '</span> ' +
          escapeHtml(c.message) +
          '</div>';
      });
      html += '</div>';
    }

    if (state.workingDir.length > 0) {
      html += '<div class="text-sm font-semibold text-gray-700 mb-1">Working Directory:</div>';
      html += '<div class="flex flex-wrap gap-1 mb-2">';
      state.workingDir.forEach(function (f) {
        const isStaged = state.staging.indexOf(f) !== -1;
        html +=
          '<span class="text-xs px-2 py-0.5 rounded ' +
          (isStaged ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600') +
          '">' +
          escapeHtml(f) +
          (isStaged ? ' ✓' : '') +
          '</span>';
      });
      html += '</div>';
    }

    DOM.simulationOutput.innerHTML = html;
  } catch (e) {
    // ignore
  }
}

// ─── Quiz ───
function renderQuiz() {
  const mod = academyData[activeModule];
  if (!mod || !mod.quiz || mod.quiz.length === 0) {
    DOM.quizContent.innerHTML =
      '<div class="text-center text-gray-500 mt-10">No quiz available for this module.</div>';
    return;
  }

  const quizId = 'quiz-' + activeModule;
  const isCompleted = userProgress.completedQuizzes.indexOf(quizId) !== -1;

  let html =
    '<div class="max-w-2xl mx-auto">' +
    '<div class="mb-6 border-b border-gray-200 pb-4">' +
    '<h2 class="text-2xl font-bold text-gray-900">Module Quiz: ' +
    escapeHtml(mod.title) +
    '</h2>' +
    (isCompleted
      ? '<span class="inline-block mt-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold"><i class="fas fa-check-circle mr-1"></i> Passed</span>'
      : '<p class="text-gray-500 text-sm mt-1">Answer all 5 questions to complete this module.</p>') +
    '</div>' +
    '<div id="quiz-questions" class="space-y-6">';

  mod.quiz.forEach(function (q, qIdx) {
    html +=
      '<div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm" data-question="' +
      qIdx +
      '">' +
      '<h4 class="font-semibold text-gray-800 mb-3"><span class="text-orange-600 font-bold mr-2">Q' +
      (qIdx + 1) +
      '.</span>' +
      escapeHtml(q.question) +
      '</h4>' +
      '<div class="space-y-2">';

    q.options.forEach(function (opt, optIdx) {
      html +=
        '<label class="quiz-option" data-opt="' +
        optIdx +
        '">' +
        '<input type="radio" name="q-' +
        q.id +
        '" value="' +
        optIdx +
        '" class="mr-2" style="accent-color:#ea580c" ' +
        (isCompleted ? 'disabled' : '') +
        '>' +
        escapeHtml(opt) +
        '</label>';
    });

    html += '</div></div>';
  });

  html +=
    '</div>' +
    '<div class="mt-6 text-center">' +
    '<button id="submit-quiz-btn" class="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-sm transition-colors" ' +
    (isCompleted ? 'disabled' : '') +
    '>' +
    (isCompleted ? 'Already Passed' : 'Submit Answers') +
    '</button>' +
    '<div id="quiz-feedback" class="mt-4 text-lg font-semibold hidden"></div>' +
    '</div>' +
    '</div>';

  DOM.quizContent.innerHTML = html;

  // Star icon for navigation
  const quizTitle = document.querySelector('.tab-btn[data-tab="quiz"]');
  if (quizTitle) {
    quizTitle.classList.remove('hidden');
  }

  // Quiz option selection
  DOM.quizContent.querySelectorAll('.quiz-option').forEach(function (label) {
    label.addEventListener('click', function () {
      if (isCompleted) { return; }
      const questionDiv = this.closest('[data-question]');
      questionDiv.querySelectorAll('.quiz-option').forEach(function (opt) {
        opt.classList.remove('selected');
      });
      this.classList.add('selected');
      const radio = this.querySelector('input[type="radio"]');
      if (radio) { radio.checked = true; }
    });
  });

  // Submit button
  const submitBtn = document.getElementById('submit-quiz-btn');
  if (submitBtn && !isCompleted) {
    submitBtn.addEventListener('click', function () {
      submitQuiz(activeModule);
    });
  }
}

function submitQuiz(moduleIndex) {
  const mod = academyData[moduleIndex];
  if (!mod || !mod.quiz) { return; }

  let score = 0;
  let allAnswered = true;

  // Check each question
  mod.quiz.forEach(function (q, qIdx) {
    const questionDiv = DOM.quizContent.querySelector('[data-question="' + qIdx + '"]');
    const selected = questionDiv.querySelector('input[type="radio"]:checked');
    const optIndex = selected ? parseInt(selected.value) : -1;

    const options = questionDiv.querySelectorAll('.quiz-option');

    if (optIndex === -1) {
      allAnswered = false;
      return;
    }

    options.forEach(function (opt, idx) {
      opt.classList.remove('correct', 'incorrect');
      if (idx === q.correct) {
        opt.classList.add('correct');
      } else if (idx === optIndex && idx !== q.correct) {
        opt.classList.add('incorrect');
      }
    });

    if (optIndex === q.correct) {
      score++;
    }
  });

  const feedback = document.getElementById('quiz-feedback');
  feedback.classList.remove('hidden', 'text-green-600', 'text-red-600');

  if (!allAnswered) {
    feedback.textContent = 'Please answer all questions before submitting.';
    feedback.classList.add('text-red-600');
    return;
  }

  if (score === mod.quiz.length) {
    feedback.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Perfect! You passed this module.';
    feedback.classList.add('text-green-600');
    markQuizComplete(moduleIndex);
    renderSidebar();
  } else {
    feedback.textContent = 'You scored ' + score + ' out of ' + mod.quiz.length + '. Review the correct answers above and try again.';
    feedback.classList.add('text-orange-600');
  }

  // Disable further changes
  DOM.quizContent.querySelectorAll('input[type="radio"]').forEach(function (input) {
    input.disabled = true;
  });
  const submitBtn = document.getElementById('submit-quiz-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = score === mod.quiz.length ? 'Passed ✓' : 'Try Again?';
    if (score !== mod.quiz.length) {
      // Replace with a fresh button that re-renders the quiz
      var newBtn = document.createElement('button');
      newBtn.className = submitBtn.className;
      newBtn.textContent = 'Try Again?';
      newBtn.addEventListener('click', function () {
        renderQuiz();
      });
      submitBtn.parentNode.replaceChild(newBtn, submitBtn);
    }
  }
}

// ─── Module Navigation ───
function navigateToModule(direction) {
  const newIdx = activeModule + direction;
  if (newIdx < 0 || newIdx >= academyData.length) { return; }

  activeModule = newIdx;
  activeLesson = 0;
  renderSidebar();
  renderLesson();
  renderProgress();
  switchTab('lesson');
}

// ─── Utility ───
function escapeHtml(str) {
  if (typeof str !== 'string') { return ''; }
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ─── Tab switch event delegation for quiz tab ───
// Handled directly in the tab button click handlers in setupEventListeners()

// ─── Boot ───
document.addEventListener('DOMContentLoaded', init);

// ─── Expose for inline use ───
window.checkAnswer = function (qId, mIndex, qIndex) {
  // Legacy compatibility — the quiz uses its own submission system
};
