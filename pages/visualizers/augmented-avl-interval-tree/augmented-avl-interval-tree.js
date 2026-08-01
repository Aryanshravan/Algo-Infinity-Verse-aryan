const U = document.getElementById.bind(document);
const C = document.createElement.bind(document);

let root = null;
let nodeCount = 0;
let highestLow = 0;
let allIntervals = [];

let isRunning = false;
let animFrame = null;
let gen = null;

let qL = 30,
  qH = 50;
let queryVisited = 0;
let queryFound = [];
let bfFoundCount = 0;
let currNode = null;
let prunedNodes = [];

class Node {
  constructor(id, low, high) {
    this.id = id;
    this.low = low;
    this.high = high;
    this.max = high;
    this.left = null;
    this.right = null;
    this.height = 1;
    this.x = 0;
    this.y = 0;
    this.px = 0;
    this.py = 0;
  }
}

function initHeroCanvas() {
  const c = U('heroCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let t = 0;
  function resize() {
    c.width = c.parentElement.clientWidth;
    c.height = c.parentElement.clientHeight;
  }
  window.addEventListener('resize', resize);
  resize();
  function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    t += 0.02;
    let cx = c.width / 2,
      cy = c.height / 2;
    ctx.strokeStyle = 'rgba(16,185,129,0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      let x = cx - 100 + i * 20;
      let y1 = cy - 50 + Math.sin(t + i) * 20;
      let y2 = cy + 50 + Math.cos(t + i) * 20;
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.stroke();

      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(x, Math.max(y1, y2), 4, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
}

function logMsg(msg, type = 'info') {
  const lc = U('logConsole');
  if (!lc) return;
  let d = C('div');
  d.className = 'log-entry ' + type;
  d.innerHTML = msg;
  lc.appendChild(d);
  lc.scrollTop = lc.scrollHeight;
}

function updateStatus(msg, cls = '') {
  const sb = U('avlStatus');
  const sm = U('statusMsg');
  if (!sb || !sm) return;
  sb.className = 'avl-status-bar ' + cls;
  sm.innerHTML = msg;
}

function getCanvasDims(id) {
  const cvs = U(id);
  return { w: cvs.clientWidth, h: cvs.clientHeight };
}

function h(n) {
  return n ? n.height : 0;
}
function m(n) {
  return n ? n.max : -Infinity;
}
function bal(n) {
  return n ? h(n.left) - h(n.right) : 0;
}

function updateMax(n) {
  if (U('chkCorrupt').checked) {
    logMsg(`[Corrupt] Skipping max-endpoint update for node [${n.low}, ${n.high}]`, 'danger');
    return;
  }
  n.max = Math.max(n.high, m(n.left), m(n.right));
}

function updateHeight(n) {
  n.height = Math.max(h(n.left), h(n.right)) + 1;
}

function rightRotate(y) {
  let x = y.left;
  let T2 = x.right;
  x.right = y;
  y.left = T2;
  updateHeight(y);
  updateHeight(x);
  updateMax(y);
  updateMax(x);
  logMsg(`[AVL] Right Rotation on node [${y.low}, ${y.high}]`, 'avl');
  return x;
}

function leftRotate(x) {
  let y = x.right;
  let T2 = y.left;
  y.left = x;
  x.right = T2;
  updateHeight(x);
  updateHeight(y);
  updateMax(x);
  updateMax(y);
  logMsg(`[AVL] Left Rotation on node [${x.low}, ${x.high}]`, 'avl');
  return y;
}

function insert(node, low, high) {
  if (!node) {
    nodeCount++;
    let nn = new Node(nodeCount, low, high);
    logMsg(`[Insert] Created node [${low}, ${high}]`, 'info');
    return nn;
  }

  if (low < node.low) {
    node.left = insert(node.left, low, high);
  } else {
    node.right = insert(node.right, low, high);
  }

  updateHeight(node);
  updateMax(node);

  let balance = bal(node);

  if (balance > 1 && low < node.left.low) return rightRotate(node);
  if (balance < -1 && low >= node.right.low) return leftRotate(node);
  if (balance > 1 && low >= node.left.low) {
    node.left = leftRotate(node.left);
    return rightRotate(node);
  }
  if (balance < -1 && low < node.right.low) {
    node.right = rightRotate(node.right);
    return leftRotate(node);
  }

  return node;
}

function updatePositions(node, depth, minX, maxX) {
  if (!node) return;
  let x = (minX + maxX) / 2;
  let y = 50 + depth * 60;

  node.px = node.x || x;
  node.py = node.y || y;

  node.x += (x - node.x) * 0.2;
  node.y += (y - node.y) * 0.2;

  if (Math.abs(node.x - x) < 0.5) node.x = x;
  if (Math.abs(node.y - y) < 0.5) node.y = y;

  updatePositions(node.left, depth + 1, minX, x);
  updatePositions(node.right, depth + 1, x, maxX);
}

function drawTree() {
  const cvs = U('treeCanvas');
  let dims = getCanvasDims('treeCanvasWrap');
  cvs.width = dims.w;
  cvs.height = dims.h;
  let ctx = cvs.getContext('2d');

  if (!root) return;

  updatePositions(root, 0, 0, dims.w);

  function drawEdges(node) {
    if (!node) return;
    if (node.left) {
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(node.left.x, node.left.y);
      ctx.stroke();
      drawEdges(node.left);
    }
    if (node.right) {
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(node.right.x, node.right.y);
      ctx.stroke();
      drawEdges(node.right);
    }
  }
  drawEdges(root);

  function drawNodes(node) {
    if (!node) return;
    drawNodes(node.left);
    drawNodes(node.right);

    ctx.beginPath();
    ctx.arc(node.x, node.y, 22, 0, Math.PI * 2);

    if (prunedNodes.includes(node)) {
      ctx.fillStyle = '#1f2937';
      ctx.strokeStyle = '#ef4444';
    } else if (queryFound.includes(node)) {
      ctx.fillStyle = '#06b6d4';
      ctx.strokeStyle = '#fff';
    } else if (currNode === node) {
      ctx.fillStyle = '#10b981';
      ctx.strokeStyle = '#fff';
    } else {
      ctx.fillStyle = '#1f2937';
      ctx.strokeStyle = '#10b981';
    }

    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = '10px "Fira Code"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`[${node.low},${node.high}]`, node.x, node.y - 2);

    ctx.beginPath();
    ctx.arc(node.x, node.y + 18, 12, 0, Math.PI * 2);
    ctx.fillStyle = U('chkCorrupt').checked ? '#ef4444' : '#f59e0b';
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.font = 'bold 9px "Fira Code"';
    ctx.fillText(`m:${node.max}`, node.x, node.y + 18);
  }
  drawNodes(root);
}

function bfQuery() {
  bfFoundCount = 0;
  for (let i = 0; i < allIntervals.length; i++) {
    let iv = allIntervals[i];
    if (iv.low <= qH && iv.high >= qL) bfFoundCount++;
  }
}

function* queryGen(node) {
  if (!node) return;

  currNode = node;
  queryVisited++;
  U('statVisited').innerText = queryVisited;
  logMsg(`[Query] Visiting node [${node.low}, ${node.high}], max=${node.max}`, 'query');
  yield;

  if (node.max < qL) {
    prunedNodes.push(node);
    logMsg(
      `[Query] PRUNED at node [${node.low}, ${node.high}] because max (${node.max}) < queryStart (${qL})`,
      'danger'
    );
    yield;
    return;
  }

  if (node.low <= qH && node.high >= qL) {
    queryFound.push(node);
    U('statFound').innerText = `${queryFound.length} vs ${bfFoundCount}`;
    logMsg(`[Query] Found overlap at [${node.low}, ${node.high}]`, 'success');
    yield;
  }

  if (node.left) yield* queryGen(node.left);
  if (node.right && node.low <= qH) yield* queryGen(node.right);
}

function animLoop() {
  if (isRunning && gen) {
    let res = gen.next();
    drawTree();

    let hasMovingNodes = false;
    function checkMove(n) {
      if (!n) return;
      if (Math.abs(n.px - n.x) > 1 || Math.abs(n.py - n.y) > 1) hasMovingNodes = true;
      checkMove(n.left);
      checkMove(n.right);
    }
    checkMove(root);

    if (!res.done || hasMovingNodes) {
      let speed = 105 - parseInt(U('sliderSpeed').value);
      if (hasMovingNodes && res.done) speed = 16;
      animFrame = requestAnimationFrame(() => {
        setTimeout(animLoop, speed);
      });
    } else {
      isRunning = false;
      currNode = null;
      drawTree();
      if (res.value === 'query_done') {
        if (queryFound.length < bfFoundCount) {
          updateStatus(
            `Query complete. Found ${queryFound.length}. EXPECTED ${bfFoundCount}. Corruption detected!`,
            'danger'
          );
          logMsg(
            `[ERROR] Missing overlaps! The stale max-endpoints caused incorrect pruning.`,
            'danger'
          );
        } else {
          updateStatus(
            `Query complete. Found ${queryFound.length}, exactly matching brute-force.`,
            'done'
          );
        }
      } else {
        updateStatus(`Operation complete. Tree height: ${h(root)}`);
      }
    }
  } else if (isRunning && !gen) {
    drawTree();
    let hasMovingNodes = false;
    function checkMove(n) {
      if (!n) return;
      if (Math.abs(n.px - n.x) > 1 || Math.abs(n.py - n.y) > 1) hasMovingNodes = true;
      checkMove(n.left);
      checkMove(n.right);
    }
    checkMove(root);
    if (hasMovingNodes) {
      animFrame = requestAnimationFrame(animLoop);
    } else {
      isRunning = false;
      U('statNodes').innerText = nodeCount;
      U('statHeight').innerText = h(root);
    }
  }
}

function triggerAdd(adv = false) {
  if (isRunning) return;

  let low, high;
  if (adv) {
    highestLow += Math.floor(Math.random() * 10) + 1;
    low = highestLow;
    high = low + Math.floor(Math.random() * 20) + 5;
  } else {
    low = Math.floor(Math.random() * 100);
    high = low + Math.floor(Math.random() * 30) + 5;
    if (low > highestLow) highestLow = low;
  }

  allIntervals.push({ low, high });

  U('logConsole').innerHTML = '';
  root = insert(root, low, high);

  currNode = null;
  prunedNodes = [];
  queryFound = [];
  queryVisited = 0;
  U('statVisited').innerText = '-';
  U('statFound').innerText = '-';

  updateStatus(`Inserted [${low}, ${high}]. Balancing tree...`);

  isRunning = true;
  gen = null;
  animLoop();
}

U('btnAddRandom').addEventListener('click', () => triggerAdd(false));
U('btnAddAdversarial').addEventListener('click', () => triggerAdd(true));

U('btnClear').addEventListener('click', () => {
  if (isRunning) cancelAnimationFrame(animFrame);
  root = null;
  nodeCount = 0;
  highestLow = 0;
  allIntervals = [];
  currNode = null;
  prunedNodes = [];
  queryFound = [];
  isRunning = false;
  U('statNodes').innerText = '0';
  U('statHeight').innerText = '0';
  U('statVisited').innerText = '-';
  U('statFound').innerText = '-';
  U('logConsole').innerHTML = '';
  drawTree();
  updateStatus('Tree cleared.');
});

U('btnQuery').addEventListener('click', () => {
  if (isRunning) return;
  if (!root) {
    updateStatus('Tree is empty.', 'warn');
    return;
  }

  U('logConsole').innerHTML = '';
  qL = parseInt(U('sliderQueryStart').value);
  qH = parseInt(U('sliderQueryEnd').value);

  bfQuery();
  queryVisited = 0;
  queryFound = [];
  prunedNodes = [];

  U('statVisited').innerText = '0';
  U('statFound').innerText = `0 vs ${bfFoundCount}`;

  updateStatus(`Running overlap query for [${qL}, ${qH}]...`);

  function* runQuery() {
    yield* queryGen(root);
    return 'query_done';
  }

  gen = runQuery();
  isRunning = true;
  animLoop();
});

U('sliderQueryStart').addEventListener('input', (e) => {
  let val = parseInt(e.target.value);
  if (val > parseInt(U('sliderQueryEnd').value)) {
    U('sliderQueryEnd').value = val;
    U('lblQueryEnd').innerText = val;
  }
  U('lblQueryStart').innerText = val;
});
U('sliderQueryEnd').addEventListener('input', (e) => {
  let val = parseInt(e.target.value);
  if (val < parseInt(U('sliderQueryStart').value)) {
    U('sliderQueryStart').value = val;
    U('lblQueryStart').innerText = val;
  }
  U('lblQueryEnd').innerText = val;
});

U('chkCorrupt').addEventListener('change', (e) => {
  if (e.target.checked) {
    U('badgeCorrupt').style.display = 'inline-block';
    updateStatus(
      'Sabotage mode activated. Future rotations will skip updating the max field.',
      'danger'
    );
  } else {
    U('badgeCorrupt').style.display = 'none';
    updateStatus('Sabotage mode deactivated. Max fields will be properly maintained.');
  }
});

window.addEventListener('resize', () => {
  if (!isRunning) drawTree();
});

document.addEventListener('DOMContentLoaded', () => {
  initHeroCanvas();
  drawTree();
});
