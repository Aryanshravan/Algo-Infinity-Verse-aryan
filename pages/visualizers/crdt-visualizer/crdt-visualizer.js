document.addEventListener('DOMContentLoaded', () => {
  initCRDT();
});

// ==========================================
// 1. STATE & CONSTANTS
// ==========================================
const CLIENTS = ['A', 'B', 'C'];
let networkPartitioned = false;
let networkLatency = 500;

// Central Network Router
const Network = {
  queues: { A: [], B: [], C: [] },
  broadcast: function (op, senderId) {
    CLIENTS.forEach((targetId) => {
      if (targetId !== senderId) {
        if (networkPartitioned) {
          this.queues[targetId].push({ op, senderId });
          updateQueueUI(targetId);
        } else {
          simulatePacket(senderId, targetId, op);
        }
      }
    });
  },
  heal: async function () {
    // Flush all queues
    const promises = [];
    CLIENTS.forEach((targetId) => {
      while (this.queues[targetId].length > 0) {
        const pkt = this.queues[targetId].shift();
        promises.push(simulatePacket(pkt.senderId, targetId, pkt.op));
      }
      updateQueueUI(targetId);
    });
    await Promise.all(promises);
  },
};

// ==========================================
// 2. CRDT LOGIC (RGA - Replicated Growable Array)
// ==========================================
class RGANode {
  constructor(char, id, parentId) {
    this.char = char;
    this.id = id; // { client: 'A', clock: 1 }
    this.parentId = parentId; // null for ROOT
    this.isDeleted = false;
  }
}

class CRDTClient {
  constructor(id) {
    this.id = id;
    this.vectorClock = { A: 0, B: 0, C: 0 };
    this.nodes = new Map(); // idStr -> RGANode
    this.childrenMap = new Map(); // parentIdStr -> [childIdStr]

    // Root node
    this.rootId = { client: 'ROOT', clock: 0 };
    const rootNode = new RGANode('', this.rootId, null);
    this.nodes.set(this.idStr(this.rootId), rootNode);
    this.childrenMap.set(this.idStr(this.rootId), []);
  }

  idStr(id) {
    return `${id.client}:${id.clock}`;
  }

  generateId() {
    this.vectorClock[this.id]++;
    updateClockUI(this.id, this.vectorClock);
    return { client: this.id, clock: this.vectorClock[this.id] };
  }

  insertLocal(char, index) {
    // Find parent by index
    const visibleNodes = this.getVisibleNodes();
    let parentId = this.rootId;
    if (index > 0 && index <= visibleNodes.length) {
      parentId = visibleNodes[index - 1].id;
    }

    const newId = this.generateId();
    const op = { type: 'INSERT', char, id: newId, parentId };
    this.applyOperation(op);
    Network.broadcast(op, this.id);
  }

  deleteLocal(index) {
    const visibleNodes = this.getVisibleNodes();
    if (index >= 0 && index < visibleNodes.length) {
      const targetId = visibleNodes[index].id;
      const op = { type: 'DELETE', id: targetId };
      // Increment local clock on delete too
      this.vectorClock[this.id]++;
      updateClockUI(this.id, this.vectorClock);
      op.clockUpdate = { client: this.id, clock: this.vectorClock[this.id] };

      this.applyOperation(op);
      Network.broadcast(op, this.id);
    }
  }

  applyOperation(op) {
    if (op.type === 'INSERT') {
      const node = new RGANode(op.char, op.id, op.parentId);
      this.nodes.set(this.idStr(op.id), node);

      const parentStr = this.idStr(op.parentId);
      if (!this.childrenMap.has(parentStr)) {
        this.childrenMap.set(parentStr, []);
      }
      this.childrenMap.set(this.idStr(op.id), []);

      // Insert child and sort children by id (client, clock) descending
      // to ensure eventual consistency ordering (highest clock/client wins tie)
      const children = this.childrenMap.get(parentStr);
      children.push(op.id);
      children.sort((a, b) => {
        if (a.clock === b.clock) {
          return b.client.localeCompare(a.client); // Descending client
        }
        return b.clock - a.clock; // Descending clock
      });

      // Update vector clock from remote
      if (op.id.client !== this.id) {
        this.vectorClock[op.id.client] = Math.max(this.vectorClock[op.id.client], op.id.clock);
        updateClockUI(this.id, this.vectorClock);
      }
    } else if (op.type === 'DELETE') {
      const node = this.nodes.get(this.idStr(op.id));
      if (node) {
        node.isDeleted = true;
      }
      if (op.clockUpdate && op.clockUpdate.client !== this.id) {
        this.vectorClock[op.clockUpdate.client] = Math.max(
          this.vectorClock[op.clockUpdate.client],
          op.clockUpdate.clock
        );
        updateClockUI(this.id, this.vectorClock);
      }
    }

    renderEditor(this.id);
    if (this.id === 'A') drawTree(); // Draw tree based on A's state for visualization
  }

