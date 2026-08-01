/* ============================================
   COMPLEXITY MEMORY GAME — Card Match Engine
   All functions prefixed cmg* to avoid
   collisions with legacy bundle globals.
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  cmgInit();
});

/* ─── Card Pair Data ───
   Derived from gtcSNIPPETS in guess-the-complexity.
   Each pair = algorithm name ↔ Big-O complexity.  */
const cmg_PAIRS = [
  // ── EASY complexities ──
  { id: "e1",  algo: "Array Access",       complexity: "O(1)" },
  { id: "e5",  algo: "Hash Map Lookup",    complexity: "O(1)" },
  { id: "e10", algo: "Stack Push Pop",     complexity: "O(1)" },
  { id: "e12", algo: "Swap Values",        complexity: "O(1)" },
  { id: "e2",  algo: "Sum Array",          complexity: "O(n)" },
  { id: "e8",  algo: "Linear Search",      complexity: "O(n)" },
  { id: "e9",  algo: "Sequential Loops",   complexity: "O(n)" },
  { id: "e3",  algo: "Binary Search",      complexity: "O(log n)" },
  { id: "e6",  algo: "Halving Loop",       complexity: "O(log n)" },
  { id: "e4",  algo: "Nested Loops",       complexity: "O(n\u00B2)" },
  { id: "e7",  algo: "All Pairs",          complexity: "O(n\u00B2)" },
  // ── MEDIUM complexities ──
  { id: "m1",  algo: "Merge Sort",         complexity: "O(n log n)" },
  { id: "m9",  algo: "Quick Sort (Avg)",   complexity: "O(n log n)" },
  { id: "m2",  algo: "Fibonacci Recursive",complexity: "O(2\u207F)" },
  { id: "m4",  algo: "Subsets",            complexity: "O(2\u207F)" },
  { id: "m6",  algo: "Primality Check",    complexity: "O(\u221An)" },
  { id: "m7",  algo: "BFS Traversal",      complexity: "O(V + E)" },
  { id: "m8",  algo: "Permutations",       complexity: "O(n!)" },
  { id: "m5",  algo: "Matrix Multiply",    complexity: "O(n\u00B3)" },
  { id: "m12", algo: "Longest Palindrome",  complexity: "O(n\u00B2)" },
  { id: "m3",  algo: "Fibonacci DP",       complexity: "O(n)" },
  { id: "m10", algo: "Sliding Window Max", complexity: "O(n)" },
  { id: "m11", algo: "Sorted Intersect",   complexity: "O(n)" },
  { id: "m14", algo: "Two Sum Sorted",     complexity: "O(n)" },
  { id: "m15", algo: "Tree Height",        complexity: "O(log n)" },
  // ── HARD complexities ──
  { id: "h1",  algo: "Permutations w/ Prune",complexity: "O(n!)" },
  { id: "h4",  algo: "N-Queens",           complexity: "O(n!)" },
  { id: "h2",  algo: "Dijkstra (Array)",   complexity: "O(V\u00B2)" },
  { id: "h3",  algo: "Floyd-Warshall",     complexity: "O(n\u00B3)" },
  { id: "h5",  algo: "Matrix Chain",       complexity: "O(n\u00B3)" },
  { id: "h6",  algo: "Subarray Sum",       complexity: "O(n)" },
  { id: "h7",  algo: "Segment Tree Build", complexity: "O(n)" },
  { id: "h8",  algo: "KMP String Search",  complexity: "O(n + m)" },
  { id: "h9",  algo: "Sqrt Approximation", complexity: "O(log n)" },
  { id: "h10", algo: "Edit Distance",      complexity: "O(m \u00D7 n)" },
  { id: "e11", algo: "Power Set Loop",     complexity: "O(2\u207F)" },
  { id: "m13", algo: "Kth Sorted Matrix",  complexity: "O(n\u00B2 log m)" },
];

