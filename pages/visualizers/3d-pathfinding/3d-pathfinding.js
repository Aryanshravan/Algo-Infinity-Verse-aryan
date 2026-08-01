document.addEventListener('DOMContentLoaded', () => {
  initVoxelEngine();
});

// ==========================================
// 1. STATE & CONSTANTS
// ==========================================
const ROWS = 15;
const COLS = 15;

const TERRAIN = {
  GRASS: { type: 'grass', cost: 1, z: 0, class: 't-grass' },
  MUD: { type: 'mud', cost: 3, z: -10, class: 't-mud' },
  MOUNTAIN: { type: 'mountain', cost: 5, z: 30, class: 't-mountain' },
  WATER: { type: 'water', cost: Infinity, z: -5, class: 't-water' },
};

let grid = []; // 2D array of Node objects
let startNode = null;
let endNode = null;

let isRunning = false;
let runInterval = null;
let speedMs = 100;
let heuristicType = 'manhattan';

// DOM
const els = {
  grid: document.getElementById('voxelGrid'),
  camRotateZ: document.getElementById('camRotateZ'),

  btnRand: document.getElementById('btnGenRandom'),
  btnMount: document.getElementById('btnGenMountain'),
  btnClear: document.getElementById('btnClear'),
  btnStart: document.getElementById('btnStart'),

  selHeur: document.getElementById('selHeuristic'),
  sliderSpd: document.getElementById('sliderSpeed'),

  stream: document.getElementById('terminalStream'),
  pathStats: document.getElementById('pathStats'),
  statStatus: document.getElementById('statStatus'),
  statCost: document.getElementById('statCost'),
  statScanned: document.getElementById('statScanned'),
};

class Node {
  constructor(r, c) {
    this.r = r;
    this.c = c;
    this.terrain = TERRAIN.GRASS;

    // A* properties
    this.f = 0;
    this.g = 0;
    this.h = 0;
    this.parent = null;

    // DOM Element
    this.el = document.createElement('div');
    this.el.className = 'voxel t-grass';
    this.el.dataset.r = r;
    this.el.dataset.c = c;

    this.topFace = document.createElement('div');
    this.topFace.className = 'v-top';
    this.el.appendChild(this.topFace);

    this.mathLabel = document.createElement('div');
    this.mathLabel.className = 'math-label';
    this.el.appendChild(this.mathLabel);
  }

  setTerrain(t) {
    this.el.classList.remove(this.terrain.class);
    this.terrain = t;
    this.el.classList.add(this.terrain.class);
  }

  resetAStar() {
    this.f = 0;
    this.g = 0;
    this.h = 0;
    this.parent = null;
    this.el.classList.remove('v-open', 'v-closed', 'v-path');
    this.mathLabel.classList.remove('show');
  }
}

// ==========================================
// 2. INITIALIZATION
// ==========================================
function initVoxelEngine() {
  // Generate Grid DOM
  for (let r = 0; r < ROWS; r++) {
    let rowNodes = [];
    for (let c = 0; c < COLS; c++) {
      const node = new Node(r, c);

      // Set interaction (Paint terrain / Set Start/End)
      node.el.addEventListener('click', (e) => handleVoxelClick(r, c, e));

      els.grid.appendChild(node.el);
      rowNodes.push(node);
    }
    grid.push(rowNodes);
  }

  // Bind Controls
  els.camRotateZ.addEventListener('input', (e) => {
    // Rotate grid around Z, keep X fixed at 60deg isometric
    const zDeg = e.target.value;
    els.grid.style.transform = `rotateX(60deg) rotateZ(${zDeg}deg)`;

    // Counter-rotate math labels so they always face the screen
    document.querySelectorAll('.math-label').forEach((lbl) => {
      lbl.style.transform = `translate(-50%, -50%) rotateZ(${-zDeg}deg) rotateX(-60deg) translateZ(40px)`;
    });
  });

  els.btnRand.addEventListener('click', () => generateMap('random'));
  els.btnMount.addEventListener('click', () => generateMap('mountain'));
  els.btnClear.addEventListener('click', () => generateMap('clear'));

  els.btnStart.addEventListener('click', runAStar);

  els.selHeur.addEventListener('change', (e) => (heuristicType = e.target.value));
  els.sliderSpd.addEventListener('input', (e) => (speedMs = 210 - e.target.value)); // invert

  generateMap('mountain'); // Default map
}

