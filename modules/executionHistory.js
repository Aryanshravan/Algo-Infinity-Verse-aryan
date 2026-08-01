const API = "/api";

export class ExecutionHistory {
  constructor(containerEl) {
    this.container = containerEl;
    this.executions = [];
    this.filtered = [];
    this.state = "list";
    this.currentExecution = null;
    this.currentStep = -1;
    this.snapshots = [];
    this.currentCodeLines = [];

    this.render();
  }

  async render() {
    // Filters are now rendered into the #ehFilters container from the HTML
    const filterContainer = document.getElementById("ehFilters");
    if (filterContainer) {
      filterContainer.innerHTML = `
        <select id="ehFilterLang" class="eh-filter-select" aria-label="Filter by language">
          <option value="">All Languages</option>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>
        <input type="date" id="ehFilterFrom" class="eh-filter-date" aria-label="From date" />
        <input type="date" id="ehFilterTo" class="eh-filter-date" aria-label="To date" />
        <button id="ehFilterBtn" class="eh-btn eh-btn-primary eh-btn-sm" aria-label="Apply filters">
          <i class="fas fa-filter"></i> Filter
        </button>
        <button id="ehClearFilterBtn" class="eh-btn eh-btn-ghost eh-btn-sm" aria-label="Clear filters">
          Clear
        </button>
      `;
    }

    this.container.innerHTML = `
      <div id="ehListView" class="eh-list-view"></div>
      <div id="ehReplayView" class="eh-replay-view" style="display:none"></div>
    `;

    this.listView = this.container.querySelector("#ehListView");
    this.replayView = this.container.querySelector("#ehReplayView");

    const filterBtn = document.getElementById("ehFilterBtn");
    const clearBtn = document.getElementById("ehClearFilterBtn");
    if (filterBtn) filterBtn.addEventListener("click", () => this.applyFilters());
    if (clearBtn) clearBtn.addEventListener("click", () => this.clearFilters());

    await this.fetchExecutions();
  }

  async fetchExecutions() {
    this.listView.innerHTML = `<div class="eh-loading"><i class="fas fa-spinner fa-spin"></i> Loading executions...</div>`;
    try {
      const res = await fetch(`${API}/executions`);
      if (res.status === 401) {
        this.listView.innerHTML = `
          <div class="eh-empty">
            <i class="fas fa-lock eh-empty-icon" aria-hidden="true"></i>
            <h3>Sign in to view execution history</h3>
            <p>Your past code runs are tied to your account. Sign in to browse, inspect, and replay them.</p>
            <a href="/pages/auth/login.html" class="eh-btn eh-btn-primary eh-btn-sm">
              Sign In
            </a>
          </div>`;
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.executions = data.executions || [];
      this.filtered = [...this.executions];
      this.renderList();
    } catch (err) {
      this.listView.innerHTML = `<div class="eh-loading">Failed to load execution history. ${this.escapeHtml(err.message)}</div>`;
    }
  }

  applyFilters() {
    const lang = document.getElementById("ehFilterLang")?.value || "";
    const from = document.getElementById("ehFilterFrom")?.value || "";
    const to = document.getElementById("ehFilterTo")?.value || "";

    this.filtered = this.executions.filter((e) => {
      if (lang && e.language?.toLowerCase() !== lang.toLowerCase()) return false;
      if (from && new Date(e.createdAt) < new Date(from)) return false;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        if (new Date(e.createdAt) > end) return false;
      }
      return true;
    });
    this.renderList();
  }

  clearFilters() {
    const langEl = document.getElementById("ehFilterLang");
    const fromEl = document.getElementById("ehFilterFrom");
    const toEl = document.getElementById("ehFilterTo");
    if (langEl) langEl.value = "";
    if (fromEl) fromEl.value = "";
    if (toEl) toEl.value = "";
    this.filtered = [...this.executions];
    this.renderList();
  }

