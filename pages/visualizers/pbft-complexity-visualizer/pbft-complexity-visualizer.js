const U = document.getElementById.bind(document);
const C = document.createElement.bind(document);

let N = 4;
let F = 0;
let maxF = 1;

let nodes = [];
let messages = [];
let animFrame = null;
let state = {
  running: false,
  mode: 'IDLE',
  gen: null,
  msgCount: 0,
  speed: 5,
};

let chart = null;
let dataPbft = [];
let dataRaft = [];
let labels = [];

function initChart() {
  const ctx = U('complexityChart').getContext('2d');

  for (let i = 4; i <= 13; i++) {
    labels.push(i);
    dataRaft.push(2 * i);
    dataPbft.push(i + i * (i - 1) + i * (i - 1));
  }

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'PBFT O(n²)',
          data: dataPbft,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
        },
        {
          label: 'Raft O(n)',
          data: dataRaft,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#a1a1aa' },
        },
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a1a1aa' } },
      },
      plugins: {
        legend: { labels: { color: '#fff' } },
      },
    },
  });
}

function initHeroCanvas() {
  const c = U('pbftHeroCanvas');
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

    let cx = c.width / 2;
    let cy = c.height / 2;
    let r = 60;

    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        let a1 = t + (i * Math.PI * 2) / 5;
        let a2 = t + (j * Math.PI * 2) / 5;
        let x1 = cx + Math.cos(a1) * r;
        let y1 = cy + Math.sin(a1) * r;
        let x2 = cx + Math.cos(a2) * r;
        let y2 = cy + Math.sin(a2) * r;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = 'rgba(59,130,246,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

function logMsg(msg, type = 'info') {
  const lc = U('pbftLogConsole');
  if (!lc) return;
  let d = C('div');
  d.className = 'log-entry ' + type;
  d.innerHTML = msg;
  lc.appendChild(d);
  lc.scrollTop = lc.scrollHeight;
}

function updateStatus(msg, cls = '') {
  const sb = U('pbftStatus');
  const sm = U('statusMsg');
  if (!sb || !sm) return;
  sb.className = 'pbft-status-bar ' + cls;
  sm.innerHTML = msg;
}

function setupCluster() {
  nodes = [];
  messages = [];
  state.msgCount = 0;
  U('statMsgs').innerText = '0';

  const cvs = U('networkCanvas');
  let w = cvs.parentElement.clientWidth;
  let h = cvs.parentElement.clientHeight;
  cvs.width = w;
  cvs.height = h;

  let cx = w / 2;
  let cy = h / 2 + 20;
  let radius = Math.min(w, h) / 2 - 50;

  nodes.push({ id: 'C', x: cx, y: 30, type: 'client' });

  for (let i = 0; i < N; i++) {
    let angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    let nx = cx + Math.cos(angle) * radius;
    let ny = cy + Math.sin(angle) * radius;

    let type = 'replica';
    if (i === 0) type = 'primary';
    else if (i > N - 1 - F) type = 'byzantine';

    nodes.push({ id: i.toString(), x: nx, y: ny, type: type });
  }
  drawNetwork();
}

function drawNetwork() {
  const cvs = U('networkCanvas');
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, cvs.width, cvs.height);

  messages.forEach((m) => {
    let dx = m.tx - m.sx;
    let dy = m.ty - m.sy;
    let dist = Math.sqrt(dx * dx + dy * dy);
    let px = m.sx + dx * m.progress;
    let py = m.sy + dy * m.progress;

    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);

    if (m.phase === 'req') ctx.fillStyle = '#10b981';
    else if (m.phase === 'pre') ctx.fillStyle = '#3b82f6';
    else if (m.phase === 'prep') ctx.fillStyle = '#f59e0b';
    else if (m.phase === 'com') ctx.fillStyle = '#d946ef';

    if (m.isByz) {
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.fill();
    ctx.shadowBlur = 0;
  });

  nodes.forEach((n) => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.type === 'client' ? 15 : 20, 0, Math.PI * 2);

    if (n.type === 'client') {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#9ca3af';
    } else if (n.type === 'primary') {
      ctx.fillStyle = 'rgba(217,70,239,0.2)';
      ctx.strokeStyle = '#d946ef';
    } else if (n.type === 'replica') {
      ctx.fillStyle = 'rgba(59,130,246,0.2)';
      ctx.strokeStyle = '#3b82f6';
    } else if (n.type === 'byzantine') {
      ctx.fillStyle = 'rgba(239,68,68,0.2)';
      ctx.strokeStyle = '#ef4444';
    }

    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = '12px "Fira Code"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n.type === 'client' ? 'C' : n.id, n.x, n.y);
  });
}