/* ─── Complexity groupings for difficulty selection ─── */
const cmg_EASY_COMPLEXITIES = new Set([
  "O(1)", "O(n)", "O(log n)", "O(n\u00B2)",
]);
const cmg_MEDIUM_COMPLEXITIES = new Set([
  "O(1)", "O(n)", "O(log n)", "O(n\u00B2)",
  "O(n log n)", "O(2\u207F)", "O(\u221An)",
  "O(V + E)", "O(n!)", "O(n\u00B3)",
]);
/* Hard uses all available complexities. */

/* ─── DOM Shorthand ─── */
const cmgEl = (id) => document.getElementById(id);

/* ─── Game State ─── */
const cmgState = {
  difficulty: "easy",
  cards: [],
  flipped: [],
  matchedIds: new Set(),
  totalPairs: 0,
  flips: 0,
  score: 0,
  streak: 0,
  maxStreak: 0,
  lightningCount: 0,
  timerId: null,
  startTime: null,
  elapsed: 0,
  isLocked: false,
  isRunning: false,

  /* Track flip timestamps for lightning detection */
  firstFlipTime: null,
  secondFlipTime: null,
};

/* ─── High Scores ─── */
const cmg_STORAGE_KEY = "aiv_cmg_scores";

function cmgGetScores() {
  try {
    return JSON.parse(localStorage.getItem(cmg_STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function cmgSaveScore(difficulty, score, flips, elapsed) {
  try {
    const scores = cmgGetScores();
    const prev = scores[difficulty];
    const isNewBest = !prev || score > prev.score ||
      (score === prev.score && flips < prev.flips);
    if (isNewBest) {
      scores[difficulty] = { score: score, flips: flips, elapsed: elapsed };
      localStorage.setItem(cmg_STORAGE_KEY, JSON.stringify(scores));
    }
    return isNewBest;
  } catch (e) {
    return false;
  }
}

function cmgLoadHighScore(difficulty) {
  try {
    const scores = cmgGetScores();
    const entry = scores[difficulty];
    return entry ? entry.score : null;
  } catch (e) {
    return null;
  }
}

function cmgUpdateHighScoreDisplay() {
  const hs = cmgLoadHighScore(cmgState.difficulty);
  const hsLabel = cmgEl("cmgHsDifficulty");
  const hsValue = cmgEl("cmgHighScore");
  if (hsLabel) hsLabel.textContent = cmgCapitalize(cmgState.difficulty);
  if (hsValue) hsValue.textContent = hs !== null ? hs : "\u2014";
}

/* ─── Initialisation ─── */
function cmgInit() {
  cmgUpdateHighScoreDisplay();

  /* Buttons */
  cmgEl("cmgStartBtn").addEventListener("click", cmgStartGame);
  cmgEl("cmgHowBtn").addEventListener("click", () => cmgShowModal("cmgHowModal"));
  cmgEl("cmgHowCloseBtn").addEventListener("click", () => cmgHideModal("cmgHowModal"));
  cmgEl("cmgPlayAgainBtn").addEventListener("click", () => {
    cmgHideModal("cmgResultModal");
    cmgStartGame();
  });
  cmgEl("cmgCloseResultBtn").addEventListener("click", () => {
    cmgHideModal("cmgResultModal");
    cmgResetToEmpty();
  });

  /* Difficulty chips */
  document.querySelectorAll("#cmgDifficultyChips .cmg-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      if (cmgState.isRunning) return;
      document.querySelectorAll("#cmgDifficultyChips .cmg-chip")
        .forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      cmgState.difficulty = chip.dataset.difficulty;
      cmgUpdateHighScoreDisplay();
    });
  });

  /* Close modals on backdrop click */
  document.querySelectorAll(".cmg-modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.add("hidden");
    });
  });
}

