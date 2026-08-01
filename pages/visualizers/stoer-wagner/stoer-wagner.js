document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try {
    swInit();
  } catch (e) {
    console.error('SWInit:', e);
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

/* ─── Stoer-Wagner Algorithm & Graph Engine ─── */

/**
 * Graph representation structure.
 */
class Graph {
  constructor() {
    this.nodes = []; // { id: number, x: number, y: number, label: string }
    this.edges = []; // { u: number, v: number, weight: number }
  }

  addNode(x, y, label = '') {
    const id = this.nodes.length > 0 ? Math.max(...this.nodes.map((n) => n.id)) + 1 : 1;
    const node = { id, x, y, label: label || `V${id}` };
    this.nodes.push(node);
    return node;
  }

  addEdge(u, v, weight = 1) {
    // Check duplicate
    const existing = this.edges.find((e) => (e.u === u && e.v === v) || (e.u === v && e.v === u));
    if (existing) {
      existing.weight = weight;
      return existing;
    }
    const edge = { u, v, weight };
    this.edges.push(edge);
    return edge;
  }

  removeEdge(u, v) {
    this.edges = this.edges.filter((e) => !((e.u === u && e.v === v) || (e.u === v && e.v === u)));
  }

  getWeight(u, v) {
    const edge = this.edges.find((e) => (e.u === u && e.v === v) || (e.u === v && e.v === u));
    return edge ? edge.weight : 0;
  }
}

/**
 * Implements the Stoer-Wagner global minimum cut algorithm.
 */
class StoerWagnerSolver {
  /**
   * @param {Graph} graph
   */
  constructor(graph) {
    this.originalGraph = graph;
    this.phases = [];
    this.minCutWeight = Infinity;
    this.bestPartition = null; // Set of original vertex IDs forming one partition side
    this.solved = false;
  }

  /**
   * Computes the global minimum cut step-by-step.
   */
  solve() {
    if (this.originalGraph.nodes.length < 2) return;

    // Track contracted vertex subsets. E.g. subsets[u] contains all original vertex IDs merged into u
    const subsets = {};
    this.originalGraph.nodes.forEach((n) => {
      subsets[n.id] = [n.id];
    });

    // Clone working graph
    let nodes = this.originalGraph.nodes.map((n) => n.id);
    let edges = this.originalGraph.edges.map((e) => ({ ...e }));

    this.minCutWeight = Infinity;
    this.bestPartition = null;
    this.phases = [];

    // Run |V| - 1 phases
    while (nodes.length > 1) {
      const phaseResult = this.runPhase(nodes, edges, subsets);
      this.phases.push(phaseResult);

      if (phaseResult.cutWeight < this.minCutWeight) {
        this.minCutWeight = phaseResult.cutWeight;
        this.bestPartition = [...phaseResult.cutPartition];
      }

      // Merge s and t
      const s = phaseResult.s;
      const t = phaseResult.t;

      // Combine subsets
      subsets[s] = subsets[s].concat(subsets[t]);
      delete subsets[t];

      // Remove t, redirect edges from t to s
      nodes = nodes.filter((n) => n !== t);

      const newEdges = [];
      const sRedirects = {}; // neighbor -> combined weight

      edges.forEach((e) => {
        if (e.u === t || e.v === t) {
          const neighbor = e.u === t ? e.v : e.u;
          if (neighbor !== s) {
            sRedirects[neighbor] = (sRedirects[neighbor] || 0) + e.weight;
          }
        } else if (e.u === s || e.v === s) {
          const neighbor = e.u === s ? e.v : e.u;
          sRedirects[neighbor] = (sRedirects[neighbor] || 0) + e.weight;
        } else {
          newEdges.push(e);
        }
      });

      // Add merged edges to s
      Object.keys(sRedirects).forEach((nId) => {
        newEdges.push({ u: s, v: parseInt(nId), weight: sRedirects[nId] });
      });

      edges = newEdges;
    }

    this.solved = true;
  }

  /**
   * Executes a single phase of the Stoer-Wagner contraction.
   * @param {Array<number>} nodes
   * @param {Array<Object>} edges
   * @param {Object} subsets
   * @returns {Object}
   */
  runPhase(nodes, edges, subsets) {
    const getWeight = (u, v) => {
      const edge = edges.find((e) => (e.u === u && e.v === v) || (e.u === v && e.v === u));
      return edge ? edge.weight : 0;
    };

    const A = [nodes[0]];
    const orderOfAddition = [nodes[0]];
    const remaining = nodes.filter((n) => n !== nodes[0]);

    while (remaining.length > 0) {
      let bestNode = null;
      let maxWeight = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const u = remaining[i];
        let wSum = 0;
        A.forEach((v) => {
          wSum += getWeight(u, v);
        });

        if (wSum > maxWeight) {
          maxWeight = wSum;
          bestNode = u;
        }
      }

      A.push(bestNode);
      orderOfAddition.push(bestNode);
      remaining.splice(remaining.indexOf(bestNode), 1);
    }

    const s = orderOfAddition[orderOfAddition.length - 2];
    const t = orderOfAddition[orderOfAddition.length - 1];

    // Cut weight of t is the sum of connection weights to A (which contains all nodes except t before the last addition)
    let cutWeight = 0;
    nodes.forEach((n) => {
      if (n !== t) {
        cutWeight += getWeight(t, n);
      }
    });

    // Partition formed by t
    const cutPartition = [...subsets[t]];

    return {
      s,
      t,
      cutWeight,
      cutPartition,
      orderOfAddition: [...orderOfAddition],
    };
  }
}