function spawnMessage(srcId, tgtId, phase, isByz = false) {
  let src = nodes.find((n) => n.id === srcId);
  let tgt = nodes.find((n) => n.id === tgtId);
  messages.push({
    sx: src.x,
    sy: src.y,
    tx: tgt.x,
    ty: tgt.y,
    progress: 0,
    phase: phase,
    isByz: isByz,
  });
  state.msgCount++;
  U('statMsgs').innerText = state.msgCount;
}

function* pbftGenerator() {
  U('statO').innerText = 'O(N²)';
  logMsg('<span class="log-entry phase">PBFT Phase 1: Request</span>');
  updateStatus('Client sends request to Primary node (Node 0).');

  spawnMessage('C', '0', 'req');
  yield;

  logMsg('<span class="log-entry phase">PBFT Phase 2: Pre-Prepare</span>');
  updateStatus('Primary broadcasts Pre-Prepare to all backups. [O(N)]');

  for (let i = 1; i < N; i++) {
    spawnMessage('0', i.toString(), 'pre');
  }
  yield;

  logMsg('<span class="log-entry phase">PBFT Phase 3: Prepare</span>');
  updateStatus(
    'All backups broadcast Prepare to EVERY other node to verify Primary. [O(N²)]',
    'warn'
  );

  for (let i = 1; i < N; i++) {
    let isLying = nodes.find((n) => n.id === i.toString()).type === 'byzantine';
    for (let j = 0; j < N; j++) {
      if (i !== j) spawnMessage(i.toString(), j.toString(), 'prep', isLying);
    }
  }
  yield;

  logMsg('<span class="log-entry phase">PBFT Phase 4: Commit</span>');
  updateStatus('Nodes achieve 2f+1 prepares, then broadcast Commit to EVERY node. [O(N²)]', 'warn');

  for (let i = 0; i < N; i++) {
    let isLying = nodes.find((n) => n.id === i.toString()).type === 'byzantine';
    for (let j = 0; j < N; j++) {
      if (i !== j) spawnMessage(i.toString(), j.toString(), 'com', isLying);
    }
  }
  yield;

  logMsg('<span class="log-entry phase">PBFT Phase 5: Reply</span>');
  updateStatus('Nodes execute request and reply to Client.');

  let honestReplies = 0;
  for (let i = 0; i < N; i++) {
    let n = nodes.find((nd) => nd.id === i.toString());
    spawnMessage(i.toString(), 'C', 'req', n.type === 'byzantine');
    if (n.type !== 'byzantine') honestReplies++;
  }
  yield;

  if (F <= maxF && honestReplies >= maxF + 1) {
    updateStatus(`Consensus SUCCESS. Client received f+1 matching honest replies.`, 'done');
    U('statConsensus').innerText = 'Success';
    U('statConsensus').className = 'stat-val highlight';
    logMsg('<b>Client successfully accepted the result despite Byzantine noise.</b>', 'success');
  } else {
    updateStatus(
      `Consensus FAILED. Too many Byzantine nodes (F=${F}, max allowed ${maxF}).`,
      'warn'
    );
    U('statConsensus').innerText = 'Failed';
    U('statConsensus').className = 'stat-val highlight-warn';
    logMsg('<b>Byzantine nodes compromised the cluster. Consensus failed.</b>', 'danger');
  }

  state.mode = 'DONE';
}

