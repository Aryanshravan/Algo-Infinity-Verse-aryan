document.addEventListener('DOMContentLoaded', () => {
  initCH();
});

// ==========================================
// 1. STATE & CONSTANTS
// ==========================================
const RING_MAX = 360;
const NODE_CAPACITY = 80; // Max keys before crashing
const VNODE_COUNT = 4; // Virtual replicas per node if enabled

let state = {
  physicalNodes: [], // { id, angle, keys: [], status: 'alive' | 'dead' }
  vNodes: [], // { id, parentId, angle }
  keys: [], // { id, angle }
  useVNodes: false,
};

let physicalNodeCounter = 0;
let keyCounter = 0;

// Canvas State
let canvas, ctx;
let animationId;

// DOM Elements
const els = {
  btnAddNode: document.getElementById('btnAddNode'),
  btnRemoveNode: document.getElementById('btnRemoveNode'),
  btnTrafficSpike: document.getElementById('btnTrafficSpike'),
  btnReset: document.getElementById('btnResetCluster'),
  toggleVNode: document.getElementById('vNodeToggle'),

  statPhysical: document.getElementById('statPhysical'),
  statVirtual: document.getElementById('statVirtual'),
  statKeys: document.getElementById('statKeys'),
  statVariance: document.getElementById('statVariance'),

  chart: document.getElementById('varianceChart'),
  log: document.getElementById('chLog'),
  canvasWrap: document.getElementById('ringWrapper'),
};

// ==========================================
// 2. CORE LOGIC
// ==========================================

function initCH() {
  canvas = document.getElementById('chCanvas');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  ctx = canvas.getContext('2d');

  // Bind Controls
  els.btnAddNode.addEventListener('click', () => addNode());
  els.btnRemoveNode.addEventListener('click', () => removeNode());
  els.toggleVNode.addEventListener('change', (e) => toggleVNodes(e.target.checked));
  els.btnTrafficSpike.addEventListener('click', triggerTrafficSpike);
  els.btnReset.addEventListener('click', resetCluster);

  // Initial state
  resetCluster();

  // Start Render Loop
  renderLoop();
}

function resizeCanvas() {
  canvas.width = els.canvasWrap.clientWidth;
  canvas.height = els.canvasWrap.clientHeight;
}

function logMsg(msg, type = 'info') {
  const div = document.createElement('div');
  div.className = `log-line log-${type}`;
  div.textContent = `> ${msg}`;
  els.log.appendChild(div);
  els.log.scrollTop = els.log.scrollHeight;
}

function randomAngle() {
  return Math.random() * RING_MAX;
}

function resetCluster() {
  state.physicalNodes = [];
  state.vNodes = [];
  state.keys = [];
  physicalNodeCounter = 0;
  keyCounter = 0;
  els.log.innerHTML = '';

  // Add 3 initial nodes
  addNode(0);
  addNode(120);
  addNode(240);

  recalculateDistribution();
  logMsg('Cluster hard reset with 3 nodes.', 'info');
}

function addNode(specificAngle = null) {
  const id = `Node-${++physicalNodeCounter}`;
  const angle = specificAngle !== null ? specificAngle : randomAngle();

  state.physicalNodes.push({
    id,
    angle,
    keys: [],
    status: 'alive',
  });

  logMsg(`Added physical node ${id} at angle ${Math.round(angle)}°`, 'success');
  buildVNodes();
  recalculateDistribution();
}

function removeNode() {
  const alive = state.physicalNodes.filter((n) => n.status === 'alive');
  if (alive.length === 0) return;

  // Remove last added alive node
  const target = alive[alive.length - 1];
  state.physicalNodes = state.physicalNodes.filter((n) => n.id !== target.id);

  logMsg(`Removed physical node ${target.id}`, 'warn');
  buildVNodes();
  recalculateDistribution();
}

function toggleVNodes(enabled) {
  state.useVNodes = enabled;
  logMsg(`Virtual Nodes turned ${enabled ? 'ON' : 'OFF'}`, enabled ? 'success' : 'warn');
  buildVNodes();
  recalculateDistribution();
}

