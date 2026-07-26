document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try {
    initElixirEditor();
  } catch (e) {
    console.error('ElixirEditor:', e);
  }
});

/**
 * Hides the loading screen loader after a short delay.
 */
function initLoadingScreen() {
  setTimeout(() => {
    const s = document.getElementById('loading-screen');
    if (s) s.classList.add('hidden');
  }, 1500);
}

/**
 * Initializes scroll to top button listener.
 */
function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/**
 * Initializes mobile navigation sidebar.
 */
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

/* ─── Elixir Examples ─── */
const ELIXIR_EXAMPLES = {
  hello: [
    {
      name: 'main.exs',
      content: `# Hello World in Elixir
IO.puts("Hello, World!")
IO.puts("Welcome to the Elixir interactive editor!")`,
    },
  ],

  variables: [
    {
      name: 'main.exs',
      content: `# Pattern Matching and Variables in Elixir

# Pattern matching using the match operator (=)
{a, b, c} = {1, 2, "three"}
IO.puts("Pattern Match Tuples:")
IO.puts("a: #{a}, b: #{b}, c: #{c}")

# Pin operator (^) to match existing values
x = 10
try do
  ^x = 20
rescue
  MatchError -> IO.puts("\\nCaptured MatchError: Pin operator protected x from re-assignment!")
end

# An anonymous function
add = fn a, b -> a + b end
IO.puts("\\nCalling anonymous function (add. (5, 7)): #{add.(5, 7)}")`,
    },
  ],

  recursion: [
    {
      name: 'main.exs',
      content: `# Recursion and List operations in Elixir

defmodule MathUtils do
  @doc "Calculates factorial of a number using recursion."
  def factorial(0), do: 1
  def factorial(n) when n > 0, do: n * factorial(n - 1)

  @doc "Computes sum of elements in a list."
  def sum([]), do: 0
  def sum([head | tail]), do: head + sum(tail)
end

IO.puts("Factorial of 5: #{MathUtils.factorial(5)}")
IO.puts("Factorial of 10: #{MathUtils.factorial(10)}")

list = [1, 2, 3, 4, 5]
IO.puts("Sum of [1, 2, 3, 4, 5]: #{MathUtils.sum(list)}")`,
    },
  ],

  concurrency: [
    {
      name: 'main.exs',
      content: `# Concurrency & Actor Model Processes in Elixir

# Spawning a process that waits to receive messages
pid = spawn(fn ->
  receive do
    {:hello, sender} ->
      send(sender, {:ok, "Hello back from child process!"})
    _ ->
      IO.puts("Unknown message received")
  end
end)

# Sending a message to the child process
send(pid, {:hello, self()})

# Checking mailbox for the reply
receive do
  {:ok, msg} ->
    IO.puts("Parent received: #{msg}")
after
  2000 ->
    IO.puts("No reply in 2 seconds.")
end`,
    },
  ],

  structs: [
    {
      name: 'main.exs',
      content: `# Structs & Protocols in Elixir

defmodule User do
  defstruct [:name, :age, :role]
end

defprotocol Greeter do
  @fallback_to_any true
  def greet(data)
end

defimpl Greeter, for: User do
  def greet(user) do
    "Hello #{user.name}, you are logged in as a #{user.role}."
  end
end

defimpl Greeter, for: Any do
  def greet(_), do: "Hello Stranger!"
end

user = %User{name: "Alice", age: 30, role: "Administrator"}
IO.puts(Greeter.greet(user))
IO.puts(Greeter.greet("Random String"))`,
    },
  ],
};

/**
 * Sends files to the Piston execution API.
 * @param {object[]} files - The files array in project state.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object>} The output and errors array.
 */
async function executeElixir(files, signal) {
  if (files.length === 0 || !files.some((f) => f.content.trim())) {
    return { output: [], errors: ['No code to execute.'] };
  }

  const pistonFiles = files.map((f) => ({
    name: f.name,
    content: f.content,
  }));

  try {
    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'elixir',
        version: '*',
        files: pistonFiles,
        stdin: '',
        args: [],
        compile_timeout: 15000,
        run_timeout: 4000,
        compile_memory_limit: -1,
        run_memory_limit: -1,
      }),
      // Pass the AbortSignal so the browser can cancel the in-flight request
      // when a new Run is triggered before the previous one completes.
      signal,
    });

    if (!response.ok) {
      throw new Error('Piston API request failed: ' + response.statusText);
    }

    const data = await response.json();
    const output = [];
    const errors = [];

    if (data.compile && data.compile.stderr) {
      errors.push(...data.compile.stderr.split('\n').filter((l) => l.trim()));
    }

    if (data.run && data.run.stderr) {
      errors.push(...data.run.stderr.split('\n').filter((l) => l.trim()));
    }

    if (data.run && data.run.stdout) {
      output.push(...data.run.stdout.split('\n'));
    }

    if (output.length === 0 && errors.length === 0) {
      output.push('Process finished with no output.');
    }

    return { output, errors };
  } catch (error) {
    // AbortError is not a real failure — the user triggered a new run
    if (error.name === 'AbortError') {
      return { output: [], errors: [] };
    }
    return { output: [], errors: ['Execution Error: ' + error.message] };
  }
}