  renderList() {
    if (this.filtered.length === 0) {
      this.listView.innerHTML = `
        <div class="eh-empty">
          <i class="fas fa-inbox eh-empty-icon" aria-hidden="true"></i>
          <h3>No execution records found</h3>
          <p>Run some code in the playground to see your history here.</p>
          <a href="/code-playground.html" class="eh-btn eh-btn-primary eh-btn-sm">
            Go to Playground
          </a>
        </div>`;
      return;
    }

    const total = this.executions.length;
    this.listView.innerHTML = `
      <div class="eh-count">Showing <span>${this.filtered.length}</span> of <span>${total}</span> execution${total !== 1 ? "s" : ""}</div>
      <div class="eh-cards">${this.filtered.map((e, idx) => this.cardHTML(e, idx)).join("")}</div>
    `;

    this.listView.querySelectorAll(".eh-card").forEach((card) => {
      const id = card.dataset.id;
      card.addEventListener("click", () => this.openReplay(id));
      // Keyboard accessibility: allow Enter/Space to open
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.openReplay(id);
        }
      });
    });
  }

  cardHTML(e, idx) {
    const status = e.error ? "error" : e.exitCode === 0 ? "success" : "error";
    const date = new Date(e.createdAt).toLocaleString();
    const langIcon = this.langIcon(e.language);
    const hasSnapshots = e.hasSnapshots;
    const delay = Math.min(idx * 50, 400);

    return `
      <div class="eh-card eh-reveal" data-id="${e.id}" tabindex="0" role="button" aria-label="Open execution from ${date}" style="animation-delay: ${delay}ms">
        <div class="eh-card-header">
          <span class="eh-card-lang">${langIcon} ${e.language || "unknown"}</span>
          <span class="eh-card-status eh-status-${status}">${status}</span>
        </div>
        <div class="eh-card-body">
          <pre class="eh-card-preview"><code>${this.escapeHtml(e.preview || "")}</code></pre>
        </div>
        <div class="eh-card-footer">
          <span><i class="far fa-clock"></i> ${date}</span>
          ${e.cpuTime ? `<span><i class="fas fa-microchip"></i> ${e.cpuTime}s</span>` : ""}
          ${hasSnapshots ? `<span class="eh-card-trace"><i class="fas fa-list"></i> Trace</span>` : ""}
        </div>
      </div>
    `;
  }

  async openReplay(execId) {
    this.listView.style.display = "none";
    this.replayView.style.display = "block";
    this.replayView.innerHTML = `<div class="eh-loading"><i class="fas fa-spinner fa-spin"></i> Loading execution...</div>`;

    try {
      const res = await fetch(`${API}/executions/${execId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.currentExecution = data.execution;
      this.currentStep = -1;
      this.snapshots = this.currentExecution.variableSnapshots || [];
      this.currentCodeLines = (this.currentExecution.originalCode || this.stripHarness(this.currentExecution.sourceCode) || this.currentExecution.sourceCode || "").split("\n");
      this.renderReplay();
    } catch (err) {
      this.replayView.innerHTML = `
        <div class="eh-empty">
          <i class="fas fa-exclamation-triangle eh-empty-icon"></i>
          <h3>Failed to load execution</h3>
          <p>${this.escapeHtml(err.message)}</p>
          <button id="ehBackFromError" class="eh-btn eh-btn-ghost eh-btn-sm">
            <i class="fas fa-arrow-left"></i> Back to list
          </button>
        </div>`;
      const backBtn = document.getElementById("ehBackFromError");
      if (backBtn) backBtn.addEventListener("click", () => this.closeReplay());
    }
  }

  renderReplay() {
    const exec = this.currentExecution;
    const date = new Date(exec.createdAt).toLocaleString();
    const langIcon = this.langIcon(exec.language);
    const hasSnapshots = this.snapshots.length > 0;
    const canTrace = exec.language?.toLowerCase() === "javascript";

    this.replayView.innerHTML = `
      <div class="eh-replay-layout">
        <div class="eh-replay-toolbar">
          <button id="ehReplayBackBtn" class="eh-btn eh-btn-ghost eh-btn-sm">
            <i class="fas fa-arrow-left"></i> Back
          </button>
          <span class="eh-replay-title">${langIcon} ${exec.language} — ${date}</span>
          <div class="eh-replay-stats">
            ${exec.cpuTime ? `<span><i class="fas fa-microchip"></i> ${exec.cpuTime}s</span>` : ""}
            ${exec.memory ? `<span><i class="fas fa-memory"></i> ${exec.memory}</span>` : ""}
          </div>
        </div>

        <div class="eh-replay-main">
          <div class="eh-replay-code-panel">
            <div class="eh-replay-panel-header">
              <span><i class="fas fa-code"></i> Source Code</span>
              ${canTrace ? `<span class="eh-trace-badge ${hasSnapshots ? "has-trace" : ""}">
                <i class="fas fa-list"></i> ${hasSnapshots ? `${this.snapshots.length} snapshots` : "No trace"}
              </span>` : ""}
            </div>
            <div class="eh-code-display" id="ehCodeDisplay">
              <table class="eh-code-table">
                <tbody>${this.currentCodeLines.map((line, i) => `
                  <tr class="eh-code-line" data-line="${i + 1}" id="ehCodeline-${i + 1}">
                    <td class="eh-line-num">${i + 1}</td>
                    <td class="eh-line-code"><pre><code>${this.escapeHtml(line || " ")}</code></pre></td>
                  </tr>`).join("")}
                </tbody>
              </table>
            </div>
            <div class="eh-replay-controls">
              <button id="ehReplayStart" class="eh-btn eh-btn-ghost eh-btn-sm eh-btn-icon" title="Go to start" aria-label="Go to start">
                <i class="fas fa-step-backward"></i>
              </button>
              <button id="ehReplayPrev" class="eh-btn eh-btn-ghost eh-btn-sm eh-btn-icon" title="Previous step" aria-label="Previous step">
                <i class="fas fa-chevron-left"></i>
              </button>

              <!-- Signature: Step progress bar -->
              <div class="eh-step-progress-wrap">
                <div class="eh-step-progress" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="${hasSnapshots ? this.snapshots.length : this.currentCodeLines.length}" aria-label="Execution step progress">
                  <div class="eh-step-progress-fill" id="ehStepProgressFill"></div>
                </div>
                <span id="ehStepCounter">Step 0 / ${hasSnapshots ? this.snapshots.length : this.currentCodeLines.length}</span>
              </div>

              <button id="ehReplayNext" class="eh-btn eh-btn-primary eh-btn-sm eh-btn-icon" title="Next step" aria-label="Next step">
                <i class="fas fa-chevron-right"></i>
              </button>
              <button id="ehReplayEnd" class="eh-btn eh-btn-ghost eh-btn-sm eh-btn-icon" title="Go to end" aria-label="Go to end">
                <i class="fas fa-step-forward"></i>
              </button>
            </div>
          </div>

          <div class="eh-replay-sidebar">
            <div class="eh-vars-panel">
              <div class="eh-replay-panel-header">
                <span><i class="fas fa-chart-simple"></i> Variables</span>
              </div>
              <div id="ehVarsPanel" class="eh-vars-body">
                <div class="eh-vars-empty">Press <strong>Step</strong> to inspect variable state.</div>
              </div>
            </div>
            <div class="eh-output-panel">
              <div class="eh-replay-panel-header">
                <span><i class="fas fa-terminal"></i> Output</span>
              </div>
              <div class="eh-output-body" id="ehOutputPanel">
                <pre><code>${this.escapeHtml(exec.stdout || "(no output)")}</code></pre>
                ${exec.stderr ? `<pre class="eh-stderr"><code>${this.escapeHtml(exec.stderr)}</code></pre>` : ""}
                ${exec.error ? `<pre class="eh-stderr"><code>Error: ${this.escapeHtml(exec.error)}</code></pre>` : ""}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector("#ehReplayBackBtn").addEventListener("click", () => this.closeReplay());
    this.container.querySelector("#ehReplayStart").addEventListener("click", () => this.goToStep(-1));
    this.container.querySelector("#ehReplayPrev").addEventListener("click", () => this.prevStep());
    this.container.querySelector("#ehReplayNext").addEventListener("click", () => this.nextStep());
    this.container.querySelector("#ehReplayEnd").addEventListener("click", () => this.goToStep(hasSnapshots ? this.snapshots.length : this.currentCodeLines.length));
  }

  nextStep() {
    const max = this.snapshots.length > 0 ? this.snapshots.length - 1 : this.currentCodeLines.length - 1;
    if (this.currentStep < max) {
      this.goToStep(this.currentStep + 1);
    }
  }

  prevStep() {
    if (this.currentStep > -1) {
      this.goToStep(this.currentStep - 1);
    }
  }

  goToStep(step) {
    this.currentStep = step;
    this.highlightCodeLine(step);
    this.renderVariables(step);
    this.updateStepCounter(step);
  }

  highlightCodeLine(step) {
    this.container.querySelectorAll(".eh-code-line").forEach((el) => {
      el.classList.remove("eh-line-active", "eh-line-executed");
    });

    if (step < 0) return;

    let targetLine = -1;
    if (this.snapshots.length > 0 && step < this.snapshots.length) {
      targetLine = this.snapshots[step].line;
    } else {
      targetLine = Math.min(step, this.currentCodeLines.length - 1) + 1;
    }

    const el = this.container.querySelector(`#ehCodeline-${targetLine}`);
    if (el) {
      el.classList.add("eh-line-active");
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    // Mark previously executed lines when no snapshots
    if (this.snapshots.length === 0) {
      for (let i = 1; i <= step && i <= this.currentCodeLines.length; i++) {
        const prev = this.container.querySelector(`#ehCodeline-${i}`);
        if (prev) prev.classList.add("eh-line-executed");
      }
    } else {
      // Mark previously visited snapshot lines
      for (let s = 0; s <= step && s < this.snapshots.length; s++) {
        const sl = this.snapshots[s].line;
        const prev = this.container.querySelector(`#ehCodeline-${sl}`);
        if (prev && sl !== targetLine) prev.classList.add("eh-line-executed");
      }
    }
  }

  renderVariables(step) {
    const panel = this.container.querySelector("#ehVarsPanel");
    if (!panel) return;

    if (step < 0 || this.snapshots.length === 0) {
      panel.innerHTML = `<div class="eh-vars-empty">Press <strong>Step</strong> to inspect variable state.</div>`;
      return;
    }

    if (step >= this.snapshots.length) {
      step = this.snapshots.length - 1;
    }

    const snap = this.snapshots[step];
    if (!snap || !snap.vars || Object.keys(snap.vars).length === 0) {
      panel.innerHTML = `<div class="eh-vars-empty">No variables tracked at this step.</div>`;
      return;
    }

    const vars = snap.vars;
    const entries = Object.entries(vars).filter(([, v]) => v !== undefined);

    panel.innerHTML = `
      <div class="eh-vars-step">Line ${snap.line} — Step ${step + 1} of ${this.snapshots.length}</div>
      <div class="eh-vars-list">${entries.map(([name, value]) => `
        <div class="eh-var-item">
          <span class="eh-var-name">${this.escapeHtml(name)}</span>
          <span class="eh-var-eq">=</span>
          <span class="eh-var-value">${this.formatValue(value)}</span>
        </div>`).join("")}
      </div>`;
  }

  updateStepCounter(step) {
    const total = this.snapshots.length > 0 ? this.snapshots.length : this.currentCodeLines.length;
    const counter = document.getElementById("ehStepCounter");
    if (counter) counter.textContent = `Step ${Math.max(0, step + 1)} / ${total}`;

    // Update progress bar
    const progressFill = document.getElementById("ehStepProgressFill");
    const progressBar = document.querySelector(".eh-step-progress");
    if (progressFill && progressBar) {
      const pct = total > 0 ? ((step + 1) / total) * 100 : 0;
      progressFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
      progressBar.setAttribute("aria-valuenow", String(Math.max(0, step + 1)));
    }
  }

  stripHarness(code) {
    if (!code) return "";
    const markers = [
      "const __TC__",
      "__TC__ = json.loads",
      'cout << "__RESULT__',
      'printf("__RESULT__',
      'System.out.print("__RESULT__',
      'print("__RESULT__',
    ];
    const lines = code.split("\n");
    let cutAt = lines.length;
    for (const marker of markers) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(marker)) {
          cutAt = Math.min(cutAt, i);
          break;
        }
      }
    }
    return cutAt < lines.length ? lines.slice(0, cutAt).join("\n") : code;
  }

  closeReplay() {
    this.state = "list";
    this.currentExecution = null;
    this.currentStep = -1;
    this.snapshots = [];
    this.listView.style.display = "block";
    this.replayView.style.display = "none";
    // Scroll back to top of list
    this.container.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  formatValue(val) {
    if (val === null) return `<span class="eh-val-null">null</span>`;
    if (val === undefined) return `<span class="eh-val-undefined">undefined</span>`;
    if (typeof val === "boolean") return `<span class="eh-val-bool">${val}</span>`;
    if (typeof val === "number") return `<span class="eh-val-number">${val}</span>`;
    if (typeof val === "string") {
      if (val.length > 80) return `<span class="eh-val-string">"${this.escapeHtml(val.slice(0, 80))}…"</span>`;
      return `<span class="eh-val-string">"${this.escapeHtml(val)}"</span>`;
    }
    if (Array.isArray(val)) {
      if (val.length > 10) return `[${val.slice(0, 10).map((v) => this.formatValueShort(v)).join(", ")}, …] (${val.length} items)`;
      return `[${val.map((v) => this.formatValueShort(v)).join(", ")}]`;
    }
    if (typeof val === "object") {
      try {
        return this.escapeHtml(JSON.stringify(val, null, 1));
      } catch {
        return "[Object]";
      }
    }
    return this.escapeHtml(String(val));
  }

  formatValueShort(val) {
    if (val === null) return "null";
    if (typeof val === "string") return `"${val.slice(0, 20)}"`;
    if (typeof val === "number") return String(val);
    if (Array.isArray(val)) return `[${val.length}]`;
    return typeof val;
  }

  langIcon(lang) {
    const icons = {
      javascript: '<i class="fab fa-js" style="color:#f7df1e"></i>',
      python: '<i class="fab fa-python" style="color:#3776AB"></i>',
      java: '<i class="fab fa-java" style="color:#ED8B00"></i>',
      cpp: '<i class="fas fa-code" style="color:#00599C"></i>',
    };
    return icons[lang?.toLowerCase()] || '<i class="fas fa-code"></i>';
  }

  escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
}