  getVisibleNodes() {
    const result = [];
    this.traverse(this.rootId, (node) => {
      if (node.id.client !== 'ROOT' && !node.isDeleted) {
        result.push(node);
      }
    });
    return result;
  }

  traverse(id, callback) {
    const idS = this.idStr(id);
    const node = this.nodes.get(idS);
    if (node) callback(node);

    const children = this.childrenMap.get(idS) || [];
    children.forEach((childId) => {
      this.traverse(childId, callback);
    });
  }
}

const clients = {
  A: new CRDTClient('A'),
  B: new CRDTClient('B'),
  C: new CRDTClient('C'),
};

// ==========================================
// 3. UI CONTROLLERS
// ==========================================
let isEditing = false;
let currentClientFocus = null;
let lastKnownSelection = { client: null, offset: 0 };

function initCRDT() {
  // Bind network controls
  document.getElementById('networkToggle').addEventListener('change', (e) => {
    networkPartitioned = e.target.checked;
    CLIENTS.forEach((id) => {
      document.getElementById(`status-${id}`).textContent = networkPartitioned
        ? 'Offline'
        : 'Online';
      document.getElementById(`status-${id}`).className =
        `client-status ${networkPartitioned ? 'status-offline' : 'status-online'}`;
    });
  });

  const latSlider = document.getElementById('latencySlider');
  const latVal = document.getElementById('latencyVal');
  latSlider.addEventListener('input', (e) => {
    networkLatency = parseInt(e.target.value);
    latVal.textContent = `${networkLatency}ms`;
  });

  document.getElementById('btnSyncNow').addEventListener('click', () => {
    document.getElementById('networkToggle').checked = false;
    document.getElementById('networkToggle').dispatchEvent(new Event('change'));
    Network.heal();
  });

  document.getElementById('btnReset').addEventListener('click', resetSystem);

  // Bind Editors
  CLIENTS.forEach((id) => {
    const el = document.getElementById(`editor-${id}`);

    el.addEventListener('focus', () => {
      document.querySelector(`#client-${id.toLowerCase()}-panel .crdt-placeholder`).style.opacity =
        0;
      currentClientFocus = id;
    });

    el.addEventListener('blur', () => {
      if (el.textContent.length === 0) {
        document.querySelector(
          `#client-${id.toLowerCase()}-panel .crdt-placeholder`
        ).style.opacity = 1;
      }
      currentClientFocus = null;
    });

    // Intercept keystrokes to translate to CRDT ops
    el.addEventListener('keydown', (e) => handleKeydown(e, id));
    // Prevent normal typing to avoid breaking HTML spans
    el.addEventListener('beforeinput', (e) => {
      e.preventDefault();
    });
  });

  // Canvas setup
  const treeWrap = document.getElementById('treeWrapper');
  const cvs = document.getElementById('crdtCanvas');
  cvs.width = treeWrap.clientWidth;
  cvs.height = treeWrap.clientHeight;

  // Tooltip
  setupTooltip();

  resetSystem();
}

function handleKeydown(e, clientId) {
  if (e.ctrlKey || e.metaKey || e.altKey) return; // Allow browser shortcuts

  const client = clients[clientId];
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  // Calculate precise offset based on span elements
  let offset = 0;
  const editor = document.getElementById(`editor-${clientId}`);

  if (range.startContainer === editor) {
    offset = range.startOffset;
  } else {
    let node = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
    // Node is a span.crdt-char
    let curr = editor.firstChild;
    while (curr) {
      if (curr === node) {
        offset++;
        break;
      }
      offset++;
      curr = curr.nextSibling;
    }
    if (range.startOffset === 0 && offset > 0) offset--; // if cursor is before the char
  }

  if (e.key === 'Backspace') {
    if (offset > 0) {
      client.deleteLocal(offset - 1);
      setCursor(clientId, offset - 1);
    }
  } else if (e.key.length === 1) {
    // Normal character
    client.insertLocal(e.key, offset);
    setCursor(clientId, offset + 1);
  }
}

