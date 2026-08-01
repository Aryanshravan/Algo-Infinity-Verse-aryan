// Grid Dimensions
const COLS = 80;
const ROWS = 50;

// Simulation State
let currentGrid = createGrid();
let isPlaying = false;
let generation = 0;

// Web Worker Initialization
const physicsWorker = new Worker('physicsWorker.js');
physicsWorker.onmessage = function(e) {
  if (e.data.type === 'TICK') {
    currentGrid = e.data.grid;
    generation = e.data.generation;
    updateTelemetry();
    draw();
  }
};

// Viewport Zoom & Pan State
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isPanning = false;
let startPanX = 0;
let startPanY = 0;

// Telemetry History
const maxHistoryLength = 100;
let populationHistory = [];

// DOM Elements
const canvas = document.getElementById('caCanvas');
const ctx = canvas.getContext('2d');
const rulesetSelect = document.getElementById('rulesetSelect');
const speedRange = document.getElementById('speedRange');
const speedDisplay = document.getElementById('speedDisplay');
const brushSizeRange = document.getElementById('brushSizeRange');
const brushDisplay = document.getElementById('brushDisplay');
const drawStateSelect = document.getElementById('drawStateSelect');
const presetSelect = document.getElementById('presetSelect');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stepBtn = document.getElementById('stepBtn');
const clearBtn = document.getElementById('clearBtn');
const genCountEl = document.getElementById('genCount');
const activeCountEl = document.getElementById('activeCount');
const stateFrequenciesEl = document.getElementById('stateFrequencies');
const rulesInfoTitle = document.getElementById('rulesInfoTitle');
const rulesDescription = document.getElementById('rulesDescription');
const telemetryCanvas = document.getElementById('telemetryCanvas');
const telemetryCtx = telemetryCanvas?.getContext('2d');

// Ruleset Definitions (Visuals only, logic offloaded to worker)
const RULESETS = {
  conway: {
    name: "Conway's Game of Life",
    states: [
      { value: 0, label: 'Dead', color: '#0b0c10' },
      { value: 1, label: 'Alive', color: '#66fcf1' },
    ],
    description: `- Any live cell with 2 or 3 live neighbours survives.<br>
                  - Any dead cell with exactly 3 live neighbours becomes a live cell.<br>
                  - All other live cells die in the next generation.`,
  },
  wireworld: {
    name: 'Wireworld',
    states: [
      { value: 0, label: 'Empty', color: '#0b0c10' },
      { value: 1, label: 'Electron Head', color: '#00f0ff' },
      { value: 2, label: 'Electron Tail', color: '#ff3b30' },
      { value: 3, label: 'Conductor', color: '#ffcc00' },
    ],
    description: `- Empty cells remain empty.<br>
                  - Electron Heads become Electron Tails.<br>
                  - Electron Tails become Conductors.<br>
                  - Conductors become Electron Heads if exactly 1 or 2 of their neighbors are Electron Heads.`,
  },
  briansBrain: {
    name: "Brian's Brain",
    states: [
      { value: 0, label: 'Off', color: '#0b0c10' },
      { value: 1, label: 'On', color: '#ffffff' },
      { value: 2, label: 'Dying (Refractory)', color: '#9f00ff' },
    ],
    description: `- Off cells turn On if exactly 2 neighbors are On.<br>
                  - On cells become Dying.<br>
                  - Dying cells turn Off.`,
  },
};

// Initialize Canvas Sizing (Retina support)
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  if (telemetryCanvas && telemetryCtx) {
    const tRect = telemetryCanvas.getBoundingClientRect();
    telemetryCanvas.width = tRect.width * dpr;
    telemetryCanvas.height = tRect.height * dpr;
    telemetryCtx.scale(dpr, dpr);
    drawTelemetryChart();
  } else {
    draw();
  }
}

// Grid Helper Functions
function createGrid() {
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    grid.push(new Array(COLS).fill(0));
  }
  return grid;
}

function countNeighbors(grid, r, c, targetState) {
  let count = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const newR = r + i;
      const newC = c + j;
      if (newR >= 0 && newR < ROWS && newC >= 0 && newC < COLS) {
        if (grid[newR][newC] === targetState) {
          count++;
        }
      }
    }
  }
  return count;
}