function buildVNodes() {
  state.vNodes = [];
  if (!state.useVNodes) return;

  state.physicalNodes.forEach((pn) => {
    // Create deterministic but pseudo-random spread for vNodes
    for (let i = 1; i <= VNODE_COUNT; i++) {
      // Simple spread logic for visualization
      const spread = (pn.angle + (RING_MAX / VNODE_COUNT) * i + pn.id.length * 13) % RING_MAX;
      state.vNodes.push({
        id: `${pn.id}-v${i}`,
        parentId: pn.id,
        angle: spread,
      });
    }
  });
}

function getRingPoints() {
  // Returns active points on ring mapped to their physical node ID
  let points = [];
  if (state.useVNodes) {
    state.vNodes.forEach((v) => {
      const p = state.physicalNodes.find((pn) => pn.id === v.parentId);
      if (p && p.status === 'alive') {
        points.push({ angle: v.angle, physicalId: p.id });
      }
    });
  } else {
    state.physicalNodes.forEach((p) => {
      if (p.status === 'alive') {
        points.push({ angle: p.angle, physicalId: p.id });
      }
    });
  }
  // Sort clockwise
  return points.sort((a, b) => a.angle - b.angle);
}

function recalculateDistribution() {
  // Clear all node keys
  state.physicalNodes.forEach((n) => (n.keys = []));

  const points = getRingPoints();
  if (points.length === 0) return updateDashboard(); // Cluster is dead

  // Map each key to nearest point clockwise
  state.keys.forEach((k) => {
    let assigned = null;
    for (let i = 0; i < points.length; i++) {
      if (points[i].angle >= k.angle) {
        assigned = points[i];
        break;
      }
    }
    // If not found, wraps around to the first point
    if (!assigned) assigned = points[0];

    const pn = state.physicalNodes.find((n) => n.id === assigned.physicalId);
    if (pn) pn.keys.push(k);
  });

  checkCapacities();
  updateDashboard();
}

function checkCapacities() {
  let crashedAny = false;

  state.physicalNodes.forEach((n) => {
    if (n.status === 'alive' && n.keys.length > NODE_CAPACITY) {
      n.status = 'dead';
      crashedAny = true;
      logMsg(
        `CRASH! ${n.id} exceeded capacity (${n.keys.length}/${NODE_CAPACITY}) and went offline!`,
        'danger'
      );
    }
  });

  if (crashedAny) {
    // If nodes crashed, we must remap keys. This may trigger domino.
    setTimeout(() => {
      recalculateDistribution();
    }, 800); // Visual delay for the domino effect
  }
}

function triggerTrafficSpike() {
  const spikeTargetAngle = Math.random() * RING_MAX;
  const numKeys = 150;
  const spread = 20; // Concentrated in a 20 degree arc

  logMsg(
    `⚡ TRAFFIC SPIKE! Incoming ${numKeys} keys at ~${Math.round(spikeTargetAngle)}°`,
    'danger'
  );

  // Add keys progressively for visual effect
  let added = 0;
  const interval = setInterval(() => {
    for (let i = 0; i < 5; i++) {
      if (added >= numKeys) {
        clearInterval(interval);
        return;
      }
      const angle =
        (spikeTargetAngle + (Math.random() * spread - spread / 2) + RING_MAX) % RING_MAX;
      state.keys.push({ id: `k-${++keyCounter}`, angle });
      added++;
    }
    recalculateDistribution();
  }, 50);
}

// ==========================================
// 3. UI DASHBOARD
// ==========================================

