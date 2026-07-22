import { executeSandboxedCode } from '../modules/code-executor.js';
import { executeWasmPython, executeWasmCpp, isWasmSupported } from '../modules/wasm-executor.js';
import { getCurrentTheme, onThemeChange, THEMES } from '../modules/theme.js';

// DOM Elements
const output = document.getElementById("output");
const languageSelector = document.getElementById("language");
const themeIndicator = document.getElementById("themeIndicator");

// Editor instance
const editor = ace.edit("editor");

// Current state
let currentLanguage = "javascript";
let currentTheme = getCurrentTheme();

// Language templates
const templates = {
    javascript: `// JavaScript Playground\n\nfunction greet(name) {\n  return \`Hello \${name}\`;\n}\n\nconsole.log(greet("Learner"));\n`,
    typescript: `// TypeScript Playground\n\ninterface User {\n  name: string;\n}\n\nconst user: User = {\n  name: "Learner"\n};\n\nconsole.log(user);\n`,
    dart: `// Dart Playground\n\nvoid main() {\n  print("Hello Learner");\n}\n`,
    python: `# Python Playground\n\ndef greet(name):\n    return f"Hello {name}"\n\nprint(greet("Learner"))\n`,
    java: `// Java Playground\n\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello Learner");\n  }\n}\n`,
    cpp: `// C++ Playground\n\n#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello Learner" << endl;\n  return 0;\n}\n`,
    lisp: `;; Common Lisp Playground\n\n(defun greet (name)\n  (format nil "Hello ~a" name))\n\n(write-line (greet "Learner"))\n`,
    groovy: `// Groovy Playground\n\ndef greet(name) {\n    return "Hello \${name}"\n}\n\nprintln greet("Learner")\n`
    vbnet: `' Visual Basic .NET Playground\nImports System\n\nModule Program\n    Sub Main()\n        Console.WriteLine("Hello Learner from VB.NET!")\n    End Sub\nEnd Module\n`
    fsharp: `// F# Playground\n\nlet greet name =\n    sprintf "Hello %s" name\n\n[<EntryPoint>]\nlet main argv =\n    printfn "%s" (greet "Learner")\n    0\n`
    prolog: `% Prolog Playground\n\nparent(john, bob).\nparent(bob, charlie).\n\nancestor(X, Y) :- parent(X, Y).\nancestor(X, Y) :- parent(X, Z), ancestor(Z, Y).\n\n% Run query: ancestor(john, charlie).\n`
};

// Theme configurations for Ace
const ACE_THEMES = {
    dark: 'monokai',
    light: 'eclipse'
};

// Code storage for each language
const codeStorage = {
    javascript: templates.javascript,
    typescript: templates.typescript,
    dart: templates.dart,
    python: templates.python,
    java: templates.java,
    cpp: templates.cpp,
    lisp: templates.lisp,
    groovy: templates.groovy
    vbnet: templates.vbnet
    fsharp: templates.fsharp
    prolog: templates.prolog
};

// --- INITIALIZATION ---

/**
 * Initialize editor with theme and language
 */
function initEditor() {
    const theme = getCurrentTheme();
    const aceTheme = theme === THEMES.DARK ? ACE_THEMES.dark : ACE_THEMES.light;
    
    editor.setTheme(`ace/theme/${aceTheme}`);
    editor.session.setMode("ace/mode/javascript");
    editor.setOptions({
        fontSize: '14px',
        fontFamily: 'Fira Code, monospace, Consolas',
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true,
        showPrintMargin: false,
        tabSize: 2,
        useSoftTabs: true,
        wrap: true
    });
    
    // Load saved code or default
    if (window.StorageDB && window.DB_STORES) {
        window.StorageDB.get(window.DB_STORES.PLAYGROUND, `playground-code-${currentLanguage}`)
            .then(savedCode => {
                if (savedCode) {
                    editor.setValue(savedCode, -1);
                } else {
                    editor.setValue(templates[currentLanguage], -1);
                }
            });
    } else {
        const savedCode = localStorage.getItem(`playground-code-${currentLanguage}`);
        if (savedCode) {
            editor.setValue(savedCode, -1);
        } else {
            editor.setValue(templates[currentLanguage], -1);
        }
    }
    
    // Update theme indicator
    updateThemeIndicator(theme);
    
    // Setup event listeners
    setupEventListeners();
    
    // Listen for theme changes from app
    const unsubscribe = onThemeChange(function(theme) {
        updateEditorTheme(theme);
    });
    
    // Clean up on page unload
    window.addEventListener('beforeunload', function() {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    });
}

