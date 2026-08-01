document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try {
    rtInit();
  } catch (e) {
    console.error('RTInit:', e);
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
 * Initializes mobile navigation toggle using delegated document click listener.
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

/* ─── R-Tree Spatial Data Structure Implementation ─── */

/**
 * Minimum Bounding Rectangle.
 * @typedef {Object} MBR
 * @property {number} minX
 * @property {number} minY
 * @property {number} maxX
 * @property {number} maxY
 */

/**
 * Represents a single geometry item.
 * @typedef {Object} SpatialItem
 * @property {number} id
 * @property {number} x
 * @property {number} y
 * @property {number} w
 * @property {number} h
 */

/**
 * Returns area of an MBR.
 * @param {MBR} m
 * @returns {number}
 */
function mbrArea(m) {
  if (!m || m.minX >= m.maxX || m.minY >= m.maxY) return 0;
  return (m.maxX - m.minX) * (m.maxY - m.minY);
}

/**
 * Calculates union of two MBRs.
 * @param {MBR} m1
 * @param {MBR} m2
 * @returns {MBR}
 */
function mbrUnion(m1, m2) {
  if (!m1) return { ...m2 };
  if (!m2) return { ...m1 };
  return {
    minX: Math.min(m1.minX, m2.minX),
    minY: Math.min(m1.minY, m2.minY),
    maxX: Math.max(m1.maxX, m2.maxX),
    maxY: Math.max(m1.maxY, m2.maxY),
  };
}

/**
 * Returns true if two MBRs overlap.
 * @param {MBR} m1
 * @param {MBR} m2
 * @returns {boolean}
 */
function mbrOverlaps(m1, m2) {
  if (!m1 || !m2) return false;
  return !(m1.maxX < m2.minX || m1.minX > m2.maxX || m1.maxY < m2.minY || m1.minY > m2.maxY);
}

/**
 * Calculates MBR from a list of nodes or items.
 * @param {Array<RTreeNode|SpatialItem>} elements
 * @returns {MBR}
 */
function calculateMbr(elements) {
  let box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  elements.forEach((e) => {
    const eBox =
      e instanceof RTreeNode ? e.mbr : { minX: e.x, minY: e.y, maxX: e.x + e.w, maxY: e.y + e.h };
    box = mbrUnion(box, eBox);
  });
  return box;
}

/**
 * Node in the R-Tree structure.
 */
class RTreeNode {
  /**
   * @param {boolean} isLeaf
   */
  constructor(isLeaf = true) {
    this.isLeaf = isLeaf;
    this.mbr = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    this.children = []; // Child RTreeNodes or SpatialItems
    this.parent = null;
  }

  /**
   * Recomputes MBR of the node from its children.
   */
  recomputeMbr() {
    this.mbr = calculateMbr(this.children);
  }
}

/**
 * Interactive R-Tree Index.
 */
class RTree {
  /**
   * @param {number} maxEntries - Node capacity parameter M.
   */
  constructor(maxEntries = 3) {
    this.maxEntries = maxEntries;
    this.minEntries = 1;
    this.root = new RTreeNode(true);
    this.nextItemId = 1;
  }

  /**
   * Inserts a spatial item into the R-Tree.
   * @param {SpatialItem} item
   */
  insert(item) {
    const leaf = this.chooseLeaf(this.root, item);
    leaf.children.push(item);
    leaf.recomputeMbr();

    if (leaf.children.length > this.maxEntries) {
      const splitNode = this.splitNode(leaf);
      this.adjustTree(leaf, splitNode);
    } else {
      this.adjustTree(leaf, null);
    }
  }

  /**
   * Chooses the leaf node that requires the minimum MBR expansion to insert the item.
   * @param {RTreeNode} node
   * @param {SpatialItem} item
   * @returns {RTreeNode}
   */
  chooseLeaf(node, item) {
    if (node.isLeaf) return node;

    const itemBox = { minX: item.x, minY: item.y, maxX: item.x + item.w, maxY: item.y + item.h };
    let bestNode = null;
    let minIncrease = Infinity;
    let minArea = Infinity;

    node.children.forEach((c) => {
      const areaBefore = mbrArea(c.mbr);
      const unionArea = mbrArea(mbrUnion(c.mbr, itemBox));
      const increase = unionArea - areaBefore;

      if (increase < minIncrease) {
        minIncrease = increase;
        minArea = areaBefore;
        bestNode = c;
      } else if (increase === minIncrease && areaBefore < minArea) {
        minArea = areaBefore;
        bestNode = c;
      }
    });

    return this.chooseLeaf(bestNode, item);
  }

  /**
   * Splits a node that has overflowed capacity into two nodes.
   * @param {RTreeNode} node
   * @returns {RTreeNode}
   */
  splitNode(node) {
    const isLeaf = node.isLeaf;
    const split = new RTreeNode(isLeaf);
    split.parent = node.parent;

    const items = [...node.children];
    node.children = [];

    // Quadratic Split Seed Selection
    let seed1Idx = 0;
    let seed2Idx = 1;
    let maxWaste = -Infinity;

    for (let i = 0; i < items.length; i++) {
      const mbr1 =
        items[i] instanceof RTreeNode
          ? items[i].mbr
          : {
              minX: items[i].x,
              minY: items[i].y,
              maxX: items[i].x + items[i].w,
              maxY: items[i].y + items[i].h,
            };
      for (let j = i + 1; j < items.length; j++) {
        const mbr2 =
          items[j] instanceof RTreeNode
            ? items[j].mbr
            : {
                minX: items[j].x,
                minY: items[j].y,
                maxX: items[j].x + items[j].w,
                maxY: items[j].y + items[j].h,
              };
        const unionBox = mbrUnion(mbr1, mbr2);
        const waste = mbrArea(unionBox) - mbrArea(mbr1) - mbrArea(mbr2);
        if (waste > maxWaste) {
          maxWaste = waste;
          seed1Idx = i;
          seed2Idx = j;
        }
      }
    }

    const s1 = items[seed1Idx];
    const s2 = items[seed2Idx];

    node.children.push(s1);
    if (s1 instanceof RTreeNode) s1.parent = node;
    node.recomputeMbr();

    split.children.push(s2);
    if (s2 instanceof RTreeNode) s2.parent = split;
    split.recomputeMbr();

    const remaining = items.filter((_, idx) => idx !== seed1Idx && idx !== seed2Idx);

    remaining.forEach((item) => {
      const itemBox =
        item instanceof RTreeNode
          ? item.mbr
          : { minX: item.x, minY: item.y, maxX: item.x + item.w, maxY: item.y + item.h };

      // Ensure minEntries criteria is met
      if (node.children.length + remaining.length <= this.minEntries) {
        node.children.push(item);
        if (item instanceof RTreeNode) item.parent = node;
        return;
      }
      if (split.children.length + remaining.length <= this.minEntries) {
        split.children.push(item);
        if (item instanceof RTreeNode) item.parent = split;
        return;
      }

      const union1 = mbrUnion(node.mbr, itemBox);
      const union2 = mbrUnion(split.mbr, itemBox);

      const exp1 = mbrArea(union1) - mbrArea(node.mbr);
      const exp2 = mbrArea(union2) - mbrArea(split.mbr);

      if (exp1 < exp2) {
        node.children.push(item);
        if (item instanceof RTreeNode) item.parent = node;
        node.recomputeMbr();
      } else {
        split.children.push(item);
        if (item instanceof RTreeNode) item.parent = split;
        split.recomputeMbr();
      }
    });

    return split;
  }

  /**
   * Rebalances and propagates split/MBR changes back up to the root.
   * @param {RTreeNode} node
   * @param {RTreeNode|null} splitNode
   */
  adjustTree(node, splitNode) {
    if (node === this.root) {
      if (splitNode) {
        // Create new root
        const newRoot = new RTreeNode(false);
        newRoot.children.push(node);
        node.parent = newRoot;

        newRoot.children.push(splitNode);
        splitNode.parent = newRoot;

        newRoot.recomputeMbr();
        this.root = newRoot;
      }
      return;
    }

    node.recomputeMbr();

    const p = node.parent;
    if (splitNode) {
      p.children.push(splitNode);
      splitNode.parent = p;
      p.recomputeMbr();

      if (p.children.length > this.maxEntries) {
        const splitP = this.splitNode(p);
        this.adjustTree(p, splitP);
      } else {
        this.adjustTree(p, null);
      }
    } else {
      this.adjustTree(p, null);
    }
  }

  /**
   * Traverses and returns all nodes grouped by level depth.
   * @returns {Array<Array<RTreeNode>>}
   */
  getNodesByDepth() {
    const levels = [];
    const traverse = (node, depth) => {
      if (!node) return;
      if (!levels[depth]) levels[depth] = [];
      levels[depth].push(node);
      if (!node.isLeaf) {
        node.children.forEach((c) => traverse(c, depth + 1));
      }
    };
    traverse(this.root, 0);
    return levels;
  }
}

/* ─── Visualizer Core Setup ─── */

let rtree = null;
let canvas = null;
let ctx = null;

let currentMode = 'insert'; // 'insert', 'range', 'knn'
let knnK = 1;
let maxEntries = 3;

// Drawing state
let isDrawing = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;

// Query search highlights
let queryMbr = null;
let queryPoint = null;
let visitedNodes = [];
let queryResults = [];
let queryStepsLog = 0;

/**
 * Initializes R-Tree visualizer canvas, mode buttons, selectors, and state.
 */
function rtInit() {
  canvas = document.getElementById('rtCanvas');
  if (!canvas) return;

  ctx = canvas.getContext('2d');
  resizeCanvas(canvas);

  // Setup mode selector button clicks
  const modeButtons = document.querySelectorAll('.mode-btn');
  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeButtons.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      setMode(btn.dataset.mode);
    });
  });

  document.getElementById('rtRandomBtn').addEventListener('click', handleAddRandom);
  document.getElementById('rtClearBtn').addEventListener('click', handleClearTree);

  document.getElementById('knnKVal').addEventListener('change', (e) => {
    knnK = parseInt(e.target.value);
    if (currentMode === 'knn' && queryPoint) {
      runKnnQuery(queryPoint.x, queryPoint.y);
    }
  });

  document.getElementById('rtMaxEntries').addEventListener('change', (e) => {
    maxEntries = parseInt(e.target.value);
    handleClearTree();
  });

  // Canvas mouse events
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);

  // Resize listener
  window.addEventListener('resize', () => {
    resizeCanvas(canvas);
    drawAll();
  });

  resetTree();
}

