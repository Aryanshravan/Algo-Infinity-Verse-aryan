// Concurrent Lock-Free Skip List Visualizer with CAS Swapping

class SkipNode {
  constructor(val, level) {
    this.val = val;
    this.level = level;
    this.next = new Array(level).fill(null);
    this.marked = false; // Logical deletion flag
    this.x = 0;
    this.y = 0;
  }
}

class ConcurrentSkipList {
  constructor(maxLevel = 4, p = 0.5) {
    this.maxLevel = maxLevel;
    this.p = p;

    this.head = new SkipNode(-Infinity, maxLevel);
    this.tail = new SkipNode(Infinity, maxLevel);

    for (let i = 0; i < maxLevel; i++) {
      this.head.next[i] = this.tail;
    }

    this.casSuccessCount = 0;
    this.casFailedCount = 0;
    this.unlinkedCount = 0;
  }

  randomLevel() {
    let lvl = 1;
    while (Math.random() < this.p && lvl < this.maxLevel) {
      lvl++;
    }
    return lvl;
  }

  // Lock-Free Search returning predecessors & successors per level
  find(val) {
    let preds = new Array(this.maxLevel);
    let succs = new Array(this.maxLevel);

    let curr = this.head;
    for (let i = this.maxLevel - 1; i >= 0; i--) {
      while (curr.next[i] && curr.next[i].val < val) {
        curr = curr.next[i];
      }
      preds[i] = curr;
      succs[i] = curr.next[i];
    }
    return { preds, succs };
  }

  // Lock-Free CAS Insert
  casInsert(val, threadId = 0) {
    const level = this.randomLevel();
    const newNode = new SkipNode(val, level);

    let retries = 0;
    while (true) {
      const { preds, succs } = this.find(val);

      if (succs[0] && succs[0].val === val && !succs[0].marked) {
        return { success: false, reason: "Duplicate key", retries };
      }

      // Link new node's next pointers to successors
      for (let i = 0; i < level; i++) {
        newNode.next[i] = succs[i];
      }

      // Perform CAS on Level 0 first
      const pred0 = preds[0];
      const expectedSucc = succs[0];

      // Simulate atomic CAS check
      if (pred0.next[0] === expectedSucc) {
        // CAS Success!
        pred0.next[0] = newNode;
        this.casSuccessCount++;

        // Link higher levels
        for (let i = 1; i < level; i++) {
          if (preds[i].next[i] === succs[i]) {
            preds[i].next[i] = newNode;
            this.casSuccessCount++;
          }
        }
        return { success: true, retries, node: newNode };
      } else {
        // CAS Failed! Contention retry
        this.casFailedCount++;
        retries++;
        if (retries > 10) return { success: false, reason: "Too many CAS retries", retries };
      }
    }
  }

  // Lock-Free Two-Phase CAS Delete
  casDelete(val) {
    const { preds, succs } = this.find(val);
    const target = succs[0];

    if (!target || target.val !== val || target.marked) {
      return { success: false, reason: "Key not found" };
    }

    // Phase 1: Logical Marking (Tombstone)
    target.marked = true;
    this.casSuccessCount++;

    // Phase 2: Physical Unlinking
    for (let i = 0; i < target.level; i++) {
      if (preds[i] && preds[i].next[i] === target) {
        preds[i].next[i] = target.next[i];
        this.casSuccessCount++;
      }
    }
    this.unlinkedCount++;
    return { success: true, marked: true, unlinked: true };
  }

  getAllNodes() {
    const nodes = [];
    let curr = this.head;
    while (curr) {
      nodes.push(curr);
      curr = curr.next[0];
    }
    return nodes;
  }
}

class SkipListVisualizer {
  constructor() {
    this.list = new ConcurrentSkipList(4, 0.5);
    this.workerTimers = [];
    this.activeThreads = 0;

    this.canvas = document.getElementById("skiplist-canvas");
    this.ctx = this.canvas.getContext("2d");

    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());

