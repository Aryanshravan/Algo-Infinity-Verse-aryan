/**
 * Quick Code Snippets Library
 * 
 * Allows users to save, organize, and quickly insert frequently-used code templates.
 * Snippets are persisted to localStorage and synced across sessions.
 * 
 * @module snippets
 */

const SNIPPETS_STORAGE_KEY = 'quickCodeSnippets';

/** Pre-built default snippets for common DSA patterns */
const DEFAULT_SNIPPETS = [
  {
    id: 'builtin-binary-search',
    name: 'Binary Search',
    description: 'Classic binary search on a sorted array. Returns index or -1.',
    code: `/**
 * Binary search on a sorted array.
 * @param {number[]} nums - Sorted array
 * @param {number} target - Value to search for
 * @returns {number} Index of target or -1
 */
function binarySearch(nums, target) {
    let left = 0;
    let right = nums.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    
    return -1;
}`,
    language: 'javascript',
    tags: ['search', 'array', 'divide-and-conquer'],
    category: 'Searching',
    favorite: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'builtin-dfs-tree',
    name: 'DFS (Binary Tree)',
    description: 'Depth-first search traversal for a binary tree (pre-order).',
    code: `/**
 * DFS (pre-order) traversal of a binary tree.
 * @param {TreeNode} root - Root of the tree
 * @returns {number[]} Array of values in pre-order
 */
function dfsPreorder(root) {
    const result = [];
    
    function traverse(node) {
        if (!node) return;
        result.push(node.val);   // visit
        traverse(node.left);     // go left
        traverse(node.right);    // go right
    }
    
    traverse(root);
    return result;
}

/* TreeNode definition:
 * function TreeNode(val, left, right) {
 *     this.val = (val === undefined ? 0 : val);
 *     this.left = (left === undefined ? null : left);
 *     this.right = (right === undefined ? null : right);
 * }
 */`,
    language: 'javascript',
    tags: ['tree', 'recursion', 'traversal'],
    category: 'Trees',
    favorite: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'builtin-bfs-tree',
    name: 'BFS (Binary Tree)',
    description: 'Level-order (breadth-first) traversal using a queue.',
    code: `/**
 * BFS (level-order) traversal of a binary tree.
 * @param {TreeNode} root - Root of the tree
 * @returns {number[][]} Array of levels, each level is an array of values
 */
function bfsLevelOrder(root) {
    if (!root) return [];
    
    const result = [];
    const queue = [root];
    
    while (queue.length > 0) {
        const levelSize = queue.length;
        const currentLevel = [];
        
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
    language: 'javascript',
    tags: ['tree', 'queue', 'level-order', 'traversal'],
    category: 'Trees',
    favorite: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'builtin-linked-list-traversal',
    name: 'Linked List Traversal',
    description: 'Iterate through a singly linked list and collect values.',
    code: `/**
 * Traverse a singly linked list and collect values.
 * @param {ListNode} head - Head of the linked list
 * @returns {number[]} Array of values in order
 */
function traverseLinkedList(head) {
    const values = [];
    let current = head;
    
    while (current !== null) {
        values.push(current.val);
        current = current.next;
    }
    
    return values;
}

/* ListNode definition:
 * function ListNode(val, next) {
 *     this.val = (val === undefined ? 0 : val);
 *     this.next = (next === undefined ? null : next);
 * }
 */`,
    language: 'javascript',
    tags: ['linked-list', 'iteration'],
    category: 'Linked Lists',
    favorite: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'builtin-two-pointers',
    name: 'Two Pointers',
    description: 'Two-pointer technique for sorted arrays (e.g., two-sum).',
    code: `/**
 * Two-pointer technique on a sorted array.
 * Finds a pair that sums to the target.
 * @param {number[]} nums - Sorted array
 * @param {number} target - Target sum
 * @returns {number[]} Indices of the pair, or [-1, -1]
 */
function twoPointers(nums, target) {
    let left = 0;
    let right = nums.length - 1;
    
    while (left < right) {
        const sum = nums[left] + nums[right];
        
        if (sum === target) return [left, right];
        if (sum < target) left++;
        else right--;
    }
    
    return [-1, -1];
}`,
    language: 'javascript',
    tags: ['array', 'two-pointers', 'sorted'],
    category: 'Arrays',
    favorite: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'builtin-sliding-window',
    name: 'Sliding Window',
    description: 'Generic sliding window template for subarray/substring problems.',
    code: `/**
 * Generic sliding window template.
 * Finds the minimum window size that satisfies a condition.
 * @param {number[]} nums - Input array
 * @returns {number} Minimum window length satisfying condition
 */
function slidingWindow(nums) {
    const n = nums.length;
    let left = 0;
    let result = Infinity;
    // Track window state (e.g., sum, character counts, etc.)
    let windowState = 0;
    
    for (let right = 0; right < n; right++) {
        // Expand window: add nums[right] to state
        windowState += nums[right];
        
        // Shrink window while condition is satisfied
        while (/* condition(windowState) */ windowState >= 10) {
            result = Math.min(result, right - left + 1);
            // Remove nums[left] from state
            windowState -= nums[left];
            left++;
        }
    }
    
    return result === Infinity ? 0 : result;
}`,
    language: 'javascript',
    tags: ['array', 'sliding-window', 'subarray'],
    category: 'Arrays',
    favorite: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'builtin-quick-sort',
    name: 'Quick Sort',
    description: 'In-place quicksort using Lomuto partition scheme.',
    code: `/**
 * In-place quicksort.
 * @param {number[]} nums - Array to sort
 * @param {number} low - Starting index
 * @param {number} high - Ending index
 */
function quickSort(nums, low = 0, high = nums.length - 1) {
    if (low >= high) return;
    
    const pivotIndex = partition(nums, low, high);
    quickSort(nums, low, pivotIndex - 1);
    quickSort(nums, pivotIndex + 1, high);
}

function partition(nums, low, high) {
    const pivot = nums[high];
    let i = low - 1;
    
    for (let j = low; j < high; j++) {
        if (nums[j] <= pivot) {
            i++;
            [nums[i], nums[j]] = [nums[j], nums[i]];
        }
    }
    
    [nums[i + 1], nums[high]] = [nums[high], nums[i + 1]];
    return i + 1;
}`,
    language: 'javascript',
    tags: ['sorting', 'divide-and-conquer', 'recursion'],
    category: 'Sorting',
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'builtin-merge-sort',
    name: 'Merge Sort',
    description: 'Stable O(n log n) sort with auxiliary array.',
    code: `/**
 * Merge sort (top-down).
 * @param {number[]} nums - Array to sort
 * @returns {number[]} Sorted array
 */
function mergeSort(nums) {
    if (nums.length <= 1) return nums;
    
    const mid = Math.floor(nums.length / 2);
    const left = mergeSort(nums.slice(0, mid));
    const right = mergeSort(nums.slice(mid));
    
    return merge(left, right);
}

function merge(left, right) {
    const result = [];
    let i = 0, j = 0;
    
    while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) result.push(left[i++]);
        else result.push(right[j++]);
    }
    
    return result.concat(left.slice(i)).concat(right.slice(j));
}`,
    language: 'javascript',
    tags: ['sorting', 'divide-and-conquer', 'merge'],
    category: 'Sorting',
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'builtin-trie',
    name: 'Trie (Prefix Tree)',
    description: 'Trie data structure for prefix matching and word storage.',
    code: `/**
 * Trie (Prefix Tree) implementation.
 */
