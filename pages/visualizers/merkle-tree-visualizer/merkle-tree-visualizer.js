document.addEventListener('DOMContentLoaded', () => {
  initMPT();
});

// ==========================================
// 1. STATE & UTILS
// ==========================================
const els = {
  canvas: document.getElementById('mptCanvas'),
  rootHash: document.getElementById('mptRootHash'),
  insertKey: document.getElementById('mptInsertKey'),
  insertValue: document.getElementById('mptInsertValue'),
  btnInsert: document.getElementById('btnInsert'),
  btnToggleCompression: document.getElementById('btnToggleCompression'),
  btnLoadEthereum: document.getElementById('btnLoadEthereum'),
  btnClear: document.getElementById('btnClear'),
  selectAccount: document.getElementById('mptSelectAccount'),
  btnGenerateProof: document.getElementById('btnGenerateProof'),
  proofOutput: document.getElementById('mptProofOutput'),
  spvStatus: document.getElementById('mptSpvStatus'),
  tamperValue: document.getElementById('mptTamperValue'),
  btnTamperVerify: document.getElementById('btnTamperVerify'),
};

let ctx;
let trie;
let camera = { x: 0, y: 0, zoom: 1 };
let isDragging = false;
let lastMouse = { x: 0, y: 0 };
let nodesLayout = []; // Cache of {node, x, y}
let hoveredNode = null;
let useCompression = true;

