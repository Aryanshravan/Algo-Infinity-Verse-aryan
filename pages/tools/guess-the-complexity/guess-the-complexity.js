/* ============================================
   GUESS THE COMPLEXITY — Mini Game Engine
   All functions prefixed gtc* to avoid
   collisions with legacy bundle globals.
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  gtcInit();
});

/* ─── Code Snippet Pool (37 snippets) ─── */
const gtcSNIPPETS = [
  // ── EASY (12) ──
  {
    id: "e1",
    code: `function getFirst(arr) {\n  return arr[0];\n}`,
    answer: "O(1)",
    difficulty: "easy",
    explanation: "Array access by index is a single memory lookup — constant time regardless of array size.",
  },
  {
    id: "e2",
    code: `function sumArray(arr) {\n  let sum = 0;\n  for (let i = 0; i < arr.length; i++) {\n    sum += arr[i];\n  }\n  return sum;\n}`,
    answer: "O(n)",
    difficulty: "easy",
    explanation: "A single loop that visits each of the n elements exactly once — linear time.",
  },
  {
    id: "e3",
    code: `function binarySearch(arr, target) {\n  let lo = 0, hi = arr.length - 1;\n  while (lo <= hi) {\n    let mid = Math.floor((lo + hi) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}`,
    answer: "O(log n)",
    difficulty: "easy",
    explanation: "Each iteration halves the search space. Binary search on sorted data is O(log n).",
  },
  {
    id: "e4",
    code: `function printAll(arr) {\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = 0; j < arr.length; j++) {\n      console.log(arr[i], arr[j]);\n    }\n  }\n}`,
    answer: "O(n²)",
    difficulty: "easy",
    explanation: "Nested loops over the same input. For each of n outer iterations, the inner loop runs n times — O(n²).",
  },
  {
    id: "e5",
    code: `function mapLookup(map, key) {\n  return map.get(key);\n}`,
    answer: "O(1)",
    difficulty: "easy",
    explanation: "Hash map lookups are O(1) on average. A single get operation is constant time.",
  },
  {
    id: "e6",
    code: `function countDown(n) {\n  while (n > 1) {\n    n = Math.floor(n / 2);\n  }\n  return n;\n}`,
    answer: "O(log n)",
    difficulty: "easy",
    explanation: "The loop divides n by 2 each iteration. The number of iterations is log₂(n) — logarithmic.",
  },
  {
    id: "e7",
    code: `function allPairs(n) {\n  for (let i = 0; i < n; i++) {\n    for (let j = i + 1; j < n; j++) {\n      console.log(i, j);\n    }\n  }\n}`,
    answer: "O(n²)",
    difficulty: "easy",
    explanation: "Nested loops where the inner loop runs n-i-1 times. Summing gives n(n-1)/2 = O(n²).",
  },
  {
    id: "e8",
    code: `function linearSearch(arr, target) {\n  for (let i = 0; i < arr.length; i++) {\n    if (arr[i] === target) return i;\n  }\n  return -1;\n}`,
    answer: "O(n)",
    difficulty: "easy",
    explanation: "In the worst case, you scan the entire array once — linear time O(n).",
  },
  {
    id: "e9",
    code: `function doubleLoop(arr) {\n  for (let i = 0; i < arr.length; i++) {\n    arr[i] *= 2;\n  }\n  for (let i = 0; i < arr.length; i++) {\n    console.log(arr[i]);\n  }\n}`,
    answer: "O(n)",
    difficulty: "easy",
    explanation: "Two independent sequential loops. O(n) + O(n) = O(2n), which simplifies to O(n).",
  },
  {
    id: "e10",
    code: `function pushPop(arr) {\n  arr.push(42);\n  let val = arr.pop();\n  return val;\n}`,
    answer: "O(1)",
    difficulty: "easy",
    explanation: "Array push and pop operations at the end of a dynamic array are O(1) amortized.",
  },
  {
    id: "e11",
    code: `function printPowerSet(n) {\n  for (let i = 0; i < Math.pow(2, n); i++) {\n    console.log(i);\n  }\n}`,
    answer: "O(2ⁿ)",
    difficulty: "easy",
    explanation: "The loop runs 2ⁿ times. Even though it's 'just one loop', the bound is exponential.",
  },
  {
    id: "e12",
    code: `function swap(a, b) {\n  let temp = a;\n  a = b;\n  b = temp;\n  return [a, b];\n}`,
    answer: "O(1)",
    difficulty: "easy",
    explanation: "Three simple assignments — no loops, no input-dependent operations. Constant time.",
  },

  // ── MEDIUM (15) ──
  {
    id: "m1",
    code: `function mergeSort(arr) {\n  if (arr.length <= 1) return arr;\n  let mid = Math.floor(arr.length / 2);\n  let left = mergeSort(arr.slice(0, mid));\n  let right = mergeSort(arr.slice(mid));\n  return merge(left, right);\n}\n\nfunction merge(a, b) {\n  let i = 0, j = 0, res = [];\n  while (i < a.length && j < b.length) {\n    if (a[i] < b[j]) res.push(a[i++]);\n    else res.push(b[j++]);\n  }\n  return res.concat(a.slice(i)).concat(b.slice(j));\n}`,
    answer: "O(n log n)",
    difficulty: "medium",
    explanation: "Merge sort divides the array log n times and merges n elements at each level — O(n log n).",
  },
  {
    id: "m2",
    code: `function fibRecursive(n) {\n  if (n <= 1) return n;\n  return fibRecursive(n - 1) + fibRecursive(n - 2);\n}`,
    answer: "O(2ⁿ)",
    difficulty: "medium",
    explanation: "Each call spawns two more calls, creating a binary recursion tree with 2ⁿ nodes — exponential.",
  },
  {
    id: "m3",
    code: `function fibDP(n) {\n  let dp = [0, 1];\n  for (let i = 2; i <= n; i++) {\n    dp[i] = dp[i - 1] + dp[i - 2];\n  }\n  return dp[n];\n}`,
    answer: "O(n)",
    difficulty: "medium",
    explanation: "A single loop from 2 to n — linear time. The DP array stores computed values to avoid redundant work.",
  },
  {
    id: "m4",
    code: `function subsets(arr) {\n  let result = [[]];\n  for (let num of arr) {\n    let newSubsets = result.map(r => [...r, num]);\n    result.push(...newSubsets);\n  }\n  return result;\n}`,
    answer: "O(2ⁿ)",
    difficulty: "medium",
    explanation: "Each element doubles the number of subsets. The result array grows to size 2ⁿ — exponential.",
  },
  {
    id: "m5",
    code: `function matrixMul(A, B) {\n  let n = A.length;\n  let C = Array.from({ length: n }, () => Array(n).fill(0));\n  for (let i = 0; i < n; i++) {\n    for (let j = 0; j < n; j++) {\n      for (let k = 0; k < n; k++) {\n        C[i][j] += A[i][k] * B[k][j];\n      }\n    }\n  }\n  return C;\n}`,
    answer: "O(n³)",
    difficulty: "medium",
    explanation: "Three nested loops each running n times — O(n × n × n) = O(n³).",
  },
  {
    id: "m6",
    code: `function isPrime(n) {\n  if (n < 2) return false;\n  for (let i = 2; i * i <= n; i++) {\n    if (n % i === 0) return false;\n  }\n  return true;\n}`,
    answer: "O(√n)",
    difficulty: "medium",
    explanation: "The loop runs up to the square root of n. Checking factors only up to √n is optimal.",
  },
  {
    id: "m7",
    code: `function bfs(graph, start) {\n  let visited = new Set();\n  let queue = [start];\n  visited.add(start);\n  while (queue.length) {\n    let node = queue.shift();\n    for (let neighbor of graph[node]) {\n      if (!visited.has(neighbor)) {\n        visited.add(neighbor);\n        queue.push(neighbor);\n      }\n    }\n  }\n}`,
    answer: "O(V + E)",
    difficulty: "medium",
    explanation: "BFS visits each vertex once and explores each edge once. Using an adjacency list, this is O(V + E).",
  },
  {
    id: "m8",
    code: `function permutation(str) {\n  if (str.length <= 1) return [str];\n  let result = [];\n  for (let i = 0; i < str.length; i++) {\n    let char = str[i];\n    let rest = str.slice(0, i) + str.slice(i + 1);\n    for (let perm of permutation(rest)) {\n      result.push(char + perm);\n    }\n  }\n  return result;\n}`,
    answer: "O(n!)",
    difficulty: "medium",
    explanation: "Generating all permutations of n items involves n! recursive calls — factorial complexity.",
  },
  {
    id: "m9",
    code: `function quickSort(arr) {\n  if (arr.length <= 1) return arr;\n  let pivot = arr[0];\n  let left = arr.slice(1).filter(x => x <= pivot);\n  let right = arr.slice(1).filter(x => x > pivot);\n  return [...quickSort(left), pivot, ...quickSort(right)];\n}`,
    answer: "O(n log n)",
    difficulty: "medium",
    explanation: "Average case: each partition takes O(n) and recursion depth is O(log n) — O(n log n). Worst case is O(n²).",
  },
  {
    id: "m10",
    code: `function slidingMax(nums, k) {\n  let result = [];\n  let deque = [];\n  for (let i = 0; i < nums.length; i++) {\n    while (deque.length && nums[deque[deque.length - 1]] <= nums[i]) {\n      deque.pop();\n    }\n    deque.push(i);\n    if (deque[0] <= i - k) deque.shift();\n    if (i >= k - 1) result.push(nums[deque[0]]);\n  }\n  return result;\n}`,
    answer: "O(n)",
    difficulty: "medium",
    explanation: "Each element is pushed and popped from the deque at most once. The monotonic deque ensures O(n) total.",
  },
  {
    id: "m11",
    code: `function intersectSorted(a, b) {\n  let i = 0, j = 0, res = [];\n  while (i < a.length && j < b.length) {\n    if (a[i] === b[j]) { res.push(a[i]); i++; j++; }\n    else if (a[i] < b[j]) i++;\n    else j++;\n  }\n  return res;\n}`,
    answer: "O(n)",
    difficulty: "medium",
    explanation: "Two pointers traverse each array once. Each element is visited at most once — O(n + m) = O(n).",
  },
  {
    id: "m12",
    code: `function longestPalindrome(s) {\n  let n = s.length;\n  let dp = Array.from({ length: n }, () => Array(n).fill(false));\n  let start = 0, maxLen = 1;\n  for (let i = 0; i < n; i++) dp[i][i] = true;\n  for (let len = 2; len <= n; len++) {\n    for (let i = 0; i <= n - len; i++) {\n      let j = i + len - 1;\n      if (s[i] === s[j] && (len === 2 || dp[i + 1][j - 1])) {\n        dp[i][j] = true;\n        if (len > maxLen) { start = i; maxLen = len; }\n      }\n    }\n  }\n  return s.slice(start, start + maxLen);\n}`,
    answer: "O(n²)",
    difficulty: "medium",
    explanation: "Filling an n×n DP table with nested loops. Each cell is computed in O(1) — total O(n²).",
  },
  {
    id: "m13",
    code: `function kthSmallestSorted(mat, k) {\n  let lo = mat[0][0], hi = mat[mat.length - 1][mat[0].length - 1];\n  while (lo < hi) {\n    let mid = Math.floor((lo + hi) / 2);\n    let count = 0;\n    for (let row of mat) {\n      for (let val of row) {\n        if (val <= mid) count++;\n      }\n    }\n    if (count < k) lo = mid + 1;\n    else hi = mid;\n  }\n  return lo;\n}`,
    answer: "O(n² log m)",
    difficulty: "medium",
    explanation: "Binary search on answer (log m) with an O(n²) counting pass each iteration — O(n² log m).",
  },
  {
    id: "m14",
    code: `function twoSumSorted(arr, target) {\n  let left = 0, right = arr.length - 1;\n  while (left < right) {\n    let sum = arr[left] + arr[right];\n    if (sum === target) return [left, right];\n    if (sum < target) left++;\n    else right--;\n  }\n  return [-1, -1];\n}`,
    answer: "O(n)",
    difficulty: "medium",
    explanation: "Two-pointer technique on a sorted array. Each pointer moves at most n steps — O(n).",
  },
  {
    id: "m15",
    code: `function buildTreeHeight(n) {\n  let height = 0;\n  let nodes = 1;\n  while (nodes <= n) {\n    nodes *= 2;\n    height++;\n  }\n  return height;\n}`,
    answer: "O(log n)",
    difficulty: "medium",
    explanation: "Doubling the node count each iteration. The number of iterations is log₂(n) — logarithmic.",
  },

  // ── HARD (10) ──
  {
    id: "h1",
    code: `function permutationsWithDups(str) {\n  let result = [];\n  function backtrack(path, used) {\n    if (path.length === str.length) {\n      result.push(path);\n      return;\n    }\n    let seen = new Set();\n    for (let i = 0; i < str.length; i++) {\n      if (used[i] || seen.has(str[i])) continue;\n      seen.add(str[i]);\n      used[i] = true;\n      backtrack(path + str[i], used);\n      used[i] = false;\n    }\n  }\n  backtrack("", Array(str.length).fill(false));\n  return result;\n}`,
    answer: "O(n!)",
    difficulty: "hard",
    explanation: "Permutations with pruning still explores up to n! paths in the worst case (all unique chars).",
  },
  {
    id: "h2",
    code: `function dijkstra(graph, start) {\n  let dist = {};\n  let pq = [[0, start]];\n  for (let v in graph) dist[v] = Infinity;\n  dist[start] = 0;\n  while (pq.length) {\n    pq.sort((a, b) => a[0] - b[0]);\n    let [d, u] = pq.shift();\n    if (d > dist[u]) continue;\n    for (let [v, w] of graph[u]) {\n      if (dist[u] + w < dist[v]) {\n        dist[v] = dist[u] + w;\n        pq.push([dist[v], v]);\n      }\n    }\n  }\n  return dist;\n}`,
    answer: "O(V²)",
    difficulty: "hard",
    explanation: "Using an unsorted priority queue (array sort + shift), each iteration takes O(V). Total: O(V²).",
  },
  {
    id: "h3",
    code: `function floydWarshall(graph) {\n  let n = graph.length;\n  let dist = graph.map(row => [...row]);\n  for (let k = 0; k < n; k++) {\n    for (let i = 0; i < n; i++) {\n      for (let j = 0; j < n; j++) {\n        if (dist[i][k] + dist[k][j] < dist[i][j]) {\n          dist[i][j] = dist[i][k] + dist[k][j];\n        }\n      }\n    }\n  }\n  return dist;\n}`,
    answer: "O(n³)",
    difficulty: "hard",
    explanation: "Three nested loops each over n vertices. Floyd-Warshall is O(V³) for all-pairs shortest paths.",
  },
  {
    id: "h4",
    code: `function solveNQueens(n) {\n  let results = [];\n  function backtrack(board, row, cols, diag1, diag2) {\n    if (row === n) { results.push(board.map(r => r.join(""))); return; }\n    for (let col = 0; col < n; col++) {\n      if (cols.has(col) || diag1.has(row + col) || diag2.has(row - col)) continue;\n      board[row][col] = "Q";\n      cols.add(col); diag1.add(row + col); diag2.add(row - col);\n      backtrack(board, row + 1, cols, diag1, diag2);\n      board[row][col] = ".";\n      cols.delete(col); diag1.delete(row + col); diag2.delete(row - col);\n    }\n  }\n  backtrack(Array.from({ length: n }, () => Array(n).fill(".")), 0, new Set(), new Set(), new Set());\n  return results;\n}`,
    answer: "O(n!)",
    difficulty: "hard",
    explanation: "The n-queens problem explores n! configurations with pruning. The first row has n choices, next has n-1, etc.",
  },
  {
    id: "h5",
    code: `function matrixChainOrder(p) {\n  let n = p.length - 1;\n  let dp = Array.from({ length: n }, () => Array(n).fill(0));\n  for (let len = 2; len <= n; len++) {\n    for (let i = 0; i <= n - len; i++) {\n      let j = i + len - 1;\n      dp[i][j] = Infinity;\n      for (let k = i; k < j; k++) {\n        let cost = dp[i][k] + dp[k + 1][j] + p[i] * p[k + 1] * p[j + 1];\n        if (cost < dp[i][j]) dp[i][j] = cost;\n      }\n    }\n  }\n  return dp[0][n - 1];\n}`,
    answer: "O(n³)",
    difficulty: "hard",
    explanation: "Three nested loops: len (O(n)), i (O(n)), k (O(n)) — matrix chain multiplication is O(n³).",
  },
  {
    id: "h6",
    code: `function countSubarraysWithSum(arr, k) {\n  let count = 0, sum = 0;\n  let map = new Map();\n  map.set(0, 1);\n  for (let num of arr) {\n    sum += num;\n    if (map.has(sum - k)) count += map.get(sum - k);\n    map.set(sum, (map.get(sum) || 0) + 1);\n  }\n  return count;\n}`,
    answer: "O(n)",
    difficulty: "hard",
    explanation: "Single pass using prefix sums and a hash map. Each operation is O(1) — total linear time.",
  },
  {
    id: "h7",
    code: `function buildSegmentTree(arr) {\n  let n = arr.length;\n  let tree = Array(4 * n).fill(0);\n  function build(node, start, end) {\n    if (start === end) {\n      tree[node] = arr[start];\n    } else {\n      let mid = Math.floor((start + end) / 2);\n      build(2 * node, start, mid);\n      build(2 * node + 1, mid + 1, end);\n      tree[node] = tree[2 * node] + tree[2 * node + 1];\n    }\n  }\n  build(1, 0, n - 1);\n  return tree;\n}`,
    answer: "O(n)",
    difficulty: "hard",
    explanation: "The build function visits each of the 2n-1 nodes in the segment tree exactly once — O(n).",
  },
  {
    id: "h8",
    code: `function kmpSearch(text, pattern) {\n  function buildLPS(p) {\n    let lps = [0], len = 0, i = 1;\n    while (i < p.length) {\n      if (p[i] === p[len]) { len++; lps[i] = len; i++; }\n      else if (len > 0) len = lps[len - 1];\n      else { lps[i] = 0; i++; }\n    }\n    return lps;\n  }\n  let lps = buildLPS(pattern);\n  let i = 0, j = 0, result = [];\n  while (i < text.length) {\n    if (text[i] === pattern[j]) { i++; j++; }\n    if (j === pattern.length) { result.push(i - j); j = lps[j - 1]; }\n    else if (i < text.length && text[i] !== pattern[j]) {\n      if (j > 0) j = lps[j - 1];\n      else i++;\n    }\n  }\n  return result;\n}`,
    answer: "O(n + m)",
    difficulty: "hard",
    explanation: "KMP builds the LPS array in O(m) and scans text in O(n). Each pointer moves forward without backtracking — O(n + m).",
  },
  {
    id: "h9",
    code: `function sqrtApprox(n) {\n  if (n < 2) return n;\n  let lo = 0, hi = n, ans = 0;\n  while (lo <= hi) {\n    let mid = Math.floor((lo + hi) / 2);\n    if (mid * mid <= n) {\n      ans = mid;\n      lo = mid + 1;\n    } else {\n      hi = mid - 1;\n    }\n  }\n  return ans;\n}`,
    answer: "O(log n)",
    difficulty: "hard",
    explanation: "Binary search on the range [0, n]. Each step halves the search space — O(log n).",
  },
  {
    id: "h10",
    code: `function editDistance(w1, w2) {\n  let m = w1.length, n = w2.length;\n  let dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));\n  for (let i = 0; i <= m; i++) dp[i][0] = i;\n  for (let j = 0; j <= n; j++) dp[0][j] = j;\n  for (let i = 1; i <= m; i++) {\n    for (let j = 1; j <= n; j++) {\n      if (w1[i - 1] === w2[j - 1]) {\n        dp[i][j] = dp[i - 1][j - 1];\n      } else {\n        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);\n      }\n    }\n  }\n  return dp[m][n];\n}`,
    answer: "O(m × n)",
    difficulty: "hard",
    explanation: "Filling an (m+1)×(n+1) DP table with nested loops — O(m × n) time and space.",
  },
];