class Trie {
    constructor() {
        this.root = { children: {}, isEnd: false };
    }
    
    /** Insert a word into the trie. */
    insert(word) {
        let node = this.root;
        for (const ch of word) {
            if (!node.children[ch]) node.children[ch] = { children: {}, isEnd: false };
            node = node.children[ch];
        }
        node.isEnd = true;
    }
    
    /** Returns true if the word is in the trie. */
    search(word) {
        const node = this._traverse(word);
        return node !== null && node.isEnd;
    }
    
    /** Returns true if any word starts with the given prefix. */
    startsWith(prefix) {
        return this._traverse(prefix) !== null;
    }
    
    _traverse(str) {
        let node = this.root;
        for (const ch of str) {
            if (!node.children[ch]) return null;
            node = node.children[ch];
        }
        return node;
    }
}`,
    language: 'javascript',
    tags: ['trie', 'prefix-tree', 'string'],
    category: 'Data Structures',
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'builtin-union-find',
    name: 'Union-Find (Disjoint Set)',
    description: 'Union-Find data structure with path compression and union by rank.',
    code: `/**
 * Union-Find (Disjoint Set Union) with path compression & union by rank.
 */
class UnionFind {
    constructor(n) {
        this.parent = Array.from({ length: n }, (_, i) => i);
        this.rank = new Array(n).fill(0);
    }
    