/**
 * Resizes canvas dimensions and adjusts backing store.
 * @param {HTMLCanvasElement} c
 */
function resizeCanvas(c) {
  c.width = c.parentElement.clientWidth;
  c.height = 420;
}

/**
 * Sets current query/drawing interaction mode.
 * @param {string} mode
 */
function setMode(mode) {
  currentMode = mode;
  queryMbr = null;
  queryPoint = null;
  visitedNodes = [];
  queryResults = [];
  queryStepsLog = 0;

  const hint = document.getElementById('canvasHint');
  if (mode === 'insert') {
    hint.textContent = 'Drag on canvas to draw a new rectangle.';
  } else if (mode === 'range') {
    hint.textContent = 'Drag on canvas to define range query boundaries.';
  } else if (mode === 'knn') {
    hint.textContent = 'Click on canvas to find nearest neighbor rectangles.';
  }

  drawAll();
}

/**
 * Resets entire R-Tree structure.
 */
function resetTree() {
  rtree = new RTree(maxEntries);
  queryMbr = null;
  queryPoint = null;
  visitedNodes = [];
  queryResults = [];
  queryStepsLog = 0;

  const log = document.getElementById('rtLogBody');
  log.innerHTML =
    '<span class="rt-log-placeholder">Add geometries or run queries to see logs...</span>';

  updateTelemetry();
  drawAll();
}

