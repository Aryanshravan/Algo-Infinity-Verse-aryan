// Wavelet Tree Succinct Vector Simulator

class WaveletNode {
  constructor(chars, lowChar, highChar) {
    this.lowChar = lowChar;
    this.highChar = highChar;
    this.chars = chars;
    this.bitvector = [];
    this.left = null;
    this.right = null;
    this.highlightBit = -1;
    this.x = 0;
    this.y = 0;

    if (lowChar === highChar || chars.length === 0) return;

    const mid = Math.floor((lowChar + highChar) / 2);
    const leftChars = [];
    const rightChars = [];

    for (let c of chars) {
      const code = c.charCodeAt(0);
      if (code <= mid) {
        this.bitvector.push(0);
        leftChars.push(c);
      } else {
        this.bitvector.push(1);
        rightChars.push(c);
      }
    }

    if (leftChars.length > 0) {
      this.left = new WaveletNode(leftChars, lowChar, mid);
    }
    if (rightChars.length > 0) {
      this.right = new WaveletNode(rightChars, mid + 1, highChar);
    }
  }

  rankBit(bit, idx) {
    let count = 0;
    for (let i = 0; i <= idx && i < this.bitvector.length; i++) {
      if (this.bitvector[i] === bit) count++;
    }
    return count;
  }
}

class WaveletTreeVisualizer {
  constructor() {
    this.text = "";
    this.root = null;
    this.activePath = []; // list of nodes in current query path

    this.canvas = document.getElementById("wt-canvas");
    this.ctx = this.canvas.getContext("2d");

    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());