// --- THEME FUNCTIONS ---

/**
 * Update editor theme
 * @param {string} theme - 'light' or 'dark'
 */
function updateEditorTheme(theme) {
    const aceTheme = theme === THEMES.DARK ? ACE_THEMES.dark : ACE_THEMES.light;
    
    // Update Ace theme
    editor.setTheme(`ace/theme/${aceTheme}`);
    
    // Update editor container class
    const editorContainer = document.getElementById('editor');
    if (editorContainer) {
        editorContainer.classList.remove('light-theme', 'dark-theme');
        editorContainer.classList.add(theme === THEMES.DARK ? 'dark-theme' : 'light-theme');
    }
    
    // Update indicator
    updateThemeIndicator(theme);
    
    currentTheme = theme;
}

/**
 * Update theme indicator in UI
 */
function updateThemeIndicator(theme) {
    if (!themeIndicator) return;
    
    const icon = themeIndicator.querySelector('i');
    const text = themeIndicator.querySelector('span');
    
    if (theme === THEMES.DARK) {
        if (icon) {
            icon.className = 'fas fa-moon';
        }
        if (text) {
            text.textContent = 'Dark Mode';
        }
        themeIndicator.classList.add('dark');
        themeIndicator.classList.remove('light');
    } else {
        if (icon) {
            icon.className = 'fas fa-sun';
        }
        if (text) {
            text.textContent = 'Light Mode';
        }
        themeIndicator.classList.add('light');
        themeIndicator.classList.remove('dark');
    }
}

// --- EVENT LISTENERS ---

function setupEventListeners() {
    // Run button
    document.getElementById("runBtn").addEventListener("click", runCode);

    // Profile Complexity button
    const profileBtn = document.getElementById("profileBtn");
    if (profileBtn) profileBtn.addEventListener("click", runProfiler);

    const rerunProfileBtn = document.getElementById("rerunProfileBtn");
    if (rerunProfileBtn) rerunProfileBtn.addEventListener("click", runProfiler);

    const closeProfilerBtn = document.getElementById("closeProfilerBtn");
    if (closeProfilerBtn) closeProfilerBtn.addEventListener("click", () => {
        const modal = document.getElementById("profilerModal");
        if (modal) modal.style.display = "none";
    });
    
    // Clear button
    document.getElementById("clearBtn").addEventListener("click", clearOutput);
    
    // Reset button
    document.getElementById("resetBtn").addEventListener("click", resetEditor);
    
    // Language selector
    languageSelector.addEventListener("change", async (event) => {
        const selectedLang = event.target.value.toLowerCase();
        
        // Save current code before switching
        codeStorage[currentLanguage] = editor.getValue();
        if (window.StorageDB && window.DB_STORES) {
            await window.StorageDB.set(window.DB_STORES.PLAYGROUND, `playground-code-${currentLanguage}`, codeStorage[currentLanguage]);
        } else {
            localStorage.setItem(`playground-code-${currentLanguage}`, codeStorage[currentLanguage]);
        }
        
        // Switch language
        currentLanguage = selectedLang;
        
        // Load saved code or template
        if (window.StorageDB && window.DB_STORES) {
            const savedCode = await window.StorageDB.get(window.DB_STORES.PLAYGROUND, `playground-code-${selectedLang}`);
            if (savedCode) {
                editor.setValue(savedCode, -1);
            } else {
                editor.setValue(templates[selectedLang] || templates.javascript, -1);
            }
        } else {
            const savedCode = localStorage.getItem(`playground-code-${selectedLang}`);
            if (savedCode) {
                editor.setValue(savedCode, -1);
            } else {
                editor.setValue(templates[selectedLang] || templates.javascript, -1);
            }
        }
        
        // Update editor mode
        const modes = {
            javascript: 'ace/mode/javascript',
            typescript: 'ace/mode/typescript',
            dart: 'ace/mode/dart',
            python: 'ace/mode/python',
            java: 'ace/mode/java',
            cpp: 'ace/mode/c_cpp',
            lisp: 'ace/mode/lisp',
            groovy: 'ace/mode/groovy'
            vbnet: 'ace/mode/vbscript'
            fsharp: 'ace/mode/fsharp'
            prolog: 'ace/mode/prolog'
        };
        editor.session.setMode(modes[selectedLang] || 'ace/mode/javascript');
        
        // Update language badge
        updateLanguageBadge(selectedLang);
    });
    
    // Auto-save on editor change
    editor.session.on('change', function() {
        saveCode();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+Enter or Cmd+Enter to run
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            runCode();
        }
    });
    
    // Listen for theme changes from the theme toggle
    document.addEventListener('themeChanged', function(event) {
        const theme = event.detail.theme;
        updateEditorTheme(theme);
    });
    
    // Re-apply theme on window focus (for cross-tab sync)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            const theme = getCurrentTheme();
            if (theme !== currentTheme) {
                updateEditorTheme(theme);
            }
        }
    });
}