/* ─── All complexity strings for answer options ─── */
const gtcALL_COMPLEXITIES = [
  "O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(n³)",
  "O(2ⁿ)", "O(n!)", "O(√n)", "O(V + E)", "O(m × n)", "O(n + m)", "O(n² log m)",
];

/* ─── DOM shorthand ─── */
const gtcEl = (id) => document.getElementById(id);

/* ─── Game State ─── */
let gtcState = {
  queue: [],
  index: 0,
  score: 0,
  correct: 0,
  total: 0,
  streak: 0,
  maxStreak: 0,
  timerOn: false,
  timerId: null,
  timeLeft: 15,
  answered: false,
  difficulty: "easy",
  roundSize: 10,
  breakdown: { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } },
  xpEarned: 0,
};

const gtcSTORAGE_KEY = "algoInfinityVerse";

/* ─── Initialise ─── */
function gtcInit() {
  gtcLoadHighScore();
  gtcRenderStats();

  // Start Game
  gtcEl("gtcStartBtn").addEventListener("click", gtcStartGame);
  gtcEl("gtcHowBtn").addEventListener("click", () => gtcShowModal("gtcHowModal"));
  gtcEl("gtcHowCloseBtn").addEventListener("click", () => gtcHideModal("gtcHowModal"));
  gtcEl("gtcNextBtn").addEventListener("click", gtcNextQuestion);
  gtcEl("gtcPlayAgainBtn").addEventListener("click", () => {
    gtcHideModal("gtcResultModal");
    gtcStartGame();
  });
  gtcEl("gtcCloseResultBtn").addEventListener("click", () => {
    gtcHideModal("gtcResultModal");
    gtcResetToEmpty();
  });

  // Difficulty chips
  document.querySelectorAll("#gtcDifficultyChips .gtc-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      if (gtcState.total > 0 && gtcState.index < gtcState.total) return;
      document.querySelectorAll("#gtcDifficultyChips .gtc-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      gtcState.difficulty = chip.dataset.difficulty;
    });
  });

  // Round-size chips
  document.querySelectorAll("#gtcCountChips .gtc-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      if (gtcState.total > 0 && gtcState.index < gtcState.total) return;
      document.querySelectorAll("#gtcCountChips .gtc-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      gtcState.roundSize = parseInt(chip.dataset.count, 10);
    });
  });

  // Timer toggle
  gtcEl("gtcTimerToggle").addEventListener("click", () => {
    if (gtcState.total > 0 && gtcState.index < gtcState.total) return;
    const btn = gtcEl("gtcTimerToggle");
    const isOn = btn.getAttribute("aria-checked") === "true";
    btn.setAttribute("aria-checked", !isOn);
    btn.querySelector(".gtc-toggle-label").textContent = isOn ? "Off" : "On";
    gtcState.timerOn = !isOn;
  });

  // Close modals on backdrop click
  document.querySelectorAll(".gtc-modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.add("hidden");
    });
  });
}

