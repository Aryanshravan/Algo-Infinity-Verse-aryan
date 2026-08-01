document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try {
    initTypeScriptPlayground();
  } catch (e) {
    console.error('TypeScriptPlayground:', e);
  }
});

/* ─────────────────────────────────────────────
   Loading Screen / Navbar / Scroll Top
   (matches existing editor-page pattern)
   ───────────────────────────────────────────── */
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
}

/* ─────────────────────────────────────────────
   Sample Projects
   ───────────────────────────────────────────── */
const TSP_EXAMPLES = {
  hello: [
    {
      name: 'index.ts',
      content: `// Hello World — basic TypeScript types
function greet(name: string, times: number = 1): string {
  return Array.from({ length: times }, () => \`Hello, \${name}!\`).join(" ");
}

const message: string = greet("Algo Infinity Verse", 2);
console.log(message);
`,
    },
  ],
  interfaces: [
    {
      name: 'index.ts',
      content: `// Interfaces & Generics
interface Stack<T> {
  push(item: T): void;
  pop(): T | undefined;
  readonly size: number;
}

class ArrayStack<T> implements Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  get size(): number {
    return this.items.length;
  }
}

const stack = new ArrayStack<number>();
stack.push(10);
stack.push(20);
stack.push(30);

console.log("Stack size:", stack.size);
console.log("Popped:", stack.pop());
console.log("Stack size after pop:", stack.size);
`,
    },
  ],
  classes: [
    {
      name: 'index.ts',
      content: `// Classes & Enums
enum Priority {
  Low,
  Medium,
  High,
}

class Task {
  private static nextId = 1;
  public readonly id: number;

  constructor(public title: string, public priority: Priority = Priority.Medium) {
    this.id = Task.nextId++;
  }

  describe(): string {
    return \`#\${this.id} [\${Priority[this.priority]}] \${this.title}\`;
  }
}

const tasks = [
  new Task("Fix login bug", Priority.High),
  new Task("Update docs"),
  new Task("Refactor CSS", Priority.Low),
];

tasks.forEach((t) => console.log(t.describe()));
`,
    },
  ],
  multiFile: [
    {
      name: 'index.ts',
      content: `// Entry point — imports from local modules
import { add, multiply } from "./mathUtils";
import { shout, reverse } from "./stringUtils";

console.log("2 + 3 =", add(2, 3));
console.log("4 * 5 =", multiply(4, 5));
console.log(shout("typescript playground"));
console.log(reverse("Algo Infinity Verse"));
`,
    },
    {
      name: 'mathUtils.ts',
      content: `// Math helper module
export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}
`,
    },
    {
      name: 'stringUtils.ts',
      content: `// String helper module
export function shout(input: string): string {
  return input.toUpperCase() + "!";
}

export function reverse(input: string): string {
  return input.split("").reverse().join("");
}
`,
    },
  ],
};

const TSP_SAVE_KEY = 'tsp_project_v1';
const TSP_CATEGORY = { 0: 'warning', 1: 'error', 2: 'suggestion', 3: 'message' };

