// Fully Persistent Red-Black Tree Visualizer with Path Copying

let globalNodeId = 0;

class PRBNode {
  constructor(val, color = 'RED', left = null, right = null, id = null) {
    this.val = val;
    this.color = color; // 'RED' or 'BLACK'
    this.left = left;
    this.right = right;
    this.id = id !== null ? id : ++globalNodeId;
    this.x = 0;
    this.y = 0;
  }

  clone(newColor = this.color) {
    return new PRBNode(this.val, newColor, this.left, this.right);
  }
}

class PersistentRBTree {
  constructor() {
    this.versions = [null]; // Version 0 is empty root
    this.versionLogs = ["V0: Initialized empty tree"];
    this.nodeRegistry = new Set();
  }

  isRed(node) {
    return node !== null && node.color === 'RED';
  }

  // Path Copy Insert
  insert(val) {
    const prevRoot = this.versions[this.versions.length - 1];
    let newRoot = this._insertRec(prevRoot, val);
    if (newRoot) newRoot.color = 'BLACK'; // Root is always black

    this.versions.push(newRoot);
    const vIdx = this.versions.length - 1;
    this.versionLogs.unshift(`V${vIdx}: Inserted key ${val}`);
    this._registerNodes(newRoot);
  }

  _insertRec(node, val) {
    if (node === null) {
      return new PRBNode(val, 'RED');
    }

    let newNode = node.clone();
    if (val < node.val) {
      newNode.left = this._insertRec(node.left, val);
    } else if (val > node.val) {
      newNode.right = this._insertRec(node.right, val);
    } else {
      return node; // Duplicate value, return original
    }

    // Rebalance with path copying
    return this._balance(newNode);
  }

  delete(val) {
    const prevRoot = this.versions[this.versions.length - 1];
    if (!prevRoot) return;

    let newRoot = this._deleteRec(prevRoot, val);
    if (newRoot) newRoot.color = 'BLACK';

    this.versions.push(newRoot);
    const vIdx = this.versions.length - 1;
    this.versionLogs.unshift(`V${vIdx}: Deleted key ${val}`);
    this._registerNodes(newRoot);
  }

  _deleteRec(node, val) {
    if (node === null) return null;

    let newNode = node.clone();
    if (val < node.val) {
      newNode.left = this._deleteRec(node.left, val);
    } else if (val > node.val) {
      newNode.right = this._deleteRec(node.right, val);
    } else {
      if (newNode.left === null) return newNode.right;
      if (newNode.right === null) return newNode.left;

      // Find min in right subtree
      let minNode = newNode.right;
      while (minNode.left !== null) minNode = minNode.left;

      newNode.val = minNode.val;
      newNode.right = this._deleteRec(newNode.right, minNode.val);
    }
    return this._balance(newNode);
  }

  _balance(node) {
    // Red-Black rebalancing rotations on cloned node
    if (this.isRed(node.right) && !this.isRed(node.left)) {
      node = this._rotateLeft(node);
    }
    if (this.isRed(node.left) && this.isRed(node.left.left)) {
      node = this._rotateRight(node);
    }
    if (this.isRed(node.left) && this.isRed(node.right)) {
      node = this._flipColors(node);
    }
    return node;
  }

  _rotateLeft(node) {
    const x = node.right.clone();
    node.right = x.left;
    x.left = node;
    x.color = node.color;
    node.color = 'RED';
    return x;
  }

  _rotateRight(node) {
    const x = node.left.clone();
    node.left = x.right;
    x.right = node;
    x.color = node.color;
    node.color = 'RED';
    return x;
  }

  _flipColors(node) {
    node.color = node.color === 'RED' ? 'BLACK' : 'RED';
    if (node.left) node.left = node.left.clone(node.left.color === 'RED' ? 'BLACK' : 'RED');
    if (node.right) node.right = node.right.clone(node.right.color === 'RED' ? 'BLACK' : 'RED');
    return node;
  }

  _registerNodes(node) {
    if (!node) return;
    this.nodeRegistry.add(node.id);
    this._registerNodes(node.left);
    this._registerNodes(node.right);
  }

  countNodes(node) {
    if (!node) return 0;
    return 1 + this.countNodes(node.left) + this.countNodes(node.right);
  }

  getNaiveTotalNodes() {
    let sum = 0;
    for (let root of this.versions) {
      sum += this.countNodes(root);
    }
    return sum;
  }
}

class PRBVisualizer {
  constructor() {
    this.tree = new PersistentRBTree();
    this.currentVersion = 0;
    this.highlightSharing = true;

    this.canvas = document.getElementById("rb-canvas");
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
    document.getElementById("btn-insert").addEventListener("click", () => {
      const val = parseInt(document.getElementById("val-input").value);
      if (!isNaN(val)) {
        this.tree.insert(val);
        this.currentVersion = this.tree.versions.length - 1;
        this.updateUI();
      }
    });

    document.getElementById("btn-delete").addEventListener("click", () => {
      const val = parseInt(document.getElementById("val-input").value);
      if (!isNaN(val)) {
        this.tree.delete(val);
        this.currentVersion = this.tree.versions.length - 1;
        this.updateUI();
      }
    });

    document.getElementById("btn-random").addEventListener("click", () => {
      const rnd = Math.floor(Math.random() * 90) + 10;
      this.tree.insert(rnd);
      this.currentVersion = this.tree.versions.length - 1;
      this.updateUI();
    });

    document.getElementById("btn-reset").addEventListener("click", () => {
      globalNodeId = 0;
      this.tree = new PersistentRBTree();
      this.currentVersion = 0;
      this.updateUI();
    });

    const slider = document.getElementById("version-slider");
    slider.addEventListener("input", (e) => {
      this.currentVersion = parseInt(e.target.value);
      this.updateUI(false);
    });

    document.getElementById("btn-toggle-sharing").addEventListener("click", () => {
      this.highlightSharing = !this.highlightSharing;
      this.draw();
    });
  }