// Mock Keccak-256 for browser visualization
function keccak256(str) {
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    let ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return '0x' + (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

// ==========================================
// 2. MPT CORE DATA STRUCTURES
// ==========================================
const NODE_TYPE = {
  BRANCH: 'Branch',
  EXTENSION: 'Extension',
  LEAF: 'Leaf',
};

class MPTNode {
  constructor(type) {
    this.type = type;
    this.hash = null;
  }
  recalculateHash() {}
}

class BranchNode extends MPTNode {
  constructor() {
    super(NODE_TYPE.BRANCH);
    this.branches = new Array(16).fill(null);
    this.value = null; // Used if path ends exactly here
  }
  recalculateHash() {
    const data = this.branches.map((b) => (b ? b.hash : ''));
    data.push(this.value || '');
    this.hash = keccak256(data.join(','));
    return this.hash;
  }
}

class ExtensionNode extends MPTNode {
  constructor(sharedNibbles, child) {
    super(NODE_TYPE.EXTENSION);
    this.sharedNibbles = sharedNibbles;
    this.child = child; // Always a BranchNode in Ethereum MPT
  }
  recalculateHash() {
    this.hash = keccak256(`ext:${this.sharedNibbles}:${this.child.hash}`);
    return this.hash;
  }
}

class LeafNode extends MPTNode {
  constructor(pathSuffix, value) {
    super(NODE_TYPE.LEAF);
    this.pathSuffix = pathSuffix;
    this.value = value;
  }
  recalculateHash() {
    this.hash = keccak256(`leaf:${this.pathSuffix}:${this.value}`);
    return this.hash;
  }
}

class MerklePatriciaTrie {
  constructor() {
    this.root = null;
    this.accounts = new Map();
  }

  insert(hexKey, value) {
    hexKey = hexKey.toLowerCase();
    this.accounts.set(hexKey, value);
    this.root = this._insert(this.root, hexKey, value);
    this.recalculateAllHashes(this.root);
  }

  _insert(node, path, value) {
    if (!node) {
      return new LeafNode(path, value);
    }

    if (node.type === NODE_TYPE.LEAF) {
      const matchLen = this._getCommonPrefixLen(node.pathSuffix, path);

      // Exact match - update value
      if (matchLen === node.pathSuffix.length && matchLen === path.length) {
        node.value = value;
        return node;
      }

      // Need to split into Branch Node (and possibly an Extension Node above it)
      const branch = new BranchNode();

      // If leaf had remaining path after match, add as leaf to branch
      if (matchLen < node.pathSuffix.length) {
        const leafBranchChar = parseInt(node.pathSuffix[matchLen], 16);
        const newLeafPath = node.pathSuffix.slice(matchLen + 1);
        branch.branches[leafBranchChar] = new LeafNode(newLeafPath, node.value);
      } else {
        branch.value = node.value;
      }

      // Add new value to branch
      if (matchLen < path.length) {
        const newBranchChar = parseInt(path[matchLen], 16);
        const newLeafPath = path.slice(matchLen + 1);
        branch.branches[newBranchChar] = new LeafNode(newLeafPath, value);
      } else {
        branch.value = value;
      }

      if (matchLen > 0 && useCompression) {
        return new ExtensionNode(path.slice(0, matchLen), branch);
      } else if (matchLen > 0 && !useCompression) {
        // Without compression, we create a chain of branches
        let curr = branch;
        for (let i = matchLen - 1; i >= 0; i--) {
          let newBranch = new BranchNode();
          let c = parseInt(path[i], 16);
          newBranch.branches[c] = curr;
          curr = newBranch;
        }
        return curr;
      }
      return branch;
    }

    if (node.type === NODE_TYPE.EXTENSION) {
      const matchLen = this._getCommonPrefixLen(node.sharedNibbles, path);

      if (matchLen === node.sharedNibbles.length) {
        // Path matches extension entirely, pass to child
        node.child = this._insert(node.child, path.slice(matchLen), value);
        return node;
      }

      // Split extension node
      const branch = new BranchNode();

      // Existing child goes to one branch
      const extBranchChar = parseInt(node.sharedNibbles[matchLen], 16);
      const remainingExt = node.sharedNibbles.slice(matchLen + 1);

      if (remainingExt.length > 0) {
        branch.branches[extBranchChar] = new ExtensionNode(remainingExt, node.child);
      } else {
        branch.branches[extBranchChar] = node.child;
      }

      // New path goes to another branch
      if (matchLen < path.length) {
        const newBranchChar = parseInt(path[matchLen], 16);
        branch.branches[newBranchChar] = new LeafNode(path.slice(matchLen + 1), value);
      } else {
        branch.value = value;
      }

      if (matchLen > 0) {
        return new ExtensionNode(node.sharedNibbles.slice(0, matchLen), branch);
      }
      return branch;
    }

    if (node.type === NODE_TYPE.BRANCH) {
      if (path.length === 0) {
        node.value = value;
        return node;
      }
      const branchChar = parseInt(path[0], 16);
      node.branches[branchChar] = this._insert(node.branches[branchChar], path.slice(1), value);
      return node;
    }

    return node;
  }

  _getCommonPrefixLen(s1, s2) {
    let i = 0;
    while (i < s1.length && i < s2.length && s1[i] === s2[i]) i++;
    return i;
  }

  recalculateAllHashes(node) {
    if (!node) return null;
    if (node.type === NODE_TYPE.LEAF) {
      return node.recalculateHash();
    }
    if (node.type === NODE_TYPE.EXTENSION) {
      this.recalculateAllHashes(node.child);
      return node.recalculateHash();
    }
    if (node.type === NODE_TYPE.BRANCH) {
      for (let i = 0; i < 16; i++) {
        if (node.branches[i]) this.recalculateAllHashes(node.branches[i]);
      }
      return node.recalculateHash();
    }
  }

  getProof(hexKey) {
    const proof = [];
    let current = this.root;
    let path = hexKey.toLowerCase();

    while (current) {
      if (current.type === NODE_TYPE.LEAF) {
        if (current.pathSuffix === path) {
          proof.push({ type: 'Leaf', data: `leaf:${current.pathSuffix}:${current.value}` });
          return proof;
        }
        break; // Key mismatch
      }

      if (current.type === NODE_TYPE.EXTENSION) {
        if (!path.startsWith(current.sharedNibbles)) break;
        proof.push({
          type: 'Extension',
          data: `ext:${current.sharedNibbles}:${current.child.hash}`,
        });
        path = path.slice(current.sharedNibbles.length);
        current = current.child;
        continue;
      }

      if (current.type === NODE_TYPE.BRANCH) {
        const hashes = current.branches.map((b) => (b ? b.hash : ''));
        proof.push({ type: 'Branch', data: hashes });
        if (path.length === 0) break;
        const idx = parseInt(path[0], 16);
        path = path.slice(1);
        current = current.branches[idx];
        continue;
      }
    }
    return null; // Key not found
  }
}

// SPV Verification Engine
function verifySPVProof(rootHash, hexKey, proof, leafValue) {
  if (!proof || proof.length === 0) return false;

  // We work backwards or verify top down. Top down is easier.
  let expectedHash = rootHash;
  let currentPath = hexKey;

  for (let i = 0; i < proof.length; i++) {
    const step = proof[i];

    if (step.type === 'Branch') {
      const hashes = step.data;
      const branchHash = keccak256(hashes.join(','));
      if (branchHash !== expectedHash) return false;

      if (currentPath.length > 0) {
        const idx = parseInt(currentPath[0], 16);
        expectedHash = hashes[idx];
        currentPath = currentPath.slice(1);
      }
    } else if (step.type === 'Extension') {
      const extHash = keccak256(step.data);
      if (extHash !== expectedHash) return false;

      const parts = step.data.split(':');
      const nibbles = parts[1];
      expectedHash = parts[2];

      if (!currentPath.startsWith(nibbles)) return false;
      currentPath = currentPath.slice(nibbles.length);
    } else if (step.type === 'Leaf') {
      const leafHash = keccak256(step.data);
      if (leafHash !== expectedHash) return false;

      const parts = step.data.split(':');
      if (parts[1] !== currentPath) return false;

      // Validate value if provided
      if (leafValue !== undefined && parts[2] !== leafValue) {
        return false;
      }
    }
  }
  return true;
}

// ==========================================
// 3. LAYOUT & RENDERING
// ==========================================

function mkComputeLayout(node, x, y, levelWidth) {
  if (!node) return;
  nodesLayout.push({ node, x, y });

  const yGap = 100;

  if (node.type === NODE_TYPE.EXTENSION) {
    mkComputeLayout(node.child, x, y + yGap, levelWidth);
  } else if (node.type === NODE_TYPE.BRANCH) {
    const children = [];
    for (let i = 0; i < 16; i++) {
      if (node.branches[i]) children.push({ idx: i, child: node.branches[i] });
    }

    const totalW = levelWidth;
    const step = totalW / Math.max(1, children.length);
    let currX = x - totalW / 2 + step / 2;

    children.forEach((c) => {
      // Label edges
      node[`_edge_${c.idx}`] = { x1: x, y1: y, x2: currX, y2: y + yGap, label: c.idx.toString(16) };
      mkComputeLayout(c.child, currX, y + yGap, step * 0.9);
      currX += step;
    });
  }
}

function updateCanvasLayout() {
  nodesLayout = [];
  if (trie.root) {
    // Base width 1000 to spread branches
    mkComputeLayout(trie.root, 0, -150, 1000);
  }
}

function renderLoop() {
  if (!ctx) return;
  const cw = els.canvas.width;
  const ch = els.canvas.height;

  ctx.clearRect(0, 0, cw, ch);
  ctx.save();
  ctx.translate(cw / 2 + camera.x, ch / 2 + camera.y);
  ctx.scale(camera.zoom, camera.zoom);

  // Draw Edges
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.font = '12px "Fira Code"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  nodesLayout.forEach((item) => {
    const { node, x, y } = item;

    if (node.type === NODE_TYPE.EXTENSION && node.child) {
      const childItem = nodesLayout.find((n) => n.node === node.child);
      if (childItem) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(childItem.x, childItem.y);
        ctx.stroke();

        // Draw label
        ctx.fillStyle = '#a855f7';
        ctx.fillText(node.sharedNibbles, (x + childItem.x) / 2, (y + childItem.y) / 2);
      }
    } else if (node.type === NODE_TYPE.BRANCH) {
      for (let i = 0; i < 16; i++) {
        if (node[`_edge_${i}`]) {
          const edge = node[`_edge_${i}`];
          ctx.beginPath();
          ctx.moveTo(edge.x1, edge.y1);
          ctx.lineTo(edge.x2, edge.y2);
          ctx.stroke();

          ctx.fillStyle = '#3b82f6';
          ctx.fillText(edge.label, (edge.x1 + edge.x2) / 2, (edge.y1 + edge.y2) / 2 - 10);
        }
      }
    }
  });

  // Draw Nodes
  nodesLayout.forEach((item) => {
    const { node, x, y } = item;
    const isHovered = hoveredNode === node;

    ctx.beginPath();
    let radius = 24;
    ctx.arc(x, y, radius, 0, Math.PI * 2);

    if (node.type === NODE_TYPE.BRANCH) {
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#3b82f6';
    } else if (node.type === NODE_TYPE.EXTENSION) {
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#a855f7';
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#10b981';
      radius = 28;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
    }

    ctx.fill();
    ctx.lineWidth = isHovered ? 4 : 2;
    ctx.stroke();

    // Node content icon/text
    ctx.fillStyle = '#fff';
    if (node.type === NODE_TYPE.BRANCH) {
      ctx.fillText('B', x, y);
    } else if (node.type === NODE_TYPE.EXTENSION) {
      ctx.fillText('E', x, y);
    } else {
      ctx.fillText(node.pathSuffix.substring(0, 3) + '..', x, y - 6);
      ctx.font = '10px "Fira Code"';
      ctx.fillStyle = '#10b981';
      ctx.fillText(node.value.substring(0, 6), x, y + 8);
      ctx.font = '12px "Fira Code"';
    }

    if (isHovered) {
      drawTooltip(node, x, y + radius + 10);
    }
  });

  ctx.restore();
  requestAnimationFrame(renderLoop);
}