/**
 * Escapes special characters for HTML parsing.
 * @param {string} text - Plain text string.
 * @returns {string} Escaped HTML string.
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Highlights Elixir code with HTML span annotations.
 * @param {string} code - The raw Elixir code.
 * @returns {string} HTML highlighted string.
 */
function highlightElixir(code) {
  const lines = code.split('\n');
  const highlighted = lines
    .map((line) => {
      const result = escapeHtml(line);

      // Elixir syntax highlighting regex
      const regex =
        /(<[^>]+>)|(#.*)|("[^"]*"|'[^'\\]'|'\\.'|'\\x[0-9a-fA-F]{2}')|(\b(?:def|defmodule|defstruct|defmacro|defimpl|defprotocol|do|end|fn|import|alias|require|use|case|cond|if|unless|with|for|quote|unquote|receive|send|after|try|catch|rescue|nil|true|false|when)\b)|(\b[A-Z][a-zA-Z0-9_]*\b)|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\b(?!\.[a-zA-Z]))|(\b:[a-zA-Z_][a-zA-Z0-9_]*\b)|(->|<-|\|>|=>|==|!=|<=|>=|=~|~>)/g;

      return result.replace(regex, (m, tag, comment, str, kw, moduleVal, num, atom, operator) => {
        if (tag) return tag;
        if (comment) return '<span class="token comment">' + comment + '</span>';
        if (str) return '<span class="token string">' + str + '</span>';
        if (kw) return '<span class="token keyword">' + kw + '</span>';
        if (moduleVal) return '<span class="token function">' + moduleVal + '</span>';
        if (num) return '<span class="token number">' + num + '</span>';
        if (atom) return '<span class="token label">' + atom + '</span>';
        if (operator) return '<span class="token operator">' + operator + '</span>';
        return m;
      });
    })
    .join('\n');

  return highlighted;
}

/**
 * Core initialization function for the Elixir Editor.
 */
function initElixirEditor() {
  const editor = document.getElementById('exEditor');
  const highlight = document.getElementById('exHighlight');
  if (!editor || !highlight) return;

  const outputBody = document.getElementById('exOutputBody');
  const consoleBody = document.getElementById('exConsoleBody');
  const runBtn = document.getElementById('exRunBtn');
  const resetBtn = document.getElementById('exResetBtn');
  const copyBtn = document.getElementById('exCopyBtn');
  const saveBtn = document.getElementById('exSaveBtn');
  const exampleSelect = document.getElementById('exExampleSelect');
  const lineNumbers = document.getElementById('exLineNumbers');
  const statusBadge = document.getElementById('exStatusBadge');
  const consoleClear = document.getElementById('exConsoleClear');
  const fileList = document.getElementById('exFileList');
  const newFileBtn = document.getElementById('exNewFileBtn');
  const activeFileNameEl = document.getElementById('exActiveFileName');

  const SAVE_KEY = 'elixir-editor-project';
  let runSeq = 0;
  let runAbortController = null; // Tracks the active Piston fetch so it can be aborted on re-run
  let highlightDebounceTimer = null; // Debounce handle for syntax highlight updates

  // Project state
  let files = [];
  let activeIndex = 0;

  // Load project from localStorage or default
  const savedProject = localStorage.getItem(SAVE_KEY);
  if (savedProject) {
    try {
      const parsed = JSON.parse(savedProject);
      files = parsed.files || ELIXIR_EXAMPLES.hello;
      activeIndex = parsed.activeIndex !== undefined ? parsed.activeIndex : 0;
      if (activeIndex >= files.length) activeIndex = 0;
    } catch (e) {
      files = JSON.parse(JSON.stringify(ELIXIR_EXAMPLES.hello));
      activeIndex = 0;
    }
  } else {
    files = JSON.parse(JSON.stringify(ELIXIR_EXAMPLES.hello));
    activeIndex = 0;
  }

  // Initial Sync
  syncEditorState();
  renderFileList();

  // Scroll Sync
  editor.addEventListener('scroll', () => {
    lineNumbers.scrollTop = editor.scrollTop;
    highlight.scrollTop = editor.scrollTop;
    highlight.scrollLeft = editor.scrollLeft;
  });

  // Input & Hotkeys
  editor.addEventListener('input', () => {
    files[activeIndex].content = editor.value;
    updateSyntaxHighlight();
    updateLineNumbers();
  });

  let tabEnabled = true;

  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      tabEnabled = false;
      return;
    }

    if (e.key === 'Tab' && tabEnabled) {
      e.preventDefault();
      const s = editor.selectionStart;
      editor.value =
        editor.value.substring(0, s) + '  ' + editor.value.substring(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = s + 2;
      files[activeIndex].content = editor.value;
      updateSyntaxHighlight();
      updateLineNumbers();
    }
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      runCode();
    }
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveProject();
    }
  });

  editor.addEventListener('blur', () => {
    tabEnabled = true;
  });

  editor.addEventListener('click', () => {
    tabEnabled = true;
  });

  // Actions
  runBtn.addEventListener('click', runCode);
  resetBtn.addEventListener('click', resetProject);
  copyBtn.addEventListener('click', copyCurrentFileCode);
  saveBtn.addEventListener('click', saveProject);
  consoleClear.addEventListener('click', clearConsole);

  exampleSelect.addEventListener('change', () => {
    const val = exampleSelect.value;
    if (ELIXIR_EXAMPLES[val]) {
      files = JSON.parse(JSON.stringify(ELIXIR_EXAMPLES[val]));
      activeIndex = 0;
      syncEditorState();
      renderFileList();
    }
  });

  newFileBtn.addEventListener('click', showNewFileInput);

  /* ── Core Editor Functions ── */

  function syncEditorState() {
    const activeFile = files[activeIndex];
    activeFileNameEl.textContent = activeFile.name;
    editor.value = activeFile.content;
    updateSyntaxHighlight();
    updateLineNumbers();

    // Clear scroll position sync on active file switch
    editor.scrollTop = 0;
    editor.scrollLeft = 0;
    lineNumbers.scrollTop = 0;
    highlight.scrollTop = 0;
    highlight.scrollLeft = 0;
  }

  function updateSyntaxHighlight() {
    // Debounce at 80 ms — for large files a synchronous highlight on every
    // keydown blocks the main thread and causes visible input lag.
    clearTimeout(highlightDebounceTimer);
    highlightDebounceTimer = setTimeout(() => {
      highlight.innerHTML = highlightElixir(editor.value) + '\n';
    }, 80);
  }

  function updateLineNumbers() {
    const count = editor.value.split('\n').length;
    lineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join(
      '\n'
    );
  }

  function renderFileList() {
    fileList.innerHTML = '';
    files.forEach((file, index) => {
      const el = document.createElement('div');
      el.className = `file-item ${index === activeIndex ? 'active' : ''}`;
      el.dataset.index = index;
      el.setAttribute('role', 'option');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-selected', index === activeIndex ? 'true' : 'false');

      const nameContainer = document.createElement('div');
      nameContainer.className = 'file-name-container';
      nameContainer.innerHTML = `<i class="fas fa-cube"></i> <span>${escapeHtml(file.name)}</span>`;
      el.appendChild(nameContainer);

      const actionContainer = document.createElement('div');
      actionContainer.className = 'file-item-actions';

      // Edit Button
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'file-action-btn edit';
      editBtn.title = 'Rename File';
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showRenameInput(index);
      });
      actionContainer.appendChild(editBtn);

      // Delete Button
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'file-action-btn delete';
      delBtn.title = 'Delete File';
      delBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteFile(index);
      });
      actionContainer.appendChild(delBtn);

      el.appendChild(actionContainer);

      const selectFile = () => {
        activeIndex = index;
        syncEditorState();
        renderFileList();
      };

      el.addEventListener('click', selectFile);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectFile();
        }
      });

      fileList.appendChild(el);
    });
  }

  function showNewFileInput() {
    if (document.getElementById('newFileInput')) {
      document.getElementById('newFileInput').focus();
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'file-item-input-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'file-item-input';
    input.id = 'newFileInput';
    input.placeholder = 'filename.exs';

    wrapper.appendChild(input);
    fileList.appendChild(wrapper);
    input.focus();

    const finishNewFile = () => {
      const name = input.value.trim();
      if (!name) {
        wrapper.remove();
        return;
      }

      // Validations
      if (!name.endsWith('.ex') && !name.endsWith('.exs')) {
        input.focus();
        return;
      }

      if (files.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
        input.focus();
        return;
      }

      const newFile = {
        name: name,
        content: `# Elixir file: ${name}\n\n`,
      };

      files.push(newFile);
      activeIndex = files.length - 1;
      wrapper.remove();
      saveProject();
      syncEditorState();
      renderFileList();
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishNewFile();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        wrapper.remove();
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (wrapper.parentNode) {
          finishNewFile();
        }
      }, 200);
    });
  }

  function showRenameInput(index) {
    const file = files[index];
    const itemEl = fileList.children[index];
    if (!itemEl) return;

    itemEl.innerHTML = '';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'file-item-input';
    input.value = file.name;
    itemEl.appendChild(input);
    input.focus();
    input.select();

    const finishRename = () => {
      const newName = input.value.trim();
      if (!newName || newName === file.name) {
        renderFileList();
        return;
      }

      if (!newName.endsWith('.ex') && !newName.endsWith('.exs')) {
        input.focus();
        return;
      }

      if (files.some((f, idx) => idx !== index && f.name.toLowerCase() === newName.toLowerCase())) {
        input.focus();
        return;
      }

      file.name = newName;
      saveProject();
      renderFileList();
      if (index === activeIndex) {
        activeFileNameEl.textContent = newName;
      }
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishRename();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        renderFileList();
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (input.parentNode) {
          finishRename();
        }
      }, 200);
    });
  }

  function deleteFile(index) {
    if (files.length <= 1) {
      return;
    }
    files.splice(index, 1);
    if (activeIndex >= files.length) {
      activeIndex = files.length - 1;
    }
    saveProject();
    syncEditorState();
    renderFileList();
  }

  function saveProject() {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        files,
        activeIndex,
      })
    );
    showActionIndicator(saveBtn, '<i class="fas fa-check"></i>');
  }

  function resetProject() {
    const val = exampleSelect.value;
    files = JSON.parse(JSON.stringify(ELIXIR_EXAMPLES[val] || ELIXIR_EXAMPLES.hello));
    activeIndex = 0;
    saveProject();
    syncEditorState();
    renderFileList();
    showActionIndicator(resetBtn, '<i class="fas fa-check"></i>');
  }

  function copyCurrentFileCode() {
    navigator.clipboard
      .writeText(editor.value)
      .then(() => {
        showActionIndicator(copyBtn, '<i class="fas fa-check"></i>');
      })
      .catch(() => {
        logError('Failed to copy code to clipboard.');
      });
  }

  function showActionIndicator(btn, successHTML) {
    const originalHTML = btn.innerHTML;
    btn.innerHTML = successHTML;
    btn.style.color = '#22c55e';
    btn.style.borderColor = '#22c55e';
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 2000);
  }

  function clearConsole() {
    consoleBody.innerHTML = '<span class="ex-console-placeholder">No compilation errors.</span>';
  }

  async function runCode() {
    const seq = ++runSeq;

    // Cancel any in-flight Piston request from a previous run
    if (runAbortController) {
      runAbortController.abort();
    }
    runAbortController = new AbortController();
    const { signal } = runAbortController;

    setStatus('running');
    outputBody.innerHTML = '<span class="ex-output-placeholder">Compiling and running...</span>';
    consoleBody.innerHTML = '<span class="ex-console-placeholder">No compilation errors.</span>';

    const { output, errors } = await executeElixir(files, signal);
    if (seq !== runSeq) return;

    if (output.length > 0) {
      outputBody.innerHTML = '';
      output.forEach((line) => {
        const el = document.createElement('span');
        el.className = 'ex-output-line';
        el.textContent = line;
        outputBody.appendChild(el);
      });
    } else if (errors.length === 0) {
      outputBody.innerHTML =
        '<span class="ex-output-placeholder">No standard output produced.</span>';
    }

    if (errors.length > 0) {
      consoleBody.innerHTML = '';
      errors.forEach(logError);
      setStatus('error');
    } else {
      setStatus('ready');
    }
  }

  function logError(msg) {
    const placeholder = consoleBody.querySelector('.ex-console-placeholder');
    if (placeholder) placeholder.remove();
    const el = document.createElement('span');
    el.className = 'ex-console-line';
    el.textContent = msg;
    consoleBody.appendChild(el);
  }

  function setStatus(state) {
    const map = {
      ready: ['Ready', 'ex-status-ready'],
      running: ['Running', 'ex-status-running'],
      error: ['Error', 'ex-status-error'],
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `ex-status-badge ${cls}`;
  }

  window.addEventListener('resize', () => {
    updateLineNumbers();
  });
}