function renderEditor(clientId) {
  const el = document.getElementById(`editor-${clientId}`);
  const client = clients[clientId];

  // Save cursor if this is the active editor
  let activeOffset = -1;
  if (currentClientFocus === clientId) {
    const sel = window.getSelection();
    if (sel.rangeCount) {
      const range = sel.getRangeAt(0);
      if (range.startContainer === el) {
        activeOffset = range.startOffset;
      } else {
        let node = range.startContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
        let curr = el.firstChild;
        let off = 0;
        while (curr) {
          if (curr === node) {
            off++;
            break;
          }
          off++;
          curr = curr.nextSibling;
        }
        if (range.startOffset === 0 && off > 0) off--;
        activeOffset = off;
      }
    }
  }

  // Rebuild HTML
  el.innerHTML = '';
  const visibleNodes = client.getVisibleNodes();

  if (visibleNodes.length === 0 && currentClientFocus !== clientId) {
    document.querySelector(
      `#client-${clientId.toLowerCase()}-panel .crdt-placeholder`
    ).style.opacity = 1;
  } else {
    document.querySelector(
      `#client-${clientId.toLowerCase()}-panel .crdt-placeholder`
    ).style.opacity = 0;
  }

  visibleNodes.forEach((node) => {
    const span = document.createElement('span');
    span.className = `crdt-char char-${node.id.client.toLowerCase()}`;
    span.textContent = node.char;
    span.dataset.id = JSON.stringify(node.id);
    span.dataset.parent = JSON.stringify(node.parentId);
    el.appendChild(span);
  });

  // Restore cursor
  if (activeOffset > -1) {
    setCursor(clientId, activeOffset);
  }
}

function setCursor(clientId, offset) {
  const el = document.getElementById(`editor-${clientId}`);
  el.focus();
  const sel = window.getSelection();
  const range = document.createRange();

  if (offset === 0) {
    range.setStart(el, 0);
    range.collapse(true);
  } else {
    if (offset <= el.childNodes.length) {
      const targetNode = el.childNodes[offset - 1];
      if (targetNode) {
        range.setStart(targetNode.firstChild || targetNode, 1);
        range.collapse(true);
      }
    }
  }
  sel.removeAllRanges();
  sel.addRange(range);
}

function updateQueueUI(clientId) {
  const qCount = Network.queues[clientId].length;
  document.getElementById(`queue-${clientId.toLowerCase()}`).textContent = qCount;
}

function updateClockUI(clientId, clock) {
  document.getElementById(`clock-${clientId.toLowerCase()}`).textContent =
    `[A:${clock.A}, B:${clock.B}, C:${clock.C}]`;
}

function resetSystem() {
  CLIENTS.forEach((id) => {
    clients[id] = new CRDTClient(id);
    updateClockUI(id, { A: 0, B: 0, C: 0 });
    Network.queues[id] = [];
    updateQueueUI(id);
    renderEditor(id);
  });
  drawTree();
}

// ==========================================
// 4. ANIMATIONS & PACKETS
// ==========================================

function simulatePacket(senderId, targetId, op) {
  return new Promise((resolve) => {
    const layer = document.getElementById('packet-layer');
    const pkt = document.createElement('div');
    pkt.className = 'crdt-packet';

    let color = '#3b82f6';
    if (senderId === 'B') color = '#a855f7';
    if (senderId === 'C') color = '#10b981';
    pkt.style.color = color;
    pkt.style.background = color;

    // Calculate positions
    const senderEl = document.getElementById(`client-${senderId.toLowerCase()}-panel`);
    const targetEl = document.getElementById(`client-${targetId.toLowerCase()}-panel`);

    const sRect = senderEl.getBoundingClientRect();
    const tRect = targetEl.getBoundingClientRect();

    const sx = sRect.left + sRect.width / 2;
    const sy = sRect.top + sRect.height / 2;
    const tx = tRect.left + tRect.width / 2;
    const ty = tRect.top + tRect.height / 2;

    pkt.style.left = `${sx}px`;
    pkt.style.top = `${sy}px`;
    layer.appendChild(pkt);

    // Animate
    setTimeout(() => {
      pkt.style.transform = `translate(${tx - sx}px, ${ty - sy}px)`;
    }, 10);

    setTimeout(() => {
      layer.removeChild(pkt);
      clients[targetId].applyOperation(op);
      resolve();
    }, networkLatency || 100);
  });
}