function drawTooltip(node, x, y) {
  ctx.save();
  let text = `Hash: ${node.hash ? node.hash.substring(0, 10) + '...' : 'null'}`;
  if (node.type === NODE_TYPE.EXTENSION) text += `\nPrefix: ${node.sharedNibbles}`;
  if (node.type === NODE_TYPE.LEAF) text += `\nSuffix: ${node.pathSuffix}\nValue: ${node.value}`;

  const lines = text.split('\n');
  ctx.font = '12px "Fira Code"';
  let maxW = 0;
  lines.forEach((l) => {
    let m = ctx.measureText(l).width;
    if (m > maxW) maxW = m;
  });

  ctx.fillStyle = 'rgba(15,23,42,0.9)';
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.fillRect(x - maxW / 2 - 10, y, maxW + 20, lines.length * 16 + 10);
  ctx.strokeRect(x - maxW / 2 - 10, y, maxW + 20, lines.length * 16 + 10);

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  lines.forEach((l, i) => {
    ctx.fillText(l, x - maxW / 2, y + 16 + i * 16);
  });
  ctx.restore();
}

// ==========================================
// 4. INIT & UI BINDINGS
// ==========================================

function initMPT() {
  const wrap = els.canvas.parentElement;
  els.canvas.width = wrap.clientWidth;
  els.canvas.height = wrap.clientHeight;
  ctx = els.canvas.getContext('2d');

  trie = new MerklePatriciaTrie();

  // Bind Events
  setupCanvasEvents();

  els.btnInsert.addEventListener('click', handleInsert);
  els.btnToggleCompression.addEventListener('click', toggleCompression);
  els.btnLoadEthereum.addEventListener('click', loadEthereumScenario);
  els.btnClear.addEventListener('click', clearTrie);

  els.btnGenerateProof.addEventListener('click', handleGenerateProof);
  els.btnTamperVerify.addEventListener('click', handleTamperVerify);

  // Initial Load
  loadEthereumScenario();

  // Start Loop
  renderLoop();
}