// --- CODE MANAGEMENT ---

function saveCode() {
    const code = editor.getValue();
    if (window.StorageDB && window.DB_STORES) {
        window.StorageDB.set(window.DB_STORES.PLAYGROUND, `playground-code-${currentLanguage}`, code);
    } else {
        localStorage.setItem(`playground-code-${currentLanguage}`, code);
    }
}

function resetEditor() {
    editor.setValue(templates[currentLanguage] || templates.javascript, -1);
    clearOutput();
    saveCode();
}

function updateLanguageBadge(language) {
    const badge = document.getElementById('languageBadge');
    if (badge) {
        const names = {
            javascript: 'JavaScript',
            typescript: 'TypeScript',
            dart: 'Dart',
            python: 'Python',
            java: 'Java',
            cpp: 'C++',
            lisp: 'Common Lisp',
            groovy: 'Groovy'
            vbnet: 'VB.NET'
            fsharp: 'F#'
            prolog: 'Prolog'
        };
        badge.textContent = names[language] || language;
    }
}

function clearOutput() {
    if (output) {
        output.textContent = "▶ Run your code to see output here";
    }
}

// --- RUNNERS ---

const runners = {
    javascript: runJavaScript,
    typescript: runTypeScript,
    dart: runDart,
    python: runPython,
    java: runJava,
    cpp: runCpp,
    lisp: runLisp,
    groovy: runGroovy
    vbnet: runVbNet
    fsharp: runFSharp
    prolog: runProlog
};

function runCode() {
    const language = languageSelector.value.toLowerCase();
    const code = editor.getValue();

    if (runners[language]) {
        runners[language](code);
    } else {
        output.textContent = `❌ Runner for language "${language}" is not implemented.`;
    }
}

async function runJavaScript(code) {
    clearOutput();
    output.textContent = "⏳ Running (Sandboxed)...";

    try {
        const logs = await executeSandboxedCode(code, 3000);
        if (logs && logs.length > 0) {
            output.textContent = logs.join("\n");
        } else {
            output.textContent = "✅ Code executed successfully (no output).";
        }
    } catch (error) {
        output.textContent = `❌ ${error.message}`;
    }
}

async function runTypeScript(code) {
    clearOutput();
    output.textContent = "⏳ Compiling TypeScript...";

    try {
        // Compile TypeScript to JavaScript
        const compiled = ts.transpile(code, {
            target: ts.ScriptTarget.ES2020,
            module: ts.ModuleKind.CommonJS,
            strict: false
        });

        // Execute the compiled code
        output.textContent = "⏳ Running compiled JavaScript...";
        const logs = await executeSandboxedCode(compiled, 3000);
        
        if (logs && logs.length > 0) {
            output.textContent = logs.join("\n");
        } else {
            output.textContent = "✅ TypeScript compiled and executed successfully.";
        }
    } catch (error) {
        output.textContent = `❌ TypeScript Error: ${error.message}`;
    }
}