/**
 * Adds random rectangles to the tree.
 */
function handleAddRandom() {
  const w = canvas.width;
  const h = canvas.height;

  for (let i = 0; i < 5; i++) {
    const rectW = 30 + Math.random() * 50;
    const rectH = 30 + Math.random() * 50;
    const rx = Math.random() * (w - rectW - 40) + 20;
    const ry = Math.random() * (h - rectH - 40) + 20;

    const item = {
      id: rtree.nextItemId++,
      x: Math.round(rx),
      y: Math.round(ry),
      w: Math.round(rectW),
      h: Math.round(rectH),
    };
    rtree.insert(item);
  }

  logTrace(`Inserted <span class="highlight">5 random rectangles</span> into the index.`);
  updateTelemetry();
  drawAll();
}

/**
 * Clears the tree index.
 */
function handleClearTree() {
  resetTree();
  logTrace('Cleared R-Tree spatial index.');
}

/**
 * Trace log publisher.
 * @param {string} msg
 */
function logTrace(msg) {
  const log = document.getElementById('rtLogBody');
  const placeholder = log.querySelector('.rt-log-placeholder');
  if (placeholder) placeholder.remove();

  const el = document.createElement('span');
  el.className = 'rt-log-line';
  el.innerHTML = msg;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
}

/**
 * Mouse press down handler.
 * @param {MouseEvent} e
 */
function handleMouseDown(e) {
  const rect = canvas.getBoundingClientRect();
  startX = e.clientX - rect.left;
  startY = e.clientY - rect.top;

  if (currentMode === 'knn') {
    queryPoint = { x: startX, y: startY };
    runKnnQuery(startX, startY);
    return;
  }

  isDrawing = true;
  currentX = startX;
  currentY = startY;
}

