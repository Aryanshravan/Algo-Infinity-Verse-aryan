/* ============================================================
   Mini Interactive Pathfinding Demo — Homepage
   Self-contained BFS pathfinding on a small grid
   ============================================================ */

(function () {
  'use strict';

  const ROWS = 14;
  const COLS = 22;
  let grid = [];
  let start = { r: 2, c: 2 };
  let target = { r: 11, c: 19 };
  let isRunning = false;

  function init() {
    const container = document.getElementById('hpMiniGrid');
    if (!container) return;
    buildGrid(container);
    const vizBtn = document.getElementById('hpVizRun');
    const resetBtn = document.getElementById('hpVizReset');
    if (vizBtn) vizBtn.addEventListener('click', runBFS);
    if (resetBtn) resetBtn.addEventListener('click', resetGrid);
  }

  function buildGrid(container) {
    container.innerHTML = '';
    container.style.setProperty('--cols', COLS);
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'hp-mini-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;

        if (r === start.r && c === start.c) {
          cell.classList.add('hp-mini-start');
        } else if (r === target.r && c === target.c) {
          cell.classList.add('hp-mini-target');
        }

        cell.addEventListener('click', () => toggleWall(r, c));
        container.appendChild(cell);
      }
    }
  }

  function toggleWall(r, c) {
    if (isRunning) return;
    if ((r === start.r && c === start.c) || (r === target.r && c === target.c)) return;

    const cell = getCell(r, c);
    if (!cell) return;

    if (grid[r][c] === 1) {
      grid[r][c] = 0;
      cell.classList.remove('hp-mini-wall');
    } else {
      grid[r][c] = 1;
      cell.classList.add('hp-mini-wall');
      cell.classList.remove('hp-mini-visited', 'hp-mini-path');
    }
  }

  function getCell(r, c) {
    return document.querySelector(`.hp-mini-cell[data-r="${r}"][data-c="${c}"]`);
  }

  function runBFS() {
    if (isRunning) return;
    clearPath();
    isRunning = true;

    const parent = {};
    const visited = new Set();
    const queue = [start];
    const key = (r, c) => `${r},${c}`;
    visited.add(key(start.r, start.c));
    let found = false;

    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    while (queue.length > 0) {
      const curr = queue.shift();
      if (curr.r === target.r && curr.c === target.c) {
        found = true;
        break;
      }
      for (const [dr, dc] of directions) {
        const nr = curr.r + dr;
        const nc = curr.c + dc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        if (grid[nr][nc] === 1) continue;
        const k = key(nr, nc);
        if (visited.has(k)) continue;
        visited.add(k);
        parent[k] = curr;
        queue.push({ r: nr, c: nc });
      }
    }

    // Animate visited nodes
    const visitedOrder = Array.from(visited)
      .filter(k => k !== key(start.r, start.c) && k !== key(target.r, target.c))
      .map(k => {
        const [r, c] = k.split(',').map(Number);
        return { r, c };
      });

    const delay = 20;
    visitedOrder.forEach((node, i) => {
      setTimeout(() => {
        const cell = getCell(node.r, node.c);
        if (cell && !cell.classList.contains('hp-mini-wall')) {
          cell.classList.add('hp-mini-visited');
        }
      }, delay * i);
    });

    // Animate path after visited
    const pathDelay = delay * visitedOrder.length + 100;
    if (found) {
      const path = [];
      let cur = target;
      while (cur.r !== start.r || cur.c !== start.c) {
        path.push(cur);
        const k = key(cur.r, cur.c);
        if (!parent[k]) break;
        cur = parent[k];
      }
      path.reverse();

      path.forEach((node, i) => {
        setTimeout(() => {
          const cell = getCell(node.r, node.c);
          if (cell && (node.r !== start.r || node.c !== start.c) && (node.r !== target.r || node.c !== target.c)) {
            cell.classList.add('hp-mini-path');
          }
        }, pathDelay + delay * i);
      });

      setTimeout(() => {
        const pathLenEl = document.getElementById('hpVizPathLen');
        if (pathLenEl) {
          pathLenEl.textContent = `Path: ${path.length} cells`;
          pathLenEl.style.opacity = '1';
        }
      }, pathDelay + delay * path.length);
    } else {
      setTimeout(() => {
        const pathLenEl = document.getElementById('hpVizPathLen');
        if (pathLenEl) {
          pathLenEl.textContent = 'No path found!';
          pathLenEl.style.opacity = '1';
        }
      }, pathDelay);
    }

    // Re-enable after animation completes
    const totalDuration = pathDelay + delay * (found ? visitedOrder.length + ROWS + COLS : visitedOrder.length) + 200;
    setTimeout(() => {
      isRunning = false;
    }, totalDuration);
  }

  function clearPath() {
    document.querySelectorAll('.hp-mini-visited, .hp-mini-path').forEach(el => {
      el.classList.remove('hp-mini-visited', 'hp-mini-path');
    });
    const pathLenEl = document.getElementById('hpVizPathLen');
    if (pathLenEl) pathLenEl.style.opacity = '0';
  }

  function resetGrid() {
    isRunning = false;
    clearPath();
    document.querySelectorAll('.hp-mini-wall').forEach(el => {
      el.classList.remove('hp-mini-wall');
    });
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