async function runDart(code) {
    clearOutput();
    output.textContent = "⏳ Running Dart via Judge0...";

    try {
        const response = await fetch(
            "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    language_id: 90,
                    source_code: code
                })
            }
        );

        const result = await response.json();

        output.textContent =
            result.stdout ||
            result.stderr ||
            result.compile_output ||
            "✅ Code ran successfully with no terminal output.";

    } catch (err) {
        output.textContent = `❌ Network Error: ${err.message}`;
    }
}

async function runPython(code) {
    clearOutput();
    output.textContent = "⚡ Initializing Pyodide WASM Engine...";

    if (isWasmSupported()) {
        try {
            output.textContent = "⚡ Running Python locally via Pyodide WASM...";
            const res = await executeWasmPython(code);
            const header = `⚡ Client-side WASM Engine (executed in ${res.executionTime}ms)\n----------------------------------------\n`;
            output.textContent = header + res.logs.join("\n");
            return;
        } catch (wasmErr) {
            console.warn("WASM Python execution failed/fallback:", wasmErr);
            output.textContent = `⚠️ WASM Engine message: ${wasmErr.message}\n⏳ Falling back to Judge0 Remote API...\n`;
        }
    }

    try {
        const response = await fetch(
            "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    language_id: 71,
                    source_code: code
                })
            }
        );

        const result = await response.json();

        output.textContent =
            result.stdout ||
            result.stderr ||
            result.compile_output ||
            "✅ Code ran successfully with no terminal output.";

    } catch (err) {
        output.textContent = `❌ Network Error: ${err.message}`;
    }
}

async function runJava(code) {
    clearOutput();
    output.textContent = "⏳ Running Java via Judge0...";

    try {
        const response = await fetch(
            "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    language_id: 62,
                    source_code: code
                })
            }
        );

        const result = await response.json();

        output.textContent =
            result.stdout ||
            result.stderr ||
            result.compile_output ||
            "✅ Code ran successfully with no terminal output.";

    } catch (err) {
        output.textContent = `❌ Network Error: ${err.message}`;
    }
}

async function runCpp(code) {
    clearOutput();
    output.textContent = "⚡ Initializing C++ WASM Engine...";

    if (isWasmSupported()) {
        try {
            output.textContent = "⚡ Running C++ locally via WASM Engine...";
            const res = await executeWasmCpp(code);
            const header = `⚡ Client-side WASM Engine (executed in ${res.executionTime}ms)\n----------------------------------------\n`;
            output.textContent = header + res.logs.join("\n");
            return;
        } catch (wasmErr) {
            console.warn("WASM C++ execution failed/fallback:", wasmErr);
            output.textContent = `⚠️ WASM Engine message: ${wasmErr.message}\n⏳ Falling back to Judge0 Remote API...\n`;
        }
    }

    try {
        const response = await fetch(
            "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    language_id: 54,
                    source_code: code
                })
            }
        );

        const result = await response.json();

        output.textContent =
            result.stdout ||
            result.stderr ||
            result.compile_output ||
            "✅ Code ran successfully with no terminal output.";

    } catch (err) {
        output.textContent = `❌ Network Error: ${err.message}`;
    }
}

async function runLisp(code) {
    clearOutput();
    output.textContent = "⏳ Running Common Lisp via Piston...";

    try {
        const response = await fetch(
            "https://emkc.org/api/v2/piston/execute",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    language: "lisp",
                    version: "*",
                    files: [{ content: code }]
                })
            }
        );

        const result = await response.json();

        output.textContent =
            result.run?.stdout ||
            result.run?.stderr ||
            result.compile?.stderr ||
            "✅ Code ran successfully with no terminal output.";

    } catch (err) {
        output.textContent = `❌ Network Error: ${err.message}`;
    }
}