// ==========================================
// 5. RGA TREE CANVAS
// ==========================================
let treeLayout = [];
let camera = { x: 0, y: 0, zoom: 1 };
let isDragging = false;
let lastMouse = { x: 0, y: 0 };

function drawTree() {
  const cvs = document.getElementById('crdtCanvas');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');

  // Compute layout based on Client A's state (they all converge)
  treeLayout = [];
  let currentX = 0;

  // Flatten traversal to layout left-to-right tree
  function layoutNode(id, depth) {
    const node = clients.A.nodes.get(clients.A.idStr(id));
    if (!node) return;

    treeLayout.push({
      node,
      x: currentX,
      y: depth * 60,
    });

    currentX += 40; // Spacing

    const children = clients.A.childrenMap.get(clients.A.idStr(id)) || [];
    children.forEach((childId) => layoutNode(childId, depth + 1));
  }

  layoutNode(clients.A.rootId, 0);

  // Center logic
  const totalWidth = currentX;

  ctx.clearRect(0, 0, cvs.width, cvs.height);
  ctx.save();
  ctx.translate(cvs.width / 2 - totalWidth / 2 + camera.x, 50 + camera.y);
  ctx.scale(camera.zoom, camera.zoom);

  // Draw Edges
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 2;
  treeLayout.forEach((item) => {
    if (item.node.parentId) {
      const parentItem = treeLayout.find(
        (t) => clients.A.idStr(t.node.id) === clients.A.idStr(item.node.parentId)
      );
      if (parentItem) {
        ctx.beginPath();
        ctx.moveTo(item.x, item.y);
        ctx.lineTo(parentItem.x, parentItem.y);
        ctx.stroke();
      }
    }
  });

  // Draw Nodes
  treeLayout.forEach((item) => {
    const { node, x, y } = item;

    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);

    if (node.isDeleted) {
      ctx.fillStyle = '#64748b'; // Tombstone
      ctx.globalAlpha = 0.5;
    } else {
      ctx.globalAlpha = 1.0;
      if (node.id.client === 'ROOT') ctx.fillStyle = '#f59e0b';
      else if (node.id.client === 'A') ctx.fillStyle = '#3b82f6';
      else if (node.id.client === 'B') ctx.fillStyle = '#a855f7';
      else if (node.id.client === 'C') ctx.fillStyle = '#10b981';
    }

    ctx.fill();
    ctx.globalAlpha = 1.0;

    ctx.fillStyle = '#fff';
    ctx.font = '12px "Fira Code"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (node.id.client === 'ROOT') {
      ctx.fillText('R', x, y);
    } else {
      ctx.fillText(node.char, x, y);
    }
  });

  ctx.restore();
}

function setupTooltip() {
  const tooltip = document.getElementById('crdtTooltip');

  document.addEventListener('mouseover', (e) => {
    if (e.target.classList && e.target.classList.contains('crdt-char')) {
      const idData = JSON.parse(e.target.dataset.id);
      const pData = JSON.parse(e.target.dataset.parent);

      tooltip.innerHTML = `
                <div style="color: var(--crdt-primary)">Node ID: [${idData.client}, ${idData.clock}]</div>
                <div style="color: var(--crdt-gray)">Parent ID: [${pData.client}, ${pData.clock}]</div>
            `;

      const rect = e.target.getBoundingClientRect();
      tooltip.style.left = `${rect.left + window.scrollX}px`;
      tooltip.style.top = `${rect.bottom + window.scrollY + 10}px`;
      tooltip.classList.add('visible');
    } else {
      tooltip.classList.remove('visible');
    }
  });

  // Canvas Dragging
  const cvs = document.getElementById('crdtCanvas');
  if (!cvs) return;
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
      drawTree();
    }
  });
  cvs.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomRate = 0.1;
    if (e.deltaY < 0) camera.zoom += zoomRate;
    else camera.zoom -= zoomRate;
    camera.zoom = Math.max(0.5, Math.min(camera.zoom, 3));
    drawTree();
  });
}