    /** Find with path compression. */
    find(x) {
        if (this.parent[x] !== x) {
            this.parent[x] = this.find(this.parent[x]);
        }
        return this.parent[x];
    }
    
    /** Union by rank. Returns true if merged. */
    union(x, y) {
        const px = this.find(x);
        const py = this.find(y);
        if (px === py) return false;
        
        if (this.rank[px] < this.rank[py]) {
            this.parent[px] = py;
        } else if (this.rank[px] > this.rank[py]) {
            this.parent[py] = px;
        } else {
            this.parent[py] = px;
            this.rank[px]++;
        }
        return true;
    }
    
    /** Returns true if x and y are connected. */
    connected(x, y) {
        return this.find(x) === this.find(y);
    }
}`,
    language: 'javascript',
    tags: ['union-find', 'disjoint-set', 'graph'],
    category: 'Data Structures',
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'builtin-kadane',
    name: "Kadane's Algorithm",
    description: 'Maximum subarray sum in O(n) time using Kadane\'s algorithm.',
    code: `/**
 * Kadane's algorithm — maximum subarray sum.
 * @param {number[]} nums - Input array
 * @returns {number} Maximum subarray sum
 */
function maxSubarraySum(nums) {
    let maxEndingHere = nums[0];
    let maxSoFar = nums[0];
    
    for (let i = 1; i < nums.length; i++) {
        maxEndingHere = Math.max(nums[i], maxEndingHere + nums[i]);
        maxSoFar = Math.max(maxSoFar, maxEndingHere);
    }
    
    return maxSoFar;
}`,
    language: 'javascript',
    tags: ['array', 'dp', 'maximum-subarray'],
    category: 'Dynamic Programming',
    favorite: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'builtin-dijkstra',
    name: "Dijkstra's Algorithm",
    description: 'Shortest path from source to all nodes in weighted graph.',
    code: `/**
 * Dijkstra's shortest path algorithm using a priority queue (binary heap).
 * @param {[number, number][]} graph - Adjacency list: graph[u] = [[v, w], ...]
 * @param {number} source - Source node
 * @returns {number[]} Shortest distances from source
 */
function dijkstra(graph, source) {
    const n = graph.length;
    const dist = new Array(n).fill(Infinity);
    dist[source] = 0;
    
    // Min-heap: [distance, node]
    const pq = [[0, source]];
    
    while (pq.length > 0) {
        // Simple O(n) extract-min (use a proper heap for large inputs)
        pq.sort((a, b) => b[0] - a[0]);
        const [d, u] = pq.pop();
        
        if (d > dist[u]) continue;
        
        for (const [v, w] of (graph[u] || [])) {
            const newDist = dist[u] + w;
            if (newDist < dist[v]) {
                dist[v] = newDist;
                pq.push([newDist, v]);
            }
        }
    }
    
    return dist;
}`,
    language: 'javascript',
    tags: ['graph', 'shortest-path', 'priority-queue'],
    category: 'Graphs',
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'builtin-dp-fibonacci',
    name: 'DP — Fibonacci (Memoization)',
    description: 'Fibonacci with top-down dynamic programming and memoization.',
    code: `/**
 * Nth Fibonacci number using memoized DP.
 * @param {number} n - Non-negative integer
 * @param {Object} memo - Cache (optional)
 * @returns {number} Nth Fibonacci number
 */
