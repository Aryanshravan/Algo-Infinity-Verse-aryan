document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try {
    lctInit();
  } catch (e) {
    console.error('LCTInit:', e);
  }
});

/**
 * Hides loading screen.
 */
function initLoadingScreen() {
  setTimeout(() => {
    const s = document.getElementById('loading-screen');
    if (s) s.classList.add('hidden');
  }, 1000);
}

/**
 * Initializes scroll to top button.
 */
function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/**
 * Initializes mobile navigation toggle.
 */
function initNavbar() {
  document.addEventListener('click', (e) => {
    const menuToggle = e.target.closest('#menuToggle');
    if (menuToggle) {
      const navLinks = document.getElementById('navLinks');
      if (!navLinks) return;
      e.stopPropagation();
      let overlay = document.querySelector('.nav-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'nav-overlay';
        document.body.appendChild(overlay);
      }
      const isOpen = !navLinks.classList.contains('active');
      navLinks.classList.toggle('active', isOpen);
      menuToggle.setAttribute('aria-expanded', isOpen);
      overlay.classList.toggle('active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
      const icon = menuToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars', !isOpen);
        icon.classList.toggle('fa-times', isOpen);
      }
    }
    if (e.target.classList.contains('nav-overlay')) {
      const navLinks = document.getElementById('navLinks');
      const menuToggle = document.getElementById('menuToggle');
      if (navLinks && menuToggle) {
        navLinks.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        e.target.classList.remove('active');
        document.body.style.overflow = '';
        const icon = menuToggle.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-times');
        }
      }
    }
  });
}

/* ─── Link-Cut Tree Data Structure Classes ─── */

/**
 * Represents a node in the Link-Cut Tree (acting as a Splay Tree node).
 */
class LCTNode {
  /**
   * @param {number} id - Unique identifier of the node.
   * @param {number} val - Node value.
   */
  constructor(id, val) {
    this.id = id;
    this.val = val;
    this.sum = val;
    this.parent = null;
    this.left = null;
    this.right = null;
    this.reversed = false;
  }
}

/**
 * Implements Link-Cut Tree (Splay Tree-based dynamic forest).
 */
class LinkCutTree {
  /**
   * @param {number} n - Number of nodes in the LCT.
   */
  constructor(n) {
    this.nodes = [];
    for (let i = 1; i <= n; i++) {
      this.nodes[i] = new LCTNode(i, i); // Value defaults to ID
    }
    // Track represented virtual forest edges undirected via adjacency list
    this.adj = Array.from({ length: n + 1 }, () => []);
  }

  /**
   * Returns true if x is the root of its auxiliary Splay tree.
   * @param {LCTNode} x - LCT node.
   * @returns {boolean}
   */
  isRoot(x) {
    return !x.parent || (x.parent.left !== x && x.parent.right !== x);
  }

  /**
   * Propagates lazy tags (reversals) down to children.
   * @param {LCTNode} x - LCT node.
   */
  push(x) {
    if (x && x.reversed) {
      const temp = x.left;
      x.left = x.right;
      x.right = temp;
      if (x.left) x.left.reversed = !x.left.reversed;
      if (x.right) x.right.reversed = !x.right.reversed;
      x.reversed = false;
    }
  }

  /**
   * Recalculates subtree parameters (sum).
   * @param {LCTNode} x - LCT node.
   */
  update(x) {
    if (x) {
      x.sum = x.val + (x.left ? x.left.sum : 0) + (x.right ? x.right.sum : 0);
    }
  }

  /**
   * Internal helper to connect child to parent.
   * @param {LCTNode} c - Child node.
   * @param {LCTNode} p - Parent node.
   * @param {boolean} isLeft - Connects as left child if true.
   */
  connect(c, p, isLeft) {
    if (c) c.parent = p;
    if (p) {
      if (isLeft) p.left = c;
      else p.right = c;
    }
  }

