// ============================================
// PERSISTENT SEGMENT TREE VISUALIZER
// ============================================

let currentMode = 'standard'; // 'standard' or 'kth'
const N = 8; // Fixed size for simplicity

let versions = []; // Roots of segment trees
let arrays = []; // Snapshots of underlying array

let baseArray = [];
let currentViewingVersion = -1;

let abortController = null;
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

function getSpeed() {
  return parseInt(document.getElementById('speedRange').value);
}
document.getElementById('speedRange').addEventListener('input', function () {
  document.getElementById('speedLabel').textContent = this.value + 'ms';
});

// Canvas Setup
let canvas, ctx;
const nodeRadius = 16;
let nodeLayout = {}; // NodeID -> {x, y}
let nextNodeId = 1;
// allNodes is no longer a global accumulator; nodes are discovered
// by traversing the reachable tree from each version root so that
// unreferenced subtrees can be garbage-collected by the JS engine.
const versionNewNodes = []; // versionNewNodes[v] = Set of node IDs created in version v

// Colors
const COL_OLD = 'rgba(255, 255, 255, 0.25)'; // Shared/old nodes
const COL_NEW = '#a855f7'; // Newly created nodes
const COL_HL = '#f59e0b'; // Highlight traversal
const COL_LCA = '#22c55e'; // Green success

// Node class
class PSTNode {
  constructor(L, R, val, versionCreated, left = null, right = null) {
    this.id = nextNodeId++;
    this.L = L;
    this.R = R;
    this.val = val;
    this.versionCreated = versionCreated;
    this.left = left;
    this.right = right;
    // Register in per-version new-node set (not in a global accumulator)
    if (!versionNewNodes[versionCreated]) versionNewNodes[versionCreated] = new Set();
    versionNewNodes[versionCreated].add(this.id);
  }
}

// Tree logic
function buildEmpty(L, R, version, initialArray = null) {
  if (L === R) {
    let val = initialArray ? initialArray[L] : 0;
    return new PSTNode(L, R, val, version);
  }
  const mid = Math.floor((L + R) / 2);
  const leftChild = buildEmpty(L, mid, version, initialArray);
  const rightChild = buildEmpty(mid + 1, R, version, initialArray);
  return new PSTNode(L, R, leftChild.val + rightChild.val, version, leftChild, rightChild);
}

function update(node, L, R, idx, val, version, mode) {
  if (L === R) {
    let newVal = mode === 'standard' ? val : node.val + val;
    return new PSTNode(L, R, newVal, version);
  }
  const mid = Math.floor((L + R) / 2);
  let leftChild = node.left;
  let rightChild = node.right;

  if (idx <= mid) leftChild = update(node.left, L, mid, idx, val, version, mode);
  else rightChild = update(node.right, mid + 1, R, idx, val, version, mode);

  return new PSTNode(L, R, leftChild.val + rightChild.val, version, leftChild, rightChild);
}

// Visual layout — only traverses nodes reachable from the given roots
// so that unreachable (old-version) nodes remain GC-eligible.
function layoutTree(rootsToLayout) {
  const H = 350;
  const W = canvas ? canvas.width : 800;

  const visited = new Set();
  const queue = Array.isArray(rootsToLayout) ? [...rootsToLayout] : [rootsToLayout];

  while (queue.length > 0) {
    const n = queue.shift();
    if (!n || visited.has(n.id)) continue;
    visited.add(n.id);

    let depth = 0;
    let len = n.R - n.L + 1;
    if (len === 8) depth = 0;
    else if (len === 4) depth = 1;
    else if (len === 2) depth = 2;
    else if (len === 1) depth = 3;

    let centerIdx = (n.L + n.R) / 2;
    nodeLayout[n.id] = {
      x: (centerIdx + 0.5) * (W / N),
      y: 50 + depth * (H / 4),
    };

    if (n.left) queue.push(n.left);
    if (n.right) queue.push(n.right);
  }
}

// UI State
function updateStatus(msg, type = 'normal') {
  const el = document.getElementById('pstStatus');
  el.innerHTML = msg;
  el.className = 'pst-status';
  if (type === 'good') el.classList.add('good');
  if (type === 'error') el.classList.add('error');
}