/* ─── Select & Build Pairs ─── */
function cmgSelectPairs() {
  let pool;
  let targetPairs;

  if (cmgState.difficulty === "easy") {
    pool = cmg_PAIRS.filter((p) => cmg_EASY_COMPLEXITIES.has(p.complexity));
    targetPairs = 8;
  } else if (cmgState.difficulty === "medium") {
    pool = cmg_PAIRS.filter((p) => cmg_MEDIUM_COMPLEXITIES.has(p.complexity));
    targetPairs = 8;
  } else {
    /* Hard: use all pairs, prefer complex ones */
    pool = [...cmg_PAIRS];
    targetPairs = 12;
  }

  /* Shuffle pool */
  const shuffled = cmgShuffle(pool);

  /* For easy mode, ensure balanced complexity distribution */
  if (cmgState.difficulty === "easy") {
    return cmgSelectBalancedEasy(shuffled, targetPairs);
  }

  /* For medium/hard, pick top targetPairs ensuring no duplicate algo names */
  const seenIds = new Set();
  const selected = [];
  for (const pair of shuffled) {
    if (selected.length >= targetPairs) break;
    if (!seenIds.has(pair.algo)) {
      seenIds.add(pair.algo);
      selected.push(pair);
    }
  }

  /* Fallback: if not enough unique algos, just take whatever we have */
  return selected.length >= targetPairs
    ? selected.slice(0, targetPairs)
    : cmgShuffle(pool).slice(0, targetPairs);
}

function cmgSelectBalancedEasy(shuffled, targetPairs) {
  const grouped = {};
  shuffled.forEach((p) => {
    if (!grouped[p.complexity]) grouped[p.complexity] = [];
    grouped[p.complexity].push(p);
  });

  const selected = [];
  const complexities = ["O(1)", "O(n)", "O(log n)", "O(n\u00B2)"];
  const perComplexity = targetPairs / complexities.length; // 2

  complexities.forEach((comp) => {
    const bucket = grouped[comp] || [];
    const picked = bucket.slice(0, perComplexity);
    selected.push(...picked);
  });

  /* Fill remaining slots if we have fewer than target */
  if (selected.length < targetPairs) {
    const remainder = shuffled.filter(
      (p) => !selected.some((s) => s.id === p.id)
    );
    selected.push(...remainder.slice(0, targetPairs - selected.length));
  }

  return selected.slice(0, targetPairs);
}

/* ─── Create Cards from Selected Pairs ─── */
function cmgBuildCards(selectedPairs) {
  const cards = [];
  selectedPairs.forEach((pair, idx) => {
    cards.push({
      index: cards.length,
      pairId: idx,
      type: "algo",
      label: pair.algo,
    });
    cards.push({
      index: cards.length,
      pairId: idx,
      type: "complexity",
      label: pair.complexity,
    });
  });
  return cmgShuffle(cards);
}

/* ─── Start Game ─── */
function cmgStartGame() {
  /* Clear any running timer */
  if (cmgState.timerId) {
    clearInterval(cmgState.timerId);
    cmgState.timerId = null;
  }

  const pairs = cmgSelectPairs();
  if (pairs.length < 2) {
    cmgShowMessage("Not enough pairs for this difficulty. Try another!", "error");
    return;
  }

  cmgState.cards = cmgBuildCards(pairs);
  cmgState.totalPairs = pairs.length;
  cmgState.matchedIds = new Set();
  cmgState.flipped = [];
  cmgState.flips = 0;
  cmgState.score = 0;
  cmgState.streak = 0;
  cmgState.maxStreak = 0;
  cmgState.lightningCount = 0;
  cmgState.elapsed = 0;
  cmgState.isLocked = false;
  cmgState.isRunning = true;
  cmgState.gameOver = false;
  cmgState.startTime = null;

  /* Hide welcome, show game */
  cmgEl("cmgEmpty").classList.add("hidden");
  cmgEl("cmgActiveGame").classList.remove("hidden");
  cmgEl("cmgResultModal").classList.add("hidden");
  cmgHideMessage();

  cmgRenderGrid();
  cmgUpdateStats();
  cmgUpdateHighScoreDisplay();
}

