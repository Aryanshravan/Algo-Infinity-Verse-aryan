// Suffix Automaton (SAM) String Graph Visualizer

class SAMState {
  constructor(len = 0, link = -1, isClone = false, id = 0) {
    this.len = len;
    this.link = link;
    this.next = {}; // char -> state_id
    this.isClone = isClone;
    this.id = id;
    this.x = 0;
    this.y = 0;
  }
}

class SuffixAutomaton {
  constructor() {
    this.reset();
  }

  reset() {
    this.st = [new SAMState(0, -1, false, 0)];
    this.sz = 1;
    this.last = 0;
    this.text = "";
  }

  extend(c) {
    const cur = this.sz++;
    this.st.push(new SAMState(this.st[this.last].len + 1, -1, false, cur));

    let p = this.last;
    while (p !== -1 && !(c in this.st[p].next)) {
      this.st[p].next[c] = cur;
      p = this.st[p].link;
    }

    if (p === -1) {
      this.st[cur].link = 0;
    } else {
      const q = this.st[p].next[c];
      if (this.st[p].len + 1 === this.st[q].len) {
        this.st[cur].link = q;
      } else {
        const clone = this.sz++;
        const cloneState = new SAMState(this.st[p].len + 1, this.st[q].link, true, clone);
        cloneState.next = { ...this.st[q].next };
        this.st.push(cloneState);

        while (p !== -1 && this.st[p].next[c] === q) {
          this.st[p].next[c] = clone;
          p = this.st[p].link;
        }
        this.st[q].link = clone;
        this.st[cur].link = clone;
      }
    }
    this.last = cur;
  }

  build(text) {
    this.reset();
    this.text = text;
    for (let i = 0; i < text.length; i++) {
      this.extend(text[i]);
    }
  }

  getDistinctSubstringsCount() {
    let count = 0;
    for (let i = 1; i < this.sz; i++) {
      count += this.st[i].len - this.st[this.st[i].link].len;
    }
    return count;
  }

  getTopologicalOrder() {
    const order = [...Array(this.sz).keys()];
    order.sort((a, b) => this.st[a].len - this.st[b].len);
    return order;
  }

  getLCPArray() {
    // Suffix Array & Kasai LCP algorithm for display
    const n = this.text.length;
    if (n === 0) return [];
    
    const sa = [];
    for (let i = 0; i < n; i++) sa.push(i);
    sa.sort((a, b) => this.text.slice(a).localeCompare(this.text.slice(b)));

    const rank = new Array(n);
    for (let i = 0; i < n; i++) rank[sa[i]] = i;

    const lcp = new Array(n).fill(0);
    let h = 0;
    for (let i = 0; i < n; i++) {
      if (rank[i] > 0) {
        const j = sa[rank[i] - 1];
        while (i + h < n && j + h < n && this.text[i + h] === this.text[j + h]) {
          h++;
        }
        lcp[rank[i]] = h;
        if (h > 0) h--;
      }
    }
    return lcp.map((val, idx) => ({ suffix: this.text.slice(sa[idx]), lcp: val }));
  }

  querySubstring(sub) {
    let p = 0;
    for (let i = 0; i < sub.length; i++) {
      const c = sub[i];
      if (!(c in this.st[p].next)) return false;
      p = this.st[p].next[c];
    }
    return true;
  }
}

// Visualizer Renderer
class SAMVisualizer {
  constructor() {
    this.sam = new SuffixAutomaton();
    this.canvas = document.getElementById("sam-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.selectedNode = null;
    this.animationTimer = null;
    this.stepIndex = 0;

    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());

    this.initEvents();
    this.buildFromInput();
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.draw();
  }

  initEvents() {
    document.getElementById("btn-build").addEventListener("click", () => this.buildFromInput());
    document.getElementById("btn-step").addEventListener("click", () => this.stepInsert());
    document.getElementById("btn-reset").addEventListener("click", () => this.reset());
    document.getElementById("btn-query").addEventListener("click", () => this.runQuery());

    this.canvas.addEventListener("click", (e) => this.handleCanvasClick(e));

    document.getElementById("modal-close").addEventListener("click", () => {
      document.getElementById("inspector-modal").style.display = "none";
    });
  }

