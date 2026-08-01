document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try {
    initBashPlayground();
  } catch (e) {
    console.error('BashPlayground:', e);
  }
});

function initLoadingScreen() {
  setTimeout(() => {
    const s = document.getElementById('loading-screen');
    if (s) s.classList.add('hidden');
  }, 1500);
}

function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initNavbar() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (!menuToggle || !navLinks) return;
  let overlay = document.querySelector('.nav-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);
  }
  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !navLinks.classList.contains('active');
    navLinks.classList.toggle('active', isOpen);
    menuToggle.setAttribute('aria-expanded', isOpen);
    overlay.classList.toggle('active', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    const icon = menuToggle.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-bars', !isOpen);
      icon.classList.toggle('fa-times', isOpen);
    }
  };
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });
  overlay.addEventListener('click', () => toggleMenu(false));
  navLinks
    .querySelectorAll('a')
    .forEach((a) => a.addEventListener('click', () => toggleMenu(false)));
  const isMobile = () => window.matchMedia('(max-width: 1024px)').matches;
  document.querySelectorAll('.dropdown-toggle').forEach((toggle) => {
    const parent = toggle.closest('.has-dropdown');
    const menu = parent?.querySelector('.dropdown-menu');
    if (!parent || !menu) return;
    let t;
    parent.addEventListener('mouseenter', () => {
      if (!isMobile()) {
        clearTimeout(t);
        parent.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
    parent.addEventListener('mouseleave', () => {
      if (!isMobile()) {
        t = setTimeout(() => {
          parent.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }, 250);
      }
    });
    toggle.addEventListener('click', (e) => {
      if (isMobile()) {
        e.preventDefault();
        e.stopPropagation();
        const o = parent.classList.toggle('open');
        toggle.setAttribute('aria-expanded', o);
      }
    });
  });
  window.addEventListener('scroll', () => {
    const nav = document.querySelector('.navbar');
    if (nav)
      nav.style.background = window.scrollY > 100 ? 'rgba(10,10,26,0.95)' : 'rgba(10,10,26,0.85)';
  });
}

/* ─── Script Templates ─── */
const BASH_TEMPLATES = {
  hello: `#!/bin/bash
echo "Hello, World!"
echo "Welcome to the Bash Shell Playground!"`,

  variables: `#!/bin/bash
name="Dev"
age=21

echo "Name: $name"
echo "Age: $age"
echo "Next year you'll be $((age + 1))"`,

  loops: `#!/bin/bash
for i in 1 2 3 4 5; do
  echo "Iteration $i"
done

count=0
while [ $count -lt 3 ]; do
  echo "Count: $count"
  count=$((count + 1))
done`,

  conditionals: `#!/bin/bash
num=7

if [ $((num % 2)) -eq 0 ]; then
  echo "$num is even"
else
  echo "$num is odd"
fi

if [ "$num" -gt 5 ]; then
  echo "$num is greater than 5"
fi`,

  functions: `#!/bin/bash
greet() {
  echo "Hello, $1!"
}

factorial() {
  if [ "$1" -le 1 ]; then
    echo 1
  else
    local prev=$(factorial $(( $1 - 1 )))
    echo $(( $1 * prev ))
  fi
}

greet "Dev"
echo "factorial(5) = $(factorial 5)"`,

  files: `#!/bin/bash
mkdir -p demo
cd demo || exit 1
echo "Learning Bash" > notes.txt
echo "File contents:"
cat notes.txt
echo ""
echo "Directory listing:"
ls -la`,
};

/* ─── Default workspace ─── */
const DEFAULT_FILES = {
  'script.sh': BASH_TEMPLATES.hello,
  'notes.sh': '# Scratch file — write anything here.\n',
};

const FILES_KEY = 'bash-playground-files';
const ACTIVE_KEY = 'bash-playground-active-file';
const ENV_KEY = 'bash-playground-env';

/* ─── Execution ─── */
async function executeBash(scriptContent) {
  if (!scriptContent.trim()) {
    return { output: [], errors: ['No code to execute.'] };
  }

  let response;
  try {
    response = await fetch('/api/execute', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'bash',
        source_code: scriptContent,
        stdin: '',
      }),
    });
  } catch (error) {
    return {
      output: [],
      errors: ['Network error — could not reach /api/execute at all: ' + error.message],
    };
  }

  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    /* body wasn't JSON */
  }

  if (!data) {
    return {
      output: [],
      errors: [
        `Server returned ${response.status} with a body that wasn't valid JSON${raw ? ': ' + raw.slice(0, 300) : ' (empty)'}`,
      ],
    };
  }

  // The real /api/execute contract (backend/controllers/apiController.js):
  //   success -> { success: true, executionId, data: { output, stderr, memory, cpuTime } }
  //   failure -> { success: false, message: "..." }  (400/401/413/500)
  if (data.success === false) {
    return {
      output: [],
      errors: [data.message || `Request failed with status ${response.status}`],
    };
  }

  const stdout = (data.data && data.data.output) || '';
  const stderr = (data.data && data.data.stderr) || '';
  const output = stdout.split('\n').filter((l) => l.trim());
  const errors = stderr.split('\n').filter((l) => l.trim());

  if (output.length === 0 && errors.length === 0) {
    output.push('Process finished with no output.');
  }

  return { output, errors };
}

