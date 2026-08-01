const U = document.getElementById.bind(document);
const C = document.createElement.bind(document);

const M = 256;
const m = 8;
let nodes = [];
let chordState = { path: [], curr: null, target: null, done: false, hops: 0 };
let skipState = { path: [], curr: null, target: null, done: false, hops: 0, level: 7 };
let isRunning = false;
let animFrame = null;
let genChord = null;
let genSkip = null;
let hoveredNode = null;

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
    t += 0.01;

    let cx = c.width / 2,
      cy = c.height / 2;
    let r = 80;

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      let a = t + (i * Math.PI * 2) / 8;
      let nx = cx + Math.cos(a) * r;
      let ny = cy + Math.sin(a) * r;
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(nx, ny, 4, 0, Math.PI * 2);
      ctx.fill();

      for (let j = 1; j < 3; j++) {
        let ta = a + Math.PI / Math.pow(2, j);
        let tx = cx + Math.cos(ta) * r;
        let ty = cy + Math.sin(ta) * r;
        ctx.strokeStyle = 'rgba(59,130,246,0.2)';
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }
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
  const sb = U('cvsStatus');
  const sm = U('statusMsg');
  if (!sb || !sm) return;
  sb.className = 'cvs-status-bar ' + cls;
  sm.innerHTML = msg;
}

function getCanvasDims(id) {
  const cvs = U(id);
  return { w: cvs.clientWidth, h: cvs.clientHeight };
}

function toBin(num) {
  return num.toString(2).padStart(m, '0');
}

function buildNetwork(numNodes) {
  nodes = [];
  let ids = new Set();
  while (ids.size < numNodes) {
    ids.add(Math.floor(Math.random() * M));
  }
  let sortedIds = Array.from(ids).sort((a, b) => a - b);

  for (let i = 0; i < sortedIds.length; i++) {
    let id = sortedIds[i];
    let mv = '';
    for (let j = 0; j < m; j++) mv += Math.random() < 0.5 ? '0' : '1';
    nodes.push({
      id: id,
      mv: mv,
      fingers: [],
      skipLinks: Array(m).fill({ L: null, R: null }),
    });
  }

  for (let i = 0; i < nodes.length; i++) {
    let n = nodes[i];
    n.fingers = [];
    for (let k = 0; k < m; k++) {
      let start = (n.id + Math.pow(2, k)) % M;
      let succ = nodes.find((nd) => nd.id >= start);
      if (!succ) succ = nodes[0];
      n.fingers.push({ start: start, node: succ });
    }

    let sl = [];
    for (let lvl = 0; lvl < m; lvl++) {
      let prefix = n.mv.substring(0, lvl);
      let candidates = nodes.filter((nd) => nd.mv.startsWith(prefix));
      let idx = candidates.indexOf(n);
      let L = idx > 0 ? candidates[idx - 1] : null;
      let R = idx < candidates.length - 1 ? candidates[idx + 1] : null;
      sl.push({ L: L, R: R });
    }
    n.skipLinks = sl;
  }

  drawChord();
  drawSkip();
}

