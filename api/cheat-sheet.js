/**
 * POST /api/cheat-sheet
 * Generates structured, customizable cheat sheet content for selected DSA topics,
 * weak areas, time/space complexities, multi-language code templates, mnemonics,
 * common pitfalls, edge cases, and personal notes.
 */

export const TOPIC_CATALOG = {
  arrays: {
    id: 'arrays',
    name: 'Arrays & Two Pointers',
    category: 'Linear Data Structures',
    icon: '📊',
    complexity: {
      access: 'O(1)',
      search: 'O(n) [Unsorted] / O(log n) [Binary Search]',
      insert: 'O(1) End / O(n) Middle',
      delete: 'O(1) End / O(n) Middle',
      space: 'O(n)',
    },
    codeTemplates: {
      javascript: `// Two Pointers — In-Place Reverse / Pair Search
function twoPointers(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) return [left, right];
    else if (sum < target) left++;
    else right--;
  }
  return [-1, -1];
}

// Sliding Window (Fixed / Dynamic Size)
function maxSubarraySum(arr, k) {
  let maxSum = 0, windowSum = 0;
  for (let i = 0; i < arr.length; i++) {
    windowSum += arr[i];
    if (i >= k - 1) {
      maxSum = Math.max(maxSum, windowSum);
      windowSum -= arr[i - (k - 1)];
    }
  }
  return maxSum;
}`,
      python: `# Two Pointers
def two_pointers(arr, target):
    left, right = 0, len(arr) - 1
    while left < right:
        curr = arr[left] + arr[right]
        if curr == target: return [left, right]
        elif curr < target: left += 1
        else: right -= 1
    return [-1, -1]

# Sliding Window
def max_subarray_sum(arr, k):
    max_sum = window_sum = sum(arr[:k])
    for i in range(k, len(arr)):
        window_sum += arr[i] - arr[i - k]
        max_sum = max(max_sum, window_sum)
    return max_sum`,
      cpp: `// Two Pointers in C++
vector<int> twoPointers(vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left < right) {
        int sum = arr[left] + arr[right];
        if (sum == target) return {left, right};
        if (sum < target) left++;
        else right--;
    }
    return {-1, -1};
}`,
      java: `// Two Pointers in Java
public int[] twoPointers(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left < right) {
        int sum = arr[left] + arr[right];
        if (sum == target) return new int[]{left, right};
        if (sum < target) left++;
        else right--;
    }
    return new int[]{-1, -1};
}`,
    },
    mnemonics: [
      '2-POINTERS: Opposite ends for sorted arrays/palindromes; Same direction for fast/slow pointers.',
      'SLIDING WINDOW: Fixed size = add & shrink; Variable size = expand until invalid then contract left.',
    ],
    pitfalls: [
      'Off-by-one errors on loop indices (arr.length vs arr.length - 1).',
      'Mutating original array when non-mutating copy is expected.',
      'Out-of-bounds access on empty or single-element inputs.',
    ],
    edgeCases: [
      'Empty array [] or null pointer.',
      'Single element array [x].',
      'Array with duplicates or all identical elements.',
      'Large numbers causing integer overflow in sum calculations.',
    ],
  },

  strings: {
    id: 'strings',
    name: 'Strings & Pattern Matching',
    category: 'Linear Data Structures',
    icon: '🔤',
    complexity: {
      access: 'O(1)',
      search: 'O(n*m) Naive / O(n + m) KMP / O(n) Rabin-Karp',
      concat: 'O(n)',
      space: 'O(n)',
    },
    codeTemplates: {
      javascript: `// Longest Substring Without Repeating Characters (Sliding Window + Hash Map)
function lengthOfLongestSubstring(s) {
  let map = new Map(), maxLen = 0, left = 0;
  for (let right = 0; right < s.length; right++) {
    if (map.has(s[right])) {
      left = Math.max(left, map.get(s[right]) + 1);
    }
    map.set(s[right], right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`,
      python: `def length_of_longest_substring(s: str) -> int:
    char_map = {}
    max_len = left = 0
    for right, char in enumerate(s):
        if char in char_map:
            left = max(left, char_map[char] + 1)
        char_map[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len`,
      cpp: `int lengthOfLongestSubstring(string s) {
    vector<int> dict(256, -1);
    int maxLen = 0, start = -1;
    for (int i = 0; i < s.length(); i++) {
        if (dict[s[i]] > start) start = dict[s[i]];
        dict[s[i]] = i;
        maxLen = max(maxLen, i - start);
    }
    return maxLen;
}`,
      java: `public int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> map = new HashMap<>();
    int maxLen = 0, left = 0;
    for (int right = 0; right < s.length(); right++) {
        if (map.containsKey(s.charAt(right))) {
            left = Math.max(left, map.get(s.charAt(right)) + 1);
        }
        map.put(s.charAt(right), right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}`,
    },
    mnemonics: [
      'FREQUENCY MAP: Count char frequencies with array of size 26 (lowercase) or 256 (ASCII).',
      'KMP PREFIX TABLE (LPS): Longest proper Prefix which is also Suffix.',
    ],
    pitfalls: [
      'In JavaScript/Java, string primitives are immutable; repetitive string concatenation inside loops creates O(n^2) garbage.',
      'Character encoding assumptions (Unicode / UTF-16 surrogate pairs).',
    ],
    edgeCases: [
      "Empty string ''",
      "Single character 'a'",
      "String with all same characters 'aaaaa'",
      'Case sensitivity & whitespace handling requirements',
    ],
  },

  linkedlist: {
    id: 'linkedlist',
    name: 'Linked List Operations',
    category: 'Linear Data Structures',
    icon: '🔗',
    complexity: {
      access: 'O(n)',
      search: 'O(n)',
      insertHead: 'O(1)',
      insertTail: 'O(1) [with tail pointer]',
      deleteHead: 'O(1)',
      space: 'O(n)',
    },
    codeTemplates: {
      javascript: `// In-Place Reversal of Linked List
function reverseList(head) {
  let prev = null, curr = head;
  while (curr !== null) {
    let nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }
  return prev;
}

// Fast & Slow Pointers (Cycle Detection - Floyd's Tortoise and Hare)
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}`,
      python: `def reverse_list(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev

def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast: return True
    return False`,
      cpp: `ListNode* reverseList(ListNode* head) {
    ListNode *prev = nullptr, *curr = head;
    while (curr) {
        ListNode* nextTemp = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nextTemp;
    }
    return prev;
}`,
      java: `public ListNode reverseList(ListNode head) {
    ListNode prev = null, curr = head;
    while (curr != null) {
        ListNode nextTemp = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nextTemp;
    }
    return prev;
}`,
    },
    mnemonics: [
      'DUMMY NODE: Always attach dummy head (`dummy.next = head`) to handle head deletion smoothly.',
      'TORTOISE & HARE: Slow moves 1 step, Fast moves 2 steps. Meets at cycle!',
    ],
    pitfalls: [
      'Losing reference to remainder of linked list when overwriting `.next`.',
      'NullPointerExceptions when attempting to read `fast.next.next` without checking `fast.next`.',
    ],
    edgeCases: [
      'Null head `head == null`',
      'Single node `head.next == null`',
      'Cyclic linked list where tail points back to head/middle',
    ],
  },

  trees: {
    id: 'trees',
    name: 'Binary Trees & BST',
    category: 'Non-Linear Data Structures',
    icon: '🌳',
    complexity: {
      searchBST: 'O(log n) Avg / O(n) Degenerate',
      insertBST: 'O(log n) Avg / O(n) Degenerate',
      traversal: 'O(n) DFS & BFS',
      space: 'O(h) Stack depth / O(w) Queue width',
    },
    codeTemplates: {
      javascript: `// DFS Traversals (Recursive)
function inorder(root, res = []) {
  if (!root) return res;
  inorder(root.left, res);
  res.push(root.val); // Sorted order for BST!
  inorder(root.right, res);
  return res;
}

// BFS Level Order Traversal
function levelOrder(root) {
  if (!root) return [];
  const result = [], queue = [root];
  while (queue.length) {
    const levelSize = queue.length, currentLevel = [];
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      currentLevel.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(currentLevel);
  }
  return result;
}`,
      python: `def inorder(root, res=None):
    if res is None: res = []
    if not root: return res
    inorder(root.left, res)
    res.append(root.val)
    inorder(root.right, res)
    return res

def level_order(root):
    if not root: return []
    res, queue = [], collections.deque([root])
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left: queue.append(node.left)
            if node.right: queue.append(node.right)
        res.append(level)
    return res`,
      cpp: `vector<vector<int>> levelOrder(TreeNode* root) {
    if (!root) return {};
    vector<vector<int>> res;
    queue<TreeNode*> q; q.push(root);
    while (!q.empty()) {
        int sz = q.size();
        vector<int> level;
        for (int i = 0; i < sz; i++) {
            TreeNode* curr = q.front(); q.pop();
            level.push_back(curr->val);
            if (curr->left) q.push(curr->left);
            if (curr->right) q.push(curr->right);
        }
        res.push_back(level);
    }
    return res;
}`,
      java: `public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> res = new ArrayList<>();
    if (root == null) return res;
    Queue<TreeNode> q = new LinkedList<>(); q.add(root);
    while (!q.isEmpty()) {
        int sz = q.size();
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < sz; i++) {
            TreeNode curr = q.poll();
            level.add(curr.val);
            if (curr.left != null) q.add(curr.left);
            if (curr.right != null) q.add(curr.right);
        }
        res.add(level);
    }
    return res;
}`,
    },
    mnemonics: [
      'INORDER BST = SORTED ARRAY: Left -> Root -> Right yields monotonically increasing sequence.',
      'BFS = QUEUE, DFS = STACK/RECURSION.',
    ],
    pitfalls: [
      'Assuming BST property valid only by checking immediate child (must pass min/max boundaries downstream).',
      'Call stack overflow on skewed degenerate tree of depth 10^5.',
    ],
    edgeCases: [
      'Empty tree `root == null`',
      'Single node tree (leaf node)',
      'Unbalanced skewed tree (linked list structure)',
      'Tree with negative node values',
    ],
  },

  graphs: {
    id: 'graphs',
    name: 'Graphs & Network Traversal',
    category: 'Non-Linear Data Structures',
    icon: '🕸️',
    complexity: {
      bfsDfs: 'O(V + E) Time, O(V) Space',
      dijkstra: 'O((V + E) log V) with Min-Heap',
      topologicalSort: "O(V + E) Kahn's BFS / DFS",
      unionFind: 'O(α(N)) amortized with path compression',
    },
    codeTemplates: {
      javascript: `// BFS Shortest Path / Level Traversal
function graphBFS(graph, start) {
  const visited = new Set([start]), queue = [start];
  while (queue.length) {
    const node = queue.shift();
    for (const neighbor of (graph[node] || [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
}

// Disjoint Set Union (DSU) with Path Compression & Rank
class DSU {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }
  find(i) {
    if (this.parent[i] === i) return i;
    return this.parent[i] = this.find(this.parent[i]);
  }
  union(i, j) {
    let rootI = this.find(i), rootJ = this.find(j);
    if (rootI !== rootJ) {
      if (this.rank[rootI] < this.rank[rootJ]) [rootI, rootJ] = [rootJ, rootI];
      this.parent[rootJ] = rootI;
      if (this.rank[rootI] === this.rank[rootJ]) this.rank[rootI]++;
      return true;
    }
    return false;
  }
}`,
      python: `def graph_bfs(graph, start):
    visited = {start}
    queue = collections.deque([start])
    while queue:
        node = queue.popleft()
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)

class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
    def find(self, i):
        if self.parent[i] == i: return i
        self.parent[i] = self.find(self.parent[i])
        return self.parent[i]
    def union(self, i, j):
        root_i, root_j = self.find(i), self.find(j)
        if root_i != root_j:
            if self.rank[root_i] < self.rank[root_j]: root_i, root_j = root_j, root_i
            self.parent[root_j] = root_i
            if self.rank[root_i] == self.rank[root_j]: self.rank[root_i] += 1
            return True
        return False`,
      cpp: `void bfs(vector<vector<int>>& adj, int start) {
    vector<bool> visited(adj.size(), false);
    queue<int> q; q.push(start); visited[start] = true;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) {
            if (!visited[v]) { visited[v] = true; q.push(v); }
        }
    }
}`,
      java: `public void bfs(List<List<Integer>> adj, int start) {
    boolean[] visited = new boolean[adj.size()];
    Queue<Integer> q = new LinkedList<>();
    q.add(start); visited[start] = true;
    while (!q.isEmpty()) {
        int u = q.poll();
        for (int v : adj.get(u)) {
            if (!visited[v]) { visited[v] = true; q.add(v); }
        }
    }
}`,
    },
    mnemonics: [
      'UNWEIGHTED SHORTEST PATH = BFS ( guarantees minimum steps ).',
      'WEIGHTED POSITIVE EDGES = DIJKSTRA.',
      'CYCLE IN DIRECTED GRAPH = DFS ( 3 colors: unvisited, visiting, visited ).',
    ],
    pitfalls: [
      'Forgetting to mark node as visited upon pushing into queue (causes duplicate work / TLE).',
      'Using Dijkstra on graphs containing negative weight edges (use Bellman-Ford instead).',
    ],
    edgeCases: [
      'Disconnected graph components',
      'Graph with self-loops or parallel edges',
      'Cyclic graphs when searching simple paths',
    ],
  },

  dp: {
    id: 'dp',
    name: 'Dynamic Programming',
    category: 'Algorithmic Paradigms',
    icon: '🎯',
    complexity: {
      time: 'O(Number of States * Transitions per State)',
      space: 'O(Number of States) -> O(1) via Space Optimization',
    },
    codeTemplates: {
      javascript: `// 0/1 Knapsack Pattern (Tabulation with Space Optimization)
function knapsack(weights, values, capacity) {
  const dp = new Array(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    for (let w = capacity; w >= weights[i]; w--) {
      dp[w] = Math.max(dp[w], values[i] + dp[w - weights[i]]);
    }
  }
  return dp[capacity];
}

// Longest Common Subsequence (2D DP)
function lcs(text1, text2) {
  const m = text1.length, n = text2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) dp[i][j] = 1 + dp[i - 1][j - 1];
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}`,
      python: `def knapsack(weights, values, capacity):
    dp = [0] * (capacity + 1)
    for i in range(len(weights)):
        for w in range(capacity, weights[i] - 1, -1):
            dp[w] = max(dp[w], values[i] + dp[w - weights[i]])
    return dp[capacity]

def lcs(text1: str, text2: str) -> int:
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i - 1] == text2[j - 1]: dp[i][j] = 1 + dp[i - 1][j - 1]
            else: dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[m][n]`,
      cpp: `int knapsack(vector<int>& weights, vector<int>& values, int capacity) {
    vector<int> dp(capacity + 1, 0);
    for (int i = 0; i < weights.size(); i++) {
        for (int w = capacity; w >= weights[i]; w--) {
            dp[w] = max(dp[w], values[i] + dp[w - weights[i]]);
        }
    }
    return dp[capacity];
}`,
      java: `public int knapsack(int[] weights, int[] values, int capacity) {
    int[] dp = new int[capacity + 1];
    for (int i = 0; i < weights.length; i++) {
        for (int w = capacity; w >= weights[i]; w--) {
            dp[w] = Math.max(dp[w], values[i] + dp[w - weights[i]]);
        }
    }
    return dp[capacity];
}`,
    },
    mnemonics: [
      'TOP-DOWN (Memoization) = Recursion + Hash Map / Table.',
      'BOTTOM-UP (Tabulation) = Loops + DP Array.',
      '0/1 KNAPSACK: Iterate weights BACKWARDS for 1D space optimization.',
    ],
    pitfalls: [
      'Confusing 0/1 knapsack (iterate inner loop backwards) vs Unbounded knapsack (iterate inner loop forwards).',
      'Missing memoization base case returns.',
    ],
    edgeCases: [
      'Target capacity 0 or empty input choices',
      'Impossible target sum (return -1 or Infinity)',
      'Single element array inputs',
    ],
  },

  heaps: {
    id: 'heaps',
    name: 'Heaps & Priority Queues',
    category: 'Data Structures',
    icon: '⛰️',
    complexity: {
      peek: 'O(1)',
      push: 'O(log n)',
      pop: 'O(log n)',
      buildHeap: 'O(n)',
    },
    codeTemplates: {
      javascript: `// Min Heap Implementation
class MinHeap {
  constructor() { this.heap = []; }
  peek() { return this.heap[0]; }
  push(val) {
    this.heap.push(val);
    this._bubbleUp(this.heap.length - 1);
  }
  pop() {
    const top = this.heap[0], bottom = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this._sinkDown(0);
    }
    return top;
  }
  _bubbleUp(i) {
    while (i > 0) {
      let p = (i - 1) >> 1;
      if (this.heap[i] >= this.heap[p]) break;
      [this.heap[i], this.heap[p]] = [this.heap[p], this.heap[i]];
      i = p;
    }
  }
  _sinkDown(i) {
    const len = this.heap.length;
    while (true) {
      let l = 2 * i + 1, r = 2 * i + 2, smallest = i;
      if (l < len && this.heap[l] < this.heap[smallest]) smallest = l;
      if (r < len && this.heap[r] < this.heap[smallest]) smallest = r;
      if (smallest === i) break;
      [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
  }
}`,
      python: `import heapq

# Top K Elements using Min Heap
def find_kth_largest(nums, k):
    min_heap = nums[:k]
    heapq.heapify(min_heap)
    for num in nums[k:]:
        if num > min_heap[0]:
            heapq.heapreplace(min_heap, num)
    return min_heap[0]`,
      cpp: `// Priority Queue in C++
int findKthLargest(vector<int>& nums, int k) {
    priority_queue<int, vector<int>, greater<int>> minHeap;
    for (int n : nums) {
        minHeap.push(n);
        if (minHeap.size() > k) minHeap.pop();
    }
    return minHeap.top();
}`,
      java: `public int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();
    for (int n : nums) {
        minHeap.add(n);
        if (minHeap.size() > k) minHeap.poll();
    }
    return minHeap.peek();
}`,
    },
    mnemonics: [
      'TOP K LARGEST -> Use MIN-HEAP of size K (discard smallest).',
      'TOP K SMALLEST -> Use MAX-HEAP of size K (discard largest).',
    ],
    pitfalls: [
      'Building a heap element-by-element takes O(n log n); use batch `heapify` for O(n).',
      'In Python, `heapq` is a Min-Heap by default; invert signs (`-val`) for Max-Heap.',
    ],
    edgeCases: [
      'k larger than array size',
      'Array with all duplicate values',
      'Popping from empty priority queue',
    ],
  },

  stacks: {
    id: 'stacks',
    name: 'Stacks & Monotonic Stack',
    category: 'Data Structures',
    icon: '📚',
    complexity: {
      push: 'O(1)',
      pop: 'O(1)',
      peek: 'O(1)',
      monotonicSearch: 'O(n) Amortized',
    },
    codeTemplates: {
      javascript: `// Monotonic Increasing Stack (Next Greater Element)
function nextGreaterElement(nums) {
  const result = new Array(nums.length).fill(-1);
  const stack = []; // stores indices
  for (let i = 0; i < nums.length; i++) {
    while (stack.length > 0 && nums[i] > nums[stack[stack.length - 1]]) {
      const idx = stack.pop();
      result[idx] = nums[i];
    }
    stack.push(i);
  }
  return result;
}`,
      python: `def next_greater_element(nums):
    result = [-1] * len(nums)
    stack = [] # stores indices
    for i, num in enumerate(nums):
        while stack and num > nums[stack[-1]]:
            idx = stack.pop()
            result[idx] = num
        stack.append(i)
    return result`,
      cpp: `vector<int> nextGreaterElement(vector<int>& nums) {
    vector<int> res(nums.size(), -1);
    stack<int> st;
    for (int i = 0; i < nums.size(); i++) {
        while (!st.empty() && nums[i] > nums[st.top()]) {
            res[st.top()] = nums[i]; st.pop();
        }
        st.push(i);
    }
    return res;
}`,
      java: `public int[] nextGreaterElement(int[] nums) {
    int[] res = new int[nums.length];
    Arrays.fill(res, -1);
    Stack<Integer> st = new Stack<>();
    for (int i = 0; i < nums.length; i++) {
        while (!st.isEmpty() && nums[i] > nums[st.peek()]) {
            res[st.pop()] = nums[i];
        }
        st.push(i);
    }
    return res;
}`,
    },
    mnemonics: [
      'MONOTONIC STACK: Next Greater -> Decreasing Stack; Next Smaller -> Increasing Stack.',
      'BALANCED BRACKETS: Push opener, match & pop on closer.',
    ],
    pitfalls: [
      'Pushing values instead of indices into stack when problem requires index distances.',
      'Popping from empty stack during evaluation.',
    ],
    edgeCases: [
      'Strictly decreasing or strictly increasing array inputs',
      'Unbalanced nested parenthesis expression string',
      'Empty input collection',
    ],
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = {};
    if (req.method === 'POST') {
      if (typeof req.body === 'object' && req.body !== null) {
        body = req.body;
      } else {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const raw = Buffer.concat(chunks).toString('utf-8');
        body = raw ? JSON.parse(raw) : {};
      }
    }

    const selectedTopics =
      Array.isArray(body.topics) && body.topics.length > 0
        ? body.topics
        : Object.keys(TOPIC_CATALOG);

    const language = (body.language || 'javascript').toLowerCase();
    const onePager = Boolean(body.onePager);
    const includeNotes = body.includeNotes !== false;
    const userNotesMap = body.userNotes || {};

    const assembledSections = [];

    for (const key of selectedTopics) {
      const topicKey = String(key).toLowerCase();
      const topicData = TOPIC_CATALOG[topicKey];

      if (topicData) {
        const templateCode =
          topicData.codeTemplates[language] || topicData.codeTemplates.javascript;
        const notes = includeNotes && userNotesMap[topicKey] ? [userNotesMap[topicKey]] : [];

        assembledSections.push({
          topicId: topicData.id,
          topicName: topicData.name,
          category: topicData.category,
          icon: topicData.icon,
          complexity: topicData.complexity,
          codeTemplate: {
            language,
            code: templateCode,
          },
          mnemonics: topicData.mnemonics,
          pitfalls: topicData.pitfalls,
          edgeCases: topicData.edgeCases,
          userNotes: notes,
        });
      }
    }

    // Global Time & Space Complexity Quick Reference matrix
    const globalComplexityChart = [
      {
        dataStructure: 'Array Access',
        best: 'O(1)',
        average: 'O(1)',
        worst: 'O(1)',
        space: 'O(n)',
      },
      {
        dataStructure: 'Array Search',
        best: 'O(1)',
        average: 'O(n)',
        worst: 'O(n)',
        space: 'O(n)',
      },
      {
        dataStructure: 'Binary Search',
        best: 'O(1)',
        average: 'O(log n)',
        worst: 'O(log n)',
        space: 'O(1)',
      },
      { dataStructure: 'Hash Table', best: 'O(1)', average: 'O(1)', worst: 'O(n)', space: 'O(n)' },
      {
        dataStructure: 'Binary Search Tree',
        best: 'O(1)',
        average: 'O(log n)',
        worst: 'O(n)',
        space: 'O(n)',
      },
      {
        dataStructure: 'AVL / Red-Black Tree',
        best: 'O(log n)',
        average: 'O(log n)',
        worst: 'O(log n)',
        space: 'O(n)',
      },
      {
        dataStructure: 'Min/Max Heap',
        best: 'O(1)',
        average: 'O(1)',
        worst: 'O(1) Peek',
        space: 'O(n)',
      },
      {
        dataStructure: 'Graph BFS / DFS',
        best: 'O(V+E)',
        average: 'O(V+E)',
        worst: 'O(V+E)',
        space: 'O(V)',
      },
      {
        dataStructure: 'Merge Sort',
        best: 'O(n log n)',
        average: 'O(n log n)',
        worst: 'O(n log n)',
        space: 'O(n)',
      },
      {
        dataStructure: 'Quick Sort',
        best: 'O(n log n)',
        average: 'O(n log n)',
        worst: 'O(n^2)',
        space: 'O(log n)',
      },
    ];

    return res.status(200).json({
      success: true,
      cheatSheet: {
        title: 'Algorithm Cheat Sheet',
        generatedAt: new Date().toISOString(),
        topicsCount: assembledSections.length,
        language,
        onePager,
        globalComplexityChart,
        sections: assembledSections,
      },
    });
  } catch (err) {
    console.error('[API /api/cheat-sheet] Error:', err);
    return res
      .status(500)
      .json({ error: 'Internal server error processing cheat sheet generation.' });
  }
}
