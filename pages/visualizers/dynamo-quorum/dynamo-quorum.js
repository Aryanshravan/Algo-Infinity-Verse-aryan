/**
 * dynamo-quorum.js
 * Interactive Dynamo-Style Leaderless Quorum & Read-Repair Simulator
 */

document.addEventListener('DOMContentLoaded', () => {
  initDynamoQuorumVisualizer();
});

class DBNode {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.db = {}; // key -> { value, version: { nodeId -> sequence } }
    this.active = true;
  }

  write(key, value, versionVector) {
    this.db[key] = {
      value,
      version: { ...versionVector },
    };
  }

  read(key) {
    return this.db[key] || null;
  }
}

class Packet {
  constructor(fromNode, toNode, type, key, value, versionVector, callback) {
    this.from = fromNode;
    this.to = toNode;
    this.type = type; // 'WRITE', 'READ', 'WRITE_RESP', 'READ_RESP', 'REPAIR'
    this.key = key;
    this.value = value;
    this.versionVector = versionVector ? { ...versionVector } : null;
    this.callback = callback;

    this.progress = 0;
    this.x = fromNode.x;
    this.y = fromNode.y;
  }

  update(speed) {
    this.progress += speed;
    if (this.progress > 1) this.progress = 1;
    this.x = this.from.x + (this.to.x - this.from.x) * this.progress;
    this.y = this.from.y + (this.to.y - this.from.y) * this.progress;
  }
}

const els = {
  canvas: document.getElementById('networkCanvas'),
  wrapper: document.getElementById('canvasWrapper'),
  nSlider: document.getElementById('nSlider'),
  nVal: document.getElementById('nVal'),
  rSlider: document.getElementById('rSlider'),
  rVal: document.getElementById('rVal'),
  wSlider: document.getElementById('wSlider'),
  wVal: document.getElementById('wVal'),
  safetyBadge: document.getElementById('quorumSafetyBadge'),
  keyInput: document.getElementById('keyInput'),
  valueInput: document.getElementById('valueInput'),
  writeBtn: document.getElementById('writeBtn'),
  readBtn: document.getElementById('readBtn'),
  concurrentWriteBtn: document.getElementById('concurrentWriteBtn'),
  antiEntropyBtn: document.getElementById('antiEntropyBtn'),
  resetBtn: document.getElementById('resetBtn'),
  eventConsole: document.getElementById('eventConsole'),
  merkleDashboard: document.getElementById('merkleDashboard'),
  treeNode0: document.getElementById('treeNode0'),
  treeNode4: document.getElementById('treeNode4'),
};

let ctx;
let nodes = [];
let packets = [];
let clientPos = { x: 50, y: 50 };
let _animId = null;
let lastTime = performance.now();

// Global simulated client version sequences
let clientSequences = {};

function initDynamoQuorumVisualizer() {
  ctx = els.canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  bindEvents();
  resetWorld();

  _animId = requestAnimationFrame(simulatorLoop);
}

function resizeCanvas() {
  const rect = els.wrapper.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  els.canvas.width = rect.width * dpr;
  els.canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  // Reposition client node
  clientPos = { x: 40, y: rect.height / 2 };
  repositionNodes();
}

function repositionNodes() {
  const rect = els.wrapper.getBoundingClientRect();
  const numNodes = nodes.length;
  const centerX = rect.width / 2 + 50;
  const centerY = rect.height / 2;
  const radius = Math.min(rect.width, rect.height) * 0.3;

  for (let i = 0; i < numNodes; i++) {
    const angle = (i * 2 * Math.PI) / numNodes - Math.PI / 2;
    nodes[i].x = centerX + Math.cos(angle) * radius;
    nodes[i].y = centerY + Math.sin(angle) * radius;
  }
}