async function runGroovy(code) {
    clearOutput();
    output.textContent = "⏳ Running Groovy via Piston...";
async function runVbNet(code) {
    clearOutput();
    output.textContent = "⏳ Running VB.NET via Piston...";
async function runFSharp(code) {
    clearOutput();
    output.textContent = "⏳ Running F# via Piston...";
async function runProlog(code) {
    clearOutput();
    output.textContent = "⏳ Running Prolog via Piston...";

    try {
        const response = await fetch(
            "https://emkc.org/api/v2/piston/execute",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    language: "groovy",
                    language: "vb.net",
                    language: "fsharp",
                    language: "prolog",
                    version: "*",
                    files: [{ content: code }]
                })
            }
        );

        const result = await response.json();

        output.textContent =
            result.run?.stdout ||
            result.run?.stderr ||
            result.compile?.stderr ||
            "✅ Code ran successfully with no terminal output.";

    } catch (err) {
        output.textContent = `❌ Network Error: ${err.message}`;
    }
}

// --- PROFILER FUNCTIONS ---

let profilerChartInstance = null;

function drawProfilerChart(canvas, results) {
    if (!canvas) return;
    if (!window.Chart) {
        console.warn('Chart.js is not loaded.');
        return;
    }

    const isLight = document.documentElement.classList.contains('light-mode');
    const textColor = isLight ? '#0f172a' : '#f8fafc';
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';

    const labels = results.map(r => `N=${r.N}`);
    const empiricalData = results.map(r => r.time);
    const maxN = results[results.length - 1].N;
    const maxTime = Math.max(0.001, results[results.length - 1].time);

    const refFns = {
        'O(1)': n => 1,
        'O(log N)': n => Math.log2(Math.max(1, n)),
        'O(N)': n => n,
        'O(N log N)': n => n * Math.log2(Math.max(1, n)),
        'O(N²)': n => n * n
    };

    const refColors = {
        'O(1)': '#94a3b8',
        'O(log N)': '#3b82f6',
        'O(N)': '#10b981',
        'O(N log N)': '#f59e0b',
        'O(N²)': '#ef4444'
    };

    const datasets = [
        {
            label: 'Your Code (Empirical)',
            data: empiricalData,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            borderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8,
            tension: 0.2,
            fill: false
        }
    ];

    for (const [name, fn] of Object.entries(refFns)) {
        const scale = maxTime / (fn(maxN) || 1);
        const curveData = results.map(r => Math.max(0, fn(r.N) * scale));
        datasets.push({
            label: name,
            data: curveData,
            borderColor: refColors[name],
            borderDash: [4, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false
        });
    }

    if (profilerChartInstance) {
        profilerChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    profilerChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: textColor,
                        font: { family: 'Outfit, Inter, sans-serif', size: 11 },
                        usePointStyle: true,
                        boxWidth: 8
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = typeof context.raw === 'number' ? context.raw.toFixed(3) : context.raw;
                            return `${context.dataset.label}: ${val} ms`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor },
                    title: { display: true, text: 'Input Size (N)', color: textColor }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { color: textColor },
                    title: { display: true, text: 'Execution Time (ms)', color: textColor },
                    beginAtZero: true
                }
            }
        }
    });
}

function estimateComplexity(results) {
    if (results.length < 2) return 'O(1)';
    const shapes = {
        'O(1)': n => 1,
        'O(log N)': n => Math.log2(n || 1),
        'O(N)': n => n,
        'O(N log N)': n => n * Math.log2(n || 1),
        'O(N²)': n => n * n,
        'O(N³)': n => n * n * n,
        'O(2ᴺ)': n => Math.pow(2, Math.min(n, 30))
    };

    let bestFit = 'O(N)';
    let minError = Infinity;
    const maxN = results[results.length - 1].N;
    const maxTime = results[results.length - 1].time || 0.001;

    for (const [name, fn] of Object.entries(shapes)) {
        let error = 0;
        const scale = maxTime / (fn(maxN) || 1);

        for (const r of results) {
            const expected = fn(r.N) * scale;
            error += Math.pow((r.time - expected) / Math.max(0.001, maxTime), 2);
        }

        if (error < minError) {
            minError = error;
            bestFit = name;
        }
    }
    return bestFit;
}

