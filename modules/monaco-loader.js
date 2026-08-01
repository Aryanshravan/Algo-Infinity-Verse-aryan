/**
 * modules/monaco-loader.js
 * Dynamically loads Monaco Editor from CDN with lazy-loading and version pinning.
 * Returns a Promise resolving to a monaco.editor.IStandaloneCodeEditor instance.
 *
 * Features:
 * - Singleton loader (only loads once even if called multiple times)
 * - Version pinned to 0.48.0 for cache stability
 * - Selective language loading (javascript, typescript, python, java, cpp, c)
 * - Automatic cleanup on page unload
 * - Error recovery with retry
 */

const MONACO_VERSION = '0.48.0';
const MONACO_CDN_BASE = `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs`;

let loadPromise = null;
let editorInstances = new WeakMap();

/**
 * Loads Monaco Editor from CDN and creates an editor instance.
 * @param {string|HTMLElement} containerSelector - CSS selector or DOM element for the editor container
 * @param {object} options - Monaco editor creation options
 * @param {number} [options.timeoutMs=30000] - Maximum time to wait for Monaco to load
 * @returns {Promise<object>} The monaco.editor.IStandaloneCodeEditor instance
 */
export async function loadMonaco(containerSelector, options = {}) {
  const container =
    typeof containerSelector === 'string'
      ? document.querySelector(containerSelector)
      : containerSelector;

  if (!container) {
    throw new Error(`Monaco container not found: ${containerSelector}`);
  }

  // Destroy existing instance on this container
  if (editorInstances.has(container)) {
    const existing = editorInstances.get(container);
    try { existing.dispose(); } catch { /* ignore */ }
  }

  const monaco = await loadMonacoEngine(options.timeoutMs || 30000);

  // Configure default compiler options
  configureDefaults(monaco);

  const editorOptions = {
    language: 'javascript',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: true },
    lineNumbers: 'on',
    renderLineHighlight: 'line',
    scrollBeyondLastLine: false,
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    tabSize: 2,
    insertSpaces: true,
    bracketPairColorization: { enabled: true },
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    matchBrackets: 'always',
    quickSuggestions: true,
    suggestOnTriggerCharacters: true,
    wordBasedSuggestions: 'matchingDocuments',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    padding: { top: 12, bottom: 12 },
    roundedSelection: true,
    contextmenu: true,
    ...options,
  };

  const editor = monaco.editor.create(container, editorOptions);
  editorInstances.set(container, editor);

  // Clean up on page unload
  const cleanup = () => {
    try { editor.dispose(); } catch { /* ignore */ }
    editorInstances.delete(container);
    window.removeEventListener('beforeunload', cleanup);
  };
  window.addEventListener('beforeunload', cleanup);

  return editor;
}

/**
 * Loads the Monaco Editor engine (singleton).
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<object>} The `monaco` global
 */
function loadMonacoEngine(timeoutMs) {
  if (loadPromise) return loadPromise;

  if (window.monaco && window.monaco.editor) {
    loadPromise = Promise.resolve(window.monaco);
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Monaco Editor load timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    const script = document.createElement('script');
    script.src = `${MONACO_CDN_BASE}/loader.js`;
    script.async = true;
    script.crossOrigin = 'anonymous';

    script.onload = () => {
      // Monaco's loader uses AMD `require()` — configure paths and bootstrap
      window.require.config({
        paths: { vs: MONACO_CDN_BASE },
        waitSeconds: 15,
      });

      // Load main editor module (this fetches all language grammars on demand)
      window.require(
        ['vs/editor/editor.main'],
        () => {
          clearTimeout(timeout);
          if (window.monaco && window.monaco.editor) {
            resolve(window.monaco);
          } else {
            reject(new Error('Monaco Editor loaded but `window.monaco` is undefined'));
          }
        },
        (err) => {
          clearTimeout(timeout);
          reject(new Error(`Monaco AMD require failed: ${err?.message || 'Unknown error'}`));
        }
      );
    };

    script.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      reject(
        new Error(
          `Failed to load Monaco Editor from CDN. Check network connectivity and CDN availability: ${MONACO_CDN_BASE}/loader.js`
        )
      );
    };

    document.head.appendChild(script);

    function cleanup() {
      if (script.parentNode) script.parentNode.removeChild(script);
    }
  });

  // Allow retry by resetting on failure
  loadPromise.catch(() => {
    loadPromise = null;
  });

  return loadPromise;
}

/**
 * Configure default language settings for better editor experience.
 */
function configureDefaults(monaco) {
  // JavaScript/TypeScript
  if (monaco.languages?.typescript) {
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      lib: ['es2020'],
    });

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      strict: true,
    });
  }
}

/**
 * Preload Monaco Editor in the background without creating an editor instance.
 * Useful for warming up the CDN cache and pre-loading the WASM/grammar files.
 * @returns {Promise<void>}
 */
export async function preloadMonaco() {
  try {
    await loadMonacoEngine(30000);
  } catch {
    // Preload failure is non-critical — editor will load on demand
    console.warn('[monaco-loader] Background preload failed, will retry on demand');
  }
}

/**
 * Check if Monaco Editor has been loaded.
 * @returns {boolean}
 */
export function isMonacoLoaded() {
  return !!(window.monaco && window.monaco.editor && loadPromise);
}

/**
 * Set editor theme dynamically.
 * @param {string} theme - 'vs-dark', 'vs', or 'hc-black'
 */
export function setMonacoTheme(theme) {
  if (window.monaco?.editor) {
    window.monaco.editor.setTheme(theme);
  }
}

/**
 * Get the current language mode ID for a given file extension or language name.
 * @param {string} lang - Language name (e.g. 'javascript', 'python', 'cpp')
 * @returns {string} Monaco language ID
 */
export function getMonacoLanguage(lang) {
  const map = {
    javascript: 'javascript',
    js: 'javascript',
    typescript: 'typescript',
    ts: 'typescript',
    python: 'python',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    'c++': 'cpp',
    c: 'c',
    swift: 'swift',
    go: 'go',
    rust: 'rust',
    ruby: 'ruby',
  };
  return map[lang?.toLowerCase()] || 'javascript';
}