  reset() {
    if (this.animationTimer) clearInterval(this.animationTimer);
    this.sam.reset();
    this.stepIndex = 0;
    this.updateStats();
    this.draw();
  }

  buildFromInput() {
    if (this.animationTimer) clearInterval(this.animationTimer);
    const text = document.getElementById("string-input").value.trim() || "abacaba";
    this.sam.build(text);
    this.calculateLayout();
    this.updateStats();
    this.draw();
  }

  stepInsert() {
    const text = document.getElementById("string-input").value.trim() || "abacaba";
    if (this.stepIndex === 0) {
      this.sam.reset();
      this.sam.text = text;
    }

    if (this.stepIndex < text.length) {
      this.sam.extend(text[this.stepIndex]);
      this.stepIndex++;
      this.calculateLayout();
      this.updateStats();
      this.draw();
    } else {
      this.stepIndex = 0;
    }
  }

  calculateLayout() {
    const n = this.sam.sz;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const margin = 60;

    // Group states by length (topological levels)
    const levels = {};
    for (let i = 0; i < n; i++) {
      const len = this.sam.st[i].len;
      if (!levels[len]) levels[len] = [];
      levels[len].push(this.sam.st[i]);
    }

    const maxLen = Math.max(...Object.keys(levels).map(Number));
    const xStep = (width - 2 * margin) / Math.max(1, maxLen);

    Object.keys(levels).forEach((lenStr) => {
      const len = Number(lenStr);
      const group = levels[len];
      const x = margin + len * xStep;
      const yStep = (height - 2 * margin) / (group.length + 1);

      group.forEach((state, idx) => {
        state.x = x;
        state.y = margin + (idx + 1) * yStep;
      });
    });
  }

  updateStats() {
    document.getElementById("stat-states").textContent = this.sam.sz;
    document.getElementById("stat-substrings").textContent = this.sam.getDistinctSubstringsCount();

    const uniqueChars = new Set(this.sam.text).size;
    document.getElementById("stat-alphabet").textContent = uniqueChars;

    // Update Topological Order
    const topo = this.sam.getTopologicalOrder().join(" -> ");
    document.getElementById("topological-order").textContent = topo;

    // Update LCP Array
    const lcpData = this.sam.getLCPArray();
    const lcpContainer = document.getElementById("lcp-container");
    lcpContainer.innerHTML = "";
    lcpData.forEach((item, idx) => {
      const div = document.createElement("div");
      div.className = "lcp-cell";
      div.innerHTML = `<span class="idx">[${idx}] ${item.suffix}</span><strong>${item.lcp}</strong>`;
      lcpContainer.appendChild(div);
    });
  }

