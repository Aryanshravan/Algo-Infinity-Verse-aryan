document.addEventListener('DOMContentLoaded', () => {
  window.mazePathfindingArena = new MazePathfindingArena();
});

class MazePathfindingArena {
  constructor() {
    this.cacheDOM();
    this.init();
  }

  cacheDOM() {
    this.dom = {
      mazeGrid: document.getElementById('mazeGrid'),

      mazeGeneratorSelector: document.getElementById('mazeGeneratorSelector'),
      gridSizeSelector: document.getElementById('gridSizeSelector'),
      speedSlider: document.getElementById('speedSlider'),
      speedDisplay: document.getElementById('speedDisplay'),

      btnGenerateMaze: document.getElementById('btnGenerateMaze'),
      btnStartRace: document.getElementById('btnStartRace'),
      btnPause: document.getElementById('btnPause'),
      btnClearPaths: document.getElementById('btnClearPaths'),

      toolStart: document.getElementById('toolStart'),
      toolTarget: document.getElementById('toolTarget'),

      algoSelectLeft: document.getElementById('algoSelectLeft'),
      algoSelectRight: document.getElementById('algoSelectRight'),

      hudLeftNodes: document.getElementById('hudLeftNodes'),
      hudLeftPathLen: document.getElementById('hudLeftPathLen'),
      hudLeftPathCost: document.getElementById('hudLeftPathCost'),
      hudLeftTime: document.getElementById('hudLeftTime'),
      hudLeftEff: document.getElementById('hudLeftEff'),

      hudRightPathLen: document.getElementById('hudRightPathLen'),
      hudRightPathCost: document.getElementById('hudRightPathCost'),
      hudRightTime: document.getElementById('hudRightTime'),
      hudRightEff: document.getElementById('hudRightEff'),

      hudMazeTime: document.getElementById('hudMazeTime'),

      statusIcon: document.getElementById('statusIcon'),
      statusMsg: document.getElementById('statusMsg'),
    };
  }

  init() {
    this.rows = parseInt(this.dom.gridSizeSelector.value, 10);
    this.cols = this.rows;

    this.speed = parseInt(this.dom.speedSlider.value, 10);
    this.activeTool = 'start';

    this.isPaused = false;
    this.isAnimatingMaze = false;
    this.isAnimatingPaths = false;

    this.speedStepsPerFrame = () => {
      // Higher speed -> more steps per frame
      // Range: 1..5
      return this.speed * 2; // 2..10
    };

    // grid data
    this.isWall = null; // boolean[]
    this.startNode = { r: Math.floor(this.rows / 2), c: 2 };
    this.targetNode = { r: Math.floor(this.rows / 2), c: this.cols - 3 };

    // path animation
    this.left = null; // {visited,path,frontierIndex,idx,...}
    this.right = null;
    this.animationFrameId = null;

    this.generationTimeline = [];
    this.genAnimIndex = 0;
    this.genMazeStartTime = 0;

    this.bindEvents();
    this.rebuildGrid();
    this.resetToEmptyMaze();
  }