function initTypeScriptPlayground() {
  const els = {
    activeFileName: document.getElementById('tspActiveFileName'),
    statusBadge: document.getElementById('tspStatusBadge'),
    exampleSelect: document.getElementById('tspExampleSelect'),
    autoRun: document.getElementById('tspAutoRun'),
    copyBtn: document.getElementById('tspCopyBtn'),
    saveBtn: document.getElementById('tspSaveBtn'),
    resetBtn: document.getElementById('tspResetBtn'),
    runBtn: document.getElementById('tspRunBtn'),
    vimToggle: document.getElementById('tspVimToggle'),
    vimStatusBar: document.getElementById('vim-status-bar'),
    newFileBtn: document.getElementById('tspNewFileBtn'),
    fileList: document.getElementById('tspFileList'),
    monacoLoading: document.getElementById('tspMonacoLoading'),
    monacoContainer: document.getElementById('tspMonacoContainer'),
    outputBody: document.getElementById('tspOutputBody'),
    consoleBody: document.getElementById('tspConsoleBody'),
    consoleClear: document.getElementById('tspConsoleClear'),
    problemsBody: document.getElementById('tspProblemsBody'),
    problemsCount: document.getElementById('tspProblemsCount'),
  };
  if (!els.monacoContainer) return;

  /* ── State ── */
  let monacoNS = null;
  let editor = null;
  let fileOrder = []; // ordered list of filenames, e.g. ["index.ts", "mathUtils.ts"]
  let models = new Map(); // filename -> monaco.editor.ITextModel
  let activeFile = null;
  let currentExampleKey = 'hello';
  let diagnosticsByFile = new Map(); // filename -> [{category, message, line, column}]
  let compiledCache = new Map(); // filename -> compiled JS text
  let liveRefreshTimer = null;
  let sandboxFrame = null;

  loadProjectFromStorage();
  bootMonaco();

  /* ── Boot Monaco ── */
  function bootMonaco() {
    if (typeof require === 'undefined' || typeof require.config !== 'function') {
      showMonacoLoadError();
      return;
    }
    require.config({
      paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' },
    });
    require(['vs/editor/editor.main'], () => {
      // eslint-disable-next-line no-undef -- 'monaco' is injected globally by the AMD loader script tag
      monacoNS = monaco;

      monacoNS.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monacoNS.languages.typescript.ScriptTarget.ES2020,
        module: monacoNS.languages.typescript.ModuleKind.CommonJS,
        moduleResolution: monacoNS.languages.typescript.ModuleResolutionKind.NodeJs,
        lib: ['lib.es2020.d.ts', 'lib.dom.d.ts'],
        strict: true,
        noImplicitAny: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        experimentalDecorators: true,
        declaration: false,
        sourceMap: false,
        noEmitOnError: false,
      });
      monacoNS.languages.typescript.typescriptDefaults.setEagerModelSync(true);
      monacoNS.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });

      const isLight = document.documentElement.classList.contains('light-mode');
      editor = monacoNS.editor.create(els.monacoContainer, {
        model: null,
        theme: isLight ? 'vs-light' : 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        fontFamily: "var(--code-font, 'Fira Code', monospace)",
        minimap: { enabled: false },
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        tabSize: 2,
        glyphMargin: false,
        renderLineHighlight: 'all',
      });

      const themeObserver = new MutationObserver(() => {
        const isL = document.documentElement.classList.contains('light-mode');
        monacoNS.editor.setTheme(isL ? 'vs-light' : 'vs-dark');
      });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });

      rebuildModelsFromFileOrder();
      switchToFile(fileOrder.includes('index.ts') ? 'index.ts' : fileOrder[0]);

      editor.onDidChangeModelContent(() => {
        clearTimeout(liveRefreshTimer);
        liveRefreshTimer = setTimeout(refreshLive, 400);
      });

      editor.addCommand(monacoNS.KeyMod.CtrlCmd | monacoNS.KeyCode.Enter, runCode);
      editor.addCommand(monacoNS.KeyMod.CtrlCmd | monacoNS.KeyCode.KeyS, saveProject);

      els.monacoLoading.classList.add('hidden');
      renderFileList();
      refreshLive();

      // Vim Mode logic
      if (els.vimToggle) {
        els.vimToggle.addEventListener('change', (e) => {
          if (e.target.checked) {
            if (window.MonacoVim) {
              if (els.vimStatusBar) els.vimStatusBar.classList.remove('hidden');
              editor.vimModeInstance = window.MonacoVim.initVimMode(editor, els.vimStatusBar);
            } else {
              flashStatus('error', 'Vim Mode script not loaded');
              e.target.checked = false;
            }
          } else {
            if (editor.vimModeInstance) {
              editor.vimModeInstance.dispose();
              editor.vimModeInstance = null;
            }
            if (els.vimStatusBar) els.vimStatusBar.classList.add('hidden');
          }
        });
      }
    }, () => {
      showMonacoLoadError();
    });
  }

  function showMonacoLoadError() {
    if (!els.monacoLoading) return;
    els.monacoLoading.classList.remove('hidden');
    els.monacoLoading.innerHTML =
      '<i class="fas fa-triangle-exclamation tsp-warning-icon"></i> Couldn\'t load the code editor. Check your connection and refresh the page.';
  }

  /* ── Project load / persistence ── */
  function loadProjectFromStorage() {
    try {
      const saved = localStorage.getItem(TSP_SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.files) && parsed.files.length) {
          fileOrder = parsed.files.map((f) => f.name);
          parsed.files.forEach((f) => models.set(f.name, { pendingContent: f.content }));
          currentExampleKey = parsed.exampleKey || 'hello';
          if (els.exampleSelect) els.exampleSelect.value = currentExampleKey;
          return;
        }
      }
    } catch (e) {
      /* corrupted save, fall through to default */
    }
    loadExampleData('hello');
  }

  function loadExampleData(key) {
    const data = TSP_EXAMPLES[key] || TSP_EXAMPLES.hello;
    currentExampleKey = key;
    fileOrder = data.map((f) => f.name);
    models = new Map();
    data.forEach((f) => models.set(f.name, { pendingContent: f.content }));
  }

  function rebuildModelsFromFileOrder() {
    const rebuilt = new Map();
    fileOrder.forEach((name) => {
      const existing = models.get(name);
      const content =
        existing && existing.pendingContent !== undefined
          ? existing.pendingContent
          : existing && existing.getValue
            ? existing.getValue()
            : '';
      rebuilt.set(name, createModelFor(name, content));
    });
    models = rebuilt;
  }

  function createModelFor(filename, content) {
    const uri = monacoNS.Uri.parse('file:///' + filename);
    const existing = monacoNS.editor.getModel(uri);
    if (existing) return existing;
    return monacoNS.editor.createModel(content, 'typescript', uri);
  }

  function persistProject() {
    const files = fileOrder.map((name) => ({ name, content: getModelValue(name) }));
    try {
      localStorage.setItem(TSP_SAVE_KEY, JSON.stringify({ files, exampleKey: currentExampleKey }));
    } catch (e) {
      /* storage full or unavailable — non-fatal */
    }
  }

  function getModelValue(filename) {
    const m = models.get(filename);
    if (!m) return '';
    if (m.getValue) return m.getValue();
    return m.pendingContent || '';
  }

  /* ── File switching ── */
  function switchToFile(filename) {
    if (!filename || !models.has(filename)) return;
    activeFile = filename;
    editor.setModel(models.get(filename));
    els.activeFileName.textContent = filename;
    renderFileList();
    if (compiledCache.has(filename)) {
      renderCompiledOutput(filename);
    } else {
      renderCompiledOutput(filename);
      refreshLive();
    }
  }

  /* ── File Explorer ── */
  function renderFileList() {
    els.fileList.innerHTML = '';
    fileOrder.forEach((name) => {
      const diags = diagnosticsByFile.get(name) || [];
      const hasError = diags.some((d) => d.category === 'error');

      const row = document.createElement('div');
      row.className =
        'file-item' + (name === activeFile ? ' active' : '') + (hasError ? ' has-error' : '');
      row.innerHTML = `
        <div class="file-name-container">
          <i class="fas fa-file-code"></i>
          <span>${escapeHtml(name)}</span>
        </div>
        <div class="file-item-actions">
          <button type="button" class="file-action-btn edit" title="Rename" aria-label="Rename ${escapeHtml(name)}"><i class="fas fa-pen"></i></button>
          <button type="button" class="file-action-btn delete" title="Delete" aria-label="Delete ${escapeHtml(name)}"><i class="fas fa-trash-alt"></i></button>
        </div>
      `;
      row.addEventListener('click', (e) => {
        if (e.target.closest('.file-action-btn')) return;
        switchToFile(name);
      });
      row.querySelector('.edit').addEventListener('click', (e) => {
        e.stopPropagation();
        startRenameFile(name);
      });
      row.querySelector('.delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteFile(name);
      });
      els.fileList.appendChild(row);
    });
  }

  function startNewFile() {
    const wrapper = document.createElement('div');
    wrapper.className = 'file-item-input-wrapper';
    wrapper.innerHTML = `<input type="text" class="file-item-input" placeholder="fileName.ts" />`;
    els.fileList.prepend(wrapper);
    const input = wrapper.querySelector('input');
    input.focus();

    const commit = () => {
      const name = normalizeFileName(input.value);
      wrapper.remove();
      if (!name) return;
      if (fileOrder.includes(name)) {
        flashStatus('error', `${name} already exists`);
        return;
      }
      fileOrder.push(name);
      models.set(name, createModelFor(name, '// New file\n'));
      switchToFile(name);
      persistProject();
      refreshLive();
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') commit();
      if (e.key === 'Escape') wrapper.remove();
    });
    input.addEventListener('blur', commit);
  }

  function startRenameFile(oldName) {
    const rows = els.fileList.querySelectorAll('.file-item');
    const idx = fileOrder.indexOf(oldName);
    if (idx === -1) return;
    const row = rows[idx];
    const wrapper = document.createElement('div');
    wrapper.className = 'file-item-input-wrapper';
    wrapper.innerHTML = `<input type="text" class="file-item-input" value="${escapeHtml(oldName)}" />`;
    row.replaceWith(wrapper);
    const input = wrapper.querySelector('input');
    input.focus();
    input.select();

    const commit = () => {
      const newName = normalizeFileName(input.value);
      if (!newName || newName === oldName) {
        renderFileList();
        return;
      }
      if (fileOrder.includes(newName)) {
        flashStatus('error', `${newName} already exists`);
        renderFileList();
        return;
      }
      const content = getModelValue(oldName);
      const oldModel = models.get(oldName);
      fileOrder[idx] = newName;
      models.set(newName, createModelFor(newName, content));
      models.delete(oldName);
      if (oldModel && oldModel.dispose) oldModel.dispose();
      diagnosticsByFile.delete(oldName);
      if (activeFile === oldName) activeFile = newName;
      if (editor.getModel() === null || activeFile === newName)
        editor.setModel(models.get(newName));
      els.activeFileName.textContent = activeFile;
      persistProject();
      renderFileList();
      refreshLive();
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') commit();
      if (e.key === 'Escape') renderFileList();
    });
    input.addEventListener('blur', commit);
  }

  function deleteFile(name) {
    if (fileOrder.length <= 1) {
      flashStatus('error', 'Project needs at least one file');
      return;
    }
    const idx = fileOrder.indexOf(name);
    if (idx === -1) return;
    const model = models.get(name);
    if (model && model.dispose) model.dispose();
    models.delete(name);
    fileOrder.splice(idx, 1);
    diagnosticsByFile.delete(name);
    compiledCache.delete(name);
    if (activeFile === name) {
      switchToFile(fileOrder[Math.max(0, idx - 1)]);
    } else {
      renderFileList();
    }
    persistProject();
    refreshLive();
  }

  function normalizeFileName(raw) {
    let name = (raw || '').trim();
    if (!name) return null;
    if (!/\.(ts|tsx)$/i.test(name)) name += '.ts';
    if (!/^[a-zA-Z0-9_\-.]+$/.test(name)) return null;
    return name;
  }

  /* ── Diagnostics + Compilation (live, no execution) ── */
  async function refreshLive() {
    if (!monacoNS || fileOrder.length === 0) return;
    try {
      const workerGetter = await monacoNS.languages.typescript.getTypeScriptWorker();
      const uris = fileOrder.map((name) => monacoNS.Uri.parse('file:///' + name));
      const client = await workerGetter(...uris);

      diagnosticsByFile = new Map();
      for (const name of fileOrder) {
        const uriStr = 'file:///' + name;
        const [syntactic, semantic] = await Promise.all([
          client.getSyntacticDiagnostics(uriStr),
          client.getSemanticDiagnostics(uriStr),
        ]);
        const text = getModelValue(name);
        const diags = [...syntactic, ...semantic].map((d) => {
          const { line, column } = offsetToLineCol(text, d.start || 0);
          return {
            file: name,
            category: TSP_CATEGORY[d.category] || 'message',
            message: flattenMessageText(d.messageText),
            line,
            column,
          };
        });
        diagnosticsByFile.set(name, diags);
      }

      if (activeFile) {
        const uriStr = 'file:///' + activeFile;
        const emit = await client.getEmitOutput(uriStr);
        if (emit && emit.outputFiles && emit.outputFiles.length) {
          compiledCache.set(activeFile, emit.outputFiles[0].text);
        }
      }

      renderProblems();
      renderFileList();
      renderCompiledOutput(activeFile);
      maybeAutoRun();
    } catch (e) {
      console.error('TypeScriptPlayground diagnostics error:', e);
    }
  }

  function renderCompiledOutput(filename) {
    if (!filename) return;
    const compiled = compiledCache.get(filename);
    if (!compiled) {
      els.outputBody.innerHTML = `<span class="tsp-output-placeholder">Compiling ${escapeHtml(filename)}…</span>`;
      return;
    }
    els.outputBody.innerHTML = `<div class="tsp-compiled-output">// ${escapeHtml(filename)} → compiled JS\n${escapeHtml(compiled)}</div>`;
  }

  function renderProblems() {
    const all = [];
    diagnosticsByFile.forEach((diags) => {
      diags.forEach((d) => all.push(d));
    });
    const errorCount = all.filter((d) => d.category === 'error').length;

    els.problemsCount.textContent = String(all.length);
    els.problemsCount.classList.toggle('has-errors', errorCount > 0);

    if (all.length === 0) {
      els.problemsBody.innerHTML = `<span class="tsp-problems-placeholder">No problems detected.</span>`;
      return;
    }

    all.sort((a, b) => (a.file === b.file ? a.line - b.line : a.file.localeCompare(b.file)));
    els.problemsBody.innerHTML = '';
    all.forEach((d) => {
      const item = document.createElement('div');
      item.className = 'tsp-problem-item';
      const icon = d.category === 'error' ? 'fa-circle-xmark' : 'fa-triangle-exclamation';
      const iconClass = d.category === 'error' ? 'error' : 'warning';
      item.innerHTML = `
        <i class="fas ${icon} tsp-problem-icon ${iconClass}"></i>
        <div class="tsp-problem-body">
          <span class="tsp-problem-message">${escapeHtml(d.message)}</span>
          <span class="tsp-problem-location">${escapeHtml(d.file)}:${d.line}:${d.column}</span>
        </div>
      `;
      item.addEventListener('click', () => {
        switchToFile(d.file);
        editor.revealLineInCenter(d.line);
        editor.setPosition({ lineNumber: d.line, column: d.column });
        editor.focus();
      });
      els.problemsBody.appendChild(item);
    });
  }

  /* ── Run (compile every file + execute in sandboxed iframe) ── */
  async function runCode() {
    if (!monacoNS || fileOrder.length === 0) return;
    setStatus('running');
    clearConsole();

    try {
      const workerGetter = await monacoNS.languages.typescript.getTypeScriptWorker();
      const uris = fileOrder.map((name) => monacoNS.Uri.parse('file:///' + name));
      const client = await workerGetter(...uris);

      const compiledByFile = new Map();
      for (const name of fileOrder) {
        const emit = await client.getEmitOutput('file:///' + name);
        const js =
          emit && emit.outputFiles && emit.outputFiles.length ? emit.outputFiles[0].text : '';
        compiledByFile.set(name, js);
        compiledCache.set(name, js);
      }
      renderCompiledOutput(activeFile);

      const entry = fileOrder.includes('index.ts') ? 'index.ts' : fileOrder[0];
      const entryKey = fileNameToModuleKey(entry);

      let moduleDefs = '';
      compiledByFile.forEach((js, name) => {
        const key = fileNameToModuleKey(name);
        const safeJs = js.replace(/<\/script/gi, '<\\/script');
        moduleDefs += `window.__tspDefine(${JSON.stringify(key)}, function(module, exports, require) {\n${safeJs}\n});\n`;
      });

      const html = buildSandboxHTML(moduleDefs, entryKey);
      runInSandbox(html);
      logToConsole('Running ' + entry + '…', 'info');
    } catch (e) {
      setStatus('error');
      logToConsole(e && e.message ? e.message : String(e), 'error');
    }
  }

  function fileNameToModuleKey(name) {
    return name.replace(/\.(ts|tsx)$/i, '');
  }

  function buildSandboxHTML(moduleDefs, entryKey) {
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body>
<script>
(function() {
  function safeStringify(obj) {
    try { return JSON.stringify(obj, null, 2); } catch (e) { return String(obj); }
  }
  function post(level, args) {
    var msg = args.map(function(a) { return (a && typeof a === "object") ? safeStringify(a) : String(a); }).join(" ");
    window.parent.postMessage({ type: "tsp-console", level: level, msg: msg }, "*");
  }
  var orig = { log: console.log, warn: console.warn, error: console.error, info: console.info };
  console.log = function() { post("log", Array.prototype.slice.call(arguments)); orig.log.apply(console, arguments); };
  console.warn = function() { post("warn", Array.prototype.slice.call(arguments)); orig.warn.apply(console, arguments); };
  console.error = function() { post("error", Array.prototype.slice.call(arguments)); orig.error.apply(console, arguments); };
  console.info = function() { post("info", Array.prototype.slice.call(arguments)); orig.info.apply(console, arguments); };
  window.addEventListener("error", function(e) { post("error", [e.message]); });
  window.addEventListener("unhandledrejection", function(e) {
    var reason = e.reason && e.reason.message ? e.reason.message : e.reason;
    post("error", ["Unhandled promise rejection: " + reason]);
  });

  var __modules = {};
  var __cache = {};
  function __require(name) {
    var key = String(name).replace(/^(\\.\\/|\\.\\.\\/)+/, "").replace(/\\.(ts|tsx|js)$/, "");
    if (__cache[key]) return __cache[key].exports;
    if (!__modules[key]) { throw new Error("Cannot find module '" + name + "'"); }
    var mod = { exports: {} };
    __cache[key] = mod;
    __modules[key](mod, mod.exports, __require);
    return mod.exports;
  }
  window.__tspDefine = function(name, factory) { __modules[name] = factory; };
  window.__tspRun = function(entry) {
    try {
      __require(entry);
      post("success", ["Program finished running."]);
    } catch (e) {
      post("error", [e && e.message ? e.message : String(e)]);
    }
  };
})();
</script>
<script>
${moduleDefs}
window.__tspRun(${JSON.stringify(entryKey)});
</script>
</body>
</html>`;
  }

  function runInSandbox(html) {
    if (sandboxFrame) sandboxFrame.remove();
    sandboxFrame = document.createElement('iframe');
    sandboxFrame.setAttribute('sandbox', 'allow-scripts');
    sandboxFrame.style.cssText = 'position:absolute;width:0;height:0;border:0;left:-9999px;';
    document.body.appendChild(sandboxFrame);
    sandboxFrame.srcdoc = html;
  }

  window.addEventListener('message', (e) => {
    if (!sandboxFrame || e.source !== sandboxFrame.contentWindow) return;
    if (!e.data || e.data.type !== 'tsp-console') return;
    const level = ['log', 'warn', 'error', 'info', 'success'].includes(e.data.level)
      ? e.data.level
      : 'log';
    logToConsole(e.data.msg, level);
    if (level === 'error') setStatus('error');
    if (level === 'success') setStatus('ready');
  });

  /* ── Console ── */
  function logToConsole(msg, level) {
    const placeholder = els.consoleBody.querySelector('.tsp-console-placeholder');
    if (placeholder) placeholder.remove();
    const line = document.createElement('span');
    line.className = `tsp-console-line tsp-log-${level}`;
    line.textContent = msg;
    els.consoleBody.appendChild(line);
    els.consoleBody.scrollTop = els.consoleBody.scrollHeight;
  }

  function clearConsole() {
    els.consoleBody.innerHTML = `<span class="tsp-console-placeholder">Console output will appear here after running...</span>`;
  }

  /* ── Status ── */
  function setStatus(state) {
    const map = {
      ready: { text: 'Ready', cls: 'tsp-status-ready' },
      running: { text: 'Running', cls: 'tsp-status-running' },
      error: { text: 'Error', cls: 'tsp-status-error' },
    };
    const s = map[state] || map.ready;
    els.statusBadge.textContent = s.text;
    els.statusBadge.className = `tsp-status-badge ${s.cls}`;
  }

  function flashStatus(level, message) {
    logToConsole(message, level === 'error' ? 'error' : 'info');
  }

  function saveProject() {
    persistProject();
    els.saveBtn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => {
      els.saveBtn.innerHTML = '<i class="fas fa-save"></i>';
    }, 1500);
  }

  /* ── Toolbar actions ── */
  els.runBtn.addEventListener('click', runCode);

  els.autoRun.addEventListener('change', () => {
    if (els.autoRun.checked)
      logToConsole('Auto-run enabled — runs 800ms after you stop typing', 'info');
  });

  let autoRunTimer = null;
  function maybeAutoRun() {
    if (!els.autoRun.checked) return;
    clearTimeout(autoRunTimer);
    autoRunTimer = setTimeout(runCode, 800);
  }

  els.newFileBtn.addEventListener('click', startNewFile);

  els.exampleSelect.addEventListener('change', () => {
    fileOrder.forEach((name) => {
      const m = models.get(name);
      if (m && m.dispose) m.dispose();
    });
    loadExampleData(els.exampleSelect.value);
    rebuildModelsFromFileOrder();
    switchToFile(fileOrder.includes('index.ts') ? 'index.ts' : fileOrder[0]);
    clearConsole();
    els.outputBody.innerHTML = `<span class="tsp-output-placeholder">Compiled output will appear here after running...</span>`;
    persistProject();
    refreshLive();
  });

  els.resetBtn.addEventListener('click', () => {
    els.exampleSelect.value = currentExampleKey;
    els.exampleSelect.dispatchEvent(new Event('change'));
  });

  els.copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(getModelValue(activeFile));
      els.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => {
        els.copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
      }, 1500);
    } catch (e) {
      logToConsole('Could not copy to clipboard', 'error');
    }
  });

  els.saveBtn.addEventListener('click', saveProject);

  els.consoleClear.addEventListener('click', clearConsole);
}

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */
function offsetToLineCol(text, offset) {
  const upTo = text.slice(0, offset);
  const lines = upTo.split('\n');
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

function flattenMessageText(msg, depth) {
  depth = depth || 0;
  if (typeof msg === 'string') return msg;
  if (!msg) return '';
  let text = msg.messageText || '';
  if (msg.next && msg.next.length) {
    msg.next.forEach((child) => {
      text += '\n' + '  '.repeat(depth + 1) + flattenMessageText(child, depth + 1);
    });
  }
  return text;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