/* ─── Init Playground ─── */
function initBashPlayground() {
  const editor = document.getElementById('bpEditor');
  if (!editor) return;

  const lineNumbers = document.getElementById('bpLineNumbers');
  const runBtn = document.getElementById('bpRunBtn');
  const resetBtn = document.getElementById('bpResetBtn');
  const copyBtn = document.getElementById('bpCopyBtn');
  const saveBtn = document.getElementById('bpSaveBtn');
  const templateSelect = document.getElementById('bpTemplateSelect');
  const activeFileNameLabel = document.getElementById('bpActiveFileName');
  const statusBadge = document.getElementById('bpStatusBadge');
  const terminalBody = document.getElementById('bpTerminalBody');
  const consoleBody = document.getElementById('bpConsoleBody');
  const consoleClear = document.getElementById('bpConsoleClear');
  const fileListEl = document.getElementById('bpFileList');
  const newFileBtn = document.getElementById('bpNewFileBtn');
  const envListEl = document.getElementById('bpEnvList');
  const newEnvBtn = document.getElementById('bpNewEnvBtn');
  const sidebar = document.getElementById('bpSidebar');
  const sidebarToggle = document.getElementById('bpSidebarToggle');
  const tabFiles = document.getElementById('bpTabFiles');
  const tabEnv = document.getElementById('bpTabEnv');
  const filesPanel = document.getElementById('bpFilesPanel');
  const envPanel = document.getElementById('bpEnvPanel');

  let runSeq = 0;

  /* ─ State ─ */
  let files = loadFiles();
  let activeFile = loadActiveFile(files);
  let envVars = loadEnvVars();
  let envIdCounter = envVars.length;

  editor.value = files[activeFile];
  activeFileNameLabel.textContent = activeFile;
  updateLines();
  renderFileList();
  renderEnvList();

  /* ─ Persistence ─ */
  function loadFiles() {
    try {
      const raw = localStorage.getItem(FILES_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) return parsed;
    } catch {
      /* fall through to defaults */
    }
    return { ...DEFAULT_FILES };
  }

  function loadActiveFile(fileMap) {
    const stored = localStorage.getItem(ACTIVE_KEY);
    return stored && fileMap[stored] !== undefined ? stored : Object.keys(fileMap)[0];
  }

  function loadEnvVars() {
    try {
      const raw = localStorage.getItem(ENV_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* fall through to defaults */
    }
    return [];
  }

  function persist() {
    localStorage.setItem(FILES_KEY, JSON.stringify(files));
    localStorage.setItem(ACTIVE_KEY, activeFile);
    localStorage.setItem(ENV_KEY, JSON.stringify(envVars));
  }

  /* ─ File explorer ─ */
  function renderFileList() {
    fileListEl.innerHTML = '';
    Object.keys(files).forEach((name) => {
      const item = document.createElement('div');
      item.className = 'bp-file-item' + (name === activeFile ? ' active' : '');
      item.dataset.name = name;
      item.innerHTML = `
        <i class="fas fa-file-code bp-file-icon"></i>
        <span class="bp-file-name">${escapeHtml(name)}</span>
        <button type="button" class="bp-file-delete" data-name="${escapeHtml(name)}" aria-label="Delete ${escapeHtml(name)}" title="Delete file">
          <i class="fas fa-times"></i>
        </button>`;
      fileListEl.appendChild(item);
    });
  }

  function switchFile(name) {
    if (name === activeFile || files[name] === undefined) return;
    files[activeFile] = editor.value;
    activeFile = name;
    editor.value = files[activeFile];
    activeFileNameLabel.textContent = activeFile;
    updateLines();
    renderFileList();
    persist();
  }

  function createFile() {
    let name = window.prompt('New file name (e.g. deploy.sh):', '');
    if (!name) return;
    name = name.trim();
    if (!name) return;
    if (!/\.sh$/i.test(name)) name += '.sh';
    if (files[name] !== undefined) {
      window.alert(`"${name}" already exists.`);
      return;
    }
    files[activeFile] = editor.value;
    files[name] = '#!/bin/bash\n';
    activeFile = name;
    editor.value = files[activeFile];
    activeFileNameLabel.textContent = activeFile;
    updateLines();
    renderFileList();
    persist();
  }

  function deleteFile(name) {
    if (Object.keys(files).length <= 1) {
      window.alert('You need at least one file.');
      return;
    }
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    delete files[name];
    if (activeFile === name) {
      activeFile = Object.keys(files)[0];
      editor.value = files[activeFile];
      activeFileNameLabel.textContent = activeFile;
      updateLines();
    }
    renderFileList();
    persist();
  }

  fileListEl.addEventListener('click', (e) => {
    const delBtn = e.target.closest('.bp-file-delete');
    if (delBtn) {
      e.stopPropagation();
      deleteFile(delBtn.dataset.name);
      return;
    }
    const item = e.target.closest('.bp-file-item');
    if (item) {
      switchFile(item.dataset.name);
      if (window.matchMedia('(max-width: 768px)').matches) closeSidebar();
    }
  });

  newFileBtn.addEventListener('click', createFile);

  /* ─ Environment variables ─ */
  function renderEnvList() {
    envListEl.innerHTML = '';
    if (envVars.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'bp-sidebar-hint';
      empty.textContent = 'No variables yet.';
      envListEl.appendChild(empty);
      return;
    }
    envVars.forEach((row) => {
      const el = document.createElement('div');
      el.className = 'bp-env-row';
      el.dataset.id = row.id;
      el.innerHTML = `
        <input type="text" class="bp-env-key" placeholder="KEY" value="${escapeHtml(row.key)}" aria-label="Environment variable name" />
        <input type="text" class="bp-env-value" placeholder="value" value="${escapeHtml(row.value)}" aria-label="Environment variable value" />
        <button type="button" class="bp-env-remove" aria-label="Remove variable" title="Remove"><i class="fas fa-times"></i></button>`;
      envListEl.appendChild(el);
    });
  }

  envListEl.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.bp-env-remove');
    if (!removeBtn) return;
    const row = removeBtn.closest('.bp-env-row');
    const id = row.dataset.id;
    envVars = envVars.filter((v) => String(v.id) !== id);
    renderEnvList();
    persist();
  });

  envListEl.addEventListener('input', (e) => {
    const row = e.target.closest('.bp-env-row');
    if (!row) return;
    const entry = envVars.find((v) => String(v.id) === row.dataset.id);
    if (!entry) return;
    if (e.target.classList.contains('bp-env-key')) entry.key = e.target.value;
    if (e.target.classList.contains('bp-env-value')) entry.value = e.target.value;
    persist();
  });

  newEnvBtn.addEventListener('click', () => {
    envVars.push({ id: ++envIdCounter, key: '', value: '' });
    renderEnvList();
    persist();
  });

  function buildExportLines() {
    const validKey = /^[A-Za-z_][A-Za-z0-9_]*$/;
    const lines = envVars
      .filter((v) => validKey.test(v.key.trim()))
      .map((v) => `export ${v.key.trim()}='${String(v.value).replace(/'/g, "'\\''")}'`);
    return lines.length ? lines.join('\n') + '\n\n' : '';
  }

  /* ─ Sidebar tabs (mobile drawer + Files/Env switch) ─ */
  function setTab(tab) {
    tabFiles.classList.toggle('active', tab === 'files');
    tabEnv.classList.toggle('active', tab === 'env');
    filesPanel.classList.toggle('active', tab === 'files');
    envPanel.classList.toggle('active', tab === 'env');
  }
  tabFiles.addEventListener('click', () => setTab('files'));
  tabEnv.addEventListener('click', () => setTab('env'));

  function closeSidebar() {
    sidebar.classList.remove('bp-sidebar-open');
  }
  sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('bp-sidebar-open'));

  /* ─ Editor behavior ─ */
  templateSelect.addEventListener('change', () => {
    files[activeFile] = BASH_TEMPLATES[templateSelect.value];
    editor.value = files[activeFile];
    updateLines();
    persist();
  });

  runBtn.addEventListener('click', runScript);

  resetBtn.addEventListener('click', () => {
    files[activeFile] = BASH_TEMPLATES[templateSelect.value];
    editor.value = files[activeFile];
    updateLines();
    persist();
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(editor.value);
      copyBtn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
      }, 2000);
    } catch {
      logError('Could not copy to clipboard.');
    }
  });

  saveBtn.addEventListener('click', () => {
    files[activeFile] = editor.value;
    persist();
    saveBtn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => {
      saveBtn.innerHTML = '<i class="fas fa-save"></i>';
    }, 2000);
  });

  editor.addEventListener('input', updateLines);
  editor.addEventListener('scroll', () => {
    lineNumbers.scrollTop = editor.scrollTop;
  });

  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = editor.selectionStart;
      editor.value =
        editor.value.substring(0, s) + '  ' + editor.value.substring(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = s + 2;
      updateLines();
    }
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      runScript();
    }
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      files[activeFile] = editor.value;
      persist();
    }
  });

  consoleClear.addEventListener('click', () => {
    consoleBody.innerHTML = '<span class="bp-console-placeholder">No errors detected.</span>';
  });

  /* ─ Run ─ */
  async function runScript() {
    const seq = ++runSeq;
    files[activeFile] = editor.value;
    persist();

    setStatus('running');
    terminalBody.innerHTML = '<span class="bp-terminal-placeholder">Running...</span>';
    consoleBody.innerHTML = '<span class="bp-console-placeholder">No errors detected.</span>';

    const fullScript = buildExportLines() + files[activeFile];
    const { output, errors } = await executeBash(fullScript);
    if (seq !== runSeq) return; // stale run, ignore

    terminalBody.innerHTML = '';
    const promptLine = document.createElement('span');
    promptLine.className = 'bp-terminal-line bp-terminal-prompt';
    promptLine.textContent = `bash ${activeFile}`;
    terminalBody.appendChild(promptLine);

    output.forEach((line) => {
      const el = document.createElement('span');
      el.className = 'bp-terminal-line';
      el.textContent = line;
      terminalBody.appendChild(el);
    });

    if (errors.length > 0) {
      consoleBody.innerHTML = '';
      errors.forEach(logError);
      setStatus('error');
    } else {
      setStatus('ready');
    }
  }

  function logError(msg) {
    const placeholder = consoleBody.querySelector('.bp-console-placeholder');
    if (placeholder) placeholder.remove();
    const el = document.createElement('span');
    el.className = 'bp-console-line';
    el.textContent = msg;
    consoleBody.appendChild(el);
  }

  function setStatus(state) {
    const map = {
      ready: ['Ready', 'bp-status-ready'],
      running: ['Running', 'bp-status-running'],
      error: ['Error', 'bp-status-error'],
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `bp-status-badge ${cls}`;
  }

  function updateLines() {
    const count = editor.value.split('\n').length;
    lineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join(
      '\n'
    );
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