/* ─── Start Game ─── */
function gtcStartGame() {
  let pool;
  if (gtcState.difficulty === "mixed") {
    pool = [...gtcSNIPPETS];
  } else {
    pool = gtcSNIPPETS.filter((s) => s.difficulty === gtcState.difficulty);
    if (pool.length === 0) pool = [...gtcSNIPPETS];
  }

  gtcState.queue = gtcShuffle(pool).slice(0, Math.min(gtcState.roundSize, pool.length));
  gtcState.index = 0;
  gtcState.score = 0;
  gtcState.correct = 0;
  gtcState.total = gtcState.queue.length;
  gtcState.streak = 0;
  gtcState.maxStreak = 0;
  gtcState.xpEarned = 0;
  gtcState.breakdown = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } };
  clearInterval(gtcState.timerId);
  gtcState.timerId = null;

  gtcEl("gtcEmpty").classList.add("hidden");
  gtcEl("gtcActiveGame").classList.remove("hidden");
  gtcEl("gtcResultModal").classList.add("hidden");

  gtcRenderStats();
  gtcRenderProgress();
  gtcShowQuestion();
}

/* ─── Show Question ─── */
function gtcShowQuestion() {
  if (gtcState.index >= gtcState.total) {
    gtcEndGame();
    return;
  }

  gtcState.answered = false;
  const q = gtcState.queue[gtcState.index];

  const diffEl = gtcEl("gtcCodeDifficulty");
  diffEl.textContent = gtcCapitalize(q.difficulty);
  diffEl.dataset.difficulty = q.difficulty;

  gtcEl("gtcCodeContent").textContent = q.code;

  if (gtcState.timerOn) {
    gtcState.timeLeft = gtcState.difficulty === "hard" ? 20 : 15;
    gtcEl("gtcTimerDisplay").textContent = gtcState.timeLeft;
    gtcEl("gtcCodeTimer").classList.remove("hidden", "gtc-timer-warning", "gtc-timer-danger");
    gtcStartTimer();
  } else {
    gtcEl("gtcTimerDisplay").textContent = "\u221E";
    gtcEl("gtcCodeTimer").classList.remove("gtc-timer-warning", "gtc-timer-danger");
    clearInterval(gtcState.timerId);
    gtcState.timerId = null;
  }

  gtcRenderOptions(q.answer);
  gtcEl("gtcFeedback").classList.add("hidden");
  gtcEl("gtcNextBtn").classList.add("hidden");
  gtcRenderProgress();
  gtcRenderStats();
}