  /**
   * Standard Splay Tree rotation step.
   * @param {LCTNode} x - Node to rotate.
   */
  rotate(x) {
    const p = x.parent;
    const g = p.parent;
    const isLeft = p.left === x;
    const auxRoot = this.isRoot(p);

    this.connect(isLeft ? x.right : x.left, p, isLeft);
    this.connect(p, x, !isLeft);

    if (auxRoot) {
      x.parent = g;
    } else {
      this.connect(x, g, g.left === p);
    }
    this.update(p);
    this.update(x);
  }

  /**
   * Top-down propagation of lazy tags along path to splay root.
   * @param {LCTNode} x - LCT node.
   */
  pushAll(x) {
    const path = [];
    let curr = x;
    while (!this.isRoot(curr)) {
      path.push(curr);
      curr = curr.parent;
    }
    path.push(curr);
    while (path.length > 0) {
      this.push(path.pop());
    }
  }

  /**
   * Splays x to the root of its auxiliary tree.
   * @param {LCTNode} x - LCT node.
   */
  splay(x) {
    this.pushAll(x);
    while (!this.isRoot(x)) {
      const p = x.parent;
      const g = p.parent;
      if (!this.isRoot(p)) {
        if ((g.left === p) === (p.left === x)) this.rotate(p);
        else this.rotate(x);
      }
      this.rotate(x);
    }
  }

  /**
   * Forms a preferred path from the root of the represented tree to x.
   * @param {LCTNode} x - LCT node.
   */
  access(x) {
    let last = null;
    for (let curr = x; curr !== null; curr = curr.parent) {
      this.splay(curr);
      curr.right = last;
      this.update(curr);
      last = curr;
    }
    this.splay(x);
  }

  /**
   * Makes x the root of its represented tree.
   * @param {LCTNode} x - LCT node.
   */
  makeRoot(x) {
    this.access(x);
    x.reversed = !x.reversed;
    this.push(x);
  }

  /**
   * Finds the root of the represented tree containing x.
   * @param {LCTNode} x - LCT node.
   * @returns {LCTNode}
   */
  findRoot(x) {
    this.access(x);
    let curr = x;
    while (curr.left !== null) {
      this.push(curr);
      curr = curr.left;
    }
    this.splay(curr);
    return curr;
  }

  /**
   * Links x as a child of y, returning true if successful.
   * @param {LCTNode} x - Child node.
   * @param {LCTNode} y - Parent node.
   * @returns {boolean}
   */
  link(x, y) {
    this.makeRoot(x);
    if (this.findRoot(y) === x) {
      return false; // u and v are already in the same tree (avoids cycle)
    }
    x.parent = y;
    this.adj[x.id].push(y.id);
    this.adj[y.id].push(x.id);
    return true;
  }

  /**
   * Finds the parent of x in the represented tree by accessing and locating predecessor.
   * @param {LCTNode} x - LCT node.
   * @returns {LCTNode|null}
   */
  getParent(x) {
    this.access(x);
    this.splay(x);
    if (x.left === null) return null;
    let curr = x.left;
    while (curr.right !== null) {
      this.push(curr);
      curr = curr.right;
    }
    this.splay(curr);
    return curr;
  }

  /**
   * Cuts the edge from x to its parent in the represented tree.
   * @param {LCTNode} x - LCT node.
   * @returns {boolean}
   */
  cut(x) {
    const parentNode = this.getParent(x);
    if (parentNode) {
      this.access(x);
      this.splay(x);
      x.left.parent = null;
      x.left = null;
      this.update(x);

      const pid = parentNode.id;
      this.adj[x.id] = this.adj[x.id].filter((id) => id !== pid);
      this.adj[pid] = this.adj[pid].filter((id) => id !== x.id);
      return true;
    }
    return false; // x is already a root in the represented forest
  }

  /**
   * Queries sum of values on the represented tree path between x and y.
   * @param {LCTNode} x - Start node.
   * @param {LCTNode} y - End node.
   * @returns {number|null}
   */
  queryPath(x, y) {
    this.makeRoot(x);
    if (this.findRoot(y) !== x) {
      return null; // Nodes u and v are in different tree components
    }
    this.access(y);
    this.splay(y);
    return y.sum;
  }
}