function logQuery(msg) {
  const log = document.getElementById('queryLog');
  const div = document.createElement('div');
  div.className = 'pst-answer-row';
  div.innerHTML = msg;
  log.prepend(div);
}

function renderTimeline() {
  const tl = document.getElementById('versionTimeline');
  tl.innerHTML = '';
  versions.forEach((v, idx) => {
    const btn = document.createElement('button');
    btn.className = `version-btn ${idx === currentViewingVersion ? 'active' : ''}`;
    btn.innerText = `V${idx}`;
    btn.onclick = () => viewVersion(idx);
    tl.appendChild(btn);
  });
  updateDiffDropdowns();
}

function updateDiffDropdowns() {
  const diffPanel = document.getElementById('diffPanelContainer');
  if (versions.length > 1) {
    diffPanel.style.display = 'block';
  } else {
    diffPanel.style.display = 'none';
    return;
  }

  const baseSel = document.getElementById('diffBaseVersion');
  const compSel = document.getElementById('diffCompareVersion');

  const prevBase = baseSel.value;
  const prevComp = compSel.value;

  baseSel.innerHTML = '';
  compSel.innerHTML = '';

  versions.forEach((v, idx) => {
    baseSel.add(new Option(`V${idx}`, idx));
    compSel.add(new Option(`V${idx}`, idx));
  });

  if (prevBase && prevBase < versions.length) baseSel.value = prevBase;
  else baseSel.value = 0;

  if (prevComp && prevComp < versions.length) compSel.value = prevComp;
  else compSel.value = versions.length - 1;
}

function computeVersionDiff() {
  const vIdxA = parseInt(document.getElementById('diffBaseVersion').value);
  const vIdxB = parseInt(document.getElementById('diffCompareVersion').value);

  if (isNaN(vIdxA) || isNaN(vIdxB) || vIdxA >= versions.length || vIdxB >= versions.length) {
    updateStatus('Invalid versions for diff', 'error');
    return;
  }

  // Clear other highlights
  queryPath1.clear();
  queryPath2.clear();
  highlightNodes.clear();

  const getReachable = (root) => {
    const s = new Set();
    const q = [root];
    while (q.length > 0) {
      const curr = q.shift();
      s.add(curr.id);
      if (curr.left) q.push(curr.left);
      if (curr.right) q.push(curr.right);
    }
    return s;
  };

  const reachableA = getReachable(versions[vIdxA]);
  const reachableB = getReachable(versions[vIdxB]);

  const baseOnly = new Set([...reachableA].filter((x) => !reachableB.has(x)));
  const compareOnly = new Set([...reachableB].filter((x) => !reachableA.has(x)));
  const shared = new Set([...reachableA].filter((x) => reachableB.has(x)));

  diffMode = true;
  diffSets = { baseOnly, compareOnly, shared };

  document.getElementById('btnClearDiff').style.display = 'inline-flex';

  const summary = document.getElementById('diffSummary');
  summary.style.display = 'block';
  summary.innerHTML = `V${vIdxA} vs V${vIdxB} Diff Summary
─────────────────────
Base-only nodes:     <span style="color:#eab308">${baseOnly.size}</span>  (exclusive to V${vIdxA})
Compare-only nodes:  <span style="color:#22c55e">${compareOnly.size}</span> (exclusive to V${vIdxB})
Shared nodes:        <span style="color:#3b82f6">${shared.size}</span> (structurally shared)
Total unique nodes:  ${new Set([...reachableA, ...reachableB]).size}`;

  viewVersion(vIdxB);
}

function clearVersionDiff() {
  diffMode = false;
  diffSets = null;
  document.getElementById('btnClearDiff').style.display = 'none';
  document.getElementById('diffSummary').style.display = 'none';
  viewVersion(currentViewingVersion);
}