/* ─── Visualizer Setup ─── */

let graph = null;
let solver = null;
let canvas = null;
let ctx = null;

// Execution status
let currentPhaseIdx = 0;
let isSolved = false;

// Drag and drop state
let draggedNode = null;
let selectedNode = null;

/**
 * Initializes controllers, presets, and bindings.
 */
function swInit() {
  canvas = document.getElementById('swCanvas');
  if (!canvas) return;

  ctx = canvas.getContext('2d');
  resizeCanvas(canvas);

  // Preset loaders
  document.getElementById('swPresetSelect').addEventListener('change', loadPreset);
  document.getElementById('swClearBtn').addEventListener('click', handleClear);

  // Algorithm stepping controls
  document.getElementById('swStepBtn').addEventListener('click', handleStep);
  document.getElementById('swSolveBtn').addEventListener('click', handleSolve);
  document.getElementById('swResetBtn').addEventListener('click', handleReset);

  // Mouse event handlers for graph interactions
  canvas.addEventListener('dblclick', handleDoubleClick);
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);

  window.addEventListener('resize', () => {
    resizeCanvas(canvas);
    drawAll();
  });

  graph = new Graph();
  loadPreset();
}

/**
 * Resizes canvas dimensions.
 * @param {HTMLCanvasElement} c
 */
function resizeCanvas(c) {
  c.width = c.parentElement.clientWidth;
  c.height = 440;
}

/**
 * Publishes operational step message trace to logging panel.
 * @param {string} msg
 */
function logTrace(msg) {
  const log = document.getElementById('swLogBody');
  const placeholder = log.querySelector('.sw-log-placeholder');
  if (placeholder) placeholder.remove();

  const el = document.createElement('span');
  el.className = 'sw-log-line';
  el.innerHTML = msg;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
}

/**
 * Loads selected preset graph.
 */
function loadPreset() {
  const select = document.getElementById('swPresetSelect');
  const type = select.value;

  graph = new Graph();
  handleReset();

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  if (type === 'simple') {
    // 6-node weighted graph
    const n1 = graph.addNode(cx - 150, cy - 80);
    const n2 = graph.addNode(cx, cy - 120);
    const n3 = graph.addNode(cx + 150, cy - 80);
    const n4 = graph.addNode(cx - 150, cy + 80);
    const n5 = graph.addNode(cx, cy + 120);
    const n6 = graph.addNode(cx + 150, cy + 80);

    graph.addEdge(n1.id, n2.id, 4);
    graph.addEdge(n2.id, n3.id, 5);
    graph.addEdge(n1.id, n4.id, 2);
    graph.addEdge(n2.id, n5.id, 3);
    graph.addEdge(n3.id, n6.id, 8);
    graph.addEdge(n4.id, n5.id, 6);
    graph.addEdge(n5.id, n6.id, 1);
    graph.addEdge(n2.id, n4.id, 2);
  } else if (type === 'k4') {
    // Complete K4 Graph
    const n1 = graph.addNode(cx - 100, cy - 100);
    const n2 = graph.addNode(cx + 100, cy - 100);
    const n3 = graph.addNode(cx + 100, cy + 100);
    const n4 = graph.addNode(cx - 100, cy + 100);

    graph.addEdge(n1.id, n2.id, 5);
    graph.addEdge(n2.id, n3.id, 3);
    graph.addEdge(n3.id, n4.id, 6);
    graph.addEdge(n4.id, n1.id, 2);
    graph.addEdge(n1.id, n3.id, 8);
    graph.addEdge(n2.id, n4.id, 4);
  } else if (type === 'cycle') {
    // Ring Graph (C5)
    const radius = 120;
    const nodes = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      nodes.push(graph.addNode(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)));
    }
    graph.addEdge(nodes[0].id, nodes[1].id, 10);
    graph.addEdge(nodes[1].id, nodes[2].id, 2);
    graph.addEdge(nodes[2].id, nodes[3].id, 4);
    graph.addEdge(nodes[3].id, nodes[4].id, 9);
    graph.addEdge(nodes[4].id, nodes[0].id, 5);
  }

  logTrace(`Loaded preset <span class="highlight">${type}</span> graph layout.`);
  updateTelemetry();
  drawAll();
}