  populateInitialData() {
    const initialKeys = [20, 10, 30, 5, 15, 25, 35];
    initialKeys.forEach((key) => this.tree.insert(key));
    this.currentVersion = this.tree.versions.length - 1;
    this.updateUI();
  }

  updateUI(updateSliderRange = true) {
    const slider = document.getElementById("version-slider");
    const maxV = this.tree.versions.length - 1;

    if (updateSliderRange) {
      slider.max = maxV;
      slider.value = this.currentVersion;
    }

    document.getElementById("stat-version").textContent = `V${this.currentVersion}`;
    document.getElementById("stat-total-v").textContent = maxV + 1;
    document.getElementById("slider-version-label").textContent = `V${this.currentVersion}`;
    document.getElementById("tree-version-title").textContent = `Version V${this.currentVersion}`;

    // Memory stats
    const actualAllocated = this.tree.nodeRegistry.size;
    const naiveNodes = this.tree.getNaiveTotalNodes();
    const saved = Math.max(0, naiveNodes - actualAllocated);
    const savedPct = naiveNodes > 0 ? Math.round((saved / naiveNodes) * 100) : 0;

    document.getElementById("stat-memory-saved").textContent = `${savedPct}%`;
    document.getElementById("metric-allocated").textContent = actualAllocated;
    document.getElementById("metric-naive").textContent = naiveNodes;
    document.getElementById("metric-saved-nodes").textContent = saved;

    // Logs
    const logContainer = document.getElementById("version-log");
    logContainer.innerHTML = "";
    this.tree.versionLogs.forEach((log) => {
      const div = document.createElement("div");
      div.className = "log-entry";
      div.textContent = log;
      logContainer.appendChild(div);
    });

    this.calculateTreePositions();
    this.draw();
  }

  calculateTreePositions() {
    const root = this.tree.versions[this.currentVersion];
    if (!root) return;

    const width = this.canvas.width;
    const startY = 50;

    const setPos = (node, x, y, level, dx) => {
      if (!node) return;
      node.x = x;
      node.y = y;
      setPos(node.left, x - dx, y + 60, level + 1, dx / 1.8);
      setPos(node.right, x + dx, y + 60, level + 1, dx / 1.8);
    };

    setPos(root, width / 2, startY, 1, width / 4);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const root = this.tree.versions[this.currentVersion];
    if (!root) {
      this.ctx.fillStyle = "#94a3b8";
      this.ctx.font = "16px Inter";
      this.ctx.textAlign = "center";
      this.ctx.fillText("Tree is empty for this version.", this.canvas.width / 2, this.canvas.height / 2);
      return;
    }

    // Determine path-copied nodes vs shared nodes for this version relative to V_prev
    const currentNodes = new Set();
    const prevNodes = new Set();

    const collectNodes = (node, setObj) => {
      if (!node) return;
      setObj.add(node.id);
      collectNodes(node.left, setObj);
      collectNodes(node.right, setObj);
    };

    collectNodes(root, currentNodes);
    if (this.currentVersion > 0) {
      collectNodes(this.tree.versions[this.currentVersion - 1], prevNodes);
    }

    // Draw lines
    const drawEdges = (node) => {
      if (!node) return;
      if (node.left) {
        this.drawLine(node.x, node.y, node.left.x, node.left.y);
        drawEdges(node.left);
      }
      if (node.right) {
        this.drawLine(node.x, node.y, node.right.x, node.right.y);
        drawEdges(node.right);
      }
    };
    drawEdges(root);

    // Draw nodes
    const drawNodes = (node) => {
      if (!node) return;
      const isNewAlloc = this.currentVersion > 0 && !prevNodes.has(node.id);
      this.drawNode(node, isNewAlloc);
      drawNodes(node.left);
      drawNodes(node.right);
    };
    drawNodes(root);
  }

  drawLine(x1, y1, x2, y2) {
    this.ctx.save();
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawNode(node, isNewAlloc) {
    const radius = 20;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);

    if (this.highlightSharing && isNewAlloc) {
      this.ctx.fillStyle = "rgba(245, 158, 11, 0.3)";
      this.ctx.strokeStyle = "#f59e0b";
      this.ctx.lineWidth = 3;
    } else if (node.color === 'RED') {
      this.ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
      this.ctx.strokeStyle = "#ef4444";
      this.ctx.lineWidth = 2;
    } else {
      this.ctx.fillStyle = "rgba(51, 65, 85, 0.8)";
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 2;
    }

    this.ctx.fill();
    this.ctx.stroke();

    // Node Value Text
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "bold 13px Fira Code";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(node.val, node.x, node.y);

    // ID Badge
    this.ctx.fillStyle = "#94a3b8";
    this.ctx.font = "9px Inter";
    this.ctx.fillText(`#${node.id}`, node.x, node.y + radius + 10);
    this.ctx.restore();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.prbViz = new PRBVisualizer();
});