// UI Dropdown Updates
function updateDrawStateDropdown() {
  const ruleset = RULESETS[rulesetSelect.value];
  drawStateSelect.innerHTML = '';
  ruleset.states.forEach((s) => {
    if (s.value !== 0) {
      // Don't allow drawing the default empty state, or allow it as 'Eraser/Dead/Off'
      const opt = document.createElement('option');
      opt.value = s.value;
      opt.textContent = s.label;
      drawStateSelect.appendChild(opt);
    }
  });
  // Add an Eraser option explicitly
  const eraserOpt = document.createElement('option');
  eraserOpt.value = 0;
  eraserOpt.textContent = 'Eraser (Clear)';
  drawStateSelect.appendChild(eraserOpt);
}

function updateRulesInfo() {
  const ruleset = RULESETS[rulesetSelect.value];
  rulesInfoTitle.textContent = ruleset.name;
  rulesDescription.innerHTML = ruleset.description;
}

// Drawing Functions
function draw() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  const cellW = width / COLS;
  const cellH = height / ROWS;

  const currentRuleset = RULESETS[rulesetSelect.value];
  const colors = currentRuleset.states.reduce((acc, curr) => {
    acc[curr.value] = curr.color;
    return acc;
  }, {});

  // Draw Grid Cells
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const state = currentGrid[r][c];
      ctx.fillStyle = colors[state] || '#0b0c10';
      ctx.fillRect(c * cellW, r * cellH, cellW - 0.5, cellH - 0.5);
    }
  }

  // Draw subtle grid overlay if zoomed in
  if (scale > 1.5) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let c = 0; c <= COLS; c++) {
      ctx.moveTo(c * cellW, 0);
      ctx.lineTo(c * cellW, ROWS * cellH);
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.moveTo(0, r * cellH);
      ctx.lineTo(COLS * cellW, r * cellH);
    }
    ctx.stroke();
  }

  ctx.restore();
}

// Telemetry & Stats Processing
function updateTelemetry() {
  const ruleset = RULESETS[rulesetSelect.value];
  const frequencies = {};
  ruleset.states.forEach((s) => {
    frequencies[s.value] = 0;
  });

  let activeCount = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const state = currentGrid[r][c];
      if (frequencies[state] !== undefined) {
        frequencies[state]++;
      }
      if (state !== 0) {
        activeCount++;
      }
    }
  }

  // Update DOM displays
  genCountEl.textContent = generation;
  activeCountEl.textContent = activeCount;

  // Render State Frequencies
  stateFrequenciesEl.innerHTML = '';
  ruleset.states.forEach((s) => {
    const count = frequencies[s.value];
    const pct = ((count / (COLS * ROWS)) * 100).toFixed(1);

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.justifyContent = 'space-between';
    row.innerHTML = `
      <span style="display: flex; align-items: center;">
        <span class="state-indicator" style="background-color: ${s.color};"></span>
        ${s.label}
      </span>
      <span style="font-family: 'Fira Code', monospace; color: var(--text-primary);">${count} (${pct}%)</span>
    `;
    stateFrequenciesEl.appendChild(row);
  });

  // Track history
  populationHistory.push(activeCount);
  if (populationHistory.length > maxHistoryLength) {
    populationHistory.shift();
  }

  drawTelemetryChart();
}

function drawTelemetryChart() {
  if (!telemetryCanvas || !telemetryCtx) return;

  const width = telemetryCanvas.width;
  const height = telemetryCanvas.height;

  telemetryCtx.clearRect(0, 0, width, height);

  // Background grid lines
  telemetryCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  telemetryCtx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = (height / 4) * i;
    telemetryCtx.beginPath();
    telemetryCtx.moveTo(0, y);
    telemetryCtx.lineTo(width, y);
    telemetryCtx.stroke();
  }

  if (populationHistory.length < 2) return;

  const maxVal = Math.max(...populationHistory, 100); // base min height of scale
  const minVal = 0;
  const range = maxVal - minVal;

  telemetryCtx.strokeStyle = 'var(--accent)';
  telemetryCtx.lineWidth = 2;
  telemetryCtx.beginPath();

  for (let i = 0; i < populationHistory.length; i++) {
    const x = (i / (maxHistoryLength - 1)) * width;
    const normY = (populationHistory[i] - minVal) / range;
    const y = height - normY * (height - 10) - 5; // keep margins

    if (i === 0) {
      telemetryCtx.moveTo(x, y);
    } else {
      telemetryCtx.lineTo(x, y);
    }
  }
  telemetryCtx.stroke();

  // Create gradient area fill
  telemetryCtx.lineTo(((populationHistory.length - 1) / (maxHistoryLength - 1)) * width, height);
  telemetryCtx.lineTo(0, height);
  telemetryCtx.closePath();
  const grad = telemetryCtx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, 'rgba(102, 252, 241, 0.2)');
  grad.addColorStop(1, 'rgba(102, 252, 241, 0)');
  telemetryCtx.fillStyle = grad;
  telemetryCtx.fill();
}