/* ─── Visualizer Core Setup ─── */

let lct = null;
let forestCanvas = null;
let splayCanvas = null;
let forestCtx = null;
let splayCtx = null;

// Graph layout parameters
let nodeCount = 8;
const nodeRadius = 18;
const forestPositions = []; // Node positions in virtual tree {x, y}

/**
 * Initializes LCT visualizer controllers, event bindings, and UI state.
 */
function lctInit() {
  forestCanvas = document.getElementById('forestCanvas');
  splayCanvas = document.getElementById('splayCanvas');
  if (!forestCanvas || !splayCanvas) return;

  forestCtx = forestCanvas.getContext('2d');
  splayCtx = splayCanvas.getContext('2d');

  const nodeCountSelect = document.getElementById('lctNodeCount');
  const resetBtn = document.getElementById('lctResetBtn');

  // Event handlers
  nodeCountSelect.addEventListener('change', () => {
    nodeCount = parseInt(nodeCountSelect.value);
    resetLCT();
  });

  resetBtn.addEventListener('click', resetLCT);

  // Link controls
  document.getElementById('linkBtn').addEventListener('click', handleLink);
  // Cut controls
  document.getElementById('cutBtn').addEventListener('click', handleCut);
  // Access controls
  document.getElementById('accessBtn').addEventListener('click', handleAccess);
  // Make root controls
  document.getElementById('makeRootBtn').addEventListener('click', handleMakeRoot);
  // Path Query controls
  document.getElementById('queryBtn').addEventListener('click', handleQuery);

  resetLCT();

  // Resize listener
  window.addEventListener('resize', () => {
    resizeCanvas(forestCanvas);
    resizeCanvas(splayCanvas);
    computeForestPositions();
    drawAll();
  });
}

/**
 * Resizes canvases based on bounding container widths.
 * @param {HTMLCanvasElement} canvas
 */
function resizeCanvas(canvas) {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 380;
}

/**
 * Computes node positions for the virtual forest graph.
 */
function computeForestPositions() {
  forestPositions.length = 0;
  const cx = forestCanvas.width / 2;
  const cy = forestCanvas.height / 2;
  const radius = Math.min(cx, cy) - 40;

  for (let i = 1; i <= nodeCount; i++) {
    const angle = (i * 2 * Math.PI) / nodeCount - Math.PI / 2;
    forestPositions[i] = {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  }
}

/**
 * Resets visualizer state.
 */
function resetLCT() {
  lct = new LinkCutTree(nodeCount);

  resizeCanvas(forestCanvas);
  resizeCanvas(splayCanvas);

  computeForestPositions();

  // Populate node selections
  populateSelects();

  // Clear step log
  const log = document.getElementById('lctLogBody');
  log.innerHTML =
    '<span class="lct-log-placeholder">Perform operations above to see execution logs...</span>';

  // Clear telemetry
  document.getElementById('telQueryOutput').textContent = '-';

  updateTelemetry();
  drawAll();
}

/**
 * Populates selectors with current node range options.
 */
function populateSelects() {
  const selects = [
    'accessNodeSel',
    'makeRootNodeSel',
    'linkUSel',
    'linkVSel',
    'cutUSel',
    'queryUSel',
    'queryVSel',
  ];

  selects.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    for (let i = 1; i <= nodeCount; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `Node ${i}`;
      el.appendChild(opt);
    }
  });

  // Set default offsets for linked values
  const linkVSel = document.getElementById('linkVSel');
  if (linkVSel && linkVSel.options.length > 1) {
    linkVSel.selectedIndex = 1;
  }
}

/**
 * Prints trace step line to the logger panel.
 * @param {string} msg
 */
function logTrace(msg) {
  const log = document.getElementById('lctLogBody');
  const placeholder = log.querySelector('.lct-log-placeholder');
  if (placeholder) placeholder.remove();

  const el = document.createElement('span');
  el.className = 'lct-log-line';
  el.innerHTML = msg;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
}

/**
 * Links u as a child of v.
 */