/* ─── Render Grid ─── */
function cmgRenderGrid() {
  const grid = cmgEl("cmgGrid");
  grid.innerHTML = "";

  const totalCards = cmgState.cards.length;
  const isHard = totalCards > 16;
  grid.className = "cmg-grid " + (isHard ? "cmg-grid-6x4" : "cmg-grid-4x4");

  cmgState.cards.forEach((card) => {
    const div = document.createElement("div");
    div.className = "cmg-card";
    div.dataset.index = card.index;
    div.dataset.pairId = card.pairId;
    div.setAttribute("tabindex", "0");
    div.setAttribute("role", "button");
    div.setAttribute("aria-label", "Face-down card");

    /* Inner container for flip */
    const inner = document.createElement("div");
    inner.className = "cmg-card-inner";

    /* Front (face-down) */
    const front = document.createElement("div");
    front.className = "cmg-card-face cmg-card-front";
    front.innerHTML =
      '<i class="fas fa-question"></i><span class="cmg-card-icon-label">Flip</span>';

    /* Back (face-up) */
    const back = document.createElement("div");
    back.className =
      "cmg-card-face cmg-card-back " +
      (card.type === "algo" ? "cmg-back-algo" : "cmg-back-complexity");
    back.textContent = card.label;

    inner.appendChild(front);
    inner.appendChild(back);
    div.appendChild(inner);

    /* Click handler */
    div.addEventListener("click", () => cmgHandleCardClick(div, card));
    div.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        cmgHandleCardClick(div, card);
      }
    });

    grid.appendChild(div);
  });
}

/* ─── Handle Card Click ─── */
function cmgHandleCardClick(element, card) {
  /* Guard conditions */
  if (!cmgState.isRunning) return;
  if (cmgState.isLocked) return;
  if (cmgState.matchedIds.has(card.pairId)) return;
  if (cmgState.flipped.some((f) => f.card.pairId === card.pairId && f.card.type === card.type)) return;

  /* Start the game timer on first flip */
  if (!cmgState.startTime) {
    cmgState.startTime = Date.now();
    cmgState.timerId = setInterval(cmgTickTimer, 1000);
  }

  /* Flip the card */
  element.classList.add("flipped");
  element.setAttribute("aria-label", card.label + " (" + card.type + ")");

  /* Record flip timestamp for lightning detection */
  const now = Date.now();

  if (cmgState.flipped.length === 0) {
    /* First card flipped */
    cmgState.firstFlipTime = now;
    cmgState.flipped.push({ element: element, card: card });
    cmgState.flips++;
    cmgUpdateStats();
  } else if (cmgState.flipped.length === 1) {
    /* Second card flipped */
    cmgState.secondFlipTime = now;
    cmgState.flipped.push({ element: element, card: card });
    cmgState.flips++;
    cmgState.isLocked = true;
    cmgUpdateStats();

    /* Check for match */
    cmgCheckMatch();
  }
}

/* ─── Check Match ─── */
function cmgCheckMatch() {
  const f1 = cmgState.flipped[0];
  const f2 = cmgState.flipped[1];

  /* Ensure f1 and f2 are different card types */
  const isMatch =
    f1.card.pairId === f2.card.pairId &&
    f1.card.type !== f2.card.type;

  if (isMatch) {
    cmgHandleMatch(f1, f2);
  } else {
    cmgHandleMismatch(f1, f2);
  }
}

/* ─── Handle Match ─── */
function cmgHandleMatch(f1, f2) {
  const pairId = f1.card.pairId;

  cmgState.matchedIds.add(pairId);
  cmgState.streak++;
  if (cmgState.streak > cmgState.maxStreak) {
    cmgState.maxStreak = cmgState.streak;
  }

  /* Calculate match duration for lightning bonus */
  const matchDuration = cmgState.secondFlipTime - cmgState.firstFlipTime;
  const isLightning = matchDuration < 500;

  if (isLightning) {
    cmgState.lightningCount++;
  }

  /* Score: +10 base, +5 lightning, +2 per streak beyond 1 */
  let points = 10;
  if (isLightning) points += 5;
  if (cmgState.streak >= 2) points += 2 * (cmgState.streak - 1);
  cmgState.score += points;

  /* Mark cards as matched */
  f1.element.classList.add("matched");
  f2.element.classList.add("matched");

  if (isLightning) {
    f1.element.classList.add("lightning");
    f2.element.classList.add("lightning");
  }

  cmgUpdateStats();

  /* Show feedback message */
  let msg = "Match! +" + points;
  if (isLightning) msg = "\u26A1 " + msg + " (Lightning!)";
  cmgShowMessage(msg, isLightning ? "lightning" : "success");

  /* Clear flipped state */
  cmgState.flipped = [];
  cmgState.isLocked = false;

  /* Check if game is complete */
  if (cmgState.matchedIds.size >= cmgState.totalPairs) {
    cmgEndGame();
  }
}