  bindEvents() {
    const toolBtns = [this.dom.toolStart, this.dom.toolTarget];
    toolBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        toolBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTool = btn.getAttribute('data-tool');
      });
    });

    this.dom.gridSizeSelector.addEventListener('change', (e) => {
      this.rows = parseInt(e.target.value, 10);
      this.cols = this.rows;
      this.startNode = { r: Math.floor(this.rows / 2), c: 2 };
      this.targetNode = { r: Math.floor(this.rows / 2), c: this.cols - 3 };
      this.clearPathsOnly();
      this.rebuildGrid();
      this.resetToEmptyMaze();
      this.setStatus('Grid reset. Generate a new maze.', '▶');
    });

    this.dom.speedSlider.addEventListener('input', (e) => {
      this.speed = parseInt(e.target.value, 10);
      this.dom.speedDisplay.textContent = `${this.speed}x`;
    });

    this.dom.btnGenerateMaze.addEventListener('click', () => this.generateAndAnimateMaze());
    this.dom.btnStartRace.addEventListener('click', () => this.startRace());
    this.dom.btnPause.addEventListener('click', () => this.togglePause());
    this.dom.btnClearPaths.addEventListener('click', () => this.clearPathsOnly());

    // Click maze to move start/target when idle
    this.dom.mazeGrid.addEventListener('click', (e) => {
      const cell = e.target.closest('.mpa-cell');
      if (!cell) return;
      if (this.isAnimatingMaze || this.isAnimatingPaths) return;

      const r = parseInt(cell.getAttribute('data-row'), 10);
      const c = parseInt(cell.getAttribute('data-col'), 10);

      if (r === this.targetNode.r && c === this.targetNode.c) return;
      if (this.activeTool === 'start') {
        this.startNode = { r, c };
      } else {
        if (r === this.startNode.r && c === this.startNode.c) return;
        this.targetNode = { r, c };
      }
      // Ensure start/target are open (not walls)
      this.setWall(r, c, false);
      this.renderMazeStatic();
      this.clearPathsOnly();
    });

    window.addEventListener('resize', () => {
      // no-op: grid uses aspect-ratio
    });
  }

  rebuildGrid() {
    this.dom.mazeGrid.innerHTML = '';
    this.dom.mazeGrid.style.setProperty('--grid-cols', this.cols);
    this.dom.mazeGrid.style.setProperty('--grid-rows', this.rows);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'mpa-cell';
        cell.setAttribute('data-row', r);
        cell.setAttribute('data-col', c);
        this.dom.mazeGrid.appendChild(cell);
      }
    }
  }

  idx(r, c) {
    return r * this.cols + c;
  }

  setWall(r, c, val) {
    this.isWall[this.idx(r, c)] = !!val;
  }

  getWall(r, c) {
    return !!this.isWall[this.idx(r, c)];
  }

  resetToEmptyMaze() {
    // default: open grid (no walls)
    this.isWall = new Array(this.rows * this.cols).fill(false);
    // keep start/target open
    this.setWall(this.startNode.r, this.startNode.c, false);
    this.setWall(this.targetNode.r, this.targetNode.c, false);
    this.renderMazeStatic();
    this.resetMetrics();
    this.setStatus('Idle. Generate a maze to begin.', '▶');
  }

  renderMazeStatic() {
    const cells = this.dom.mazeGrid.querySelectorAll('.mpa-cell');
    cells.forEach((cell) => {
      const r = parseInt(cell.getAttribute('data-row'), 10);
      const c = parseInt(cell.getAttribute('data-col'), 10);
      cell.classList.remove(
        'wall',
        'visited-left',
        'visited-right',
        'frontier-left',
        'frontier-right',
        'path-left',
        'path-right',
        'p-step'
      );

      if (r === this.startNode.r && c === this.startNode.c) {
        cell.classList.add('start');
        return;
      }
      if (r === this.targetNode.r && c === this.targetNode.c) {
        cell.classList.add('target');
        return;
      }
      cell.classList.remove('start', 'target');
      if (this.getWall(r, c)) {
        cell.classList.add('wall');
      }
    });
  }

  resetMetrics() {
    this.dom.hudLeftNodes.textContent = '0';
    this.dom.hudLeftPathLen.textContent = '—';
    this.dom.hudLeftPathCost.textContent = '—';
    this.dom.hudLeftTime.textContent = '—';
    this.dom.hudLeftEff.textContent = '—';
    this.dom.hudLeftPathCost.parentElement.classList.remove('mpa-winner', 'mpa-tie', 'mpa-loser');

    this.dom.hudRightNodes.textContent = '0';
    this.dom.hudRightPathLen.textContent = '—';
    this.dom.hudRightPathCost.textContent = '—';
    this.dom.hudRightTime.textContent = '—';
    this.dom.hudRightEff.textContent = '—';
    this.dom.hudRightPathCost.parentElement.classList.remove('mpa-winner', 'mpa-tie', 'mpa-loser');

    this.dom.hudMazeTime.textContent = '—';
  }

  clearPathsOnly() {
    if (this.isAnimatingPaths) {
      this.isAnimatingPaths = false;
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    }
    this.isAnimatingPaths = false;
    this.isPaused = false;
    if (this.dom.btnPause) {
      this.dom.btnPause.innerHTML = `<i class="fas fa-pause"></i> Pause`;
    }

    this.left = null;
    this.right = null;

    // remove dynamic classes, keep maze
    const cells = this.dom.mazeGrid.querySelectorAll('.mpa-cell');
    cells.forEach((cell) => {
      cell.classList.remove(
        'visited-left',
        'visited-right',
        'frontier-left',
        'frontier-right',
        'path-left',
        'path-right'
      );
    });

    this.resetMetrics();
    this.setStatus('Idle. Maze ready. Start Race when you want.', '▶');
  }

  setStatus(msg, icon) {
    if (this.dom.statusIcon) this.dom.statusIcon.textContent = icon || '▶';
    if (this.dom.statusMsg) this.dom.statusMsg.textContent = msg;
  }

  togglePause() {
    if (!this.isAnimatingMaze && !this.isAnimatingPaths) return;
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.dom.btnPause.innerHTML = `<i class="fas fa-play"></i> Resume`;
      this.setStatus('Paused', '⏸');
    } else {
      this.dom.btnPause.innerHTML = `<i class="fas fa-pause"></i> Pause`;
      this.setStatus('Resumed', '▶');
      if (this.isAnimatingMaze)
        this.animationFrameId = requestAnimationFrame(() => this.playMazeAnimation());
      if (this.isAnimatingPaths)
        this.animationFrameId = requestAnimationFrame(() => this.playPathAnimation());
    }
  }

  // ============================
  // Maze Generators
  // ============================
  generateAndAnimateMaze() {
    if (this.isAnimatingMaze) return;
    this.isAnimatingMaze = true;
    this.isAnimatingPaths = false;
    this.isPaused = false;
    this.dom.btnPause.innerHTML = `<i class="fas fa-pause"></i> Pause`;

    this.clearPathsOnly();

    // initialize wall grid
    this.isWall = new Array(this.rows * this.cols).fill(true);

    // start/target should be open
    this.setWall(this.startNode.r, this.startNode.c, false);
    this.setWall(this.targetNode.r, this.targetNode.c, false);

    const genType = this.dom.mazeGeneratorSelector.value;

    this.generationTimeline = [];
    this.genAnimIndex = 0;
    this.genMazeStartTime = performance.now();

    // Build timeline (may be large; still okay for 25x25)
    this.buildMazeTimeline(genType);

    // Render initial wall state (all walls)
    this.renderMazeStatic();

    this.setStatus('Generating maze…', '⏳');
    this.animationFrameId = requestAnimationFrame(() => this.playMazeAnimation());
  }

  buildMazeTimeline(type) {
    const tl = [];
    const pushCell = (r, c, isWall) => {
      // don't repeatedly push start/target changes
      if (
        (r === this.startNode.r && c === this.startNode.c) ||
        (r === this.targetNode.r && c === this.targetNode.c)
      ) {
        isWall = false;
      }
      tl.push({ r, c, isWall });
    };

    const inBounds = (r, c) => r >= 0 && r < this.rows && c >= 0 && c < this.cols;

    // Helpers: operate on "odd-cell" carving grids for tree-based algorithms
    const isCarvable = (r, c) =>
      r > 0 && c > 0 && r < this.rows - 1 && c < this.cols - 1 && r % 2 === 1 && c % 2 === 1;

    // Timeline output strategy:
    // for carving algorithms: start from all walls and open corridors gradually
    // for recursive division: build walls gradually on a region

    if (type === 'recursive-backtracking') {
      // Carve using DFS on odd cells
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) pushCell(r, c, true);
      }

      const startCandidates = [];
      for (let r = 1; r < this.rows - 1; r += 2) {
        for (let c = 1; c < this.cols - 1; c += 2) {
          if (isCarvable(r, c)) startCandidates.push({ r, c });
        }
      }

      const start = startCandidates[Math.floor(Math.random() * startCandidates.length)] || {
        r: 1,
        c: 1,
      };

      const visited = new Set();
      const stack = [start];

      visited.add(`${start.r},${start.c}`);
      // open starting cell
      pushCell(start.r, start.c, false);

      const dirs = [
        [-2, 0],
        [2, 0],
        [0, -2],
        [0, 2],
      ];

      while (stack.length) {
        const curr = stack[stack.length - 1];
        // find unvisited neighbors
        const neighbors = [];
        for (const [dr, dc] of dirs) {
          const nr = curr.r + dr;
          const nc = curr.c + dc;
          if (inBounds(nr, nc) && isCarvable(nr, nc) && !visited.has(`${nr},${nc}`)) {
            neighbors.push({ nr, nc, midR: curr.r + dr / 2, midC: curr.c + dc / 2 });
          }
        }

        if (!neighbors.length) {
          stack.pop();
          continue;
        }

        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        // carve corridor
        pushCell(next.midR, next.midC, false);
        pushCell(next.nr, next.nc, false);
        visited.add(`${next.nr},${next.nc}`);
        stack.push({ r: next.nr, c: next.nc });
      }

      this.generationTimeline = tl;
      return;
    }

    if (type === 'prim') {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) pushCell(r, c, true);
      }

      const startCandidates = [];
      for (let r = 1; r < this.rows - 1; r += 2) {
        for (let c = 1; c < this.cols - 1; c += 2) {
          if (isCarvable(r, c)) startCandidates.push({ r, c });
        }
      }
      const start = startCandidates[Math.floor(Math.random() * startCandidates.length)] || {
        r: 1,
        c: 1,
      };

      const visited = new Set([`${start.r},${start.c}`]);
      pushCell(start.r, start.c, false);

      const walls = []; // edges between visited cell and unvisited cell
      const addWallsFrom = (r, c) => {
        const dirs = [
          [-2, 0],
          [2, 0],
          [0, -2],
          [0, 2],
        ];
        for (const [dr, dc] of dirs) {
          const nr = r + dr;
          const nc = c + dc;
          if (inBounds(nr, nc) && isCarvable(nr, nc) && !visited.has(`${nr},${nc}`)) {
            walls.push({ aR: r, aC: c, bR: nr, bC: nc, midR: r + dr / 2, midC: c + dc / 2 });
          }
        }
      };

      addWallsFrom(start.r, start.c);

      while (walls.length) {
        const edgeIndex = Math.floor(Math.random() * walls.length);
        const edge = walls.splice(edgeIndex, 1)[0];
        if (visited.has(`${edge.bR},${edge.bC}`)) continue;

        // carve
        pushCell(edge.midR, edge.midC, false);
        pushCell(edge.bR, edge.bC, false);
        visited.add(`${edge.bR},${edge.bC}`);

        addWallsFrom(edge.bR, edge.bC);
      }

      this.generationTimeline = tl;
      return;
    }

    if (type === 'kruskal') {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) pushCell(r, c, true);
      }

      const parent = {};
      const find = (x) => {
        if (parent[x] !== x) parent[x] = find(parent[x]);
        return parent[x];
      };
      const union = (a, b) => {
        const ra = find(a);
        const rb = find(b);
        if (ra !== rb) parent[rb] = ra;
      };

      const cells = [];
      for (let r = 1; r < this.rows - 1; r += 2) {
        for (let c = 1; c < this.cols - 1; c += 2) {
          if (isCarvable(r, c)) {
            const key = `${r},${c}`;
            parent[key] = key;
            cells.push({ r, c, key });
            pushCell(r, c, false);
          }
        }
      }

      const edges = [];
      // connect odd cells with adjacency (right/down)
      for (const cell of cells) {
        const dirs = [
          [0, 2],
          [2, 0],
        ];
        for (const [dr, dc] of dirs) {
          const nr = cell.r + dr;
          const nc = cell.c + dc;
          if (inBounds(nr, nc) && isCarvable(nr, nc)) {
            edges.push({
              a: cell.key,
              b: `${nr},${nc}`,
              midR: cell.r + dr / 2,
              midC: cell.c + dc / 2,
            });
          }
        }
      }

      // shuffle edges
      for (let i = edges.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [edges[i], edges[j]] = [edges[j], edges[i]];
      }

      for (const e of edges) {
        if (find(e.a) !== find(e.b)) {
          union(e.a, e.b);
          pushCell(e.midR, e.midC, false);
        }
      }

      this.generationTimeline = tl;
      return;
    }

    if (type === 'recursive-division') {
      // Start with all walls; open regions by drawing walls with gaps.
      // We will represent "walls" as blocked cells.
      // Strategy:
      // - Begin by opening the whole grid.
      // - Then draw division walls back in with gaps.

      // Open everything first
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) pushCell(r, c, false);
      }

      // Ensure outer border is walls
      for (let r = 0; r < this.rows; r++) {
        pushCell(r, 0, true);
        pushCell(r, this.cols - 1, true);
      }
      for (let c = 0; c < this.cols; c++) {
        pushCell(0, c, true);
        pushCell(this.rows - 1, c, true);
      }

      const minW = 2; // region width in cells
      const minH = 2;

      const divide = (x, y, w, h, orientation) => {
        // x,y are top-left (cell coordinates), w,h are region size
        if (w < minW || h < minH) return;

        // If no fixed orientation provided, choose based on region shape
        let ori = orientation;
        if (!ori) {
          ori = w < h ? 'H' : 'V';
        }

        if (ori === 'H') {
          // divide with horizontal wall
          // choose wall row and gap column
          const wallRow = y + Math.floor(h / 2);
          const gapCol = x + Math.floor(Math.random() * w);

          // draw wall across region
          for (let c = x; c < x + w; c++) {
            if (c === gapCol) continue;
            pushCell(wallRow, c, true);
          }

          // recurse above and below
          divide(x, y, w, wallRow - y, ori === 'H' ? 'V' : null);
          divide(x, wallRow + 1, w, y + h - (wallRow + 1), ori === 'H' ? 'V' : null);
        } else {
          // divide with vertical wall
          const wallCol = x + Math.floor(w / 2);
          const gapRow = y + Math.floor(Math.random() * h);

          for (let r = y; r < y + h; r++) {
            if (r === gapRow) continue;
            pushCell(r, wallCol, true);
          }

          divide(x, y, wallCol - x, h, ori === 'V' ? 'H' : null);
          divide(wallCol + 1, y, x + w - (wallCol + 1), h, ori === 'V' ? 'H' : null);
        }
      };

      // Start division inside the border
      divide(1, 1, this.cols - 2, this.rows - 2, null);

      // Ensure start/target open
      this.setWall(this.startNode.r, this.startNode.c, false);
      this.setWall(this.targetNode.r, this.targetNode.c, false);

      this.generationTimeline = tl;
      return;
    }

    this.generationTimeline = tl;
  }

  playMazeAnimation() {
    if (!this.isAnimatingMaze) return;
    if (this.isPaused) return;

    const steps = this.speedStepsPerFrame();
    for (let k = 0; k < steps && this.genAnimIndex < this.generationTimeline.length; k++) {
      const step = this.generationTimeline[this.genAnimIndex++];
      this.setWall(step.r, step.c, step.isWall);

      const cellEl = this.getCellEl(step.r, step.c);
      if (cellEl) {
        if (step.r === this.startNode.r && step.c === this.startNode.c) {
          cellEl.classList.add('start');
          cellEl.classList.remove('wall');
        } else if (step.r === this.targetNode.r && step.c === this.targetNode.c) {
          cellEl.classList.add('target');
          cellEl.classList.remove('wall');
        } else {
          cellEl.classList.toggle('wall', !!step.isWall);
          cellEl.classList.remove('start', 'target');
        }
      }
    }

    if (this.genAnimIndex >= this.generationTimeline.length) {
      this.isAnimatingMaze = false;
      const elapsed = performance.now() - this.genMazeStartTime;
      this.dom.hudMazeTime.textContent = `${elapsed.toFixed(1)} ms`;
      this.clearPathsOnly();
      this.setStatus('Maze ready. Click Start/Target, then Start Race.', '▶');
      return;
    }

    this.animationFrameId = requestAnimationFrame(() => this.playMazeAnimation());
  }

  getCellEl(r, c) {
    // Faster than querySelector for each cell: we use DOM traversal by attribute.
    // Grid size is small enough.
    return this.dom.mazeGrid.querySelector(`.mpa-cell[data-row="${r}"][data-col="${c}"]`);
  }

  // ============================
  // Pathfinding + animation
  // ============================
  startRace() {
    if (this.isAnimatingMaze || this.isAnimatingPaths) return;

    this.clearPathsOnly();
    this.isAnimatingPaths = true;
    this.isPaused = false;
    this.dom.btnPause.innerHTML = `<i class="fas fa-pause"></i> Pause`;

    const algoL = this.dom.algoSelectLeft.value;
    const algoR = this.dom.algoSelectRight.value;

    const leftRes = this.runPathfinding(algoL, 'left');
    const rightRes = this.runPathfinding(algoR, 'right');

    this.left = {
      algo: algoL,
      visited: leftRes.visited,
      path: leftRes.path,
      frontierWindow: 6,
      visitedIdx: 0,
      isPath: false,
      pathIdx: 0,
      nodesExplored: leftRes.visited.length,
      cost: leftRes.cost,
      execMs: leftRes.execMs,
    };

    this.right = {
      algo: algoR,
      visited: rightRes.visited,
      path: rightRes.path,
      frontierWindow: 6,
      visitedIdx: 0,
      isPath: false,
      pathIdx: 0,
      nodesExplored: rightRes.visited.length,
      cost: rightRes.cost,
      execMs: rightRes.execMs,
    };

    this.setStatus('Racing pathfinding algorithms…', '🏁');
    this.animationFrameId = requestAnimationFrame(() => this.playPathAnimation());
  }

  playPathAnimation() {
    if (!this.isAnimatingPaths) return;
    if (this.isPaused) return;

    const steps = this.speedStepsPerFrame();
    this.animateSide(this.left, 'left', steps);
    this.animateSide(this.right, 'right', steps);

    const leftDone = this.left.isPath && this.left.pathIdx >= this.left.path.length;
    const rightDone = this.right.isPath && this.right.pathIdx >= this.right.path.length;

    if (leftDone && rightDone) {
      this.isAnimatingPaths = false;
      this.setStatus('Race complete.', '✅');
      this.setFinalMetrics();
      return;
    }

    this.animationFrameId = requestAnimationFrame(() => this.playPathAnimation());
  }

  animateSide(side, sideName, steps) {
    if (!side) return;

    const visitedClass = sideName === 'left' ? 'visited-left' : 'visited-right';
    const frontierClass = sideName === 'left' ? 'frontier-left' : 'frontier-right';
    const pathClass = sideName === 'left' ? 'path-left' : 'path-right';

    const isStart = (r, c) => r === this.startNode.r && c === this.startNode.c;
    const isTarget = (r, c) => r === this.targetNode.r && c === this.targetNode.c;

    // Phase 1: animate visited, then switch to path
    if (!side.isPath) {
      for (let i = 0; i < steps && side.visitedIdx < side.visited.length; i++) {
        const node = side.visited[side.visitedIdx++];
        if (!isStart(node.r, node.c) && !isTarget(node.r, node.c)) {
          const el = this.getCellEl(node.r, node.c);
          if (el) {
            el.classList.remove(frontierClass);
            el.classList.add(visitedClass);
          }
        }
      }

      // frontier highlight: show last few visited nodes
      const frontier = side.visited.slice(
        Math.max(0, side.visitedIdx - side.frontierWindow),
        side.visitedIdx
      );
      frontier.forEach((n) => {
        if (isStart(n.r, n.c) || isTarget(n.r, n.c)) return;
        const el = this.getCellEl(n.r, n.c);
        if (el) el.classList.add(frontierClass);
      });

      if (side.visitedIdx >= side.visited.length) {
        side.isPath = true;
        // clear remaining frontier marks
        for (const n of side.visited) {
          const el = this.getCellEl(n.r, n.c);
          if (el) el.classList.remove(frontierClass);
        }
      }

      return;
    }

    // Phase 2: animate path
    for (let i = 0; i < steps && side.pathIdx < side.path.length; i++) {
      const node = side.path[side.pathIdx++];
      if (!isStart(node.r, node.c) && !isTarget(node.r, node.c)) {
        const el = this.getCellEl(node.r, node.c);
        if (el) el.classList.add(pathClass);
      }
    }
  }

  setFinalMetrics() {
    const eff = (pathLen, nodes) => {
      if (!pathLen || pathLen <= 0) return 0;
      if (!nodes || nodes <= 0) return 0;
      return pathLen / nodes;
    };

    let leftCost = null;
    let rightCost = null;

    if (this.left) {
      const pathLen = this.left.path.length;
      leftCost = this.left.cost;
      const nodes = this.left.nodesExplored;
      this.dom.hudLeftNodes.textContent = String(nodes);
      this.dom.hudLeftPathLen.textContent = pathLen ? String(pathLen) : '—';
      this.dom.hudLeftPathCost.textContent = pathLen ? String(leftCost) : '—';
      this.dom.hudLeftTime.textContent = `${this.left.execMs.toFixed(1)} ms`;
      this.dom.hudLeftEff.textContent = pathLen ? eff(pathLen, nodes).toFixed(3) : '0.000';
    }

    if (this.right) {
      const pathLen = this.right.path.length;
      rightCost = this.right.cost;
      const nodes = this.right.nodesExplored;
      this.dom.hudRightNodes.textContent = String(nodes);
      this.dom.hudRightPathLen.textContent = pathLen ? String(pathLen) : '—';
      this.dom.hudRightPathCost.textContent = pathLen ? String(rightCost) : '—';
      this.dom.hudRightTime.textContent = `${this.right.execMs.toFixed(1)} ms`;
      this.dom.hudRightEff.textContent = pathLen ? eff(pathLen, nodes).toFixed(3) : '0.000';
    }

    // Compare paths
    if (leftCost !== null && rightCost !== null && this.left.path.length > 0 && this.right.path.length > 0) {
      if (leftCost < rightCost) {
        this.dom.hudLeftPathCost.parentElement.classList.add('mpa-winner');
        this.dom.hudRightPathCost.parentElement.classList.add('mpa-loser');
      } else if (rightCost < leftCost) {
        this.dom.hudRightPathCost.parentElement.classList.add('mpa-winner');
        this.dom.hudLeftPathCost.parentElement.classList.add('mpa-loser');
      } else {
        this.dom.hudLeftPathCost.parentElement.classList.add('mpa-tie');
        this.dom.hudRightPathCost.parentElement.classList.add('mpa-tie');
      }
    }
  }

  getKey(r, c) {
    return `${r},${c}`;
  }

  getNeighbors(r, c) {
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    const res = [];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) continue;
      if (this.getWall(nr, nc)) continue;
      res.push({ r: nr, c: nc });
    }
    return res;
  }

  heuristic(node) {
    return Math.abs(node.r - this.targetNode.r) + Math.abs(node.c - this.targetNode.c);
  }

  backtrackPath(parent, endNode) {
    const path = [];
    let cur = endNode;
    const maxIter = this.rows * this.cols + 10;
    let i = 0;
    while (cur && i++ < maxIter) {
      path.push(cur);
      if (cur.r === this.startNode.r && cur.c === this.startNode.c) break;
      cur = parent[this.getKey(cur.r, cur.c)];
    }
    path.reverse();
    // if it doesn't start at startNode, path is invalid
    if (!path.length) return [];
    if (!(path[0].r === this.startNode.r && path[0].c === this.startNode.c)) return [];
    return path;
  }

  runPathfinding(algo) {
    const startT = performance.now();

    const parent = {};
    const visited = [];

    const startNode = this.startNode;
    const targetNode = this.targetNode;

    const keyStart = this.getKey(startNode.r, startNode.c);

    let found = false;
    let endNode = null;

    if (algo === 'bfs') {
      const q = [startNode];
      const seen = new Set([keyStart]);
      while (q.length) {
        const cur = q.shift();
        visited.push(cur);
        if (cur.r === targetNode.r && cur.c === targetNode.c) {
          found = true;
          endNode = cur;
          break;
        }
        for (const nb of this.getNeighbors(cur.r, cur.c)) {
          const k = this.getKey(nb.r, nb.c);
          if (seen.has(k)) continue;
          seen.add(k);
          parent[k] = cur;
          q.push(nb);
        }
      }
    } else if (algo === 'dfs') {
      const stack = [startNode];
      const seen = new Set();
      while (stack.length) {
        const cur = stack.pop();
        const k = this.getKey(cur.r, cur.c);
        if (seen.has(k)) continue;
        seen.add(k);
        visited.push(cur);
        if (cur.r === targetNode.r && cur.c === targetNode.c) {
          found = true;
          endNode = cur;
          break;
        }
        for (const nb of this.getNeighbors(cur.r, cur.c)) {
          const nk = this.getKey(nb.r, nb.c);
          if (!seen.has(nk)) {
            parent[nk] = cur;
            stack.push(nb);
          }
        }
      }
    } else if (algo === 'dijkstra') {
      // unweighted edges (cost=1), equivalent to BFS in cost but still using Dijkstra machinery
      const dist = {};
      dist[keyStart] = 0;
      const pq = [{ node: startNode, d: 0 }];
      const closed = new Set();

      while (pq.length) {
        pq.sort((a, b) => a.d - b.d);
        const { node: cur } = pq.shift();
        const k = this.getKey(cur.r, cur.c);
        if (closed.has(k)) continue;
        closed.add(k);
        visited.push(cur);

        if (cur.r === targetNode.r && cur.c === targetNode.c) {
          found = true;
          endNode = cur;
          break;
        }

        for (const nb of this.getNeighbors(cur.r, cur.c)) {
          const nk = this.getKey(nb.r, nb.c);
          if (closed.has(nk)) continue;
          const alt = (dist[k] ?? Infinity) + 1;
          if (alt < (dist[nk] ?? Infinity)) {
            dist[nk] = alt;
            parent[nk] = cur;
            pq.push({ node: nb, d: alt });
          }
        }
      }
    } else if (algo === 'greedy') {
      const pq = [{ node: startNode, h: this.heuristic(startNode) }];
      const closed = new Set();
      while (pq.length) {
        pq.sort((a, b) => a.h - b.h);
        const { node: cur } = pq.shift();
        const k = this.getKey(cur.r, cur.c);
        if (closed.has(k)) continue;
        closed.add(k);
        visited.push(cur);

        if (cur.r === targetNode.r && cur.c === targetNode.c) {
          found = true;
          endNode = cur;
          break;
        }

        for (const nb of this.getNeighbors(cur.r, cur.c)) {
          const nk = this.getKey(nb.r, nb.c);
          if (closed.has(nk)) continue;
          if (!(nk in parent)) parent[nk] = cur; // first parent for visualization
          pq.push({ node: nb, h: this.heuristic(nb) });
        }
      }
    } else {
      // A*
      const g = {};
      const f = {};
      g[keyStart] = 0;
      f[keyStart] = this.heuristic(startNode);

      const open = [{ node: startNode, g: 0, f: f[keyStart] }];
      const openSetKeys = new Set([keyStart]);
      const closed = new Set();

      while (open.length) {
        open.sort((a, b) => (a.f === b.f ? a.g - b.g : a.f - b.f));
        const curItem = open.shift();
        const cur = curItem.node;
        const k = this.getKey(cur.r, cur.c);
        openSetKeys.delete(k);
        if (closed.has(k)) continue;
        closed.add(k);
        visited.push(cur);

        if (cur.r === targetNode.r && cur.c === targetNode.c) {
          found = true;
          endNode = cur;
          break;
        }

        for (const nb of this.getNeighbors(cur.r, cur.c)) {
          const nk = this.getKey(nb.r, nb.c);
          if (closed.has(nk)) continue;
          const tentativeG = (g[k] ?? Infinity) + 1;
          if (tentativeG < (g[nk] ?? Infinity)) {
            parent[nk] = cur;
            g[nk] = tentativeG;
            f[nk] = tentativeG + this.heuristic(nb);
            if (!openSetKeys.has(nk)) {
              open.push({ node: nb, g: tentativeG, f: f[nk] });
              openSetKeys.add(nk);
            }
          }
        }
      }
    }

    const execMs = performance.now() - startT;
    const path = found ? this.backtrackPath(parent, endNode) : [];
    const cost = path.length > 0 ? path.length - 1 : 0; // True g-cost (number of edges)
    return { visited, path, cost, execMs };
  }
}