/* ─── Render Options ─── */
function gtcRenderOptions(correctAnswer) {
  const container = gtcEl("gtcOptions");
  container.innerHTML = "";

  const others = gtcALL_COMPLEXITIES.filter((c) => c !== correctAnswer);
  const picked = gtcShuffle(others).slice(0, 3);
  const options = gtcShuffle([correctAnswer, ...picked]);

  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gtc-option-btn";
    btn.textContent = opt;
    btn.dataset.value = opt;
    btn.addEventListener("click", () => gtcHandleAnswer(opt, correctAnswer, btn));
    container.appendChild(btn);
  });
}

/* ─── Handle Answer ─── */
function gtcHandleAnswer(selected, correct, clickedBtn) {
  if (gtcState.answered) return;
  gtcState.answered = true;
  clearInterval(gtcState.timerId);
  gtcState.timerId = null;

  const buttons = document.querySelectorAll(".gtc-option-btn");
  const q = gtcState.queue[gtcState.index];
  const isCorrect = selected === correct;

  buttons.forEach((btn) => { btn.disabled = true; });
  buttons.forEach((btn) => {
    if (btn.dataset.value === correct) btn.classList.add("gtc-option-correct");
    if (btn === clickedBtn && !isCorrect) btn.classList.add("gtc-option-wrong");
  });

  let points = 0;
  if (isCorrect) {
    gtcState.streak++;
    gtcState.correct++;
    if (gtcState.streak > gtcState.maxStreak) gtcState.maxStreak = gtcState.streak;
    points = 10;
    if (gtcState.streak >= 3) points += 5;
    if (gtcState.streak >= 5) points += 5;
    if (gtcState.timerOn) points += Math.max(0, Math.floor(gtcState.timeLeft / 3));
    gtcState.score += points;
  } else {
    gtcState.streak = 0;
  }

  const diff = q.difficulty;
  gtcState.breakdown[diff].total++;
  if (isCorrect) gtcState.breakdown[diff].correct++;

  gtcState.xpEarned += isCorrect ? Math.max(5, points) : 0;

  gtcShowFeedback(isCorrect, q.explanation, points);
  gtcRenderStats();
}

