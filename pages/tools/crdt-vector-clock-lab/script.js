/* ============================================================
   CRDT & Vector Clock Resolution Lab JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // DOM ELEMENTS
  const crdtModelSelect = document.getElementById('crdtModelSelect');
  const btnPartitionNetwork = document.getElementById('btnPartitionNetwork');
  const btnResyncNetwork = document.getElementById('btnResyncNetwork');
  const btnGarbageCollect = document.getElementById('btnGarbageCollect');
  const networkStatusPill = document.getElementById('networkStatusPill');
  const vcMatrixBody = document.getElementById('vcMatrixBody');
  const opTreeContainer = document.getElementById('opTreeContainer');
  const crdtConsole = document.getElementById('crdtConsole');

  // STATE DATA
  const nodeNames = ['NodeA', 'NodeB', 'NodeC'];
  let currentModel = 'text'; // 'text', 'lww', 'pn-counter'
  let networkPartitioned = false;

  // PEERS STATE STORE
  const peers = {
    NodeA: { online: true, clock: { NodeA: 0, NodeB: 0, NodeC: 0 }, textBuffer: "Hello CRDT", counterVal: 0, pVector: { NodeA:0, NodeB:0, NodeC:0 }, nVector: { NodeA:0, NodeB:0, NodeC:0 }, offlineOps: [] },
    NodeB: { online: true, clock: { NodeA: 0, NodeB: 0, NodeC: 0 }, textBuffer: "Hello CRDT", counterVal: 0, pVector: { NodeA:0, NodeB:0, NodeC:0 }, nVector: { NodeA:0, NodeB:0, NodeC:0 }, offlineOps: [] },
    NodeC: { online: true, clock: { NodeA: 0, NodeB: 0, NodeC: 0 }, textBuffer: "Hello CRDT", counterVal: 0, pVector: { NodeA:0, NodeB:0, NodeC:0 }, nVector: { NodeA:0, NodeB:0, NodeC:0 }, offlineOps: [] }
  };

  // GLOBAL CRDT OPERATION LOG / SEQUENCE ELEMENTS
  let crdtSequence = [
    { id: 'op-0', char: 'H', originNode: 'NodeA', clock: { NodeA: 1, NodeB: 0, NodeC: 0 }, tombstone: false },
    { id: 'op-1', char: 'e', originNode: 'NodeA', clock: { NodeA: 2, NodeB: 0, NodeC: 0 }, tombstone: false },
    { id: 'op-2', char: 'l', originNode: 'NodeA', clock: { NodeA: 3, NodeB: 0, NodeC: 0 }, tombstone: false },
    { id: 'op-3', char: 'l', originNode: 'NodeA', clock: { NodeA: 4, NodeB: 0, NodeC: 0 }, tombstone: false },
    { id: 'op-4', char: 'o', originNode: 'NodeA', clock: { NodeA: 5, NodeB: 0, NodeC: 0 }, tombstone: false }
  ];

  // INITIALIZATION
  function init() {
    setupEventListeners();
    updateUI();
    log('CRDT Vector Clock Lab initialized. Peers online.', 'info');
  }

  function setupEventListeners() {
    crdtModelSelect.addEventListener('change', (e) => {
      currentModel = e.target.value;
      log(`Switched CRDT model to: ${currentModel.toUpperCase()}`, 'info');

      // Toggle UI visibility
      document.querySelectorAll('.crdt-textarea').forEach(ta => ta.style.display = currentModel === 'pn-counter' ? 'none' : 'block');
      document.querySelectorAll('.crdt-counter-controls').forEach(cc => cc.style.display = currentModel === 'pn-counter' ? 'flex' : 'none');
      updateUI();
    });

    // Online/Offline node toggles
    document.querySelectorAll('.crdt-node-online-toggle').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const node = e.target.dataset.node;
        peers[node].online = e.target.checked;
        const panel = document.getElementById(`panel-${node}`);
        panel.classList.toggle('offline-node', !peers[node].online);
        log(`Peer ${node} toggled ${peers[node].online ? 'ONLINE' : 'OFFLINE'}`, peers[node].online ? 'success' : 'warning');
        updateNetworkStatusPill();
      });
    });

    // Text editors change
    nodeNames.forEach(node => {
      const textarea = document.getElementById(`editor-${node}`);
      textarea.value = peers[node].textBuffer;

      const commitBtn = document.querySelector(`#panel-${node} .btn-local-op`);
      commitBtn.addEventListener('click', () => {
        const newText = textarea.value;
        commitLocalOp(node, newText);
      });
    });

    // Counter buttons
    document.querySelectorAll('.btn-inc').forEach(btn => {
      btn.addEventListener('click', () => {
        const node = btn.dataset.node;
        commitCounterOp(node, 1);
      });
    });

    document.querySelectorAll('.btn-dec').forEach(btn => {
      btn.addEventListener('click', () => {
        const node = btn.dataset.node;
        commitCounterOp(node, -1);
      });
    });

    // Partition Network
    btnPartitionNetwork.addEventListener('click', () => {
      networkPartitioned = true;
      nodeNames.forEach(n => {
        peers[n].online = false;
        document.querySelector(`.crdt-node-online-toggle[data-node="${n}"]`).checked = false;
        document.getElementById(`panel-${n}`).classList.add('offline-node');
      });
      updateNetworkStatusPill();
      log('NETWORK PARTITIONED: All peer nodes are now offline.', 'warning');
    });

    // Re-sync Network
    btnResyncNetwork.addEventListener('click', () => {
      networkPartitioned = false;
      nodeNames.forEach(n => {
        peers[n].online = true;
        document.querySelector(`.crdt-node-online-toggle[data-node="${n}"]`).checked = true;
        document.getElementById(`panel-${n}`).classList.remove('offline-node');
      });
      updateNetworkStatusPill();
      log('NETWORK RE-CONNECTED: Syncing offline ops and merging vector clocks...', 'info');
      syncAllPeers();
    });

    // Tombstone GC
    btnGarbageCollect.addEventListener('click', () => {
      const beforeLen = crdtSequence.length;
      crdtSequence = crdtSequence.filter(item => !item.tombstone);
      const purged = beforeLen - crdtSequence.length;
      log(`Tombstone GC executed. Purged ${purged} deleted tombstones from memory.`, 'success');
      updateUI();
    });

    document.getElementById('btnClearConsole').addEventListener('click', () => {
      crdtConsole.innerHTML = '';
    });
  }

  function updateNetworkStatusPill() {
    const anyOffline = nodeNames.some(n => !peers[n].online);
    networkStatusPill.className = `crdt-status-pill ${anyOffline ? 'offline' : ''}`;
    networkStatusPill.innerHTML = anyOffline ? '<i class="fas fa-wifi-slash"></i> Network: Partitioned / Offline Peers' : '<i class="fas fa-wifi"></i> Network: Connected';
  }

  // COMMIT LOCAL OPERATIONS
  function commitLocalOp(node, newText) {
    // Tick local vector clock
    peers[node].clock[node]++;
    const currentClock = { ...peers[node].clock };

    peers[node].textBuffer = newText;

    const op = {
      id: `op-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      originNode: node,
      clock: currentClock,
      text: newText,
      timestamp: Date.now()
    };

    // Update sequence log items
    crdtSequence.push({
      id: op.id,
      char: newText.slice(-1) || '[DEL]',
      originNode: node,
      clock: currentClock,
      tombstone: false
    });

    log(`[OP COMMIT] ${node} committed edit. Vector Clock V_${node}: ${formatClock(currentClock)}`, 'info');

    if (peers[node].online && !networkPartitioned) {
      syncAllPeers();
    } else {
      peers[node].offlineOps.push(op);
      log(`[OFFLINE OP] ${node} stored op locally in buffer (Offline).`, 'warning');
    }

    updateUI();
  }

  function commitCounterOp(node, delta) {
    peers[node].clock[node]++;
    if (delta > 0) {
      peers[node].pVector[node]++;
    } else {
      peers[node].nVector[node]++;
    }

    log(`[PN-COUNTER] ${node} ${delta > 0 ? 'incremented' : 'decremented'} counter. Clock: ${formatClock(peers[node].clock)}`, 'info');

    if (peers[node].online && !networkPartitioned) {
      syncAllPeers();
    }
    updateUI();
  }

  // SYNC & MERGE PEERS
  function syncAllPeers() {
    const onlineNodes = nodeNames.filter(n => peers[n].online);
    if (onlineNodes.length === 0) return;

    // Merge Vector Clocks across online peers: V_merged[k] = max(V_n1[k], V_n2[k], ...)
    const mergedClock = { NodeA: 0, NodeB: 0, NodeC: 0 };
    onlineNodes.forEach(n => {
      nodeNames.forEach(k => {
        mergedClock[k] = Math.max(mergedClock[k], peers[n].clock[k]);
      });
    });

    // Latest text state / counter state merge
    let consensusText = peers[onlineNodes[0]].textBuffer;

    onlineNodes.forEach(n => {
      peers[n].clock = { ...mergedClock };
      peers[n].textBuffer = consensusText;
      
      // Update textareas
      const ta = document.getElementById(`editor-${n}`);
      if (ta) ta.value = consensusText;
    });

    log(`[CONVERGENCE] Vector Clocks synced across ${onlineNodes.join(', ')} -> ${formatClock(mergedClock)}. States converged!`, 'success');
    updateUI();
  }

  // UI RENDERERS
  function updateUI() {
    renderVectorClocks();
    renderMatrixTable();
    renderOpTree();
  }

  function renderVectorClocks() {
    nodeNames.forEach(n => {
      const clockEl = document.getElementById(`clock-${n}`);
      if (clockEl) clockEl.textContent = formatClock(peers[n].clock);

      if (currentModel === 'pn-counter') {
        const pSum = Object.values(peers[n].pVector).reduce((a,b)=>a+b, 0);
        const nSum = Object.values(peers[n].nVector).reduce((a,b)=>a+b, 0);
        const total = pSum - nSum;
        const valEl = document.getElementById(`val-${n}`);
        if (valEl) valEl.textContent = total;
      }
    });
  }

  function renderMatrixTable() {
    vcMatrixBody.innerHTML = '';

    nodeNames.forEach(n => {
      const c = peers[n].clock;
      const tr = document.createElement('tr');

      // Check causality vs NodeA
      let causalityText = '<span class="crdt-badge crdt-badge-add">Equal / In-Sync</span>';
      if (n !== 'NodeA') {
        const comp = compareClocks(c, peers['NodeA'].clock);
        if (comp === -1) causalityText = '<span><i class="fas fa-arrow-left"></i> Behind NodeA</span>';
        else if (comp === 1) causalityText = '<span><i class="fas fa-arrow-right"></i> Ahead of NodeA</span>';
        else if (comp === 0) causalityText = '<span style="color:var(--crdt-warning)"><i class="fas fa-arrows-split-up-and-left"></i> Concurrent Edit</span>';
      }

      tr.innerHTML = `
        <td><strong>${n}</strong></td>
        <td>${c.NodeA}</td>
        <td>${c.NodeB}</td>
        <td>${c.NodeC}</td>
        <td>${causalityText}</td>
      `;
      vcMatrixBody.appendChild(tr);
    });
  }

  function renderOpTree() {
    opTreeContainer.innerHTML = '';

    crdtSequence.forEach(item => {
      const div = document.createElement('div');
      div.className = `crdt-op-item ${item.tombstone ? 'tombstone' : ''}`;
      div.innerHTML = `
        <div>
          <strong>${item.id}</strong> — Char: <code>'${item.char}'</code>
          <div style="font-size:0.75rem; color:var(--crdt-text-muted-dark)">Origin: ${item.originNode} | Vector: ${formatClock(item.clock)}</div>
        </div>
        <div>
          <span class="crdt-badge ${item.tombstone ? 'crdt-badge-del' : 'crdt-badge-add'}">${item.tombstone ? 'TOMBSTONE' : 'ACTIVE'}</span>
        </div>
      `;
      opTreeContainer.appendChild(div);
    });
  }

  // UTILS
  function formatClock(clock) {
    return `[A:${clock.NodeA || 0}, B:${clock.NodeB || 0}, C:${clock.NodeC || 0}]`;
  }

  function compareClocks(v1, v2) {
    let greater = false;
    let lesser = false;

    nodeNames.forEach(k => {
      if ((v1[k] || 0) > (v2[k] || 0)) greater = true;
      if ((v1[k] || 0) < (v2[k] || 0)) lesser = true;
    });

    if (greater && !lesser) return 1;  // v1 > v2
    if (lesser && !greater) return -1; // v1 < v2
    if (!greater && !lesser) return 0; // v1 == v2
    return 0; // Concurrent (v1 || v2)
  }

  function log(msg, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = `crdt-log-entry ${type}`;
    div.textContent = `[${time}] ${msg}`;
    crdtConsole.appendChild(div);
    crdtConsole.scrollTop = crdtConsole.scrollHeight;
  }

  init();
});