function handleVoxelClick(r, c, e) {
  if (isRunning) return;
  const node = grid[r][c];

  // Shift click sets Start
  if (e.shiftKey) {
    if (startNode) startNode.el.classList.remove('v-start');
    startNode = node;
    node.el.classList.add('v-start');
    node.setTerrain(TERRAIN.GRASS);
    logMsg(`Start Node set to [${r}, ${c}]`, 'info');
    return;
  }
  // Alt click sets End
  if (e.altKey) {
    if (endNode) endNode.el.classList.remove('v-end');
    endNode = node;
    node.el.classList.add('v-end');
    node.setTerrain(TERRAIN.GRASS);
    logMsg(`Target Node set to [${r}, ${c}]`, 'info');
    return;
  }

  // Normal click cycles terrain
  if (node === startNode || node === endNode) return;

  if (node.terrain === TERRAIN.GRASS) node.setTerrain(TERRAIN.MUD);
  else if (node.terrain === TERRAIN.MUD) node.setTerrain(TERRAIN.MOUNTAIN);
  else if (node.terrain === TERRAIN.MOUNTAIN) node.setTerrain(TERRAIN.WATER);
  else node.setTerrain(TERRAIN.GRASS);
}

// ==========================================
// 3. TERRAIN GENERATION
// ==========================================
function generateMap(type) {
  if (isRunning) return;

  // Clean up
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const n = grid[r][c];
      n.setTerrain(TERRAIN.GRASS);
      n.el.classList.remove('v-start', 'v-end');
      n.resetAStar();
    }
  }
  els.pathStats.style.display = 'none';

  if (type === 'clear') {
    startNode = grid[2][2];
    startNode.el.classList.add('v-start');
    endNode = grid[12][12];
    endNode.el.classList.add('v-end');
    logMsg(`Grid cleared.`, 'info');
    return;
  }

  if (type === 'random') {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const rand = Math.random();
        if (rand < 0.1) grid[r][c].setTerrain(TERRAIN.WATER);
        else if (rand < 0.25) grid[r][c].setTerrain(TERRAIN.MOUNTAIN);
        else if (rand < 0.4) grid[r][c].setTerrain(TERRAIN.MUD);
      }
    }
  }

  if (type === 'mountain') {
    // Build a mountain pass (a wall of mountains with a mud/grass gap)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 4; c <= 10; c++) {
        // A diagonal-ish wall
        if (Math.abs(r - c) < 3) {
          if (Math.random() < 0.8) grid[r][c].setTerrain(TERRAIN.MOUNTAIN);
          else grid[r][c].setTerrain(TERRAIN.MUD);
        }
      }
    }
    // Add a lake
    for (let r = 10; r < 14; r++) {
      for (let c = 2; c < 6; c++) grid[r][c].setTerrain(TERRAIN.WATER);
    }
  }

  startNode = grid[2][2];
  startNode.setTerrain(TERRAIN.GRASS);
  startNode.el.classList.add('v-start');
  endNode = grid[12][12];
  endNode.setTerrain(TERRAIN.GRASS);
  endNode.el.classList.add('v-end');

  logMsg(`Generated ${type} map.`, 'info');
}

// ==========================================
// 4. A* PATHFINDING ENGINE (3D Z-AWARE)
// ==========================================

function getHeuristic(nodeA, nodeB) {
  const dx = Math.abs(nodeA.r - nodeB.r);
  const dy = Math.abs(nodeA.c - nodeB.c);
  const dz = Math.abs(nodeA.terrain.z - nodeB.terrain.z) / 10; // normalize z scale roughly

  if (heuristicType === 'euclidean') {
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  // Manhattan
  return dx + dy + dz;
}

function getNeighbors(node) {
  const neighbors = [];
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  dirs.forEach((d) => {
    const nr = node.r + d[0];
    const nc = node.c + d[1];
    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
      const nb = grid[nr][nc];
      if (nb.terrain.cost !== Infinity) neighbors.push(nb);
    }
  });
  return neighbors;
}