/* ─── Show Feedback ─── */
function gtcShowFeedback(isCorrect, explanation, points) {
  const el = gtcEl("gtcFeedback");
  el.classList.remove("hidden");

  if (isCorrect) {
    gtcEl("gtcFeedbackIcon").textContent = "";
    gtcEl("gtcFeedbackTitle").textContent = "Correct!" + (points > 10 ? " +" + points + " pts" : "");
    gtcEl("gtcFeedbackText").textContent = gtcState.streak >= 3
      ? gtcState.streak + " in a row!"
      : "Nice intuition!";
  } else {
    gtcEl("gtcFeedbackIcon").textContent = "";
    gtcEl("gtcFeedbackTitle").textContent = "Not quite";
    gtcEl("gtcFeedbackText").textContent = "Check the explanation below.";
  }

  gtcEl("gtcFeedbackExplanation").textContent = explanation;
  gtcEl("gtcNextBtn").classList.remove("hidden");
}

/* ─── Next Question ─── */
function gtcNextQuestion() {
  gtcState.index++;
  if (gtcState.index >= gtcState.total) {
    gtcEndGame();
  } else {
    gtcShowQuestion();
  }
}

/* ─── Timer ─── */
function gtcStartTimer() {
  clearInterval(gtcState.timerId);
  gtcState.timerId = setInterval(() => {
    gtcState.timeLeft--;
    gtcEl("gtcTimerDisplay").textContent = gtcState.timeLeft;

    if (gtcState.timeLeft <= 5) {
      gtcEl("gtcCodeTimer").classList.add("gtc-timer-danger");
      gtcEl("gtcCodeTimer").classList.remove("gtc-timer-warning");
    } else if (gtcState.timeLeft <= 8) {
      gtcEl("gtcCodeTimer").classList.add("gtc-timer-warning");
      gtcEl("gtcCodeTimer").classList.remove("gtc-timer-danger");
    }

    if (gtcState.timeLeft <= 0) {
      clearInterval(gtcState.timerId);
      gtcState.timerId = null;
      if (!gtcState.answered) {
        const q = gtcState.queue[gtcState.index];
        const buttons = document.querySelectorAll(".gtc-option-btn");
        buttons.forEach((btn) => {
          btn.disabled = true;
          if (btn.dataset.value === q.answer) btn.classList.add("gtc-option-correct");
        });
        gtcState.answered = true;
        gtcState.streak = 0;
        gtcState.breakdown[q.difficulty].total++;
        gtcShowFeedback(false, q.explanation + " (Time's up!)", 0);
        gtcRenderStats();
      }
    }
  }, 1000);
}

