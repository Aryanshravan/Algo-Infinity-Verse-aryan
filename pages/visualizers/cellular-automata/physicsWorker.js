// physicsWorker.js

let COLS = 80;
let ROWS = 50;

let currentGrid = [];
let isPlaying = false;
let rulesetName = 'conway';
let fps = 10;
let intervalId = null;
let generation = 0;

// Helper Functions
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

// Rulesets Computation
const RULESETS_LOGIC = {
  conway: (grid) => {
    const next = createGrid();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const neighbors = countNeighbors(grid, r, c, 1);
        const state = grid[r][c];
        if (state === 1) {
          next[r][c] = neighbors === 2 || neighbors === 3 ? 1 : 0;
        } else {
          next[r][c] = neighbors === 3 ? 1 : 0;
        }
      }
    }
    return next;
  },
  wireworld: (grid) => {
    const next = createGrid();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const state = grid[r][c];
        if (state === 0) {
          next[r][c] = 0;
        } else if (state === 1) {
          next[r][c] = 2; // Head to Tail
        } else if (state === 2) {
          next[r][c] = 3; // Tail to Conductor
        } else if (state === 3) {
          const heads = countNeighbors(grid, r, c, 1);
          next[r][c] = heads === 1 || heads === 2 ? 1 : 3;
        }
      }
    }
    return next;
  },
  briansBrain: (grid) => {
    const next = createGrid();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const state = grid[r][c];
        if (state === 1) {
          next[r][c] = 2; // On to Dying
        } else if (state === 2) {
          next[r][c] = 0; // Dying to Off
        } else if (state === 0) {
          const activeNeighbors = countNeighbors(grid, r, c, 1);
          next[r][c] = activeNeighbors === 2 ? 1 : 0;
        }
      }
    }
    return next;
  }
};

function tick() {
  const stepFn = RULESETS_LOGIC[rulesetName];
  if (!stepFn) return;
  
  currentGrid = stepFn(currentGrid);
  generation++;
  
  postMessage({
    type: 'TICK',
    grid: currentGrid,
    generation: generation
  });
}

function startLoop() {
  if (intervalId) clearInterval(intervalId);
  const intervalMs = 1000 / fps;
  intervalId = setInterval(tick, intervalMs);
}

function stopLoop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

self.onmessage = function(e) {
  const data = e.data;
  
  switch(data.type) {
    case 'INIT':
      currentGrid = data.grid;
      generation = data.generation || 0;
      rulesetName = data.ruleset || 'conway';
      ROWS = data.rows || 50;
      COLS = data.cols || 80;
      break;
      
    case 'START':
      fps = data.fps || 10;
      isPlaying = true;
      startLoop();
      break;
      
    case 'STOP':
      isPlaying = false;
      stopLoop();
      break;
      
    case 'STEP':
      tick();
      break;
      
    case 'UPDATE_SPEED':
      fps = data.fps;
      if (isPlaying) {
        startLoop();
      }
      break;
      
    case 'UPDATE_GRID':
      currentGrid = data.grid;
      break;
      
    case 'CHANGE_RULESET':
      rulesetName = data.ruleset;
      break;
  }
};
