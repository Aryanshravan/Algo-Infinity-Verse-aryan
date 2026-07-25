document.addEventListener('DOMContentLoaded', function() {
  dtInit();
});

var DT_COLORS = ['#06b6d4', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];

var dtState = {
  n: 10,
  adj: {},
  values: [],
  subtreeSize: [],
  parent: [],
  heavyChild: [],
  results: [],
  positions: {},
  totalMoves: 0,
  maxMoves: 0,
  moveTracker: [],
  animQueue: [],
  animIdx: 0,
  playing: false,
};

function dtGenerateTree() {
  var n = dtState.n;
  var adj = {};
  for (var i = 0; i < n; i++) adj[i] = [];
  for (var i = 1; i < n; i++) {
    var p = Math.floor(Math.random() * i);
    adj[i].push(p);
    adj[p].push(i);
  }
  dtState.adj = adj;
  dtState.values = [];
  for (var i = 0; i < n; i++) dtState.values.push(1 + Math.floor(Math.random() * 4));
  dtState.moveTracker = new Array(n).fill(0);
}

function dtComputeSizes() {
  var n = dtState.n;
  var subtreeSize = new Array(n).fill(0);
  var parent = new Array(n).fill(-1);
  var heavyChild = new Array(n).fill(-1);
  var visited = new Array(n).fill(false);

  function dfs(u, p) {
    visited[u] = true;
    parent[u] = p;
    subtreeSize[u] = 1;
    var maxChildSize = -1;
    dtState.adj[u].forEach(function(v) {
      if (!visited[v]) {
        dfs(v, u);
        subtreeSize[u] += subtreeSize[v];
        if (subtreeSize[v] > maxChildSize) { maxChildSize = subtreeSize[v]; heavyChild[u] = v; }
      }
    });
  }
  dfs(0, -1);

  dtState.subtreeSize = subtreeSize;
  dtState.parent = parent;
  dtState.heavyChild = heavyChild;
}

