/**
 * DSA Terminology Crossword Puzzle
 * Three difficulty levels (Easy / Medium / Hard) with pre-defined grids,
 * solve-timer, reveal-count, localStorage best scores, and completion modal.
 *
 * Terminology is sourced from common DSA topics (arrays, trees, graphs, DP,
 * sorting, recursion, etc.) found in /data/dsa-topics.js and
 * /data/quiz-questions.js.
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     PUZZLE DATA
     Each puzzle: { name, gridWidth, gridHeight, words }
     words: { word, clue, row, col, direction, number }
     direction: 'across' | 'down'
     Words are placed in separate grid regions so no two words
     overlap with conflicting letters.
     ───────────────────────────────────────────── */

  const PUZZLES = {
    easy: {
      name: 'Easy — DSA Fundamentals',
      gridWidth: 15,
      gridHeight: 15,
      words: [
        // --- Across (rows 0–10, cols 0–6) ---
        { word: 'STACK',  clue: 'LIFO data structure',                      row: 0,  col: 0, direction: 'across' },
        { word: 'TREE',   clue: 'Hierarchical node structure',              row: 2,  col: 2, direction: 'across' },
        { word: 'ARRAY',  clue: 'Contiguous element storage',               row: 4,  col: 1, direction: 'across' },
        { word: 'GRAPH',  clue: 'Network of vertices and edges',            row: 6,  col: 0, direction: 'across' },
        { word: 'QUEUE',  clue: 'FIFO data structure',                      row: 8,  col: 2, direction: 'across' },
        { word: 'NODE',   clue: 'Basic element of a linked list',          row: 10, col: 2, direction: 'across' },
        { word: 'SORT',   clue: 'Arrange elements in a defined order',      row: 12, col: 0, direction: 'across' },
        // --- Down (rows 0–10, cols 8–14) ---
        { word: 'HEAP',   clue: 'Tree structure for priority queues',       row: 0,  col: 8,  direction: 'down' },
        { word: 'BFS',    clue: 'Level-order traversal acronym',            row: 0,  col: 9,  direction: 'down' },
        { word: 'DFS',    clue: 'Depth-first traversal acronym',            row: 0,  col: 10, direction: 'down' },
        { word: 'LINK',   clue: 'Reference connecting nodes in a chain',    row: 4,  col: 11, direction: 'down' },
        { word: 'SEARCH', clue: 'Find an element in a collection',          row: 0,  col: 12, direction: 'down' },
        { word: 'HASH',   clue: 'Key-to-value mapping structure',           row: 6,  col: 13, direction: 'down' },
        { word: 'DATA',   clue: 'Information stored and processed',         row: 10, col: 14, direction: 'down' },
      ],
    },
    medium: {
      name: 'Medium — DSA Concepts',
      gridWidth: 15,
      gridHeight: 15,
      words: [
        // --- Across (rows 0–10, cols 0–7) ---
        { word: 'BINARY',   clue: 'Base-2 system or two-child tree',        row: 0,  col: 0, direction: 'across' },
        { word: 'MATRIX',   clue: 'Two-dimensional rectangular array',      row: 2,  col: 2, direction: 'across' },
        { word: 'MERGE',    clue: 'Combine two sorted sequences',           row: 4,  col: 1, direction: 'across' },
        { word: 'PIVOT',    clue: 'Element used to partition in QuickSort', row: 6,  col: 0, direction: 'across' },
        { word: 'QUEUE',    clue: 'FIFO data structure',                    row: 8,  col: 2, direction: 'across' },
        { word: 'RECURSE',  clue: 'Function that calls itself',             row: 10, col: 1, direction: 'across' },
        { word: 'CACHE',    clue: 'Temporary fast-access storage',          row: 12, col: 2, direction: 'across' },
        // --- Down (rows 0–10, cols 8–14) ---
        { word: 'ITERATE',  clue: 'Repeat a process step-by-step',          row: 0,  col: 8,  direction: 'down' },
        { word: 'STACK',    clue: 'LIFO abstract data type',                row: 2,  col: 9,  direction: 'down' },
        { word: 'GRAPH',    clue: 'Network of vertices and edges',          row: 4,  col: 10, direction: 'down' },
        { word: 'HEAP',     clue: 'Priority queue tree structure',          row: 6,  col: 11, direction: 'down' },
        { word: 'NODE',     clue: 'Data element in a tree or list',         row: 8,  col: 12, direction: 'down' },
        { word: 'BFS',      clue: 'Level-order traversal acronym',          row: 10, col: 13, direction: 'down' },
        { word: 'TREE',     clue: 'Rooted hierarchical structure',          row: 11, col: 14, direction: 'down' },
      ],
    },
    hard: {
      name: 'Hard — Advanced DSA',
      gridWidth: 15,
      gridHeight: 15,
      words: [
        // --- Across (rows 0–12, cols 0–7) ---
        { word: 'TRIE',      clue: 'Tree for efficient string prefix search',    row: 0,  col: 0, direction: 'across' },
        { word: 'HEAPIFY',   clue: 'Build a heap from an unsorted array',        row: 2,  col: 1, direction: 'across' },
        { word: 'TOPOLOGY',  clue: 'Study of network arrangement / sort',        row: 4,  col: 0, direction: 'across' },
        { word: 'KNAPSACK',  clue: 'Classic DP optimization problem',            row: 6,  col: 0, direction: 'across' },
        { word: 'DIJKSTRA',  clue: 'Shortest path on weighted graphs',           row: 8,  col: 0, direction: 'across' },
        { word: 'HASHMAP',   clue: 'Key-value store with O(1) average lookup',   row: 10, col: 1, direction: 'across' },
        { word: 'OVERFLOW',  clue: 'When a value exceeds its storage capacity',  row: 12, col: 2, direction: 'across' },
        // --- Down (rows 0–12, cols 8–14) ---
        { word: 'TRAVERSE',  clue: 'Visit every element in a structure',         row: 0,  col: 8,  direction: 'down' },
        { word: 'PALINDROME',clue: 'Reads the same forward and backward',        row: 0,  col: 9,  direction: 'down' },
        { word: 'COMPLEXITY',clue: 'Measure of algorithm time or space usage',   row: 0,  col: 10, direction: 'down' },
        { word: 'RECURSION', clue: 'Technique where a function calls itself',    row: 0,  col: 11, direction: 'down' },
        { word: 'BACKTRACK', clue: 'Explore possibilities, undoing dead ends',   row: 0,  col: 12, direction: 'down' },
        { word: 'INPLACE',   clue: 'Algorithm using O(1) extra space',           row: 5,  col: 13, direction: 'down' },
        { word: 'CASCADE',   clue: 'Chain of dependent deletions or updates',    row: 8,  col: 14, direction: 'down' },
      ],
    },
  };

  // Assign numbers to word entries: cells are numbered in reading order (row-major).
  // If a cell starts both an across and a down word, they share the same number.
  function numberEntries(words) {
    // Build a map of which directions start at each cell
    const startMap = {};
    words.forEach(w => {
      const key = `${w.row},${w.col}`;
      if (!startMap[key]) startMap[key] = {};
      startMap[key][w.direction] = true;
    });

    // Sort unique start cells by row then col
    const starts = Object.keys(startMap)
      .map(k => {
        const [r, c] = k.split(',').map(Number);
        return { key: k, row: r, col: c };
      })
      .sort((a, b) => a.row - b.row || a.col - b.col);

    // Assign numbers
    const numberForKey = {};
    starts.forEach((s, idx) => {
      numberForKey[s.key] = idx + 1;
    });

    return words.map(w => {
      const key = `${w.row},${w.col}`;
      return { ...w, number: numberForKey[key] };
    });
  }

  // Number all puzzles
  Object.keys(PUZZLES).forEach(key => {
    PUZZLES[key].words = numberEntries(PUZZLES[key].words);
  });

  /* ─────────────────────────────────────────────
     STORAGE KEYS
     ───────────────────────────────────────────── */
  const STORAGE_PREFIX = 'aivDcw_';
  const BEST_TIMES_KEY = STORAGE_PREFIX + 'bestTimes';   // { easy: secs, medium: secs, hard: secs }
  const REVEAL_COUNTS_KEY = STORAGE_PREFIX + 'revealCounts';
  const BEST_REVEALS_KEY = STORAGE_PREFIX + 'bestReveals';

  /* ─────────────────────────────────────────────
     STATE
     ───────────────────────────────────────────── */
  const state = {
    difficulty: 'easy',
    grid: [],          // 2D array of cell objects
    words: [],         // puzzle word entries
    acrossEntries: [],
    downEntries: [],
    selectedRow: -1,
    selectedCol: -1,
    currentDirection: 'across',
    letterFills: {},   // "row,col" => letter
    revealsUsed: 0,
    solvedWords: new Set(),
    timerInterval: null,
    elapsedSeconds: 0,
    isSolved: false,
    isSolutionAnimating: false,
    isTimerStarted: false,
  };

  /* ─────────────────────────────────────────────
     DOM REFS (lazily resolved)
     ───────────────────────────────────────────── */
  function $id(id) { return document.getElementById(id); }

  const _els = {};
  function el(name) {
    if (!_els[name]) {
      const map = {
        gridWrap: 'dcwGridWrap',
        clueList: 'dcwClueList',
        timerDisplay: 'dcwTimerDisplay',
        revealCount: 'dcwRevealCount',
        solvedCount: 'dcwSolvedCount',
        bestTime: 'dcwBestTime',
        currentClueText: 'dcwCcText',
        checkBtn: 'dcwCheckBtn',
        revealBtn: 'dcwRevealBtn',
        solutionBtn: 'dcwSolutionBtn',
        tabAcross: 'dcwTabAcross',
        tabDown: 'dcwTabDown',
        modal: 'dcwCompletionModal',
        modalTime: 'dcwModalTime',
        modalReveals: 'dcwModalReveals',
        modalBest: 'dcwModalBest',
        modalScore: 'dcwModalScore',
        modalCloseBtn: 'dcwModalCloseBtn',
        modalNextBtn: 'dcwModalNextBtn',
        newPuzzleBtn: 'dcwNewPuzzleBtn',
        startBtn: 'dcwStartBtn',
        modalBackdrop: 'dcwModalBackdrop',
      };
      _els[name] = $id(map[name]);
    }
    return _els[name];
  }

  /* ─────────────────────────────────────────────
     HELPERS
     ───────────────────────────────────────────── */
  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // Returns the set of cell keys { "r,c" => letter } for a given word entry.
  function getWordCells(entry) {
    const cells = {};
    const { word, row, col, direction } = entry;
    for (let i = 0; i < word.length; i++) {
      const r = direction === 'across' ? row : row + i;
      const c = direction === 'across' ? col + i : col;
      cells[`${r},${c}`] = word[i];
    }
    return cells;
  }

  /* ─────────────────────────────────────────────
     GRID BUILDING
     ───────────────────────────────────────────── */
  function buildGrid(puzzle) {
    const { gridWidth, gridHeight, words } = puzzle;

    // Initialize empty grid
    const grid = [];
    for (let r = 0; r < gridHeight; r++) {
      grid[r] = [];
      for (let c = 0; c < gridWidth; c++) {
        grid[r][c] = {
          blocked: true,
          letter: '',
          row: r,
          col: c,
          number: null,
          wordStarts: { across: false, down: false },
        };
      }
    }

    // Place words and mark cells
    words.forEach(w => {
      for (let i = 0; i < w.word.length; i++) {
        const r = w.direction === 'across' ? w.row : w.row + i;
        const c = w.direction === 'across' ? w.col + i : w.col;
        if (r >= 0 && r < gridHeight && c >= 0 && c < gridWidth) {
          grid[r][c].blocked = false;
          grid[r][c].letter = w.word[i];
          if (i === 0) {
            grid[r][c].number = w.number;
            grid[r][c].wordStarts[w.direction] = true;
          }
        }
      }
    });

    return grid;
  }

  /* ─────────────────────────────────────────────
     RENDER GRID
     ───────────────────────────────────────────── */
  function renderGrid() {
    const wrap = el('gridWrap');
    if (!wrap) return;
    const { gridWidth } = PUZZLES[state.difficulty];

    wrap.style.gridTemplateColumns = `repeat(${gridWidth}, 36px)`;

    let html = '';
    for (let r = 0; r < state.grid.length; r++) {
      for (let c = 0; c < state.grid[r].length; c++) {
        const cell = state.grid[r][c];
        const key = `${r},${c}`;
        const filledLetter = state.letterFills[key] || '';
        const isSelected = state.selectedRow === r && state.selectedCol === c;
        const isActiveWord = isCellInSelectedWord(r, c);

        let classes = 'dcw-cell';
        if (cell.blocked) {
          classes += ' blocked';
        } else {
          if (filledLetter && !isActiveWord && !isSelected) classes += ' filled';
        }

        const dataAttrs = [
          `data-row="${r}"`,
          `data-col="${c}"`,
        ];
        if (cell.number && !cell.blocked) {
          dataAttrs.push(`data-number="${cell.number}"`);
          // Add number as pseudo content via CSS
        }

        if (cell.blocked) {
          html += `<div class="${classes}" ${dataAttrs.join(' ')}></div>`;
        } else {
          html += `<div class="${classes}" ${dataAttrs.join(' ')}>
            <input type="text" class="dcw-cell-input" maxlength="1"
              data-row="${r}" data-col="${c}"
              value="${escapeHtml(filledLetter)}"
              aria-label="Row ${r + 1}, Column ${c + 1}${cell.number ? ', word ' + cell.number : ''}"
              autocomplete="off" spellcheck="false" />
          </div>`;
        }
      }
    }

    wrap.innerHTML = html;

    // Attach event listeners
    wrap.querySelectorAll('.dcw-cell-input').forEach(input => {
      input.addEventListener('focus', () => {
        const row = parseInt(input.dataset.row, 10);
        const col = parseInt(input.dataset.col, 10);
        selectCell(row, col);
      });

      input.addEventListener('input', () => {
        const row = parseInt(input.dataset.row, 10);
        const col = parseInt(input.dataset.col, 10);
        // Take only the last (newest) character, uppercase
        const val = input.value.slice(-1).toUpperCase();
        input.value = val;
        handleCellInput(row, col, val);
      });

      input.addEventListener('keydown', handleKeyNavigation);
    });

    // Click cell div to focus input
    wrap.querySelectorAll('.dcw-cell:not(.blocked)').forEach(div => {
      div.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') {
          const inp = div.querySelector('.dcw-cell-input');
          if (inp) inp.focus();
        }
      });
    });

    // Apply highlight classes AFTER rendering (they may be overridden)
    // Re-select and apply selected/active-word classes
    if (state.selectedRow >= 0 && state.selectedCol >= 0) {
      const selCell = wrap.querySelector(`.dcw-cell[data-row="${state.selectedRow}"][data-col="${state.selectedCol}"]`);
      if (selCell) selCell.classList.add('selected');

      // Highlight active word cells
      const wordInfo = getSelectedWordInfo();
      if (wordInfo) {
        const cells = getWordCells(wordInfo);
        Object.keys(cells).forEach(k => {
          const [r, c] = k.split(',').map(Number);
          const cellEl = wrap.querySelector(`.dcw-cell[data-row="${r}"][data-col="${c}"]`);
          if (cellEl && !(r === state.selectedRow && c === state.selectedCol)) {
            cellEl.classList.add('active-word');
          }
        });
      }
    }
  }

  /* ─────────────────────────────────────────────
     RENDER CLUES
     ───────────────────────────────────────────── */
  function renderClues() {
    const list = el('clueList');
    if (!list) return;
    const activeTab = document.querySelector('.dcw-clue-tab.active');
    const direction = activeTab ? activeTab.dataset.direction : 'across';
    const entries = direction === 'across' ? state.acrossEntries : state.downEntries;

    list.innerHTML = entries.map(e => {
      const isActive = state.currentDirection === direction &&
        isWordSelected(e.word, e.row, e.col, direction);
      const isSolved = state.solvedWords.has(makeWordKey(e));
      const classes = `dcw-clue-item${isActive ? ' active' : ''}${isSolved ? ' solved' : ''}`;
      return `<li class="${classes}" data-row="${e.row}" data-col="${e.col}" data-direction="${e.direction}">
        <span class="dcw-clue-number">${e.number}.</span>
        <span class="dcw-clue-text">${escapeHtml(e.clue)}</span>
        <span class="dcw-clue-length">(${e.word.length})</span>
      </li>`;
    }).join('');

    // Click clue to focus
    list.querySelectorAll('.dcw-clue-item:not(.solved)').forEach(item => {
      item.addEventListener('click', () => {
        const row = parseInt(item.dataset.row, 10);
        const col = parseInt(item.dataset.col, 10);
        const dir = item.dataset.direction;
        selectWordByPos(row, col, dir);
      });
    });

    updateCurrentClue();
  }

  function updateCurrentClue() {
    const cc = el('currentClueText');
    if (!cc) return;
    const wordInfo = getSelectedWordInfo();
    if (wordInfo) {
      const solved = state.solvedWords.has(makeWordKey(wordInfo));
      if (solved) {
        cc.textContent = '✓ Already solved! Try another clue.';
      } else {
        cc.textContent = `${wordInfo.number}. ${wordInfo.clue} (${wordInfo.word.length})`;
      }
    } else {
      cc.textContent = 'Click a cell to start';
    }
  }

  /* ─────────────────────────────────────────────
     WORD KEY
     ───────────────────────────────────────────── */
  function makeWordKey(e) {
    return `${e.word}_${e.row}_${e.col}_${e.direction}`;
  }

  /* ─────────────────────────────────────────────
     CELL / WORD SELECTION
     ───────────────────────────────────────────── */
  function selectCell(row, col) {
    if (state.grid[row] && state.grid[row][col] && state.grid[row][col].blocked) return;

    // Same cell already selected — toggle direction if possible, else no-op
    if (state.selectedRow === row && state.selectedCol === col) {
      const info = getWordInfoAt(row, col);
      if (info && info.across && info.down) {
        state.currentDirection = state.currentDirection === 'across' ? 'down' : 'across';
        renderGrid();
        renderClues();
        scrollToSelectedClue();
      }
      return;
    }

    const info = getWordInfoAt(row, col);
    if (info) {
      if (info.across && info.down) {
        if (state.currentDirection === 'across' && !info.across) {
          state.currentDirection = 'down';
        } else if (state.currentDirection === 'down' && !info.down) {
          state.currentDirection = 'across';
        }
      } else if (info.across) {
        state.currentDirection = 'across';
      } else if (info.down) {
        state.currentDirection = 'down';
      }
    }

    state.selectedRow = row;
    state.selectedCol = col;
    renderGrid();
    renderClues();
    scrollToSelectedClue();

    // Re-focus the newly rendered input
    requestAnimationFrame(() => {
      const inp = document.querySelector(`.dcw-cell-input[data-row="${row}"][data-col="${col}"]`);
      if (inp && document.activeElement !== inp) inp.focus();
    });
  }

  function getWordInfoAt(row, col) {
    const result = { across: null, down: null };

    state.acrossEntries.forEach(e => {
      const { word, row: wr, col: wc } = e;
      if (row === wr && col >= wc && col < wc + word.length) {
        result.across = e;
      }
    });

    state.downEntries.forEach(e => {
      const { word, row: wr, col: wc } = e;
      if (col === wc && row >= wr && row < wr + word.length) {
        result.down = e;
      }
    });

    return result;
  }

  function getSelectedWordInfo() {
    if (state.selectedRow < 0 || state.selectedCol < 0) return null;
    const info = getWordInfoAt(state.selectedRow, state.selectedCol);
    return info ? info[state.currentDirection] : null;
  }

  function isCellInSelectedWord(row, col) {
    const wordInfo = getSelectedWordInfo();
    if (!wordInfo) return false;
    const cells = getWordCells(wordInfo);
    return `${row},${col}` in cells;
  }

  function isWordSelected(word, row, col, direction) {
    if (state.currentDirection !== direction || state.selectedRow < 0) return false;
    const info = getSelectedWordInfo();
    if (!info) return false;
    return info.word === word && info.row === row && info.col === col && info.direction === direction;
  }

  function selectWordByPos(row, col, direction) {
    state.currentDirection = direction;
    state.selectedRow = row;
    state.selectedCol = col;

    renderGrid();
    renderClues();
    scrollToSelectedClue();

    // Focus the input
    const input = document.querySelector(`.dcw-cell-input[data-row="${row}"][data-col="${col}"]`);
    if (input) input.focus();
  }

  function scrollToSelectedClue() {
    const activeItem = document.querySelector('.dcw-clue-item.active');
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  /* ─────────────────────────────────────────────
     INPUT HANDLING
     ───────────────────────────────────────────── */
  function handleCellInput(row, col, letter) {
    if (!state.isTimerStarted || state.isSolved || state.isSolutionAnimating) return;
    if (state.grid[row] && state.grid[row][col] && state.grid[row][col].blocked) return;

    const key = `${row},${col}`;

    if (letter && /^[A-Z]$/.test(letter)) {
      state.letterFills[key] = letter;
    } else {
      delete state.letterFills[key];
    }

    renderGrid();
    checkWordCompletion();
    updateStats();

    // Advance cursor
    if (letter && /^[A-Z]$/.test(letter)) {
      moveToNextCell(row, col);
    }
  }

  function moveToNextCell(row, col) {
    const wordInfo = getSelectedWordInfo();
    if (!wordInfo) return;

    const { word, row: wr, col: wc, direction: dir } = wordInfo;
    for (let i = 0; i < word.length - 1; i++) {
      const r = dir === 'across' ? wr : wr + i;
      const c = dir === 'across' ? wc + i : wc;
      if (r === row && c === col) {
        const nextR = dir === 'across' ? wr : wr + i + 1;
        const nextC = dir === 'across' ? wc + i + 1 : wc;
        selectCell(nextR, nextC);
        const input = document.querySelector(`.dcw-cell-input[data-row="${nextR}"][data-col="${nextC}"]`);
        if (input) input.focus();
        return;
      }
    }
  }

  /* ─────────────────────────────────────────────
     KEYBOARD NAVIGATION
     ───────────────────────────────────────────── */
  function handleKeyNavigation(e) {
    const input = e.currentTarget;
    if (!input) return;
    const row = parseInt(input.dataset.row, 10);
    const col = parseInt(input.dataset.col, 10);

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        stepToCell(row, col, -1, 0);
        break;
      case 'ArrowDown':
        e.preventDefault();
        stepToCell(row, col, 1, 0);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        stepToCell(row, col, 0, -1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        stepToCell(row, col, 0, 1);
        break;
      case 'Backspace':
        e.preventDefault();
        handleBackspace(row, col);
        break;
      default:
        break;
    }
  }

  function stepToCell(row, col, dr, dc) {
    const maxIter = 20;
    let nr = row + dr;
    let nc = col + dc;
    let iter = 0;

    while (iter < maxIter) {
      if (nr < 0 || nr >= state.grid.length || nc < 0 || nc >= state.grid[0].length) {
        return; // Out of bounds
      }
      if (!state.grid[nr][nc].blocked) {
        selectCell(nr, nc);
        const input = document.querySelector(`.dcw-cell-input[data-row="${nr}"][data-col="${nc}"]`);
        if (input) input.focus();
        return;
      }
      nr += dr;
      nc += dc;
      iter++;
    }
  }

  function handleBackspace(row, col) {
    const key = `${row},${col}`;
    if (state.letterFills[key]) {
      delete state.letterFills[key];
      renderGrid();
      updateStats();
      return;
    }

    // Move to previous cell in current word and clear it
    const wordInfo = getSelectedWordInfo();
    if (!wordInfo) return;

    const { word, row: wr, col: wc, direction: dir } = wordInfo;
    for (let i = 1; i < word.length; i++) {
      const r = dir === 'across' ? wr : wr + i;
      const c = dir === 'across' ? wc + i : wc;
      if (r === row && c === col) {
        const prevR = dir === 'across' ? wr : wr + i - 1;
        const prevC = dir === 'across' ? wc + i - 1 : wc;
        const prevKey = `${prevR},${prevC}`;
        delete state.letterFills[prevKey];
        selectCell(prevR, prevC);
        renderGrid();
        updateStats();
        return;
      }
    }
  }

  /* ─────────────────────────────────────────────
     WORD COMPLETION CHECK
     ───────────────────────────────────────────── */
  function checkWordCompletion() {
    const allEntries = state.acrossEntries.concat(state.downEntries);
    allEntries.forEach(e => {
      const key = makeWordKey(e);
      if (state.solvedWords.has(key)) return;
      if (isWordFilled(e)) {
        state.solvedWords.add(key);
      }
    });

    checkPuzzleSolved();
  }

  function isWordFilled(entry) {
    const cells = getWordCells(entry);
    return Object.keys(cells).every(k => {
      const expected = cells[k];
      return state.letterFills[k] === expected;
    });
  }

  function isPuzzleComplete() {
    const allEntries = state.acrossEntries.concat(state.downEntries);
    return allEntries.every(e => isWordFilled(e));
  }

  function checkPuzzleSolved() {
    if (state.isSolved) return;
    if (isPuzzleComplete()) {
      state.isSolved = true;
      stopTimer();
      showCompletionModal();
    }

    const solved = state.solvedWords.size;
    const total = state.acrossEntries.length + state.downEntries.length;
    const solvedEl = el('solvedCount');
    if (solvedEl) solvedEl.textContent = `${solved}/${total}`;
    renderClues();
  }

  /* ─────────────────────────────────────────────
     ACTIONS
     ───────────────────────────────────────────── */
  function checkAnswers() {
    if (!state.isTimerStarted) return;
    let hasWrong = false;
    const allEntries = state.acrossEntries.concat(state.downEntries);

    // Collect all correct cell-letter mappings
    const correctMap = {};
    allEntries.forEach(e => {
      const cells = getWordCells(e);
      Object.keys(cells).forEach(k => {
        // Only set if not already set (avoids issues if words don't intersect)
        if (!(k in correctMap)) {
          correctMap[k] = cells[k];
        }
      });
    });

    // Check user's fills
    const inputs = document.querySelectorAll('.dcw-cell-input');
    inputs.forEach(input => {
      const r = parseInt(input.dataset.row, 10);
      const c = parseInt(input.dataset.col, 10);
      const key = `${r},${c}`;
      const val = state.letterFills[key] || '';
      const expected = correctMap[key];

      if (val && expected && val !== expected) {
        input.closest('.dcw-cell').classList.add('wrong');
        hasWrong = true;
      }
    });

    if (!hasWrong) {
      flashAllCells();
    }

    setTimeout(() => {
      document.querySelectorAll('.dcw-cell.wrong').forEach(cell => {
        cell.classList.remove('wrong');
      });
    }, 1500);
  }

  function flashAllCells() {
    const cells = document.querySelectorAll('.dcw-cell:not(.blocked)');
    cells.forEach(cell => {
      cell.style.transition = 'background 0.2s ease';
      cell.style.backgroundColor = 'rgba(34,197,94,0.15)';
      setTimeout(() => {
        cell.style.backgroundColor = '';
        cell.style.transition = '';
      }, 600);
    });
  }

  function revealOneWord() {
    if (!state.isTimerStarted || state.isSolved || state.isSolutionAnimating) return;

    const allEntries = state.acrossEntries.concat(state.downEntries);
    const unsolved = allEntries.filter(e => !state.solvedWords.has(makeWordKey(e)));
    if (unsolved.length === 0) return;

    const entry = unsolved[Math.floor(Math.random() * unsolved.length)];
    const cells = getWordCells(entry);

    state.revealsUsed++;
    updateStats();

    // Fill cells with animation
    let idx = 0;
    Object.keys(cells).forEach(k => {
      const letter = cells[k];
      state.letterFills[k] = letter;
      const [r, c] = k.split(',').map(Number);

      setTimeout(() => {
        const cell = document.querySelector(`.dcw-cell[data-row="${r}"][data-col="${c}"]`);
        if (cell) {
          cell.classList.add('reveal');
          setTimeout(() => cell.classList.remove('reveal'), 500);
          const input = cell.querySelector('.dcw-cell-input');
          if (input) input.value = letter;
        }
      }, idx * 60);
      idx++;
    });

    // Mark solved after animation
    setTimeout(() => {
      state.solvedWords.add(makeWordKey(entry));
      renderGrid();
      renderClues();
      checkPuzzleSolved();
      updateStats();
    }, idx * 60 + 100);
  }

  function showSolution() {
    if (!state.isTimerStarted || state.isSolved || state.isSolutionAnimating) return;
    state.isSolutionAnimating = true;

    const allEntries = state.acrossEntries.concat(state.downEntries);
    const cellData = [];

    allEntries.forEach(e => {
      const cells = getWordCells(e);
      Object.keys(cells).forEach(k => {
        if (!state.letterFills[k] || state.letterFills[k] !== cells[k]) {
          cellData.push({ key: k, letter: cells[k] });
        }
      });
    });

    cellData.forEach((cd, idx) => {
      setTimeout(() => {
        state.letterFills[cd.key] = cd.letter;
        const [r, c] = cd.key.split(',').map(Number);
        const cell = document.querySelector(`.dcw-cell[data-row="${r}"][data-col="${c}"]`);
        if (cell) {
          cell.classList.add('solution-enter');
          const input = cell.querySelector('.dcw-cell-input');
          if (input) input.value = cd.letter;
          setTimeout(() => cell.classList.remove('solution-enter'), 400);
        }

        if (idx === cellData.length - 1) {
          setTimeout(() => {
            state.isSolutionAnimating = false;
            state.isSolved = true;
            stopTimer();
            allEntries.forEach(ee => state.solvedWords.add(makeWordKey(ee)));
            renderGrid();
            renderClues();
            updateStats();
            showCompletionModal();
          }, 300);
        }
      }, idx * 30);
    });

    if (cellData.length === 0) {
      state.isSolutionAnimating = false;
      state.isSolved = true;
      stopTimer();
      allEntries.forEach(ee => state.solvedWords.add(makeWordKey(ee)));
      renderGrid();
      renderClues();
      updateStats();
      showCompletionModal();
    }
  }

  /* ─────────────────────────────────────────────
     TIMER
     ───────────────────────────────────────────── */
  function startTimer() {
    stopTimer();
    state.elapsedSeconds = 0;
    updateTimerDisplay();

    state.timerInterval = setInterval(() => {
      state.elapsedSeconds++;
      updateTimerDisplay();
    }, 1000);
  }

  function stopTimer() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  function updateTimerDisplay() {
    const t = el('timerDisplay');
    if (!t) return;
    if (!state.isTimerStarted) {
      t.textContent = '\u2014 \u2014';
    } else {
      t.textContent = formatTime(state.elapsedSeconds);
    }
  }

  /* ─────────────────────────────────────────────
     STATS UPDATE
     ───────────────────────────────────────────── */
  function updateStats() {
    const revealEl = el('revealCount');
    if (revealEl) revealEl.textContent = state.revealsUsed;

    const solved = state.solvedWords.size;
    const total = state.acrossEntries.length + state.downEntries.length;
    const solvedEl = el('solvedCount');
    if (solvedEl) solvedEl.textContent = `${solved}/${total}`;

    updateBestTimeDisplay();
  }

  function updateBestTimeDisplay() {
    const bestTimes = loadJSON(BEST_TIMES_KEY, {});
    const best = bestTimes[state.difficulty];
    const bestEl = el('bestTime');
    if (bestEl) bestEl.textContent = best ? formatTime(best) : '—';
  }

  function saveBestScore(difficulty, seconds, reveals) {
    const bestTimes = loadJSON(BEST_TIMES_KEY, {});
    const bestReveals = loadJSON(BEST_REVEALS_KEY, {});

    if (!bestTimes[difficulty] || seconds < bestTimes[difficulty]) {
      bestTimes[difficulty] = seconds;
      saveJSON(BEST_TIMES_KEY, bestTimes);
    }

    if (!bestReveals[difficulty] || reveals < bestReveals[difficulty]) {
      bestReveals[difficulty] = reveals;
      saveJSON(BEST_REVEALS_KEY, bestReveals);
    }

    updateBestTimeDisplay();
  }

  /* ─────────────────────────────────────────────
     COMPLETION MODAL
     ───────────────────────────────────────────── */
  function showCompletionModal() {
    const modal = el('modal');
    if (!modal || !modal.hasAttribute('hidden')) return;

    const time = state.elapsedSeconds;
    const reveals = state.revealsUsed;

    saveBestScore(state.difficulty, time, reveals);

    const bestTimes = loadJSON(BEST_TIMES_KEY, {});
    const best = bestTimes[state.difficulty];

    const mt = el('modalTime');
    const mr = el('modalReveals');
    const mb = el('modalBest');
    const ms = el('modalScore');

    if (mt) mt.textContent = formatTime(time);
    if (mr) mr.textContent = reveals;
    if (mb) mb.textContent = best ? formatTime(best) : '—';
    if (ms) ms.textContent = formatTime(time);

    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';

    flashAllCells();
  }

  function closeCompletionModal() {
    const modal = el('modal');
    if (modal) modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  /* ─────────────────────────────────────────────
     PUZZLE LOADING
     ───────────────────────────────────────────── */
  function loadPuzzle(difficulty) {
    stopTimer();

    const puzzle = PUZZLES[difficulty];
    if (!puzzle) return;

    state.difficulty = difficulty;
    state.grid = buildGrid(puzzle);
    state.words = puzzle.words;
    state.acrossEntries = puzzle.words.filter(w => w.direction === 'across');
    state.downEntries = puzzle.words.filter(w => w.direction === 'down');
    state.selectedRow = -1;
    state.selectedCol = -1;
    state.currentDirection = 'across';
    state.letterFills = {};
    state.revealsUsed = 0;
    state.solvedWords = new Set();
    state.elapsedSeconds = 0;
    state.isSolved = false;
    state.isSolutionAnimating = false;
    state.isTimerStarted = false;

    renderGrid();
    renderClues();
    updateStats();
    updateTimerDisplay();
    updateBestTimeDisplay();

    // Show start button, hide puzzle controls until started
    const startBtn = el('startBtn');
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.innerHTML = '<i class="fas fa-play"></i> Start Puzzle';
    }

    // Reset clue tabs to Across
    document.querySelectorAll('.dcw-clue-tab').forEach(tab => {
      const isAcross = tab.dataset.direction === 'across';
      tab.classList.toggle('active', isAcross);
      tab.setAttribute('aria-selected', isAcross ? 'true' : 'false');
    });
    renderClues();

    // Disable clue tabs and action buttons until timer starts
    document.querySelectorAll('.dcw-clue-tab, .dcw-clue-item, .dcw-btn').forEach(el => {
      if (el.id !== 'dcwStartBtn' && el.id !== 'dcwNewPuzzleBtn' && !el.closest('.dcw-diff-options') && el.id !== 'dcwDiffOptions') {
        el.style.pointerEvents = 'none';
        el.style.opacity = '0.4';
      }
    });

    // Update solved count
    const total = state.acrossEntries.length + state.downEntries.length;
    const solvedEl = el('solvedCount');
    if (solvedEl) solvedEl.textContent = `0/${total}`;

    // Clear wrong marks
    document.querySelectorAll('.dcw-cell.wrong').forEach(c => c.classList.remove('wrong'));
  }

  /* ─────────────────────────────────────────────
     INIT
     ───────────────────────────────────────────── */
  function init() {
    if (!document.querySelector('.dcw-grid-wrap')) return;

    // Load initial puzzle
    loadPuzzle('easy');

    // ── Difficulty buttons ──
    document.querySelectorAll('.dcw-diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const diff = btn.dataset.diff;
        if (diff === state.difficulty) return;

        document.querySelectorAll('.dcw-diff-btn').forEach(b => {
          b.setAttribute('aria-checked', 'false');
          b.classList.remove('active');
        });
        btn.setAttribute('aria-checked', 'true');
        btn.classList.add('active');

        closeCompletionModal();
        loadPuzzle(diff);
      });
    });

    // ── Start button ──
    const startBtn = el('startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (state.isTimerStarted) return;
        state.isTimerStarted = true;
        startTimer();
        startBtn.disabled = true;
        startBtn.innerHTML = '<i class="fas fa-play"></i> Started';

        // Re-enable puzzle controls
        document.querySelectorAll('.dcw-clue-tab, .dcw-clue-item, .dcw-btn').forEach(el => {
          el.style.pointerEvents = '';
          el.style.opacity = '';
        });
      });
    }

    // ── New Puzzle button ──
    const newBtn = el('newPuzzleBtn');
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        closeCompletionModal();
        loadPuzzle(state.difficulty);
      });
    }

    // ── Check button ──
    const checkBtn = el('checkBtn');
    if (checkBtn) checkBtn.addEventListener('click', checkAnswers);

    // ── Reveal button ──
    const revealBtn = el('revealBtn');
    if (revealBtn) revealBtn.addEventListener('click', revealOneWord);

    // ── Solution button ──
    const solBtn = el('solutionBtn');
    if (solBtn) solBtn.addEventListener('click', showSolution);

    // ── Clue tabs ──
    const tabAcross = el('tabAcross');
    const tabDown = el('tabDown');

    [tabAcross, tabDown].forEach(tab => {
      if (!tab) return;
      tab.addEventListener('click', () => {
        document.querySelectorAll('.dcw-clue-tab').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        renderClues();
      });
    });

    // ── Modal ──
    const modalCloseBtn = el('modalCloseBtn');
    const modalNextBtn = el('modalNextBtn');
    const backdrop = el('modalBackdrop');

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeCompletionModal);

    if (modalNextBtn) {
      modalNextBtn.addEventListener('click', () => {
        closeCompletionModal();
        const diffs = ['easy', 'medium', 'hard'];
        const idx = diffs.indexOf(state.difficulty);
        const nextDiff = diffs[(idx + 1) % diffs.length];
        document.querySelectorAll('.dcw-diff-btn').forEach(b => {
          const isActive = b.dataset.diff === nextDiff;
          b.setAttribute('aria-checked', isActive ? 'true' : 'false');
          b.classList.toggle('active', isActive);
        });
        loadPuzzle(nextDiff);
      });
    }

    if (backdrop) backdrop.addEventListener('click', closeCompletionModal);

    // ── Escape key to close modal ──
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = el('modal');
        if (modal && !modal.hasAttribute('hidden')) {
          closeCompletionModal();
        }
      }
    });

    // ── Clean up timer on page unload ──
    window.addEventListener('beforeunload', stopTimer);

    // Set initial difficulty button state
    const easyBtn = document.querySelector('.dcw-diff-btn[data-diff="easy"]');
    if (easyBtn) {
      easyBtn.setAttribute('aria-checked', 'true');
      easyBtn.classList.add('active');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
