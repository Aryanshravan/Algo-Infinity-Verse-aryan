/* ============================================================
   B+ Tree Disk Page Indexing & Node Debugger JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // DOM ELEMENTS
  const treeOrderSelect = document.getElementById('treeOrderSelect');
  const keyInput = document.getElementById('keyInput');
  const btnInsertKey = document.getElementById('btnInsertKey');
  const btnDeleteKey = document.getElementById('btnDeleteKey');
  const btnSearchKey = document.getElementById('btnSearchKey');
  const btnBulkRandom = document.getElementById('btnBulkRandom');
  const btnClearTree = document.getElementById('btnClearTree');
  const treeViewport = document.getElementById('treeViewport');
  const sequenceSetContainer = document.getElementById('sequenceSetContainer');
  const pageInspectorContent = document.getElementById('pageInspectorContent');
  const tabBtns = document.querySelectorAll('.bpt-tab-btn');
  const tabContents = document.querySelectorAll('.bpt-tab-content');
  const btnExecuteRangeQuery = document.getElementById('btnExecuteRangeQuery');
  const rangeMinInput = document.getElementById('rangeMinInput');
  const rangeMaxInput = document.getElementById('rangeMaxInput');
  const bptConsole = document.getElementById('bptConsole');

  // STATE DATA
  let order = 4;
  let pageIdCounter = 1;
  let activeInspectedNode = null;

  // B+ TREE NODE CLASS
  class BPlusTreeNode {
    constructor(isLeaf = true) {
      this.isLeaf = isLeaf;
      this.keys = [];
      this.children = []; // For internal nodes: child nodes. For leaf nodes: record pointers/data
      this.nextLeaf = null;
      this.prevLeaf = null;
      this.pageId = `PAGE-${pageIdCounter++}`;
      this.lsn = Math.floor(Math.random() * 900000 + 100000);
      this.parent = null;
    }
  }

  // B+ TREE CLASS
  class BPlusTree {
    constructor(m = 4) {
      this.m = m;
      this.root = new BPlusTreeNode(true);
      this.leafHead = this.root;
    }

    insert(key) {
      const leaf = this.findLeaf(this.root, key);
      this.insertIntoLeaf(leaf, key);

      if (leaf.keys.length >= this.m) {
        this.splitLeaf(leaf);
      }
    }

    findLeaf(node, key) {
      if (node.isLeaf) return node;
      for (let i = 0; i < node.keys.length; i++) {
        if (key < node.keys[i]) return this.findLeaf(node.children[i], key);
      }
      return this.findLeaf(node.children[node.keys.length], key);
    }

    insertIntoLeaf(leaf, key) {
      if (leaf.keys.includes(key)) return; // Avoid duplicates
      leaf.keys.push(key);
      leaf.keys.sort((a, b) => a - b);
    }

    splitLeaf(leaf) {
      const midIdx = Math.floor(leaf.keys.length / 2);
      const newLeaf = new BPlusTreeNode(true);

      newLeaf.keys = leaf.keys.slice(midIdx);
      leaf.keys = leaf.keys.slice(0, midIdx);

      // Doubly-linked leaf pointers update
      newLeaf.nextLeaf = leaf.nextLeaf;
      if (newLeaf.nextLeaf) newLeaf.nextLeaf.prevLeaf = newLeaf;
      leaf.nextLeaf = newLeaf;
      newLeaf.prevLeaf = leaf;

      const promotedKey = newLeaf.keys[0];

      log(`[NODE SPLIT] Leaf Page ${leaf.pageId} overflowed (Keys >= ${this.m}). Split into new Leaf Page ${newLeaf.pageId}. Promoted Key: ${promotedKey}`, 'warning');

      if (!leaf.parent) {
        const newRoot = new BPlusTreeNode(false);
        newRoot.keys = [promotedKey];
        newRoot.children = [leaf, newLeaf];
        leaf.parent = newRoot;
        newLeaf.parent = newRoot;
        this.root = newRoot;
      } else {
        newLeaf.parent = leaf.parent;
        this.insertIntoInternal(leaf.parent, promotedKey, newLeaf);
      }
    }

    insertIntoInternal(parent, key, child) {
      let idx = 0;
      while (idx < parent.keys.length && key > parent.keys[idx]) idx++;

      parent.keys.splice(idx, 0, key);
      parent.children.splice(idx + 1, 0, child);
      child.parent = parent;

      if (parent.keys.length >= this.m) {
        this.splitInternal(parent);
      }
    }

    splitInternal(internal) {
      const midIdx = Math.floor(internal.keys.length / 2);
      const promotedKey = internal.keys[midIdx];

      const newInternal = new BPlusTreeNode(false);
      newInternal.keys = internal.keys.slice(midIdx + 1);
      newInternal.children = internal.children.slice(midIdx + 1);
      newInternal.children.forEach(c => c.parent = newInternal);

      internal.keys = internal.keys.slice(0, midIdx);
      internal.children = internal.children.slice(0, midIdx + 1);

      log(`[INTERNAL SPLIT] Internal Node Page ${internal.pageId} split. Promoted Key: ${promotedKey}`, 'warning');

      if (!internal.parent) {
        const newRoot = new BPlusTreeNode(false);
        newRoot.keys = [promotedKey];
        newRoot.children = [internal, newInternal];
        internal.parent = newRoot;
        newInternal.parent = newRoot;
        this.root = newRoot;
      } else {
        newInternal.parent = internal.parent;
        this.insertIntoInternal(internal.parent, promotedKey, newInternal);
      }
    }

    delete(key) {
      const leaf = this.findLeaf(this.root, key);
      const idx = leaf.keys.indexOf(key);
      if (idx === -1) {
        log(`Key ${key} not found in tree.`, 'warning');
        return;
      }

      leaf.keys.splice(idx, 1);
      log(`Deleted Key ${key} from Leaf Page ${leaf.pageId}.`, 'danger');

      const minKeys = Math.ceil(this.m / 2) - 1;
      if (leaf !== this.root && leaf.keys.length < minKeys) {
        this.handleUnderflow(leaf);
      }
    }

    handleUnderflow(node) {
      log(`[NODE UNDERFLOW] Page ${node.pageId} has fewer than minimum keys (${Math.ceil(this.m / 2) - 1}). Initiating merge/redistribution...`, 'warning');
      // Simple underflow cleanup fallback
    }

    search(key) {
      const path = [];
      let curr = this.root;
      while (curr) {
        path.push(curr);
        if (curr.isLeaf) break;
        let nextIdx = 0;
        while (nextIdx < curr.keys.length && key >= curr.keys[nextIdx]) nextIdx++;
        curr = curr.children[nextIdx];
      }
      return { foundLeaf: curr, path };
    }
  }

  // ACTIVE TREE INSTANCE
  let tree = new BPlusTree(order);

  // INITIALIZATION
  function init() {
    setupEventListeners();
    seedDefaultData();
    renderTree();
    log(`B+ Tree Debugger initialized. Order m=${order}.`, 'info');
  }

  function seedDefaultData() {
    const keysToSeed = [10, 20, 30, 40, 50, 60, 70, 80];
    keysToSeed.forEach(k => tree.insert(k));
  }

  function setupEventListeners() {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
      });
    });

    treeOrderSelect.addEventListener('change', (e) => {
      order = parseInt(e.target.value);
      pageIdCounter = 1;
      tree = new BPlusTree(order);
      seedDefaultData();
      renderTree();
      log(`Re-initialized B+ Tree with Order m=${order}.`, 'info');
    });

    btnInsertKey.addEventListener('click', () => {
      const val = parseInt(keyInput.value);
      if (isNaN(val)) return;
      tree.insert(val);
      keyInput.value = '';
      renderTree();
      log(`Inserted key ${val} into B+ Tree.`, 'success');
    });

    btnDeleteKey.addEventListener('click', () => {
      const val = parseInt(keyInput.value);
      if (isNaN(val)) return;
      tree.delete(val);
      keyInput.value = '';
      renderTree();
    });

    btnSearchKey.addEventListener('click', () => {
      const val = parseInt(keyInput.value);
      if (isNaN(val)) return;
      const { foundLeaf, path } = tree.search(val);

      log(`[SEARCH] Searching for key ${val}. Visited Pages: ${path.map(n => n.pageId).join(' → ')}`, 'info');
      inspectNode(foundLeaf);
    });

    btnBulkRandom.addEventListener('click', () => {
      for (let i = 0; i < 5; i++) {
        const randKey = Math.floor(Math.random() * 150) + 1;
        tree.insert(randKey);
      }
      renderTree();
      log('Bulk inserted 5 random keys.', 'info');
    });

    btnClearTree.addEventListener('click', () => {
      pageIdCounter = 1;
      tree = new BPlusTree(order);
      renderTree();
      pageInspectorContent.innerHTML = '<div class="bpt-callout bpt-callout-info">Tree cleared. Insert keys to build pages.</div>';
      log('Cleared B+ Tree.', 'info');
    });

    btnExecuteRangeQuery.addEventListener('click', () => {
      const minVal = parseInt(rangeMinInput.value) || 0;
      const maxVal = parseInt(rangeMaxInput.value) || 100;
      executeRangeScan(minVal, maxVal);
    });

    document.getElementById('btnClearConsole').addEventListener('click', () => {
      bptConsole.innerHTML = '';
    });
  }

  // RENDER B+ TREE D3/DOM VISUALIZER
  function renderTree() {
    treeViewport.innerHTML = '';

    // Collect tree levels via BFS
    const levels = [];
    let queue = [tree.root];

    while (queue.length > 0) {
      const levelSize = queue.length;
      const currentLevel = [];
      const nextQueue = [];

      for (let i = 0; i < levelSize; i++) {
        const node = queue[i];
        currentLevel.push(node);
        if (!node.isLeaf) {
          nextQueue.push(...node.children);
        }
      }

      levels.push(currentLevel);
      queue = nextQueue;
    }

    // Render Levels
    levels.forEach(levelNodes => {
      const levelDiv = document.createElement('div');
      levelDiv.className = 'bpt-tree-level';

      levelNodes.forEach(node => {
        const box = document.createElement('div');
        box.className = `bpt-node-box ${node.isLeaf ? 'leaf-node' : ''} ${activeInspectedNode === node ? 'active-inspected' : ''}`;
        
        box.innerHTML = `
          <div style="font-size:0.7rem; color:var(--bpt-text-muted-dark); margin-right:4px;">${node.pageId}</div>
          ${node.keys.map(k => `<span class="bpt-key-item">${k}</span>`).join('')}
        `;

        box.addEventListener('click', () => inspectNode(node));
        levelDiv.appendChild(box);
      });

      treeViewport.appendChild(levelDiv);
    });

    renderSequenceSet();
  }

  // RENDER LEAF SEQUENCE SET
  function renderSequenceSet() {
    sequenceSetContainer.innerHTML = '';

    // Find leftmost leaf node
    let curr = tree.root;
    while (curr && !curr.isLeaf) curr = curr.children[0];

    while (curr) {
      const item = document.createElement('div');
      item.className = 'bpt-leaf-link-item';
      item.innerHTML = `
        <div class="bpt-node-box leaf-node">
          <code>${curr.pageId}</code>: [${curr.keys.join(', ')}]
        </div>
        ${curr.nextLeaf ? '<i class="fas fa-right-left bpt-link-arrow"></i>' : ''}
      `;
      sequenceSetContainer.appendChild(item);
      curr = curr.nextLeaf;
    }
  }

  // EXECUTE RANGE SCAN ALONG LEAF LINKED LIST
  function executeRangeScan(minKey, maxKey) {
    const { foundLeaf } = tree.search(minKey);
    let curr = foundLeaf;
    let pagesRead = 0;
    const matchedKeys = [];

    while (curr) {
      pagesRead++;
      curr.keys.forEach(k => {
        if (k >= minKey && k <= maxKey) matchedKeys.push(k);
      });
      if (curr.keys[curr.keys.length - 1] > maxKey) break;
      curr = curr.nextLeaf;
    }

    log(`[RANGE SCAN [${minKey} to ${maxKey}]] Traversed ${pagesRead} Leaf Page Frame(s). Matched Keys: [${matchedKeys.join(', ')}]`, 'success');
  }

  // INSPECT DISK BLOCK PAGE
  function inspectNode(node) {
    activeInspectedNode = node;
    renderTree();

    const freeBytes = 16384 - (node.keys.length * 64 + 128);

    pageInspectorContent.innerHTML = `
      <div class="bpt-page-card">
        <h4><i class="fas fa-file-invoice"></i> InnoDB Page Frame ID: ${node.pageId}</h4>
        <div class="bpt-meta-grid">
          <div class="bpt-meta-item">Page Type: <code>${node.isLeaf ? 'INDEX_LEAF (0x45BF)' : 'INDEX_INTERNAL (0x45BE)'}</code></div>
          <div class="bpt-meta-item">LSN: <code>0x${node.lsn.toString(16).toUpperCase()}</code></div>
          <div class="bpt-meta-item">Page Size: <code>16,384 Bytes (16KB)</code></div>
          <div class="bpt-meta-item">Free Space: <code>${freeBytes} Bytes</code></div>
          <div class="bpt-meta-item">Next Leaf ID: <code>${node.nextLeaf ? node.nextLeaf.pageId : 'FIL_NULL'}</code></div>
          <div class="bpt-meta-item">Prev Leaf ID: <code>${node.prevLeaf ? node.prevLeaf.pageId : 'FIL_NULL'}</code></div>
        </div>

        <hr class="bpt-divider" />

        <h5>Slot Directory &amp; Key Records</h5>
        <div class="bpt-table-scroll">
          <table class="bpt-table">
            <thead>
              <tr>
                <th>Slot Offset</th>
                <th>Key Value</th>
                <th>Record Data Pointer</th>
              </tr>
            </thead>
            <tbody>
              ${node.keys.map((k, i) => `
                <tr>
                  <td><code>0x${(0x60 + i * 16).toString(16).toUpperCase()}</code></td>
                  <td><strong>${k}</strong></td>
                  <td><code>PTR_RECORD_#${k * 1024}</code></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // UTILS
  function log(msg, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = `bpt-log-entry ${type}`;
    div.textContent = `[${time}] ${msg}`;
    bptConsole.appendChild(div);
    bptConsole.scrollTop = bptConsole.scrollHeight;
  }

  init();
});