function bindEvents() {
  els.nSlider.addEventListener('input', (e) => {
    els.nVal.textContent = e.target.value;
    // Make sure R and W are capped at N
    els.rSlider.max = e.target.value;
    els.wSlider.max = e.target.value;
    if (parseInt(els.rSlider.value) > parseInt(e.target.value)) {
      els.rSlider.value = e.target.value;
      els.rVal.textContent = e.target.value;
    }
    if (parseInt(els.wSlider.value) > parseInt(e.target.value)) {
      els.wSlider.value = e.target.value;
      els.wVal.textContent = e.target.value;
    }
    resetWorld();
  });

  els.rSlider.addEventListener('input', (e) => {
    els.rVal.textContent = e.target.value;
    updateSafetyStatus();
  });

  els.wSlider.addEventListener('input', (e) => {
    els.wVal.textContent = e.target.value;
    updateSafetyStatus();
  });

  els.writeBtn.addEventListener('click', performQuorumWrite);
  els.readBtn.addEventListener('click', performQuorumRead);
  els.concurrentWriteBtn.addEventListener('click', triggerConcurrentConflict);
  els.antiEntropyBtn.addEventListener('click', toggleAntiEntropySync);
  els.resetBtn.addEventListener('click', resetWorld);
}

function resetWorld() {
  packets = [];
  nodes = [];
  clientSequences = {};
  els.merkleDashboard.style.display = 'none';

  const numNodes = parseInt(els.nSlider.value);
  for (let i = 0; i < numNodes; i++) {
    nodes.push(new DBNode(i, 0, 0));
  }

  // Seed some initial data so DB nodes aren't empty
  nodes.forEach((node) => {
    node.write('user_name', 'InitialSeed', { 0: 1 });
  });

  repositionNodes();
  updateSafetyStatus();
  logConsole('Simulation reset. Databases seeded with initial key: [user_name].', 'info');
}