function updateDashboard() {
  const aliveNodes = state.physicalNodes.filter((n) => n.status === 'alive');
  els.statPhysical.textContent = aliveNodes.length;
  els.statVirtual.textContent = state.useVNodes ? aliveNodes.length * VNODE_COUNT : 0;
  els.statKeys.textContent = state.keys.length;

  // Calculate Variance
  if (aliveNodes.length === 0) {
    els.statVariance.textContent = '0.00';
    els.chart.innerHTML = '';
    return;
  }

  const counts = aliveNodes.map((n) => n.keys.length);
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  let variance = 0;
  counts.forEach((c) => {
    variance += Math.pow(c - mean, 2);
  });
  variance = variance / counts.length;
  const stdDev = Math.sqrt(variance);

  els.statVariance.textContent = stdDev.toFixed(2);

  // Update Chart
  els.chart.innerHTML = '';
  const maxVal = Math.max(...counts, NODE_CAPACITY);

  aliveNodes.forEach((n) => {
    const bar = document.createElement('div');
    bar.className = 'ch-bar';
    const pct = (n.keys.length / maxVal) * 100;
    bar.style.height = `${Math.max(pct, 2)}%`;
    bar.setAttribute('data-tooltip', `${n.id}: ${n.keys.length} keys`);

    // Color based on capacity warning
    if (n.keys.length > NODE_CAPACITY * 0.8) {
      bar.style.background = '#f59e0b'; // warning
    }
    if (n.keys.length > NODE_CAPACITY) {
      bar.style.background = '#ef4444'; // danger
    }

    els.chart.appendChild(bar);
  });
}

// ==========================================
// 4. RENDERING ENGINE
// ==========================================

function renderLoop() {
  if (!ctx) return;

  const cw = canvas.width;
  const ch = canvas.height;
  const cx = cw / 2;
  const cy = ch / 2;
  const radius = Math.min(cw, ch) * 0.35;

  ctx.clearRect(0, 0, cw, ch);

  // 1. Draw Ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 40;
  ctx.stroke();

  // Draw capacity indicator ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const drawPoint = (angleDeg, distOffset, color, size, isStroke = false, text = null) => {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    const x = cx + Math.cos(rad) * (radius + distOffset);
    const y = cy + Math.sin(rad) * (radius + distOffset);

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    if (isStroke) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.fill();
    } else {
      ctx.fillStyle = color;
      ctx.fill();
      // Glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    if (text) {
      ctx.fillStyle = '#fff';
      ctx.font = '10px "Fira Code"';
      ctx.textAlign = 'center';
      ctx.fillText(text, x, y - size - 5);
    }
  };

  // 2. Draw Keys
  state.keys.forEach((k) => {
    // Slight random radial jitter for keys so they don't exactly overlap
    // We use hash of ID for stable jitter
    const jitterId = parseInt(k.id.split('-')[1]);
    const rJitter = (jitterId % 20) - 10;
    drawPoint(k.angle, rJitter, '#10b981', 3);
  });

  // 3. Draw Virtual Nodes
  if (state.useVNodes) {
    state.vNodes.forEach((v) => {
      const parent = state.physicalNodes.find((p) => p.id === v.parentId);
      if (parent && parent.status === 'alive') {
        drawPoint(v.angle, 0, '#a855f7', 6, false);
      }
    });
  }

  // 4. Draw Physical Nodes
  const aliveCount = state.physicalNodes.filter((n) => n.status === 'alive').length || 1;

  state.physicalNodes.forEach((n) => {
    if (n.status === 'alive') {
      const loadPct = n.keys.length / NODE_CAPACITY;
      let color = '`#3b82f6`';
      if (loadPct > 0.8) color = '`#f59e0b`';

      drawPoint(n.angle, 0, color, 12, false, n.id);

      // Draw load arc
      const radStart = (n.angle - 90) * (Math.PI / 180);
      const loadArc = Math.PI * 2 * (1 / aliveCount) * loadPct; // Rough visual approx

      ctx.beginPath();
      ctx.arc(cx, cy, radius + 25, radStart, radStart + loadArc);
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.stroke();
    } else {
      // Dead node
      drawPoint(n.angle, 0, '#ef4444', 12, true, n.id + ' (DEAD)');
    }
  });

  animationId = requestAnimationFrame(renderLoop);
}