function handleInsert() {
  const key = els.insertKey.value.trim().toLowerCase();
  const val = els.insertValue.value.trim();
  if (!key || !val || !/^[0-9a-f]+$/.test(key)) {
    if (window.showToast) window.showToast('Key must be a valid hex string', 'error');
    return;
  }

  trie.insert(key, val);
  updateUI();
  els.insertKey.value = '';
  els.insertValue.value = '';
}

function toggleCompression() {
  useCompression = !useCompression;
  els.btnToggleCompression.innerHTML = useCompression
    ? '<i class="fas fa-compress"></i> Disable Compression'
    : '<i class="fas fa-expand"></i> Enable Compression';

  // Rebuild trie
  const entries = Array.from(trie.accounts.entries());
  trie = new MerklePatriciaTrie();
  entries.forEach(([k, v]) => trie.insert(k, v));
  updateUI();
}

function clearTrie() {
  trie = new MerklePatriciaTrie();
  updateUI();
}

function loadEthereumScenario() {
  trie = new MerklePatriciaTrie();
  const accounts = [
    ['1a2b3c', '100 ETH'],
    ['1a2b4d', '50 ETH'],
    ['1a5f99', '10 ETH'],
    ['f00d1e', '5 ETH'],
    ['f00b4r', '900 ETH'],
  ];
  accounts.forEach((a) => trie.insert(a[0], a[1]));

  // Reset camera
  camera = { x: 0, y: 0, zoom: 1 };
  updateUI();
}

function updateUI() {
  els.rootHash.textContent = trie.root ? trie.root.hash : 'Empty';
  updateCanvasLayout();

  // Update Select
  const currentSel = els.selectAccount.value;
  els.selectAccount.innerHTML = '<option value="">-- Select Account --</option>';
  Array.from(trie.accounts.keys())
    .sort()
    .forEach((k) => {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = `0x${k} (${trie.accounts.get(k)})`;
      els.selectAccount.appendChild(opt);
    });
  if (trie.accounts.has(currentSel)) {
    els.selectAccount.value = currentSel;
  }

  // Reset SPV
  els.spvStatus.className = 'mpt-spv-status';
  els.spvStatus.innerHTML = 'Waiting for proof...';
  els.tamperValue.value = '';
  els.tamperValue.disabled = true;
  els.btnTamperVerify.disabled = true;
}