/**
 * Resets solver.
 */
function handleReset() {
  solver = null;
  currentPhaseIdx = 0;
  isSolved = false;

  const log = document.getElementById('swLogBody');
  log.innerHTML =
    '<span class="sw-log-placeholder">Trigger operations to trace contractions...</span>';

  updateTelemetry();
  drawAll();
}

/**
 * Clears active graph elements.
 */
function handleClear() {
  graph = new Graph();
  handleReset();
}

/**
 * Performs a single step contraction phase.
 */
function handleStep() {
  if (graph.nodes.length < 2) {
    logTrace('<span class="highlight">Step Error</span>: Graph needs at least 2 nodes.');
    return;
  }

  if (!solver) {
    solver = new StoerWagnerSolver(graph);
    solver.solve();
  }

  if (currentPhaseIdx < solver.phases.length) {
    const phase = solver.phases[currentPhaseIdx];
    logTrace(
      `Phase ${currentPhaseIdx + 1}: Found cut of node <span class="highlight">${phase.t}</span> with weight <span class="highlight">${phase.cutWeight}</span>. Merging ${phase.t} into ${phase.s}.`
    );
    currentPhaseIdx++;
    updateTelemetry();
    drawAll();
  } else {
    isSolved = true;
    logTrace(
      `Stoer-Wagner Complete. Global Min-Cut Weight: <span class="highlight">${solver.minCutWeight}</span>.`
    );
    updateTelemetry();
    drawAll();
  }
}

/**
 * Computes all contraction phases immediately.
 */
function handleSolve() {
  if (graph.nodes.length < 2) return;

  if (!solver) {
    solver = new StoerWagnerSolver(graph);
    solver.solve();
  }

  currentPhaseIdx = solver.phases.length;
  isSolved = true;
  logTrace(
    `Stoer-Wagner Complete. Global Min-Cut Weight: <span class="highlight">${solver.minCutWeight}</span>.`
  );
  updateTelemetry();
  drawAll();
}

/**
 * Vertex creation.
 */
function handleDoubleClick(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Verify node overlap
  const clickDist = 25;
  const overlapping = graph.nodes.find(
    (n) => Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2) < clickDist
  );

  if (!overlapping) {
    const node = graph.addNode(x, y);
    logTrace(`Created node <span class="highlight">${node.label}</span>.`);
    handleReset();
  }
}

/**
 * Mouse press down graph handler.
 */
function handleMouseDown(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const node = graph.nodes.find((n) => Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2) < 20);

  if (node) {
    draggedNode = node;
    if (selectedNode && selectedNode !== node) {
      // Connect nodes or edit weight
      const weightStr = prompt('Enter edge weight (positive integer):', '5');
      const w = parseInt(weightStr);
      if (!isNaN(w) && w > 0) {
        graph.addEdge(selectedNode.id, node.id, w);
        logTrace(
          `Connected <span class="highlight">${selectedNode.label}</span> and <span class="highlight">${node.label}</span> with weight <span class="highlight">${w}</span>.`
        );
        handleReset();
      }
      selectedNode = null;
    } else {
      selectedNode = node;
    }
  } else {
    selectedNode = null;
  }
  drawAll();
}

/**
 * Mouse drag handler.
 */
function handleMouseMove(e) {
  if (!draggedNode) return;
  const rect = canvas.getBoundingClientRect();
  draggedNode.x = e.clientX - rect.left;
  draggedNode.y = e.clientY - rect.top;
  drawAll();
}

/**
 * Mouse release handler.
 */
function handleMouseUp() {
  draggedNode = null;
}