/* ─── Handle Mismatch ─── */
function cmgHandleMismatch(f1, f2) {
  cmgState.streak = 0;
  cmgUpdateStats();

  cmgShowMessage("Not a match. Try again!", "error");

  /* Add mismatch animation */
  f1.element.classList.add("mismatch");
  f2.element.classList.add("mismatch");

  /* Flip back after a short delay */
  setTimeout(() => {
    f1.element.classList.remove("flipped", "mismatch");
    f2.element.classList.remove("flipped", "mismatch");
    f1.element.setAttribute("aria-label", "Face-down card");
    f2.element.setAttribute("aria-label", "Face-down card");
    cmgState.flipped = [];
    cmgState.isLocked = false;
  }, 900);
}

/* ─── Tick Timer ─── */
function cmgTickTimer() {
  if (!cmgState.startTime) return;
  cmgState.elapsed = Math.floor((Date.now() - cmgState.startTime) / 1000);
  cmgEl("cmgTimer").textContent = cmgState.elapsed + "s";
}

/* ─── Update Stats Display ─── */
function cmgUpdateStats() {
  cmgEl("cmgFlips").textContent = cmgState.flips;
  cmgEl("cmgMatches").textContent = cmgState.matchedIds.size + " / " + cmgState.totalPairs;
  cmgEl("cmgStreak").textContent = cmgState.streak;
  cmgEl("cmgScore").textContent = cmgState.score;
}

/* ─── Show / Hide Message ─── */
function cmgShowMessage(text, type) {
  const el = cmgEl("cmgMessage");
  const icon = cmgEl("cmgMessageIcon");
  const textEl = cmgEl("cmgMessageText");
  if (!el || !textEl) return;

  el.className = "cmg-message";
  if (type) el.classList.add("cmg-message-" + type);

  const icons = {
    success: "\u2705",
    lightning: "\u26A1",
    error: "\u274C",
    complete: "\uD83C\uDFC6",
  };
  if (icon) icon.textContent = icons[type] || "";
  textEl.textContent = text;
  el.classList.remove("hidden");
}

function cmgHideMessage() {
  const el = cmgEl("cmgMessage");
  if (el) el.classList.add("hidden");
}

/* ─── End Game ─── */
function cmgEndGame() {
  cmgState.isRunning = false;
  cmgState.gameOver = true;

  /* Stop timer */
  if (cmgState.timerId) {
    clearInterval(cmgState.timerId);
    cmgState.timerId = null;
  }

  /* Calculate final elapsed time */
  if (cmgState.startTime) {
    cmgState.elapsed = Math.floor((Date.now() - cmgState.startTime) / 1000);
    cmgEl("cmgTimer").textContent = cmgState.elapsed + "s";
  }

  cmgShowMessage("All pairs found!", "complete");

  /* Save high score */
  const isNewBest = cmgSaveScore(
    cmgState.difficulty,
    cmgState.score,
    cmgState.flips,
    cmgState.elapsed
  );
  cmgUpdateHighScoreDisplay();

  /* Show results after a brief delay */
  setTimeout(() => {
    cmgShowResultModal(isNewBest);
  }, 600);
}