function* raftGenerator() {
  U('statO').innerText = 'O(N)';
  logMsg('<span class="log-entry phase">Raft Phase 1: Request</span>');
  updateStatus('Client sends request to Leader (Node 0).');

  spawnMessage('C', '0', 'req');
  yield;

  logMsg('<span class="log-entry phase">Raft Phase 2: AppendEntries RPC</span>');
  updateStatus(
    'Leader broadcasts AppendEntries to followers. NO peer-to-peer communication. [O(N)]'
  );

  for (let i = 1; i < N; i++) {
    spawnMessage('0', i.toString(), 'pre');
  }
  yield;

  logMsg('<span class="log-entry phase">Raft Phase 3: RPC Reply</span>');
  updateStatus('Followers reply directly to Leader. [O(N)]');

  let honestReplies = 0;
  for (let i = 1; i < N; i++) {
    let n = nodes.find((nd) => nd.id === i.toString());
    if (n.type !== 'byzantine') {
      spawnMessage(i.toString(), '0', 'prep');
      honestReplies++;
    }
  }
  yield;

  if (F > 0) {
    updateStatus(
      `Warning: Raft assumes no Byzantine faults! Byzantine nodes simply ignored the RPC.`,
      'warn'
    );
    logMsg('<b>Raft is fast (O(N)), but not Byzantine fault tolerant.</b>', 'danger');
    U('statConsensus').innerText = 'Unsafe';
    U('statConsensus').className = 'stat-val highlight-warn';
  } else {
    updateStatus(`Consensus SUCCESS. Leader replied to Client.`, 'done');
    spawnMessage('0', 'C', 'req');
    U('statConsensus').innerText = 'Success';
    U('statConsensus').className = 'stat-val highlight';
  }
  yield;

  state.mode = 'DONE';
}

function animLoop() {
  if (!state.running) return;

  let allDone = true;
  messages.forEach((m) => {
    if (m.progress < 1.0) {
      m.progress += state.speed * 0.005;
      if (m.progress > 1.0) m.progress = 1.0;
      allDone = false;
    }
  });

  drawNetwork();

  if (allDone && messages.length > 0) {
    messages = [];
    if (state.gen) {
      let res = state.gen.next();
      if (res.done) state.running = false;
    } else {
      state.running = false;
    }
  }

  if (state.running) animFrame = requestAnimationFrame(animLoop);
}

function startAnim() {
  if (animFrame) cancelAnimationFrame(animFrame);
  state.running = true;
  state.speed = parseInt(U('speedSlider').value);
  animLoop();
}

function syncUI() {
  N = parseInt(U('sliderN').value);
  maxF = Math.floor((N - 1) / 3);

  U('sliderF').max = Math.floor(N / 2);

  F = parseInt(U('sliderF').value);

  U('lblN').innerText = N;
  U('lblF').innerText = F;
  U('statMaxF').innerText = `${maxF} (N=${N})`;

  if (F > maxF) {
    U('lblF').style.color = '#ef4444';
    U('statMaxF').classList.add('highlight-warn');
  } else {
    U('lblF').style.color = '#10b981';
    U('statMaxF').classList.remove('highlight-warn');
  }

  U('statConsensus').innerText = 'Ready';
  U('statConsensus').className = 'stat-val highlight';
  U('statO').innerText = '-';

  setupCluster();
}

U('sliderN').addEventListener('input', syncUI);
U('sliderF').addEventListener('input', syncUI);
U('speedSlider').addEventListener('input', (e) => {
  state.speed = parseInt(e.target.value);
});

U('btnRunPBFT').addEventListener('click', () => {
  U('pbftLogConsole').innerHTML = '';
  syncUI();
  state.gen = pbftGenerator();
  startAnim();
  state.gen.next();
});

U('btnRunRaft').addEventListener('click', () => {
  U('pbftLogConsole').innerHTML = '';
  syncUI();
  state.gen = raftGenerator();
  startAnim();
  state.gen.next();
});

window.addEventListener('resize', () => {
  if (!state.running) setupCluster();
});

document.addEventListener('DOMContentLoaded', () => {
  initHeroCanvas();
  initChart();
  syncUI();
});