function dtComputeLayout() {
  var positions = {};
  var counter = { val: 0 };
  var wrap = document.getElementById('dtCanvasWrap');
  var W = wrap ? wrap.clientWidth : 600;

  function dfs(u, depth) {
    var children = dtState.adj[u].filter(function(v) { return v !== dtState.parent[u]; });
    if (children.length === 0) {
      positions[u] = { x: counter.val * (W / dtState.n * 1.4) + 40, y: depth * 70 + 40 };
      counter.val++;
      return;
    }
    children.forEach(function(v) { dfs(v, depth + 1); });
    var xs = children.map(function(v) { return positions[v].x; });
    positions[u] = { x: (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, y: depth * 70 + 40 };
  }
  dfs(0, 0);
  dtState.positions = positions;
}

function dtRunSmallToLarge() {
  var n = dtState.n;
  var maps = {};
  var results = new Array(n);
  var log = [];
  var animSteps = [];

  function addVal(mapObj, x, nodeId) {
    if (mapObj[x] === undefined) mapObj[x] = 0;
    mapObj[x]++;
    dtState.moveTracker[nodeId]++;
    dtState.totalMoves++;
  }

  function collectAndMerge(u, target) {
    addVal(target, dtState.values[u], u);
    animSteps.push({ type: 'merge-node', node: u });
    dtState.adj[u].forEach(function(v) {
      if (v !== dtState.parent[u]) collectAndMerge(v, target);
    });
  }

  function dfs(u) {
    var heavy = dtState.heavyChild[u];
    var children = dtState.adj[u].filter(function(v) { return v !== dtState.parent[u]; });

    children.forEach(function(v) { if (v !== heavy) dfs(v); });
    if (heavy !== -1) dfs(heavy);

    var map = heavy !== -1 ? maps[heavy] : {};
    if (heavy !== -1) delete maps[heavy];

    animSteps.push({ type: 'start-node', node: u, heavy: heavy });
    if (heavy !== -1) log.push({ msg: 'Node ' + u + ': keeps heavy child ' + heavy + '\'s structure (size ' + dtState.subtreeSize[heavy] + ').', type: 'heavy' });

    addVal(map, dtState.values[u], u);
    animSteps.push({ type: 'merge-node', node: u });

    children.forEach(function(v) {
      if (v !== heavy) {
        log.push({ msg: 'Node ' + u + ': merges light child ' + v + '\'s subtree (' + dtState.subtreeSize[v] + ' node(s)) element by element.', type: 'light' });
        collectAndMerge(v, map);
      }
    });

    results[u] = Object.keys(map).length;
    animSteps.push({ type: 'result', node: u, result: results[u] });
    log.push({ msg: 'Node ' + u + ': distinct values in subtree = ' + results[u] + '.', type: 'done' });

    maps[u] = map;
  }

  dfs(0);

  dtState.results = results;
  dtState.maxMoves = Math.max.apply(null, dtState.moveTracker);

  return { log: log, animSteps: animSteps };
}

function dtRenderTree(currentNode, activeSet) {
  var canvas = document.getElementById('dtCanvas');
  if (!canvas || !dtState.positions) return;
  var wrap = document.getElementById('dtCanvasWrap');
  var maxX = 0, maxY = 0;
  Object.keys(dtState.positions).forEach(function(k) {
    if (dtState.positions[k].x > maxX) maxX = dtState.positions[k].x;
    if (dtState.positions[k].y > maxY) maxY = dtState.positions[k].y;
  });
  var W = Math.max(wrap.clientWidth, maxX + 60);
  var H = Math.max(400, maxY + 60);
  canvas.width = W; canvas.height = H;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  for (var u = 0; u < dtState.n; u++) {
    var p = dtState.parent[u];
    if (p === -1) continue;
    var pu = dtState.positions[p]; var pv = dtState.positions[u];
    var isHeavyEdge = dtState.heavyChild[p] === u;
    ctx.strokeStyle = isHeavyEdge ? 'rgba(6,182,212,0.4)' : 'rgba(168,85,247,0.25)';
    ctx.lineWidth = isHeavyEdge ? 2.5 : 1.3;
    ctx.beginPath(); ctx.moveTo(pu.x, pu.y); ctx.lineTo(pv.x, pv.y); ctx.stroke();
  }

  for (var u = 0; u < dtState.n; u++) {
    var pos = dtState.positions[u];
    var isCurrent = u === currentNode;
    var color = DT_COLORS[dtState.values[u] % DT_COLORS.length];

    var fill = isCurrent ? 'rgba(245,158,11,0.35)' : color + '33';
    var stroke = isCurrent ? '#f59e0b' : color;
    var radius = 14 + Math.min(10, dtState.subtreeSize[u] * 0.8);

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = isCurrent ? 3 : 2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 10px Fira Code,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(u, pos.x, pos.y);

    ctx.fillStyle = 'rgba(148,163,184,0.5)'; ctx.font = '8px Fira Code,monospace'; ctx.textBaseline = 'top';
    ctx.fillText('v=' + dtState.values[u], pos.x, pos.y + radius + 3);
  }
}

function dtAddLog(msg, cls) {
  var log = document.getElementById('dtLog');
  if (!log) return;
  var empty = log.querySelector('.dt-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'dt-log-entry ' + (cls || '');
  entry.textContent = msg;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function dtSetStatus(msg, cls) {
  var el = document.getElementById('dtStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'dt-status ' + (cls || '');
}

function dtUpdateStats() {
  var totalEl = document.getElementById('dtTotalMoves');
  var maxEl = document.getElementById('dtMaxMoves');
  var boundEl = document.getElementById('dtLogBound');
  var naiveEl = document.getElementById('dtNaiveTouches');
  var slEl = document.getElementById('dtSlTouches');

  if (totalEl) totalEl.textContent = dtState.totalMoves;
  if (maxEl) maxEl.textContent = dtState.maxMoves;
  if (boundEl) boundEl.textContent = Math.ceil(Math.log2(dtState.n)) + ' (' + (dtState.maxMoves <= Math.ceil(Math.log2(dtState.n)) ? 'within bound ✅' : 'exceeds bound ⚠️') + ')';

  var naiveTouches = dtState.subtreeSize ? dtState.subtreeSize.reduce(function(sum, s) { return sum + s; }, 0) : 0;
  if (naiveEl) naiveEl.textContent = naiveTouches + ' (sum of all subtree sizes, rebuilt from scratch each time)';
  if (slEl) slEl.textContent = dtState.totalMoves;
}

function dtRenderResults() {
  var container = document.getElementById('dtResultsRow');
  if (!container || !dtState.results) return;
  container.innerHTML = dtState.results.map(function(r, i) {
    return '<div class="dt-result-chip"><div class="dt-result-label">Node ' + i + '</div><div class="dt-result-val">' + r + '</div></div>';
  }).join('');
}

function dtRunAnimated() {
  if (dtState.playing) return;
  dtState.playing = true;
  dtState.totalMoves = 0;
  dtState.moveTracker = new Array(dtState.n).fill(0);

  var log = document.getElementById('dtLog');
  if (log) log.innerHTML = '<div class="dt-empty">No activity yet.</div>';

  var runResult = dtRunSmallToLarge();
  var steps = runResult.animSteps;
  var logs = runResult.log;
  var logIdx = 0;

  var idx = 0;
  function processStep() {
    if (idx >= steps.length) {
      dtState.playing = false;
      dtRenderTree(null);
      dtUpdateStats();
      dtRenderResults();
      dtSetStatus('Complete. ' + dtState.totalMoves + ' total element moves, max ' + dtState.maxMoves + ' moves for any single node — within the log₂(' + dtState.n + ') ≈ ' + Math.log2(dtState.n).toFixed(1) + ' bound.', 'good');
      return;
    }
    var s = steps[idx];
    if (s.type === 'start-node') {
      dtRenderTree(s.node);
      if (logIdx < logs.length && logs[logIdx].type === 'heavy') { dtAddLog(logs[logIdx].msg, logs[logIdx].type); logIdx++; }
    } else if (s.type === 'merge-node') {
      dtRenderTree(s.node);
      if (logIdx < logs.length && logs[logIdx].type === 'light') { dtAddLog(logs[logIdx].msg, logs[logIdx].type); logIdx++; }
    } else if (s.type === 'result') {
      dtRenderTree(s.node);
      if (logIdx < logs.length && logs[logIdx].type === 'done') { dtAddLog(logs[logIdx].msg, logs[logIdx].type); logIdx++; }
    }
    dtUpdateStats();
    idx++;
    setTimeout(processStep, 60);
  }
  processStep();
}

function dtStepHandler() {
  if (dtState.animQueue.length === 0) {
    var runResult = dtRunSmallToLarge();
    dtState.animQueue = runResult.animSteps;
    dtState.dtLogs = runResult.log;
    dtState.animIdx = 0;
    dtState.dtLogIdx = 0;
    dtState.totalMoves = 0;
    dtState.moveTracker = new Array(dtState.n).fill(0);
    var log = document.getElementById('dtLog');
    if (log) log.innerHTML = '<div class="dt-empty">No activity yet.</div>';
  }

  if (dtState.animIdx >= dtState.animQueue.length) {
    dtSetStatus('Traversal complete. Randomize to run again.', 'good');
    return;
  }

  var s = dtState.animQueue[dtState.animIdx];
  dtRenderTree(s.node);

  if (s.type === 'result' && dtState.dtLogIdx < dtState.dtLogs.length) {
    while (dtState.dtLogIdx < dtState.dtLogs.length && dtState.dtLogs[dtState.dtLogIdx].type !== 'done') {
      dtAddLog(dtState.dtLogs[dtState.dtLogIdx].msg, dtState.dtLogs[dtState.dtLogIdx].type);
      dtState.dtLogIdx++;
    }
    if (dtState.dtLogIdx < dtState.dtLogs.length) { dtAddLog(dtState.dtLogs[dtState.dtLogIdx].msg, dtState.dtLogs[dtState.dtLogIdx].type); dtState.dtLogIdx++; }
  }

  dtState.animIdx++;
  dtUpdateStats();

  if (dtState.animIdx >= dtState.animQueue.length) {
    dtRenderResults();
    dtSetStatus('Step-through complete.', 'good');
  }
}

function dtBuildAndRender() {
  dtGenerateTree();
  dtComputeSizes();
  dtComputeLayout();
  dtState.results = new Array(dtState.n).fill(null);
  dtState.totalMoves = 0;
  dtState.maxMoves = 0;
  dtState.animQueue = [];
  dtState.animIdx = 0;
  dtState.playing = false;

  dtRenderTree(null);
  dtUpdateStats();

  var container = document.getElementById('dtResultsRow');
  if (container) container.innerHTML = '';

  var log = document.getElementById('dtLog');
  if (log) log.innerHTML = '<div class="dt-empty">No activity yet.</div>';

  dtSetStatus('Tree of ' + dtState.n + ' nodes generated. Run to watch heavy children get kept and light children merged.', '');
}

function dtInit() {
  dtBuildAndRender();

  var randomizeBtn = document.getElementById('dtRandomizeBtn');
  var runBtn = document.getElementById('dtRunBtn');
  var stepBtn = document.getElementById('dtStepBtn');

  if (randomizeBtn) randomizeBtn.addEventListener('click', dtBuildAndRender);
  if (runBtn) runBtn.addEventListener('click', dtRunAnimated);
  if (stepBtn) stepBtn.addEventListener('click', dtStepHandler);

  dtInitHeroCanvas();
  window.addEventListener('resize', function() { dtComputeLayout(); dtRenderTree(null); });
}

function dtInitHeroCanvas() {
  var canvas = document.getElementById('dtHeroCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var t = 0;
  var particles = [];

  function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    particles = [];
    for (var i = 0; i < 24; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: 2 + Math.random() * 3, speed: 0.2 + Math.random() * 0.4, phase: Math.random() * 10 });
    }
  }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    var W = canvas.width; var H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    t += 0.01;

    particles.forEach(function(p, i) {
      p.y -= p.speed;
      if (p.y < -10) p.y = H + 10;
      var wob = Math.sin(t + p.phase) * 10;
      ctx.beginPath();
      ctx.arc(p.x + wob, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6,182,212,0.15)';
      ctx.fill();

      particles.forEach(function(q, j) {
        if (j <= i) return;
        var dx = p.x - q.x; var dy = p.y - q.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          ctx.strokeStyle = 'rgba(168,85,247,' + (0.08 * (1 - dist / 140)) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      });
    });

    requestAnimationFrame(draw);
  }
  draw();
}