/**
 * Refreshes telemetry panel stats.
 */
function updateTelemetry() {
  document.getElementById('telNodeCount').textContent = graph.nodes.length;
  document.getElementById('telEdgeCount').textContent = graph.edges.length;

  const phaseTag = document.getElementById('swPhaseTag');
  const telPhaseCount = document.getElementById('telPhaseCount');

  if (solver) {
    phaseTag.textContent = `Phase ${currentPhaseIdx}/${solver.phases.length}`;
    telPhaseCount.textContent = `${currentPhaseIdx} / ${solver.phases.length}`;
    document.getElementById('telMinCutWeight').textContent = isSolved ? solver.minCutWeight : '-';
  } else {
    phaseTag.textContent = 'Phase 0/0 (Idle)';
    telPhaseCount.textContent = '0 / 0';
    document.getElementById('telMinCutWeight').textContent = '-';
  }
}

/**
 * Redraws graph components.
 */
function drawAll() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const isPartitioned = isSolved && solver && solver.bestPartition;
  const partitionSet = isPartitioned ? new Set(solver.bestPartition) : null;

  // 1. Draw edges
  graph.edges.forEach((e) => {
    const uNode = graph.nodes.find((n) => n.id === e.u);
    const vNode = graph.nodes.find((n) => n.id === e.v);
    if (!uNode || !vNode) return;

    ctx.beginPath();
    ctx.moveTo(uNode.x, uNode.y);
    ctx.lineTo(vNode.x, vNode.y);

    // Color code cut edges once solved
    const isCutEdge =
      isPartitioned &&
      ((partitionSet.has(e.u) && !partitionSet.has(e.v)) ||
        (partitionSet.has(e.v) && !partitionSet.has(e.u)));

    ctx.strokeStyle = isCutEdge ? '#ef4444' : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = isCutEdge ? 3.5 : 1.5;
    ctx.stroke();

    // Draw edge weight
    const mx = (uNode.x + vNode.x) / 2;
    const my = (uNode.y + vNode.y) / 2;

    ctx.fillStyle = isCutEdge ? '#ef4444' : '#a855f7';
    ctx.font = 'bold 11px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.weight, mx, my - 8);
  });

  // 2. Draw nodes
  graph.nodes.forEach((n) => {
    const isSelected = selectedNode === n;
    const isCurrentPartition = isPartitioned && partitionSet.has(n.id);

    ctx.beginPath();
    ctx.arc(n.x, n.y, 18, 0, 2 * Math.PI);

    // Color partitioning code
    if (isPartitioned) {
      ctx.fillStyle = isCurrentPartition ? '#1e1b4b' : '#064e3b';
      ctx.strokeStyle = isCurrentPartition ? '#a855f7' : '#10b981';
    } else {
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = isSelected ? '#ffffff' : '#a855f7';
    }

    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n.label, n.x, n.y);
  });

  // 3. Draw partition cut dashed boundary line if solved
  if (isPartitioned) {
    drawCutBoundary(partitionSet);
  }
}

/**
 * Draws neon cut partition dividing boundary.
 * @param {Set<number>} partitionSet
 */
function drawCutBoundary(partitionSet) {
  // Simple heuristic cut line by finding average center between set S and set T
  let sumSx = 0,
    sumSy = 0,
    countS = 0;
  let sumTx = 0,
    sumTy = 0,
    countT = 0;

  graph.nodes.forEach((n) => {
    if (partitionSet.has(n.id)) {
      sumSx += n.x;
      sumSy += n.y;
      countS++;
    } else {
      sumTx += n.x;
      sumTy += n.y;
      countT++;
    }
  });

  if (countS > 0 && countT > 0) {
    const avgSx = sumSx / countS;
    const avgSy = sumSy / countS;
    const avgTx = sumTx / countT;
    const avgTy = sumTy / countT;

    // Cut line perpendicular to the path connecting both centers
    const mx = (avgSx + avgTx) / 2;
    const my = (avgSy + avgTy) / 2;
    const dx = avgTx - avgSx;
    const dy = avgTy - avgSy;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len > 0) {
      const px = -dy / len;
      const py = dx / len;
      const lineLen = 160;

      ctx.beginPath();
      ctx.moveTo(mx - px * lineLen, my - py * lineLen);
      ctx.lineTo(mx + px * lineLen, my + py * lineLen);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

/* ─── ESM Module Exports for testing ─── */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Graph,
    StoerWagnerSolver,
  };
}