    this.initEvents();
    this.buildTree("wavelettree");
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.draw();
  }

  initEvents() {
    document.getElementById("btn-build-wt").addEventListener("click", () => {
      const str = document.getElementById("input-text").value.trim() || "wavelettree";
      this.buildTree(str);
    });

    document.getElementById("btn-sample-dna").addEventListener("click", () => {
      const dna = "GATTACAGATTACA";
      document.getElementById("input-text").value = dna;
      this.buildTree(dna);
    });

    document.getElementById("btn-access").addEventListener("click", () => this.runAccess());
    document.getElementById("btn-rank").addEventListener("click", () => this.runRank());
    document.getElementById("btn-select").addEventListener("click", () => this.runSelect());
  }

  buildTree(str) {
    this.text = str;
    if (str.length === 0) return;

    const codes = [...str].map((c) => c.charCodeAt(0));
    const minC = Math.min(...codes);
    const maxC = Math.max(...codes);

    this.root = new WaveletNode([...str], minC, maxC);
    this.activePath = [];

    this.updateStats();
    this.calculatePositions();
    this.log(`Built Wavelet Tree for "${str}" (Length: ${str.length}, Σ: ${new Set(str).size})`);
    this.draw();
  }

  updateStats() {
    const sigma = new Set(this.text).size;
    const n = this.text.length;

    document.getElementById("stat-sigma").textContent = sigma;
    document.getElementById("stat-length").textContent = n;

    // Bit calculations
    const rawBits = n * 8; // 8-bit ASCII
    const bitvectorBits = n * Math.ceil(Math.log2(Math.max(2, sigma)));
    const savedPct = rawBits > 0 ? Math.round(((rawBits - bitvectorBits) / rawBits) * 100) : 0;

    document.getElementById("stat-compression").textContent = `${savedPct}%`;
    document.getElementById("metric-raw-bits").textContent = `${rawBits} bits`;
    document.getElementById("metric-succinct-bits").textContent = `${bitvectorBits} bits`;
    document.getElementById("metric-saved-bits").textContent = `${savedPct}%`;
  }

  log(msg) {
    const logBox = document.getElementById("query-log");
    const div = document.createElement("div");
    div.className = "log-entry";
    div.textContent = msg;
    logBox.prepend(div);
  }

  clearHighlights(node = this.root) {
    if (!node) return;
    node.highlightBit = -1;
    this.clearHighlights(node.left);
    this.clearHighlights(node.right);
  }

  // Succinct Queries
  runAccess() {
    const idx = parseInt(document.getElementById("access-idx").value);
    if (isNaN(idx) || idx < 0 || idx >= this.text.length) {
      this.log(`Error: Index ${idx} out of bounds [0 .. ${this.text.length - 1}]`);
      return;
    }

    this.clearHighlights();
    this.activePath = [];

    let curr = this.root;
    let currIdx = idx;

    while (curr) {
      this.activePath.push(curr);
      if (curr.lowChar === curr.highChar || curr.bitvector.length === 0) {
        const resultChar = String.fromCharCode(curr.lowChar);
        this.log(`access(${idx}) => '${resultChar}' (Resolved at leaf)`);
        break;
      }

      const bit = curr.bitvector[currIdx];
      curr.highlightBit = currIdx;

      if (bit === 0) {
        currIdx = curr.rankBit(0, currIdx) - 1;
        curr = curr.left;
      } else {
        currIdx = curr.rankBit(1, currIdx) - 1;
        curr = curr.right;
      }
    }
    this.draw();
  }

  runRank() {
    const charStr = document.getElementById("rank-char").value.trim();
    const idx = parseInt(document.getElementById("rank-idx").value);

    if (!charStr || isNaN(idx) || idx < 0 || idx >= this.text.length) {
      this.log(`Error: Invalid rank input parameters`);
      return;
    }

    const targetCode = charStr.charCodeAt(0);
    this.clearHighlights();
    this.activePath = [];

    let curr = this.root;
    let currIdx = idx;

    while (curr) {
      this.activePath.push(curr);
      if (curr.lowChar === curr.highChar) break;

      const mid = Math.floor((curr.lowChar + curr.highChar) / 2);
      curr.highlightBit = currIdx;

      if (targetCode <= mid) {
        currIdx = curr.rankBit(0, currIdx) - 1;
        curr = curr.left;
      } else {
        currIdx = curr.rankBit(1, currIdx) - 1;
        curr = curr.right;
      }
    }

    const rankVal = currIdx + 1;
    this.log(`rank_${charStr}(${idx}) => ${rankVal} (Occurrences of '${charStr}' in prefix [0..${idx}])`);
    this.draw();
  }

  runSelect() {
    const charStr = document.getElementById("select-char").value.trim();
    const k = parseInt(document.getElementById("select-k").value);

    if (!charStr || isNaN(k) || k < 1) {
      this.log(`Error: Invalid select input parameters`);
      return;
    }

    // Direct search for verification & trace
    let count = 0;
    let foundIdx = -1;
    for (let i = 0; i < this.text.length; i++) {
      if (this.text[i] === charStr) {
        count++;
        if (count === k) {
          foundIdx = i;
          break;
        }
      }
    }

    if (foundIdx !== -1) {
      this.log(`select_${charStr}(${k}) => Index ${foundIdx} (${k}-th occurrence of '${charStr}')`);
    } else {
      this.log(`select_${charStr}(${k}) => Not found (${count} total occurrences)`);
    }
  }

  calculatePositions() {
    if (!this.root) return;
    const width = this.canvas.width;
    const startY = 40;

    const setPos = (node, x, y, dx) => {
      if (!node) return;
      node.x = x;
      node.y = y;
      if (node.left) setPos(node.left, x - dx, y + 90, dx / 1.9);
      if (node.right) setPos(node.right, x + dx, y + 90, dx / 1.9);
    };

    setPos(this.root, width / 2, startY, width / 4);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (!this.root) return;

    // Draw Edges
    const drawEdges = (node) => {
      if (!node) return;
      if (node.left) {
        this.drawLine(node.x, node.y, node.left.x, node.left.y, this.activePath.includes(node.left));
        drawEdges(node.left);
      }
      if (node.right) {
        this.drawLine(node.x, node.y, node.right.x, node.right.y, this.activePath.includes(node.right));
        drawEdges(node.right);
      }
    };
    drawEdges(this.root);

    // Draw Nodes
    const drawNodes = (node) => {
      if (!node) return;
      this.drawWaveletNode(node);
      drawNodes(node.left);
      drawNodes(node.right);
    };
    drawNodes(this.root);
  }

  drawLine(x1, y1, x2, y2, isActive) {
    this.ctx.save();
    this.ctx.strokeStyle = isActive ? "#10b981" : "rgba(255, 255, 255, 0.15)";
    this.ctx.lineWidth = isActive ? 3 : 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1 + 20);
    this.ctx.lineTo(x2, y2 - 15);
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawWaveletNode(node) {
    const isLeaf = node.lowChar === node.highChar;
    const isHighlighted = this.activePath.includes(node);

    this.ctx.save();

    if (isLeaf) {
      // Leaf Node (Character label)
      this.ctx.fillStyle = isHighlighted ? "rgba(16, 185, 129, 0.3)" : "rgba(56, 189, 248, 0.2)";
      this.ctx.strokeStyle = isHighlighted ? "#10b981" : "#38bdf8";
      this.ctx.lineWidth = 2;

      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, 18, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "bold 14px Fira Code";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(String.fromCharCode(node.lowChar), node.x, node.y);
    } else {
      // Internal Node (Bitvector box)
      const bvStr = node.bitvector.join(" ");
      this.ctx.font = "12px Fira Code";
      const textWidth = Math.max(80, this.ctx.measureText(bvStr).width + 20);
      const boxHeight = 28;

      this.ctx.fillStyle = isHighlighted ? "rgba(16, 185, 129, 0.2)" : "rgba(15, 23, 42, 0.85)";
      this.ctx.strokeStyle = isHighlighted ? "#10b981" : "rgba(255, 255, 255, 0.2)";
      this.ctx.lineWidth = isHighlighted ? 2 : 1;

      this.ctx.beginPath();
      this.ctx.roundRect(node.x - textWidth / 2, node.y - boxHeight / 2, textWidth, boxHeight, 6);
      this.ctx.fill();
      this.ctx.stroke();

      // Draw bitvector text with bit highlights
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";

      const startX = node.x - textWidth / 2 + 10;
      let xOffset = startX;

      node.bitvector.forEach((bit, idx) => {
        if (idx === node.highlightBit) {
          this.ctx.fillStyle = "#fbbf24";
          this.ctx.font = "bold 13px Fira Code";
        } else {
          this.ctx.fillStyle = "#ffffff";
          this.ctx.font = "12px Fira Code";
        }
        this.ctx.fillText(bit, xOffset, node.y);
        xOffset += 12;
      });

      // Range Label above
      const rangeText = `[${String.fromCharCode(node.lowChar)}-${String.fromCharCode(node.highChar)}]`;
      this.ctx.fillStyle = "#94a3b8";
      this.ctx.font = "10px Inter";
      this.ctx.fillText(rangeText, node.x, node.y - 20);
    }

    this.ctx.restore();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.wtViz = new WaveletTreeVisualizer();
});