// Click to Draw & Interaction handlers
function getCellFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.clientX - rect.left;
  const clientY = e.clientY - rect.top;

  // Convert to viewport coords
  const viewX = (clientX - offsetX) / scale;
  const viewY = (clientY - offsetY) / scale;

  const cellW = canvas.clientWidth / COLS;
  const cellH = canvas.clientHeight / ROWS;

  const col = Math.floor(viewX / cellW);
  const row = Math.floor(viewY / cellH);

  return { row, col };
}

let isDrawing = false;

function handleDraw(e) {
  const { row, col } = getCellFromEvent(e);
  if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
    const brushSize = parseInt(brushSizeRange.value, 10);
    const targetState = parseInt(drawStateSelect.value, 10);

    for (
      let rOffset = -Math.floor(brushSize / 2);
      rOffset <= Math.floor(brushSize / 2);
      rOffset++
    ) {
      for (
        let cOffset = -Math.floor(brushSize / 2);
        cOffset <= Math.floor(brushSize / 2);
        cOffset++
      ) {
        const targetR = row + rOffset;
        const targetC = col + cOffset;
        if (targetR >= 0 && targetR < ROWS && targetC >= 0 && targetC < COLS) {
          currentGrid[targetR][targetC] = targetState;
        }
      }
    }
    physicsWorker.postMessage({ type: 'UPDATE_GRID', grid: currentGrid });
    draw();
    updateTelemetry();
  }
}

canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    // Left click: draw
    isDrawing = true;
    handleDraw(e);
  } else if (e.button === 1 || e.button === 2 || e.shiftKey) {
    // Middle, Right, or Shift+Left: pan
    isPanning = true;
    startPanX = e.clientX - offsetX;
    startPanY = e.clientY - offsetY;
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (isDrawing) {
    handleDraw(e);
  } else if (isPanning) {
    offsetX = e.clientX - startPanX;
    offsetY = e.clientY - startPanY;
    draw();
  }
});

window.addEventListener('mouseup', () => {
  isDrawing = false;
  isPanning = false;
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = 1.1;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Position relative to zoom origin
  const viewX = (mouseX - offsetX) / scale;
  const viewY = (mouseY - offsetY) / scale;

  if (e.deltaY < 0) {
    scale = Math.min(scale * zoomFactor, 10);
  } else {
    scale = Math.max(scale / zoomFactor, 0.5);
  }

  offsetX = mouseX - viewX * scale;
  offsetY = mouseY - viewY * scale;

  draw();
});