    this.initEvents();
    this.populateInitialData();
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.draw();
  }

  initEvents() {
    document.getElementById("btn-cas-insert").addEventListener("click", () => {
      const val = parseInt(document.getElementById("key-input").value);
      if (!isNaN(val)) {
        const res = this.list.casInsert(val);
        this.log(res.success ? `CAS Inserted key ${val} (Retries: ${res.retries})` : `Insert failed: ${res.reason}`);
        this.updateUI();
      }
    });

    document.getElementById("btn-cas-delete").addEventListener("click", () => {
      const val = parseInt(document.getElementById("key-input").value);
      if (!isNaN(val)) {
        const res = this.list.casDelete(val);
        this.log(res.success ? `2-Phase CAS Deleted key ${val}` : `Delete failed: ${res.reason}`);
        this.updateUI();
      }
    });

    document.getElementById("btn-start-threads").addEventListener("click", () => this.startWorkerThreads());
    document.getElementById("btn-stop-threads").addEventListener("click", () => this.stopWorkerThreads());

    document.getElementById("cfg-max-level").addEventListener("change", (e) => {
      const lvl = Math.min(6, Math.max(2, parseInt(e.target.value) || 4));
      this.list = new ConcurrentSkipList(lvl, parseFloat(document.getElementById("cfg-prob").value));
      this.populateInitialData();
    });
  }

  populateInitialData() {
    [10, 25, 40, 55, 70].forEach((val) => this.list.casInsert(val));
    this.updateUI();
  }

  startWorkerThreads() {
    this.stopWorkerThreads();
    const count = parseInt(document.getElementById("cfg-threads").value) || 3;
    this.activeThreads = count;

    for (let t = 1; t <= count; t++) {
      const timer = setInterval(() => {
        const rnd = Math.floor(Math.random() * 90) + 5;
        if (Math.random() > 0.3) {
          const res = this.list.casInsert(rnd, t);
          if (res.retries > 0) {
            this.log(`Thread #${t} hit CAS Contention! Retried ${res.retries} times on key ${rnd}`);
          }
        } else {
          this.list.casDelete(rnd);
        }
        this.updateUI();
      }, 800 + t * 200);
      this.workerTimers.push(timer);
    }
    this.log(`Spawned ${count} concurrent worker threads.`);
    this.updateUI();
  }

  stopWorkerThreads() {
    this.workerTimers.forEach(clearInterval);
    this.workerTimers = [];
    this.activeThreads = 0;
    this.log(`Stopped worker threads.`);
    this.updateUI();
  }

  log(msg) {
    const logContainer = document.getElementById("cas-log");
    const div = document.createElement("div");
    div.className = "log-entry";
    div.textContent = msg;
    logContainer.prepend(div);
  }

  updateUI() {
    document.getElementById("stat-cas-retries").textContent = this.list.casFailedCount;
    document.getElementById("stat-active-threads").textContent = this.activeThreads;
    document.getElementById("stat-max-level").textContent = this.list.maxLevel;

    document.getElementById("metric-cas-success").textContent = this.list.casSuccessCount;
    document.getElementById("metric-cas-failed").textContent = this.list.casFailedCount;
    document.getElementById("metric-unlinked").textContent = this.list.unlinkedCount;

    this.calculateNodePositions();
    this.draw();
  }

  calculateNodePositions() {
    const nodes = this.list.getAllNodes();
    const width = this.canvas.width;
    const height = this.canvas.height;
    const marginX = 70;
    const stepX = (width - 2 * marginX) / Math.max(1, nodes.length - 1);

    nodes.forEach((node, idx) => {
      node.x = marginX + idx * stepX;
      node.y = height - 80;
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const nodes = this.list.getAllNodes();
    const maxLevel = this.list.maxLevel;

    // Draw Level Guidelines
    for (let l = 0; l < maxLevel; l++) {
      const y = this.canvas.height - 80 - l * 50;
      this.ctx.save();
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(40, y);
      this.ctx.lineTo(this.canvas.width - 40, y);
      this.ctx.stroke();

      this.ctx.fillStyle = "#64748b";
      this.ctx.font = "10px Fira Code";
      this.ctx.fillText(`L${l}`, 20, y + 4);
      this.ctx.restore();
    }

    // Draw Pointers per level
    for (let l = 0; l < maxLevel; l++) {
      for (let i = 0; i < nodes.length; i++) {
        const u = nodes[i];
        const v = u.next[l];
        if (v && l < u.level) {
          const y = this.canvas.height - 80 - l * 50;
          this.drawArrow(u.x, y, v.x, y, u.marked ? "#64748b" : "#fbbf24");
        }
      }
    }

    // Draw Node Towers
    nodes.forEach((node) => {
      this.drawNodeTower(node);
    });
  }

  drawArrow(x1, y1, x2, y2, color) {
    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;
    this.ctx.lineWidth = 1.5;

    this.ctx.beginPath();
    this.ctx.moveTo(x1 + 14, y1);
    this.ctx.lineTo(x2 - 14, y1);
    this.ctx.stroke();

    // Arrowhead
    this.ctx.beginPath();
    this.ctx.moveTo(x2 - 14, y1);
    this.ctx.lineTo(x2 - 20, y1 - 4);
    this.ctx.lineTo(x2 - 20, y1 + 4);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();
  }

  drawNodeTower(node) {
    const towerWidth = 28;
    const cellHeight = 24;

    for (let l = 0; l < node.level; l++) {
      const y = this.canvas.height - 80 - l * 50;

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.roundRect(node.x - towerWidth / 2, y - cellHeight / 2, towerWidth, cellHeight, 4);

      if (node.marked) {
        this.ctx.fillStyle = "rgba(100, 116, 139, 0.4)";
        this.ctx.strokeStyle = "#64748b";
      } else if (node.val === -Infinity || node.val === Infinity) {
        this.ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
        this.ctx.strokeStyle = "#38bdf8";
      } else {
        this.ctx.fillStyle = "rgba(251, 191, 36, 0.2)";
        this.ctx.strokeStyle = "#fbbf24";
      }

      this.ctx.lineWidth = 1.5;
      this.ctx.fill();
      this.ctx.stroke();

      // Node Key Text
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "bold 11px Fira Code";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";

      let label = node.val;
      if (node.val === -Infinity) label = "-∞";
      if (node.val === Infinity) label = "+∞";
      this.ctx.fillText(label, node.x, y);

      this.ctx.restore();
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.skiplistViz = new SkipListVisualizer();
});