function handleGenerateProof() {
  const key = els.selectAccount.value;
  if (!key) return;

  const proof = trie.getProof(key);
  if (!proof) {
    els.proofOutput.textContent = 'Failed to generate proof. Key not found.';
    return;
  }

  let html = `<strong>Proof for 0x${key}:</strong>\n\n`;
  proof.forEach((p, i) => {
    if (p.type === 'Branch') {
      html += `[${i}] Branch Node:\n  Hash Array: [${p.data
        .map((h) => (h ? h.substring(0, 8) + '...' : ''))
        .filter((x) => x)
        .join(', ')}]\n\n`;
    } else {
      html += `[${i}] ${p.type} Node:\n  Data: ${p.data}\n\n`;
    }
  });
  els.proofOutput.innerHTML = html;

  // Auto-Verify Happy Path
  const val = trie.accounts.get(key);
  const isValid = verifySPVProof(trie.root.hash, key, proof, val);

  els.spvStatus.className = `mpt-spv-status ${isValid ? '' : 'rejected'}`;
  els.spvStatus.innerHTML = isValid
    ? `<strong class="mpt-success-text"><i class="fas fa-check-circle"></i> Proof Verified!</strong><br><br>The Light Client independently hashed the proof and matched the State Root: ${trie.root.hash}<br><br>Balance confirmed: ${val}`
    : `<strong class="mpt-danger-text"><i class="fas fa-times-circle"></i> Verification Failed!</strong>`;

  // Enable Tampering
  els.tamperValue.disabled = false;
  els.btnTamperVerify.disabled = false;
  els.tamperValue.value = val;

  window.currentProof = proof;
  window.currentKey = key;
}

function handleTamperVerify() {
  const key = window.currentKey;
  const proof = window.currentProof;
  const fakeVal = els.tamperValue.value.trim();

  if (!key || !proof) return;

  const root = trie.root ? trie.root.hash : '';

  // First modify the proof's leaf node with the fake value
  const tamperedProof = JSON.parse(JSON.stringify(proof));
  const leafStep = tamperedProof.find((p) => p.type === 'Leaf');
  if (leafStep) {
    const parts = leafStep.data.split(':');
    leafStep.data = `leaf:${parts[1]}:${fakeVal}`;
  }

  const isValid = verifySPVProof(root, key, tamperedProof, fakeVal);

  els.spvStatus.className = `mpt-spv-status ${isValid ? '' : 'rejected'}`;
  if (!isValid) {
    els.spvStatus.innerHTML = `<strong class="mpt-danger-text"><i class="fas fa-times-circle"></i> Tamper Detected!</strong><br><br>The Light Client hashed the provided fake balance [${fakeVal}], but the resulting Root Hash did NOT match the canonical State Root.<br><br>Expected: ${root}<br>Proof Rejected.`;
    // Animate reject
    els.spvStatus.style.animation = 'none';
    setTimeout(() => (els.spvStatus.style.animation = 'flash-red 1s ease'), 10);
  } else {
    els.spvStatus.innerHTML =
      'Wait... somehow the fake data hashed correctly? (This should never happen!)';
  }
}

// Canvas Interaction
function setupCanvasEvents() {
  const cvs = els.canvas;

  cvs.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouse = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mouseup', () => (isDragging = false));

  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      camera.x += (e.clientX - lastMouse.x) / camera.zoom;
      camera.y += (e.clientY - lastMouse.y) / camera.zoom;
      lastMouse = { x: e.clientX, y: e.clientY };
    }

    // Hover detection
    const rect = cvs.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - cvs.width / 2) / camera.zoom - camera.x;
    const mouseY = (e.clientY - rect.top - cvs.height / 2) / camera.zoom - camera.y;

    hoveredNode = null;
    nodesLayout.forEach((item) => {
      const dx = item.x - mouseX;
      const dy = item.y - mouseY;
      if (dx * dx + dy * dy < 900) {
        hoveredNode = item.node;
      }
    });
  });

  cvs.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomRate = 0.1;
    if (e.deltaY < 0) camera.zoom += zoomRate;
    else camera.zoom -= zoomRate;
    camera.zoom = Math.max(0.2, Math.min(camera.zoom, 3));
  });
}