/* ─── End Game ─── */
function gtcEndGame() {
  clearInterval(gtcState.timerId);
  gtcState.timerId = null;

  const prevHigh = gtcGetHighScore();
  const isNewBest = gtcState.score > prevHigh;
  if (isNewBest) gtcSaveHighScore(gtcState.score);
  gtcSaveToUserProgress();
  gtcLoadHighScore();
  gtcShowResultModal(isNewBest);
}

/* ─── Show Results Modal ─── */
function gtcShowResultModal(isNewBest) {
  const accuracy = gtcState.total > 0 ? Math.round((gtcState.correct / gtcState.total) * 100) : 0;

  let grade = "Good effort!";
  if (accuracy >= 90) { grade = "Complexity Master!"; }
  else if (accuracy >= 70) { grade = "Strong intuition!"; }
  else if (accuracy >= 50) { grade = "Getting there!"; }

  gtcEl("gtcResultTitle").textContent = grade;

  gtcEl("gtcResultBody").innerHTML = [
    '<div class="gtc-result-grid">',
    '  <div class="gtc-result-item gtc-result-highlight">',
    '    <span class="gtc-result-value gtc-result-score">' + gtcState.score + '</span>',
    '    <span class="gtc-result-label">Score</span>',
    '  </div>',
    '  <div class="gtc-result-item gtc-result-highlight">',
    '    <span class="gtc-result-value gtc-result-xp">+' + gtcState.xpEarned + '</span>',
    '    <span class="gtc-result-label">XP Earned</span>',
    '  </div>',
    '  <div class="gtc-result-item">',
    '    <span class="gtc-result-value">' + gtcState.correct + '/' + gtcState.total + '</span>',
    '    <span class="gtc-result-label">Correct</span>',
    '  </div>',
    '  <div class="gtc-result-item">',
    '    <span class="gtc-result-value">' + accuracy + '%</span>',
    '    <span class="gtc-result-label">Accuracy</span>',
    '  </div>',
    '  <div class="gtc-result-item">',
    '    <span class="gtc-result-value">' + gtcState.maxStreak + '</span>',
    '    <span class="gtc-result-label">Best Streak</span>',
    '  </div>',
    '  <div class="gtc-result-item">',
    '    <span class="gtc-result-value">' + gtcState.queue.length + '</span>',
    '    <span class="gtc-result-label">Questions</span>',
    '  </div>',
    '</div>',
    (isNewBest ? '<div class="gtc-result-new-best">New Personal Best!</div>' : ""),
    '<div class="gtc-result-breakdown">',
    '  <div class="gtc-result-breakdown-title">Difficulty Breakdown</div>',
    gtcBuildBreakdownHTML(),
    '</div>',
  ].join("");

  gtcShowModal("gtcResultModal");
}