function updateSafetyStatus() {
  const N = parseInt(els.nSlider.value);
  const R = parseInt(els.rSlider.value);
  const W = parseInt(els.wSlider.value);

  if (R + W > N) {
    els.safetyBadge.className = 'safety-badge safe';
    els.safetyBadge.innerHTML = `<i class="fas fa-check-circle"></i> Strict Quorum ($R + W > N$) - Warrants Causal Consistency`;
  } else {
    els.safetyBadge.className = 'safety-badge unsafe';
    els.safetyBadge.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Weak Quorum ($R + W \\le N$) - High Risk of Stale Reads`;
  }
}

function logConsole(message, type = 'info') {
  const line = document.createElement('div');
  line.className = `console-line console-${type}`;
  line.textContent = `> [${new Date().toLocaleTimeString()}] ${message}`;
  els.eventConsole.appendChild(line);
  els.eventConsole.scrollTop = els.eventConsole.scrollHeight;
}

// ==========================================
// QUORUM OPERATIONS & READ REPAIR
// ==========================================

function performQuorumWrite() {
  const key = els.keyInput.value.trim();
  const value = els.valueInput.value.trim();
  if (!key || !value) return;

  // Increment client version vector sequence
  if (!clientSequences[key]) {
    clientSequences[key] = {};
  }
  // Assume client performs write coordinator role. Coordinator node = Node 0
  const coordinator = nodes[0];
  const vector = { ...clientSequences[key] };
  vector[coordinator.id] = (vector[coordinator.id] || 0) + 1;
  clientSequences[key] = vector;

  logConsole(
    `Client initiates write coordinates: ${key} = "${value}" (Vector Clock: ${JSON.stringify(vector)})`,
    'info'
  );

  const W = parseInt(els.wSlider.value);
  let acks = 0;

  // Send Write RPCs to all nodes in preference list
  nodes.forEach((node) => {
    const p = new Packet(coordinator, node, 'WRITE', key, value, vector, () => {
      acks++;
      logConsole(`Received Write Ack from Node ${node.id}. Total: ${acks}/${W}`, 'write');
      if (acks === W) {
        logConsole(`Write Quorum satisfied successfully! (${W} acks received)`, 'write');
      }
    });
    packets.push(p);
  });
}

function performQuorumRead() {
  const key = els.keyInput.value.trim();
  if (!key) return;

  logConsole(`Client initiates read query for key: ${key}`, 'info');

  const R = parseInt(els.rSlider.value);
  const coordinator = nodes[0];

  let responses = [];

  nodes.forEach((node) => {
    const p = new Packet(coordinator, node, 'READ', key, null, null, (resp) => {
      responses.push(resp);
      if (responses.length === R) {
        resolveReadQuorum(key, responses);
      }
    });
    packets.push(p);
  });
}

function resolveReadQuorum(key, responses) {
  logConsole(`Read Quorum (${responses.length} responses) gathered. Resolving versions...`, 'info');

  let latestVal = null;
  let latestVector = null;
  let staleResponses = [];

  // Compare Version Vectors
  responses.forEach((resp) => {
    const data = resp.value; // { value, version }
    if (!data) return;

    if (!latestVal) {
      latestVal = data.value;
      latestVector = data.version;
      return;
    }

    // Compare vectors
    const relation = compareVectors(data.version, latestVector);
    if (relation === 'CONCURRENT') {
      logConsole(
        `Conflict Detected! Concurrent versions found: "${data.value}" vs "${latestVal}"`,
        'error'
      );
      latestVal = `CONFLICT: [${data.value} | ${latestVal}]`;
    } else if (relation === 'GREATER') {
      staleResponses.push({
        nodeId: resp.from.id,
        data: { value: latestVal, version: latestVector },
      });
      latestVal = data.value;
      latestVector = data.version;
    } else if (relation === 'LESS') {
      staleResponses.push({ nodeId: resp.from.id, data });
    }
  });

  logConsole(`Resolved Value: "${latestVal}"`, 'read');

  // READ REPAIR triggering for stale nodes
  if (staleResponses.length > 0 && latestVal && !latestVal.startsWith('CONFLICT')) {
    logConsole(
      `Read Repair triggered! Updating stale nodes: ${staleResponses.map((s) => s.nodeId).join(', ')}`,
      'info'
    );
    staleResponses.forEach((stale) => {
      const target = nodes[stale.nodeId];
      const repairPacket = new Packet(
        nodes[0],
        target,
        'REPAIR',
        key,
        latestVal,
        latestVector,
        () => {
          logConsole(`Node ${target.id} successfully repaired with latest version.`, 'read');
        }
      );
      packets.push(repairPacket);
    });
  }
}

// Version Vector Helper
function compareVectors(v1, v2) {
  let v1Greater = false;
  let v2Greater = false;

  const keys = new Set([...Object.keys(v1), ...Object.keys(v2)]);
  for (const k of keys) {
    const val1 = v1[k] || 0;
    const val2 = v2[k] || 0;
    if (val1 > val2) v1Greater = true;
    if (val2 > val1) v2Greater = true;
  }

  if (v1Greater && !v2Greater) return 'GREATER';
  if (v2Greater && !v1Greater) return 'LESS';
  if (!v1Greater && !v2Greater) return 'EQUAL';
  return 'CONCURRENT';
}

// ==========================================
// CONCURRENT CONFLICTS & ANTI-ENTROPY
// ==========================================

function triggerConcurrentConflict() {
  logConsole('Triggering concurrent database conflict...', 'info');

  // Node 0 and Node 4 will get concurrent writes for "user_name"
  // Node 0 writes "Akshat" (Vector: { 0: 2 })
  // Node 4 writes "Shukla" (Vector: { 4: 2 })
  nodes[0].write('user_name', 'Akshat', { 0: 2 });
  nodes[4].write('user_name', 'Shukla', { 4: 2 });

  logConsole('Node 0 locally accepts: user_name = "Akshat" (Vector: { 0:2 })', 'write');
  logConsole('Node 4 locally accepts: user_name = "Shukla" (Vector: { 4:2 })', 'write');
  logConsole('Perform a Quorum Read to observe dynamic conflict detection!', 'info');
}

let showMerkle = false;
function toggleAntiEntropySync() {
  showMerkle = !showMerkle;
  els.merkleDashboard.style.display = showMerkle ? 'block' : 'none';

  if (showMerkle) {
    renderMerkleTrees();
    logConsole('Background Merkle Trees generated. Conflicting leaves highlighted in Red.', 'info');
  }
}

function renderMerkleTrees() {
  // Generate simple hierarchical Merkle Trees comparing Node 0 and Node 4
  // Root -> HashA / HashB -> leaves
  const n0Val = nodes[0].db['user_name'] ? nodes[0].db['user_name'].value : 'Akshat';
  const n4Val = nodes[4].db['user_name'] ? nodes[4].db['user_name'].value : 'Shukla';
  const isConflict = n0Val !== n4Val;

  const rootHash0 = isConflict ? 'Root: Hash(4A8E)' : 'Root: Hash(88F2)';
  const rootHash4 = isConflict ? 'Root: Hash(912D)' : 'Root: Hash(88F2)';

  els.treeNode0.innerHTML = `
        <h5>Node 0 Merkle Tree</h5>
        <div class="merkle-node">
            <span>Root: ${rootHash0}</span>
            <div class="merkle-node">
                <span>Left: Hash(110B)</span>
                <div class="merkle-node merkle-leaf">leaf0: user_name = "${n0Val}"</div>
            </div>
            <div class="merkle-node">
                <span>Right: Hash(9B8E)</span>
                <div class="merkle-node merkle-leaf">leaf1: db_secret = "Seed12"</div>
            </div>
        </div>
    `;

  els.treeNode4.innerHTML = `
        <h5>Node 4 Merkle Tree</h5>
        <div class="merkle-node">
            <span>Root: ${rootHash4}</span>
            <div class="merkle-node">
                <span class="${isConflict ? 'conflict' : ''}">Left: ${isConflict ? 'Hash(E401)' : 'Hash(110B)'}</span>
                <div class="merkle-node merkle-leaf ${isConflict ? 'conflict' : ''}">leaf0: user_name = "${n4Val}"</div>
            </div>
            <div class="merkle-node">
                <span>Right: Hash(9B8E)</span>
                <div class="merkle-node merkle-leaf">leaf1: db_secret = "Seed12"</div>
            </div>
        </div>
    `;
}

// ==========================================
// PHYSICS ENGINE LOOP & RENDERING
// ==========================================

function updateSimulator(dt) {
  // Update Packet movements
  packets.forEach((p, idx) => {
    p.update(dt * 1.5);
    if (p.progress >= 1) {
      // Deliver packet payloads
      if (p.type === 'WRITE') {
        p.to.write(p.key, p.value, p.versionVector);
        // Send Response
        packets.push(new Packet(p.to, p.from, 'WRITE_RESP', p.key, null, null, p.callback));
      } else if (p.type === 'READ') {
        const data = p.to.read(p.key);
        packets.push(new Packet(p.to, p.from, 'READ_RESP', p.key, data, null, p.callback));
      } else if (p.type === 'WRITE_RESP' || p.type === 'READ_RESP' || p.type === 'REPAIR') {
        if (p.callback) p.callback(p);
      }
      // Remove
      packets.splice(idx, 1);
    }
  });
}

function drawSimulator() {
  const rect = els.wrapper.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  // 1. Draw Network Connections
  ctx.beginPath();
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      ctx.moveTo(nodes[i].x, nodes[i].y);
      ctx.lineTo(nodes[j].x, nodes[j].y);
    }
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 2. Draw Client Node
  ctx.beginPath();
  ctx.arc(clientPos.x, clientPos.y, 16, 0, Math.PI * 2);
  ctx.fillStyle = '#bae1ff';
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#bae1ff';
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#0f172a';
  ctx.font = '10px "Fira Code", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Client', clientPos.x, clientPos.y + 3);

  // Link coordinator to client
  ctx.beginPath();
  ctx.moveTo(clientPos.x, clientPos.y);
  ctx.lineTo(nodes[0].x, nodes[0].y);
  ctx.strokeStyle = 'rgba(186, 225, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // 3. Draw Nodes
  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, 25, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#bae1ff';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // Node ID
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Fira Code", monospace';
    ctx.fillText(`Node ${node.id}`, node.x, node.y - 3);

    // Display Database preview
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '8px "Fira Code", monospace';
    const key = 'user_name';
    const val = node.db[key] ? node.db[key].value : '-';
    ctx.fillText(val, node.x, node.y + 12);
  });

  // 4. Draw flying Packets
  packets.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);

    if (p.type === 'WRITE' || p.type === 'REPAIR') {
      ctx.fillStyle = '#10b981'; // Green
    } else if (p.type === 'READ') {
      ctx.fillStyle = '#818cf8'; // Indigo
    } else {
      ctx.fillStyle = '#bae1ff'; // Light Blue
    }
    ctx.fill();
  });
}

function simulatorLoop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  updateSimulator(dt);
  drawSimulator();

  _animId = requestAnimationFrame(simulatorLoop);
}