/* ─── Show Results Modal ─── */
function cmgShowResultModal(isNewBest) {
  const accuracy = cmgState.totalPairs > 0
    ? Math.round((cmgState.matchedIds.size / cmgState.totalPairs) * 100)
    : 0;

  const flipsPerPair = cmgState.totalPairs > 0
    ? (cmgState.flips / cmgState.totalPairs).toFixed(1)
    : "0";

  let grade = "Good Memory!";
  if (cmgState.lightningCount >= 3) grade = "Lightning Reflexes!";
  else if (accuracy === 100 && cmgState.flips <= cmgState.totalPairs * 2 + 2)
    grade = "Perfect Match!";
  else if (accuracy >= 80) grade = "Sharp Mind!";
  else if (accuracy >= 60) grade = "Getting Warmer!";

  cmgEl("cmgResultTitle").textContent = grade;

  const minSec = Math.floor(cmgState.elapsed / 60);
  const sec = cmgState.elapsed % 60;
  const timeStr = minSec > 0 ? minSec + "m " + sec + "s" : sec + "s";

  /* Lightning label */
  let bonusesHtml = "";
  if (cmgState.lightningCount > 0) {
    bonusesHtml =
      '<div class="cmg-result-labels">' +
      '<span class="cmg-result-label-chip"><i class="fas fa-bolt"></i> ' +
      cmgState.lightningCount + " lightning match" +
      (cmgState.lightningCount !== 1 ? "es" : "") +
      "</span>" +
      "</div>";
  }

  const bodyHtml =
    '<div class="cmg-result-grid">' +
    '  <div class="cmg-result-item cmg-result-highlight">' +
    '    <span class="cmg-result-value cmg-result-score">' +
    cmgState.score +
    "</span>" +
    '    <span class="cmg-result-label">Score</span>' +
    "  </div>" +
    '  <div class="cmg-result-item">' +
    '    <span class="cmg-result-value">' +
    cmgState.matchedIds.size +
    " / " +
    cmgState.totalPairs +
    "</span>" +
    '    <span class="cmg-result-label">Pairs</span>' +
    "  </div>" +
    '  <div class="cmg-result-item">' +
    '    <span class="cmg-result-value">' +
    cmgState.flips +
    "</span>" +
    '    <span class="cmg-result-label">Total Flips</span>' +
    "  </div>" +
    '  <div class="cmg-result-item">' +
    '    <span class="cmg-result-value">' +
    flipsPerPair +
    "</span>" +
    '    <span class="cmg-result-label">Flips / Pair</span>' +
    "  </div>" +
    '  <div class="cmg-result-item">' +
    '    <span class="cmg-result-value">' +
    timeStr +
    "</span>" +
    '    <span class="cmg-result-label">Time</span>' +
    "  </div>" +
    '  <div class="cmg-result-item">' +
    '    <span class="cmg-result-value">' +
    cmgState.maxStreak +
    "</span>" +
    '    <span class="cmg-result-label">Best Streak</span>' +
    "  </div>" +
    "</div>" +
    bonusesHtml +
    (isNewBest
      ? '<div class="cmg-result-new-best">\uD83C\uDFC6 New Personal Best!</div>'
      : "");

  cmgEl("cmgResultBody").innerHTML = bodyHtml;
  cmgShowModal("cmgResultModal");
}

/* ─── Reset to Welcome ─── */
function cmgResetToEmpty() {
  if (cmgState.timerId) {
    clearInterval(cmgState.timerId);
    cmgState.timerId = null;
  }
  cmgState.isRunning = false;
  cmgState.startTime = null;
  cmgEl("cmgActiveGame").classList.add("hidden");
  cmgEl("cmgEmpty").classList.remove("hidden");
  cmgHideMessage();
}

/* ─── Modal Helpers ─── */
function cmgShowModal(id) {
  const el = cmgEl(id);
  if (el) el.classList.remove("hidden");
}

function cmgHideModal(id) {
  const el = cmgEl(id);
  if (el) el.classList.add("hidden");
}

/* ─── Pure Helpers ─── */
function cmgShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function cmgCapitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