function gtcBuildBreakdownHTML() {
  var html = "";
  ["easy", "medium", "hard"].forEach(function (diff) {
    var bd = gtcState.breakdown[diff];
    var pct = bd.total > 0 ? Math.round((bd.correct / bd.total) * 100) : 0;
    var label = gtcCapitalize(diff);
    html += '<div class="gtc-bd-row">'
      + '<span class="gtc-bd-label">' + label + '</span>'
      + '<div class="gtc-bd-bar"><div class="gtc-bd-fill gtc-bd-' + diff + '" style="width:' + pct + '%"></div></div>'
      + '<span class="gtc-bd-label" style="min-width:48px;text-align:right;">' + bd.correct + '/' + bd.total + '</span>'
      + '</div>';
  });
  return html;
}

/* ─── Render Stats ─── */
function gtcRenderStats() {
  var acc = gtcState.total > 0 ? Math.round((gtcState.correct / gtcState.total) * 100) : 0;
  gtcEl("gtcScore").textContent = gtcState.score;
  gtcEl("gtcCorrect").textContent = gtcState.correct;
  gtcEl("gtcStreak").textContent = gtcState.streak;
  gtcEl("gtcTotal").textContent = gtcState.total;
  gtcEl("gtcAccuracy").textContent = acc + "%";
}