  runQuery() {
    const query = document.getElementById("query-input").value.trim();
    const resBox = document.getElementById("query-result");
    if (!query) {
      resBox.textContent = "Please enter a substring to search.";
      return;
    }
    const exists = this.sam.querySubstring(query);
    if (exists) {
      resBox.innerHTML = `<span style="color:#4ade80;">&#10004; Substring <strong>"${query}"</strong> EXISTS in SAM DAG!</span>`;
    } else {
      resBox.innerHTML = `<span style="color:#f472b6;">&#10008; Substring <strong>"${query}"</strong> NOT found.</span>`;
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Draw Suffix Links (Dashed Magenta Curves)
    for (let i = 1; i < this.sam.sz; i++) {
      const u = this.sam.st[i];
      const v = this.sam.st[u.link];
      if (v) {
        this.drawCurveArrow(u.x, u.y, v.x, v.y, "#f472b6", "", true);
      }
    }

    // 2. Draw Transition Links (Solid Cyan Lines)
    for (let i = 0; i < this.sam.sz; i++) {
      const u = this.sam.st[i];
      Object.keys(u.next).forEach((char) => {
        const v = this.sam.st[u.next[char]];
        if (v) {
          this.drawArrow(u.x, u.y, v.x, v.y, "#38bdf8", char);
        }
      });
    }

    // 3. Draw Nodes
    for (let i = 0; i < this.sam.sz; i++) {
      const u = this.sam.st[i];
      this.drawNode(u);
    }
  }

  drawNode(u) {
    const radius = 22;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(u.x, u.y, radius, 0, 2 * Math.PI);

    if (u.isClone) {
      this.ctx.fillStyle = "rgba(251, 191, 36, 0.2)";
      this.ctx.strokeStyle = "#fbbf24";
    } else if (u.id === this.sam.last) {
      this.ctx.fillStyle = "rgba(74, 222, 128, 0.2)";
      this.ctx.strokeStyle = "#4ade80";
    } else {
      this.ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
      this.ctx.strokeStyle = "#38bdf8";
    }

    this.ctx.lineWidth = 2;
    this.ctx.fill();
    this.ctx.stroke();

    // Node Text
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "bold 12px Inter";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(`S${u.id}`, u.x, u.y - 4);

    this.ctx.fillStyle = "#94a3b8";
    this.ctx.font = "10px Fira Code";
    this.ctx.fillText(`l:${u.len}`, u.x, u.y + 8);
    this.ctx.restore();
  }

  drawArrow(fromX, fromY, toX, toY, color, label) {
    const radius = 22;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    const startX = fromX + radius * Math.cos(angle);
    const startY = fromY + radius * Math.sin(angle);
    const endX = toX - radius * Math.cos(angle);
    const endY = toY - radius * Math.sin(angle);

    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;
    this.ctx.lineWidth = 1.5;

    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();

    // Arrowhead
    this.ctx.beginPath();
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(endX - 8 * Math.cos(angle - Math.PI / 6), endY - 8 * Math.sin(angle - Math.PI / 6));
    this.ctx.lineTo(endX - 8 * Math.cos(angle + Math.PI / 6), endY - 8 * Math.sin(angle + Math.PI / 6));
    this.ctx.closePath();
    this.ctx.fill();

    // Label
    if (label) {
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      this.ctx.fillStyle = "#fbbf24";
      this.ctx.font = "bold 12px Fira Code";
      this.ctx.fillText(label, midX, midY - 6);
    }
    this.ctx.restore();
  }

  drawCurveArrow(fromX, fromY, toX, toY, color, label, isDashed) {
    const radius = 22;
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2 - 40;

    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1.5;
    if (isDashed) this.ctx.setLineDash([4, 4]);

    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY - radius);
    this.ctx.quadraticCurveTo(midX, midY, toX, toY - radius);
    this.ctx.stroke();
    this.ctx.restore();
  }

  handleCanvasClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    for (let i = 0; i < this.sam.sz; i++) {
      const u = this.sam.st[i];
      const dist = Math.hypot(clickX - u.x, clickY - u.y);
      if (dist <= 22) {
        this.openInspector(u);
        return;
      }
    }
  }

  openInspector(u) {
    document.getElementById("modal-state-id").textContent = `State ${u.id}`;
    document.getElementById("modal-len").textContent = u.len;
    document.getElementById("modal-link").textContent = u.link;
    document.getElementById("modal-clone").textContent = u.isClone ? "true (Cloned state)" : "false";

    const transBox = document.getElementById("modal-transitions");
    transBox.innerHTML = "";
    if (Object.keys(u.next).length === 0) {
      transBox.textContent = "None (Terminal state)";
    } else {
      Object.keys(u.next).forEach((char) => {
        const div = document.createElement("div");
        div.textContent = `'${char}' -> State ${u.next[char]}`;
        transBox.appendChild(div);
      });
    }

    const subBox = document.getElementById("modal-substrings");
    const minLen = u.link === -1 ? 0 : this.sam.st[u.link].len + 1;
    subBox.innerHTML = `Accepts substrings of length [${minLen} .. ${u.len}]`;

    document.getElementById("inspector-modal").style.display = "flex";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.samViz = new SAMVisualizer();
});