async function runAStar() {
  if (isRunning || !startNode || !endNode) return;

  isRunning = true;
  els.btnStart.disabled = true;
  logMsg(`--- INITIATING A* SCAN ---`, 'warning');

  // Reset path data
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      grid[r][c].resetAStar();
    }
  }
  els.pathStats.style.display = 'none';

  let openSet = [startNode];
  let closedSet = new Set();
  let nodesScanned = 0;

  startNode.g = 0;
  startNode.h = getHeuristic(startNode, endNode);
  startNode.f = startNode.g + startNode.h;

  while (openSet.length > 0) {
    // Find node with lowest F
    let currIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currIdx].f) currIdx = i;
    }

    let curr = openSet[currIdx];
    nodesScanned++;

    if (curr !== startNode && curr !== endNode) {
      curr.el.classList.remove('v-open');
      curr.el.classList.add('v-closed');
      curr.mathLabel.classList.remove('show');
    }

    // Reached End?
    if (curr === endNode) {
      await tracePath(endNode, nodesScanned);
      isRunning = false;
      els.btnStart.disabled = false;
      return;
    }

    openSet.splice(currIdx, 1);
    closedSet.add(curr);

    const neighbors = getNeighbors(curr);

    for (let nb of neighbors) {
      if (closedSet.has(nb)) continue;

      // Calculate movement cost.
      // 3D physics: Going UP a mountain is very expensive. Going DOWN is cheap.
      let zCost = 0;
      if (nb.terrain.z > curr.terrain.z) {
        zCost = ((nb.terrain.z - curr.terrain.z) / 10) * 2; // Extra penalty for climbing
      }

      // G = parent G + terrain weight + Z elevation cost
      let tentativeG = curr.g + nb.terrain.cost + zCost;

      let newPath = false;
      if (!openSet.includes(nb)) {
        openSet.push(nb);
        newPath = true;
        if (nb !== endNode) {
          nb.el.classList.add('v-open');

          // Show Floating Math (simulate a HUD scan)
          nb.mathLabel.textContent = `F${(tentativeG + getHeuristic(nb, endNode)).toFixed(1)} = G${tentativeG.toFixed(1)} + H${getHeuristic(nb, endNode).toFixed(1)}`;
          nb.mathLabel.classList.add('show');
        }
      } else if (tentativeG < nb.g) {
        newPath = true;
      }

      if (newPath) {
        nb.parent = curr;
        nb.g = tentativeG;
        nb.h = getHeuristic(nb, endNode);
        nb.f = nb.g + nb.h;

        logMsg(
          `Scan [${nb.r},${nb.c}]: G=${nb.g.toFixed(1)} H=${nb.h.toFixed(1)} F=${nb.f.toFixed(1)}`
        );
      }
    }

    await sleep(speedMs);
  }

  // No Path
  logMsg(`SCAN COMPLETE: No path found! Target unreachable.`, 'warning');
  els.statStatus.textContent = 'FALSE';
  els.statStatus.className = 'text-red';
  els.statCost.textContent = 'INF';
  els.statScanned.textContent = nodesScanned;
  els.pathStats.style.display = 'block';

  isRunning = false;
  els.btnStart.disabled = false;
}

async function tracePath(end, scannedCount) {
  logMsg(`Target located. Backtracking optimal route...`, 'success');
  let curr = end.parent;
  let path = [];

  while (curr.parent) {
    path.push(curr);
    curr = curr.parent;
  }

  path.reverse();

  for (let i = 0; i < path.length; i++) {
    path[i].el.classList.remove('v-closed', 'v-open');
    path[i].el.classList.add('v-path');
    await sleep(50);
  }

  logMsg(`PATH ESTABLISHED. Routing complete.`, 'success');

  els.statStatus.textContent = 'TRUE';
  els.statStatus.className = 'text-lime';
  els.statCost.textContent = end.g.toFixed(1);
  els.statScanned.textContent = scannedCount;
  els.pathStats.style.display = 'block';
}

// ==========================================
// 5. UTILITIES
// ==========================================
function logMsg(msg, type = '') {
  const d = document.createElement('div');
  d.className = `term-line ${type}`;
  d.textContent = `> ${msg}`;
  els.stream.appendChild(d);
  els.stream.scrollTop = els.stream.scrollHeight;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