function handleLink() {
  const u = parseInt(document.getElementById('linkUSel').value);
  const v = parseInt(document.getElementById('linkVSel').value);

  if (u === v) {
    logTrace(`<span class="highlight">Link Error</span>: Cannot link node to itself.`);
    return;
  }

  const success = lct.link(lct.nodes[u], lct.nodes[v]);
  if (success) {
    logTrace(
      `Linked node <span class="highlight">${u}</span> to <span class="highlight">${v}</span> successfully.`
    );
  } else {
    logTrace(
      `<span class="highlight">Link Failed</span>: Creating edge (${u} → ${v}) would create a cycle.`
    );
  }
  updateTelemetry();
  drawAll();
}

/**
 * Cuts node u from parent.
 */
function handleCut() {
  const u = parseInt(document.getElementById('cutUSel').value);

  const success = lct.cut(lct.nodes[u]);
  if (success) {
    logTrace(`Cut edge between node <span class="highlight">${u}</span> and its parent.`);
  } else {
    logTrace(`<span class="highlight">Cut Failed</span>: Node ${u} is already a root.`);
  }
  updateTelemetry();
  drawAll();
}

/**
 * Accesses node u.
 */
function handleAccess() {
  const u = parseInt(document.getElementById('accessNodeSel').value);
  lct.access(lct.nodes[u]);
  logTrace(
    `Accessed node <span class="highlight">${u}</span>. Formed preferred path from root to ${u}.`
  );
  updateTelemetry();
  drawAll();
}

/**
 * Makes node u root.
 */
function handleMakeRoot() {
  const u = parseInt(document.getElementById('makeRootNodeSel').value);
  lct.makeRoot(lct.nodes[u]);
  logTrace(`Made node <span class="highlight">${u}</span> the represented root of its tree.`);
  updateTelemetry();
  drawAll();
}

/**
 * Queries sum on path u-v.
 */
function handleQuery() {
  const u = parseInt(document.getElementById('queryUSel').value);
  const v = parseInt(document.getElementById('queryVSel').value);

  const sum = lct.queryPath(lct.nodes[u], lct.nodes[v]);
  const tel = document.getElementById('telQueryOutput');

  if (sum !== null) {
    logTrace(
      `Path query between <span class="highlight">${u}</span> and <span class="highlight">${v}</span> returned value sum: <span class="highlight">${sum}</span>`
    );
    tel.textContent = sum;
  } else {
    logTrace(
      `<span class="highlight">Query Failed</span>: Nodes ${u} and ${v} are in disconnected components.`
    );
    tel.textContent = 'Disconnected';
  }
  updateTelemetry();
  drawAll();
}

/**
 * Refreshes telemetry panel state.
 */
function updateTelemetry() {
  let preferredCount = 0;
  let healthy = true;
  for (let i = 1; i <= nodeCount; i++) {
    const node = lct.nodes[i];
    if (node.left) {
      preferredCount++;
      if (node.left.parent !== node) healthy = false;
    }
    if (node.right) {
      preferredCount++;
      if (node.right.parent !== node) healthy = false;
    }
  }

  document.getElementById('telPreferredPaths').textContent = `${preferredCount} splay edges`;
  const telStatus = document.getElementById('telStatus');
  if (telStatus) {
    telStatus.textContent = healthy ? 'Healthy' : 'Error';
    telStatus.className = healthy ? 'value text-success' : 'value text-danger';
  }
}

/**
 * Redraws both virtual and auxiliary splay canvases.
 */
function drawAll() {
  drawForest();
  drawSplays();
}

/**
 * Draws the represented virtual forest.
 */