/**
 * Mouse drag handler.
 * @param {MouseEvent} e
 */
function handleMouseMove(e) {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  currentX = e.clientX - rect.left;
  currentY = e.clientY - rect.top;
  drawAll();

  // Render preview frame on top
  if (currentMode === 'insert') {
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);
    ctx.setLineDash([]);
  } else if (currentMode === 'range') {
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);
    ctx.setLineDash([]);
  }
}

/**
 * Mouse button release handler.
 * @param {MouseEvent} e
 */
function handleMouseUp(e) {
  if (!isDrawing) return;
  isDrawing = false;

  const rect = canvas.getBoundingClientRect();
  const endX = e.clientX - rect.left;
  const endY = e.clientY - rect.top;

  const rx = Math.min(startX, endX);
  const ry = Math.min(startY, endY);
  const rw = Math.abs(endX - startX);
  const rh = Math.abs(endY - startY);

  if (rw < 5 || rh < 5) return; // Ignore tiny movements

  if (currentMode === 'insert') {
    const item = {
      id: rtree.nextItemId++,
      x: Math.round(rx),
      y: Math.round(ry),
      w: Math.round(rw),
      h: Math.round(rh),
    };
    rtree.insert(item);
    logTrace(
      `Inserted rectangle <span class="highlight">#${item.id}</span> at (${item.x}, ${item.y}) of size ${item.w}x${item.h}.`
    );
    updateTelemetry();
    drawAll();
  } else if (currentMode === 'range') {
    queryMbr = { minX: rx, minY: ry, maxX: rx + rw, maxY: ry + rh };
    runRangeQuery(queryMbr);
  }
}

/**
 * Executes a Range Search query in LCT forest representation.
 * @param {MBR} queryBox
 */
function runRangeQuery(queryBox) {
  visitedNodes = [];
  queryResults = [];
  queryStepsLog = 0;

  const search = (node) => {
    if (!node) return;
    visitedNodes.push(node);
    queryStepsLog++;

    if (node.isLeaf) {
      node.children.forEach((item) => {
        const itemBox = {
          minX: item.x,
          minY: item.y,
          maxX: item.x + item.w,
          maxY: item.y + item.h,
        };
        if (mbrOverlaps(queryBox, itemBox)) {
          queryResults.push(item);
        }
      });
    } else {
      node.children.forEach((c) => {
        if (mbrOverlaps(queryBox, c.mbr)) {
          search(c);
        }
      });
    }
  };

  search(rtree.root);
  logTrace(
    `Range query returned <span class="highlight">${queryResults.length} matches</span> after traversing <span class="highlight">${queryStepsLog} nodes</span>.`
  );
  updateTelemetry();
  drawAll();
}

/**
 * Executes Nearest Neighbors search using Euclidean branch-and-bound.
 * @param {number} qx
 * @param {number} qy
 */