function drawChord() {
  const cvs = U('chordCanvas');
  let dims = getCanvasDims('chordCanvasWrap');
  cvs.width = dims.w;
  cvs.height = dims.h;
  let ctx = cvs.getContext('2d');

  let cx = dims.w / 2,
    cy = dims.h / 2;
  let r = Math.min(dims.w, dims.h) / 2 - 40;

  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  if (hoveredNode) {
    ctx.strokeStyle = 'rgba(59,130,246,0.3)';
    ctx.lineWidth = 1;
    let ha = -Math.PI / 2 + (hoveredNode.id * 2 * Math.PI) / M;
    let hx = cx + Math.cos(ha) * r;
    let hy = cy + Math.sin(ha) * r;

    for (let i = 0; i < m; i++) {
      let succ = hoveredNode.fingers[i].node;
      let sa = -Math.PI / 2 + (succ.id * 2 * Math.PI) / M;
      let sx = cx + Math.cos(sa) * r;
      let sy = cy + Math.sin(sa) * r;

      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.quadraticCurveTo(cx, cy, sx, sy);
      ctx.stroke();
    }
  }

  for (let i = 0; i < chordState.path.length - 1; i++) {
    let n1 = chordState.path[i];
    let n2 = chordState.path[i + 1];
    let a1 = -Math.PI / 2 + (n1.id * 2 * Math.PI) / M;
    let a2 = -Math.PI / 2 + (n2.id * 2 * Math.PI) / M;
    let x1 = cx + Math.cos(a1) * r,
      y1 = cy + Math.sin(a1) * r;
    let x2 = cx + Math.cos(a2) * r,
      y2 = cy + Math.sin(a2) * r;

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  for (let i = 0; i < nodes.length; i++) {
    let a = -Math.PI / 2 + (nodes[i].id * 2 * Math.PI) / M;
    let x = cx + Math.cos(a) * r;
    let y = cy + Math.sin(a) * r;

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);

    if (chordState.curr && chordState.curr.id === nodes[i].id) {
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
    } else if (chordState.target && chordState.target.id === nodes[i].id) {
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = '#3b82f6';
      ctx.shadowBlur = 0;
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font = '10px "Fira Code"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let tx = cx + Math.cos(a) * (r + 15);
    let ty = cy + Math.sin(a) * (r + 15);
    ctx.fillText(nodes[i].id, tx, ty);
  }
}

function drawSkip() {
  const cvs = U('skipCanvas');
  let dims = getCanvasDims('skipCanvasWrap');
  cvs.width = dims.w;
  cvs.height = dims.h;
  let ctx = cvs.getContext('2d');

  let padX = 30;
  let dx = (dims.w - padX * 2) / Math.max(1, nodes.length - 1);
  let padY = 40;
  let dy = (dims.h - padY * 2) / m;

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i < nodes.length; i++) {
    let x = padX + i * dx;
    ctx.beginPath();
    ctx.moveTo(x, padY);
    ctx.lineTo(x, dims.h - padY);
    ctx.stroke();
  }

  for (let lvl = 0; lvl < m; lvl++) {
    let y = dims.h - padY - lvl * dy;
    for (let i = 0; i < nodes.length; i++) {
      let n = nodes[i];
      let rLink = n.skipLinks[lvl].R;
      if (rLink) {
        let rIdx = nodes.indexOf(rLink);
        let x1 = padX + i * dx;
        let x2 = padX + rIdx * dx;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
      }
    }
  }

  for (let i = 0; i < skipState.path.length - 1; i++) {
    let n1 = skipState.path[i].node;
    let l1 = skipState.path[i].lvl;
    let n2 = skipState.path[i + 1].node;
    let l2 = skipState.path[i + 1].lvl;

    let i1 = nodes.indexOf(n1);
    let i2 = nodes.indexOf(n2);

    let x1 = padX + i1 * dx,
      y1 = dims.h - padY - l1 * dy;
    let x2 = padX + i2 * dx,
      y2 = dims.h - padY - l2 * dy;

    ctx.strokeStyle = '#d946ef';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  for (let lvl = 0; lvl < m; lvl++) {
    let y = dims.h - padY - lvl * dy;
    for (let i = 0; i < nodes.length; i++) {
      let x = padX + i * dx;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);

      if (skipState.curr && skipState.curr.id === nodes[i].id && skipState.level === lvl) {
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 10;
      } else if (skipState.target && skipState.target.id === nodes[i].id && lvl === 0) {
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
      } else {
        ctx.fillStyle = '#d946ef';
        ctx.shadowBlur = 0;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    let x = padX + i * dx;
    ctx.fillStyle = '#fff';
    ctx.font = '10px "Fira Code"';
    ctx.textAlign = 'center';
    ctx.fillText(nodes[i].id, x, dims.h - 15);
  }
}

function inInterval(id, a, b) {
  if (a < b) return id > a && id < b;
  return id > a || id < b;
}
function inIntervalInc(id, a, b) {
  if (a <= b) return id >= a && id <= b;
  return id >= a || id <= b;
}

function* chordLookupGen(start, key) {
  chordState.curr = start;
  chordState.path = [start];
  chordState.hops = 0;

  let targetNode = nodes.find((nd) => nd.id >= key);
  if (!targetNode) targetNode = nodes[0];
  chordState.target = targetNode;

  U('statOwner').innerText = `Node ${targetNode.id}`;
  logMsg(`[Chord] Starting lookup for key ${key} at Node ${start.id}`, 'chord');
  yield;

  while (chordState.curr !== targetNode) {
    let next = chordState.curr;
    for (let i = m - 1; i >= 0; i--) {
      let f = chordState.curr.fingers[i].node;
      if (inInterval(f.id, chordState.curr.id, targetNode.id)) {
        next = f;
        break;
      }
    }

    if (next === chordState.curr) {
      next = chordState.curr.fingers[0].node;
    }

    chordState.curr = next;
    chordState.path.push(next);
    chordState.hops++;
    U('statChordHops').innerText = chordState.hops;
    logMsg(`[Chord] Hopped to Node ${next.id}`, 'chord');
    yield;
  }

  logMsg(
    `[Chord] Key ${key} found at owner Node ${targetNode.id} in ${chordState.hops} hops.`,
    'success'
  );
  chordState.done = true;
}

function* skipLookupGen(start, key) {
  skipState.curr = start;
  skipState.level = m - 1;
  skipState.path = [{ node: start, lvl: m - 1 }];
  skipState.hops = 0;

  let targetNode = nodes.find((nd) => nd.id >= key);
  if (!targetNode) targetNode = nodes[0];
  skipState.target = targetNode;

  logMsg(
    `[SkipGraph] Starting lookup for key ${key} at Node ${start.id} (Level ${skipState.level})`,
    'skip'
  );
  yield;

  while (true) {
    let rNode = skipState.curr.skipLinks[skipState.level].R;

    if (rNode && rNode.id <= targetNode.id) {
      skipState.curr = rNode;
      skipState.hops++;
      skipState.path.push({ node: skipState.curr, lvl: skipState.level });
      U('statSkipHops').innerText = skipState.hops;
      logMsg(`[SkipGraph] Forward hop to Node ${rNode.id} at Level ${skipState.level}`, 'skip');
      yield;

      if (skipState.curr.id === targetNode.id) {
        while (skipState.level > 0) {
          skipState.level--;
          skipState.path.push({ node: skipState.curr, lvl: skipState.level });
          yield;
        }
        break;
      }
    } else {
      if (skipState.level > 0) {
        skipState.level--;
        skipState.path.push({ node: skipState.curr, lvl: skipState.level });
        logMsg(`[SkipGraph] Target overshoot. Dropped to Level ${skipState.level}`, 'warn');
        yield;
      } else {
        break;
      }
    }
  }

  if (skipState.curr.id !== targetNode.id) {
    let fNode = skipState.curr.skipLinks[0].R;
    if (fNode) {
      skipState.curr = fNode;
      skipState.hops++;
      skipState.path.push({ node: skipState.curr, lvl: 0 });
      U('statSkipHops').innerText = skipState.hops;
      logMsg(`[SkipGraph] Forward hop to Node ${fNode.id} at Level 0`, 'skip');
      yield;
    } else {
      let f2 = nodes[0];
      skipState.curr = f2;
      skipState.hops++;
      skipState.path.push({ node: skipState.curr, lvl: 0 });
      U('statSkipHops').innerText = skipState.hops;
      logMsg(`[SkipGraph] Wrap around to Node ${f2.id} at Level 0`, 'skip');
      yield;
    }
  }

  logMsg(
    `[SkipGraph] Key ${key} found at owner Node ${targetNode.id} in ${skipState.hops} hops.`,
    'success'
  );
  skipState.done = true;
}

function renderFingerTable(n) {
  const ftc = U('fingerTableContainer');
  if (!n) {
    ftc.innerHTML =
      '<p style="color: #64748b; font-size: 0.8rem;">Hover over a node in the Chord ring to view its Finger Table here.</p>';
    return;
  }

  let html = `<div style="color: #fff; margin-bottom: 8px; font-weight: bold;">Finger Table for Node ${n.id}</div>`;
  html += `<div class="ft-grid">
                <div class="ft-header">i</div>
                <div class="ft-header">Start = (n + 2^i)</div>
                <div class="ft-header">Successor</div>`;

  for (let i = 0; i < m; i++) {
    html += `<div class="ft-cell">${i}</div>
                 <div class="ft-cell">${n.fingers[i].start}</div>
                 <div class="ft-cell">${n.fingers[i].node.id}</div>`;
  }
  html += `</div>`;
  ftc.innerHTML = html;
}

function animLoop() {
  if (!isRunning) return;

  let cAlive = false;
  let sAlive = false;

  if (genChord && !chordState.done) {
    if (!genChord.next().done) cAlive = true;
  }
  if (genSkip && !skipState.done) {
    if (!genSkip.next().done) sAlive = true;
  }

  drawChord();
  drawSkip();

  if (cAlive || sAlive) {
    let speed = 105 - parseInt(U('sliderSpeed').value);
    setTimeout(() => {
      animFrame = requestAnimationFrame(animLoop);
    }, speed * 10);
  } else {
    isRunning = false;
    updateStatus(
      `Race finished! Chord: ${chordState.hops} hops. Skip Graph: ${skipState.hops} hops.`,
      'done'
    );
  }
}

U('btnRace').addEventListener('click', () => {
  let key = parseInt(U('sliderKey').value);
  U('logConsole').innerHTML = '';

  let startNode = nodes[Math.floor(Math.random() * nodes.length)];

  chordState = { path: [], curr: null, target: null, done: false, hops: 0 };
  skipState = { path: [], curr: null, target: null, done: false, hops: 0, level: 7 };

  U('statChordHops').innerText = '0';
  U('statSkipHops').innerText = '0';

  genChord = chordLookupGen(startNode, key);
  genSkip = skipLookupGen(startNode, key);

  updateStatus(`Racing lookups from Node ${startNode.id} to key ${key}...`, 'warn');

  if (animFrame) cancelAnimationFrame(animFrame);
  isRunning = true;
  animLoop();
});

U('btnAddNode').addEventListener('click', () => {
  if (nodes.length >= 64) {
    updateStatus('Maximum 64 nodes reached.', 'danger');
    return;
  }
  buildNetwork(nodes.length + 1);
  U('sliderNodes').value = nodes.length;
  U('lblNodes').innerText = nodes.length;
  U('logConsole').innerHTML = '';
  logMsg(`Node joined the network. Rebuilt Finger Tables and Skip Links.`, 'info');
  updateStatus(`Added node. Network size: ${nodes.length}`);
});

U('btnKillNode').addEventListener('click', () => {
  if (nodes.length <= 8) {
    updateStatus('Minimum 8 nodes required.', 'danger');
    return;
  }
  buildNetwork(nodes.length - 1);
  U('sliderNodes').value = nodes.length;
  U('lblNodes').innerText = nodes.length;
  U('logConsole').innerHTML = '';
  logMsg(`Random node killed. Self-healed Finger Tables and Skip Links.`, 'danger');
  updateStatus(`Removed node. Network size: ${nodes.length}`);
});

U('sliderNodes').addEventListener('change', (e) => {
  buildNetwork(parseInt(e.target.value));
  U('lblNodes').innerText = e.target.value;
});
U('sliderKey').addEventListener('input', (e) => {
  U('lblKey').innerText = e.target.value;
});

U('chordCanvas').addEventListener('mousemove', (e) => {
  if (isRunning) return;
  let rect = e.target.getBoundingClientRect();
  let cx = rect.width / 2,
    cy = rect.height / 2;
  let r = Math.min(rect.width, rect.height) / 2 - 40;

  let mx = e.clientX - rect.left;
  let my = e.clientY - rect.top;

  hoveredNode = null;
  let minDist = 15;

  for (let i = 0; i < nodes.length; i++) {
    let a = -Math.PI / 2 + (nodes[i].id * 2 * Math.PI) / M;
    let nx = cx + Math.cos(a) * r;
    let ny = cy + Math.sin(a) * r;
    let d = Math.sqrt((mx - nx) * (mx - nx) + (my - ny) * (my - ny));
    if (d < minDist) {
      minDist = d;
      hoveredNode = nodes[i];
    }
  }

  renderFingerTable(hoveredNode);
  drawChord();
});

U('chordCanvas').addEventListener('mouseleave', () => {
  if (!isRunning) {
    hoveredNode = null;
    renderFingerTable(null);
    drawChord();
  }
});

window.addEventListener('resize', () => {
  drawChord();
  drawSkip();
});

document.addEventListener('DOMContentLoaded', () => {
  initHeroCanvas();
  buildNetwork(parseInt(U('sliderNodes').value));
});