function fib(n, memo = {}) {
    if (n <= 1) return n;
    if (memo[n] !== undefined) return memo[n];
    
    memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
    return memo[n];
}

/**
 * Iterative bottom-up version (O(1) space).
 */
function fibIterative(n) {
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
        const temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}`,
    language: 'javascript',
    tags: ['dp', 'memoization', 'fibonacci'],
    category: 'Dynamic Programming',
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'builtin-inorder-traversal',
    name: 'Inorder / Preorder / Postorder',
    description: 'All three DFS traversal orders for a binary tree (recursive).',
    code: `/**
 * Binary tree DFS traversals (recursive).
 */

/* Inorder: left → root → right */
function inorder(root, result = []) {
    if (!root) return result;
    inorder(root.left, result);
    result.push(root.val);
    inorder(root.right, result);
    return result;
}

/* Preorder: root → left → right */
function preorder(root, result = []) {
    if (!root) return result;
    result.push(root.val);
    preorder(root.left, result);
    preorder(root.right, result);
    return result;
}

/* Postorder: left → right → root */
function postorder(root, result = []) {
    if (!root) return result;
    postorder(root.left, result);
    postorder(root.right, result);
    result.push(root.val);
    return result;
}`,
    language: 'javascript',
    tags: ['tree', 'dfs', 'traversal', 'recursion'],
    category: 'Trees',
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'builtin-python-binary-search',
    name: 'Binary Search (Python)',
    description: 'Binary search implementation in Python.',
    code: `def binary_search(nums, target):
    \"\"\"
    Binary search on a sorted array.
    Returns the index of target or -1.
    \"\"\"
    left, right = 0, len(nums) - 1
    
    while left <= right:
        mid = (left + right) // 2
        
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1`,
    language: 'python',
    tags: ['search', 'array', 'python'],
    category: 'Searching',
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'builtin-python-dfs',
    name: 'DFS Graph (Python)',
    description: 'DFS traversal for a graph using adjacency list in Python.',
    code: `def dfs(graph, start, visited=None):
    \"\"\"
    DFS traversal for a graph (adjacency list).
    \"\"\"
    if visited is None:
        visited = set()
    
    visited.add(start)
    result = [start]
    
    for neighbor in graph[start]:
        if neighbor not in visited:
            result.extend(dfs(graph, neighbor, visited))
    
    return result