function runKnnQuery(qx, qy) {
  visitedNodes = [];
  queryResults = [];
  queryStepsLog = 0;

  // Calculates min distance from query point to MBR bounding box
  const getMinDist = (mbr) => {
    const dx = Math.max(0, mbr.minX - qx, qx - mbr.maxX);
    const dy = Math.max(0, mbr.minY - qy, qy - mbr.maxY);
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calculates distance to item center
  const getDistToItem = (item) => {
    const cx = item.x + item.w / 2;
    const cy = item.y + item.h / 2;
    const dx = cx - qx;
    const dy = cy - qy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Best-First Search Priority Queue
  const queue = [{ node: rtree.root, dist: getMinDist(rtree.root.mbr) }];
  const candidates = [];

  while (queue.length > 0) {
    // Sort ascending
    queue.sort((a, b) => a.dist - b.dist);
    const curr = queue.shift();
    queryStepsLog++;
    visitedNodes.push(curr.node);

    if (curr.node.isLeaf) {
      curr.node.children.forEach((item) => {
        candidates.push({ item, dist: getDistToItem(item) });
      });
    } else {
      curr.node.children.forEach((child) => {
        queue.push({ node: child, dist: getMinDist(child.mbr) });
      });
    }

    // Sort candidates
    candidates.sort((a, b) => a.dist - b.dist);
    if (candidates.length >= knnK) {
      const thresholdDist = candidates[knnK - 1].dist;
      // Prune remaining queue entries that are farther than threshold
      const nextMinDist = queue.length > 0 ? queue[0].dist : Infinity;
      if (nextMinDist > thresholdDist) {
        break;
      }
    }
  }

  queryResults = candidates.slice(0, knnK).map((c) => c.item);
  logTrace(
    `k-NN query (k=${knnK}) located nearest geometries. Farthest neighbor distance: <span class="highlight">${candidates.length > 0 ? Math.round(candidates[Math.min(candidates.length - 1, knnK - 1)].dist) : 0}px</span>.`
  );
  updateTelemetry();
  drawAll();
}

/**
 * Refreshes telemetry panel stats.
 */
function updateTelemetry() {
  const levels = rtree.getNodesByDepth();
  let nodeCountTotal = 0;
  let rectCountTotal = 0;

  levels.forEach((lvl) => {
    nodeCountTotal += lvl.length;
    lvl.forEach((n) => {
      if (n.isLeaf) rectCountTotal += n.children.length;
    });
  });

  const telStatus = document.getElementById('telStatus');
  if (telStatus) {
    telStatus.textContent = rectCountTotal > 0 ? 'Active' : 'Empty';
    telStatus.className = rectCountTotal > 0 ? 'value text-success' : 'value';
  }

  document.getElementById('telRectCount').textContent = rectCountTotal;
  document.getElementById('telNodeCount').textContent = nodeCountTotal;
  document.getElementById('telQuerySteps').textContent =
    queryStepsLog > 0 ? `${queryStepsLog} nodes visited` : '-';
}

/**
 * Renders spatial elements and search highlights.
 */
function drawAll() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Draw light coordinate grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // 2. Draw all hierarchical bounding boxes (MBRs)
  const levels = rtree.getNodesByDepth();
  const colors = ['rgba(168, 85, 247, 0.85)', 'rgba(6, 182, 212, 0.7)', 'rgba(34, 197, 94, 0.6)'];

  // Iterate levels bottom-up to draw parent boundaries nicely
  for (let d = levels.length - 1; d >= 0; d--) {
    const lvlNodes = levels[d];
    const color = colors[d % colors.length];

    lvlNodes.forEach((n) => {
      if (!n.mbr || n.mbr.minX === Infinity) return;

      const isVisited = visitedNodes.includes(n);

      ctx.strokeStyle = isVisited ? '#f59e0b' : color;
      ctx.lineWidth = isVisited ? 2.5 : 1.5;
      ctx.strokeRect(n.mbr.minX, n.mbr.minY, n.mbr.maxX - n.mbr.minX, n.mbr.maxY - n.mbr.minY);

      // Draw light overlay for search traversal
      if (isVisited) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.04)';
        ctx.fillRect(n.mbr.minX, n.mbr.minY, n.mbr.maxX - n.mbr.minX, n.mbr.maxY - n.mbr.minY);
      }
    });
  }

  // 3. Draw items (rectangles)
  drawItems(rtree.root);

  // 4. Draw Query indicators
  if (currentMode === 'range' && queryMbr) {
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(
      queryMbr.minX,
      queryMbr.minY,
      queryMbr.maxX - queryMbr.minX,
      queryMbr.maxY - queryMbr.minY
    );
    ctx.setLineDash([]);
  }

  if (currentMode === 'knn' && queryPoint) {
    ctx.beginPath();
    ctx.arc(queryPoint.x, queryPoint.y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw largest distance sweep circle
    if (queryResults.length > 0) {
      const getDistToItem = (item) => {
        const cx = item.x + item.w / 2;
        const cy = item.y + item.h / 2;
        const dx = cx - queryPoint.x;
        const dy = cy - queryPoint.y;
        return Math.sqrt(dx * dx + dy * dy);
      };
      const maxDist = Math.max(...queryResults.map(getDistToItem));

      ctx.beginPath();
      ctx.arc(queryPoint.x, queryPoint.y, maxDist, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

/**
 * Recursively renders spatial items and highlights matching elements.
 * @param {RTreeNode} node
 */
function drawItems(node) {
  if (!node) return;

  if (node.isLeaf) {
    node.children.forEach((item) => {
      const isMatch = queryResults.includes(item);

      ctx.fillStyle = isMatch ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = isMatch ? '#22c55e' : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = isMatch ? 2.5 : 1;

      ctx.fillRect(item.x, item.y, item.w, item.h);
      ctx.strokeRect(item.x, item.y, item.w, item.h);

      // Label item id
      ctx.fillStyle = isMatch ? '#22c55e' : 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.id, item.x + item.w / 2, item.y + item.h / 2);
    });
  } else {
    node.children.forEach((c) => drawItems(c));
  }
}

/* ─── ESM Module Exports for testing ─── */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    mbrArea,
    mbrUnion,
    mbrOverlaps,
    RTreeNode,
    RTree,
  };
}