function viewVersion(idx) {
  currentViewingVersion = idx;
  renderTimeline();

  document.getElementById('lblCurrentVersion').innerText = idx;
  document.getElementById('lblArrayVersion').innerText = idx;

  const arr = arrays[idx];
  const track = document.getElementById('mainArrayTrack');
  track.innerHTML = '';
  if (arr) {
    for (let i = 0; i < N; i++) {
      const div = document.createElement('div');
      div.className = 'pst-array-cell';
      div.id = `arr-cell-${i}`;
      div.innerHTML = `${arr[i]}<div class="pst-array-cell-idx">${i}</div>`;
      track.appendChild(div);
    }
  }

  drawCanvasForVersion(idx);
}

// Canvas Rendering
let activeNodes = new Set();
let queryPath1 = new Set();
let queryPath2 = new Set();
let highlightNodes = new Set();
let diffMode = false;
let diffSets = null; // { baseOnly, compareOnly, shared }

function initCanvas() {
  canvas = document.getElementById('treeCanvas');
  ctx = canvas.getContext('2d');
  const wrapper = canvas.parentElement;
  canvas.width = wrapper.clientWidth;
  canvas.height = wrapper.clientHeight;

  window.addEventListener('resize', () => {
    requestAnimationFrame(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      if (versions.length > 0 && currentViewingVersion >= 0) {
        layoutTree(versions);
        drawCanvasForVersion(currentViewingVersion);
      }
    });
  });
}