/* ─── Render Progress ─── */
function gtcRenderProgress() {
  var pct = gtcState.total > 0 ? ((gtcState.index) / gtcState.total) * 100 : 0;
  gtcEl("gtcProgressFill").style.width = pct + "%";
  gtcEl("gtcProgressText").textContent = (gtcState.index + 1) + " / " + gtcState.total;
}

/* ─── High Score (localStorage) ─── */
function gtcGetHighScore() {
  try {
    var data = JSON.parse(localStorage.getItem(gtcSTORAGE_KEY) || "{}");
    return (data.stats && data.stats.guessComplexityBest) || 0;
  } catch (e) { return 0; }
}

function gtcSaveHighScore(score) {
  try {
    var data = JSON.parse(localStorage.getItem(gtcSTORAGE_KEY) || "{}");
    if (!data.stats) data.stats = {};
    if (!data.stats.guessComplexityBest || score > data.stats.guessComplexityBest) {
      data.stats.guessComplexityBest = score;
      localStorage.setItem(gtcSTORAGE_KEY, JSON.stringify(data));
    }
  } catch (e) { /* ignore */ }
}

function gtcLoadHighScore() {
  gtcEl("gtcHighScore").textContent = gtcGetHighScore();
}

function gtcSaveToUserProgress() {
  var xp = gtcState.xpEarned;
  if (typeof window.addXP === "function") {
    window.addXP(xp, "guess-complexity", { score: gtcState.score });
  }
}

/* ─── Reset to Welcome State ─── */
function gtcResetToEmpty() {
  gtcEl("gtcActiveGame").classList.add("hidden");
  gtcEl("gtcEmpty").classList.remove("hidden");
  // Keep score/correct/streak visible — don't reset them. The next
  // gtcStartGame() call will wipe them when a new round begins.
  // But reset total so the chip-change guard unblocks (total > 0 check).
  gtcState.index = 0;
  gtcState.total = 0;
  gtcState.answered = false;
  clearInterval(gtcState.timerId);
  gtcState.timerId = null;
  // Don't call gtcRenderStats() here — it would overwrite the counters with 0.
}

/* ─── Modal Helpers ─── */
function gtcShowModal(id) {
  var el = gtcEl(id);
  if (el) el.classList.remove("hidden");
}

function gtcHideModal(id) {
  var el = gtcEl(id);
  if (el) el.classList.add("hidden");
}

/* ─── Pure Helpers ─── */
function gtcShuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function gtcCapitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