async function runProfiler() {
    const lang = currentLanguage || (languageSelector ? languageSelector.value : 'javascript');
    if (lang !== 'javascript') {
        alert('The Interactive Profiler currently supports JavaScript in the browser.');
        return;
    }

    const code = editor ? editor.getValue() : '';
    if (!code || !code.trim()) {
        alert('Please write some code to profile.');
        return;
    }

    const modal = document.getElementById('profilerModal');
    if (modal) modal.style.display = 'flex';

    const statusEl = document.getElementById('profilerStatus');
    if (statusEl) statusEl.textContent = 'Running profiler against N = 10, 100, 1000, 5000...';

    const compEl = document.getElementById('profComplexity');
    const avgEl = document.getElementById('profAvgTime');
    const fastEl = document.getElementById('profFastest');
    const slowEl = document.getElementById('profSlowest');

    if (compEl) compEl.textContent = 'Profiling...';
    if (avgEl) avgEl.textContent = '- ms';
    if (fastEl) fastEl.textContent = '- ms';
    if (slowEl) slowEl.textContent = '- ms';

    await new Promise(r => setTimeout(r, 50));

    const origLog = console.log;
    console.log = () => {};

    try {
        let solveFn;
        try {
            solveFn = new Function(
                '"use strict";\n' + code + '\nreturn (typeof solve !== "undefined" ? solve : (typeof solution !== "undefined" ? solution : (typeof main !== "undefined" ? main : null)));'
            )();
        } catch (e) {
            throw new Error('Syntax or compilation error: ' + e.message);
        }

        if (typeof solveFn !== 'function') {
            try {
                solveFn = new Function('input', '"use strict";\n' + code);
            } catch (e) {
                throw new Error('Could not find or construct executable function. Ensure code defines a solve() function.');
            }
        }

        const sampleArr = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100));
        let isArgArray = true;

        try {
            solveFn([...sampleArr]);
        } catch (errArr) {
            try {
                solveFn(10);
                isArgArray = false;
            } catch (errNum) {
                throw new Error('Execution error on sample input: ' + errArr.message);
            }
        }

        const sizes = [10, 100, 1000, 5000];
        const results = [];

        for (const N of sizes) {
            if (statusEl) statusEl.textContent = `Benchmarking size N = ${N}...`;
            const input = isArgArray
                ? Array.from({ length: N }, () => Math.floor(Math.random() * 1000))
                : N;

            const iterations = N <= 100 ? 5 : 1;
            const start = performance.now();
            for (let i = 0; i < iterations; i++) {
                if (isArgArray) {
                    solveFn([...input]);
                } else {
                    solveFn(input);
                }
            }
            const end = performance.now();
            const timeTaken = Math.max(0.001, (end - start) / iterations);

            results.push({ N, time: timeTaken });

            await new Promise(r => setTimeout(r, 15));

            if (timeTaken > 1500 && N !== sizes[sizes.length - 1]) {
                if (statusEl) statusEl.textContent = `Stopped profiling at N = ${N} due to timeout (>1.5s).`;
                break;
            }
        }

        if (statusEl && results.length === sizes.length) {
            statusEl.textContent = 'Profiling complete across generated datasets (N = 10, 100, 1000, 5000).';
        }

        const times = results.map(r => r.time);
        const avgTime = times.reduce((acc, t) => acc + t, 0) / times.length;
        const fastest = Math.min(...times);
        const slowest = Math.max(...times);
        const complexity = estimateComplexity(results);

        if (compEl) compEl.textContent = complexity;
        if (avgEl) avgEl.textContent = avgTime.toFixed(3) + ' ms';
        if (fastEl) fastEl.textContent = fastest.toFixed(3) + ' ms';
        if (slowEl) slowEl.textContent = slowest.toFixed(3) + ' ms';

        const canvas = document.getElementById('profilerChart');
        if (canvas) {
            drawProfilerChart(canvas, results);
        }
    } catch (e) {
        if (compEl) compEl.textContent = 'Error';
        if (statusEl) statusEl.textContent = 'Profiling error: ' + e.message;
        alert(e.message || 'Error during profiling');
        console.error(e);
    } finally {
        console.log = origLog;
    }
}

// --- EXPORT ---

export {
    initEditor,
    updateEditorTheme,
    runCode,
    runProfiler,
    drawProfilerChart,
    estimateComplexity,
    clearOutput,
    resetEditor,
    saveCode
};

// --- INITIALIZE ---

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initEditor);