def dfs_iterative(graph, start):
    \"\"\"Iterative DFS using a stack.\"\"\"
    visited = set()
    stack = [start]
    result = []
    
    while stack:
        node = stack.pop()
        if node not in visited:
            visited.add(node)
            result.append(node)
            # Reverse to maintain order
            stack.extend(reversed(graph[node]))
    
    return result`,
    language: 'python',
    tags: ['graph', 'dfs', 'recursion', 'python'],
    category: 'Graphs',
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

/**
 * Generate a unique snippet ID.
 * @returns {string}
 */
function generateId() {
  return 'snippet_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Validate a snippet object has all required fields.
 * @param {Object} snippet
 * @returns {{ valid: boolean, error: string|null }}
 */
function validateSnippet(snippet) {
  if (!snippet || typeof snippet !== 'object') {
    return { valid: false, error: 'Snippet must be an object.' };
  }
  if (!snippet.name || typeof snippet.name !== 'string' || snippet.name.trim().length === 0) {
    return { valid: false, error: 'Snippet name is required.' };
  }
  if (snippet.name.trim().length > 200) {
    return { valid: false, error: 'Snippet name must be 200 characters or fewer.' };
  }
  if (!snippet.code || typeof snippet.code !== 'string' || snippet.code.trim().length === 0) {
    return { valid: false, error: 'Snippet code is required.' };
  }
  if (snippet.code.length > 50000) {
    return { valid: false, error: 'Snippet code must be 50,000 characters or fewer.' };
  }
  return { valid: true, error: null };
}

/**
 * Load all snippets from localStorage.
 * Falls back to defaults if nothing is stored.
 * @returns {Object[]}
 */
function loadSnippets() {
  try {
    const raw = localStorage.getItem(SNIPPETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // localStorage unavailable or corrupt — fall through to defaults
  }
  // Seed defaults on first run
  saveSnippets(DEFAULT_SNIPPETS);
  return DEFAULT_SNIPPETS;
}

/**
 * Persist snippets array to localStorage.
 * @param {Object[]} snippets
 */
function saveSnippets(snippets) {
  try {
    localStorage.setItem(SNIPPETS_STORAGE_KEY, JSON.stringify(snippets));
  } catch (e) {
    // localStorage may be full or unavailable
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('Failed to save snippets to localStorage:', e.message);
    }
  }
}

/**
 * Get all snippets.
 * @returns {Object[]}
 */
function getAll() {
  return loadSnippets();
}

/**
 * Get a snippet by ID.
 * @param {string} id
 * @returns {Object|undefined}
 */
function getById(id) {
  if (!id) return undefined;
  return loadSnippets().find(s => s.id === id);
}

/**
 * Add a new snippet.
 * @param {Object} snippetData - { name, description, code, language, tags, category }
 * @returns {{ success: boolean, snippet: Object|null, error: string|null }}
 */
function add(snippetData) {
  const snippet = {
    id: generateId(),
    name: (snippetData.name || '').trim(),
    description: (snippetData.description || '').trim(),
    code: snippetData.code || '',
    language: snippetData.language || 'javascript',
    tags: Array.isArray(snippetData.tags) ? snippetData.tags.map(t => t.trim()).filter(Boolean) : [],
    category: (snippetData.category || 'General').trim(),
    favorite: snippetData.favorite === true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const validation = validateSnippet(snippet);
  if (!validation.valid) {
    return { success: false, snippet: null, error: validation.error };
  }

  const snippets = loadSnippets();
  snippets.push(snippet);
  saveSnippets(snippets);
  return { success: true, snippet, error: null };
}

/**
 * Update an existing snippet.
 * @param {string} id
 * @param {Object} updates - Fields to update
 * @returns {{ success: boolean, snippet: Object|null, error: string|null }}
 */
function update(id, updates) {
  if (!id) {
    return { success: false, snippet: null, error: 'Snippet ID is required.' };
  }

  const snippets = loadSnippets();
  const index = snippets.findIndex(s => s.id === id);
  if (index === -1) {
    return { success: false, snippet: null, error: 'Snippet not found.' };
  }

  const existing = snippets[index];
  const updated = {
    ...existing,
    name: updates.name !== undefined ? (updates.name || '').trim() : existing.name,
    description: updates.description !== undefined ? (updates.description || '').trim() : existing.description,
    code: updates.code !== undefined ? updates.code : existing.code,
    language: updates.language !== undefined ? updates.language : existing.language,
    tags: updates.tags !== undefined
      ? (Array.isArray(updates.tags) ? updates.tags.map(t => t.trim()).filter(Boolean) : [])
      : existing.tags,
    category: updates.category !== undefined ? (updates.category || '').trim() : existing.category,
    favorite: updates.favorite !== undefined ? updates.favorite === true : existing.favorite,
    updatedAt: Date.now()
  };

  // Validate, but skip name+code check for partial updates (favorite toggle, etc.)
  if (updates.name !== undefined || updates.code !== undefined) {
    const validation = validateSnippet(updated);
    if (!validation.valid) {
      return { success: false, snippet: null, error: validation.error };
    }
  }

  snippets[index] = updated;
  saveSnippets(snippets);
  return { success: true, snippet: updated, error: null };
}

/**
 * Delete a snippet by ID.
 * @param {string} id
 * @returns {{ success: boolean, error: string|null }}
 */
function remove(id) {
  if (!id) {
    return { success: false, error: 'Snippet ID is required.' };
  }

  const snippets = loadSnippets();
  const index = snippets.findIndex(s => s.id === id);
  if (index === -1) {
    return { success: false, error: 'Snippet not found.' };
  }

  snippets.splice(index, 1);
  saveSnippets(snippets);
  return { success: true, error: null };
}

/**
 * Search snippets by query string. Matches name, description, tags, and category.
 * @param {string} query
 * @returns {Object[]}
 */
function search(query) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return loadSnippets();
  }

  const q = query.trim().toLowerCase();
  return loadSnippets().filter(s => {
    return (
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags.some(t => t.toLowerCase().includes(q)) ||
      s.category.toLowerCase().includes(q) ||
      s.language.toLowerCase().includes(q)
    );
  });
}

/**
 * Get all unique categories from stored snippets.
 * @returns {string[]}
 */
function getCategories() {
  const categories = new Set();
  loadSnippets().forEach(s => {
    if (s.category) categories.add(s.category);
  });
  return Array.from(categories).sort();
}

/**
 * Get all unique languages used in stored snippets.
 * @returns {string[]}
 */
function getLanguages() {
  const languages = new Set();
  loadSnippets().forEach(s => {
    if (s.language) languages.add(s.language);
  });
  return Array.from(languages).sort();
}

/**
 * Export all snippets as a JSON string.
 * @returns {string}
 */
function exportJSON() {
  return JSON.stringify(loadSnippets(), null, 2);
}

/**
 * Import snippets from a JSON string.
 * Merges with existing snippets; does not overwrite.
 * @param {string} jsonString
 * @returns {{ success: boolean, count: number, error: string|null }}
 */
function importJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!Array.isArray(data)) {
      return { success: false, count: 0, error: 'JSON must be an array of snippets.' };
    }

    const existing = loadSnippets();
    let added = 0;

    for (const item of data) {
      const snippet = {
        id: generateId(),
        name: (item.name || '').trim(),
        description: (item.description || '').trim(),
        code: item.code || '',
        language: item.language || 'javascript',
        tags: Array.isArray(item.tags) ? item.tags.map(t => t.trim()).filter(Boolean) : [],
        category: (item.category || 'General').trim(),
        favorite: item.favorite === true,
        createdAt: item.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      const validation = validateSnippet(snippet);
      if (validation.valid) {
        existing.push(snippet);
        added++;
      }
    }

    if (added > 0) {
      saveSnippets(existing);
    }

    return { success: true, count: added, error: null };
  } catch (e) {
    return { success: false, count: 0, error: 'Invalid JSON: ' + e.message };
  }
}

/**
 * Toggle the favorite status of a snippet.
 * @param {string} id
 * @returns {{ success: boolean, favorite: boolean|null, error: string|null }}
 */
function toggleFavorite(id) {
  if (!id) {
    return { success: false, favorite: null, error: 'Snippet ID is required.' };
  }

  const snippet = getById(id);
  if (!snippet) {
    return { success: false, favorite: null, error: 'Snippet not found.' };
  }

  const newFavorite = !snippet.favorite;
  const result = update(id, { favorite: newFavorite });
  return {
    success: result.success,
    favorite: result.success ? newFavorite : null,
    error: result.error
  };
}

/**
 * Insert a snippet's code into the active editor.
 * This function dispatches a custom event so the playground can handle insertion.
 * @param {Object} snippet
 */
function insertIntoEditor(snippet) {
  if (!snippet || !snippet.code) return;

  // Dispatch a custom event for the playground to handle
  const event = new CustomEvent('snippet-insert', {
    detail: { snippet },
    bubbles: true
  });
  document.dispatchEvent(event);
}

// Export public API
window.SnippetsLibrary = {
  getAll,
  getById,
  add,
  update,
  remove,
  search,
  getCategories,
  getLanguages,
  exportJSON,
  importJSON,
  toggleFavorite,
  insertIntoEditor,
  DEFAULT_SNIPPETS
};