function drawCanvasForVersion(vIdx) {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (vIdx < 0 || vIdx >= versions.length) return;
  const root = versions[vIdx];

  // Collect all nodes in this version
  let q = [root];
  let vNodes = [];
  let edges = [];

  while (q.length > 0) {
    let curr = q.shift();
    vNodes.push(curr);
    if (curr.left) {
      edges.push([curr, curr.left]);
      q.push(curr.left);
    }
    if (curr.right) {
      edges.push([curr, curr.right]);
      q.push(curr.right);
    }
  }

  // Draw edges
  edges.forEach((e) => {
    let p1 = nodeLayout[e[0].id];
    let p2 = nodeLayout[e[1].id];

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineWidth = 2;

    if (queryPath1.has(e[0].id) && queryPath1.has(e[1].id)) {
      ctx.strokeStyle = COL_HL;
      ctx.lineWidth = 4;
    } else if (queryPath2.has(e[0].id) && queryPath2.has(e[1].id)) {
      ctx.strokeStyle = COL_LCA;
      ctx.lineWidth = 4;
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    }
    ctx.stroke();
  });

  // Draw nodes
  vNodes.forEach((n) => {
    let p = nodeLayout[n.id];
    let color = n.versionCreated === vIdx ? COL_NEW : COL_OLD;
    let scale = 1;
    let fontCol = '#fff';

    if (diffMode && diffSets) {
      if (diffSets.baseOnly.has(n.id)) {
        color = '#eab308'; // Base only
        scale = 1.1;
      } else if (diffSets.compareOnly.has(n.id)) {
        color = '#22c55e'; // Compare only
        scale = 1.1;
      } else if (diffSets.shared.has(n.id)) {
        color = '#3b82f6'; // Shared
      } else {
        color = 'rgba(255,255,255,0.1)';
        fontCol = 'rgba(255,255,255,0.2)';
      }
    } else {
      if (highlightNodes.has(n.id) || queryPath1.has(n.id)) {
        color = COL_HL;
        scale = 1.2;
        fontCol = COL_HL;
      }
      if (queryPath2.has(n.id)) {
        color = COL_LCA;
        scale = 1.2;
        fontCol = COL_LCA;
      }
      if (activeNodes.has(n.id)) {
        color = COL_LCA;
        scale = 1.3;
        fontCol = COL_LCA;
      }
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, nodeRadius * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#1e1e1e';
    ctx.fill();
    ctx.lineWidth = 2 * scale;
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.fillStyle = fontCol;
    ctx.font = `600 ${12 * scale}px "Fira Code", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n.val, p.x, p.y);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `400 9px "Fira Code", monospace`;
    ctx.fillText(`[${n.L},${n.R}]`, p.x, p.y + 24);
  });
}

function enableControls(enable) {
  document
    .querySelectorAll('.pst-btn, .pst-input, .pst-select')
    .forEach((el) => (el.disabled = !enable));
}

// Mode Logic
document.getElementById('modeSelect').addEventListener('change', (e) => {
  currentMode = e.target.value;
  if (currentMode === 'standard') {
    document.getElementById('standardControls').style.display = 'flex';
    document.getElementById('kthControls').style.display = 'none';
    document.getElementById('arrayTitle').innerText = 'Base Array (Version 0)';
  } else {
    document.getElementById('standardControls').style.display = 'none';
    document.getElementById('kthControls').style.display = 'flex';
  }
  resetVis();
});

document.getElementById('btnReset').addEventListener('click', resetVis);

function resetVis() {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  // Drop all version roots so the JS GC can collect the entire node graph
  versions = [];
  arrays = [];
  nextNodeId = 1;
  versionNewNodes.length = 0; // Clear per-version node registry
  nodeLayout = {}; // Drop stale layout entries
  currentViewingVersion = -1;
  activeNodes.clear();
  highlightNodes.clear();
  queryPath1.clear();
  queryPath2.clear();

  document.getElementById('versionTimeline').innerHTML =
    '<span style="color:var(--text-secondary); font-size:0.8rem; font-style:italic;">No versions yet.</span>';
  document.getElementById('mainArrayTrack').innerHTML = '';
  document.getElementById('queryLog').innerHTML =
    '<div class="pst-answer-row"><span>Ready.</span></div>';

  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateStatus('Visualizer reset. Click Initialize.');
}

document.getElementById('btnInit').addEventListener('click', () => {
  resetVis();

  if (currentMode === 'standard') {
    baseArray = Array.from({ length: N }, () => Math.floor(Math.random() * 20));
    let root = buildEmpty(0, N - 1, 0, baseArray);
    versions.push(root);
    arrays.push([...baseArray]);

    layoutTree(versions);
    viewVersion(0);
    updateStatus('Array initialized! Version 0 tree built.', 'good');
    logQuery(
      `Initialized array with elements: [${baseArray.join(', ')}] &rarr; <span class="purple">Version 0 created</span>`
    );
  } else {
    baseArray = Array.from({ length: N }, () => Math.floor(Math.random() * 8));

    let root = buildEmpty(0, N - 1, 0, Array(N).fill(0));
    versions.push(root);
    arrays.push([...baseArray]);

    layoutTree(versions);
    viewVersion(0);
    updateStatus(
      'Original Array generated (Values 0-7). Click "Build Prefix-Frequency Versions" next.',
      'good'
    );
    logQuery(`Generated original array: [${baseArray.join(', ')}]`);
  }
});

document.getElementById('btnUpdate').addEventListener('click', async () => {
  let idx = parseInt(document.getElementById('updateIdx').value);
  let val = parseInt(document.getElementById('updateVal').value);

  if (isNaN(idx) || idx < 0 || idx >= N || isNaN(val)) {
    updateStatus('Invalid index or value.', 'error');
    return;
  }

  enableControls(false);
  updateStatus(`Creating new Version ${versions.length} with A[${idx}] = ${val}...`, 'normal');

  let prevVersion = versions.length - 1;
  let newVersion = prevVersion + 1;

  let newRoot = update(versions[prevVersion], 0, N - 1, idx, val, newVersion, 'standard');
  versions.push(newRoot);

  let newArr = [...arrays[prevVersion]];
  newArr[idx] = val;
  arrays.push(newArr);

  layoutTree(versions);
  viewVersion(newVersion);

  // Use the per-version new-node registry instead of scanning allNodes globally
  const newNodeIds = versionNewNodes[newVersion] || new Set();
  for (let id of newNodeIds) {
    highlightNodes.add(id);
  }
  drawCanvasForVersion(newVersion);

  await delay(getSpeed() * 1.5);
  highlightNodes.clear();
  drawCanvasForVersion(newVersion);

  updateStatus(
    `Version ${newVersion} created! Observe how only O(log N) purple nodes were created.`,
    'good'
  );
  logQuery(
    `Update A[${idx}] = ${val} &rarr; <span class="purple">Created Version ${newVersion}</span> sharing old subtrees.`
  );

  enableControls(true);
});

document.getElementById('btnBuildAll').addEventListener('click', async () => {
  if (versions.length === 0 || currentMode !== 'kth') return;

  enableControls(false);
  abortController = new AbortController();
  let signal = abortController.signal;

  updateStatus('Building versions 1 through N...', 'normal');

  try {
    for (let i = 0; i < N; i++) {
      let val = baseArray[i];
      let prevVersion = versions.length - 1;
      let newVersion = prevVersion + 1;

      let newRoot = update(versions[prevVersion], 0, N - 1, val, 1, newVersion, 'kth');
      versions.push(newRoot);
      arrays.push([...baseArray]);

      layoutTree(versions);
      viewVersion(newVersion);

      // Use per-version new-node registry instead of scanning allNodes globally
      const newNodeIds = versionNewNodes[newVersion] || new Set();
      newNodeIds.forEach((id) => highlightNodes.add(id));
      drawCanvasForVersion(newVersion);

      await delay(getSpeed());
      if (signal.aborted) return;

      highlightNodes.clear();
    }

    drawCanvasForVersion(versions.length - 1);
    updateStatus(
      `Prefix-Frequency trees built! Version R contains frequencies for A[0...R-1].`,
      'good'
    );
    logQuery(`Built ${N} versions. Each new version adds +1 frequency to the leaf of the value.`);
  } catch (_e) {
    /* intentionally swallowed */
  }

  enableControls(true);
});

document.getElementById('btnQuery').addEventListener('click', async () => {
  let L = parseInt(document.getElementById('queryL').value);
  let R = parseInt(document.getElementById('queryR').value);

  if (isNaN(L) || isNaN(R) || L > R || L < 0 || R >= N) {
    updateStatus('Invalid range.', 'error');
    return;
  }
  if (currentViewingVersion < 0) return;

  enableControls(false);
  activeNodes.clear();
  highlightNodes.clear();
  queryPath1.clear();
  queryPath2.clear();
  abortController = new AbortController();
  let signal = abortController.signal;

  updateStatus(`Querying Sum[${L}, ${R}] on Version ${currentViewingVersion}...`, 'normal');

  let sum = 0;

  async function query(node, s, e) {
    if (signal.aborted || !node) return 0;

    queryPath1.add(node.id);
    drawCanvasForVersion(currentViewingVersion);
    await delay(getSpeed() / 2);

    if (s <= node.L && node.R <= e) {
      activeNodes.add(node.id);
      drawCanvasForVersion(currentViewingVersion);
      await delay(getSpeed());
      return node.val;
    }

    const mid = Math.floor((node.L + node.R) / 2);
    let res = 0;
    if (s <= mid) res += await query(node.left, s, e);
    if (e > mid) res += await query(node.right, s, e);
    return res;
  }

  try {
    sum = await query(versions[currentViewingVersion], L, R);
    if (signal.aborted) return;

    updateStatus(`Sum[${L}, ${R}] in Version ${currentViewingVersion} is ${sum}`, 'good');
    logQuery(
      `Query Sum[${L}, ${R}] on <span class="purple">V${currentViewingVersion}</span> &rarr; <span class="success">${sum}</span>`
    );
  } catch (_e) {
    /* intentionally swallowed */
  }

  activeNodes.clear();
  queryPath1.clear();
  drawCanvasForVersion(currentViewingVersion);
  enableControls(true);
});

document.getElementById('btnQueryKth').addEventListener('click', async () => {
  let L = parseInt(document.getElementById('kthL').value);
  let R = parseInt(document.getElementById('kthR').value);
  let K = parseInt(document.getElementById('kthK').value);

  if (isNaN(L) || isNaN(R) || L > R || L < 0 || R >= N || isNaN(K) || K < 1 || K > R - L + 1) {
    updateStatus('Invalid inputs for K-th query.', 'error');
    return;
  }
  if (versions.length <= N) {
    updateStatus('Please build all versions first.', 'error');
    return;
  }

  enableControls(false);
  activeNodes.clear();
  highlightNodes.clear();
  queryPath1.clear();
  queryPath2.clear();
  abortController = new AbortController();
  let signal = abortController.signal;

  let vR = R + 1;
  let vL = L;

  viewVersion(vR);
  updateStatus(
    `Finding ${K}-th smallest in [${L}, ${R}]. Comparing Version ${vR} and Version ${vL}...`,
    'normal'
  );

  try {
    let nodeR = versions[vR];
    let nodeL = versions[vL];

    while (nodeR.L !== nodeR.R) {
      if (signal.aborted) return;
      queryPath1.add(nodeR.id);
      drawCanvasForVersion(vR);

      let countL = nodeL && nodeL.left ? nodeL.left.val : 0;
      let countR = nodeR && nodeR.left ? nodeR.left.val : 0;

      let countInLeftSubtree = countR - countL;

      updateStatus(
        `Left Subtree holds values [${nodeR.left.L}, ${nodeR.left.R}]. Frequency in range = ${countR} - ${countL} = ${countInLeftSubtree}`,
        'normal'
      );
      await delay(getSpeed() * 1.5);

      if (countInLeftSubtree >= K) {
        updateStatus(
          `${K} <= ${countInLeftSubtree}, so K-th element is in the left subtree.`,
          'normal'
        );
        nodeR = nodeR.left;
        nodeL = nodeL ? nodeL.left : null;
      } else {
        updateStatus(
          `${K} > ${countInLeftSubtree}, going right and subtracting ${countInLeftSubtree} from K.`,
          'normal'
        );
        K -= countInLeftSubtree;
        nodeR = nodeR.right;
        nodeL = nodeL ? nodeL.right : null;
      }
      await delay(getSpeed());
    }

    queryPath1.add(nodeR.id);
    activeNodes.add(nodeR.id);
    drawCanvasForVersion(vR);

    updateStatus(
      `Found it! The ${document.getElementById('kthK').value}-th smallest in [${L}, ${R}] is ${nodeR.L}.`,
      'good'
    );
    logQuery(
      `K-th Smallest (K=${document.getElementById('kthK').value}) in [${L}, ${R}] &rarr; <span class="success">Value ${nodeR.L}</span>`
    );
  } catch (_e) {
    /* intentionally swallowed */
  }

  enableControls(true);
});

// Hero particle background
const heroCanvas = document.getElementById('pstHeroCanvas');
const hctx = heroCanvas.getContext('2d');
let particles = [];
function initHeroCanvas() {
  const resizeHero = () => {
    heroCanvas.width = heroCanvas.clientWidth;
    heroCanvas.height = heroCanvas.clientHeight;
  };
  window.addEventListener('resize', resizeHero);
  resizeHero();

  for (let i = 0; i < 40; i++) {
    particles.push({
      x: Math.random() * heroCanvas.width,
      y: Math.random() * heroCanvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
    });
  }

  function animateHero() {
    hctx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
    hctx.fillStyle = 'rgba(168, 85, 247, 0.5)';
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = heroCanvas.width;
      if (p.x > heroCanvas.width) p.x = 0;
      if (p.y < 0) p.y = heroCanvas.height;
      if (p.y > heroCanvas.height) p.y = 0;
      hctx.beginPath();
      hctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      hctx.fill();
    });
    requestAnimationFrame(animateHero);
  }
  animateHero();
}

initCanvas();
initHeroCanvas();

document.getElementById('btnCompareDiff').addEventListener('click', computeVersionDiff);
document.getElementById('btnClearDiff').addEventListener('click', clearVersionDiff);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PSTNode,
    buildEmpty,
    update,
    layoutTree,
    resetVis: function () {
      versions = [];
      arrays = [];
      nextNodeId = 1;
      versionNewNodes.length = 0;
      nodeLayout = {};
      currentViewingVersion = -1;
    },
    getVersions: function () {
      return versions;
    },
    getVersionNewNodes: function () {
      return versionNewNodes;
    },
    getNodeLayout: function () {
      return nodeLayout;
    },
    N,
  };
}