function drawForest() {
  if (!forestCtx) return;
  forestCtx.clearRect(0, 0, forestCanvas.width, forestCanvas.height);

  // 1. Draw represented tree edges
  const drawnEdges = new Set();
  for (let i = 1; i <= nodeCount; i++) {
    lct.adj[i].forEach((neighbor) => {
      const edgeKey = Math.min(i, neighbor) + '-' + Math.max(i, neighbor);
      if (!drawnEdges.has(edgeKey)) {
        drawnEdges.add(edgeKey);
        const uPos = forestPositions[i];
        const vPos = forestPositions[neighbor];

        // Check if it is a preferred splay path edge
        const uNode = lct.nodes[i];
        const vNode = lct.nodes[neighbor];
        const isPreferred =
          (uNode.parent === vNode && (vNode.left === uNode || vNode.right === uNode)) ||
          (vNode.parent === uNode && (uNode.left === vNode || uNode.right === vNode));

        forestCtx.beginPath();
        forestCtx.moveTo(uPos.x, uPos.y);
        forestCtx.lineTo(vPos.x, vPos.y);
        forestCtx.strokeStyle = isPreferred ? '#c084fc' : 'rgba(255, 255, 255, 0.15)';
        forestCtx.lineWidth = isPreferred ? 3.5 : 1.5;
        forestCtx.stroke();
      }
    });
  }

  // 2. Draw nodes
  for (let i = 1; i <= nodeCount; i++) {
    const pos = forestPositions[i];
    forestCtx.beginPath();
    forestCtx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
    forestCtx.fillStyle = '#1e1b4b';
    forestCtx.strokeStyle = '#a855f7';
    forestCtx.lineWidth = 2.5;
    forestCtx.fill();
    forestCtx.stroke();

    forestCtx.fillStyle = '#ffffff';
    forestCtx.font = 'bold 11px "Fira Code", monospace';
    forestCtx.textAlign = 'center';
    forestCtx.textBaseline = 'middle';
    forestCtx.fillText(i, pos.x, pos.y);
  }
}

/**
 * Draws the auxiliary splay tree binary structures.
 */
function drawSplays() {
  if (!splayCtx) return;
  splayCtx.clearRect(0, 0, splayCanvas.width, splayCanvas.height);

  // Locate splay component roots
  const roots = new Set();
  for (let i = 1; i <= nodeCount; i++) {
    let curr = lct.nodes[i];
    while (!lct.isRoot(curr)) {
      curr = curr.parent;
    }
    roots.add(curr);
  }

  const splayRoots = Array.from(roots);
  const totalTrees = splayRoots.length;
  const colWidth = splayCanvas.width / Math.max(1, totalTrees);

  splayRoots.forEach((root, idx) => {
    const cx = (idx + 0.5) * colWidth;
    const cy = 40;
    // Layout binary tree levels
    drawSplayTreeBranch(root, cx, cy, colWidth / 2.2, 55);
  });
}

/**
 * Recursively renders splay tree tree branch.
 * @param {LCTNode} node
 * @param {number} x
 * @param {number} y
 * @param {number} dx
 * @param {number} dy
 */
function drawSplayTreeBranch(node, x, y, dx, dy) {
  if (!node) return;

  // Render left edge
  if (node.left) {
    splayCtx.beginPath();
    splayCtx.moveTo(x, y);
    splayCtx.lineTo(x - dx, y + dy);
    splayCtx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
    splayCtx.lineWidth = 2;
    splayCtx.stroke();
    drawSplayTreeBranch(node.left, x - dx, y + dy, dx / 2, dy);
  }

  // Render right edge
  if (node.right) {
    splayCtx.beginPath();
    splayCtx.moveTo(x, y);
    splayCtx.lineTo(x + dx, y + dy);
    splayCtx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
    splayCtx.lineWidth = 2;
    splayCtx.stroke();
    drawSplayTreeBranch(node.right, x + dx, y + dy, dx / 2, dy);
  }

  // Render splay node circle
  splayCtx.beginPath();
  splayCtx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
  splayCtx.fillStyle = '#111827';
  splayCtx.strokeStyle = '#c084fc';
  splayCtx.lineWidth = 2.5;
  splayCtx.fill();
  splayCtx.stroke();

  splayCtx.fillStyle = '#ffffff';
  splayCtx.font = 'bold 11px "Fira Code", monospace';
  splayCtx.textAlign = 'center';
  splayCtx.textBaseline = 'middle';
  splayCtx.fillText(node.id, x, y);
}

/* ─── ESM Module Exports for testing ─── */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LCTNode,
    LinkCutTree,
  };
}