// Presets Loading
function loadPreset(presetName) {
  currentGrid = createGrid();
  generation = 0;
  populationHistory = [];

  const midR = Math.floor(ROWS / 2);
  const midC = Math.floor(COLS / 2);

  if (presetName === 'random') {
    const ruleset = rulesetSelect.value;
    const states = RULESETS[ruleset].states.map((s) => s.value);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        // Randomly select state (heavy weight on empty/0)
        currentGrid[r][c] =
          Math.random() < 0.25 ? states[Math.floor(Math.random() * (states.length - 1)) + 1] : 0;
      }
    }
  } else if (presetName === 'glider') {
    // Conway glider
    currentGrid[midR - 1][midC] = 1;
    currentGrid[midR][midC + 1] = 1;
    currentGrid[midR + 1][midC - 1] = 1;
    currentGrid[midR + 1][midC] = 1;
    currentGrid[midR + 1][midC + 1] = 1;
  } else if (presetName === 'gosper') {
    // Gosper Glider Gun (translated to fit gracefully)
    const pattern = [
      [5, 1],
      [5, 2],
      [6, 1],
      [6, 2],
      [5, 11],
      [6, 11],
      [7, 11],
      [4, 12],
      [8, 12],
      [3, 13],
      [9, 13],
      [3, 14],
      [9, 14],
      [6, 15],
      [4, 16],
      [8, 16],
      [5, 17],
      [6, 17],
      [7, 17],
      [6, 18],
      [3, 21],
      [4, 21],
      [5, 21],
      [3, 22],
      [4, 22],
      [5, 22],
      [2, 23],
      [6, 23],
      [1, 25],
      [2, 25],
      [6, 25],
      [7, 25],
      [3, 35],
      [4, 35],
      [3, 36],
      [4, 36],
    ];
    pattern.forEach(([r, c]) => {
      const targetR = r + 10;
      const targetC = c + 10;
      if (targetR < ROWS && targetC < COLS) {
        currentGrid[targetR][targetC] = 1;
      }
    });
  } else if (presetName === 'wireworldClock') {
    // Wireworld loop generator clock
    // Conductor loop:
    const loop = [
      [0, 2],
      [0, 3],
      [0, 4],
      [0, 5],
      [0, 6],
      [0, 7],
      [1, 1],
      [1, 8],
      [2, 0],
      [2, 9],
      [3, 0],
      [3, 9],
      [4, 1],
      [4, 8],
      [5, 2],
      [5, 3],
      [5, 4],
      [5, 5],
      [5, 6],
      [5, 7],
    ];
    loop.forEach(([r, c]) => {
      currentGrid[midR - 3 + r][midC - 5 + c] = 3; // conductor
    });
    // Add an electron propagating
    currentGrid[midR - 3 + 1][midC - 5 + 1] = 1; // head
    currentGrid[midR - 3 + 0][midC - 5 + 2] = 2; // tail
  }

  draw();
  updateTelemetry();
  
  physicsWorker.postMessage({ 
    type: 'INIT', 
    grid: currentGrid, 
    generation: 0, 
    ruleset: rulesetSelect.value 
  });
}

// Simulation Control
function tick() {
  physicsWorker.postMessage({ type: 'STEP' });
}

// Event Listeners for controls
rulesetSelect.addEventListener('change', () => {
  updateDrawStateDropdown();
  updateRulesInfo();
  // Clear telemetry history and reset when switching rulesets
  currentGrid = createGrid();
  generation = 0;
  populationHistory = [];
  updateTelemetry();
  draw();
  
  physicsWorker.postMessage({ 
    type: 'INIT', 
    grid: currentGrid, 
    generation: 0, 
    ruleset: rulesetSelect.value 
  });
});

speedRange.addEventListener('input', () => {
  speedDisplay.textContent = speedRange.value;
  physicsWorker.postMessage({ type: 'UPDATE_SPEED', fps: parseInt(speedRange.value, 10) });
});

brushSizeRange.addEventListener('input', () => {
  brushDisplay.textContent = brushSizeRange.value;
});

presetSelect.addEventListener('change', () => {
  if (presetSelect.value) {
    loadPreset(presetSelect.value);
    presetSelect.value = ''; // reset after selection
  }
});

startBtn.addEventListener('click', () => {
  if (!isPlaying) {
    isPlaying = true;
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    physicsWorker.postMessage({ type: 'START', fps: parseInt(speedRange.value, 10) });
  }
});

pauseBtn.addEventListener('click', () => {
  if (isPlaying) {
    isPlaying = false;
    pauseBtn.style.display = 'none';
    startBtn.style.display = 'inline-block';
    physicsWorker.postMessage({ type: 'STOP' });
  }
});

stepBtn.addEventListener('click', () => {
  if (!isPlaying) {
    tick();
  }
});

clearBtn.addEventListener('click', () => {
  isPlaying = false;
  pauseBtn.style.display = 'none';
  startBtn.style.display = 'inline-block';
  currentGrid = createGrid();
  generation = 0;
  populationHistory = [];
  updateTelemetry();
  draw();
  physicsWorker.postMessage({ type: 'STOP' });
  physicsWorker.postMessage({ type: 'INIT', grid: currentGrid, generation: 0, ruleset: rulesetSelect.value });
});

// Setup on load
window.addEventListener('resize', resizeCanvas);

// Init call
updateDrawStateDropdown();
updateRulesInfo();
resizeCanvas();
updateTelemetry();
physicsWorker.postMessage({ 
  type: 'INIT', 
  grid: currentGrid, 
  generation: 0, 
  ruleset: rulesetSelect.value 
});
